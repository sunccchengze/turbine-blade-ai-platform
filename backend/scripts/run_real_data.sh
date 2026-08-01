#!/usr/bin/env bash
# run_real_data.sh — 真数据训练一键脚本（P1 双头融合 + P2 校准UQ + P3 生成）
# 用法: bash backend/scripts/run_real_data.sh [python解释器] [--n_points 512]
# 前置: data/processed/pointcloud/rotor37_pc.npz（9 通道，已构建）
set -e
PY=${1:-python3}
NP=${2:---n_points 512}
cd "$(dirname "$0")/../.."

if [ ! -f data/processed/pointcloud/rotor37_pc.npz ]; then
  echo "❌ 未找到 rotor37_pc.npz，先构建 9 通道数据"
  exit 1
fi

echo "════════════════════════════════════════════"
echo " 真数据训练（9 通道）· 一键执行"
echo "════════════════════════════════════════════"

echo ""
echo "▌STEP 0/3 · 数据验证"
$PY backend/scripts/verify_pointcloud.py data/processed/pointcloud/rotor37_pc.npz

echo ""
echo "▌STEP 1/3 · P1 双头融合（统计特征+点云→标量+场）"
$PY backend/scripts/train_fused_p1.py --epochs 40 --batch_size 32 $NP

echo ""
echo "▌STEP 2/3 · P2 校准 UQ（Deep Ensemble + Conformal）"
$PY backend/scripts/calibrate_uq_p2.py --k_models 3 --epochs 20 --batch_size 32 $NP

echo ""
echo "▌STEP 3/3 · P3 生成式设计（2D 翼型条件 VAE/扩散）"
$PY backend/scripts/generate_design_p3.py --n_airfoils 500 --epochs 100

echo ""
echo "✅ 真数据训练全部完成（结果在各 runs/ 目录，metrics.json 见 README 口径）"
