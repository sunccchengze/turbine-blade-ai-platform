"""
model.py
加载训练好的 ResidualSurrogateModel
提供统一的预测接口供所有路由使用
"""

import torch
import torch.nn as nn
import numpy as np
import joblib
import pandas as pd
from pathlib import Path

# ── 路径配置 ──────────────────────────────────────────────
BASE_DIR   = Path(__file__).resolve().parent.parent.parent
MODELS_DIR = BASE_DIR / "models"
DATA_DIR   = BASE_DIR / "data" / "processed"

# ── 模型结构定义（必须和训练时完全一致）────────────────────
class ResidualBlock(nn.Module):
    def __init__(self, dim, dropout=0.1):
        super().__init__()
        self.block = nn.Sequential(
            nn.Linear(dim, dim),
            nn.BatchNorm1d(dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(dim, dim),
            nn.BatchNorm1d(dim),
        )
        self.relu = nn.ReLU()

    def forward(self, x):
        return self.relu(self.block(x) + x)


class ResidualSurrogateModel(nn.Module):
    def __init__(self, input_dim=74, output_dim=3, dropout=0.1):
        super().__init__()
        self.input_proj = nn.Sequential(
            nn.Linear(input_dim, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.Dropout(dropout),
        )
        self.res_blocks_256 = nn.Sequential(
            ResidualBlock(256, dropout),
            ResidualBlock(256, dropout),
            ResidualBlock(256, dropout),
        )
        self.mid_proj = nn.Sequential(
            nn.Linear(256, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(dropout),
        )
        self.res_blocks_128 = nn.Sequential(
            ResidualBlock(128, dropout),
            ResidualBlock(128, dropout),
        )
        self.output_layer = nn.Linear(128, output_dim)

    def forward(self, x):
        x = self.input_proj(x)
        x = self.res_blocks_256(x)
        x = self.mid_proj(x)
        x = self.res_blocks_128(x)
        return self.output_layer(x)


# ── 全局加载（只在启动时加载一次）──────────────────────────
device = torch.device("cpu")  # 部署用CPU，稳定

# 加载 Scaler
scaler_X = joblib.load(MODELS_DIR / "scaler_X_v2.pkl")
scaler_y = joblib.load(MODELS_DIR / "scaler_y_v2.pkl")

# 加载特征列名（确定输入维度）
df_features = pd.read_csv(DATA_DIR / "plaid_rotor37_scalars.csv")
INPUT_DIM   = 74   # 74维特征

# 加载模型权重
model = ResidualSurrogateModel(
    input_dim=INPUT_DIM,
    output_dim=3,
    dropout=0.1
).to(device)

model.load_state_dict(
    torch.load(
        MODELS_DIR / "residual_physics_best.pth",
        map_location=device
    )
)
model.eval()

# 输出列名
OUTPUT_COLS = ["Compression_ratio", "Efficiency", "Massflow"]

# ── 预测函数 ───────────────────────────────────────────────
def predict_single(features: np.ndarray) -> dict:
    """
    单次预测（确定性）

    参数：
        features: numpy array (74,) 原始量纲特征向量

    返回：
        dict: {Compression_ratio, Efficiency, Massflow}
    """
    X = features.reshape(1, -1).astype(np.float32)
    X_sc = scaler_X.transform(X)
    X_t  = torch.tensor(X_sc, dtype=torch.float32).to(device)

    with torch.no_grad():
        y_sc = model(X_t).cpu().numpy()

    y = scaler_y.inverse_transform(y_sc)[0]

    return {
        "Compression_ratio": float(y[0]),
        "Efficiency":        float(y[1]),
        "Massflow":          float(y[2]),
    }


def predict_with_uncertainty(features: np.ndarray,
                              n_samples: int = 100) -> dict:
    """
    MC Dropout 预测（带不确定性）

    返回：
        dict: 每个输出包含 mean, std, lower_95, upper_95
    """
    X = features.reshape(1, -1).astype(np.float32)
    X_sc = scaler_X.transform(X)
    X_t  = torch.tensor(X_sc, dtype=torch.float32).to(device)

    # 开启 Dropout
    model.eval()
    for m in model.modules():
        if isinstance(m, nn.Dropout):
            m.train()

    preds = []
    with torch.no_grad():
        for _ in range(n_samples):
            y_sc = model(X_t).cpu().numpy()
            y    = scaler_y.inverse_transform(y_sc)[0]
            preds.append(y)

    preds = np.array(preds)  # (n_samples, 3)
    mean  = preds.mean(axis=0)
    std   = preds.std(axis=0)

    result = {}
    for i, col in enumerate(OUTPUT_COLS):
        result[col] = {
            "mean":      float(mean[i]),
            "std":       float(std[i]),
            "lower_95":  float(mean[i] - 1.96 * std[i]),
            "upper_95":  float(mean[i] + 1.96 * std[i]),
        }

    return result


def predict_batch(features_batch: np.ndarray) -> list:
    """
    批量预测（确定性），用于优化时大批量评估

    参数：
        features_batch: numpy array (N, 74)

    返回：
        list of dict
    """
    X    = features_batch.astype(np.float32)
    X_sc = scaler_X.transform(X)
    X_t  = torch.tensor(X_sc, dtype=torch.float32).to(device)

    with torch.no_grad():
        y_sc = model(X_t).cpu().numpy()

    y = scaler_y.inverse_transform(y_sc)

    results = []
    for i in range(len(y)):
        results.append({
            "Compression_ratio": float(y[i, 0]),
            "Efficiency":        float(y[i, 1]),
            "Massflow":          float(y[i, 2]),
        })

    return results


print("✅ model.py 加载成功")