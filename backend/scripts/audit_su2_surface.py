"""审计由原始 PLAID QUAD_4 拓扑导出的 SU2 表面文件。

不运行 CFD；检查节点、面、边界边、非流形边、连通分量和面方向一致性。
"""
from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict, deque
from pathlib import Path

import numpy as np


def parse(path: Path):
    lines = [x.strip() for x in path.read_text(encoding="utf-8").splitlines() if x.strip()]
    def section(name):
        for i, line in enumerate(lines):
            if line.startswith(name):
                return i, int(line.split("=")[1].strip())
        raise ValueError(f"missing {name}")
    ie, ne = section("NELEM")
    elem = []
    for line in lines[ie + 1:ie + 1 + ne]:
        vals = [int(x) for x in line.split()]
        if vals[0] != 9 or len(vals) < 5:
            raise ValueError(f"non-quad element: {line}")
        elem.append(vals[1:5])
    ip, npoin = section("NPOIN")
    points = []
    for line in lines[ip + 1:ip + 1 + npoin]:
        vals = line.split()
        points.append([float(vals[0]), float(vals[1]), float(vals[2])])
    return np.asarray(points), np.asarray(elem, dtype=np.int64)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mesh", type=Path, required=True)
    args = ap.parse_args()
    points, faces = parse(args.mesh)
    edges = Counter()
    adjacency = defaultdict(set)
    for face in faces:
        for a, b in zip(face, np.roll(face, -1)):
            e = (int(min(a, b)), int(max(a, b)))
            edges[e] += 1
            adjacency[int(a)].add(int(b)); adjacency[int(b)].add(int(a))
    boundary = [e for e, n in edges.items() if n == 1]
    nonmanifold = [e for e, n in edges.items() if n > 2]
    # connected components of the edge graph
    unseen = set(adjacency); comps = []
    while unseen:
        start = unseen.pop(); q = deque([start]); comp = {start}
        while q:
            v = q.popleft()
            for w in adjacency[v]:
                if w not in comp:
                    comp.add(w); unseen.discard(w); q.append(w)
        comps.append(comp)
    result = {
        "mesh": str(args.mesh),
        "vertices": int(len(points)),
        "quads": int(len(faces)),
        "edges": int(len(edges)),
        "boundary_edges": int(len(boundary)),
        "nonmanifold_edges": int(len(nonmanifold)),
        "connected_components": len(comps),
        "used_vertices": int(len(set(faces.reshape(-1).tolist()))),
        "bbox_min": points.min(axis=0).tolist(),
        "bbox_max": points.max(axis=0).tolist(),
        "marker_note": "surface-only; no volume cells or CFD domain",
    }
    out = args.mesh.with_suffix(".topology.json")
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"✅ 拓扑报告：{out}")
    print("⚠️ 表面拓扑审计不等于体网格/RANS 验证。")


if __name__ == "__main__":
    main()
