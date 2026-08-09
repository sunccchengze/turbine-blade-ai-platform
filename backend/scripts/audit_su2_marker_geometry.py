"""审计 SU2 体网格各 marker 的空间中心/范围，判断入口-出口轴向。
不运行求解器、不修改网格。
"""
from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path

import numpy as np


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mesh", type=Path, required=True)
    args = ap.parse_args()
    f = args.mesh.open("r", encoding="utf-8", errors="replace")
    points = None; elements = None; markers = {}
    line = f.readline()
    while line:
        line = line.strip()
        if line.startswith("NPOIN="):
            n = int(line.split("=", 1)[1]); points = np.array([[float(x) for x in f.readline().split()[:3]] for _ in range(n)])
        elif line.startswith("NELEM="):
            n = int(line.split("=", 1)[1]); elements = [[int(x) for x in f.readline().split()] for _ in range(n)]
        elif line.startswith("NMARK="):
            nmark = int(line.split("=", 1)[1])
            for _ in range(nmark):
                tag = f.readline().strip().split("=", 1)[1].strip()
                n = int(f.readline().strip().split("=", 1)[1])
                faces = []
                for _ in range(n):
                    vals = [int(x) for x in f.readline().split()]
                    faces.append(vals[1:])
                markers[tag] = faces
        line = f.readline()
    if points is None or not markers:
        raise SystemExit("SU2 网格缺少点或 marker")
    result = {"mesh": str(args.mesh), "markers": {}}
    for tag, faces in markers.items():
        ids = sorted({v for face in faces for v in face})
        xyz = points[ids]
        result["markers"][tag] = {
            "faces": len(faces), "vertices": len(ids),
            "centroid": xyz.mean(axis=0).tolist(),
            "bbox_min": xyz.min(axis=0).tolist(),
            "bbox_max": xyz.max(axis=0).tolist(),
            "extent": (xyz.max(axis=0) - xyz.min(axis=0)).tolist(),
        }
    if "INLET" in result["markers"] and "OUTLET" in result["markers"]:
        a = np.array(result["markers"]["INLET"]["centroid"])
        b = np.array(result["markers"]["OUTLET"]["centroid"])
        delta = b - a
        result["inlet_to_outlet"] = {
            "delta": delta.tolist(),
            "dominant_axis": int(np.argmax(np.abs(delta))),
            "dominant_axis_name": ["X", "Y", "Z"][int(np.argmax(np.abs(delta)))],
        }
    out = args.mesh.with_suffix(".marker_geometry.json")
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"✅ marker geometry report: {out}")


if __name__ == "__main__":
    main()
