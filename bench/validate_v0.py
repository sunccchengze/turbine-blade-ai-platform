#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""bench/validate_v0.py —— S1 基准题库自检器（stdlib only，无第三方依赖）

跑法（仓库根目录）：
    python3 bench/validate_v0.py            # 结构 + 出处复现 + 原始产物交叉复算
    python3 bench/validate_v0.py --quiet    # 只在失败时输出

做三件事：
  1) 结构：schema、20 题、id 唯一且为 Q01..Q20、question/answer 非空、answer 全表唯一、grade 合法。
  2) 出处：每题 source（含 and 追加项）的 path 必须存在；JSON 走点路径精确取值比对，
     YAML 走「块内子串」比对，MD 走全文子串比对。→ 抄错一个数字就会红。
  3) 交叉复算：从 data/processed/*.csv 重算 Pareto 极值、覆盖率、mean σ、样本数与均值，
     与 evidence/metrics.json 的冻结值逐一对账（铁律 4：引用数字前先自己复现）。
"""
from __future__ import annotations

import csv
import json
import os
import re
import statistics
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BENCH = os.path.join(REPO, "bench", "v0-q1-20.json")
EXPECTED_IDS = [f"Q{i:02d}" for i in range(1, 21)]
VALID_GRADES = {"E0", "E1", "E2", "E3", "E4", "rule", "secondary"}
TOL = 5e-5

failures: list[str] = []
checks = 0


def ok(cond: bool, label: str, detail: str = "") -> None:
    global checks
    checks += 1
    if not cond:
        failures.append(f"{label}{(' :: ' + detail) if detail else ''}")


def rel(p: str) -> str:
    return os.path.relpath(p, REPO)


def read_text(path: str) -> str:
    with open(os.path.join(REPO, path), encoding="utf-8") as fh:
        return fh.read()


# ---------------------------------------------------------------- JSON 点路径
def resolve_json(obj, pointer: str):
    cur = obj
    for part in pointer.split("."):
        if isinstance(cur, list):
            cur = cur[int(part)]
        elif isinstance(cur, dict) and part in cur:
            cur = cur[part]
        else:
            return False, None
    return True, cur


def same(a, b) -> bool:
    if isinstance(a, bool) or isinstance(b, bool):
        return a is b or a == b
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return abs(float(a) - float(b)) <= TOL
    return a == b


# ---------------------------------------------------------------- YAML 块定位
def yaml_block(text: str, pointer: str) -> str | None:
    """把 claims[id=C08].status 这类指针解析成一段文本块，供子串比对。"""
    lines = text.splitlines()
    m = re.fullmatch(r"([A-Za-z_][\w-]*)\[(\w+)=([^\]]+)\](?:\.(\w+))?", pointer)
    if m:
        key, fk, fv, _field = m.groups()
        start = None
        for i, ln in enumerate(lines):
            if re.search(rf"^\s*-\s*{fk}:\s*{re.escape(fv)}\s*$", ln):
                start = i
                break
        if start is None:
            return None
        indent = len(lines[start]) - len(lines[start].lstrip())
        block = [lines[start]]
        for ln in lines[start + 1:]:
            if not ln.strip():
                continue
            cur_indent = len(ln) - len(ln.lstrip())
            if cur_indent <= indent and ln.lstrip().startswith("-"):
                break
            if cur_indent < indent:
                break
            block.append(ln)
        return "\n".join(block)

    if re.fullmatch(r"[A-Za-z_][\w-]*", pointer):  # 顶层键，如 forbidden_phrases
        start = None
        for i, ln in enumerate(lines):
            if re.fullmatch(rf"{re.escape(pointer)}:\s*", ln):
                start = i
                break
        if start is None:
            return None
        block = [lines[start]]
        for ln in lines[start + 1:]:
            if ln.strip() and not (ln[0].isspace() or ln.lstrip().startswith("-")):
                break
            block.append(ln)
        return "\n".join(block)
    return None


# ---------------------------------------------------------------- 单条出处核验
def check_ref(item_id: str, ref: dict, tag: str) -> None:
    path = ref.get("path")
    pointer = ref.get("pointer")
    expect = ref.get("expect")
    kind = ref.get("kind", "auto")
    ok(bool(path), f"{item_id}/{tag}", "缺 path")
    ok(bool(pointer), f"{item_id}/{tag}", "缺 pointer")
    if not path:
        return
    full = os.path.join(REPO, path)
    if not os.path.isfile(full):
        ok(False, f"{item_id}/{tag}", f"出处不存在：{path}")
        return
    ext = os.path.splitext(path)[1].lower()
    if kind == "auto":
        kind = {"json": "json", "yaml": "yaml", "yml": "yaml"}.get(ext.lstrip("."), "text")
    if ext == ".json" and kind != "text":
        found, val = resolve_json(json.loads(read_text(path)), pointer)
        ok(found, f"{item_id}/{tag}", f"{path} 里找不到指针 {pointer}")
        if found:
            ok(same(val, expect), f"{item_id}/{tag}",
               f"{pointer} 实测 {val!r}，题库写 {expect!r}")
        return
    text = read_text(path)
    if ext in (".yaml", ".yml") and kind != "text":
        block = yaml_block(text, pointer)
        if block is None:
            ok(False, f"{item_id}/{tag}", f"{path} 里定位不到 {pointer}")
            return
        ok(str(expect) in block, f"{item_id}/{tag}",
           f"{pointer} 块内找不到 {expect!r}")
        return
    ok(str(expect) in text, f"{item_id}/{tag}", f"{path} 全文找不到 {expect!r}")


# ---------------------------------------------------------------- 结构核验
def check_structure(bench: dict) -> None:
    ok(bench.get("schema") == "turbine-bench/v0", "schema", str(bench.get("schema")))
    ok(bool(re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(bench.get("created", "")))),
       "created", str(bench.get("created")))
    items = bench.get("items", [])
    ok(len(items) == 20, "items", f"实测 {len(items)} 题，要求 20 题")
    ids = [it.get("id") for it in items]
    ok(ids == EXPECTED_IDS, "ids", f"实测 {ids[:3]}...{ids[-2:]}")
    ok(len(set(ids)) == len(ids), "ids 唯一性", "存在重复 id")

    answers = [str(it.get("answer", "")).strip() for it in items]
    dup = {a for a in answers if answers.count(a) > 1}
    ok(not dup, "answer 全表唯一", f"重复答案：{sorted(dup)}")

    for it in items:
        iid = it.get("id", "?")
        ok(len(str(it.get("question", "")).strip()) >= 8, f"{iid}/question", "题干过短")
        ok(len(str(it.get("answer", "")).strip()) >= 1, f"{iid}/answer", "答案为空")
        ok(it.get("grade") in VALID_GRADES, f"{iid}/grade", str(it.get("grade")))
        src = it.get("source") or {}
        ok("expect" in src, f"{iid}/source", "主出处缺 expect")
        if src:
            check_ref(iid, src, "source")
        for j, extra in enumerate(src.get("and", []) or []):
            check_ref(iid, extra, f"and[{j}]")


# ---------------------------------------------------------------- 交叉复算
def crosscheck(bench: dict) -> None:
    """从原始产物重算，与 evidence/metrics.json 冻结值对账。"""
    metrics = json.loads(read_text("evidence/metrics.json"))
    by_id = {it["id"]: it for it in bench["items"]}

    pareto = list(csv.DictReader(open(os.path.join(REPO, "data/processed/pareto_front_solutions.csv"),
                                     encoding="utf-8")))
    ns = metrics["nsga2_surrogate"]
    ok(len(pareto) == ns["n_nondominated"], "X/pareto 行数",
       f"实测 {len(pareto)}，冻结 {ns['n_nondominated']}")
    for col, field in (("Efficiency", "max_eta"), ("Massflow", "max_massflow"),
                       ("Compression_ratio", "max_pi")):
        got = max(float(r[col]) for r in pareto)
        ok(same(got, ns[field]), f"X/{field}", f"重算 {got}，冻结 {ns[field]}")
    max_eta = same(max(float(r["Efficiency"]) for r in pareto), by_id["Q08"]["source"]["expect"])
    ok(max_eta, "Q08/answer", "题库 Q08 答案与 CSV 重算不一致")

    uq = list(csv.DictReader(open(os.path.join(REPO, "data/processed/uq_test_results.csv"),
                                  encoding="utf-8")))
    mc = metrics["mc_dropout_heuristic"]
    for ch in ("Compression_ratio", "Efficiency", "Massflow"):
        cov = sum(1 for r in uq
                  if float(r[f"{ch}_lower"]) <= float(r[f"{ch}_true"]) <= float(r[f"{ch}_upper"])) / len(uq)
        ok(same(round(cov, 2), mc["empirical_coverage"][ch]), f"X/coverage.{ch}",
           f"重算 {cov:.2f}，冻结 {mc['empirical_coverage'][ch]}")
        sig = statistics.mean(float(r[f"{ch}_sigma"]) for r in uq)
        ok(same(round(sig, 4), mc["mean_sigma"][ch]), f"X/mean_sigma.{ch}",
           f"重算 {sig:.4f}，冻结 {mc['mean_sigma'][ch]}")
    ok(len(uq) == metrics["split"]["n_test"], "X/uq 行数",
       f"实测 {len(uq)}，冻结 n_test {metrics['split']['n_test']}")

    scal = list(csv.DictReader(open(os.path.join(REPO, "data/processed/plaid_rotor37_scalars.csv"),
                                    encoding="utf-8")))
    sp = metrics["split"]
    ok(len(scal) == sp["n_train"] + sp["n_val"] + sp["n_test"], "X/scalars 行数",
       f"实测 {len(scal)}，划分合计 {sp['n_train'] + sp['n_val'] + sp['n_test']}")
    mean_eta = statistics.mean(float(r["Efficiency"]) for r in scal)
    ok(same(round(mean_eta, 4), ns["train_mean_eta"]), "X/train_mean_eta",
       f"全 1000 行 η 均值 {mean_eta:.4f}，冻结 {ns['train_mean_eta']}")

    # Q09 的口径矛盾必须仍然成立（一旦有人改了 evidence，这条会提示重新对齐）
    gap = ns["max_eta"] - ns["train_mean_eta"]
    ok(not same(gap, ns["delta_eta_vs_train_mean"]), "F1/仍然不自洽",
       f"max_eta − train_mean_eta 现在等于 {gap:.4f}，与 delta 字段一致了，请更新 Q09 与 flags.F1")


def main() -> int:
    global REPO
    quiet = "--quiet" in sys.argv
    bench_path = BENCH
    for arg in sys.argv[1:]:
        if arg.startswith("--bench="):
            bench_path = os.path.abspath(arg.split("=", 1)[1])
        elif arg.startswith("--repo="):
            REPO = os.path.abspath(arg.split("=", 1)[1])
    with open(bench_path, encoding="utf-8") as fh:
        bench = json.load(fh)
    check_structure(bench)
    crosscheck(bench)

    n_items = len(bench.get("items", []))
    if failures:
        print(f"FAIL {len(failures)}/{checks} 项未通过（{n_items} 题）")
        for f in failures:
            print("  -", f)
        return 1
    if not quiet:
        print(f"PASS {checks} 项检查全通过：{n_items} 题 / 出处全部可翻 / 原始产物交叉复算一致")
        print(f"      题库 {rel(bench_path)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
