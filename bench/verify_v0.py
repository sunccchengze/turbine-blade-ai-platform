#!/usr/bin/env python3
"""bench/verify_v0.py —— 逐题核对 bench/v0-q1-20.json 的 expected 与 evidence/ 原文。

用法：python3 bench/verify_v0.py   （在仓库根目录跑）
退出码 0 = 全部复现；1 = 有题对不上。
只依赖标准库；claims.yaml 用简单文本检查，不引入 PyYAML。
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
BENCH = ROOT / "bench" / "v0-q1-20.json"
METRICS = ROOT / "evidence" / "metrics.json"
CLAIMS = ROOT / "evidence" / "claims.yaml"


def lookup(obj, dotted):
    for key in dotted.split("."):
        obj = obj[key]
    return obj


def main() -> int:
    bench = json.loads(BENCH.read_text(encoding="utf-8"))
    metrics = json.loads(METRICS.read_text(encoding="utf-8"))
    claims_text = CLAIMS.read_text(encoding="utf-8")

    items = bench["items"]
    ok = True
    ids = [it["id"] for it in items]
    if len(items) != 20 or len(set(ids)) != 20:
        print(f"✗ 题数/ID 不对：{len(items)} 题，{len(set(ids))} 个唯一 ID")
        ok = False

    for it in items:
        qid = it["id"]
        src = it["source"]["path"]
        if not (ROOT / src).exists():
            print(f"✗ {qid}: source.path 不存在 {src}")
            ok = False
            continue
        exp = it.get("expected")
        if exp:
            for pointer, want in exp.items():
                try:
                    got = lookup(metrics, pointer)
                except KeyError:
                    print(f"✗ {qid}: metrics.json 无字段 {pointer}")
                    ok = False
                    continue
                if got != want:
                    print(f"✗ {qid}: {pointer} 期望 {want!r}，原文 {got!r}")
                    ok = False
        else:
            # 无数值的题：source 必须是 claims.yaml 或 docs/*.md，且指针里的锚点须在原文出现
            if src == "evidence/claims.yaml":
                anchor = it["source"]["pointer"].split("[id=")[1].split("]")[0] if "[id=" in it["source"]["pointer"] else "forbidden_phrases"
                if f"id: {anchor}" not in claims_text and anchor not in claims_text:
                    print(f"✗ {qid}: claims.yaml 中找不到 {anchor}")
                    ok = False
            elif src.startswith("docs/"):
                pass  # 二次来源，只检查文件存在
            else:
                print(f"✗ {qid}: 无 expected 且 source 不是 claims/docs")
                ok = False
        print(f"  {qid} [{it['grade']}] ← {src} :: {it['source']['pointer']}")

    # 额外文本核对：Q17 全部禁用短语、Q14/Q15 原文
    for phrase in ["多学科设计优化", "可制造的 Pareto 最优叶片", "校准的 95% 置信区间",
                   "PINN", "Navier-Stokes 残差约束", "全工况智能优化", "本科二年级"]:
        if f"- {phrase}" not in claims_text:
            print(f"✗ Q17: 禁用短语缺失 {phrase}")
            ok = False
    for text in ["74 维是表面统计量，不是可设计几何", "三个输出均为气动标量，故不称 MDO", "status: empty"]:
        if text not in claims_text:
            print(f"✗ claims.yaml 原文缺失：{text}")
            ok = False

    print("\n✅ 20 题全部与 evidence/ 原文一致" if ok else "\n❌ 有题对不上，见上")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
