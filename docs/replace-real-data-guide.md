# 🔄 真实数据替换指引（Day 39 冲刺后）

> 用途：当前五层管线用**合成占位数据**跑通。拿到真实点云数据（Codespaces 生成 `rotor37_pc.npz`）后，按本文件把占位替换为真值。所有数字需按铁律 4 重跑并标注口径。

## 一、真实数据获取（Codespaces 已跑）

在 Codespaces 终端：
```bash
cd /workspaces/turbine-blade-ai-platform
python backend/scripts/build_pointcloud_dataset.py --n_points 2048
```
生成：`data/processed/pointcloud/rotor37_pc.npz`（100–300MB）
→ 下载到本地 `C:\Users\45120\turbine-blade-ai-platform\data\processed\pointcloud\`

## 二、逐层替换

### P1 场级代理
```bash
python backend/scripts/train_pointnet_p1.py --epochs 80 --batch_size 32   # 不带 --synthetic
```
- 期望：标量 R² 对比表（74 维 MLP vs 双头模型）+ 场 MAE
- Gate 1：标量 R² ≥ 基线 −0.01；场 MAE ≤5%
- 达标后：导出 ONNX → 接入 `model.py:predict_surface_field`（替换占位）

### P2 校准 UQ
```bash
python backend/scripts/calibrate_uq_p2.py --k_models 5 --epochs 40   # 不带 --synthetic
```
- 期望：coverage 报告（名义 95% ↔ 实测）；对比旧 MC Dropout（65–89%）
- Gate 2：覆盖率 95±2%、ACD ≤2%

### P3 生成式设计
```bash
# 完整版扩散：
python backend/scripts/train_diffusion_p3.py --n_airfoils 500 --epochs 300
# 或降级版条件 VAE：
python backend/scripts/generate_design_p3.py --n_airfoils 500 --epochs 100
```
- 期望：条件命中率（目标 vs 生成翼型预测性能）、几何有效性 ≥85%
- Gate 3：2D 命中率 ≥90%、有效性 ≥85%
- 后续 3D：点云 VAE（1k–2k 点）潜在空间条件扩散（2026-07-29 帝国理工范式）

### P4 SU2 抽查验证
```bash
# 本机装 SU2（Docker）：
docker pull su2code/su2
# 生成候选后：
python backend/scripts/run_su2_validation_p4.py --candidates <npy>   # 去掉 --dry-run
```
- 期望：≥5 解「代理 vs CFD」趋势对比
- Gate 4：趋势一致性（定量偏差写讨论点，SU2 与 PLAID 定位相对趋势验证）

### E5 LLM 助手（无需数据）
- 已可用：`/api/assistant/design` + 前端 `DesignAssistant.jsx`
- 可选升级：替换 rule-based 为 LLM function calling（Qwen/DeepSeek API）

## 三、替换后必须做的

1. **更新 README**：新指标族（场误差/覆盖/命中率/验证偏差/实测加速比）全部标口径 + 附复现命令
2. **更新 `docs/plan-30day-D38.md`** 完成度表（把 synthetic 标注去掉）
3. **HANDOFF.md 升 v7**：状态快照、悬而未决、交付物登记
4. **一键复验**：`bash backend/scripts/run_all_smoke.sh`（含真实数据重跑）

## 四、诚实披露红线

- 真实数据替换前，任何数字不得写入 README/对外材料（现均为 synthetic 占位）
- 旧数字口径（R² 0.9844/0.9561/0.9827）是 74 维模型的，不可与 P1 新模型直接混报
- P1 对比表必须「同口径同数据」：基线(74维) vs 双头(点云)，都在同一留出测试集上
