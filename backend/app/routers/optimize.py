"""
optimize.py
多目标优化相关的 API 路由
"""

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import numpy as np
import pandas as pd
from pathlib import Path

router = APIRouter(prefix="/api/optimize", tags=["Optimization"])

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DATA_DIR = BASE_DIR / "data" / "processed"


# ── 请求/响应模型 ──────────────────────────────────────────
class OptimizeRequest(BaseModel):
    """优化请求"""
    pop_size:    int   = Field(default=50,  ge=20,  le=200)
    n_gen:       int   = Field(default=100, ge=20,  le=500)
    min_efficiency:    float = Field(default=0.84)
    min_compression:   float = Field(default=1.8)


# ── 预加载 Pareto 前沿（已计算好的结果）─────────────────────
def load_pareto_results():
    """加载已计算好的 Pareto 前沿结果"""
    pareto_path = DATA_DIR / "pareto_front_solutions.csv"
    if pareto_path.exists():
        df = pd.read_csv(pareto_path)
        return df[['design_id', 'Efficiency',
                   'Massflow', 'Compression_ratio']].to_dict('records')
    return []


# ── 端点 ───────────────────────────────────────────────────
@router.get("/pareto")
async def get_pareto_front():
    """
    返回预计算好的 Pareto 前沿数据
    （直接从CSV读取，毫秒级响应）
    """
    results = load_pareto_results()

    if not results:
        raise HTTPException(
            status_code=404,
            detail="Pareto front data not found. Run optimization first."
        )

    # 统计信息
    eff_values  = [r['Efficiency']        for r in results]
    mass_values = [r['Massflow']           for r in results]
    comp_values = [r['Compression_ratio']  for r in results]

    return {
        "status":          "success",
        "n_solutions":     len(results),
        "pareto_front":    results,
        "summary": {
            "efficiency": {
                "min": min(eff_values),
                "max": max(eff_values),
                "mean": sum(eff_values) / len(eff_values),
            },
            "massflow": {
                "min": min(mass_values),
                "max": max(mass_values),
                "mean": sum(mass_values) / len(mass_values),
            },
            "compression_ratio": {
                "min": min(comp_values),
                "max": max(comp_values),
                "mean": sum(comp_values) / len(comp_values),
            },
        },
        "best_efficiency_solution":  max(results, key=lambda x: x['Efficiency']),
        "best_massflow_solution":    max(results, key=lambda x: x['Massflow']),
    }


@router.get("/training-data-stats")
async def get_training_stats():
    """返回训练数据的统计信息（用于前端对比展示）"""
    scalars_path = DATA_DIR / "plaid_rotor37_scalars.csv"
    if not scalars_path.exists():
        raise HTTPException(status_code=404, detail="Training data not found")

    df = pd.read_csv(scalars_path)

    return {
        "n_samples": len(df),
        "statistics": {
            col: {
                "mean":  float(df[col].mean()),
                "std":   float(df[col].std()),
                "min":   float(df[col].min()),
                "max":   float(df[col].max()),
                "p25":   float(df[col].quantile(0.25)),
                "p75":   float(df[col].quantile(0.75)),
            }
            for col in ['Compression_ratio', 'Efficiency', 'Massflow',
                       'Omega', 'P']
        },
    }


@router.get("/uq-results")
async def get_uq_results():
    """返回不确定性量化测试结果"""
    uq_path = DATA_DIR / "uq_test_results.csv"
    if not uq_path.exists():
        raise HTTPException(status_code=404, detail="UQ results not found")

    df = pd.read_csv(uq_path)
    return {
        "status":    "success",
        "n_samples": len(df),
        "results":   df.to_dict('records'),
    }