"""
make_lecture_figs.py
生成讲座 PPT 缺失的图（深色主题，与网站风格一致）：
  1. docs/lecture-figs/ablation.png        对照实验：效率 R² 对比（基线/残差/纯点云/融合）
  2. docs/lecture-figs/pipeline.png        链路图：前端→API→scaler→ONNX→反标准化→UI（1.85ms）
  3. docs/lecture-figs/mesh-pixel.png      叶片网格像素化示意（29,773 节点）
  4. docs/lecture-figs/plaid_csv_preview.png  PLAID 特征表前 5 行（真实数据）

用法：python backend/scripts/make_lecture_figs.py
依赖：matplotlib, numpy, pandas（pip install matplotlib pandas numpy）
"""

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "lecture-figs"
OUT.mkdir(parents=True, exist_ok=True)

BG = "#0f172a"        # 深蓝黑背景
FG = "#e2e8f0"        # 主文字
SUB = "#94a3b8"       # 次级文字
ACCENT = ["#818cf8", "#34d399", "#f87171", "#fbbf24"]


def style_ax(ax):
    ax.set_facecolor(BG)
    for s in ax.spines.values():
        s.set_color("#334155")
    ax.tick_params(colors=SUB)
    ax.xaxis.label.set_color(FG)
    ax.yaxis.label.set_color(FG)


# ── 1. 对照实验 ablation.png ─────────────────────────────
fig, ax = plt.subplots(figsize=(9, 5.2), dpi=200)
fig.patch.set_facecolor(BG)

names = ["Baseline MLP", "Residual\nSurrogate", "PointCloud\nOnly", "Fused\n(PointCloud+Stats)"]
vals = [0.9132, 0.9561, 0.6076, 0.9608]
notes = ["", "", "honest failure\n(reported too)", ""]
cols = [ACCENT[0], ACCENT[1], ACCENT[2], ACCENT[3]]

bars = ax.bar(names, vals, color=cols, alpha=0.9, width=0.62,
              edgecolor="#334155", linewidth=1)
for b, v, note in zip(bars, vals, notes):
    ax.text(b.get_x() + b.get_width() / 2, v + 0.012, f"{v:.4f}",
            ha="center", va="bottom", color=FG, fontsize=12, fontweight="bold")
    if note:
        ax.text(b.get_x() + b.get_width() / 2, 0.42, note, ha="center",
                va="bottom", color=ACCENT[2], fontsize=9, style="italic")

ax.axhline(0.95, color="#475569", ls="--", lw=1)
ax.text(3.55, 0.952, "R² = 0.95 (all outputs baseline)", color="#64748b",
        fontsize=8.5, ha="right", va="bottom")
ax.set_ylim(0, 1.05)
ax.set_ylabel("R² on held-out test set (η)", color=FG, fontsize=11)
ax.set_title("Ablation: Isentropic Efficiency R² by Model Variant",
             color=FG, fontsize=13, fontweight="bold", pad=14)
style_ax(ax)
fig.text(0.5, 0.015,
         "Same data & split (n=100, seed 42) · point-cloud-only trained on 512 pts (Day 39) · failures are reported too",
         color=SUB, fontsize=8.5, ha="center")
fig.tight_layout(rect=[0, 0.04, 1, 1])
fig.savefig(OUT / "ablation.png", facecolor=BG, bbox_inches="tight")
plt.close(fig)
print("✅ ablation.png")

# ── 2. 链路图 pipeline.png ────────────────────────────────
fig, ax = plt.subplots(figsize=(12, 4.6), dpi=200)
fig.patch.set_facecolor(BG)
ax.set_xlim(0, 12)
ax.set_ylim(0, 4.6)
ax.axis("off")

boxes = [
    (0.25, 1.9, 2.1, 1.1, "User drags sliders\n(React UI)", ACCENT[0]),
    (2.95, 1.9, 2.1, 1.1, "POST /api/predict\n74 features", ACCENT[0]),
    (5.65, 1.9, 2.1, 1.1, "Standardize\nscaler_X_v2", ACCENT[1]),
    (8.35, 1.9, 2.1, 1.1, "ONNX inference\n0.115 ms", ACCENT[3]),
    (10.4, 1.9, 1.35, 1.1, "π · η · ṁ\nback to UI", ACCENT[1]),
]
for x, y, w, h, txt, c in boxes:
    box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.06",
                         fc=c + "22", ec=c, lw=1.6)
    ax.add_patch(box)
    ax.text(x + w / 2, y + h / 2, txt, ha="center", va="center",
            color=FG, fontsize=10, fontweight="bold")

for i in range(len(boxes) - 1):
    x0 = boxes[i][0] + boxes[i][2]
    x1 = boxes[i + 1][0]
    arr = FancyArrowPatch((x0, 2.45), (x1, 2.45), arrowstyle="-|>",
                          mutation_scale=16, color="#475569", lw=1.8)
    ax.add_patch(arr)

# 端到端标注
ax.text(6, 3.75, "End-to-end: 1.85 ms per prediction",
        ha="center", color=ACCENT[3], fontsize=12, fontweight="bold")
ax.text(6, 3.35, "625-point design sweep: 23.7 ms · model: 2.11 MB ONNX",
        ha="center", color=SUB, fontsize=9.5)
