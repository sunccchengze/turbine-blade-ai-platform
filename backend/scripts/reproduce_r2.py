"""
reproduce_r2.py
复现 README 主口径 R²：仓库已有特征表 + 生产 ONNX 模型 + 90/10 留出划分（seed 42）。
不下载任何数据。期望输出：0.9844 / 0.9561 / 0.9827（n_test=100）。

用法：python backend/scripts/reproduce_r2.py
依赖：scikit-learn==1.7.2（与 scaler_X_v2.pkl 导出版本一致）、onnxruntime、joblib
"""

import numpy as np
import pandas as pd
import joblib
import onnxruntime as ort
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score

OUT = ['Compression_ratio', 'Efficiency', 'Massflow']

df = pd.read_csv("backend/data/processed/plaid_rotor37_features.csv")
inc = [c for c in df.columns if c not in ['sample_id'] + OUT]
X, y = df[inc].values.astype(np.float32), df[OUT].values.astype(np.float32)

# 与训练完全一致的划分（README 口径：留出测试集 n=100, random_state=42）
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.10, random_state=42)

sx = joblib.load("backend/models/scaler_X_v2.pkl")
sy = joblib.load("backend/models/scaler_y_v2.pkl")
sess = ort.InferenceSession("backend/models/surrogate_model.onnx")

pred = sy.inverse_transform(
    sess.run(None, {sess.get_inputs()[0].name:
                    sx.transform(X_test).astype(np.float32)})[0])

print(f"n_test = {len(X_test)}")
for i, c in enumerate(OUT):
    print(f"{c:20s} R² = {r2_score(y_test[:, i], pred[:, i]):.4f}")

print("\n期望（README 口径）：0.9844 / 0.9561 / 0.9827")
