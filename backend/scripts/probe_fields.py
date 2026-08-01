"""
probe_fields.py
极轻量探测：只加载 PLAID Rotor37 前 2 个样本，打印 meshes 里所有数组的路径+shape，
定位 Pressure/Temperature/Normal 等场量到底存在哪（不构建全量、不占磁盘）。

用法（Codespaces，需能访问 HF）：
    python backend/scripts/probe_fields.py

输出：每个样本的 meshes 树 + 所有数组路径 + 关键词命中
"""

import pickle
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]


def is_cgns_node(obj):
    return (isinstance(obj, list) and len(obj) == 4
            and isinstance(obj[0], str) and isinstance(obj[2], list)
            and isinstance(obj[3], str))


def summarize(arr):
    if not isinstance(arr, np.ndarray):
        return type(arr).__name__
    if arr.dtype.kind in ("S", "U", "O"):
        return f"ndarray {arr.shape} {arr.dtype}"
    return f"ndarray {arr.shape} {arr.dtype} [{arr.flatten()[:3]}]"


def walk(obj, path="root", out=None):
    if out is None:
        out = []
    if isinstance(obj, np.ndarray):
        out.append((path, obj))
    elif isinstance(obj, dict):
        for k, v in obj.items():
            walk(v, f"{path}/{k}", out)
    elif isinstance(obj, list):
        if is_cgns_node(obj):
            name, value, children, label = obj
            if isinstance(value, np.ndarray):
                out.append((f"{path}/{name}[{label}]", value))
            for child in children:
                walk(child, f"{path}/{name}", out)
        else:
            for i, item in enumerate(obj):
                walk(item, f"{path}[{i}]", out)
    return out


def main():
    from datasets import load_dataset
    print("加载数据集前 2 个样本（不构建全量）...")
    ds = load_dataset("PLAID-datasets/Rotor37", split="all_samples[:2]",
                      cache_dir="/tmp/hf_cache")   # 放 /tmp，不占仓库磁盘
    print(f"加载完成，len={len(ds)}")

    for i in range(len(ds)):
        sample = pickle.loads(ds[i]["sample"])
        print(f"\n{'='*50}\n样本 {i} 顶层 keys: {list(sample.keys())}")
        meshes = sample.get("meshes", {})
        arrays = []
        for mk, tree in meshes.items():
            print(f"  mesh '{mk}':")
            arrays += walk(tree, path=f"meshes/{mk}")
        print(f"  共 {len(arrays)} 个数组：")
        for p, a in arrays:
            print(f"    {p}  {summarize(a)}")
        # 关键词
        for kw in ["Pressure", "pressure", "Temperature", "temperature",
                   "Density", "density", "Velocity", "velocity",
                   "Normal", "normal", "Coord"]:
            hits = [(p, a) for p, a in arrays if kw in p]
            if hits:
                print(f"  [{kw}] 命中:")
                for p, a in hits[:8]:
                    print(f"      {p}  {summarize(a)}")


if __name__ == "__main__":
    main()
