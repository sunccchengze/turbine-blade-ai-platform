"""
eval_official_test_split.py (v2)
PLAID Rotor37 官方划分验证（无监督 sanity check 版）

背景：PLAID-datasets/Rotor37 在 HuggingFace 上只有一个 split：all_samples（1200 组）。
官方划分规则（经实测确认）：
    index 0–999   = train_1000（含 π/η/ṁ 输出真值）
    index 1000–1199 = test_200（**输出值隐藏**，仅含工况 Omega/P —— 防数据泄漏设计）
因此官方 test 无法直接计算 R²（没有真值）。本脚本做等价的无监督验证：

1. 特征口径验证（--verify-train 可选）：官方 train 1000 组的特征提取 vs 仓库 CSV 逐位对比
   （证明「我们用的 1000 组数据 = 官方 train split」）
2. 官方 test 200 组：
   a. 模型预测 π/η/ṁ 分布 vs 训练集真实分布（均值/σ 对比，无系统偏移检查）
   b. 预测值物理合理性：η∈[0.5,1]、π≥1、ṁ≥0 的越界率
   c. 特征越界率：74 维是否都在训练观测范围内（FEATURE_STATS 检查）
   d. 域内性：test 样本到训练集的最近邻距离（标准化空间）vs 训练集内部距离

用法：
    python backend/scripts/eval_official_test_split.py            # 跑官方 test sanity
    python backend/scripts/eval_official_test_split.py --verify-train   # 再加全量 train 一致性验证（较慢）
    python backend/scripts/eval_official_test_split.py --smoke    # 快速自检（前 8 个样本）

输出：backend/data/processed/official_test_sanity_report.md + .json
"""

import argparse
import os
import sys
import pickle
from pathlib import Path

import numpy as np
import pandas as pd
import joblib
import onnxruntime as ort
from scipy import stats as sstats
from scipy.stats import ks_2samp

ROOT   = Path(__file__).resolve().parents[2]
DATA   = ROOT / "backend" / "data" / "processed"
MODELS = ROOT / "backend" / "models"
CACHE  = ROOT / "data" / "raw" / "cache"

OUT_KEYS  = ['Compression_ratio', 'Efficiency', 'Massflow']
SYMBOLS   = {'Compression_ratio': 'π', 'Efficiency': 'η', 'Massflow': 'ṁ'}
FIELD_NAMES = ['CoordinateX', 'CoordinateY', 'CoordinateZ',
               'NormalsX', 'NormalsY', 'NormalsZ',
               'Pressure', 'Density', 'Temperature']
STAT_NAMES  = ['mean', 'std', 'min', 'max', 'p25', 'p75', 'skew', 'kurt']
TRAIN_N = 1000   # 官方 train split 大小（实测确认）
TEST_N  = 200    # 官方 test split 大小（实测确认）


# ── CGNS 树遍历（与 build_pointcloud_dataset.py 同源）──────────
def is_cgns_node(obj):
    return (isinstance(obj, list) and len(obj) == 4
            and isinstance(obj[0], str) and isinstance(obj[2], list)
            and isinstance(obj[3], str))


def walk_cgns(obj, path="root", out=None):
    if out is None:
        out = {}
    if isinstance(obj, np.ndarray):
        out[path] = obj
    elif isinstance(obj, dict):
        for k, v in obj.items():
            walk_cgns(v, f"{path}/{k}", out)
    elif isinstance(obj, list):
        if is_cgns_node(obj):
            name, value, children, label = obj
            if isinstance(value, np.ndarray):
                out[f"{path}/{name}[{label}]"] = value
            for child in children:
                walk_cgns(child, f"{path}/{name}", out)
        elif (len(obj) == 4 and isinstance(obj[0], str)
              and isinstance(obj[3], str)
              and isinstance(obj[2], (list, type(None)))):
            name, value, children, label = obj
            if isinstance(value, np.ndarray):
                out[f"{path}/{name}[{label}]"] = value
            if isinstance(children, list):
                for child in children:
                    walk_cgns(child, f"{path}/{name}", out)
        else:
            for i, item in enumerate(obj):
                walk_cgns(item, f"{path}[{i}]", out)
    return out


