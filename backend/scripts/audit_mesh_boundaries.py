"""
审计 BPA/Poisson 表面候选的边界边空间语义。

目标：区分真实叶片边界（前缘/尾缘/根部/叶尖）与重建孔洞。
本脚本不修补边界，不生成 CFD 网格。

用法：
  python backend/scripts/audit_mesh_boundaries.py \
    --mesh data/processed/p4/topology_open3d/sample_0000_bpa.ply \
    --sample 0

依赖：numpy、open3d。
"""

from __future__ import annotations

import argparse
import json
from collections import defaultdict, deque
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_NPZ = ROOT / "data" / "processed" / "pointcloud" / "rotor37_pc.npz"


def boundary_components(triangles: np.ndarray) -> list[list[tuple[int, int]]]:
    edge_faces: dict[tuple[int, int], int] = defaultdict(int)
    for a, b, c in triangles:
        for x, y in ((a, b), (b, c), (c, a)):
            edge_faces[(int(min(x, y)), int(max(x, y)))] += 1
    boundary = [e for e, count in edge_faces.items() if count == 1]
    adjacency: dict[int, set[int]] = defaultdict(set)
    for a, b in boundary:
        adjacency[a].add(b)
        adjacency[b].add(a)

    unseen = set(adjacency)
    components: list[list[tuple[int, int]]] = []
    while unseen:
        start = unseen.pop()
        queue = deque([start])
        vertices = {start}
        while queue:
            v = queue.popleft()
            for nxt in adjacency[v]:
                if nxt not in vertices:
                    vertices.add(nxt)
                    unseen.discard(nxt)
                    queue.append(nxt)
        components.append([e for e in boundary if e[0] in vertices and e[1] in vertices])
    return components


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mesh", type=Path, required=True)
    ap.add_argument("--npz", type=Path, default=DEFAULT_NPZ)
    ap.add_argument("--sample", type=int, default=0)
    args = ap.parse_args()

    try:
        import open3d as o3d
    except ImportError as exc:
        raise SystemExit("缺少 open3d：请在 rotor37-recon 环境安装 open3d") from exc

    data = np.load(args.npz, allow_pickle=False)
    original = data["X_pc"][args.sample, :, :3].astype(np.float64)
    mesh = o3d.io.read_triangle_mesh(str(args.mesh))
    vertices = np.asarray(mesh.vertices).astype(np.float64)
    triangles = np.asarray(mesh.triangles).astype(np.int64)
    components = boundary_components(triangles)
    original_lo, original_hi = original.min(axis=0), original.max(axis=0)
    extent = np.maximum(original_hi - original_lo, 1e-12)

    reports = []
    for index, edges in enumerate(sorted(components, key=len, reverse=True), start=1):
        ids = sorted({v for edge in edges for v in edge})
        points = vertices[ids]
        center = points.mean(axis=0)
        near_extreme = np.isclose(
            (center - original_lo) / extent, 0.0, atol=0.08
        ) | np.isclose(
            (original_hi - center) / extent, 0.0, atol=0.08
        )
        reports.append({
            "component": index,
            "edges": len(edges),
            "vertices": len(ids),
            "bbox_min": points.min(axis=0).tolist(),
            "bbox_max": points.max(axis=0).tolist(),
            "center": center.tolist(),
            "center_normalized_in_original_bbox": ((center - original_lo) / extent).tolist(),
            "near_original_bbox_extreme_axis": [int(x) for x in np.where(near_extreme)[0]],
            "boundary_vertex_ids": ids[:20],
        })

    result = {
        "mesh": str(args.mesh),
        "npz": str(args.npz),
        "sample": args.sample,
        "mesh_vertices": len(vertices),
        "mesh_triangles": len(triangles),
        "boundary_components": len(reports),
        "boundary_edges_total": sum(x["edges"] for x in reports),
        "components": reports,
        "interpretation": {
            "not_a_mesh_repair": True,
            "next_question": "边界分量是否与叶片前缘/尾缘/根部/叶尖等真实几何边界对应",
            "warning": "仅凭边界位置不能证明物理语义，需要拓扑/原始几何或人工可视化复核",
        },
    }
    out = args.mesh.with_name(args.mesh.stem + "_boundary.json")
    report = args.mesh.with_name(args.mesh.stem + "_boundary.md")
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    lines = [
        "# 表面候选边界边空间语义审计\n",
        f"- mesh：`{args.mesh}`",
        f"- 边界连通分量：{len(reports)}",
        f"- 边界边总数：{result['boundary_edges_total']}",
        "\n| 分量 | edges | vertices | center | near bbox extreme axis |",
        "|---:|---:|---:|---|---|",
    ]
    for r in reports:
        lines.append(
            f"| {r['component']} | {r['edges']} | {r['vertices']} | "
            f"{[round(x, 4) for x in r['center']]} | {r['near_original_bbox_extreme_axis']} |"
        )
    lines.append("\n> 本报告不修补边界；边界是否为真实叶片边界仍需拓扑/原始几何/人工可视化复核。")
    report.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"✅ JSON：{out}")
    print(f"✅ 报告：{report}")


if __name__ == "__main__":
    main()
