"""
eval_official_test_split.py
在 PLAID 官方 test split（200 组，与训练 1,000 组分布不同）上评估生产 ONNX 代理模型。

背景（评审质疑）：仓库此前只在 1,000 组内随机 90/10 留出测试集上报告 R²，
与官方 test split 不可比。本脚本补上「官方基准对照」：
    - 特征提取与训练 74 维特征 CSV 完全同口径（8 统计量 × 9 场量 + Omega/P）
    - 使用部署中的 scaler_X_v2 + surrogate_model.onnx
    - 报告 R² / MAE，与留出集数字并列输出

用法（需本机下载数据，约 1–2 GB，首次）：
    pip install datasets scipy            # 若未装
    python backend/scripts/eval_official_test_split.py --smoke    # 先自检特征口径（用 all_samples 前几个样本对比现有 CSV）
    python backend/scripts/eval_official_test_split.py            # 跑官方 test split

输出：backend/data/processed/official_test_eval.csv + 控制台报告
依赖：scikit-learn==1.7.2、onnxruntime==1.18.0（与 README 全锁版一致）
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
from sklearn.metrics import r2_score, mean_absolute_error

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
            # 与坐标同长的数组优先（修复 CellData/PointData 字母序坑）
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
        return ds[i]["sample"] if isinstance(ds[i], dict) else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--smoke", action="store_true",
                    help="自检：取 all_samples 前 5 个样本，特征提取与现有 CSV 逐位对比")
    ap.add_argument("--split", type=str, default="test",
                    help="HF split 名（默认 test，PLAID 官方 200 组）")
    ap.add_argument("--n", type=int, default=None, help="只处理前 n 个样本（调试用）")
    args = ap.parse_args()

    os.environ["HF_DATASETS_CACHE"] = str(CACHE)
    from datasets import load_dataset

    df = pd.read_csv(DATA / "plaid_rotor37_features.csv")
    train_inc = [c for c in df.columns
                 if c not in ['sample_id'] + OUT_KEYS]
    assert train_inc == ['Omega', 'P'] + [
        f"{f}_{s}" for f in FIELD_NAMES for s in STAT_NAMES], \
        "列名顺序与训练 CSV 不一致——请检查 FIELD_NAMES/STAT_NAMES"

    if args.smoke:
        ds = load_dataset("PLAID-datasets/Rotor37", split="all_samples",
                          cache_dir=str(CACHE))
        sids, feats = [], []
        for i in range(min(8, len(ds))):
            sample = load_sample(i, ds)
            if sample is None:
                print(f"  [{i}] 无法加载 sample，跳过"); continue
            sc = sample.get("scalars", {})
            sc_str = {str(k): v for k, v in sc.items()}
            f74 = extract_74d(sample)
            if f74 is None:
                print(f"  [{i}] 特征提取失败，跳过"); continue
            sids.append(int(sc_str.get("sample_id", i)))
            feats.append([float(sc_str["Omega"]), float(sc_str["P"])] + f74)
        if not feats:
            print("❌ 自检失败：没有样本提取成功（检查数据格式）"); sys.exit(1)
        got = pd.DataFrame(feats, columns=train_inc)
        for k, sid in enumerate(sids):
            if sid in set(df["sample_id"]):
                row_ref = df.loc[df["sample_id"] == sid, train_inc].iloc[0].values.astype(float)
                row_got = got.iloc[k].values.astype(float)
                d = np.abs(row_got - row_ref).max()
                print(f"  sample_id={sid}: 特征最大偏差 = {d:.3e} {'✅' if d < 1e-6 else '❌ 口径不一致'}")
        print("自检完成（与现有 CSV 一致 = 特征口径与训练完全相同）")
        return

    # ── 正式评估：官方 test split ─────────────────────────
    ds = load_dataset("PLAID-datasets/Rotor37", split=args.split,
                      cache_dir=str(CACHE))
    print(f"加载 split={args.split}：{len(ds)} 个样本")

    scaler_X = joblib.load(MODELS / "scaler_X_v2.pkl")
    scaler_y = joblib.load(MODELS / "scaler_y_v2.pkl")
    sess = ort.InferenceSession(str(MODELS / "surrogate_model.onnx"),
                                providers=['CPUExecutionProvider'])
    iname = sess.get_inputs()[0].name

    rows, feats, y_true = [], [], []
    n_skip = 0
    n_use = len(ds) if args.n is None else min(args.n, len(ds))
    for i in range(n_use):
        sample = load_sample(i, ds)
        if sample is None:
            n_skip += 1; continue
        sc = sample.get("scalars", {})
        sc_str = {str(k): v for k, v in sc.items()}
        f74 = extract_74d(sample)
        if f74 is None:
            n_skip += 1; continue
        try:
            omega, P = float(sc_str["Omega"]), float(sc_str["P"])
            y = [float(sc_str[k]) for k in OUT_KEYS]
        except KeyError:
            n_skip += 1; continue
        feats.append([omega, P] + f74)
        y_true.append(y)
        rows.append({"sample_id": int(sc_str.get("sample_id", i))})
        if (i + 1) % 50 == 0:
            print(f"  进度 {i+1}/{n_use}（跳过 {n_skip}）")

    if not feats:
        print("❌ 无样本可用"); sys.exit(1)
    X = np.asarray(feats, dtype=np.float32)
    Y = np.asarray(y_true, dtype=np.float32)
    X_sc = scaler_X.transform(X).astype(np.float32)
    pred = scaler_y.inverse_transform(
        sess.run(None, {iname: X_sc})[0])

    print("\n===== 官方 test split 评估（生产 ONNX 模型）=====")
    print(f"样本数：{len(X)}（跳过 {n_skip}）\n")
    print(f"| 输出 | R²（官方test） | R²（仓库留出集） | MAE |")
    print(f"|---|---|---|---|")
    for i, k in enumerate(OUT_KEYS):
        r2_off = r2_score(Y[:, i], pred[:, i])
        mae = mean_absolute_error(Y[:, i], pred[:, i])
        print(f"| {SYMBOLS[k]} {k} | {r2_off:.4f} | 见下 | {mae:.5f} |")
    print("\n仓库留出集对照（README 口径）：π 0.9844 / η 0.9561 / ṁ 0.9827（n=100, seed42）")

    out = pd.DataFrame(rows)
    for i, k in enumerate(OUT_KEYS):
        out[f"{k}_true"] = Y[:, i]
        out[f"{k}_pred"] = pred[:, i]
    out.to_csv(DATA / "official_test_eval.csv", index=False)
    print(f"\n✅ 已保存：{DATA / 'official_test_eval.csv'}")
    print("下一步：把 R² 贴进 README（多目标/数据节）与答辩材料。")


if __name__ == "__main__":
    main()
