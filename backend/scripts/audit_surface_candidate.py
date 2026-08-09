"""
审计 Open3D 表面候选与原始点云之间的几何保真度。

用法：
  python backend/scripts/audit_surface_candidate.py \
    --mesh data/processed/p4/topology_open3d/sample_0000_bpa.ply \
    --sample 0

依赖：numpy、scipy、open3d。
输出：候选 mesh 的 JSON + Markdown 审计报告。
注意：通过本审计不等于通过 CFD 网格 Gate。
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from scipy.spatial import cKDTree

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_NPZ = ROOT / "data" / "processed" / "pointcloud" / "rotor37_pc.npz"


def percentile_summary(x: np.ndarray) -> dict:
    return {
        "mean": float(np.mean(x)),
        "median": float(np.median(x)),
        "p95": float(np.quantile(x, 0.95)),
        "max": float(np.max(x)),
    }


def edge_metrics(triangles: np.ndarray) -> dict:
    counts: dict[tuple[int, int], int] = {}
    for a, b, c in triangles:
        for x, y in ((a, b), (b, c), (c, a)):
            key = (int(min(x, y)), int(max(x, y)))
            counts[key] = counts.get(key, 0) + 1
    values = list(counts.values())
    return {
        "edges": len(values),
        "boundary_edges": sum(v == 1 for v in values),
        "nonmanifold_edges": sum(v > 2 for v in values),
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mesh", type=Path, required=True)
    ap.add_argument("--npz", type=Path, default=DEFAULT_NPZ)
    ap.add_argument("--sample", type=int, default=0)
    ap.add_argument("--sample_points", type=int, default=10000)
    args = ap.parse_args()

    try:
        import open3d as o3d
    except ImportError as exc:
        raise SystemExit("缺少 open3d：请在 rotor37-recon 环境安装 open3d") from exc

    data = np.load(args.npz, allow_pickle=False)
    X = data["X_pc"]
    original = X[args.sample, :, :3].astype(np.float64)
    original_normals = X[args.sample, :, 6:9].astype(np.float64)
    mesh = o3d.io.read_triangle_mesh(str(args.mesh))
    if len(mesh.vertices) == 0 or len(mesh.triangles) == 0:
        raise SystemExit("mesh 没有有效顶点或三角面")

    vertices = np.asarray(mesh.vertices).astype(np.float64)
    triangles = np.asarray(mesh.triangles).astype(np.int64)
    mesh.compute_vertex_normals()
    mesh_normals = np.asarray(mesh.vertex_normals).astype(np.float64)
    sampled = mesh.sample_points_uniformly(number_of_points=args.sample_points)
    surface_points = np.asarray(sampled.points).astype(np.float64)

    tree_surface = cKDTree(surface_points)
    tree_original = cKDTree(original)
    d_original_to_surface = tree_surface.query(original, k=1)[0]
    d_surface_to_original = tree_original.query(surface_points, k=1)[0]

    # Compare normals at the nearest mesh vertex. Absolute dot is used because
    # point-cloud normal orientation may be globally reversed before orientation.
    nearest_vertex = tree_original.query(vertices, k=1)[1]
    on = original_normals[nearest_vertex]
    mn = mesh_normals
    on /= np.maximum(np.linalg.norm(on, axis=1, keepdims=True), 1e-12)
    mn /= np.maximum(np.linalg.norm(mn, axis=1, keepdims=True), 1e-12)
    normal_abs_dot = np.abs(np.sum(on * mn, axis=1))

    lo_o, hi_o = original.min(axis=0), original.max(axis=0)
    lo_m, hi_m = vertices.min(axis=0), vertices.max(axis=0)
    extent_o, extent_m = hi_o - lo_o, hi_m - lo_m

    result = {
        "npz": str(args.npz),
        "mesh": str(args.mesh),
        "sample": args.sample,
        "original_points": len(original),
        "mesh_vertices": len(vertices),
        "mesh_triangles": len(triangles),
        "mesh_edges": edge_metrics(triangles),
        "original_to_surface_distance": percentile_summary(d_original_to_surface),
        "surface_to_original_distance": percentile_summary(d_surface_to_original),
        "normal_absolute_dot": percentile_summary(normal_abs_dot),
        "normal_alignment_fraction_abs_dot_ge_0_9": float(np.mean(normal_abs_dot >= 0.9)),
        "bbox": {
            "original_min": lo_o.tolist(), "original_max": hi_o.tolist(),
            "mesh_min": lo_m.tolist(), "mesh_max": hi_m.tolist(),
            "original_extent": extent_o.tolist(), "mesh_extent": extent_m.tolist(),
            "extent_ratio": (extent_m / np.maximum(extent_o, 1e-12)).tolist(),
        },
        "note": "surface fidelity audit only; passing does not make this a CFD mesh",
    }

    out = args.mesh.with_name(args.mesh.stem + "_fidelity.json")
    report = args.mesh.with_name(args.mesh.stem + "_fidelity.md")
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    e1 = result["original_to_surface_distance"]
    e2 = result["surface_to_original_distance"]
    em = result["mesh_edges"]
    report.write_text(
        "\n".join([
            "# 表面候选几何保真审计\n",
            f"- mesh：`{args.mesh}`",
            f"- 原始点数：{len(original)}；网格顶点/三角面：{len(vertices)}/{len(triangles)}",
            f"- 原始点→表面距离：median={e1['median']:.6g}，p95={e1['p95']:.6g}，max={e1['max']:.6g}",
            f"- 表面→原始点距离：median={e2['median']:.6g}，p95={e2['p95']:.6g}，max={e2['max']:.6g}",
            f"- 法向 |dot|≥0.9 占比：{result['normal_alignment_fraction_abs_dot_ge_0_9']:.4f}",
            f"- 边界边：{em['boundary_edges']}；非流形边：{em['nonmanifold_edges']}",
            f"- 包围盒 extent ratio：{result['bbox']['extent_ratio']}",
            "\n> 本报告只审计表面候选对原始点云的保真度；通过不等于已生成可运行 CFD 网格。",
        ]) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"✅ JSON：{out}")
    print(f"✅ 报告：{report}")


if __name__ == "__main__":
    main()
