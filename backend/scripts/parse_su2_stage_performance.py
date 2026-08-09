"""从 SU2 stdout 日志提取 Turbomachinery Stage Performance 的 MACHINE 行。

不改变科学口径：脚本同时读取 Converged 状态，若未收敛则明确标记结果为
non-converged diagnostic，而不是最终 CFD 性能。
"""
from __future__ import annotations

import argparse
import csv
import json
import re
from pathlib import Path

MACHINE = re.compile(
    r"\|\s*MACHINE\s*\|\s*([-+0-9.eE]+)\s*\|\s*([-+0-9.eE]+)\s*\|\s*([-+0-9.eE]+)\s*\|\s*([-+0-9.eE]+)\s*\|\s*([-+0-9.eE]+)\s*\|\s*([-+0-9.eE]+)\s*\|"
)
INNER = re.compile(r"\|\s*(\d+)\s*\|\s*[-+0-9.eE]+\s*\|")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--log", type=Path, required=True)
    ap.add_argument("--out", type=Path, default=None)
    args = ap.parse_args()
    text = args.log.read_text(encoding="utf-8", errors="replace")
    rows = []
    for match in MACHINE.finditer(text):
        values = [float(x) for x in match.groups()]
        prefix = text[:match.start()]
        iters = list(INNER.finditer(prefix))
        inner = int(iters[-1].group(1)) if iters else None
        rows.append({
            "inner_iter": inner,
            "Sgen_pct": values[0],
            "Work_J_per_kg": values[1],
            "Efi_ts_pct": values[2],
            "Efi_tt_pct": values[3],
            "PR_ts": values[4],
            "PR_tt": values[5],
        })
    converged = bool(re.search(r"Converged\s*\|\s*Yes", text, re.I))
    result = {
        "log": str(args.log),
        "stage_performance_rows": rows,
        "count": len(rows),
        "converged": converged,
        "interpretation": "final CFD performance" if converged else "non-converged diagnostic trend",
    }
    out = args.out or args.log.with_name("stage_performance.json")
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    csv_path = out.with_suffix(".csv")
    if rows:
        with csv_path.open("w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=list(rows[0]))
            writer.writeheader(); writer.writerows(rows)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"✅ JSON：{out}")
    if rows:
        print(f"✅ CSV：{csv_path}")
    if not converged:
        print("⚠️ 日志未显示 Converged=Yes，结果只能作为未收敛趋势诊断。")


if __name__ == "__main__":
    main()
