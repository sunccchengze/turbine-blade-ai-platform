"""
build_pointcloud_dataset.py
P1 场级代理的数据管线：PLAID Rotor37 原始 pickle → 表面点云数据集

用法（需能访问 Hugging Face，推荐在云 GPU / 本机跑）：
    python backend/scripts/build_pointcloud_dataset.py --n_points 2048
    python backend/scripts/build_pointcloud_dataset.py --smoke   # 合成数据冒烟测试

输出：data/processed/pointcloud/rotor37_pc.npz
    - sample_id   (S,)                与 plaid_rotor37_features.csv 的 sample_id 对齐
    - X_pc        (S, N, C)           表面点云特征（坐标 + 法向 + 场量，C 视可得字段而定）
    - conds       (S, 2)              [Omega, P] 工况条件
    - y           (S, 3)              [Compression_ratio, Efficiency, Massflow]

说明：
- 数据集文件较大（S×2048×C floats），不进 git；生成后可复现。
- 归一化：每样本去质心 + 全局尺度归一（几何对齐），增广在训练时在线做。
- 与现有 74 维特征 CSV 共用 sample_id 对齐，便于新旧模型同口径对比。

引用依据：upgrade-blueprint-D38.md §P1（PointNet/FNO 直接消费表面点云）。
"""

import argparse
import os
import pickle
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
DATA_PC_DIR = ROOT / "data" / "processed" / "pointcloud"
FEATURES_CSV = ROOT / "data" / "processed" / "plaid_rotor37_features.csv"
CACHE_DIR = ROOT / "data" / "raw" / "cache"

# ── 提取关键词（在 CGNS 树里按名匹配）─────────────────────
COORD_KEYS = ["CoordinateX", "CoordinateY", "CoordinateZ"]
FIELD_KEYS = {
    "Pressure":      "Pressure",
    "Density":       "Density",
    "Temperature":   "Temperature",
    "NormalX":       "NormalX",
    "NormalY":       "NormalY",
    "NormalZ":       "NormalZ",
}


def is_cgns_node(obj):
    return (
        isinstance(obj, list)
        and len(obj) == 4
        and isinstance(obj[0], str)
        and isinstance(obj[2], list)
        and isinstance(obj[3], str)
    )


def walk_cgns(obj, path="root", out=None):
    """遍历 CGNS 树，收集 {路径: ndarray}。保留节点名（含叶子节点）。"""
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
            # 叶子 CGNS 节点：[name, value, None, label]
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
    """按关键词（大小写不敏感）匹配数组名。"""
    hits = [(p, a) for p, a in arrays.items() if keyword.lower() in p.lower()]
    hits.sort(key=lambda x: x[0])
    return hits


def extract_points_from_sample(sample_dict, n_points):
    """
    从单个样本的 meshes CGNS 树提取表面点云。
    返回 (X_pc, ok)：
        X_pc: (N, C) 数组，C = 3 坐标 + 可得场量
        ok:   False 表示缺坐标等关键字段
    """
    meshes = sample_dict.get("meshes", {})
    if not isinstance(meshes, dict):
        return None, False

    # 优先取第一个有 CoordinateX 的 mesh
    for mesh_key, tree in meshes.items():
        arrays = walk_cgns(tree)
        coord_hits = [find_arrays_by_key(arrays, k) for k in COORD_KEYS]
        if any(len(h) == 0 for h in coord_hits):
            continue

        # 三个坐标数组需同长
        lens = [a.shape[0] for _, a in coord_hits[0] if a.ndim == 1]
        # 保守：用第一个匹配到的每轴数组
        def _first_vec(axis):
            for p, a in coord_hits[axis]:
                if a.ndim == 1 and a.size > 0:
                    return a
            return None

        cx, cy, cz = (_first_vec(i) for i in range(3))
        if cx is None or cy is None or cz is None:
            continue
        n = len(cx)
        if n < 100:
            continue

        cols = [cx.reshape(-1, 1), cy.reshape(-1, 1), cz.reshape(-1, 1)]
        for field, keyword in FIELD_KEYS.items():
            hits = find_arrays_by_key(arrays, keyword)
            if hits:
                arr = hits[0][1]
                if arr.ndim == 1 and len(arr) == n:
                    cols.append(arr.reshape(-1, 1))
                elif arr.ndim == 2 and arr.shape[0] == n and arr.shape[1] >= 1:
                    cols.append(arr.reshape(-1, arr.shape[1]))

        X = np.hstack(cols).astype(np.float32)  # (N, C)
        # ── 下采样：最远点采样 FPS（保留形状覆盖）────────
        if n > n_points:
            idx = farthest_point_sample(X[:, :3], n_points)
            X = X[idx]
        return X, True
    return None, False


