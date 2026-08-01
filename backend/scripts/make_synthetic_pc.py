"""
make_synthetic_pc.py
生成合成点云数据集（占位用）：模拟 Rotor37 叶片表面点云 + 压力/温度场。

用途：真实点云数据（build_pointcloud_dataset.py，需访问 HF）回传前，
     用本脚本生成形状合理、字段齐全的合成数据，打通 P1 训练全链路。

用法：python backend/scripts/make_synthetic_pc.py --n_points 2048 --n_samples 1000

输出：data/processed/pointcloud/rotor37_pc_synthetic.npz
     （sample_id, X_pc (S,N,C), conds (S,2), y (S,3)）与真实数据同构。

注意：数字仅用于验证管线，非真实性能数字（铁律4：注明 synthetic）。
"""

import argparse
import os
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
DATA_PC_DIR = ROOT / "data" / "processed" / "pointcloud"


def make_blade_points(n_points, rng):
    """生成近似叶片/压气机表面的点云：扭转+弯曲的曲面 + 场量。"""
    t = rng.random(n_points)                 # 弦向 0..1
    s = rng.random(n_points)                 # 展向 0..1
    # 叶片型面：中弧线 + 厚度（NACA 类近似）
    camber = 0.04 * np.sin(np.pi * t)        # 弯度
    thick = 0.02 * np.sin(np.pi * t)         # 厚度
    side = rng.integers(0, 2, n_points) * 2 - 1  # ±1 吸力面/压力面
    x = t * 0.05                             # 弦向 m
    y = (camber + side * thick) * (1 - 0.3 * s)  # 型面（展向收缩）
    z = s * 0.08                             # 展向 m
    coords = np.stack([x, y, z], axis=-1)
    # 法向近似：dy/dt
    d_camber = 0.04 * np.pi * np.cos(np.pi * t)
    d_thick = 0.02 * np.pi * np.cos(np.pi * t)
    ny = (d_camber + side * d_thick) * (1 - 0.3 * s)
    normals = np.stack([np.zeros_like(x), ny, np.zeros_like(z)], axis=-1)
    normals /= np.linalg.norm(normals, axis=-1, keepdims=True) + 1e-8
    # 场量：压力沿弦向梯度 + 噪声；温度随展向
    pressure = 1.05e5 + 8e4 * (1 - t) + 5e3 * side + 2e3 * rng.normal(size=n_points)
    density = 1.2 + 0.9 * (1 - t) + 0.1 * rng.normal(size=n_points)
    temperature = 320 + 40 * s + 3 * rng.normal(size=n_points)
    # 通道顺序必须与 build_pointcloud_dataset.py 一致：
    # 0-2 坐标, 3 Pressure, 4 Density, 5 Temperature, 6-8 Normals(X/Y/Z)
    X = np.concatenate([coords,
                        pressure[:, None], density[:, None],
                        temperature[:, None], normals], axis=-1).astype(np.float32)
    return X


def make_perf(omega, p_back):
    """由工况生成大致物理合理的标量输出（合成占位）。"""
    pr = 1.8 + 2.5e-4 * (omega - 1620) + 1e-6 * (p_back - 3.6e5)
    eff = 0.85 + 3e-5 * (omega - 1620) - 5e-8 * (p_back - 3.6e5) + 0.004 * np.sin(omega * 0.02)
    mf = 18.0 + 3e-3 * (omega - 1620) + 5e-6 * (p_back - 3.6e5)
    return np.array([pr, eff, mf], dtype=np.float32)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n_points", type=int, default=2048)
    ap.add_argument("--n_samples", type=int, default=1000)
    args = ap.parse_args()

    rng = np.random.default_rng(42)
    os.makedirs(DATA_PC_DIR, exist_ok=True)

    X_list, cond_list, y_list, sid_list = [], [], [], []
    for i in range(args.n_samples):
        omega = rng.uniform(1620, 1800)
        p_back = rng.uniform(3.59e5, 3.77e5)
        X = make_blade_points(args.n_points, rng)
        # 归一化（与真实管线一致：去质心+缩放）
        off = X[:, :3].mean(0)
        sc = np.abs(X[:, :3] - off).max()
        X[:, :3] = (X[:, :3] - off) / max(sc, 1e-8)
        X_list.append(X)
        cond_list.append(np.array([omega, p_back], np.float32))
        y_list.append(make_perf(omega, p_back))
        sid_list.append(i)

    out = DATA_PC_DIR / "rotor37_pc_synthetic.npz"
    np.savez_compressed(out,
                        sample_id=np.array(sid_list, np.int64),
                        X_pc=np.stack(X_list).astype(np.float32),
                        conds=np.array(cond_list, np.float32),
                        y=np.array(y_list, np.float32))
    print(f"✅ 合成点云数据集已生成：{out}")
    print(f"   样本 {args.n_samples} × 点 {args.n_points} × 通道 {X_list[0].shape[1]}")
    print("   ⚠️ synthetic 占位数据，非真实性能数字")


if __name__ == "__main__":
    main()
