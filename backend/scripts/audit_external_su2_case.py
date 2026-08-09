"""审计外部 Rotor37 SU2 网格和 cfg，不运行求解器。

用法：
  python backend/scripts/audit_external_su2_case.py \
    --mesh data/processed/p4/external_su2/R37_coarse.su2 \
    --cfg data/processed/p4/external_su2/R37_from_scratch.cfg

支持：SU2 ASCII mesh header/element/marker 统计、cfg 关键配置摘要。
"""
from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from pathlib import Path

VOLUME_CODES = {10: "TETRAHEDRON", 12: "HEXAHEDRON", 13: "PRISM", 14: "PYRAMID"}
SURFACE_CODES = {3: "LINE", 5: "TRIANGLE", 9: "QUADRILATERAL"}


def header_value(lines: list[str], key: str) -> int | None:
    prefix = key + "="
    for line in lines[:40]:
        if line.startswith(prefix):
            return int(line.split("=", 1)[1].strip())
    return None


def parse_mesh(path: Path) -> dict:
    element_counts: Counter[str] = Counter()
    marker_tags: list[str] = []
    marker_counts: dict[str, int] = {}
    headers: list[str] = []
    nelem = npoin = nmark = None
    with path.open("r", encoding="utf-8", errors="replace") as f:
        # Header is small; parse all header controls encountered before NELEM.
        for _ in range(80):
            line = f.readline()
            if not line:
                break
            line = line.strip()
            if line:
                headers.append(line)
            if line.startswith("NELEM="):
                nelem = int(line.split("=", 1)[1])
                break
        if nelem is None:
            raise ValueError("SU2 文件缺少 NELEM")
        for _ in range(nelem):
            line = f.readline().strip()
            if not line:
                continue
            code = int(line.split()[0])
            element_counts[VOLUME_CODES.get(code, SURFACE_CODES.get(code, f"CODE_{code}"))] += 1
        line = f.readline().strip()
        if not line.startswith("NPOIN="):
            raise ValueError(f"NELEM 后未找到 NPOIN：{line}")
        npoin = int(line.split("=", 1)[1])
        for _ in range(npoin):
            f.readline()
        line = f.readline().strip()
        if line.startswith("NMARK="):
            nmark = int(line.split("=", 1)[1])
            for _ in range(nmark):
                tag_line = f.readline().strip()
                if not tag_line.startswith("MARKER_TAG="):
                    raise ValueError(f"未找到 MARKER_TAG：{tag_line}")
                tag = tag_line.split("=", 1)[1].strip()
                marker_tags.append(tag)
                count_line = f.readline().strip()
                count = int(count_line.split("=", 1)[1])
                marker_counts[tag] = count
                for _ in range(count):
                    f.readline()
    return {
        "path": str(path),
        "size_bytes": path.stat().st_size,
        "header": headers,
        "nelem": nelem,
        "npoin": npoin,
        "element_counts": dict(element_counts),
        "nmark": nmark,
        "marker_tags": marker_tags,
        "marker_element_counts": marker_counts,
        "has_volume_elements": any(name in element_counts for name in VOLUME_CODES.values()),
    }


def parse_cfg(path: Path | None) -> dict:
    if path is None:
        return {"path": None}
    values: dict[str, str] = {}
    with path.open("r", encoding="utf-8", errors="replace") as f:
        for raw in f:
            line = raw.split("%", 1)[0].strip()
            if "=" in line and line:
                key, value = line.split("=", 1)
                values[key.strip()] = value.strip()
    wanted = [
        "SOLVER", "MESH_FILENAME", "MESH_FORMAT", "KIND_TURB_MODEL", "MATH_PROBLEM",
        "MARKER_INLET", "MARKER_OUTLET", "MARKER_PERIODIC", "MARKER_EULER",
        "MARKER_HEATFLUX", "MARKER_FAR", "PERIODICITY", "ROTATION_RATE",
        "FREESTREAM_PRESSURE", "FREESTREAM_TEMPERATURE", "MACH_NUMBER",
        "INLET_FILENAME", "SPECIFIED_INLET_PROFILE", "OUTPUT_FILES",
    ]
    return {"path": str(path), "settings": {k: values[k] for k in wanted if k in values}}


def cfg_marker_names(settings: dict[str, str], known_markers: set[str]) -> set[str]:
    # Marker tuples contain different shapes: periodic has two names, heatflux
    # interleaves marker names and values, and some BCs use a single name. Use
    # the mesh marker vocabulary to avoid misclassifying numeric tokens.
    text = " ".join(value for key, value in settings.items() if key.startswith("MARKER_"))
    return {marker for marker in known_markers if re.search(rf"(?<![A-Za-z0-9_]){re.escape(marker)}(?![A-Za-z0-9_])", text)}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mesh", type=Path, required=True)
    ap.add_argument("--cfg", type=Path, default=None)
    ap.add_argument("--out", type=Path, default=None)
    args = ap.parse_args()
    result = {"mesh": parse_mesh(args.mesh), "cfg": parse_cfg(args.cfg)}
    mesh_name = Path(result["mesh"]["path"]).name
    settings = result["cfg"].get("settings", {})
    cfg_mesh = Path(settings["MESH_FILENAME"]).name if "MESH_FILENAME" in settings else None
    mesh_markers = set(result["mesh"]["marker_tags"])
    cfg_markers = cfg_marker_names(settings, mesh_markers)
    result["verdict"] = {
        "volume_mesh_present": result["mesh"]["has_volume_elements"],
        "mesh_filename_matches_cfg": cfg_mesh == mesh_name if cfg_mesh else None,
        "cfg_mesh_filename": cfg_mesh,
        "actual_mesh_filename": mesh_name,
        "cfg_markers_missing_from_mesh": sorted(cfg_markers - mesh_markers),
        "mesh_markers_not_referenced_by_cfg": sorted(mesh_markers - cfg_markers),
        "next_gate": "boundary/cfg consistency and SU2 preprocessing" if result["mesh"]["has_volume_elements"] else "not a volume CFD mesh",
    }
    out = args.out or args.mesh.with_suffix(".case_audit.json")
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"✅ 审计报告：{out}")
    print("⚠️ 本脚本只读审计，不运行 SU2 求解器。")


if __name__ == "__main__":
    main()
