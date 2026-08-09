"""准备隔离的 SU2 运行目录，不运行求解器、不覆盖已有结果。

用法（Windows 单行）：
  python backend/scripts/prepare_su2_run_case.py --cfg ... --mesh ... --out ...

脚本复制 cfg/mesh 及 cfg 引用的本地文件，并写入 SHA256 manifest。
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--cfg", type=Path, required=True)
    ap.add_argument("--mesh", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True)
    ap.add_argument("--inlet", type=Path, default=None)
    ap.add_argument("--mode", default="fresh-first-order")
    args = ap.parse_args()
    if args.out.exists() and any(args.out.iterdir()):
        raise SystemExit(f"输出目录非空，为防止覆盖证据而停止：{args.out}")
    args.out.mkdir(parents=True, exist_ok=True)

    cfg_text = args.cfg.read_text(encoding="utf-8", errors="replace")
    mesh_name = Path(re.search(r"^\s*MESH_FILENAME\s*=\s*(\S+)", cfg_text, re.M).group(1)) if re.search(r"^\s*MESH_FILENAME\s*=\s*(\S+)", cfg_text, re.M) else args.mesh.name
    inlet_match = re.search(r"^\s*INLET_FILENAME\s*=\s*(\S+)", cfg_text, re.M)
    inlet_name = inlet_match.group(1) if inlet_match else None

    copied = []
    mesh_dest = args.out / mesh_name.name
    shutil.copy2(args.mesh, mesh_dest)
    copied.append(mesh_dest)
    cfg_dest = args.out / args.cfg.name
    shutil.copy2(args.cfg, cfg_dest)
    copied.append(cfg_dest)
    if args.inlet is not None:
        inlet_dest = args.out / (inlet_name or args.inlet.name)
        shutil.copy2(args.inlet, inlet_dest)
        copied.append(inlet_dest)

    manifest = {
        "created_at_utc": datetime.now(timezone.utc).isoformat(),
        "mode": args.mode,
        "source_cfg": str(args.cfg),
        "source_mesh": str(args.mesh),
        "source_inlet": str(args.inlet) if args.inlet else None,
        "run_dir": str(args.out),
        "files": [{"name": p.name, "bytes": p.stat().st_size, "sha256": sha256(p)} for p in copied],
        "safety": "isolated copy; source files and prior run outputs are not modified",
    }
    (args.out / "run_manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False, indent=2))
    print(f"✅ 隔离运行目录：{args.out}")
    print(f"✅ manifest：{args.out / 'run_manifest.json'}")
    print("下一步：进入该目录后再调用 SU2_CFD.exe，不要在共享 external_su2 目录直接运行。")


if __name__ == "__main__":
    main()
