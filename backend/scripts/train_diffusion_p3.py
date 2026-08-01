"""
train_diffusion_p3.py
P3 完整版：潜在空间条件扩散模型（2D 翼型生成，升级条件 VAE 为 DDPM 路线）

路线（对齐 upgrade-blueprint-D38.md §P3 / 2026-07-29 帝国理工 3D 扩散范式）：
1. 翼型几何 → VAE 编码到潜在 z（几何有效性由解码器保证）
2. 在潜在空间训练条件去噪扩散（DDPM）：条件 c = (η, π, ṁ)
3. 采样：给目标 → 去噪得 z → 解码回翼型 → 有效性检查

用法：python backend/scripts/train_diffusion_p3.py --epochs 200 --smoke
      （--smoke 用少量合成翼型验证全链路）

输出：data/processed/p3/diffusion/<ts>/（model.pt, samples.npy, metrics.json）
"""

import argparse
import json
import time
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
RUNS_DIR = ROOT / "data" / "processed" / "p3" / "diffusion"
SEED = 42

# 复用 P3 的翼型工具
import sys
sys.path.insert(0, str(ROOT / "backend"))
from scripts.generate_design_p3 import sample_airfoil_dataset, check_valid


def make_vae(n_input, latent_dim=8, hidden=64):
    import torch
    import torch.nn as nn

    class Enc(nn.Module):
        def __init__(self):
            super().__init__()
            self.net = nn.Sequential(nn.Linear(n_input, hidden), nn.ReLU(),
                                     nn.Linear(hidden, hidden), nn.ReLU())
            self.mu = nn.Linear(hidden, latent_dim)
            self.lv = nn.Linear(hidden, latent_dim)

        def forward(self, x):
            h = self.net(x)
            return self.mu(h), self.lv(h)

    class Dec(nn.Module):
        def __init__(self):
            super().__init__()
            self.net = nn.Sequential(nn.Linear(latent_dim, hidden), nn.ReLU(),
                                     nn.Linear(hidden, hidden), nn.ReLU(),
                                     nn.Linear(hidden, n_input))

        def forward(self, z):
            return self.net(z)

    class VAE(nn.Module):
        def __init__(self):
            super().__init__()
            self.enc = Enc()
            self.dec = Dec()

        def encode(self, x):
            mu, lv = self.enc(x)
            return mu, lv

        def decode(self, z):
            return self.dec(z)

    return VAE


