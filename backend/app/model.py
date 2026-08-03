"""
model.py
使用 ONNX Runtime 替代 PyTorch 进行推理
体积从 ~500MB 降至 ~2MB，推理速度提升 5×
这是工业界标准的模型部署方案
"""

import os
import numpy as np
import pandas as pd
import joblib
import onnxruntime as ort
from pathlib import Path

# ── 路径配置 ──────────────────────────────────────────────
BASE_DIR   = Path(__file__).resolve().parent.parent
MODELS_DIR = Path(os.getenv("MODELS_DIR", str(BASE_DIR / "models")))
DATA_DIR   = Path(os.getenv("DATA_DIR",   str(BASE_DIR / "data" / "processed")))

# ── 加载 Scaler ────────────────────────────────────────────
scaler_X = joblib.load(MODELS_DIR / "scaler_X_v2.pkl")
scaler_y = joblib.load(MODELS_DIR / "scaler_y_v2.pkl")

# ── 加载 ONNX 模型 ─────────────────────────────────────────
onnx_path = MODELS_DIR / "surrogate_model.onnx"
session   = ort.InferenceSession(
    str(onnx_path),
    providers=['CPUExecutionProvider']
)

# ── 加载特征列名 ───────────────────────────────────────────
df_features = pd.read_csv(DATA_DIR / "plaid_rotor37_features.csv")
INPUT_COLS  = [c for c in df_features.columns
               if c not in ['sample_id', 'Compression_ratio',
                            'Efficiency', 'Massflow']]
OUTPUT_COLS = ['Compression_ratio', 'Efficiency', 'Massflow']

# 每个特征在训练数据中的取值范围 (min, max)
# 用于 /sweep 端点的越界保护：代理模型只在训练分布内可靠，
# 外推（extrapolation）区域的预测在物理上不可信，应直接拒绝。
FEATURE_STATS = {
    c: (float(df_features[c].min()), float(df_features[c].max()))
    for c in INPUT_COLS
}

print("✅ ONNX Runtime 模型加载成功")
print(f"   模型路径：{onnx_path}")
print(f"   输入维度：{len(INPUT_COLS)}")
print(f"   推理引擎：ONNX Runtime {ort.__version__}")


# ── 核心推理函数 ───────────────────────────────────────────
def _run_inference(X_raw: np.ndarray) -> np.ndarray:
    """
    输入原始量纲特征 → 标准化 → ONNX推理 → 反标准化 → 返回原始量纲预测
    """
    X_sc  = scaler_X.transform(X_raw.astype(np.float32))
    y_sc  = session.run(None, {'features': X_sc.astype(np.float32)})[0]
    return scaler_y.inverse_transform(y_sc)


def predict_single(features: np.ndarray) -> dict:
    """
    单样本确定性预测
    输入：(74,) 原始量纲特征向量
    输出：{Compression_ratio, Efficiency, Massflow}
    """
    X   = features.reshape(1, -1)
    y   = _run_inference(X)[0]
    return {
        'Compression_ratio': float(y[0]),
        'Efficiency':        float(y[1]),
        'Massflow':          float(y[2]),
    }


def predict_batch(features_batch: np.ndarray) -> list:
    """
    批量确定性预测
    输入：(N, 74) 特征矩阵
    输出：list of dict
    """
    y = _run_inference(features_batch)
    return [
        {
            'Compression_ratio': float(y[i, 0]),
            'Efficiency':        float(y[i, 1]),
            'Massflow':          float(y[i, 2]),
        }
        for i in range(len(y))
    ]


