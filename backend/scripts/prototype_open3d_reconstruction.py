"""
Open3D 表面重建实验原型：Poisson / Ball Pivoting。

用途：替代失败的局部切平面三角扇，评估真实点云是否能恢复出更连贯的
表面网格候选。输出仍然不是 Rotor37 正式 CFD 网格，必须通过后续网格
质量、边界、拓扑和 SU2 Gate 才能继续。

依赖（训练环境之外的可选工具）：
    pip install open3d

用法：
    python backend/scripts/prototype_open3d_reconstruction.py --sample 0 --method poisson
    python backend/scripts/prototype_open3d_reconstruction.py --sample 0 --method bpa
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_NPZ = ROOT / "data" / "processed" / "pointcloud" / "rotor37_pc.npz"
DEFAULT_OUT = ROOT / "data" / "processed" / "p4" / "topology_open3d"


def mesh_metrics(mesh) -> dict:
    vertices = np.asarray(mesh.vertices)
    triangles = np.asarray(mesh.triangles)
    edge_count: dict[tuple[int, int], int] = {}
    for a, b, c in triangles:
        for x, y in ((a, b), (b, c), (c, a)):
            key = (int(min(x, y)), int(max(x, y)))
            edge_count[key] = edge_count.get(key, 0) + 1
    counts = list(edge_count.values())
    return {
        "vertices": int(len(vertices)),
        "triangles": int(len(triangles)),
        "edges": int(len(edge_count)),
        "boundary_edges": int(sum(v == 1 for v in counts)),
        "nonmanifold_edges": int(sum(v > 2 for v in counts)),
        "bbox_min": vertices.min(axis=0).tolist() if len(vertices) else [],
        "bbox_max": vertices.max(axis=0).tolist() if len(vertices) else [],
        "note": "Open3D surface candidate; not a validated CFD mesh",
    }


def reconstruct(args) -> None:
    try:
        import open3d as o3d
    except ImportError as exc:
        raise SystemExit("缺少 open3d：请在独立环境执行 pip install open3d") from exc

    data = np.load(args.npz, allow_pickle=False)
    X = data["X_pc"]
    if not (0 <= args.sample < len(X)):
        raise SystemExit(f"sample 超出范围：0–{len(X)-1}")
    coords = X[args.sample, :, :3].astype(np.float64)
    normals = X[args.sample, :, 6:9].astype(np.float64)

    pcd = o3d.geometry.PointCloud()
    pcd.points = o3d.utility.Vector3dVector(coords)
    pcd.normals = o3d.utility.Vector3dVector(normals)
    pcd.normalize_normals()
    # Consistent orientation is essential for Poisson; this may be expensive and
    # is still only a reconstruction heuristic, not a physical boundary proof.
    pcd.orient_normals_consistent_tangent_plane(args.normal_k)

    args.out.mkdir(parents=True, exist_ok=True)
    base = args.out / f"sample_{args.sample:04d}"
    outputs = []

    if args.method in ("poisson", "both"):
        mesh, density = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(
            pcd, depth=args.depth, scale=1.1, linear_fit=True)
        density = np.asarray(density)
        if len(density):
            threshold = float(np.quantile(density, args.trim_quantile))
            keep = density >= threshold
            mesh.remove_vertices_by_mask((~keep).tolist())
        mesh.remove_degenerate_triangles()
        mesh.remove_duplicated_triangles()
        mesh.remove_duplicated_vertices()
        mesh.remove_unreferenced_vertices()
        mesh.compute_vertex_normals()
        path = base.with_name(base.name + "_poisson.ply")
        o3d.io.write_triangle_mesh(str(path), mesh)
        outputs.append({"method": "poisson", "path": str(path), **mesh_metrics(mesh)})

    if args.method in ("bpa", "both"):
        distances = pcd.compute_nearest_neighbor_distance()
        radius = float(np.mean(distances))
        radii = o3d.utility.DoubleVector([radius, radius * 2.0, radius * 4.0])
        mesh = o3d.geometry.TriangleMesh.create_from_point_cloud_ball_pivoting(pcd, radii)
        mesh.remove_degenerate_triangles()
        mesh.remove_duplicated_triangles()
        mesh.remove_duplicated_vertices()
        mesh.remove_unreferenced_vertices()
        mesh.compute_vertex_normals()
        path = base.with_name(base.name + "_bpa.ply")
        o3d.io.write_triangle_mesh(str(path), mesh)
        outputs.append({"method": "bpa", "path": str(path), "radius_mean": radius, **mesh_metrics(mesh)})

    report = base.with_name(base.name + "_report.json")
    report.write_text(json.dumps({
        "npz": str(args.npz), "sample": args.sample,
        "normal_k": args.normal_k, "depth": args.depth,
        "trim_quantile": args.trim_quantile, "outputs": outputs,
        "warning": "实验性表面候选，不是 SU2/CGNS CFD 网格",
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(outputs, ensure_ascii=False, indent=2))
    print(f"✅ 报告：{report}")
    print("⚠️ Open3D 输出仍需网格质量和边界条件审查，不得直接用于 RANS。")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--npz", type=Path, default=DEFAULT_NPZ)
    ap.add_argument("--sample", type=int, default=0)
    ap.add_argument("--method", choices=["poisson", "bpa", "both"], default="poisson")
    ap.add_argument("--normal_k", type=int, default=30)
    ap.add_argument("--depth", type=int, default=8)
    ap.add_argument("--trim_quantile", type=float, default=0.02)
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = ap.parse_args()
    reconstruct(args)


if __name__ == "__main__":
    main()
