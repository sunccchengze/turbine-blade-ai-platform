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
    ap.add_argument("--fixed-cfl", action="store_true",
                    help="关闭 CFL 自适应并固定 CFL_NUMBER=1，适合 RANS 稳定性诊断")
    ap.add_argument("--bounded-cfl", action="store_true",
                    help="保守 CFL 自适应：初始1、下降0.5、增长1.2、上限由 --cfl-max 指定")
    ap.add_argument("--cfl-max", type=float, default=5.0,
                    help="bounded CFL 上限，默认 5")
    ap.add_argument("--cfl-up", type=float, default=1.2,
                    help="bounded CFL 增长因子，默认 1.2")
    ap.add_argument("--cfl-down", type=float, default=0.5,
                    help="bounded CFL 下降因子，默认 0.5")
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
    # Smoke must initialize from the configured freestream, never require an
    # external restart artifact that may not exist on a clean machine.
    updated, restart_n = re.subn(
        r"^\s*RESTART_SOL\s*=.*$",
        "RESTART_SOL= NO",
        updated,
        count=1,
        flags=re.M,
    )
    if restart_n == 0:
        updated += "\nRESTART_SOL= NO\n"
    if n == 0:
        updated += f"\nITER= {args.iter}\n"
    # Ensure the full-machine analysis marker survives every derived cfg.
    updated, analyze_n = re.subn(
        r"^\s*MARKER_ANALYZE\s*=.*$",
        "MARKER_ANALYZE= ( INLET, OUTLET )",
        updated, count=1, flags=re.M)
    if analyze_n == 0:
        updated += "\nMARKER_ANALYZE= ( INLET, OUTLET )\n"
    cfl_replacements = []
    if args.fixed_cfl and args.bounded_cfl:
        raise SystemExit("--fixed-cfl 与 --bounded-cfl 不能同时使用")
    if args.fixed_cfl:
        updated, _ = re.subn(r"^\s*CFL_ADAPT\s*=.*$", "CFL_ADAPT= NO", updated, count=1, flags=re.M)
        updated, _ = re.subn(r"^\s*CFL_NUMBER\s*=.*$", "CFL_NUMBER= 1.0", updated, count=1, flags=re.M)
        cfl_replacements = ["CFL_ADAPT -> NO", "CFL_NUMBER -> 1.0"]
    elif args.bounded_cfl:
        updated, _ = re.subn(r"^\s*CFL_ADAPT\s*=.*$", "CFL_ADAPT= YES", updated, count=1, flags=re.M)
        updated, _ = re.subn(r"^\s*CFL_NUMBER\s*=.*$", "CFL_NUMBER= 1.0", updated, count=1, flags=re.M)
        updated, n_cfl = re.subn(
            r"^\s*CFL_ADAPT_PARAM\s*=.*$",
            f"CFL_ADAPT_PARAM= ( {args.cfl_down}, {args.cfl_up}, 1.0, {args.cfl_max}, 0.001, 0 )",
            updated, count=1, flags=re.M)
        if n_cfl == 0:
            updated += "\nCFL_ADAPT_PARAM= ( 0.5, 1.2, 1.0, 5.0, 0.001, 0 )\n"
        cfl_replacements = [f"CFL_ADAPT -> YES", f"CFL_NUMBER -> 1.0", f"CFL_ADAPT_PARAM -> ({args.cfl_down},{args.cfl_up},1.0,{args.cfl_max},0.001,0)"]
    updated += "\n% Generated smoke-only config: do not use for scientific performance claims.\n"
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(updated, encoding="utf-8", newline="")
    meta = {
        "source_cfg": str(args.cfg),
        "smoke_cfg": str(args.out),
        "iterations": args.iter,
        "fixed_cfl": args.fixed_cfl,
        "bounded_cfl": args.bounded_cfl,
        "cfl_replacements": cfl_replacements,
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
