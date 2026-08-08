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

## 禁止越级

- [ ] 未完成真实 RANS 前，不更新为“CFD 已验证”
- [ ] 未获得官方 test 标签前，不计算或声称官方 test R²
- [ ] 未完成特征到几何闭环前，不称 Pareto 解“可制造”
- [ ] 未经 build、API 和浏览器验收，不称前端/线上完成
