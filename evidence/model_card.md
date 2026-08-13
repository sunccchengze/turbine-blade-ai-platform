# Model card · residual physics surrogate

- 文件：`backend/models/surrogate_model.onnx`（约 2.11 MB，523,011 参数）
- 输入：74 维统计特征（9 组表面量 × 8 统计量 + Ω + P）
- 输出：π, η, ṁ
- 损失：多任务加权 MSE + ReLU² 输出边界惩罚（η∈[0.5,1]，π≥1，ṁ≥0）。不是 PINN。
- 划分：train/val/test = 800/100/100，seed=42
- UQ：训练期 MC Dropout 100 次；生产端常用预计算 σ。覆盖率未校准。
- 优化：pymoo 0.6.1 NSGA-II，在**特征空间**搜，不保证反解几何
- 拒绝：超出 FEATURE_STATS 范围应 422，不得外推装可信
