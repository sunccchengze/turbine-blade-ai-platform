"""
predict.py
预测相关的 API 路由
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import time
import numpy as np
from app.model import (
    predict_single, predict_with_uncertainty, predict_batch,
    INPUT_COLS, OUTPUT_COLS, FEATURE_STATS,
)

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
        # 留出测试集 (n=100, random_state=42) 上由本 ONNX 模型实测，
        # 可用 README「快速复现 §3」重跑验证。
        "r2_scores": {
            "Compression_ratio": 0.9844,
            "Efficiency":        0.9561,
            "Massflow":          0.9827,
        },
        "r2_evaluated_on": "held-out test set (n=100, random_state=42)",
        "physics_constraints": [
            "Efficiency ≤ 1.0",
            "Efficiency ≥ 0.5",
            "Compression_ratio ≥ 1.0",
            "Massflow ≥ 0.0",
        ],
        "training_data": "NASA Rotor 37 (PLAID Dataset, 1000 samples)",
    }
class SweepRequest(BaseModel):
    """设计空间二维扫描请求（设计空间探索热力图的数据源）"""
    base_features: List[float] = Field(
        ...,
        description="74维基准特征向量，非扫描维度固定取这里的值",
        min_length=74,
        max_length=74,
    )
    param_x: str = Field(..., description="X轴扫描参数名（必须是74个输入特征之一）")
    param_y: str = Field(..., description="Y轴扫描参数名（必须与param_x不同）")
    x_values: List[float] = Field(..., min_length=2, max_length=40)
    y_values: List[float] = Field(..., min_length=2, max_length=40)
    output:   str = Field(
        default="Efficiency",
        description="扫描的输出指标：Compression_ratio | Efficiency | Massflow",
    )


@router.post("/sweep")
async def sweep_design_space(request: SweepRequest):
    """
    设计空间二维参数扫描（MDO 敏感性分析的核心端点）

    将 base_features 中除 (param_x, param_y) 外的 72 个维度固定，
    在 x×y 网格上批量推理，返回性能响应面 z[y][x]。
    前端据此渲染设计空间热力图。

    越界保护：扫描值超出训练数据观测范围时返回 422，
    因为代理模型在外推区域的预测物理上不可信。
    """
    # ── 校验：参数名合法且互不相同 ─────────────────────────
    if request.param_x == request.param_y:
        raise HTTPException(
            status_code=422,
            detail=f"param_x 和 param_y 不能相同（都是 '{request.param_x}'）",
        )
    for name in (request.param_x, request.param_y):
        if name not in INPUT_COLS:
            raise HTTPException(
                status_code=422,
                detail=f"未知特征 '{name}'。合法特征名见 /api/predict/baseline-features 的 feature_names",
            )
    if request.output not in OUTPUT_COLS:
        raise HTTPException(
            status_code=422,
            detail=f"未知输出 '{request.output}'，可选：{OUTPUT_COLS}",
        )

    # ── 校验：扫描范围不得外推出训练分布 ───────────────────
    for name, values in ((request.param_x, request.x_values),
                         (request.param_y, request.y_values)):
        lo, hi = FEATURE_STATS[name]
        vmin, vmax = min(values), max(values)
        if vmin < lo or vmax > hi:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"'{name}' 扫描范围 [{vmin:.6g}, {vmax:.6g}] 超出训练数据范围 "
                    f"[{lo:.6g}, {hi:.6g}]。代理模型不支持外推预测。"
                ),
            )

    # ── 构建网格批量输入（(nx*ny, 74)，x 为快变轴）─────────
    t0 = time.perf_counter()
    nx, ny = len(request.x_values), len(request.y_values)
    base   = np.asarray(request.base_features, dtype=float)
    batch  = np.repeat(base[None, :], nx * ny, axis=0)
    ix     = INPUT_COLS.index(request.param_x)
    iy     = INPUT_COLS.index(request.param_y)
    batch[:, ix] = np.tile(request.x_values, ny)
    batch[:, iy] = np.repeat(request.y_values, nx)

    # ── 一次 ONNX 批量推理 ─────────────────────────────────
    preds  = predict_batch(batch)
    z_flat = np.array([p[request.output] for p in preds], dtype=float)
    z_grid = z_flat.reshape(ny, nx)  # z[y_idx][x_idx]
    elapsed_ms = (time.perf_counter() - t0) * 1000

    return {
        "status":    "success",
        "param_x":   request.param_x,
        "param_y":   request.param_y,
        "output":    request.output,
        "x_values":  request.x_values,
        "y_values":  request.y_values,
        "z":         [[float(v) for v in row] for row in z_grid],
        "z_min":     float(z_grid.min()),
        "z_max":     float(z_grid.max()),
        "z_mean":    float(z_grid.mean()),
        "baseline_prediction": predict_single(base)[request.output],
        "n_evaluations": nx * ny,
        "elapsed_ms":    round(elapsed_ms, 1),
        "model_version": "ResidualSurrogate-v2",
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

# ── P1 融合模型预测端点（Day 39 新增，可选）────────────────
@router.post("/fused")
async def predict_fused_route(payload: dict):
    """
    融合模型预测（统计特征 + 点云 + 工况 → π/η/ṁ）
    入参：{"stats": [74个数], "X_pc": [[...]], "conds": [Omega, P]}
    需要 backend/models/fused_surrogate.onnx 已导出。
    """
    from app.model import fused_available, predict_fused as _pf
    if not fused_available():
        raise HTTPException(status_code=501,
                            detail="fused_surrogate.onnx 未导出。请先运行 export_fused_onnx.py 并用真数据 checkpoint 生成。")
    stats = np.array(payload.get("stats"), dtype=np.float32)
    X_pc = np.array(payload.get("X_pc"), dtype=np.float32)
    conds = np.array(payload.get("conds"), dtype=np.float32)
    if stats.shape != (74,):
        raise HTTPException(status_code=422, detail="stats 需为 74 维")
    if X_pc.ndim != 3 or X_pc.shape[2] != 9:
        raise HTTPException(status_code=422, detail="X_pc 需为 (1, n_points, 9) 点云")
    result = _pf(X_pc, stats[None, :], conds[None, :])
    # 反标准化：读 fused_stats.json（若存在），把 scaled 输出还原为真实量纲
    from pathlib import Path as _Path
    _stats_path = _Path(__file__).resolve().parent.parent.parent / "models" / "fused_stats.json"
    if _stats_path.exists():
        import json as _json
        with open(_stats_path, "r", encoding="utf-8") as _f:
            _st = _json.load(_f)
        y_mu = np.array(_st["y_mu"], dtype=np.float32)
        y_sd = np.array(_st["y_sd"], dtype=np.float32)
        y_real = (np.array(result["predictions_scaled"], dtype=np.float32) * y_sd + y_mu).tolist()
        return {"status": "success",
                "predictions": {"Compression_ratio": y_real[0][0],
                                "Efficiency": y_real[0][1],
                                "Massflow": y_real[0][2]},
                "note": "fused ONNX 已反标准化"}
    return {"status": "success", **result}