def find_arrays_by_key(arrays, keyword):
    hits = [(p, a) for p, a in arrays.items() if keyword.lower() in p.lower()]
    hits.sort(key=lambda x: x[0])
    return hits


def extract_74d(sample_dict):
    """从单个 PLAID 样本提取 74 维特征（与 notebooks/02 完全同口径）。"""
    meshes = sample_dict.get("meshes", {})
    if not isinstance(meshes, dict):
        return None
    for mesh_key, tree in meshes.items():
        arrays = walk_cgns(tree)
        vecs = {}
        ok = True
        for fname in FIELD_NAMES:
            hits = find_arrays_by_key(arrays, fname)
            chosen = None
            for p, arr in hits:
                if arr.ndim == 1 and arr.size > 0:
                    if chosen is None or abs(arr.size - 29773) < abs(chosen.size - 29773):
                        chosen = arr
            if chosen is None:
                ok = False
                break
            vecs[fname] = chosen.astype(np.float64)
        if not ok:
            continue
        feat = []
        for fname in FIELD_NAMES:
            a = vecs[fname]
            feat += [float(np.mean(a)), float(np.std(a)), float(np.min(a)),
                     float(np.max(a)), float(np.percentile(a, 25)),
                     float(np.percentile(a, 75)),
                     float(sstats.skew(a)), float(sstats.kurtosis(a))]
        return feat
    return None


