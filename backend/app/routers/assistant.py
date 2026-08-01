"""
assistant.py
E5 LLM 设计助手 API（骨架）：自然语言设计意图 → 调参 → 代理预测 → 解释

设计（对齐 upgrade-blueprint-D38.md §E5 / CFD-copilot arXiv 2512.07917）：
- 前端对话面板收集自然语言 → 本端点解析意图（rule-based，可升级 LLM function calling）
- 解析出目标 (Efficiency/Compression_ratio/Massflow 的期望值或方向) → 调 /api/predict/
- 返回预测 + 人话解释（权衡：效率↑ 通常以流量↓ 为代价）

说明：当前为 rule-based MVP 骨架，后续可替换为 LLM API（Qwen/DeepSeek function calling）。
"""

import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
import numpy as np

from app.model import predict_single
from app.routers.predict import INPUT_COLS, FEATURE_STATS

router = APIRouter(prefix="/api/assistant", tags=["Design Assistant"])

# 基准特征（从 CSV 取中位样本，与 /baseline-features 逻辑一致）
import pandas as pd
from pathlib import Path
_BASE_DIR = Path(__file__).resolve().parent.parent.parent
_df = pd.read_csv(_BASE_DIR / "data" / "processed" / "plaid_rotor37_features.csv")
_INPUT_COLS = [c for c in _df.columns if c not in ['sample_id', 'Compression_ratio',
                                                    'Efficiency', 'Massflow']]
_X = _df[_INPUT_COLS].values
from sklearn.preprocessing import StandardScaler
_sc = StandardScaler().fit_transform(_X)
_median_idx = int(np.argmin(np.linalg.norm(_sc, axis=1)))
_BASELINE = _df[_INPUT_COLS].iloc[_median_idx].to_dict()


class AssistantRequest(BaseModel):
    text: str = Field(..., description="自然语言设计意图，如：帮我把效率提到 0.91，流量别低于 21")
    features: Optional[List[float]] = Field(None, description="可选：74维特征，缺省用基准")


def _parse_intent(text: str):
    """优先 LLM 解析（若配置 API key），否则 rule-based MVP。"""
    try:
        from app.services.llm_design import llm_available, parse_intent_with_llm
        if llm_available():
            parsed = parse_intent_with_llm(text)
            targets = parsed.get("targets", {})
            targets = {k: float(v) for k, v in targets.items()
                       if k in ("Efficiency", "Massflow", "Compression_ratio")}
            if targets:
                return {"targets": targets, "llm": True,
                        "notes": parsed.get("notes", "")}
    except Exception:
        pass  # 回退 rule-based
    return _parse_intent_rule(text)


def _parse_intent_rule(text: str):
    """rule-based 意图解析（MVP）：识别 效率/流量/压比 + 目标值或方向。"""
    intent = {"targets": {}}
    patterns = {
        "Efficiency":        r"(效率|efficiency)\s*(?:提到|达到|设为|到|≥|>=)?\s*(\d+(?:\.\d+)?)",
        "Massflow":          r"(流量|mass\s*flow)\s*(?:提到|达到|设为|不低于|到|≥|>=)?\s*(\d+(?:\.\d+)?)",
        "Compression_ratio": r"(压比|compression)\s*(?:提到|达到|设为|到|≥|>=)?\s*(\d+(?:\.\d+)?)",
    }
    for key, pat in patterns.items():
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            intent["targets"][key] = float(m.group(2))
    # 方向意图
    if re.search(r"效率.*(高|提高|提升)", text, re.IGNORECASE):
        intent.setdefault("directions", []).append("Efficiency up")
    if re.search(r"流量.*(低|低点|别低|不低于|保持)", text, re.IGNORECASE):
        intent.setdefault("directions", []).append("Massflow >= target")
    return intent


@router.post("/design")
async def design(request: AssistantRequest):
    """解析自然语言意图 → 预测 → 解释。"""
    intent = _parse_intent(request.text)
    if not intent["targets"]:
        raise HTTPException(status_code=422,
                            detail="未能从输入中解析出设计目标。示例：'帮我把效率提到 0.91，流量不低于 21'")

    if request.features:
        base = dict(zip(INPUT_COLS, request.features))
    else:
        base = dict(_BASELINE)

    pred = predict_single(np.array([base[c] for c in INPUT_COLS]))

    # 人话解释（trade-off 说明）
    explanations = []
    if "Efficiency" in intent["targets"]:
        t = intent["targets"]["Efficiency"]
        d = pred["Efficiency"] - t
        explanations.append(f"当前方案效率 {pred['Efficiency']:.4f}"
                            + ("，已达目标" if d >= 0 else f"，距目标还差 {-d:.4f}"))
    if "Massflow" in intent["targets"]:
        t = intent["targets"]["Massflow"]
        d = pred["Massflow"] - t
        explanations.append(f"当前方案流量 {pred['Massflow']:.2f} kg/s"
                            + ("，满足要求" if d >= 0 else f"，低于目标 {t:.1f}"))
    # 权衡提示
    explanations.append("注：效率与流量存在 Pareto 权衡，提升效率通常伴随流量下降。")

    return {
        "status": "success",
        "parsed_intent": intent,
        "predictions": pred,
        "explanation": explanations,
        "mode": "rule-based MVP (可升级 LLM function calling)",
    }
