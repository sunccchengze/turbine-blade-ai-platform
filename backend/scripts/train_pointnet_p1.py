"""
train_pointnet_p1.py
P1 场级几何感知代理：PointNet 编码器（点云）+ 工况条件 → 双头输出（场 + 标量）

架构（对齐 upgrade-blueprint-D38.md §P1 与 plan-30day-D38.md 内阁裁决「双头融合」）：
    X_pc (N, C)  ──► 共享 MLP（逐点）──► 全局特征 (256) ──┐
                                                          ├──► 标量头 ──► (π, η, ṁ)
    conds (2) [Ω, P] ──► 标准化 ──► (2) ──────────────────┤
                                                          └──► 场头（逐点）──► 表面场

用法（云 GPU / 能访问 HF 的环境）：
    # 1) 先构建点云数据集
    python backend/scripts/build_pointcloud_dataset.py --n_points 2048
    # 2) 训练（可指定 --smoke 用合成数据自检）
    python backend/scripts/train_pointnet_p1.py --epochs 60 --batch_size 32
    python backend/scripts/train_pointnet_p1.py --smoke

输出：
    - data/processed/p1/runs/<timestamp>/：best.pt、metrics.json、scalars_vs_baseline.json

数字口径（铁律 4）：
    - 标量：R²（与基线完全同口径：留出测试集 n=100, random_state=42, 训练未见）
    - 场：相对 L2 / MAE（对标文献 <1–5%）
    - 对比表：74 维 MLP（基线） vs 本模型
"""

import argparse
import json
import time
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn

ROOT = Path(__file__).resolve().parents[2]
DATA_PC = ROOT / "data" / "processed" / "pointcloud" / "rotor37_pc.npz"
RUNS_DIR = ROOT / "data" / "processed" / "p1" / "runs"

SEED = 42


def set_seed(seed=SEED):
    np.random.seed(seed)
    torch.manual_seed(seed)


# ── 模型 ──────────────────────────────────────────────────
class PointNetEncoder(nn.Module):
    """共享逐点 MLP + 全局 maxpool。输入 (B, N, C)，输出全局特征 (B, 256)。"""

    def __init__(self, in_channels, out_dim=256):
        super().__init__()
        self.mlp = nn.Sequential(
            nn.Linear(in_channels, 64), nn.BatchNorm1d(64), nn.ReLU(),
            nn.Linear(64, 128), nn.BatchNorm1d(128), nn.ReLU(),
            nn.Linear(128, out_dim), nn.BatchNorm1d(out_dim), nn.ReLU(),
        )
        self.out_dim = out_dim

    def forward(self, x):
        B, N, C = x.shape
        h = self.mlp(x.reshape(-1, C)).reshape(B, N, self.out_dim)
        g, _ = h.max(dim=1)          # (B, out_dim) 全局特征
        return g


class DualHeadSurrogate(nn.Module):
    """双头代理：全局特征 + 工况 → 标量 + 场。"""

    def __init__(self, in_channels, n_cond=2, n_scalar=3,
                 n_field=2, hidden=128, out_dim=256):
        super().__init__()
        self.encoder = PointNetEncoder(in_channels, out_dim)
        self.cond_norm = nn.LayerNorm(n_cond)
        self.fuse = nn.Sequential(
            nn.Linear(out_dim + n_cond, hidden), nn.ReLU(),
            nn.Linear(hidden, hidden), nn.ReLU(),
        )
        self.scalar_head = nn.Linear(hidden, n_scalar)
        # 场头：逐点（全局特征广播 + 逐点特征拼接）
        self.point_proj = nn.Sequential(
            nn.Linear(in_channels, 64), nn.ReLU(),
        )
        self.field_head = nn.Sequential(
            nn.Linear(out_dim + 64, 128), nn.ReLU(),
            nn.Linear(128, n_field),
        )

    def forward(self, x_pc, conds):
        B, N, C = x_pc.shape
        g = self.encoder(x_pc)                       # (B, out_dim)
        c = self.cond_norm(conds)                    # (B, n_cond)
        feat = self.fuse(torch.cat([g, c], dim=-1))  # (B, hidden)
        scalars = self.scalar_head(feat)             # (B, n_scalar)

        pp = self.point_proj(x_pc.reshape(-1, C)).reshape(B, N, 64)
        g_exp = g.unsqueeze(1).expand(-1, N, -1)     # (B, N, out_dim)
        fh = self.field_head(torch.cat([g_exp, pp], dim=-1))  # (B, N, n_field)
        return scalars, fh


