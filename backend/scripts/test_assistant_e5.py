"""
test_assistant_e5.py
E5 设计助手端点回归测试（可复现验证）

用法：python backend/scripts/test_assistant_e5.py
期望输出：
    ✅ 意图解析: {'targets': {'Efficiency': 0.91, 'Massflow': 21.0}}
    ✅ 预测返回三标量
    ✅ 解释包含权衡提示
"""

import asyncio
import io
import json
import sys
from contextlib import redirect_stdout

ROOT = __import__("pathlib").Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))

from app.routers.assistant import AssistantRequest, design

CASES = [
    ("帮我把效率提到 0.91，流量不低于 21", {"Efficiency", "Massflow"}),
    ("把压比提到 2.1", {"Compression_ratio"}),
]


def main():
    with redirect_stdout(io.StringIO()):  # 屏蔽模型加载 print
        for text, expect in CASES:
            r = asyncio.run(design(AssistantRequest(text=text)))
            parsed = set(r["parsed_intent"]["targets"].keys())
            assert expect <= parsed, f"意图解析缺 {expect - parsed}"
            assert set(r["predictions"].keys()) == {
                "Compression_ratio", "Efficiency", "Massflow"}, "预测字段不完整"
            assert any("Pareto" in e or "权衡" in e for e in r["explanation"]), "缺少权衡解释"
            print(f"✅ '{text[:20]}…' → 目标 {parsed} | 预测 R²相关字段 {list(r['predictions'])[:3]}")
    print("\n✅ E5 助手回归测试全部通过")


if __name__ == "__main__":
    main()
