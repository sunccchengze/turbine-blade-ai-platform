"""
train_fused_p1.py
P1 双头融合模型（内阁裁决版完整实现）：统计特征头 + 点云头 → 融合 → 标量

背景：纯点云学标量比 74 维统计特征慢（真数据 15epoch: π0.92/η0.61/ṁ0.95 vs 基线 0.98/0.96/0.98）。
双头融合 = 统计特征（对标量强相关）+ 点云（新增场预测能力）→ 标量有保底、场是独有增量。

架构：
    stats (74)  ──► MLP ──► 特征 s (64) ──┐
                                          ├──► 融合 ──► 标量头 ──► (π, η, ṁ)
    X_pc (N,C) ──► PointNet ──► 特征 g (256) ──┘
                                          └──► 场头 ──► 表面场（可选）

用法（真实数据在 data/processed/pointcloud/ 且特征 CSV 存在）：
    python backend/scripts/train_fused_p1.py --epochs 50 --batch_size 32
    python backend/scripts/train_fused_p1.py --epochs 40 --batch_size 8 --n_points 1024 --input_mode geometry-conditioned
    python backend/scripts/train_fused_p1.py --smoke   # 合成冒烟

输入模式：
- field-conditioned：9 通道 + 74 维场统计量，仅作场条件融合诊断对照。
- geometry-conditioned：坐标 + Normals + 工况，统计特征剔除 Pressure/Density/Temperature，
  用于无目标场泄漏的前向实验。

输出：data/processed/p1/fused_runs/<ts>/（metrics.json 含 R² 对比）
"""

import argparse
import json
import sys
import time
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))
from scripts.train_pointnet_p1 import (
    DualHeadSurrogate, load_data, train_val_split, mask_from_points,
    build_smoke_data, SEED, DATA_PC, DATA_PC_SYNTH,
)

FEATURES_CSV = ROOT / "data" / "processed" / "plaid_rotor37_features.csv"
RUNS_DIR = ROOT / "data" / "processed" / "p1" / "fused_runs"


def load_stats(input_mode="field-conditioned"):
    """加载统计特征，并按输入模式剔除目标场统计量。"""
    import pandas as pd
    df = pd.read_csv(FEATURES_CSV)
    out = ['Compression_ratio', 'Efficiency', 'Massflow']
    inc = [c for c in df.columns if c not in ['sample_id'] + out]
    if input_mode == "geometry-conditioned":
        # 几何前向模式只允许工况、坐标统计量和法向统计量。
        # Pressure/Density/Temperature 统计量均来自 CFD 场，必须排除以防目标泄漏。
        blocked = ("Pressure", "Density", "Temperature")
        inc = [c for c in inc if not c.startswith(blocked)]
    X = df[inc].values.astype(np.float32)
    y = df[out].values.astype(np.float32)
    sid = df['sample_id'].values
    return X, y, sid, inc


def align_by_sample_id(X_stats, y_stats, sid_stats, X_pc, y_pc, sid_pc, conds,
                       field_targets=None):
    """按 sample_id 对齐统计特征、点云、场监督目标和工况。"""
    sid_stats = sid_stats.astype(np.int64)
    sid_pc = sid_pc.astype(np.int64)
    idx_s = {s: i for i, s in enumerate(sid_stats)}
    idx_p = {s: i for i, s in enumerate(sid_pc)}
    common = sorted(set(idx_s) & set(idx_p))
    Xs = np.stack([X_stats[idx_s[s]] for s in common])
    Xp = np.stack([X_pc[idx_p[s]] for s in common])
    ys = np.stack([y_pc[idx_p[s]] for s in common])
    cs = np.stack([conds[idx_p[s]] for s in common])
    ft = None if field_targets is None else np.stack([field_targets[idx_p[s]] for s in common])
    print(f"  对齐样本数：{len(common)}")
    return Xs, Xp, cs, ys, ft


