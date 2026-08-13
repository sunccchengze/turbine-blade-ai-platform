#!/usr/bin/env python3
"""Fail if public copy uses forbidden phrases or drifts from frozen metrics."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
metrics = json.loads((ROOT / "evidence/metrics.json").read_text(encoding="utf-8"))

SURFACES = [
    ROOT / "README.md",
    ROOT / "frontend/src/pages/AboutPage.jsx",
    ROOT / "frontend/src/pages/HomePage.jsx",
    ROOT / "frontend/index.html",
    ROOT / "frontend/src/App.jsx",
]

FORBIDDEN = [
    ("可制造的 Pareto 最优", "把特征空间候选写成可制造叶片"),
    ("本科二年级", "年级写错；应为能动强基 2501 / 大一升大二"),
    ("校准的 95% 置信", "MC Dropout 未校准"),
    ("完整 MDO", "三个气动输出不是 MDO"),
    ("端到端 MDO", "三个气动输出不是 MDO"),
]

MUST_HAVE_ABOUT = [
    "气动代理筛选",
    "65%",
    "不是 CST",
]

r2 = metrics["surrogate_holdout"]["r2"]
REQUIRED_NUMBERS = [
    f"{r2['Compression_ratio']:.4f}",
    f"{r2['Efficiency']:.4f}",
    f"{r2['Massflow']:.4f}",
    "0.9173",
]


def main() -> int:
    errors: list[str] = []
    about = (ROOT / "frontend/src/pages/AboutPage.jsx").read_text(encoding="utf-8")
    for token in MUST_HAVE_ABOUT:
        if token not in about:
            errors.append(f"About 缺少口径「{token}」")

    for path in SURFACES:
        if not path.exists():
            errors.append(f"缺失 {path.relative_to(ROOT)}")
            continue
        text = path.read_text(encoding="utf-8")
        rel = path.relative_to(ROOT)
        # About 可以在红线里提到「不叫多学科设计优化」
        for phrase, why in FORBIDDEN:
            if phrase in text and "AboutPage" not in path.name:
                errors.append(f"{rel}: 禁用「{phrase}」——{why}")

    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    for num in REQUIRED_NUMBERS:
        if num not in readme:
            errors.append(f"README 缺少冻结数字 {num}")

    if errors:
        print("evidence check FAILED")
        for e in errors:
            print(" -", e)
        return 1
    print("evidence check OK (phrase + frozen R²/η_max present)")
    print("decision_metrics still null; do not invent CFD budget numbers")
    return 0


if __name__ == "__main__":
    sys.exit(main())
