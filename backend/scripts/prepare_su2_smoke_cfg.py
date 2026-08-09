"""从已审计的 Rotor37 工作 cfg 生成有限迭代 smoke cfg。

只用于验证 SU2 网格/marker/profile/初始化链路，不用于性能结论。
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--cfg", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True)
    ap.add_argument("--iter", type=int, default=20)
    args = ap.parse_args()
    text = args.cfg.read_text(encoding="utf-8", errors="replace")
    if not re.search(r"^\s*SOLVER\s*=\s*RANS", text, flags=re.M):
        raise SystemExit("输入 cfg 不是 SOLVER=RANS，停止生成 smoke 配置")
    if not re.search(r"^\s*MESH_FILENAME\s*=", text, flags=re.M):
        raise SystemExit("输入 cfg 缺少 MESH_FILENAME")
    updated, n = re.subn(
        r"^\s*ITER\s*=.*$",
        f"ITER= {args.iter}",
        text,
        count=1,
        flags=re.M,
    )
    if n == 0:
        updated += f"\nITER= {args.iter}\n"
    updated += "\n% Generated smoke-only config: do not use for scientific performance claims.\n"
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(updated, encoding="utf-8", newline="")
    meta = {
        "source_cfg": str(args.cfg),
        "smoke_cfg": str(args.out),
        "iterations": args.iter,
        "purpose": "SU2 mesh/marker/profile/initialization smoke only",
        "scientific_result": False,
    }
    report = args.out.with_suffix(".changes.json")
    report.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(meta, ensure_ascii=False, indent=2))
    print(f"✅ smoke cfg：{args.out}")
    print("⚠️ smoke 输出不是 RANS 性能结果。")


if __name__ == "__main__":
    main()