# ── 双头融合模型 ─────────────────────────────────────────
def make_fused_model(n_stats, n_pc_channels, n_cond=2, n_scalar=3,
                     n_field=2, latent=256, fused_hidden=128):
    import torch
    import torch.nn as nn

    class FusedSurrogate(nn.Module):
        def __init__(self):
            super().__init__()
            self.pc_encoder = DualHeadSurrogate(n_pc_channels, n_cond).encoder  # 复用 PointNet 编码器
            self.stats_head = nn.Sequential(
                nn.Linear(n_stats, 128), nn.BatchNorm1d(128), nn.ReLU(),
                nn.Linear(128, 64), nn.BatchNorm1d(64), nn.ReLU(),
            )
            self.fuse = nn.Sequential(
                nn.Linear(256 + 64 + n_cond, fused_hidden), nn.ReLU(),
                nn.Linear(fused_hidden, fused_hidden), nn.ReLU(),
            )
            self.scalar_head = nn.Linear(fused_hidden, n_scalar)
            # 场头（可选）：点云逐点特征 + 全局 → 表面场
            self.point_proj = nn.Sequential(
                nn.Linear(n_pc_channels, 64), nn.ReLU(),
            )
            self.field_head = nn.Sequential(
                nn.Linear(256 + 64, 128), nn.ReLU(),
                nn.Linear(128, n_field),
            )

        def forward(self, x_pc, stats, conds, need_field=False):
            B, N, C = x_pc.shape
            g = self.pc_encoder(x_pc)                 # (B, 256)
            s = self.stats_head(stats)                # (B, 64)
            feat = self.fuse(torch.cat([g, s, conds], dim=-1))
            scalar = self.scalar_head(feat)
            if not need_field:
                return scalar
            pp = self.point_proj(x_pc.reshape(-1, C)).reshape(B, N, 64)
            g_exp = g.unsqueeze(1).expand(-1, N, -1)
            field = self.field_head(torch.cat([g_exp, pp], dim=-1))
            return scalar, field

    return FusedSurrogate


