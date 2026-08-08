# D41+ 执行清单

## 当前阶段：Gate 0 基线

- [x] 运行主 R² 复现并记录输出
- [x] 运行 Pareto 证据链并核对是否有意外改写
- [ ] 运行后端 smoke（已在 P1 入口因缺少 torch 阻塞；需补依赖或由用户提供训练环境）
- [x] 安装前端依赖并执行 build/lint
- [x] 更新 `docs/stage-guardrails-D41.md` 的基线证据
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
