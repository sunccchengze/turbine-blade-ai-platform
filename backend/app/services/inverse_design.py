"""
inverse_design.py
目标性能 → 叶片设计候选（逆设计 / inverse design）

路线（生成页 / 设计助手共用）：
1. 训练集最近邻：用代理模型对 1000 组 Rotor37 特征批量预测，
   在标准化性能空间里找距目标最近的 K 个样本（毫秒级）。
2. 局部精修：以最近邻为起点，在训练分布边界内对敏感维度
   （Omega/P + 若干几何统计量）做 L-BFGS-B，进一步贴近目标。
3. 多样性：返回 top-K 候选，避免「永远同一基准预测」的假死感。

说明：真实条件扩散生成器（P3）训练完成后可替换本模块；
当前路径基于已部署 ONNX 代理，数字可复现、随目标变化。
"""

from __future__ import annotations

from functools import lru_cache
from typing import Dict, List, Optional, Sequence, Tuple

import numpy as np
import pandas as pd
from pathlib import Path
from scipy.optimize import minimize

from app.model import (
    INPUT_COLS,
    FEATURE_STATS,
    predict_batch,
    predict_single,
)

_BASE_DIR = Path(__file__).resolve().parent.parent.parent
_FEATURES_CSV = _BASE_DIR / "data" / "processed" / "plaid_rotor37_features.csv"

# 性能三维顺序与 surrogate 输出一致
PERF_KEYS = ("Compression_ratio", "Efficiency", "Massflow")

# 局部精修时优先放开的维度（工况 + 几何/场统计量）
_PREF_FREE = (
    "Omega", "P",
    "CoordinateY_mean", "CoordinateY_std",
    "CoordinateZ_mean", "CoordinateZ_std",
    "NormalsX_mean", "NormalsY_mean", "NormalsZ_mean",
    "Pressure_mean", "Pressure_std",
    "Temperature_mean", "Density_mean",
)


@lru_cache(maxsize=1)
def _library() -> Tuple[np.ndarray, np.ndarray, np.ndarray, Tuple[str, ...]]:
    """加载特征库 + 代理批量预测（进程内缓存一次）。"""
    df = pd.read_csv(_FEATURES_CSV)
    cols = tuple(INPUT_COLS)
    X = df[list(cols)].values.astype(np.float64)
    preds = predict_batch(X.astype(np.float32))
    Y = np.array(
        [[p[k] for k in PERF_KEYS] for p in preds],
        dtype=np.float64,
    )
    sample_ids = (
        df["sample_id"].values.astype(np.int64)
        if "sample_id" in df.columns
        else np.arange(len(df), dtype=np.int64)
    )
    return X, Y, sample_ids, cols