def farthest_point_sample(coords, k):
    """最远点采样：返回 k 个索引（贪心，O(N·k)）。"""
    n = len(coords)
    if k >= n:
        return np.arange(n)
    idx = np.zeros(k, dtype=np.int64)
    dist = np.full(n, np.inf, dtype=np.float32)
    idx[0] = np.random.randint(n)
    for i in range(1, k):
        d = np.linalg.norm(coords - coords[idx[i - 1]], axis=1)
        dist = np.minimum(dist, d)
        idx[i] = int(np.argmax(dist))
    return idx


def normalize_pc(X_pc):
    """几何对齐：去质心 + 全局缩放。返回 (X_norm, offset, scale)。"""
    coords = X_pc[:, :3]
    offset = coords.mean(axis=0, keepdims=True)
    scale = np.abs(coords - offset).max()
    X_norm = X_pc.copy()
    X_norm[:, :3] = (coords - offset) / max(scale, 1e-8)
    return X_norm, offset.squeeze(0), float(scale)


def load_alignment_ids():
    """以现有 74 维特征 CSV 的 sample_id 顺序为准。"""
    import pandas as pd
    df = pd.read_csv(FEATURES_CSV)
    return df["sample_id"].tolist()


def build(args):
    os.makedirs(DATA_PC_DIR, exist_ok=True)
    os.makedirs(CACHE_DIR, exist_ok=True)
    os.environ["HF_DATASETS_CACHE"] = str(CACHE_DIR)

    if args.smoke:
        return build_smoke(args)

    from datasets import load_dataset
    print(f"加载 PLAID Rotor37（split=all_samples）...")
    ds = load_dataset("PLAID-datasets/Rotor37", split="all_samples",
                      cache_dir=str(CACHE_DIR))
    print(f"数据集共 {len(ds)} 个样本")

    align_ids = set(load_alignment_ids())
    print(f"对齐目标（现有特征 CSV）样本数：{len(align_ids)}")

    X_list, cond_list, y_list, sid_list = [], [], [], []
    skipped = []

    for i in range(len(ds)):
        try:
            sample = pickle.loads(ds[i]["sample"])
        except Exception as e:
            skipped.append((i, f"pickle失败 {e}"))
            continue

        sc = sample.get("scalars", {})
        sc_str = {str(k): v for k, v in sc.items()}
        if "sample_id" in sc_str:
            sid = int(sc_str["sample_id"])
        else:
            sid = i
        if sid not in align_ids:
            continue  # 只保留与特征 CSV 对齐的样本

        try:
            X_pc, ok = extract_points_from_sample(sample, args.n_points)
        except Exception as e:
            skipped.append((sid, f"几何提取失败 {e}"))
            continue
        if not ok:
            skipped.append((sid, "缺坐标"))
            continue

        X_norm, _, _ = normalize_pc(X_pc)
        conds = np.array([float(sc_str["Omega"]), float(sc_str["P"])], dtype=np.float32)
        y = np.array([float(sc_str["Compression_ratio"]),
                      float(sc_str["Efficiency"]),
                      float(sc_str["Massflow"])], dtype=np.float32)

        X_list.append(X_norm)
        cond_list.append(conds)
        y_list.append(y)
        sid_list.append(sid)
        if len(X_list) % 100 == 0:
            print(f"  进度：{len(X_list)}/{len(align_ids)} 样本点云提取完成")

    if not X_list:
        print("❌ 没有任何样本成功提取。", file=sys.stderr)
        for s in skipped[:10]:
            print("  ", s)
        sys.exit(1)

    # ── 统一补齐到固定点数（尾部补零 + mask）────────────
    N = max(x.shape[0] for x in X_list)
    C = X_list[0].shape[1]
    X_pad = np.zeros((len(X_list), N, C), dtype=np.float32)
    for j, x in enumerate(X_list):
        X_pad[j, : x.shape[0]] = x

    out_path = DATA_PC_DIR / "rotor37_pc.npz"
    np.savez_compressed(out_path,
                        sample_id=np.array(sid_list, dtype=np.int64),
                        X_pc=X_pad,
                        conds=np.array(cond_list, dtype=np.float32),
                        y=np.array(y_list, dtype=np.float32))
    print(f"\n✅ 数据集已保存：{out_path}")
    print(f"   样本数：{len(sid_list)} | 每样本点数：{N} | 特征通道：{C}")
    print(f"   跳过的样本数：{len(skipped)}")
    for s in skipped[:10]:
        print("   ", s)