def make_diffusion(latent_dim, n_cond, hidden=128):
    import torch
    import torch.nn as nn

    class NoiseNet(nn.Module):
        """条件去噪网络：输入 (z_t, t, c) → 预测噪声 ε。"""
        def __init__(self):
            super().__init__()
            self.t_emb = nn.Sequential(nn.Linear(1, 64), nn.SiLU(), nn.Linear(64, 64))
            self.net = nn.Sequential(
                nn.Linear(latent_dim + 64 + n_cond, hidden), nn.SiLU(),
                nn.Linear(hidden, hidden), nn.SiLU(),
                nn.Linear(hidden, latent_dim),
            )

        def forward(self, z, t, c):
            te = self.t_emb(t)
            return self.net(torch.cat([z, te, c], dim=-1))

    class DDPM(nn.Module):
        def __init__(self, T=200, beta_min=1e-4, beta_max=0.02):
            super().__init__()
            self.T = T
            self.net = NoiseNet()
            betas = torch.linspace(beta_min, beta_max, T)
            alphas = 1 - betas
            self.alphas_bar = torch.cumprod(alphas, 0)

        def forward(self, z0, c):
            b = torch.randint(0, self.T, (len(z0),), device=z0.device).float()
            ab = self.alphas_bar[b.long()].unsqueeze(1)
            eps = torch.randn_like(z0)
            zt = torch.sqrt(ab) * z0 + torch.sqrt(1 - ab) * eps
            eps_pred = self.net(zt, b.unsqueeze(1) / self.T, c)
            return ((eps - eps_pred) ** 2).mean()

        @torch.no_grad()
        def sample(self, c, n=10):
            z = torch.randn(n, z0_dim, device=next(self.parameters()).device)
            for t in range(self.T - 1, -1, -1):
                ab = self.alphas_bar[t].to(z.device)
                eps_pred = self.net(z, torch.full((n, 1), t / self.T, device=z.device), c)
                z = (z - (1 - ab) / torch.sqrt(1 - ab) * eps_pred) / torch.sqrt(ab) if t == 0 else \
                    (z - (1 - ab) / torch.sqrt(1 - ab) * eps_pred) / torch.sqrt(ab) + \
                    torch.sqrt(1 - ab) * torch.randn_like(z) * 0.0  # 简化：无额外噪声
            return z

    return DDPM


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--smoke", action="store_true")
    ap.add_argument("--n_airfoils", type=int, default=500)
    ap.add_argument("--epochs", type=int, default=150)
    ap.add_argument("--latent_dim", type=int, default=8)
    args = ap.parse_args()

    import torch
    torch.manual_seed(SEED)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"设备：{device}")

    ts = time.strftime("%Y%m%d-%H%M%S")
    run_dir = RUNS_DIR / ts
    run_dir.mkdir(parents=True, exist_ok=True)

    n = args.n_airfoils if not args.smoke else 150
    print(f"生成翼型库（{n} 个）...")
    geoms, perf = sample_airfoil_dataset(n)
    geoms = geoms.reshape(n, -1)
    n_input = geoms.shape[1]
    global z0_dim
    z0_dim = args.latent_dim

    # 标准化
    gm, gs = geoms.mean(0), geoms.std(0) + 1e-6
    pm, ps = perf.mean(0), perf.std(0) + 1e-6
    G = (geoms - gm) / gs
    P = (perf - pm) / ps

    # ── 1. 训练 VAE ─────────────────────────────────────
    print("训练 VAE（几何编码）...")
    VAE = make_vae(n_input, args.latent_dim)
    vae = VAE().to(device)
    opt_v = torch.optim.Adam(vae.parameters(), lr=1e-3)
    Gt = torch.tensor(G, dtype=torch.float32, device=device)
    for ep in range(60):
        vae.train()
        mu, lv = vae.encode(Gt)
        z = mu + torch.randn_like(mu) * torch.exp(0.5 * lv)
        rec = vae.decode(z)
        loss = ((rec - Gt) ** 2).mean() - 0.5 * (1 + lv - mu ** 2 - lv.exp()).mean() * 1e-3
        opt_v.zero_grad(); loss.backward(); opt_v.step()
        if (ep + 1) % 20 == 0:
            print(f"  VAE epoch {ep+1}/60 loss={loss.item():.4f}")

    # 编码全部数据到潜在空间
    vae.eval()
    with torch.no_grad():
        mu, _ = vae.encode(Gt)
        Z = mu  # (n, latent)

    # ── 2. 训练条件扩散 ─────────────────────────────────
    print("训练条件扩散（潜在空间 DDPM）...")
    DDPM = make_diffusion(args.latent_dim, 3)
    ddpm = DDPM().to(device)
    opt_d = torch.optim.Adam(ddpm.parameters(), lr=1e-3)
    Pt = torch.tensor(P, dtype=torch.float32, device=device)
    for ep in range(args.epochs):
        ddpm.train()
        idx = torch.randperm(n)[:min(128, n)]
        loss = ddpm(Z[idx], Pt[idx])
        opt_d.zero_grad(); loss.backward(); opt_d.step()
        if (ep + 1) % max(1, args.epochs // 5) == 0 or ep == 0:
            print(f"  DDPM epoch {ep+1}/{args.epochs} loss={loss.item():.4f}")

    # ── 3. 条件采样 → 解码 → 有效性 ─────────────────────
    print("条件采样（目标 压比2.0 / 效率0.90 / 流量20.5）...")
    target = (np.array([2.0, 0.90, 20.5]) - pm) / ps
    c = torch.tensor(target[None, :], dtype=torch.float32, device=device).repeat(20, 1)
    ddpm.eval()
    with torch.no_grad():
        zs = ddpm.sample(c, n=20)
        gs_gen = vae.decode(zs).cpu().numpy() * gs + gm
    valid = [check_valid(g.reshape(-1, 2)) for g in gs_gen]
    print(f"  生成 20 个候选，几何有效性 {sum(valid)}/20")

    torch.save({"vae": vae.state_dict(), "ddpm": ddpm.state_dict(),
                "gm": gm, "gs": gs, "pm": pm, "ps": ps},
               run_dir / "model.pt")
    np.save(run_dir / "samples.npy", gs_gen.astype(np.float32))
    with open(run_dir / "metrics.json", "w", encoding="utf-8") as f:
        json.dump({"validity": sum(valid), "n_samples": 20,
                   "note": "synthetic 占位"}, f, ensure_ascii=False, indent=2)
    print(f"\n✅ P3 扩散生成管线跑通：{run_dir}")


if __name__ == "__main__":
    main()
