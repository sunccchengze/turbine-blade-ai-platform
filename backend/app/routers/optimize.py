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
        return df[['design_id', 'Efficiency',
                   'Massflow', 'Compression_ratio']].to_dict('records')
    return []


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