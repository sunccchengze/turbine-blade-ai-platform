"""
pareto_evidence.py
Pareto 前沿证据链分析（回应评审质疑：代理模型自证循环 / 特征空间解的可实现性）

回答三个问题：
1. Pareto 解的 74 维特征是否全部落在训练数据观测范围内（可实现性底线）？
   注意：NSGA-II 的边界取自训练子集（800 组），这里用全量 1,000 组复核。
2. Pareto 解与训练样本有多远？（标准化空间最近邻距离分布）
3. 关键证据：离 Pareto 前沿越近的「留出测试样本」，代理模型的真实误差如何？
   若误差随接近度单调变小，则「优化找到的区域 = 代理模型最有把握的区域」；
   反之则说明优化器钻了代理模型的空子（外推幻觉）。

输出：
    backend/data/processed/pareto_evidence.json   （结构化结果）
    backend/data/processed/pareto_evidence_report.md（人读报告，可贴进 README/PPT）

用法：python backend/scripts/pareto_evidence.py
依赖：与 README 复现一致（sklearn==1.7.2, onnxruntime==1.18.0, 全锁版 requirements）
"""

import json
import numpy as np
import pandas as pd
import joblib
import onnxruntime as ort

from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score

ROOT   = Path(__file__).resolve().parents[2]
DATA   = ROOT / "backend" / "data" / "processed"
MODELS = ROOT / "backend" / "models"

OUT_KEYS = ['Compression_ratio', 'Efficiency', 'Massflow']
SYMBOLS  = {'Compression_ratio': 'π', 'Efficiency': 'η', 'Massflow': 'ṁ'}


