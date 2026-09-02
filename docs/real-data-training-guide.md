# 📘 真数据训练完整指南（Day 39 实战总结）

> ⛔ **时效标记（2026-09-02 追加 · 由分支收敛会话自动判定）** —— 本文件是 **2026-08-08** 的历史快照，**不是现状**。
> 以下写法在今天已经不成立：
> - 第 78 行「# 生成 backend/models/fused_surrogate.onnx 后，后端自动启用 /api/predict/fused」→ **引用后端 HTTP 接口——现在数据与模型都是随前端部署的静态 JSON / ONNX**
> - 第 93 行「- ⚠️ 当前 /api/predict/fused 返回 scaled 值 + note 标注，反标准化待接上」→ **引用后端 HTTP 接口——现在数据与模型都是随前端部署的静态 JSON / ONNX**
>
> 现行口径唯一来源：`HANDOFF.md`（§0.-1 十一条铁律、§9.5 架构现状）、`docs/BRANCH-SAFETY.md`（会话与 git 纪律）、`evidence/metrics.json`（对外数字）。
> **正文一字未改**——当时的判断与过程仍按原样保留，供回顾历程用。

> 面向：拿到 9 通道真实点云后，如何正确跑通 P1/P2/P3 训练。
> 本文固化 Day 39 踩过的所有坑，避免重蹈。

## 0. 前置：9 通道数据必须就绪

```
data/processed/pointcloud/rotor37_pc.npz
  X_pc (1000, 2048, 9)  ← 0-2坐标 3Pressure 4Density 5Temperature 6-8Normals
  conds (1000, 2) [Omega, P]
  y     (1000, 3) [π, η, ṁ]
```
验证：`python backend/scripts/verify_pointcloud.py`（应显示 ✅ 完整 9 通道 + ✅ 完全对齐）

## 1. ⚠️ 三大 CPU 陷阱（必须知道）

1. **别跑 2048 全量点 CPU 训练**：40 epoch 要 60–75 分钟。用 `--n_points 512/1024` 降采样，快 10 倍。
2. **输入场量必须标准化**：Pressure ~1e5 直接进网络 loss 爆炸。脚本已内置（3-8 列 per-channel 标准化），无需手动。
3. **场目标列**：9 通道下 Pressure=3, Temperature=5（不是 4）。脚本已动态推断。

## 2. P1 训练（两条路）

### 路线 A：纯点云（研究「空间信息能到多高」）
```bash
python backend/scripts/train_pointnet_p1.py --epochs 40 --batch_size 32 --n_points 512
```
- Day 39 实测（1024点/15epoch/CPU）：π 0.92 / η 0.61 / ṁ 0.95
- 多训 + 全量点可提升（建议云 GPU）

### 路线 B：双头融合（推荐，标量保底 + 场预测）
```bash
python backend/scripts/train_fused_p1.py --epochs 40 --batch_size 32 --n_points 512
```
- 统计特征（74 维）→ 标量保底（预期 0.95+）
- 点云 → 场预测（独有增量）
- 自动按 sample_id 对齐统计特征与点云

## 3. P2 校准 UQ
```bash
python backend/scripts/calibrate_uq_p2.py --k_models 5 --epochs 30 --batch_size 32 --n_points 512
```
- 自动优先用真实 npz（回退合成）
- 输出 coverage 报告：名义 95% ↔ 实测覆盖率 + ACD
- 目标：修复 MC Dropout 65–89% 覆盖问题

## 4. P3 生成式设计
```bash
# 前置：3D 点云 → 2D 翼型截面
python backend/scripts/extract_airfoils_p3.py
# 生成训练（自动用真实翼型）
python backend/scripts/generate_design_p3.py --n_airfoils 500 --epochs 100
# 或完整扩散版
python backend/scripts/train_diffusion_p3.py --n_airfoils 500 --epochs 300
```

## 5. 一键全流程
```bash
bash backend/scripts/run_real_data.sh   # verify + P1融合 + P2UQ + P3生成
```

## 6. 数字口径纪律（铁律 4）
- 所有 R² 统一口径：留出测试集 10%, random_state=42
- 新旧对比表必须「同口径同数据」（基线 74 维 MLP vs 点云 vs 融合，同一测试集）
- 结果存各 runs/ 目录的 metrics.json；README 更新时标注口径

## 7. 场头全量训练（目标：场 MAE ≤5%）
```bash
# 提高场损失权重，让融合模型的场预测更准（标量可能略降，可接受）
python backend/scripts/train_fused_p1.py --epochs 80 --batch_size 32 --n_points 512 --lam_field 2.0
# 输出会报告场指标（原始量纲 rel_l2/mae）
```

## 8. ONNX 部署替换
```bash
# 导出融合模型 ONNX（需要 fused_best.pt，来自 train_fused_p1.py）
python backend/scripts/export_fused_onnx.py --checkpoint <fused_best.pt路径>
# 生成 backend/models/fused_surrogate.onnx 后，后端自动启用 /api/predict/fused
```

## 9. P4 SU2 真验证（本机 Docker）
```bash
docker pull su2code/su2
python backend/scripts/prepare_su2_p4.py   # 生成 6 算例配置 + 批跑脚本 + 说明
# 按 data/processed/p4/SU2_P4_README.txt 操作
```

## 10. ONNX 部署反标准化（待办）
fused ONNX 输出是**标准化值**（训练时 y 标准化 ym/ys）。部署时需：
- 训练脚本 train_fused_p1.py 里的 ym, ys（y 的 mean/std）
- 存成 `backend/models/fused_y_stats.json`，predict_fused 反标准化：
  `y_real = y_scaled * ys + ym`
- ⚠️ 当前 /api/predict/fused 返回 scaled 值 + note 标注，反标准化待接上