def build_smoke(args):
    """合成数据冒烟测试：验证提取/下采样/归一化/保存全链路。"""
    print("冒烟测试模式（合成数据）...")
    rng = np.random.default_rng(42)

    def fake_cgns(n):
        return [
            "Zone", None,
            [
                ["GridCoordinates", None,
                 [
                     ["CoordinateX", rng.random(n).astype(np.float32), None, "DataArray_t"],
                     ["CoordinateY", rng.random(n).astype(np.float32), None, "DataArray_t"],
                     ["CoordinateZ", rng.random(n).astype(np.float32), None, "DataArray_t"],
                     ["Pressure", rng.random(n).astype(np.float32), None, "DataArray_t"],
                     ["Temperature", rng.random(n).astype(np.float32), None, "DataArray_t"],
                 ],
                 "Zone_t"],
            ],
            "CGNSBase_t",
        ]

    X_list, cond_list, y_list, sid_list = [], [], [], []
    for i in range(8):
        sample = {"meshes": {"blade": fake_cgns(29773)},
                  "scalars": {"Omega": 1700.0, "P": 365000.0,
                              "Compression_ratio": 1.9, "Efficiency": 0.87,
                              "Massflow": 19.5, "sample_id": i}}
        X_pc, ok = extract_points_from_sample(sample, args.n_points)
        assert ok, "提取失败"
        X_norm, _, _ = normalize_pc(X_pc)
        X_list.append(X_norm)
        cond_list.append(np.array([1700.0, 365000.0], np.float32))
        y_list.append(np.array([1.9, 0.87, 19.5], np.float32))
        sid_list.append(i)

    N = max(x.shape[0] for x in X_list)
    C = X_list[0].shape[1]
    X_pad = np.zeros((len(X_list), N, C), dtype=np.float32)
    for j, x in enumerate(X_list):
        X_pad[j, : x.shape[0]] = x

    out_path = DATA_PC_DIR / "rotor37_pc_smoke.npz"
    np.savez_compressed(out_path, sample_id=np.array(sid_list, np.int64),
                        X_pc=X_pad, conds=np.array(cond_list, np.float32),
                        y=np.array(y_list, np.float32))
    print(f"✅ 冒烟测试通过：{out_path}")
    print(f"   样本 {len(sid_list)} | 点数 {N} | 通道 {C} | 形状 {X_pad.shape}")
    # 清理冒烟产物（避免误当正式数据）
    os.remove(out_path)
    print("   冒烟产物已清理。")


def main():
    ap = argparse.ArgumentParser(description="PLAID Rotor37 点云数据集构建")
    ap.add_argument("--n_points", type=int, default=2048, help="下采样目标点数")
    ap.add_argument("--smoke", action="store_true", help="合成数据冒烟测试")
    args = ap.parse_args()
    build(args)


if __name__ == "__main__":
    main()