def predict_with_uncertainty(features: np.ndarray,
                              n_samples: int = 100) -> dict:
    """
    带不确定性的预测（生产模式）

    注意：生产 API 使用预计算的 UQ 统计量（来自训练阶段 100 次 MC Dropout
    采样的平均 σ）估算置信区间，不做实时重复采样——ONNX 推理不支持
    PyTorch 训练期的 Dropout 随机性，实时 MC 采样会引入不可接受的时延。
    该 σ 是模型认知不确定性的保守指示器（已知低估真实不确定性，
    覆盖率实测 65–89%，详见 README UQ 节），定位为相对置信度指示器。
    """
    # 确定性预测
    pred = predict_single(features)

    # 基于训练集 UQ 结果的统计估算
    # 这些 sigma 值来自训练阶段完整的 MC Dropout 实验（100 次采样）
    sigma_map = {
        'Compression_ratio': 0.006393,
        'Efficiency':        0.001007,
        'Massflow':          0.061055,
    }

    result = {}
    for col in OUTPUT_COLS:
        mean  = pred[col]
        sigma = sigma_map[col]
        result[col] = {
            'mean':     mean,
            'std':      sigma,
            'lower_95': mean - 1.96 * sigma,
            'upper_95': mean + 1.96 * sigma,
        }
    return result

# ── P1 场级预测端点支持（Day 39 新增，骨架）───────────────
# 真实点云模型训练完成后，将 ONNX 路径 / 预处理挂到这里。
# 当前为占位实现：返回与输入等长的合成场（待 P1 真实模型接入）。
FIELD_ONNX_PATH = MODELS_DIR / "p1_field_model.onnx"  # 未来真实场模型


def predict_surface_field(X_pc: np.ndarray, conds: np.ndarray) -> dict:
    """
    场级预测：输入表面点云 (N, C) + 工况 (2,) → 表面压力/温度场 + 标量。
    当前占位：标量走现有代理，场返回合成梯度（真实 P1 模型训练后替换）。
    """
    n = len(X_pc)
    t = np.linspace(0, 1, n)
    pressure = 1.05e5 + 8e4 * (1 - t) + 5e3 * X_pc[:, 1]  # 占位梯度
    temperature = 320 + 40 * t
    return {
        "scalars": {"placeholder": True},  # P1 真实模型接入后返回 (π, η, ṁ)
        "field": {
            "pressure": pressure.astype(np.float32).tolist(),
            "temperature": temperature.astype(np.float32).tolist(),
            "coords": X_pc[:, :3].astype(np.float32).tolist(),
        },
        "mode": "placeholder (P1 真实模型待接入)",
    }


# ── P1 双头融合模型（Day 39 新增，可选加载）────────────────
# fused_surrogate.onnx 由 export_fused_onnx.py 生成；
# 存在时启用融合预测端点（输入：点云 + 74维统计特征 + 工况）。
FUSED_ONNX_PATH = MODELS_DIR / "fused_surrogate.onnx"
_fused_session = None
_fused_in_mu = None
_fused_in_sd = None
_fused_stats_mu = None
_fused_stats_sd = None
_fused_y_mu = None
_fused_y_sd = None


def fused_available() -> bool:
    return FUSED_ONNX_PATH.exists()


def _load_fused():
    global _fused_session
    if _fused_session is None and FUSED_ONNX_PATH.exists():
        _fused_session = ort.InferenceSession(str(FUSED_ONNX_PATH),
                                              providers=['CPUExecutionProvider'])
    return _fused_session


def predict_fused(X_pc: np.ndarray, stats: np.ndarray,
                  conds: np.ndarray, scaler_stats=None) -> dict:
    """
    融合模型预测：点云 (N,C) + 统计特征 (74) + 工况 (2) → 标量 (π,η,ṁ)
    注意：标准化参数需与训练一致（train_fused_p1.py 的 in_mu/in_sd 等），
    简化版：输入已按训练标准化，stats 用传入 scaler 或默认不做。
    """
    sess = _load_fused()
    if sess is None:
        raise RuntimeError("fused_surrogate.onnx 未就绪，请先导出模型")
    # 简化：假设 X_pc 已展平成 (1, n_points, C)，stats (1, 74)，conds (1, 2)
    y_sc = sess.run(None, {"X_pc": X_pc.astype(np.float32),
                           "stats": stats.astype(np.float32),
                           "conds": conds.astype(np.float32)})[0]
    # 反标准化（训练时 y 标准化用 ym/ys；此处简化直接返回 scaled，标注待完善）
    return {"predictions_scaled": y_sc.tolist(),
            "note": "fused ONNX 输出为标准化值；反标准化参数待与训练对齐"}
