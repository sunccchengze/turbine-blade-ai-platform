"""
将 extract_raw_mesh_p4.py 保存的原始 PLAID meshes pickle 转为 SU2 表面网格。

输入：data/processed/p4/raw_mesh/sample_0000_meshes.pkl
输出：data/processed/p4/raw_mesh/sample_0000_surface.su2

重要：这是原始 QUAD_4 表面网格，不是三维体网格；不能直接运行 Rotor37 RANS。
用途是保留原始拓扑、检查 SU2 读取能力，并为后续体网格/边界处理提供输入。
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


def walk(obj: Any, path: str = "root", out: list[tuple[str, np.ndarray]] | None = None):
    if out is None:
        out = []
    if isinstance(obj, np.ndarray):
        out.append((path, obj))
    elif isinstance(obj, dict):
        for k, v in obj.items():
            walk(v, f"{path}/{k}", out)
    elif isinstance(obj, list):
        if len(obj) == 4 and isinstance(obj[0], str):
            name, value, children, label = obj
            if isinstance(value, np.ndarray):
                out.append((f"{path}/{name}[{label}]", value))
            if isinstance(children, list):
                for i, child in enumerate(children):
                    walk(child, f"{path}/{name}[{i}]", out)
        else:
            for i, item in enumerate(obj):
                walk(item, f"{path}[{i}]", out)
    return out


def find_one(arrays, suffix: str, *, shape0: int | None = None):
    hits = [(p, a) for p, a in arrays if suffix.lower() in p.lower()]
    if shape0 is not None:
        hits = [(p, a) for p, a in hits if a.ndim == 1 and len(a) == shape0]
    if not hits:
        raise ValueError(f"未找到 {suffix} 数组")
    return hits[0]


def write_su2(path: Path, coords: np.ndarray, quads: np.ndarray, marker: str) -> None:
    with path.open("w", encoding="utf-8") as f:
        f.write("NDIME= 3\n")
        f.write(f"NELEM= {len(quads)}\n")
        # SU2 element code 9 = quadrilateral. Node ids in SU2 are zero-based.
        for i, quad in enumerate(quads):
            f.write("9 " + " ".join(str(int(x)) for x in quad) + f" {i}\n")
        f.write(f"NPOIN= {len(coords)}\n")
        for i, (x, y, z) in enumerate(coords):
            f.write(f"{x:.17g} {y:.17g} {z:.17g} {i}\n")
        f.write("NMARK= 1\n")
        f.write(f"MARKER_TAG= {marker}\n")
        f.write(f"MARKER_ELEMS= {len(quads)}\n")
        for quad in quads:
            f.write("9 " + " ".join(str(int(x)) for x in quad) + "\n")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--meshes-pkl", type=Path, required=True)
    ap.add_argument("--out", type=Path, default=None)
    ap.add_argument("--marker", default="Rotor37")
    args = ap.parse_args()

    meshes = pickle.loads(args.meshes_pkl.read_bytes())
    arrays = walk(meshes)
    coord_hits = []
    for name in ("CoordinateX", "CoordinateY", "CoordinateZ"):
        path, arr = find_one(arrays, name)
        if arr.ndim != 1:
            raise ValueError(f"{name} 不是一维数组：{arr.shape}")
        coord_hits.append((path, arr.astype(np.float64)))
    n_points = len(coord_hits[0][1])
    if any(len(a) != n_points for _, a in coord_hits):
        raise ValueError("三个坐标数组长度不一致")
    coords = np.column_stack([a for _, a in coord_hits])

    conn_path, conn = find_one(arrays, "ElementConnectivity")
    if conn.ndim != 1 or len(conn) % 4:
        raise ValueError(f"QUAD_4 connectivity 长度异常：{conn.shape}")
    quads_1 = conn.astype(np.int64).reshape(-1, 4)
    # CGNS connectivity is 1-based; SU2 uses 0-based node ids.
    quads = quads_1 - 1
    if quads.min() < 0 or quads.max() >= n_points:
        raise ValueError("连接关系超出坐标节点范围")

    out = args.out or args.meshes_pkl.with_name(args.meshes_pkl.stem.replace("_meshes", "") + "_surface.su2")
    out.parent.mkdir(parents=True, exist_ok=True)
    write_su2(out, coords, quads, args.marker)
    meta = {
        "source": str(args.meshes_pkl),
        "coordinate_path": [p for p, _ in coord_hits],
        "connectivity_path": conn_path,
        "vertices": int(n_points),
        "quads": int(len(quads)),
        "element_type": "QUAD_4 / SU2 code 9",
        "marker": args.marker,
        "mesh_kind": "surface-only; not a volume CFD mesh",
    }
    meta_path = out.with_suffix(".json")
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(meta, ensure_ascii=False, indent=2))
    print(f"✅ SU2 表面文件：{out}")
    print(f"✅ 元数据：{meta_path}")
    print("⚠️ 这是原始拓扑表面，不是可直接运行 RANS 的三维体网格。")


if __name__ == "__main__":
    main()
