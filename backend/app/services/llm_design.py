"""
llm_design.py
E5 设计助手 LLM 后端（Day 39 新增，可选升级）

rule-based MVP → 可切换 LLM function calling：
- 设置环境变量 LLM_API_KEY / LLM_BASE_URL（如 DeepSeek/Qwen OpenAI 兼容端点）
- 未设置时回退 rule-based（现有 /api/assistant/design 逻辑不变）

实现：自然语言 → LLM 解析设计目标（结构化 JSON）→ 调代理预测 → 人话解释
"""

import json
import os
import re

# ── 配置 ──────────────────────────────────────────────────
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.deepseek.com/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "deepseek-chat")


def llm_available() -> bool:
    return bool(LLM_API_KEY)


def parse_intent_with_llm(text: str) -> dict:
    """调 LLM 把自然语言解析成设计目标 JSON。失败回退 rule-based。"""
    if not llm_available():
        raise RuntimeError("LLM_API_KEY 未设置")

    import httpx
    prompt = f"""你是叶轮机械设计助手。从用户的设计意图中提取目标性能，输出 JSON：
{{"targets": {{"Efficiency": 0.91, "Massflow": 21.0, "Compression_ratio": 2.0}},
 "constraints": "流量不低于21", "notes": "可选说明"}}
只输出 JSON，不要其他文字。用户输入：{text}"""

    resp = httpx.post(
        f"{LLM_BASE_URL}/chat/completions",
        headers={"Authorization": f"Bearer {LLM_API_KEY}"},
        json={"model": LLM_MODEL,
              "messages": [{"role": "user", "content": prompt}],
              "temperature": 0.1},
        timeout=30,
    )
    resp.raise_for_status()
    content = resp.json()["choices"][0]["message"]["content"]
    # 提取 JSON 块
    m = re.search(r"\{.*\}", content, re.DOTALL)
    if not m:
        raise ValueError("LLM 未返回 JSON")
    return json.loads(m.group(0))
