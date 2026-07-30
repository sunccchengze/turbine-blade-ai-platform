"""
predict.py
预测相关的 API 路由
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import numpy as np
from app.model import predict_single, predict_with_uncertainty

router = APIRouter(prefix="/api/predict", tags=["Prediction"])


# ── 请求/响应数据模型 ──────────────────────────────────────
class PredictRequest(BaseModel):
    """单次预测请求"""
    features: List[float] = Field(
        ...,
        description="74维特征向量（原始量纲）",
        min_length=74,
        max_length=74
    )
    include_uncertainty: bool = Field(
        default=False,
        description="是否包含MC Dropout不确定性估计"
    )
    n_mc_samples: int = Field(
        default=100,
        description="MC Dropout采样次数（仅当include_uncertainty=True时有效）",
        ge=10,
        le=500
    )


class PerformanceOutput(BaseModel):
    """单个性能指标（确定性）"""
    value: float


class UncertaintyOutput(BaseModel):
    """单个性能指标（带不确定性）"""
    mean:     float
    std:      float
    lower_95: float
    upper_95: float


class PredictResponse(BaseModel):
    """预测响应"""
    Compression_ratio: dict
    Efficiency:        dict
    Massflow:          dict
    model_version:     str = "ResidualSurrogate-v2"


# ── 端点定义 ───────────────────────────────────────────────
@router.post("/", response_model=dict)
async def predict(request: PredictRequest):
    """
    叶片气动性能预测

    输入：74维特征向量
    输出：压比、效率、质量流量的预测值（可选带置信区间）
    """
    features = np.array(request.features)

    if request.include_uncertainty:
        # MC Dropout 预测
        result = predict_with_uncertainty(
            features,
            n_samples=request.n_mc_samples
        )
        return {
            "status":         "success",
            "mode":           "uncertainty",
            "n_mc_samples":   request.n_mc_samples,
            "predictions":    result,
            "model_version":  "ResidualSurrogate-v2-MC",
        }
    else:
        # 确定性预测
        result = predict_single(features)
        return {
            "status":       "success",
            "mode":         "deterministic",
            "predictions":  {k: {"value": v} for k, v in result.items()},
            "model_version": "ResidualSurrogate-v2",
        }


@router.get("/health")
async def health_check():
    """健康检查端点"""
    return {
        "status":  "healthy",
        "model":   "ResidualSurrogateModel",
        "version": "v2",
    }


@router.get("/model-info")
async def model_info():
    """返回模型基本信息"""
    return {
        "model_name":    "ResidualSurrogateModel",
        "version":       "v2",
        "input_dim":     74,
        "output_dim":    3,
        "outputs":       ["Compression_ratio", "Efficiency", "Massflow"],
        "r2_scores": {
            "Compression_ratio": 0.9861,
            "Efficiency":        0.9588,
            "Massflow":          0.9845,
        },
        "physics_constraints": [
            "Efficiency ≤ 1.0",
            "Efficiency ≥ 0.5",
            "Compression_ratio ≥ 1.0",
            "Massflow ≥ 0.0",
        ],
        "training_data": "NASA Rotor 37 (PLAID Dataset, 1000 samples)",
    }
@router.get("/baseline-features")
async def get_baseline_features():
    """
    返回基准样本的74维特征向量
    前端用这个作为滑块的初始值
    """
    import pandas as pd
    from pathlib import Path

    features_path = (
        Path(__file__).resolve().parent.parent.parent
        / "data" / "processed" / "plaid_rotor37_features.csv"
    )

    df = pd.read_csv(features_path)

    # 取中位数样本作为基准（最具代表性）
    input_cols = [c for c in df.columns
                  if c not in ['sample_id', 'Compression_ratio',
                               'Efficiency', 'Massflow']]

    # 找最接近均值的样本
    from sklearn.preprocessing import StandardScaler
    import numpy as np

    X = df[input_cols].values
    scaler = StandardScaler()
    X_sc   = scaler.fit_transform(X)
    dists  = np.linalg.norm(X_sc, axis=1)
    median_idx = int(np.argmin(dists))

    baseline = df[input_cols].iloc[median_idx].to_dict()
    true_perf = {
        'Compression_ratio': float(df['Compression_ratio'].iloc[median_idx]),
        'Efficiency':        float(df['Efficiency'].iloc[median_idx]),
        'Massflow':          float(df['Massflow'].iloc[median_idx]),
    }

    # 同时返回数据集的统计范围（用于滑块的 min/max）
    stats = {}
    for col in input_cols:
        stats[col] = {
            'min':  float(df[col].min()),
            'max':  float(df[col].max()),
            'mean': float(df[col].mean()),
        }

    return {
        'status':        'success',
        'baseline_idx':  median_idx,
        'features':      baseline,
        'feature_names': input_cols,
        'true_performance': true_perf,
        'stats':         stats,
    }