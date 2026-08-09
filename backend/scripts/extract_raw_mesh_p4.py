"""
从 PLAID Rotor37 Hugging Face 数据集中流式提取一个原始样本的 meshes 字段。

目标：确认原始样本是否保留 CGNS/网格连接信息，为 P4 正式拓扑提供来源证据。
不修改 rotor37_pc.npz，不下载整个数据集到 Git；输出位于 data/processed/p4/raw_mesh/（被忽略）。

依赖：datasets、numpy。
用法：
    python backend/scripts/extract_raw_mesh_p4.py --index 0

首次运行若缺依赖：
    python -m pip install datasets
"""

from __future__ import annotations

import argparse
import json
import pickle
from pathlib import Path
from typing import Any

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUT = ROOT / "data" / "processed" / "p4" / "raw_mesh"
CACHE = ROOT / "data" / "raw" / "cache"


def walk(obj: Any, path: str = "root", out: list[dict] | None = None) -> list[dict]:
    if out is None:
        out = []
    if isinstance(obj, np.ndarray):
        out.append({"path": path, "type": "ndarray", "shape": list(obj.shape), "dtype": str(obj.dtype)})
    elif isinstance(obj, dict):
        for k, v in obj.items():
            walk(v, f"{path}/{k}", out)
    elif isinstance(obj, list):
        if len(obj) == 4 and isinstance(obj[0], str):
            name, value, children, label = obj
            if isinstance(value, np.ndarray):
                out.append({"path": f"{path}/{name}[{label}]", "type": "cgns-value", "shape": list(value.shape), "dtype": str(value.dtype)})
            if isinstance(children, list):
                for i, child in enumerate(children):
                    walk(child, f"{path}/{name}[{i}]", out)
        else:
            for i, item in enumerate(obj):
                walk(item, f"{path}[{i}]", out)
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--index", type=int, default=0)
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    ap.add_argument("--cache", type=Path, default=CACHE)
    args = ap.parse_args()
    if args.index < 0:
        raise SystemExit("--index 必须 >= 0")

    from datasets import load_dataset

    args.cache.mkdir(parents=True, exist_ok=True)
    args.out.mkdir(parents=True, exist_ok=True)
    print("流式加载 PLAID-datasets/Rotor37（不主动下载整套到 Git）...")
    ds = load_dataset(
        "PLAID-datasets/Rotor37",
        split="all_samples",
        streaming=True,
        cache_dir=str(args.cache),
    )
    row = None
    for i, item in enumerate(ds):
        if i == args.index:
            row = item
            break
    if row is None:
        raise SystemExit(f"未找到 index={args.index} 的样本")

    sample = pickle.loads(row["sample"])
    meshes = sample.get("meshes") if isinstance(sample, dict) else None
    if meshes is None:
        raise SystemExit("样本中没有 meshes 字段")
    inventory = walk(meshes)
    scalars = sample.get("scalars", {}) if isinstance(sample, dict) else {}
    scalar_json = {str(k): (float(v) if isinstance(v, (int, float, np.number)) else str(v)) for k, v in scalars.items()}
    payload = {
        "dataset": "PLAID-datasets/Rotor37",
        "index": args.index,
        "sample_keys": list(sample.keys()) if isinstance(sample, dict) else [],
        "mesh_top_level_keys": list(meshes.keys()) if isinstance(meshes, dict) else [],
        "scalars": scalar_json,
        "arrays": inventory,
        "connectivity_candidates": [x for x in inventory if any(w in x["path"].lower() for w in ("connect", "element", "ngon", "nface", "cell", "face"))],
    }
    report = args.out / f"sample_{args.index:04d}_mesh_inventory.json"
    report.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    # Save only the meshes object for subsequent local inspection; it remains under ignored p4 output.
    mesh_pickle = args.out / f"sample_{args.index:04d}_meshes.pkl"
    mesh_pickle.write_bytes(pickle.dumps(meshes, protocol=pickle.HIGHEST_PROTOCOL))
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    print(f"✅ inventory: {report}")
    print(f"✅ raw meshes pickle: {mesh_pickle}")


if __name__ == "__main__":
    main()
