"""生成外部 Rotor37 coarse mesh 的安全工作 cfg。

不修改下载的原始 cfg；只修正已审计的 mesh 文件名和明显数值拼写错误。
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--cfg", type=Path, required=True)
    ap.add_argument("--mesh", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True)
    args = ap.parse_args()

    text = args.cfg.read_text(encoding="utf-8", errors="replace")
    old_mesh = None
    lines = []
    for line in text.splitlines(keepends=True):
        if line.lstrip().startswith("MESH_FILENAME"):
            old_mesh = line.rstrip("\r\n")
            newline = "\r\n" if line.endswith("\r\n") else "\n"
            line = f"MESH_FILENAME= {args.mesh.name}{newline}"
        lines.append(line)
    updated = "".join(lines).replace("95000.0.0", "95000.0")
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(updated, encoding="utf-8", newline="")
    changes = {
        "source_cfg": str(args.cfg),
        "working_cfg": str(args.out),
        "mesh_file": str(args.mesh),
        "mesh_filename_before": old_mesh,
        "mesh_filename_after": f"MESH_FILENAME= {args.mesh.name}",
        "replacements": ["MESH_FILENAME -> actual audited mesh", "95000.0.0 -> 95000.0"],
        "original_preserved": True,
    }
    report = args.out.with_suffix(".changes.json")
    report.write_text(json.dumps(changes, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(changes, ensure_ascii=False, indent=2))
    print(f"✅ 工作 cfg：{args.out}")
    print(f"✅ 变更记录：{report}")
    print("⚠️ 仅生成工作配置，尚未运行 SU2。")


if __name__ == "__main__":
    main()
