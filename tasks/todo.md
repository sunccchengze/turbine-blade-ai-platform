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
- [x] RTX 4050 上 geometry-conditioned 正式多 seed（42/43/44）稳定性实验
- [ ] geometry-conditioned 512/1024/2048 点与训练 epoch 消融
- [x] η 专项特征审计：Pearson/互信息/ExtraTrees 诊断报告
- [x] 增加 `combined` / `stats-only` / `pointcloud-only` 表示消融入口并完成短训连通性验证
- [x] RTX 4050 上 stats-only 与 pointcloud-only 正式 40 epoch/1024 点实验
- [x] η 专项表示消融：几何统计、法向、工况与物理派生量初步信息审计
- [x] 增加 `--data_seed`，隔离点云降采样随机性与训练 seed
- [x] pointcloud-only 固定 data_seed=42 的正式 3 seed 稳定性诊断
- [x] 增加 BatchNorm/LayerNorm 归一化对照入口
- [x] RTX 4050 上 pointcloud-only LayerNorm seed=42/43/44 对照
- [x] 补齐 pointcloud-only lr=3e-4 的 seed=42/44
- [x] pointcloud-only 固定 lr=3e-4 的 `lam_field=0.25` seed=42 诊断
- [x] pointcloud-only 固定 lr=3e-4 的 `lam_field=0.1` seed=42 单点诊断
- [x] pointcloud-only 固定 lr=3e-4 的 `lam_field=0` 标量专项诊断
- [x] pointcloud-only 损失权重权衡已完成，停止无限网格搜索
- [ ] 回到 combined 主模型的正式冻结/导出评估
- [x] 用户本机运行 `audit_geometry_feasibility.py`，全部几何质量 flags 为 0
- [x] 用户本机运行实验性拓扑原型并审阅结果：k=6/8/12 均大量非流形，Gate 不通过
- [x] Open3D Poisson/Ball Pivoting 表面重建原型入口
- [ ] 用户本机安装 Open3D 后运行 Poisson/BPA 并审阅网格报告
- [ ] 寻找正式表面重建/原始 CGNS/SU2 网格路径
- [ ] P4 Rotor37 正式表面拓扑/网格/SU2 输入链路
- [ ] η 专项物理派生特征消融

## 禁止越级

- [ ] 未完成真实 RANS 前，不更新为“CFD 已验证”
- [ ] 输入含目标场时，不称为“场预测”或“几何到场的前向代理”
- [ ] 未获得官方 test 标签前，不计算或声称官方 test R²
- [ ] 未完成特征到几何闭环前，不称 Pareto 解“可制造”
- [ ] 未经 build、API 和浏览器验收，不称前端/线上完成
