# 项目阶段性终验收清单 · D42 · 2026-08-09

> 目的：在不把未收敛 RANS 包装成最终 CFD 结果的前提下，确认平台可以进入阶段性交付。

## A. 科研证据 Gate

| Gate | 状态 | 证据/边界 |
|---|---|---|
| 公开数据来源与载体 | ✅ | PLAID / NASA Rotor 37；载体是压气机，不是涡轮 |
| 生产模型口径 | ✅ | 1000 samples、74-D 输入、3 outputs、ONNX production model |
| 留出测试集指标 | ✅ | n=100、random_state=42；π/η/ṁ R²=0.9844/0.9561/0.9827 |
| Pareto 结果口径 | ✅ | 100 个代理模型预测候选；不是物理最优叶片 |
| UQ 口径 | ✅ | 统计期 σ；覆盖率约 65–89%；相对置信度指示器，不是 95% 保证 |
| 点云几何审计 | ✅ | 1000×2048×9；质量 Gate 全通过 |
| 原始表面拓扑审计 | ✅ | 29773 vertices、29664 QUAD_4、0 nonmanifold edges |
| 外部 SU2 coarse 网格 | ✅ | 140201 nodes、130432 HEXAHEDRA；preprocessing 与真实 solver 启动成功 |
| 外部 SU2 fine 网格 | ✅ | 3557497 nodes、3474432 HEXAHEDRA；preprocessing 与 solver 启动成功 |
| RANS 最终收敛 | ⏸️ | coarse residual 未达到 `< -4`；fine 因本机内存 99% 主动中止 |
| 代理 vs RANS 定量对照 | ⏸️ | 尚无最终收敛 RANS 数字，不能宣称完成 |

## B. 产品与工程 Gate

- ✅ 首页、Optimize、Methodology、UQ、About 已使用“代理预测候选”口径。
- ✅ Methodology 新增 Physics Gate，显示已完成、已有证据和未完成事项。
- ✅ README、项目一页纸、答辩稿同步记录当前 RANS 边界。
- ✅ 前端 `npm run build` 通过。
- ✅ 前端 `npm run lint` 通过，0 warnings、0 errors。
- ✅ Vite hosted preview 已允许 Arena preview host。
- ✅ 运行目录、cfg、mesh、inlet profile、stdout、history、manifest 具备追溯机制。

## C. 当前可交付结论

> 本项目已完成一个可复现的 AI 叶轮机械设计优化平台原型：以 NASA Rotor 37 公开压气机 CFD 数据为验证载体，建立代理模型、UQ、NSGA-II、几何审计和真实 SU2 物理通路。当前 Pareto 结果是代理模型预测候选；真实 SU2 通路已经打通，但最终收敛 RANS 与代理—RANS 定量对照仍待服务器/HPC 条件。

## D. 禁止使用的表述

- AI 已找到物理最优叶片。
- CFD 已证明 Pareto 候选最优。
- `PR_tt=1.79092` 或 `Efi_tt=82.7267%` 是最终 Rotor37 性能。
- fine 网格已经收敛。
- UQ 给出严格 95% 统计保证。

## E. 后续升级路径

1. 服务器/HPC：恢复 fine mesh 长时间 RANS，并保留同一 manifest/cfg 版本。
2. 单候选验证：最高 η、最高 ṁ、折中候选各做一次收敛 RANS。
3. 计算代理误差、排序一致性、失败率和 UQ 校准。
4. 将 P3 参数→几何→网格→RANS 闭环作为下一阶段研究任务。
5. 当前个人电脑不再承担 fine 长跑。
