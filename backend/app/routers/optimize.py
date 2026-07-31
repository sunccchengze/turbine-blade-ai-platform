from fastapi import APIRouter, HTTPException
import pandas as pd
from pathlib import Path
import os

router = APIRouter(prefix="/api/optimize", tags=["Optimization"])

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data" / "processed"


def load_pareto_results():
    pareto_path = DATA_DIR / "pareto_front_solutions.csv"
    if pareto_path.exists():
        df = pd.read_csv(pareto_path)
        records = []
        for _, row in df.iterrows():
            records.append({
                "design_id":          int(row['design_id']),
                "Efficiency":         float(row['Efficiency']),
                "Massflow":           float(row['Massflow']),
                "Compression_ratio":  float(row['Compression_ratio']),
                # 该 Pareto 解的几何/工况参数（前端 3D 叶片联动用）：
                # Omega/P 为扫描工况，其余为 BladeViewer3D 参数化几何的输入。
                "geometry": {
                    "Omega":             float(row['Omega']),
                    "P":                 float(row['P']),
                    "Pressure_mean":     float(row['Pressure_mean']),
                    "Pressure_std":      float(row['Pressure_std']),
                    "Temperature_mean":  float(row['Temperature_mean']),
                    "CoordinateY_mean":  float(row['CoordinateY_mean']),
                },
            })
        return records
    return []


@router.get("/pareto-evolution")
async def get_pareto_evolution():
    """NSGA-II 演化轨迹（每 10 代一帧非支配前沿，供前端演化动画使用）"""
    evo_path = DATA_DIR / "pareto_evolution.csv"
    if not evo_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Pareto evolution data not found. Looking in: {DATA_DIR}",
        )
    df = pd.read_csv(evo_path)
    generations = []
    for gen, grp in df.groupby("gen"):
        generations.append({
            "generation":   int(gen),
            "n_solutions":  len(grp),
            "solutions":    grp[['Efficiency', 'Massflow',
                                 'Compression_ratio']].to_dict('records'),
        })
    generations.sort(key=lambda g: g["generation"])
    return {
        "status":         "success",
        "n_generations":  len(generations),
        "max_generation": generations[-1]["generation"],
        "generations":    generations,
    }


@router.get("/pareto")
async def get_pareto_front():
    results = load_pareto_results()
    if not results:
        raise HTTPException(
            status_code=404,
            detail=f"Pareto front data not found. Looking in: {DATA_DIR}"
        )
    eff_values  = [r['Efficiency']        for r in results]
    mass_values = [r['Massflow']           for r in results]
    comp_values = [r['Compression_ratio']  for r in results]

    return {
        "status":       "success",
        "n_solutions":  len(results),
        "pareto_front": results,
        "summary": {
            "efficiency":         {"min": min(eff_values),  "max": max(eff_values),  "mean": sum(eff_values)/len(eff_values)},
            "massflow":           {"min": min(mass_values), "max": max(mass_values), "mean": sum(mass_values)/len(mass_values)},
            "compression_ratio":  {"min": min(comp_values), "max": max(comp_values), "mean": sum(comp_values)/len(comp_values)},
        },
        "best_efficiency_solution": max(results, key=lambda x: x['Efficiency']),
        "best_massflow_solution":   max(results, key=lambda x: x['Massflow']),
    }


@router.get("/training-data-stats")
async def get_training_stats():
    scalars_path = DATA_DIR / "plaid_rotor37_scalars.csv"
    if not scalars_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Training data not found. Looking in: {DATA_DIR}"
        )
    df = pd.read_csv(scalars_path)
    return {
        "n_samples": len(df),
        "statistics": {
            col: {
                "mean": float(df[col].mean()),
                "std":  float(df[col].std()),
                "min":  float(df[col].min()),
                "max":  float(df[col].max()),
                "p25":  float(df[col].quantile(0.25)),
                "p75":  float(df[col].quantile(0.75)),
            }
            for col in ['Compression_ratio', 'Efficiency', 'Massflow', 'Omega', 'P']
        },
    }


@router.get("/uq-results")
async def get_uq_results():
    uq_path = DATA_DIR / "uq_test_results.csv"
    if not uq_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"UQ results not found. Looking in: {DATA_DIR}"
        )
    df = pd.read_csv(uq_path)
    return {
        "status":    "success",
        "n_samples": len(df),
        "results":   df.to_dict('records'),
    }