def train_fused(model, data, args):
    import torch
    import torch.nn as nn
    from sklearn.model_selection import train_test_split

    Xs, Xp, cs, ys, field_targets = data
    # 划分（同口径 random_state=42）
    idx_tr, idx_te = train_test_split(np.arange(len(ys)), test_size=0.10,
                                      random_state=args.split_seed)
    Xs_tr, Xs_te = Xs[idx_tr], Xs[idx_te]
    Xp_tr, Xp_te = Xp[idx_tr], Xp[idx_te]
    cs_tr, cs_te = cs[idx_tr], cs[idx_te]
    ys_tr, ys_te = ys[idx_tr], ys[idx_te]
    ft_tr = None if field_targets is None else field_targets[idx_tr]
    ft_te = None if field_targets is None else field_targets[idx_te]

    # 标准化
    sm, ss = Xs_tr.mean(0), Xs_tr.std(0) + 1e-6
    Xs_tr_s, Xs_te_s = (Xs_tr - sm) / ss, (Xs_te - sm) / ss
    cm, cS = cs_tr.mean(0), cs_tr.std(0) + 1e-6
    cs_tr_s, cs_te_s = (cs_tr - cm) / cS, (cs_te - cm) / cS
    ym, ys_ = ys_tr.mean(0), ys_tr.std(0) + 1e-6
    ys_tr_s = (ys_tr - ym) / ys_

    device = next(model.parameters()).device
    opt = torch.optim.Adam(model.parameters(), lr=args.lr, weight_decay=1e-4)
    w = torch.tensor([1.0, 3.0, 1.5], device=device)
    # 场监督目标始终是 [Pressure, Temperature]，但它们必须独立于输入。
    # field-conditioned 模式的输入含场量，仅作为诊断对照；geometry-conditioned
    # 模式的输入只有坐标+Normals，场头才是严格前向预测。
    use_field = field_targets is not None and hasattr(model, 'field_head')
    C = Xp.shape[2]
    if use_field:
        if C >= 9:
            # field-conditioned：只标准化输入中的场量列；目标仍从独立 ft_* 读取。
            in_mu = Xp_tr[:, :, 3:9].mean(axis=(0, 1), keepdims=True)
            in_sd = Xp_tr[:, :, 3:9].std(axis=(0, 1), keepdims=True) + 1e-6
            Xp_tr_n = Xp_tr.copy(); Xp_tr_n[:, :, 3:9] = (Xp_tr[:, :, 3:9] - in_mu) / in_sd
            Xp_te_n = Xp_te.copy(); Xp_te_n[:, :, 3:9] = (Xp_te[:, :, 3:9] - in_mu) / in_sd
        else:
            # geometry-conditioned：坐标+Normals 输入，不做任何目标场拼接。
            Xp_tr_n, Xp_te_n = Xp_tr, Xp_te
        field_mu = ft_tr.mean(axis=(0, 1), keepdims=True)
        field_sd = ft_tr.std(axis=(0, 1), keepdims=True) + 1e-6
        masks = (np.abs(Xp_tr[:, :, :3]).sum(-1) > 1e-6).astype(np.float32)
    else:
        Xp_tr_n, Xp_te_n = Xp_tr, Xp_te
        masks = None
    n = len(ys_tr)
    for ep in range(args.epochs):
        model.train()
        perm = torch.randperm(n)
        tot = 0.0
        for i in range(0, n, args.batch_size):
            idx = perm[i:i + args.batch_size]
            xp = torch.tensor(Xp_tr_n[idx], device=device)
            st = torch.tensor(Xs_tr_s[idx], device=device)
            c = torch.tensor(cs_tr_s[idx], device=device)
            yb = torch.tensor(ys_tr_s[idx], device=device)
            opt.zero_grad()
            if use_field:
                pred, f_pred = model(xp, st, c, need_field=True)
                f_target = (torch.tensor(ft_tr[idx], device=device)
                             - torch.tensor(field_mu, device=device)) / torch.tensor(field_sd, device=device)
                mb = torch.tensor(masks[idx], device=device)
                l_f = ((f_pred - f_target) ** 2).mean(dim=-1) * mb
                l_f = l_f.sum() / (mb.sum().clamp(min=1))
            else:
                pred = model(xp, st, c)
                l_f = torch.zeros((), device=device)
            loss = (((pred - yb) ** 2).mean(0) * w).sum() + args.lam_field * l_f
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            opt.step()
            tot += loss.item() * len(idx)
        if (ep + 1) % max(1, args.epochs // 5) == 0 or ep == 0:
            print(f"  epoch {ep+1:>3}/{args.epochs} loss={tot/max(n,1):.4f}")

    # 测试（标量 + 场）
    model.eval()
    with torch.no_grad():
        xp = torch.tensor(Xp_te_n, device=device)
        st = torch.tensor(Xs_te_s, device=device)
        c = torch.tensor(cs_te_s, device=device)
        if use_field:
            pred, f_pred = model(xp, st, c, need_field=True)
            f_pred_np = f_pred.cpu().numpy() * field_sd + field_mu
            f_true_np = ft_te
        else:
            pred = model(xp, st, c)
        pred = pred.cpu().numpy() * ys_ + ym
    from sklearn.metrics import r2_score
    names = ["Compression_ratio", "Efficiency", "Massflow"]
    r2 = {names[i]: float(r2_score(ys_te[:, i], pred[:, i])) for i in range(3)}
    field_metrics = {}
    if use_field:
        m_te = (np.abs(Xp_te[:, :, :3]).sum(-1) > 1e-6)
        diff = f_pred_np - f_true_np
        diff_masked = diff[m_te]
        true_masked = f_true_np[m_te]
        rel_l2 = float(np.linalg.norm(diff_masked)
                       / max(np.linalg.norm(true_masked), 1e-8))
        mae = float(np.abs(diff_masked).mean())
        channel_names = {3: "Pressure", 5: "Temperature"}
        by_channel = {}
        for j, col in enumerate([3, 5]):
            d_j = diff[:, :, j][m_te]
            t_j = f_true_np[:, :, j][m_te]
            by_channel[channel_names.get(col, f"channel_{col}")] = {
                "rel_l2": float(np.linalg.norm(d_j) / max(np.linalg.norm(t_j), 1e-8)),
                "mae": float(np.abs(d_j).mean()),
            }
        field_metrics = {"rel_l2": rel_l2, "mae": mae, "by_channel": by_channel}
        print(f"  场指标: rel_l2={rel_l2:.4f} mae={mae:.4f} (aggregate; raw units)")
        for name, metrics in by_channel.items():
            print(f"    {name}: rel_l2={metrics['rel_l2']:.4f} mae={metrics['mae']:.4f} (raw units)")
    return r2, field_metrics


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--smoke", action="store_true")
    ap.add_argument("--epochs", type=int, default=50)
    ap.add_argument("--batch_size", type=int, default=32)
    ap.add_argument("--lr", type=float, default=1e-3)
    ap.add_argument("--n_points", type=int, default=None)
    ap.add_argument("--lam_field", type=float, default=0.5,
                    help="场损失权重（越大场预测越准，可能略损标量）")
    ap.add_argument("--input_mode", choices=["field-conditioned", "geometry-conditioned"],
                    default="field-conditioned",
                    help="field-conditioned=9通道诊断对照；geometry-conditioned=仅坐标+Normals，防目标泄漏")
    ap.add_argument("--seed", type=int, default=SEED,
                    help="随机种子：控制点云降采样、初始化和训练顺序；默认 42")
    ap.add_argument("--split_seed", type=int, default=SEED,
                    help="固定 train/test 划分随机种子；多 seed 稳定性实验建议保持 42")
    args = ap.parse_args()

    import torch
    np.random.seed(args.seed); torch.manual_seed(args.seed)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"设备：{device}")

    if args.smoke:
        X_pc, conds, y = build_smoke_data(n=200, n_points=512)
        X_stats = np.random.randn(200, 74).astype(np.float32)
        sid = np.arange(200)
        Xs, Xp, cs, ys, field_targets = align_by_sample_id(
            X_stats, y, sid, X_pc, y, sid, conds, X_pc[:, :, :2])
    else:
        X_stats, y_stats, sid_stats, stat_names = load_stats(args.input_mode)
        path = DATA_PC if DATA_PC.exists() else DATA_PC_SYNTH
        if not path.exists():
            raise SystemExit("❌ 未找到点云数据，先构建")
        X_pc_full, conds, y, sid_pc = load_data(path)
        # 场监督目标单独保存，严禁把目标场随输入模式一起丢失。
        field_targets = X_pc_full[:, :, [3, 5]] if X_pc_full.shape[2] >= 6 else None
        if args.input_mode == "geometry-conditioned":
            if X_pc_full.shape[2] < 9:
                raise SystemExit("❌ geometry-conditioned 需要 9 通道点云以提取坐标+Normals")
            X_pc = np.concatenate([X_pc_full[:, :, :3], X_pc_full[:, :, 6:9]], axis=2)
            print(f"  输入模式：geometry-conditioned（统计特征 {len(stat_names)} 维，点云 6 通道）")
        else:
            X_pc = X_pc_full
            print(f"  输入模式：field-conditioned（统计特征 {len(stat_names)} 维，点云 9 通道；诊断对照）")
        if args.n_points and X_pc.shape[1] > args.n_points:
            rng = np.random.default_rng(args.seed)
            idx = rng.choice(X_pc.shape[1], args.n_points, replace=False)
            X_pc = X_pc[:, idx, :]
            field_targets = field_targets[:, idx, :] if field_targets is not None else None
            print(f"  降采样到 {args.n_points} 点")
        Xs, Xp, cs, ys, ft = align_by_sample_id(
            X_stats, y_stats, sid_stats, X_pc, y, sid_pc, conds, field_targets)
        field_targets = ft

    C = Xp.shape[2]
    Fused = make_fused_model(Xs.shape[1], C)
    model = Fused().to(device)
    n_params = sum(p.numel() for p in model.parameters())
    print(f"模型参数量：{n_params:,}")

    t0 = time.time()
    r2, field_metrics = train_fused(model, (Xs, Xp, cs, ys, field_targets), args)
    elapsed = time.time() - t0

    print(f"\n===== 双头融合 测试集 R²（口径：留出 10%, split_seed={args.split_seed}）=====")
    for k, v in r2.items():
        print(f"  {k:18s} R² = {v:.4f}")
    if field_metrics:
        print(f"  场指标: {field_metrics}")
    print(f"  训练耗时：{elapsed:.1f}s")

    ts = time.strftime("%Y%m%d-%H%M%S")
    run_dir = RUNS_DIR / ts
    run_dir.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), run_dir / "fused_best.pt")
    with open(run_dir / "metrics.json", "w", encoding="utf-8") as f:
        json.dump({"r2": r2, "field": field_metrics, "n_params": n_params,
                   "elapsed_s": elapsed, "seed": args.seed, "split_seed": args.split_seed,
                   "input_mode": args.input_mode,
                   "note": "双头融合（统计特征+点云）；geometry-conditioned 模式屏蔽目标场输入"}, 
                  f, ensure_ascii=False, indent=2)
    print(f"✅ 已保存：{run_dir}")


if __name__ == "__main__":
    main()