ax.text(6, 0.55,
        "422 guard: out-of-training-range inputs are REJECTED, not extrapolated (\"rather refuse than be wrong\")",
        ha="center", color="#f87171", fontsize=9.5)
fig.savefig(OUT / "pipeline.png", facecolor=BG, bbox_inches="tight")
plt.close(fig)
print("✅ pipeline.png")

# ── 3. 网格像素化 mesh-pixel.png ──────────────────────────
def naca0012(x, t=0.12):
    """NACA 0012 上下表面 y。"""
    yt = 5 * t * (0.2969 * np.sqrt(x) - 0.1260 * x - 0.3516 * x**2
                  + 0.2843 * x**3 - 0.1015 * x**4)
    return yt

fig, ax = plt.subplots(figsize=(10.5, 4.4), dpi=200)
fig.patch.set_facecolor(BG)

x = np.linspace(0, 1, 300)
yt = naca0012(x)
# 左：连续轮廓
ax.plot(x, yt, color=ACCENT[0], lw=2.2)
ax.plot(x, -yt, color=ACCENT[0], lw=2.2)
ax.text(0.28, 0.075, "continuous geometry", color=FG, fontsize=11)
ax.text(0.28, 0.045, "(mesh nodes: 29,773)", color=SUB, fontsize=9.5)

# 中：离散点云
xs = np.linspace(0.02, 0.98, 26)
for s in xs:
    ax.plot(s, naca0012(s), "o", ms=4, color=ACCENT[3])
    ax.plot(s, -naca0012(s), "o", ms=4, color=ACCENT[3])
ax.text(2.35, 0.075, "sampled surface points", color=FG, fontsize=11)
ax.text(2.35, 0.045, "(point cloud → features)", color=SUB, fontsize=9.5)

# 右：像素化网格（放大镜示意）
px = np.linspace(0.02, 0.98, 12)
for s in px:
    ax.plot(4.6 + s * 0.0 + s * 1.0, 0, "s", ms=0)  # 占位
# 像素块网格
xgrid = np.linspace(4.75, 9.75, 16)
for gx in xgrid:
    yt_g = naca0012((gx - 4.75) / 5)
    ax.add_patch(plt.Rectangle((gx - 0.16, -yt_g - 0.012), 0.32, 0.024,
                               fc=ACCENT[2] + "66", ec=ACCENT[2], lw=0.6))
    ax.add_patch(plt.Rectangle((gx - 0.16, yt_g - 0.012), 0.32, 0.024,
                               fc=ACCENT[2] + "66", ec=ACCENT[2], lw=0.6))
ax.text(7.2, 0.075, "pixelated mesh cells", color=FG, fontsize=11)
ax.text(7.2, 0.045, "(each cell = one surface node)", color=SUB, fontsize=9.5)

ax.set_xlim(-0.25, 10.5)
ax.set_ylim(-0.16, 0.17)
ax.set_facecolor(BG)
ax.axis("off")
ax.set_title("From geometry to mesh: 29,773 surface nodes per blade",
             color=FG, fontsize=12.5, fontweight="bold", pad=10)
fig.savefig(OUT / "mesh-pixel.png", facecolor=BG, bbox_inches="tight")
plt.close(fig)
print("✅ mesh-pixel.png")

# ── 4. CSV 预览 plaid_csv_preview.png ─────────────────────
df = pd.read_csv(ROOT / "backend" / "data" / "processed" / "plaid_rotor37_features.csv")
cols = ["sample_id", "Omega", "P", "CoordinateX_mean", "CoordinateX_std",
        "Pressure_mean", "Pressure_std", "Temperature_mean",
        "Compression_ratio", "Efficiency", "Massflow"]
preview = df[cols].head(5)

fig, ax = plt.subplots(figsize=(11.5, 3.4), dpi=200)
fig.patch.set_facecolor(BG)
ax.axis("off")

tbl = ax.table(cellText=np.round(preview.values, 4).astype(str),
               colLabels=cols, loc="center", cellLoc="center")
tbl.auto_set_font_size(False)
tbl.set_fontsize(9)
tbl.scale(1, 1.5)
for (r, c), cell in tbl.get_celld().items():
    cell.set_facecolor("#1e293b" if r % 2 else "#16233a")
    cell.set_edgecolor("#334155")
    cell.set_text_props(color=FG)
    if r == 0:
        cell.set_facecolor("#334155")
        cell.set_text_props(color=FG, fontweight="bold")
# 高亮输出列
for c in [8, 9, 10]:
    for r in range(1, 6):
        tbl[(r, c)].set_facecolor("#2d2a55")

ax.set_title("PLAID Rotor37 feature table — first 5 of 1,000 samples (74 features → 3 outputs)",
             color=FG, fontsize=11.5, fontweight="bold", pad=12)
fig.text(0.5, 0.03,
         "highlighted = outputs (π · η · ṁ) · Omega [rad/s] · P [Pa] · 1000 rows × 77 cols total",
         color=SUB, fontsize=8.5, ha="center")
fig.tight_layout(rect=[0, 0.05, 1, 1])
fig.savefig(OUT / "plaid_csv_preview.png", facecolor=BG, bbox_inches="tight")
plt.close(fig)
print("✅ plaid_csv_preview.png")

print(f"\n🎉 全部完成 → {OUT}")