def _target_vector(targets: Dict[str, float], y_ref: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """
    构造目标向量与权重：
    - 用户给了的目标 → 权重 1
    - 未给的维度 → 用库均值填充、权重 0（不参与距离）
    """
    mean = y_ref.mean(axis=0)
    t = mean.copy()
    w = np.zeros(3, dtype=np.float64)
    key_to_i = {k: i for i, k in enumerate(PERF_KEYS)}
    for k, v in targets.items():
        if k in key_to_i and v is not None:
            i = key_to_i[k]
            t[i] = float(v)
            w[i] = 1.0
    if w.sum() == 0:
        w[:] = 1.0
    return t, w


def _distances(Y: np.ndarray, t: np.ndarray, w: np.ndarray) -> np.ndarray:
    std = Y.std(axis=0) + 1e-9
    diff = (Y - t) / std
    return np.sqrt((diff ** 2 * w).sum(axis=1))


def _geometry_payload(features: Sequence[float], cols: Sequence[str]) -> dict:
    d = {c: float(features[i]) for i, c in enumerate(cols)}
    return {
        "Omega": d.get("Omega", 0.0),
        "P": d.get("P", 0.0),
        "Pressure_mean": d.get("Pressure_mean", 0.0),
        "Pressure_std": d.get("Pressure_std", 0.0),
        "Temperature_mean": d.get("Temperature_mean", 0.0),
        "CoordinateY_mean": d.get("CoordinateY_mean", 0.0),
    }


def _free_indices(cols: Sequence[str], n_free: int = 12) -> List[int]:
    idxs: List[int] = []
    for name in _PREF_FREE:
        if name in cols:
            idxs.append(cols.index(name))
        if len(idxs) >= n_free:
            break
    # 不足则按 FEATURE_STATS 方差代理：取剩余前列
    if len(idxs) < n_free:
        for i, c in enumerate(cols):
            if i not in idxs:
                idxs.append(i)
            if len(idxs) >= n_free:
                break
    return idxs


def _local_refine(
    x0: np.ndarray,
    t: np.ndarray,
    w: np.ndarray,
    y_std: np.ndarray,
    cols: Sequence[str],
    maxiter: int = 35,
) -> Tuple[np.ndarray, dict, float]:
    """在训练边界内局部精修，返回 (x*, pred, obj)。"""
    free = _free_indices(cols)
    base = x0.astype(np.float64).copy()
    x0f = []
    bounds = []
    for i in free:
        lo, hi = FEATURE_STATS[cols[i]]
        # 略收紧边界，避免贴边外推
        span = hi - lo
        lo2, hi2 = lo + 0.02 * span, hi - 0.02 * span
        if lo2 >= hi2:
            lo2, hi2 = lo, hi
        v = float(np.clip(base[i], lo2, hi2))
        x0f.append(v)
        bounds.append((lo2, hi2))
    x0f = np.asarray(x0f, dtype=np.float64)

    def obj(xf: np.ndarray) -> float:
        xx = base.copy()
        for j, i in enumerate(free):
            xx[i] = xf[j]
        p = predict_single(xx.astype(np.float32))
        y = np.array([p[k] for k in PERF_KEYS], dtype=np.float64)
        return float((((y - t) / y_std) ** 2 * w).sum())

    res = minimize(
        obj, x0f, method="L-BFGS-B", bounds=bounds,
        options={"maxiter": maxiter, "ftol": 1e-9},
    )
    xx = base.copy()
    for j, i in enumerate(free):
        xx[i] = float(res.x[j])
    pred = predict_single(xx.astype(np.float32))
    return xx, pred, float(res.fun)


def inverse_design(
    targets: Dict[str, float],
    n_candidates: int = 5,
    refine: bool = True,
) -> dict:
    """
    主入口：目标 dict → 候选设计列表。

    targets 键：Efficiency / Massflow / Compression_ratio（至少一个）
    """
    if not targets:
        raise ValueError("targets 不能为空")

    n_candidates = int(np.clip(n_candidates, 1, 20))
    X, Y, sample_ids, cols = _library()
    t, w = _target_vector(targets, Y)
    y_std = Y.std(axis=0) + 1e-9
    dist = _distances(Y, t, w)
    order = np.argsort(dist)

    # 多样性：贪心选距离目标近、彼此特征不太一样的样本
    picked: List[int] = []
    for i in order:
        if len(picked) >= max(n_candidates, 3):
            break
        if not picked:
            picked.append(int(i))
            continue
        # 特征空间最小距离（标准化）
        x_std = X.std(axis=0) + 1e-9
        ok = True
        for j in picked:
            d_feat = np.linalg.norm((X[i] - X[j]) / x_std)
            if d_feat < 0.35:  # 太像则跳过
                ok = False
                break
        if ok:
            picked.append(int(i))
    # 兜底：不够就按距离补
    if len(picked) < n_candidates:
        for i in order:
            if int(i) not in picked:
                picked.append(int(i))
            if len(picked) >= n_candidates:
                break
    picked = picked[:n_candidates]

    candidates = []
    for rank, idx in enumerate(picked):
        x = X[idx].copy()
        pred = {k: float(Y[idx, j]) for j, k in enumerate(PERF_KEYS)}
        method = "library-nn"
        obj = float(dist[idx])
        refined = False

        if refine and rank == 0:
            # 只对最优候选精修（控制延迟）
            x_r, pred_r, obj_r = _local_refine(x, t, w, y_std, cols)
            # 仅当目标误差下降才采用
            y_nn = np.array([pred[k] for k in PERF_KEYS])
            y_rf = np.array([pred_r[k] for k in PERF_KEYS])
            err_nn = float((((y_nn - t) / y_std) ** 2 * w).sum())
            err_rf = float((((y_rf - t) / y_std) ** 2 * w).sum())
            if err_rf <= err_nn * 1.001:
                x, pred, obj = x_r, pred_r, err_rf
                method = "library-nn + L-BFGS-B"
                refined = True

        gaps = {}
        for k, v in targets.items():
            if k in pred:
                gaps[k] = float(pred[k] - float(v))

        candidates.append({
            "rank": rank + 1,
            "sample_id": int(sample_ids[idx]),
            "predictions": pred,
            "gaps": gaps,
            "distance": obj,
            "method": method,
            "refined": refined,
            "features": [float(v) for v in x],
            "geometry": _geometry_payload(x, cols),
        })

    best = candidates[0]
    return {
        "targets": {k: float(v) for k, v in targets.items()},
        "n_candidates": len(candidates),
        "best": best,
        "candidates": candidates,
        "library_size": int(len(X)),
        "mode": "inverse-design (surrogate NN + optional L-BFGS-B)",
    }


def explain_design(targets: Dict[str, float], best_pred: Dict[str, float]) -> List[str]:
    """生成面向用户的人话解释。"""
    lines: List[str] = []
    labels = {
        "Efficiency": ("效率", 4, ""),
        "Compression_ratio": ("压比", 4, ""),
        "Massflow": ("流量", 2, " kg/s"),
    }
    for k, (name, nd, unit) in labels.items():
        if k not in targets:
            continue
        t = float(targets[k])
        p = float(best_pred[k])
        d = p - t
        if k == "Massflow":
            if d >= 0:
                lines.append(f"当前方案流量 {p:.{nd}f}{unit}，满足要求（目标 {t:.{nd}f}）")
            else:
                lines.append(f"当前方案流量 {p:.{nd}f}{unit}，低于目标 {t:.{nd}f}（差 {-d:.{nd}f}）")
        else:
            if d >= 0:
                lines.append(f"当前方案{name} {p:.{nd}f}，已达目标 {t:.{nd}f}")
            else:
                lines.append(f"当前方案{name} {p:.{nd}f}，距目标还差 {-d:.{nd}f}")

    # 可达性提示：目标是否超出代理在训练集上的预测包络
    _, Y, _, _ = _library()
    y_min, y_max = Y.min(0), Y.max(0)
    key_to_i = {k: i for i, k in enumerate(PERF_KEYS)}
    oob = []
    for k, v in targets.items():
        if k not in key_to_i:
            continue
        i = key_to_i[k]
        if float(v) < y_min[i] - 1e-6 or float(v) > y_max[i] + 1e-6:
            oob.append(
                f"{k} 目标 {float(v):.4g} 超出代理在训练分布内的预测范围 "
                f"[{y_min[i]:.4g}, {y_max[i]:.4g}]"
            )
    if oob:
        lines.append("⚠ " + "；".join(oob) + "。已返回分布内最接近方案。")
    lines.append("注：效率与流量存在 Pareto 权衡，提升效率通常伴随流量下降。")
    lines.append("方法：代理模型逆设计（训练集近邻 + 局部精修）；P3 扩散生成器接入后将直接生成新几何。")
    return lines
