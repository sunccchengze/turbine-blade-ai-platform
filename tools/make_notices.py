#!/usr/bin/env python3
"""从本地 技能库&准则/ 自动起草第三方资产清单（NOTICES.md）。

用法: python tools/make_notices.py
生成的是草稿：许可证靠文件名/首行关键词自动探测，用途列留空待人工填写。
已存在的 NOTICES.md 中已填写的"用途"会被保留（按目录名匹配）。
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "技能库&准则"
OUT = ROOT / "NOTICES.md"

SPDX = [
    ("Apache-2.0", ("apache license", "apache-2.0")),
    ("MIT", ("mit license", "permission is hereby granted, free of charge")),
    ("BSD-3-Clause", ("redistribution and use in source and binary forms", "bsd 3-clause")),
    ("GPL-3.0", ("gnu general public license", "version 3")),
    ("AGPL-3.0", ("gnu affero general public license",)),
    ("MPL-2.0", ("mozilla public license",)),
    ("CC-BY-4.0", ("creative commons attribution",)),
    ("Unlicense", ("this is free and unencumbered software",)),
]


def detect(d: Path):
    """返回 (许可证文件名, SPDX 猜测)。"""
    cand = [f for f in d.iterdir()
            if f.is_file() and re.search(r"licen[cs]e|copying|notice", f.name, re.I)]
    if not cand:
        return "未找到", "待人工确认"
    f = sorted(cand, key=lambda p: len(p.name))[0]
    try:
        head = f.read_text(encoding="utf-8", errors="ignore")[:4000].lower()
    except OSError:
        head = ""
    for spdx, keys in SPDX:
        if any(k in head for k in keys):
            return f.name, spdx
    return f.name, "待人工确认"


def old_usage():
    """保留人工已填的用途列。"""
    keep = {}
    if OUT.exists():
        for line in OUT.read_text(encoding="utf-8").splitlines():
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if len(cells) == 4 and not cells[3].startswith(("（填", "用途", "---")):
                keep[cells[0].strip("`")] = cells[3]
    return keep


def main():
    if not SRC.is_dir():
        raise SystemExit(f"未找到 {SRC}（该目录已迁出公开仓时属正常，请在存档副本旁运行）")
    keep = old_usage()
    dirs = sorted((d for d in SRC.iterdir() if d.is_dir()), key=lambda p: p.name.lower())
    rows = ["| 目录 | 许可证文件 | 许可证（自动探测） | 用途（人工填） |",
            "|---|---|---|---|"]
    for d in dirs:
        lic, spdx = detect(d)
        use = keep.get(d.name, "（填：在项目里用它做了什么）")
        rows.append(f"| `{d.name}` | {lic} | {spdx} | {use} |")
    header = (
        "# 第三方资产清单（迁移存档索引）\n\n"
        "本仓曾在根目录携带 `技能库&准则/`，内含第三方 Agent Skills / 工具仓库的整仓副本。\n"
        "为保持公开仓轻量并厘清授权，这些副本已从版本控制中移出（保留在本地与私有存档），\n"
        "此处登记来源目录、许可证与在本项目中的实际用途。\n\n"
        f"- 条目数：{len(dirs)}\n"
        "- 生成方式：`python tools/make_notices.py`（许可证自动探测，用途需人工填写）\n"
        "- 许可证一栏若为「待人工确认」或「未找到」，以上游仓库页面为准。\n\n"
    )
    OUT.write_text(header + "\n".join(rows) + "\n", encoding="utf-8")
    print(f"草稿已生成：{OUT}（{len(dirs)} 条），逐行人工核对许可证与用途后提交")


if __name__ == "__main__":
    main()
