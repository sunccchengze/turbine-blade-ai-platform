"""从已审计 cfg 生成 SU2 部分收敛结果续算配置。

用途：使用当前目录的 restart_flow_2ndorder.dat 继续一阶 RANS，不修改原 cfg。
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


def set_or_add(text: str, key: str, value: str) -> str:
    text, n = re.subn(rf"^\s*{re.escape(key)}\s*=.*$", f"{key}= {value}", text, count=1, flags=re.M)
    if n == 0:
        text += f"\n{key}= {value}\n"
    return text


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--cfg", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True)
    ap.add_argument("--restart", default="restart_flow_2ndorder.dat")
    ap.add_argument("--iter", type=int, default=1000)
    ap.add_argument("--bounded-cfl-max", type=float, default=None,
                    help="可选：restart 后启用 bounded CFL，设置上限")
    ap.add_argument("--cfl-up", type=float, default=1.2)
    ap.add_argument("--cfl-down", type=float, default=0.5)
    args = ap.parse_args()
    text = args.cfg.read_text(encoding="utf-8", errors="replace")
    updated = set_or_add(text, "RESTART_SOL", "YES")
    updated = set_or_add(updated, "SOLUTION_FILENAME", args.restart)
    updated = set_or_add(updated, "ITER", str(args.iter))
    cfl_note = None
    if args.bounded_cfl_max is not None:
        updated = set_or_add(updated, "CFL_ADAPT", "YES")
        updated = set_or_add(updated, "CFL_NUMBER", "1.0")
        updated = set_or_add(updated, "CFL_ADAPT_PARAM", f"( {args.cfl_down}, {args.cfl_up}, 1.0, {args.bounded_cfl_max}, 0.001, 0 )")
        cfl_note = f"bounded CFL max={args.bounded_cfl_max}, up={args.cfl_up}, down={args.cfl_down}"
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(updated, encoding="utf-8", newline="")
    meta = {
        "source_cfg": str(args.cfg),
        "restart_cfg": str(args.out),
        "restart_file": args.restart,
        "additional_iterations": args.iter,
        "purpose": "continue partially converged SU2 state; not yet a convergence claim",
        "su2_restart_key": "SOLUTION_FILENAME",
        "cfl_override": cfl_note,
    }
    report = args.out.with_suffix(".changes.json")
    report.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(meta, ensure_ascii=False, indent=2))
    print(f"✅ restart cfg：{args.out}")
    print("⚠️ 续算结果仍需重新检查收敛和性能平台。")


if __name__ == "__main__":
    main()
