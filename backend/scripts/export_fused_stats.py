"""
export_fused_stats.py
导出 fused ONNX 部署所需的反标准化参数（训练时的 y 标准化 ym/ys）

在 Codespaces（训练 fused_best.pt 的环境）跑一次，生成 backend/models/fused_stats.json，
让后端 /api/predict/fused 能把 ONNX 输出的标准化值还原成真实 π/η/ṁ。

用法：
    python backend/scripts/export_fused_stats.py
输出：backend/models/fused_stats.json
    {"y_mu": [...], "y_sd": [...], "in_mu_3_9": [...], "in_sd_3_9": [...],
     "stats_mu": [...], "stats_sd": [...], "n_points": 512}
"""

import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))
from scripts.train_fused_p1 import load_stats, load_data, align_by_sample_id, SEED

DATA_PC = ROOT / "data" / "processed" / "pointcloud" / "rotor37_pc.npz"
OUT_PATH = ROOT / "backend" / "models" / "fused_stats.json"


def main():
    if not DATA_PC.exists():
        raise SystemExit(f"❌ 未找到 {DATA_PC}，需在 Codespaces（有真数据）运行")

    X_stats, y_stats, sid_stats = load_stats()
    X_pc, conds, y_pc, sid_pc = load_data(DATA_PC)
    # 与 train_fused_p1.py 一致的降采样种子（512 点）
    rng = np.random.default_rng(SEED)
    idx = rng.choice(X_pc.shape[1], 512, replace=False)
    X_pc = X_pc[:, idx, :]
    Xs, Xp, cs, ys = align_by_sample_id(X_stats, y_stats, sid_stats,
                                        X_pc, y_pc, sid_pc, conds)

    # 训练时用的标准化参数（与 train_fused_p1.py 一致）
    from sklearn.model_selection import train_test_split
    idx_tr, _ = train_test_split(np.arange(len(ys)), test_size=0.10, random_state=SEED)
    Xs_tr = Xs[idx_tr]
    Xp_tr = Xp[idx_tr]
    ys_tr = ys[idx_tr]

    stats_mu = Xs_tr.mean(0).tolist()
    stats_sd = Xs_tr.std(0).tolist()
    in_mu = Xp_tr[:, :, 3:9].mean(axis=(0, 1)).tolist()
    in_sd = Xp_tr[:, :, 3:9].std(axis=(0, 1)).tolist()
    y_mu = ys_tr.mean(0).tolist()
    y_sd = ys_tr.std(0).tolist()

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump({
            "y_mu": y_mu, "y_sd": y_sd,
            "in_mu_3_9": in_mu, "in_sd_3_9": in_sd,
            "stats_mu": stats_mu, "stats_sd": stats_sd,
            "n_points": 512,
        }, f, ensure_ascii=False, indent=2)
    print(f"✅ 已导出 {OUT_PATH}")
    print(f"   y_mu={[round(v,4) for v in y_mu]}  y_sd={[round(v,4) for v in y_sd]}")


if __name__ == "__main__":
    main()
