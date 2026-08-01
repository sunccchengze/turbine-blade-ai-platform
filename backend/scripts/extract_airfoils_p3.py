"""
extract_airfoils_p3.py
P3 真数据前置：3D 点云 → 2D 翼型截面（供生成式设计训练）

原理：Rotor37 叶片点云按展向（Z 轴）切片，取中展向截面附近的点 → 投影到 (X,Y) 平面
→ 按周向角排序 → 得到上下表面 2D 翼型轮廓。

用法：
    python backend/scripts/extract_airfoils_p3.py [--n_sections 1] [--section 0.5]
输出：data/processed/p3/airfoils.npz（几何 + 对应性能标量）
"""

import argparse
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))
from scripts.train_pointnet_p1 import load_data

OUT_PATH = ROOT / "data" / "processed" / "p3" / "airfoils.npz"


def extract_section(X_pc, z_frac=0.5, thickness=0.02):
    """在展向 z_frac 处切片，取薄层内点，投影到 XY 平面，按角度排序成翼型。"""
    z = X_pc[:, 2]
    zmin, zmax = z.min(), z.max()
    z_mid = zmin + (zmax - zmin) * z_frac
    mask = np.abs(z - z_mid) < (zmax - zmin) * thickness
    pts = X_pc[mask]
    if len(pts) < 20:
        return None
    # 按角度排序（绕叶片中心）
    cx, cy = pts[:, 0].mean(), pts[:, 1].mean()
    ang = np.arctan2(pts[:, 1] - cy, pts[:, 0] - cx)
    order = np.argsort(ang)
    pts = pts[order]
    # 去重（相邻角度过近的点）
    keep = np.ones(len(pts), dtype=bool)
    prev = ang[order][0]
    for i in range(1, len(pts)):
        d = ang[order][i] - prev
        if abs(d) < 0.005:
            keep[i] = False
        else:
            prev = ang[order][i]
    pts = pts[keep]
    return pts[:, :2].astype(np.float32)   # (M, 2) 翼型轮廓


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n_sections", type=int, default=3,
                    help="每个叶片抽几个展向截面（用于扩样本）")
    ap.add_argument("--synthetic", action="store_true",
                    help="用合成点云（测试管线）")
    args = ap.parse_args()

    if args.synthetic:
        sys.path.insert(0, str(ROOT / "backend"))
        from scripts.make_synthetic_pc import make_blade_points
        rng = np.random.default_rng(42)
        all_geoms, all_perf = [], []
        for i in range(100):
            X = make_blade_points(2048, rng)
            for frac in np.linspace(0.3, 0.7, args.n_sections):
                sec = extract_section(X, frac)
                if sec is not None and len(sec) > 30:
                    all_geoms.append(sec)
                    all_perf.append([1.9, 0.87, 19.5])
        print(f"合成翼型抽取：{len(all_geoms)} 个")
    else:
        from scripts.train_pointnet_p1 import DATA_PC, DATA_PC_SYNTH
        path = DATA_PC if DATA_PC.exists() else DATA_PC_SYNTH
        if not path.exists():
            raise SystemExit("❌ 未找到点云数据")
        X_pc, conds, y, sid = load_data(path)
        all_geoms, all_perf = [], []
        for i in range(len(X_pc)):
            for frac in np.linspace(0.3, 0.7, args.n_sections):
                sec = extract_section(X_pc[i], frac)
                if sec is not None and len(sec) > 30:
                    all_geoms.append(sec)
                    all_perf.append(y[i])
        print(f"真实翼型抽取：{len(all_geoms)} 个（来自 {len(X_pc)} 叶片）")

    if not all_geoms:
        raise SystemExit("❌ 未抽取到有效翼型，检查切片参数")

    # 统一到固定点数（pad/trim 到 128 点）
    N = 128
    geoms_pad = np.zeros((len(all_geoms), N, 2), dtype=np.float32)
    for j, g in enumerate(all_geoms):
        n = min(len(g), N)
        # 重采样到 N 点（线性插值）
        if len(g) >= N:
            idx = np.linspace(0, len(g) - 1, N).astype(int)
            geoms_pad[j] = g[idx]
        else:
            geoms_pad[j, :len(g)] = g
    geoms_pad = geoms_pad.reshape(len(all_geoms), -1)   # (S, N*2)
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(OUT_PATH,
                        airfoils=geoms_pad.astype(np.float32),
                        perf=np.array(all_perf, dtype=np.float32))
    print(f"✅ 翼型数据集已保存：{OUT_PATH}")
    print(f"   样本 {len(all_geoms)} × 点 {N} × 2 = {geoms_pad.shape[1]} 维")


if __name__ == "__main__":
    main()
