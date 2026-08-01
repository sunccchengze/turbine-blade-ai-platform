"""
verify_pointcloud.py
验证点云数据集质量与通道完整性（Day 39 新增，防再踩 CellData/通道数坑）

用法：python backend/scripts/verify_pointcloud.py [npz路径]
默认检查 data/processed/pointcloud/rotor37_pc.npz

检查项：
1. 文件存在 + keys 完整（sample_id/X_pc/conds/y）
2. X_pc shape 合理（S×N×C）
3. 通道数判定：3=仅坐标（场量缺失，需重新构建）、6=坐标+场量(无Normals?)、9=完整（坐标+场量+法向）
4. 每列统计：坐标应≈0均值小范围；Pressure≈1e5；Density≈1-2；Temperature≈300+；Normals≈±1
5. 与特征 CSV 的 sample_id 对齐检查
"""

import argparse
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_NPZ = ROOT / "data" / "processed" / "pointcloud" / "rotor37_pc.npz"
FEATURES_CSV = ROOT / "data" / "processed" / "plaid_rotor37_features.csv"

# 通道布局（build_pointcloud_dataset.py 定义）
# 0-2 坐标, 3 Pressure, 4 Density, 5 Temperature, 6-8 Normals(X/Y/Z)
EXPECTED = {
    "Pressure":     (3, (5e3, 3e5)),     # 真实数据实测 1.3e4–2.7e5
    "Density":      (4, (0.1, 5.0)),     # 真实数据实测 0.12–2.4
    "Temperature":  (5, (200, 800)),
    "NormalsX":     (6, (-1.2, 1.2)),
    "NormalsY":     (7, (-1.2, 1.2)),
    "NormalsZ":     (8, (-1.2, 1.2)),
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("npz", nargs="?", default=str(DEFAULT_NPZ))
    args = ap.parse_args()

    path = Path(args.npz)
    if not path.exists():
        print(f"❌ 文件不存在：{path}")
        sys.exit(1)

    d = np.load(path)
    print(f"✅ 文件存在：{path} ({path.stat().st_size/1e6:.1f} MB)")
    print(f"   keys: {list(d.keys())}")
    for k in ["sample_id", "X_pc", "conds", "y"]:
        if k not in d:
            print(f"❌ 缺少 key: {k}")
            sys.exit(1)

    X, conds, y, sid = d["X_pc"], d["conds"], d["y"], d["sample_id"]
    S, N, C = X.shape
    print(f"   X_pc: {S}×{N}×{C} | conds: {conds.shape} | y: {y.shape}")

    # 通道数判定
    print("\n── 通道完整性 ──")
    if C == 3:
        print("⚠️ 仅坐标（3 通道）——场量缺失，需重新构建（确保用最新 build_pointcloud_dataset.py）")
    elif C == 6:
        print("⚠️ 坐标+场量但缺法向（6 通道）——检查 Normals 提取")
    elif C == 9:
        print("✅ 完整 9 通道（坐标+场量+法向）")
    else:
        print(f"❌ 异常通道数 {C}（期望 3/6/9）")

    # 每列统计 + 物理范围检查
    print("\n── 每列统计（mean / std / min / max）──")
    for i in range(min(C, 9)):
        col = X[:, :, i]
        print(f"  ch{i}: {col.mean():.4g} / {col.std():.4g} / {col.min():.4g} / {col.max():.4g}")
    if C >= 6:
        print("\n── 场量物理范围检查 ──")
        for name, (idx, (lo, hi)) in EXPECTED.items():
            if idx < C:
                col = X[:, :, idx]
                ok = (col.min() >= lo) and (col.max() <= hi)
                print(f"  {name:12s}(ch{idx}): {'✅' if ok else '⚠️'} 范围 [{col.min():.4g}, {col.max():.4g}] 期望 ({lo}, {hi})")

    # 与特征 CSV 对齐
    print("\n── 与特征 CSV 对齐 ──")
    try:
        import pandas as pd
        df = pd.read_csv(FEATURES_CSV)
        ref_ids = set(df["sample_id"].tolist())
        npz_ids = set(sid.tolist())
        missing = ref_ids - npz_ids
        extra = npz_ids - ref_ids
        print(f"  特征CSV样本数: {len(ref_ids)} | npz样本数: {len(npz_ids)}")
        if not missing and not extra:
            print("  ✅ 完全对齐")
        else:
            print(f"  ⚠️ 缺 {len(missing)} 个 | 多 {len(extra)} 个")
            if missing:
                print(f"     缺: {sorted(missing)[:10]}")
    except Exception as e:
        print(f"  ⚠️ 对齐检查失败: {e}")

    print("\n结论：")
    if C >= 6:
        print("  数据可用于 P1/P2/P3 训练（含场预测）。")
    else:
        print("  建议重新构建数据（git pull 最新 build_pointcloud_dataset.py 后重跑）。")


if __name__ == "__main__":
    main()
