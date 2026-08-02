"""
test_assistant_e5.py
E5 设计助手 + 逆设计端点回归测试（可复现验证）

用法：python backend/scripts/test_assistant_e5.py
期望：
    ✅ 意图解析正确
    ✅ 不同目标 → 不同预测（不再是固定基准）
    ✅ /generate 结构化端点可用
    ✅ 解释包含权衡提示
"""

import asyncio
import io
import sys
from contextlib import redirect_stdout

ROOT = __import__("pathlib").Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))

from app.routers.assistant import AssistantRequest, GenerateRequest, design, generate

NL_CASES = [
    ("帮我把效率提到 0.91，流量不低于 21", {"Efficiency", "Massflow"}),
    ("把压比提到 2.1", {"Compression_ratio"}),
]


def main():
    with redirect_stdout(io.StringIO()):  # 屏蔽模型加载 print
        for text, expect in NL_CASES:
            r = asyncio.run(design(AssistantRequest(text=text)))
            parsed = set(r["parsed_intent"]["targets"].keys())
            assert expect <= parsed, f"意图解析缺 {expect - parsed}"
            assert set(r["predictions"].keys()) == {
                "Compression_ratio", "Efficiency", "Massflow"}, "预测字段不完整"
            assert any("Pareto" in e or "权衡" in e for e in r["explanation"]), "缺少权衡解释"
            assert "candidates" in r and len(r["candidates"]) >= 1, "应返回候选"
            print(f"✅ NL '{text[:20]}…' → 目标 {parsed} | η={r['predictions']['Efficiency']:.4f}")

        # 核心：不同目标必须产生不同结果（修「永远 0.8766」）
        g1 = asyncio.run(generate(GenerateRequest(
            Efficiency=0.89, Massflow=19.5, Compression_ratio=2.05, n_candidates=3)))
        g2 = asyncio.run(generate(GenerateRequest(
            Efficiency=0.86, Massflow=20.5, Compression_ratio=1.90, n_candidates=3)))
        p1, p2 = g1["predictions"], g2["predictions"]
        same = (
            abs(p1["Efficiency"] - p2["Efficiency"]) < 1e-6
            and abs(p1["Massflow"] - p2["Massflow"]) < 1e-6
            and abs(p1["Compression_ratio"] - p2["Compression_ratio"]) < 1e-6
        )
        assert not same, f"不同目标却返回相同预测: {p1} vs {p2}"
        print(f"✅ 目标敏感性: A η={p1['Efficiency']:.4f}/ṁ={p1['Massflow']:.2f} "
              f"≠ B η={p2['Efficiency']:.4f}/ṁ={p2['Massflow']:.2f}")

        # 高效率目标应比低效率目标更接近高 η
        assert p1["Efficiency"] > p2["Efficiency"] - 0.005, \
            "高效率目标的最优方案效率应不低于低效率目标方案"
        print(f"✅ 方向一致性: 高η目标 → η={p1['Efficiency']:.4f} ≥ 低η目标 → η={p2['Efficiency']:.4f}")

        assert g1["candidates"][0]["geometry"], "候选应含 geometry"
        print(f"✅ 候选数={g1['n_candidates'] if 'n_candidates' in g1 else len(g1['candidates'])} · mode={g1['mode']}")

    print("\n✅ E5 助手 + 逆设计回归测试全部通过")


if __name__ == "__main__":
    main()
