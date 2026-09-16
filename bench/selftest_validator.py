#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""bench/selftest_validator.py —— 给 validate_v0.py 做的反向自测（stdlib only）

理由：一个永远 PASS 的校验器等于没有校验器。本脚本把题库复制到临时目录后逐条注入错误，
要求 validate_v0.py 每次都退出码 1 并指名抓到那条错。任何一条注入没被抓住 → 本脚本失败。

跑法（仓库根目录）：
    python3 bench/selftest_validator.py
"""
from __future__ import annotations

import copy
import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
VALIDATOR = os.path.join(HERE, "validate_v0.py")
BENCH = os.path.join(HERE, "v0-q1-20.json")


def run(bench_obj, tmpdir: str, name: str) -> tuple[int, str]:
    path = os.path.join(tmpdir, f"mutant-{name}.json")
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(bench_obj, fh, ensure_ascii=False, indent=2)
    proc = subprocess.run(
        [sys.executable, VALIDATOR, f"--bench={path}", f"--repo={REPO}"],
        capture_output=True, text=True)
    return proc.returncode, proc.stdout + proc.stderr


MUTATIONS: list[tuple[str, str, callable]] = []


def mutation(name: str, expect_in_output: str):
    def deco(fn):
        MUTATIONS.append((name, expect_in_output, fn))
        return fn
    return deco


@mutation("wrong_number", "surrogate_holdout.r2.Efficiency")
def _(b):
    b["items"][1]["source"]["and"][0]["expect"] = 0.95


@mutation("wrong_pointer", "找不到指针")
def _(b):
    b["items"][0]["source"]["pointer"] = "split.n_tests"


@mutation("missing_source_file", "出处不存在")
def _(b):
    b["items"][12]["source"]["path"] = "evidence/metrics_typo.json"


@mutation("dropped_item", "实测 19 题")
def _(b):
    b["items"] = b["items"][:-1]


@mutation("duplicate_answer", "重复答案")
def _(b):
    b["items"][5]["answer"] = b["items"][4]["answer"]


@mutation("bad_grade", "grade")
def _(b):
    b["items"][7]["grade"] = "E4-verified"


@mutation("claims_text_drift", "块内找不到")
def _(b):
    b["items"][15]["source"]["expect"] = "status: done"


@mutation("cross_block_confusion", "块内找不到")
def _(b):
    # "status: verified" 在 C01–C07 里真实存在，但不属于 C08 —— 块匹配必须区分
    b["items"][15]["source"]["expect"] = "status: verified"


@mutation("forbidden_phrase_drift", "块内找不到")
def _(b):
    b["items"][16]["source"]["expect"] = "校准的 99% 置信区间"


@mutation("md_source_drift", "全文找不到")
def _(b):
    b["items"][18]["source"]["expect"] = "先报 T,p,ρ 再报损失"


@mutation("empty_answer", "答案为空")
def _(b):
    b["items"][9]["answer"] = "  "


def main() -> int:
    base = json.load(open(BENCH, encoding="utf-8"))
    tmpdir = tempfile.mkdtemp(prefix="bench-selftest-")
    code, out = run(base, tmpdir, "clean")
    if code != 0:
        print("FAIL 未注入错误的题库也没通过，先修题库：")
        print(out)
        return 1
    print(f"基线：未注入错误时 PASS（{out.strip().splitlines()[0]}）")

    missed = []
    for name, needle, fn in MUTATIONS:
        mutant = copy.deepcopy(base)
        fn(mutant)
        code, out = run(mutant, tmpdir, name)
        caught = code == 1 and needle in out
        print(f"  {'抓到' if caught else '漏掉'}  {name:<22} 退出码={code}")
        if not caught:
            missed.append(name)
            print("        期望输出含：" + needle)
            print("        实际输出：" + out.strip().replace("\n", " | ")[:400])

    if missed:
        print(f"FAIL {len(missed)}/{len(MUTATIONS)} 条注入错误未被校验器抓住：{missed}")
        return 1
    print(f"PASS 反向自测：{len(MUTATIONS)} 条注入错误全部被抓，校验器有效")
    return 0


if __name__ == "__main__":
    sys.exit(main())
