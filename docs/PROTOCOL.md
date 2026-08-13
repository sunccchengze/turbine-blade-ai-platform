# PROTOCOL

看结果前冻结。探索性分析另开一节，不得回写主假设。

## 结论边界（方案 B，默认）

本研究只讨论 **PLAID Rotor 37、与训练同域的工况范围** 下的代理辅助气动筛选。
不证明跨转速/近失速/近堵塞特性，不证明整机稳定裕度。
若以后补了非设计点，再改本段，不得口头扩大。

## 决策指标（有 RANS 对照后才填）

| 指标 | 定义（本项目） | 未有 CFD 时 |
|---|---|---|
| Spearman / Kendall | 同一批几何上，代理 η 排序 vs RANS η 排序 | null |
| Top-k Recall | RANS 真前 k 是否落在代理前 k | null |
| Feasibility Precision | 代理判可行且几何合法、RANS 收敛的比例 | null |
| Pareto HV Error | 代理前沿与 RANS 前沿超体积差（同参考点） | null |
| Optimization Regret | 代理选出的点，RANS 目标相对 RANS 最优的差距 | null |
| CFD Budget Saved | 达到同等 Top-k 质量，少跑的收敛 RANS 次数 | null |

禁止用「代理对代理」填这些格子。

## 最小主动学习（P4 之后，5–10 个新点）

三类各至少 1 个：

1. 代理高性能、低启发式 σ
2. 代理高性能、高启发式 σ（或离训练流形远）
3. 中等性能对照

跑收敛 RANS → 写入 `evidence/cfd_validation.csv` → 回填 → 重训同一架构 → 比较：

- Pareto 邻域 MAE
- 覆盖率（仍标启发式，除非已 conformal）
- 排序相关
- 虚假最优点是否还在

## 失败地图（先表后页）

在有几何距离和 σ 之前，不做新前端页。先在 `evidence/` 里标：

- 训练盒内
- 盒内但高 σ
- 盒外（必须 abstain）
- 不可实现几何
- RANS 不收敛

abstain 载荷以后统一为：

```json
{
  "status": "abstain",
  "reason": "outside calibrated trust region",
  "distance_to_training_manifold": null,
  "uncertainty": null
}
```
