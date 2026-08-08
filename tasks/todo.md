# D41+ 执行清单

## 当前阶段：Gate 0 基线

- [x] 运行主 R² 复现并记录输出
- [x] 运行 Pareto 证据链并核对是否有意外改写
- [x] 运行生产侧后端基线（R²/API/compile）；训练 smoke 已在独立 torch 环境完成
- [x] 安装前端依赖并执行 build/lint
- [x] 接入真实点云并完成 P1 2 epoch/256 点诊断训练
- [x] 修复 P1 场指标反标准化量纲 bug
- [x] 更新 `docs/stage-guardrails-D41.md` 的基线证据
- [ ] 使用用户 RTX 4050 CUDA 环境完成正式 P1 训练
- [ ] 提交并推送本阶段基线记录

## 下一阶段：P4 输入审计

- [x] 接入并审计 `data/processed/pointcloud/rotor37_pc.npz`（1000×2048×9，sample_id 完全对齐）
- [x] 追踪 Pareto 候选到几何/网格的文件级数据流
- [ ] 确认 Rotor37 几何、网格和边界条件是否实际存在
- [ ] 向用户索取缺失的本地 SU2/Rotor37 网格资产
- [x] 输出 P4 输入审计报告

## 下一项：P1 无泄漏输入消融

- [x] 增加 geometry-conditioned 模式：屏蔽 Pressure/Density/Temperature，只保留坐标、Normals 和工况
- [x] 明确 74 维统计特征中的场量来源，geometry-only 模式剔除场量统计特征
- [x] 在 RTX 4050 上完成 geometry-conditioned 40 epoch/1024 点正式训练
- [x] 对比 field-conditioned 与 geometry-conditioned 的标量 R² 和逐通道场指标
- [x] 结果未完成前，不更新 README 的模型能力宣称
- [x] 增加 `--seed` 并完成沙盒 seed 1/2 短训连通性验证
- [ ] RTX 4050 上 geometry-conditioned 正式多 seed（42/43/44）稳定性实验
- [ ] geometry-conditioned 512/1024/2048 点与训练 epoch 消融

## 禁止越级

- [ ] 未完成真实 RANS 前，不更新为“CFD 已验证”
- [ ] 输入含目标场时，不称为“场预测”或“几何到场的前向代理”
- [ ] 未获得官方 test 标签前，不计算或声称官方 test R²
- [ ] 未完成特征到几何闭环前，不称 Pareto 解“可制造”
- [ ] 未经 build、API 和浏览器验收，不称前端/线上完成
