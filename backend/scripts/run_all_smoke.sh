#!/usr/bin/env bash
# run_all_smoke.sh — Day 39 五层管线一键冒烟验证（合成数据占位）
# 用法: bash backend/scripts/run_all_smoke.sh [python解释器]
# 默认用 python3；可传 /path/to/venv/bin/python
set -e
PY=${1:-python3}
cd "$(dirname "$0")/../.."

echo "════════════════════════════════════════════"
echo " 五层升级管线 · 一键冒烟验证（合成数据占位）"
echo "════════════════════════════════════════════"

echo ""
echo "▌STEP 1/5 · P1 数据管线（合成占位）"
$PY backend/scripts/make_synthetic_pc.py --n_points 2048 --n_samples 300

echo ""
echo "▌STEP 2/5 · P1 双头 PointNet 训练（小规模）"
$PY backend/scripts/train_pointnet_p1.py --synthetic --epochs 5 --batch_size 16

echo ""
echo "▌STEP 3/5 · P2 校准 UQ（Deep Ensemble + Conformal）"
$PY backend/scripts/calibrate_uq_p2.py --synthetic --k_models 2 --epochs 3 --batch_size 16

echo ""
echo "▌STEP 4/5 · P3 生成式设计（条件 VAE）"
$PY backend/scripts/generate_design_p3.py --n_airfoils 200 --epochs 20

echo ""
echo "▌STEP 5/5 · P4 SU2 抽查验证（dry-run）"
$PY backend/scripts/run_su2_validation_p4.py --dry-run

echo ""
echo "✅ 五层管线全部冒烟通过（数字为 synthetic 占位，待真实数据替换）"