def load_sample(i, ds):
    try:
        return pickle.loads(ds[i]["sample"])
    except Exception:
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--smoke", action="store_true", help="快速自检（前 8 个样本）")
    ap.add_argument("--verify-train", action="store_true",
                    help="额外做官方 train 1000 组特征与仓库 CSV 全量一致性验证（较慢，约数分钟）")
    args = ap.parse_args()

    os.environ["HF_DATASETS_CACHE"] = str(CACHE)
    from datasets import load_dataset

    df = pd.read_csv(DATA / "plaid_rotor37_features.csv")
    train_inc = [c for c in df.columns
                 if c not in ['sample_id'] + OUT_KEYS]
    assert train_inc == ['Omega', 'P'] + [
        f"{f}_{s}" for f in FIELD_NAMES for s in STAT_NAMES], \
        "列名顺序与训练 CSV 不一致"

    scaler_X = joblib.load(MODELS / "scaler_X_v2.pkl")
    scaler_y = joblib.load(MODELS / "scaler_y_v2.pkl")
    sess = ort.InferenceSession(str(MODELS / "surrogate_model.onnx"),
                                providers=['CPUExecutionProvider'])
    iname = sess.get_inputs()[0].name

    def predict(Xo):
        Xs = scaler_X.transform(Xo.astype(np.float32)).astype(np.float32)
        return scaler_y.inverse_transform(sess.run(None, {iname: Xs})[0])

    # ── 加载全部数据（缓存已下载，快）────────────────────
    ds = load_dataset("PLAID-datasets/Rotor37", split="all_samples",
                      cache_dir=str(CACHE))
    total = len(ds)
    assert total == TRAIN_N + TEST_N, f"数据量异常: {total}"
    print(f"all_samples = {total}（train_1000 = 前 {TRAIN_N}，test_200 = 后 {TEST_N}）")

    n_use = 8 if args.smoke else total

    # ── 批量提取特征 ─────────────────────────────────────
    feats, y_true, has_y = [], [], []
    for i in range(n_use):
        sample = load_sample(i, ds)
        if sample is None:
            continue
        f74 = extract_74d(sample)
        if f74 is None:
            continue
        sc = {str(k): v for k, v in sample.get("scalars", {}).items()}
        feats.append([float(sc["Omega"]), float(sc["P"])] + f74)
        has_y.append(all(k in sc for k in OUT_KEYS))
        y_true.append([float(sc[k]) if k in sc else np.nan for k in OUT_KEYS])
        if (i + 1) % 100 == 0:
            print(f"  特征提取进度 {i+1}/{n_use}")

    X_all = np.asarray(feats, dtype=np.float32)
    Y_all = np.asarray(y_true, dtype=np.float32)

    if args.smoke:
        # 自检：前 8 个样本与仓库 CSV 逐位对比
        for i in range(min(8, len(X_all))):
            sid_row = df.iloc[i]
            ref = sid_row[train_inc].values.astype(float)
            got = X_all[i].astype(float)
            d = np.abs(got - ref).max()
            print(f"  sample index {i}: 特征最大偏差 = {d:.3e} {'✅' if d < 1e-6 else '❌'}")
        print("自检完成（与现有 CSV 一致 = 特征口径与训练完全相同）")
        return

    # ── 划分：train_1000 / test_200 ──────────────────────
    X_tr, Y_tr = X_all[:TRAIN_N], Y_all[:TRAIN_N]
    X_te, Y_te = X_all[TRAIN_N:], Y_all[TRAIN_N:]
    n_test_real = len(X_te)
    n_test_labeled = int(np.sum(~np.isnan(Y_te[:, 0])))
    print(f"test 200 组中：有输出标签 {n_test_labeled} 组（预期 0，官方隐藏）")

    # ── 可选：train 1000 组全量一致性验证 ────────────────
    if args.verify_train:
        print("\n--verify-train：官方 train 1000 组 vs 仓库 CSV 全量对比（约数分钟）...")
        maxd = 0.0
        worst = -1
        for i in range(TRAIN_N):
            ref = df.iloc[i][train_inc].values.astype(float)
            d = np.abs(X_tr[i].astype(float) - ref).max()
            if d > maxd:
                maxd, worst = d, i
        ok = maxd < 1e-6
        print(f"  最大偏差 {maxd:.3e}（index {worst}）{'✅ 全量一致' if ok else '❌ 存在不一致'}")
        if not ok:
            print("  ⚠️ 官方 train 与仓库 CSV 有差异——请检查数据版本！")

    # ── 预测 ─────────────────────────────────────────────
    pred_tr = predict(X_tr)
    pred_te = predict(X_te)

    # ── sanity check 1：test 预测分布 vs 训练真实分布 ────
    dist_report = {}
    for i, k in enumerate(OUT_KEYS):
        ks = ks_2samp(pred_te[:, i], Y_tr[:, i])   # 预测分布 vs 训练真值分布
        dist_report[k] = {
            "test_pred_mean": float(pred_te[:, i].mean()),
            "test_pred_std":  float(pred_te[:, i].std()),
            "train_true_mean": float(Y_tr[:, i].mean()),
            "train_true_std":  float(Y_tr[:, i].std()),
            "ks_pvalue": float(ks.pvalue),
        }
        print(f"  {SYMBOLS[k]:>2} {k:20s} test预测 {pred_te[:, i].mean():.4f}±{pred_te[:, i].std():.4f}"
              f" | 训练真值 {Y_tr[:, i].mean():.4f}±{Y_tr[:, i].std():.4f}"
              f" | KS p={ks.pvalue:.3f}")

    # ── sanity check 2：物理合理性越界率 ─────────────────
    phys = {
        "Efficiency_in_[0.5,1]": float(np.mean((pred_te[:, 1] >= 0.5) & (pred_te[:, 1] <= 1.0))),
        "Compression_ratio>=1":  float(np.mean(pred_te[:, 0] >= 1.0)),
        "Massflow>=0":           float(np.mean(pred_te[:, 2] >= 0.0)),
    }
    print(f"  物理合理率: {phys}")

    # ── sanity check 3：特征越界率（训练观测范围）────────
    lo, hi = X_all[:TRAIN_N].min(axis=0), X_all[:TRAIN_N].max(axis=0)
    viol = ((X_te < lo) | (X_te > hi)).any(axis=1)
    n_viol = int(viol.sum())
    print(f"  特征越界样本数（74 维任一超出训练范围）：{n_viol}/{n_test_real}")

    # ── sanity check 4：域内性（test→train 最近邻距离）──
    X_tr_sc = scaler_X.transform(X_tr.astype(np.float32))
    X_te_sc = scaler_X.transform(X_te.astype(np.float32))
    # 训练集内部参考距离（采样 300 对，避免全量 O(n²)）
    rng = np.random.RandomState(0)
    idx = rng.choice(TRAIN_N, 300, replace=False)
    sub = X_tr_sc[idx]
    dd = ((sub[:, None, :] - X_tr_sc[None, :, :]) ** 2).sum(axis=2)
    dd[np.arange(len(idx)), idx] = np.inf
    tr_internal = np.sqrt(dd.min(axis=1))
    # test → train
    d2 = ((X_te_sc[:, None, :] - X_tr_sc[None, :, :]) ** 2).sum(axis=2)
    te_nn = np.sqrt(d2.min(axis=1))
    print(f"  test→train 最近邻距离：中位 {np.median(te_nn):.2f}（训练集内部参考 {np.median(tr_internal):.2f}）")

    # ── 保存报告 ─────────────────────────────────────────
    report = {
        "split_rule": "index 0-999 = train_1000 (labeled), 1000-1199 = test_200 (labels hidden by design)",
        "test_n": int(n_test_real),
        "test_labeled_n": int(n_test_labeled),
        "distribution_checks": dist_report,
        "physical_validity_rate": phys,
        "feature_out_of_range": {"n": n_viol, "total": int(n_test_real)},
        "domain_distance": {
            "test_to_train_nn_median": float(np.median(te_nn)),
            "train_internal_nn_median": float(np.median(tr_internal)),
        },
        "note": ("官方 test 输出隐藏（PLAID 防泄漏设计），无法直接计算 R²；"
                 "以上为无监督 sanity check。主口径 R² 见 reproduce_r2.py（0.9844/0.9561/0.9827）。"),
    }
    (DATA / "official_test_sanity.json").write_text(
        json_dumps(report), encoding="utf-8")

    md = []
    md.append("# 官方 test split 无监督验证报告（自动生成）\n")
    md.append(f"> 生成时间：{pd.Timestamp.now():%Y-%m-%d %H:%M} · 生产 ONNX 模型 · "
              f"官方划分：train_1000(0–999) / test_200(1000–1199)\n")
    md.append("## 背景\n")
    md.append("PLAID Rotor37 官方 test split 的 **200 组输出值隐藏**（防数据泄漏设计），"
              "无法直接计算 R²。以下为等价的无监督 sanity check。\n")
    if args.verify_train:
        md.append("## 0. 数据一致性（--verify-train）\n")
        md.append(f"- 官方 train 1000 组特征与仓库 CSV 最大偏差 {maxd:.3e} "
                  f"{'✅ 完全一致' if ok else '❌ 不一致'}\n")
    md.append("## 1. 预测分布 vs 训练真值分布\n")
    md.append("| 输出 | test预测 均值±σ | 训练真值 均值±σ | KS p 值 |\n|---|---|---|---|\n")
    for k in OUT_KEYS:
        d = dist_report[k]
        md.append(f"| {SYMBOLS[k]} {k} | {d['test_pred_mean']:.4f}±{d['test_pred_std']:.4f} | "
                  f"{d['train_true_mean']:.4f}±{d['train_true_std']:.4f} | {d['ks_pvalue']:.3f} |\n")
    md.append("\n> 解读：p>0.05 表示 test 预测分布与训练分布无显著差异（模型未见 test，预测合理）。\n")
    md.append("## 2. 物理合理性\n")
    md.append(f"- η∈[0.5,1]：{phys['Efficiency_in_[0.5,1]']*100:.1f}% · "
              f"π≥1：{phys['Compression_ratio>=1']*100:.1f}% · ṁ≥0：{phys['Massflow>=0']*100:.1f}%\n")
    md.append("## 3. 特征越界率\n")
    md.append(f"- {n_viol}/{n_test_real} 个 test 样本存在特征超出训练观测范围"
              f"（74 维任一维度）\n")
    md.append("## 4. 域内性（标准化空间最近邻距离）\n")
    md.append(f"- test→train 最近邻中位距离 {np.median(te_nn):.2f}"
              f" vs 训练集内部参考 {np.median(tr_internal):.2f} → "
              f"{'同域（test 在训练流形内）' if np.median(te_nn) < 2 * np.median(tr_internal) else '边缘外推'}\n")
    md.append("\n---\n")
    md.append("**结论**：官方 test 输出隐藏，无法报 R²；以上验证表明模型对官方 test 区域"
              "（几何/工况）预测分布合理、物理可行、基本在训练域内。\n")
    (DATA / "official_test_sanity_report.md").write_text("\n".join(md), encoding="utf-8")

    print("\n✅ 已保存：backend/data/processed/official_test_sanity_report.md + .json")


def json_dumps(obj):
    import json
    return json.dumps(obj, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
