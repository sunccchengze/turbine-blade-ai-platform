"""
explore_sample_structure.py
探索 PLAID Rotor37 单个样本的完整结构：找出压力/温度/密度/法向等场量存在哪、叫什么名。

用法（在能访问 HF 的环境，如 Codespaces）：
    python backend/scripts/explore_sample_structure.py

输出：打印 sample 顶层 keys + meshes CGNS 树 + 所有 numpy 数组路径与 shape
（这决定 build_pointcloud_dataset.py 的字段提取逻辑是否需要修正）
"""

import pickle
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
CACHE_DIR = ROOT / "data" / "raw" / "cache"


def is_cgns_node(obj):
    return (
        isinstance(obj, list)
        and len(obj) == 4
        and isinstance(obj[0], str)
        and isinstance(obj[2], list)
        and isinstance(obj[3], str)
    )


def summarize(arr):
    if not isinstance(arr, np.ndarray):
        return type(arr).__name__
    if arr.dtype.kind in ("S", "U", "O"):
        return f"ndarray {arr.shape} {arr.dtype} (str, 前3: {arr.flatten()[:3]})"
    return (f"ndarray {arr.shape} {arr.dtype} "
            f"min={np.nanmin(arr):.4g} max={np.nanmax(arr):.4g} mean={np.nanmean(arr):.4g}")


def walk_cgns(obj, path="root", depth=0, out=None, max_depth=8):
    if out is None:
        out = []
    if isinstance(obj, np.ndarray):
        out.append((path, obj))
    elif isinstance(obj, dict):
        for k, v in obj.items():
            walk_cgns(v, f"{path}/{k}", depth + 1, out, max_depth)
    elif isinstance(obj, list):
        if is_cgns_node(obj):
            name, value, children, label = obj
            if isinstance(value, np.ndarray):
                out.append((f"{path}/{name}[{label}]", value))
            for child in children:
                walk_cgns(child, f"{path}/{name}", depth + 1, out, max_depth)
        else:
            for i, item in enumerate(obj):
                walk_cgns(item, f"{path}[{i}]", depth + 1, out, max_depth)
    return out


def main():
    from datasets import load_dataset
    print("加载数据集（命中缓存，应很快）...")
    ds = load_dataset("PLAID-datasets/Rotor37", split="all_samples",
                      cache_dir=str(CACHE_DIR))
    sample = pickle.loads(ds[0]["sample"])

    print("\n===== 1. sample 顶层 keys =====")
    for k in sample.keys():
        v = sample[k]
        print(f"  {k}: {type(v).__name__}"
              + (f" keys={list(v.keys())[:10]}" if isinstance(v, dict) else ""))

    # scalars
    sc = sample.get("scalars", {})
    print("\n===== 2. scalars keys =====")
    print("  ", list(sc.keys()))

    # meshes 树
    meshes = sample.get("meshes", {})
    print("\n===== 3. meshes 树结构（所有 numpy 数组）=====")
    arrays = []
    for mesh_key, tree in meshes.items():
        print(f"\n  -- mesh: {mesh_key} --")
        arrays += walk_cgns(tree, path=f"meshes/{mesh_key}")
    for p, a in arrays:
        print(f"  {p}\n      {summarize(a)}")

    # 关键词搜索所有数组
    print("\n===== 4. 关键词搜索（Pressure/Temperature/Density/Velocity/Normal/Coord）=====")
    for kw in ["Pressure", "pressure", "Temperature", "temperature",
               "Density", "density", "Velocity", "velocity",
               "Normal", "normal", "Coord", "coord"]:
        hits = [(p, a) for p, a in arrays if kw in p]
        if hits:
            print(f"  [{kw}] {len(hits)} 个:")
            for p, a in hits[:6]:
                print(f"      {p}  {summarize(a)}")

    # sample 里 meshes 之外还有没有别的字段
    print("\n===== 5. sample 其他字段（非 meshes/scalars）=====")
    for k, v in sample.items():
        if k in ("meshes", "scalars"):
            continue
        print(f"  {k}: {summarize(v) if isinstance(v, np.ndarray) else type(v).__name__}"
              + (f" keys={list(v.keys())[:10]}" if isinstance(v, dict) else ""))


if __name__ == "__main__":
    main()