def main():
    # ── 数据与模型（与 README 复现同一口径）────────────────
    df = pd.read_csv(DATA / "plaid_rotor37_features.csv")
    inc = [c for c in df.columns if c not in ['sample_id'] + OUT_KEYS]
    X, y = df[inc].values.astype(np.float32), df[OUT_KEYS].values.astype(np.float32)

    # 与训练完全一致的留出划分（n_test=100, random_state=42）
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.10, random_state=42)

    sx = joblib.load(MODELS / "scaler_X_v2.pkl")
    sy = joblib.load(MODELS / "scaler_y_v2.pkl")
    sess = ort.InferenceSession(str(MODELS / "surrogate_model.onnx"),
                                providers=['CPUExecutionProvider'])
    iname = sess.get_inputs()[0].name

    def predict(Xo):
        return sy.inverse_transform(sess.run(
            None, {iname: sx.transform(Xo.astype(np.float32)).astype(np.float32)})[0])

    pf = pd.read_csv(DATA / "pareto_front_solutions.csv")
    X_pf = pf[inc].values.astype(np.float32)

    # ── 问题 1：特征范围合规性（全量 1,000 组范围复核）──────
    lo = X.min(axis=0)
    hi = X.max(axis=0)
    n_viol = int(((X_pf < lo) | (X_pf > hi)).any(axis=1).sum())
    viol_cols = sorted({
        inc[j] for j in range(len(inc))
        if np.any((X_pf[:, j] < lo[j]) | (X_pf[:, j] > hi[j]))
    })

    # ── 问题 2：Pareto 解与训练集最近邻距离（标准化空间）───
    X_pf_sc = sx.transform(X_pf.astype(np.float32))
    X_tr_sc = sx.transform(X_train.astype(np.float32))
    d2 = ((X_pf_sc[:, None, :] - X_tr_sc[None, :, :]) ** 2).sum(axis=2)
    nn_dist = np.sqrt(d2.min(axis=1))
    # 参考系：训练集内部样本对的最近邻距离分布（同量纲可比）
    # 注意：sub 的第 i 行 = X_tr_sc 的第 idx[i] 行，必须把 (i, idx[i]) 置 inf，否则自己匹配自己
    idx = np.random.RandomState(0).choice(len(X_tr_sc), 300, replace=False)
    sub = X_tr_sc[idx]
    dd = ((sub[:, None, :] - X_tr_sc[None, :, :]) ** 2).sum(axis=2)
    dd[np.arange(len(idx)), idx] = np.inf
    tr_nn = np.sqrt(dd.min(axis=1))

    # ── 问题 2b：Pareto 解的「预测外推量」───────────────
    # 每个 Pareto 解与最近邻训练样本的预测值差距（真实 y 已知）→
    # 量化「超越训练样本」这句话里有多少是模型外推，有多少在训练数据支撑内。
    y_nn = y_train[np.argmin(d2, axis=1)]           # 最近邻的真实性能 (100,3)
    y_pf = pf[OUT_KEYS].values.astype(np.float32)   # Pareto 解的代理预测 (100,3)
    extrap = y_pf - y_nn                            # 正值 = 预测高于最近邻实测

    # ── 问题 3：留出测试样本「距 Pareto 前沿的距离 vs 真实误差」──
    X_te_sc = sx.transform(X_test.astype(np.float32))
    d2_te = ((X_te_sc[:, None, :] - X_pf_sc[None, :, :]) ** 2).sum(axis=2)
    d_par = np.sqrt(d2_te.min(axis=1))          # 每个测试样本到 Pareto 前沿的距离
    pred_te = predict(X_test)
    err = np.abs(pred_te - y_test)               # (100, 3)

    # 按 d_par 四分位分层 → 每层真实 MAE
    qs = np.quantile(d_par, [0, .25, .5, .75, 1.0])
    layers = []
    for k in range(4):
        m = (d_par >= qs[k]) & (d_par <= qs[k + 1])
        layers.append({
            "layer": k + 1,
            "d_range": [round(float(qs[k]), 3), round(float(qs[k + 1]), 3)],
            "n": int(m.sum()),
            "MAE": {OUT_KEYS[i]: round(float(err[m, i].mean()), 5)
                    for i in range(3)},
            "median_MAE_pct": {
                OUT_KEYS[i]: round(float(100 * err[m, i].mean()
                                         / np.abs(y_test[m, i]).mean()), 2)
                for i in range(3)},
        })

    # 相关性：d_par 与逐点误差的 Spearman 秩相关
    from scipy.stats import spearmanr
    corr = {OUT_KEYS[i]: round(float(spearmanr(d_par, err[:, i])[0]), 3)
            for i in range(3)}

    # 全测试集对照
    base_mae = {OUT_KEYS[i]: float(err[:, i].mean()) for i in range(3)}
    base_r2  = {OUT_KEYS[i]: float(r2_score(y_test[:, i], pred_te[:, i]))
                for i in range(3)}

    result = {
        "feature_bounds": {
            "checked_against": "all 1000 samples (full dataset, not just NSGA-II's 800-train box)",
            "n_pareto_violating_full_range": n_viol,
            "violating_features": viol_cols[:10],
            "violating_count_features": len(viol_cols),
        },
        "nn_distance": {
            "pareto_to_train_nn": {
                "min": float(nn_dist.min()), "median": float(np.median(nn_dist)),
                "p75": float(np.quantile(nn_dist, .75)), "max": float(nn_dist.max())},
            "train_internal_nn_reference": {
                "min": float(tr_nn.min()), "median": float(np.median(tr_nn)),
                "p75": float(np.quantile(tr_nn, .75)), "max": float(tr_nn.max())},
        },
        "prediction_extrapolation": {
            "max_eta_gap_vs_nn_truth": float(extrap[:, 1].max()),
            "median_eta_gap_vs_nn_truth": float(np.median(extrap[:, 1])),
            "max_massflow_gap_vs_nn_truth": float(extrap[:, 2].max()),
            "median_massflow_gap_vs_nn_truth": float(np.median(extrap[:, 2])),
            "note": "Pareto 解预测值 − 最近邻训练样本实测值（η/ṁ 列）",
        },
        "holdout_error_vs_pareto_proximity": {
            "layers": layers,
            "spearman_corr_d_vs_error": corr,
            "testset_baseline": {"MAE": base_mae, "R2": base_r2, "n": int(len(X_test))},
        },
    }

    (DATA / "pareto_evidence.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    # ── 人读报告 ────────────────────────────────────────────
    L = result["feature_bounds"]
    N = result["nn_distance"]
    H = result["holdout_error_vs_pareto_proximity"]
    md = []
    md.append("# Pareto 前沿证据链报告（pareto_evidence.py 自动生成）\n")
    md.append(f"> 生成时间：{pd.Timestamp.now():%Y-%m-%d %H:%M} · 与 README 同一模型、同一划分口径\n")
    md.append("## 1. 可实现性底线：74 维特征范围合规性\n")
    if L["n_pareto_violating_full_range"] == 0:
        md.append(f"✅ 全部 {len(X_pf)} 个 Pareto 解的所有 74 维特征均落在**全量 1,000 组**训练数据的观测范围内"
                  f"（NSGA-II 边界取自 800 组训练子集，此处以更严格的全量范围复核）。\n")
    else:
        md.append(f"⚠️ {L['n_pareto_violating_full_range']} 个 Pareto 解存在超出全量范围的维度："
                  f"{L['violating_features']}\n")
    md.append("## 2. 距离证据：Pareto 解离训练数据有多远（标准化空间最近邻）\n")
    md.append("| 指标 | Pareto→训练集最近邻距离 | 训练集内部样本最近邻（参考系） |\n|---|---|---|\n")
    md.append(f"| 中位数 | {N['pareto_to_train_nn']['median']:.3f} | {N['train_internal_nn_reference']['median']:.3f} |\n")
    md.append(f"| p75 | {N['pareto_to_train_nn']['p75']:.3f} | {N['train_internal_nn_reference']['p75']:.3f} |\n")
    md.append(f"| 最大值 | {N['pareto_to_train_nn']['max']:.3f} | {N['train_internal_nn_reference']['max']:.3f} |\n")
    md.append("\n> 解读：若 Pareto 距离 ≈ 训练集内部距离 → 解在数据流形内；"
              "若显著更大 → 解在流形边缘/之外，预测需 RANS 终审。\n")
    md.append("## 2b. 预测外推量：Pareto 解 vs 最近邻训练样本实测\n")
    E = result["prediction_extrapolation"]
    md.append(f"- η：预测超出最近邻实测中位 **{E['median_eta_gap_vs_nn_truth']:.4f}**，最大 **{E['max_eta_gap_vs_nn_truth']:.4f}**"
              f"（代理测试集 MAE η≈0.0016，即超出量为 MAE 的 "
              f"**{E['median_eta_gap_vs_nn_truth']/0.0016449642134830356:.0f}×**）\n")
    md.append(f"- ṁ：中位超出 **{E['median_massflow_gap_vs_nn_truth']:.3f}** kg/s，最大 **{E['max_massflow_gap_vs_nn_truth']:.3f}**\n")
    md.append("\n> 解读：「超越训练样本」的宣称中，收益主要来自数据流形边缘的模型外推——"
              "这正是必须用 RANS 抽查终审的原因（P4）。\n")
    md.append("## 3. 核心证据：距 Pareto 前沿越近的留出测试样本，真实误差\n")
    md.append("| 分层 | d 范围 | n | MAE π | MAE η | MAE ṁ | 中位相对误差 % (η) |\n|---|---|---|---|---|---|---|\n")
    for lay in H["layers"]:
        md.append(f"| L{lay['layer']} | {lay['d_range'][0]}–{lay['d_range'][1]} | {lay['n']} | "
                  f"{lay['MAE']['Compression_ratio']} | {lay['MAE']['Efficiency']} | "
                  f"{lay['MAE']['Massflow']} | {lay['median_MAE_pct']['Efficiency']} |\n")
    md.append(f"\nSpearman 秩相关（距离↑ → 误差↑ 为正）：{H['spearman_corr_d_vs_error']}\n")
    md.append(f"\n留出测试集基线：MAE={H['testset_baseline']['MAE']} · "
              f"R²={H['testset_baseline']['R2']}（n={H['testset_baseline']['n']}）\n")
    md.append("\n> 解读：若 L1（最近）层误差显著小于 L4（最远）层，则「Pareto 区域 = 代理模型最有把握的区域」"
              "得到留出数据支撑；若相反，说明优化器钻了代理模型空子，结论需降级。\n")
    (DATA / "pareto_evidence_report.md").write_text("\n".join(md), encoding="utf-8")

    print("\n".join(md))
    print("\n✅ 已保存：backend/data/processed/pareto_evidence.json + pareto_evidence_report.md")


if __name__ == "__main__":
    main()
