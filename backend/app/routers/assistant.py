"""
assistant.py
E5 LLM 设计助手 API：自然语言设计意图 → 逆设计 → 代理预测 → 解释

设计（对齐 upgrade-blueprint-D38.md §E5 / CFD-copilot arXiv 2512.07917）：
- 前端对话面板 / 生成页收集目标 → 本端点解析意图
- 解析出目标 (Efficiency/Compression_ratio/Massflow) → 逆设计搜索
- 返回最接近目标的候选设计 + 人话解释（权衡：效率↑ 通常以流量↓ 为代价）

说明：意图解析为 rule-based MVP（可升级 LLM function calling）；
设计求解走 surrogate 近邻 + L-BFGS-B（见 services/inverse_design.py）。
"""

import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict

import numpy as np

from app.model import predict_single
from app.routers.predict import INPUT_COLS
from app.services.inverse_design import inverse_design, explain_design

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
    features: Optional[List[float]] = Field(None, description="可选：74维特征，缺省走逆设计库搜索")
    n_candidates: int = Field(5, ge=1, le=20, description="返回候选数")


class GenerateRequest(BaseModel):
    """结构化目标输入（生成页专用，不经自然语言解析）。"""
    Efficiency: Optional[float] = Field(None, description="目标效率 η")
    Massflow: Optional[float] = Field(None, description="目标流量 kg/s")
    Compression_ratio: Optional[float] = Field(None, description="目标压比 π")
    n_candidates: int = Field(5, ge=1, le=20)
    refine: bool = Field(True, description="是否对最优候选做局部精修")


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


def _run_inverse(targets: Dict[str, float], n_candidates: int = 5, refine: bool = True) -> dict:
    result = inverse_design(targets, n_candidates=n_candidates, refine=refine)
    best = result["best"]
    explanations = explain_design(targets, best["predictions"])
    return {
        "status": "success",
        "parsed_intent": {"targets": targets},
        "targets": targets,
        "predictions": best["predictions"],
        "gaps": best.get("gaps", {}),
        "geometry": best.get("geometry"),
        "features": best.get("features"),
        "candidates": [
            {
                "rank": c["rank"],
                "sample_id": c["sample_id"],
                "predictions": c["predictions"],
                "gaps": c["gaps"],
                "distance": c["distance"],
                "method": c["method"],
                "refined": c["refined"],
                "geometry": c["geometry"],
            }
            for c in result["candidates"]
        ],
        "explanation": explanations,
        "mode": result["mode"],
        "library_size": result["library_size"],
    }


@router.post("/design")
async def design(request: AssistantRequest):
    """解析自然语言意图 → 逆设计 → 解释。"""
    intent = _parse_intent(request.text)
    if not intent["targets"]:
        raise HTTPException(status_code=422,
                            detail="未能从输入中解析出设计目标。示例：'帮我把效率提到 0.91，流量不低于 21'")

    # 若调用方显式传入 74 维特征：只做该点预测（兼容旧客户端），
    # 否则走真正的逆设计搜索（随目标变化）。
    if request.features:
        if len(request.features) != len(INPUT_COLS):
            raise HTTPException(status_code=422,
                                detail=f"features 需为 {len(INPUT_COLS)} 维")
        pred = predict_single(np.array(request.features, dtype=np.float32))
        explanations = explain_design(intent["targets"], pred)
        return {
            "status": "success",
            "parsed_intent": intent,
            "targets": intent["targets"],
            "predictions": pred,
            "explanation": explanations,
            "mode": "fixed-features (no inverse search)",
        }

    try:
        out = _run_inverse(intent["targets"], n_candidates=request.n_candidates)
        out["parsed_intent"] = intent
        return out
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"逆设计失败: {e}") from e


@router.post("/generate")
async def generate(request: GenerateRequest):
    """
    结构化逆设计（生成页主端点）。
    输入目标 η/π/ṁ → 返回最接近的候选设计（随目标变化）。
    """
    targets = {}
    for k in ("Efficiency", "Massflow", "Compression_ratio"):
        v = getattr(request, k)
        if v is not None:
            targets[k] = float(v)
    if not targets:
        raise HTTPException(status_code=422,
                            detail="至少提供一个目标：Efficiency / Massflow / Compression_ratio")
    try:
        return _run_inverse(targets, n_candidates=request.n_candidates, refine=request.refine)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"逆设计失败: {e}") from e
