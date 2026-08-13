# RESEARCH_BRIEF

> 2026-08-13 冻结。采纳学长复审。人类负责人：孙承泽。AI 不得改主假设、不得把 E2 写成 E4。

## 正式名称（结构/热/寿命接进来之前）

- 中文：**AI 辅助叶轮机械气动代理筛选与多目标候选探索平台**
- 英文：**AI-assisted aerodynamic surrogate screening and multi-objective candidate exploration platform**
- 禁用对外：多学科设计优化、MDO、可制造 Pareto 最优叶片、校准 95% 置信区间、PINN/N-S 物理约束

## 研究问题

在 NASA Rotor 37 公开 CFD（PLAID，约 1000 组）上，标量代理能否作为**气动筛选器**，在特征空间里提出候选，并用校准不确定度与少量收敛 RANS 判断哪些候选值得算、哪些是模型盲区？

明确不回答：结构、热、振动、寿命、成本、整机约束；不声称已得到可加工叶片。

## 当前证据（到 About 页为止）

- 留出集 R²：π 0.9844 / η 0.9561 / ṁ 0.9827（n=100, seed=42）——工程划分，E2
- 代理 η_max 0.9173（相对训练均值约 +5.4%）——E2，禁止当 CFD 增益
- MC Dropout 覆盖率约 65 / 88 / 89% ——启发式区间，不是 95% CI
- SU2 粗网格 relrms ≈ −3.39 ——E3 趋势
- 74 维是统计特征，不能默认反解为几何

## 主假设（看结果前冻结）

H1：在训练流形附近，代理对三个气动标量的排序与 RANS 大体同向。  
H2：η 通道覆盖率在激波/分离附近系统性偏低，可用保形/集成校准，并当作加点传感器。  
H3：若不约束到训练流形或可实现几何，NSGA-II 会钻代理盲区。

## 毕业等级

当前：**Level 0**（工程原型 + 口径开始冻结）。目标：**Level 2**。不追求一次跳到 Level 3。

宪章：`docs/AGENT_CHARTER.md`。公开数字：`evidence/`。答辩：`docs/DEFENSE_QA.md`。

## 下一步（学长 P0–P4 + 抬高后的闭环）

1. 本文件 + `CLAIM_EVIDENCE.md` 把公开数字钉死（P0，进行中）
2. 官方 split、多种子、强基线、融合消融（P1）
3. Deep Ensemble → Conformal；报告 50/80/90/95% 覆盖与 Pareto 邻域条件覆盖（P2）
4. 优化改搜 CST/FFD，不再任意搜 74 维统计量（P3）
5. 最小 RANS 集：1 基准 + 2 近邻对照 + 3–5 候选 + 1–2 高不确定反例（P4）

## 论文定位（未开写）

Trust-aware surrogate-assisted aerodynamic screening for NASA Rotor 37 with calibrated uncertainty and RANS verification.