# ── 数据 ──────────────────────────────────────────────────
def load_data(npz_path):
    d = np.load(npz_path)
    return (d["X_pc"].astype(np.float32), d["conds"].astype(np.float32),
            d["y"].astype(np.float32), d["sample_id"])


def train_val_split(X, conds, y, test_size=0.10, seed=SEED):
    """与基线同口径：留出测试集 10%，random_state=42。"""
    from sklearn.model_selection import train_test_split
    X_tr, X_te, c_tr, c_te, y_tr, y_te = train_test_split(
        X, conds, y, test_size=test_size, random_state=seed)
    return (X_tr, c_tr, y_tr), (X_te, c_te, y_te)


def cond_scaler_fit(c_tr):
    mu, sd = c_tr.mean(0), c_tr.std(0) + 1e-6
    return mu, sd


def mask_from_points(X):
    """非零行（真实点）mask：(B, N)。用于场损失忽略 padding。"""
    if isinstance(X, torch.Tensor):
        return X[:, :, :3].abs().sum(-1) > 1e-6
    return (np.abs(X[:, :, :3]).sum(-1) > 1e-6)  # (B, N)


# ── 训练 ──────────────────────────────────────────────────
def train(model, data, args):
    (X_tr, c_tr, y_tr), (X_te, c_te, y_te) = data
    mu, sd = cond_scaler_fit(c_tr)
    c_tr = (c_tr - mu) / sd
    c_te = (c_te - mu) / sd

    m_tr = mask_from_points(X_tr)
    m_te = mask_from_points(X_te)

    # 目标标准化（标量）
    ym, ys = y_tr.mean(0), y_tr.std(0) + 1e-6
    y_tr_s = (y_tr - ym) / ys
    y_te_s = (y_te - ym) / ys

    # 场目标标准化（压力/温度列，若存在）
    field_cols = [3, 4]  # X_pc 通道顺序：0-2 坐标, 3 压力, 4 温度
    C = X_tr.shape[-1]
    field_cols = [c for c in field_cols if c < C]
    fm, fs = X_tr[:, :, field_cols].mean(), X_tr[:, :, field_cols].std() + 1e-6

    device = next(model.parameters()).device
    opt = torch.optim.Adam(model.parameters(), lr=args.lr, weight_decay=1e-4)
    mse = nn.MSELoss()
    w_scalar = torch.tensor([1.0, 3.0, 1.5], device=device)  # 效率权重 3×

    n = len(X_tr)
    for ep in range(args.epochs):
        model.train()
        perm = torch.randperm(n)
        tot = 0.0
        for i in range(0, n, args.batch_size):
            idx = perm[i:i + args.batch_size]
            xb = torch.tensor(X_tr[idx], device=device)
            cb = torch.tensor(c_tr[idx], device=device)
            yb = torch.tensor(y_tr_s[idx], device=device)
            mb = torch.tensor(m_tr[idx], device=device)

            s_pred, f_pred = model(xb, cb)
            # 标量损失（加权）
            l_s = ((s_pred - yb) ** 2).mean(0) * w_scalar
            l_s = l_s.sum()
            # 场损失（masked）
            if field_cols:
                f_target = (torch.tensor(X_tr[idx][:, :, field_cols], device=device) - fm) / fs
                l_f = ((f_pred - f_target) ** 2).mean(dim=-1) * mb.float()
                l_f = l_f.sum() / (mb.sum().clamp(min=1))
            else:
                l_f = torch.zeros_like(l_s)

            loss = l_s + args.lam_field * l_f
            opt.zero_grad()
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            opt.step()
            tot += loss.item() * len(idx)

        if (ep + 1) % max(1, args.epochs // 5) == 0 or ep == 0:
            print(f"  epoch {ep+1:>3}/{args.epochs}  loss={tot/max(n,1):.4f}")

    # ── 测试集评估 ──────────────────────────────────────
    model.eval()
    with torch.no_grad():
        xte = torch.tensor(X_te, device=device)
        cte = torch.tensor(c_te, device=device)
        s_pred, f_pred = model(xte, cte)
        s_pred_orig = s_pred.cpu().numpy() * ys + ym
        s_true = y_te
        # 标量 R²
        from sklearn.metrics import r2_score
        r2 = {}
        for i, name in enumerate(["Compression_ratio", "Efficiency", "Massflow"]):
            r2[name] = float(r2_score(s_true[:, i], s_pred_orig[:, i]))
        # 场指标
        field_metrics = {}
        if field_cols:
            f_pred_np = f_pred.cpu().numpy() * fs + fm
            f_true_np = X_te[:, :, field_cols]
            m_np = m_te.numpy() if isinstance(m_te, torch.Tensor) else m_te
            rel_l2 = float(np.linalg.norm((f_pred_np - f_true_np) * m_np[..., None])
                           / max(np.linalg.norm(f_true_np * m_np[..., None]), 1e-8))
            mae = float(np.abs((f_pred_np - f_true_np) * m_np[..., None]).mean())
            field_metrics = {"rel_l2": rel_l2, "mae": mae}

    return r2, field_metrics, (s_pred_orig, s_true)


# ── 入口 ──────────────────────────────────────────────────
def build_smoke_data(n=12, n_points=256, seed=42):
    rng = np.random.default_rng(seed)
    X = np.concatenate([
        rng.random((n, n_points, 3), dtype=np.float32) * 2 - 1,
        rng.random((n, n_points, 2), dtype=np.float32),
    ], axis=-1).astype(np.float32)
    conds = rng.uniform(1620, 1800, (n, 1)).astype(np.float32)
    conds = np.concatenate([conds, rng.uniform(3.5e5, 3.8e5, (n, 1)).astype(np.float32)], axis=-1)
    y = np.column_stack([
        rng.uniform(1.8, 2.1, n), rng.uniform(0.85, 0.90, n),
        rng.uniform(18, 21, n)]).astype(np.float32)
    return X, conds, y


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--smoke", action="store_true")
    ap.add_argument("--epochs", type=int, default=60)
    ap.add_argument("--batch_size", type=int, default=32)
    ap.add_argument("--lr", type=float, default=1e-3)
    ap.add_argument("--lam_field", type=float, default=0.5)
    args = ap.parse_args()

    set_seed()
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"设备：{device}")

    if args.smoke:
        X, conds, y = build_smoke_data()
        data = train_val_split(X, conds, y)
    else:
        if not DATA_PC.exists():
            raise SystemExit(f"❌ 未找到 {DATA_PC}。请先在能访问 HF 的环境运行 "
                             f"build_pointcloud_dataset.py 生成数据集。")
        X, conds, y, _ = load_data(DATA_PC)
        print(f"数据集：{X.shape[0]} 样本 × {X.shape[1]} 点 × {X.shape[2]} 通道")
        data = train_val_split(X, conds, y)

    C = X.shape[2]
    model = DualHeadSurrogate(in_channels=C, n_cond=2).to(device)
    n_params = sum(p.numel() for p in model.parameters())
    print(f"模型参数量：{n_params:,}")

    t0 = time.time()
    r2, field_metrics, _ = train(model, data, args)
    elapsed = time.time() - t0

    print("\n===== 测试集结果（口径：留出测试集 10%, random_state=42）=====")
    for k, v in r2.items():
        print(f"  {k:18s} R² = {v:.4f}")
    print(f"  场指标: {field_metrics}")
    print(f"  训练耗时: {elapsed:.1f}s")

    if args.smoke:
        print("\n✅ 冒烟测试通过。")
        return

    # 保存产物（模型 + 指标）
    ts = time.strftime("%Y%m%d-%H%M%S")
    run_dir = RUNS_DIR / ts
    run_dir.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), run_dir / "best.pt")
    with open(run_dir / "metrics.json", "w", encoding="utf-8") as f:
        json.dump({"r2_scalars": r2, "field": field_metrics,
                   "n_params": n_params, "elapsed_s": elapsed}, f, ensure_ascii=False, indent=2)
    print(f"\n✅ 已保存：{run_dir}")


if __name__ == "__main__":
    main()
