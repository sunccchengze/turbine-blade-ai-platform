"""
Rotor37 点云实验性表面拓扑重建原型。

这不是 SU2/CGNS 网格生成器，也不保证水密、无自交或可用于 RANS。
用途是：从坐标+法向量构造一个代表性 OBJ 预览，统计局部三角化的
退化、边界和非流形情况，用来判断点云是否值得继续做正式表面重建。

用法：
    python backend/scripts/prototype_surface_reconstruction.py --sample 0 --k 12

依赖：numpy、scipy。输出默认位于 data/processed/p4/topology_preview/。
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

import numpy as np
from scipy.spatial import cKDTree

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_NPZ = ROOT / "data" / "processed" / "pointcloud" / "rotor37_pc.npz"
DEFAULT_OUT = ROOT / "data" / "processed" / "p4" / "topology_preview"


def tangent_basis(normal: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    n = normal / max(float(np.linalg.norm(normal)), 1e-12)
    ref = np.array([1.0, 0.0, 0.0], dtype=np.float32)
    if abs(float(np.dot(n, ref))) > 0.9:
        ref = np.array([0.0, 1.0, 0.0], dtype=np.float32)
    u = np.cross(n, ref)
    u /= max(float(np.linalg.norm(u)), 1e-12)
    v = np.cross(n, u)
    v /= max(float(np.linalg.norm(v)), 1e-12)
    return u, v


def reconstruct(coords: np.ndarray, normals: np.ndarray, k: int) -> tuple[np.ndarray, dict]:
    n = len(coords)
    if n < k + 1:
        raise ValueError(f"点数 {n} 不足以使用 k={k}")
    tree = cKDTree(coords)
    _, neigh = tree.query(coords, k=k + 1)
    faces: set[tuple[int, int, int]] = set()
    degenerate = 0

    for i in range(n):
        local = [int(x) for x in neigh[i] if int(x) != i]
        if len(local) < 3:
            continue
        u, v = tangent_basis(normals[i])
        rel = coords[local] - coords[i]
        px = rel @ u
        py = rel @ v
        order = np.argsort(np.arctan2(py, px))
        ring = [local[int(j)] for j in order]
        for a, b in zip(ring, ring[1:] + ring[:1]):
            if a == b or a == i or b == i:
                continue
            cross = np.cross(coords[a] - coords[i], coords[b] - coords[i])
            if float(np.linalg.norm(cross)) < 1e-10:
                degenerate += 1
                continue
            tri = (i, a, b)
            if float(np.dot(cross, normals[i])) < 0:
                tri = (i, b, a)
            faces.add(tuple(sorted(tri)))

    face_list = sorted(faces)
    edge_count: Counter[tuple[int, int]] = Counter()
    for a, b, c in face_list:
        edge_count[tuple(sorted((a, b)))] += 1
        edge_count[tuple(sorted((b, c)))] += 1
        edge_count[tuple(sorted((c, a)))] += 1
    boundary = sum(v == 1 for v in edge_count.values())
    nonmanifold = sum(v > 2 for v in edge_count.values())
    used = len({x for f in face_list for x in f})
    metrics = {
        "vertices": int(n),
        "used_vertices": int(used),
        "faces": int(len(face_list)),
        "edges": int(len(edge_count)),
        "boundary_edges": int(boundary),
        "nonmanifold_edges": int(nonmanifold),
        "degenerate_local_triangles_skipped": int(degenerate),
        "k_neighbors": int(k),
        "note": "experimental local tangent fan; not a CFD mesh",
    }
    return np.asarray(face_list, dtype=np.int64), metrics


def write_obj(path: Path, coords: np.ndarray, faces: np.ndarray) -> None:
    with path.open("w", encoding="utf-8") as f:
        f.write("# Experimental Rotor37 point-cloud surface preview\n")
        f.write("# Not a validated CFD mesh; local tangent-fan reconstruction only.\n")
        for x, y, z in coords:
            f.write(f"v {x:.8g} {y:.8g} {z:.8g}\n")
        for a, b, c in faces:
            f.write(f"f {a + 1} {b + 1} {c + 1}\n")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--npz", type=Path, default=DEFAULT_NPZ)
    ap.add_argument("--sample", type=int, default=0)
    ap.add_argument("--k", type=int, default=12)
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = ap.parse_args()

    data = np.load(args.npz, allow_pickle=False)
    X = data["X_pc"]
    if not (0 <= args.sample < len(X)):
        raise SystemExit(f"sample 超出范围：0–{len(X)-1}")
    coords = X[args.sample, :, :3].astype(np.float32)
    normals = X[args.sample, :, 6:9].astype(np.float32)
    faces, metrics = reconstruct(coords, normals, args.k)
    metrics.update({
        "npz": str(args.npz),
        "sample": int(args.sample),
        "bbox_min": coords.min(axis=0).tolist(),
        "bbox_max": coords.max(axis=0).tolist(),
    })
    args.out.mkdir(parents=True, exist_ok=True)
    obj = args.out / f"sample_{args.sample:04d}_k{args.k}.obj"
    report = args.out / f"sample_{args.sample:04d}_k{args.k}.json"
    write_obj(obj, coords, faces)
    report.write_text(json.dumps(metrics, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(metrics, ensure_ascii=False, indent=2))
    print(f"✅ OBJ 预览：{obj}")
    print(f"✅ 拓扑报告：{report}")
    print("⚠️ 这是实验性表面预览，不是 SU2/CGNS CFD 网格。")


if __name__ == "__main__":
    main()
