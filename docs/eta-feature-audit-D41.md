# 等熵效率 η 特征审计 · D41

> 目的：解释 geometry-conditioned 模式中 η R² 从 0.9561 降至约 0.8825 的原因，先做数据证据分析，再决定是否增加特征或修改网络。
>
> **数据**：`backend/data/processed/plaid_rotor37_features.csv`，1000×78  
> **输入拆分**：几何+工况 50 维；场量统计 24 维；输出 η=`Efficiency`  
> **分析日期**：2026-08-08

---

## 1. 特征分组

| 组别 | 维数 | 内容 |
|---|---:|---|
| geometry + conditions | 50 | Ω/P + CoordinateX/Y/Z 统计量 + NormalsX/Y/Z 统计量 |
| field statistics | 24 | Pressure/Density/Temperature 统计量 |
| all | 74 | 原生产代理输入 |

本审计只做相关性、互信息和树模型诊断，不把这些统计关系直接当作因果结论。

---

## 2. 与 η 的 Pearson 相关性（绝对值 Top）

### geometry + conditions

| 特征 | |r| |
|---|---:|
| Ω | 0.5263 |
| P | 0.3567 |
| NormalsX_std | 0.3355 |
| NormalsZ_p75 | 0.2814 |
| CoordinateZ_p25 | 0.2569 |
| NormalsZ_std | 0.2363 |
| CoordinateZ_std | 0.2154 |
| CoordinateZ_mean | 0.1976 |
| CoordinateZ_min | 0.1886 |
| CoordinateY_p75 | 0.1711 |

### field statistics

| 特征 | |r| |
|---|---:|
| Pressure_std | 0.6521 |
| Temperature_std | 0.5638 |
| Temperature_p75 | 0.5603 |
| Temperature_max | 0.5474 |
| Temperature_mean | 0.5391 |
| Density_std | 0.5324 |
| Temperature_p25 | 0.5269 |
| Temperature_min | 0.4740 |
| Temperature_kurt | 0.4400 |
| Pressure_p25 | 0.3887 |

**初步观察**：η 与场量统计的线性关联普遍强于与几何统计的关联，尤其是 Pressure 分布宽度、Temperature 分布和 Density 波动。

---

## 3. 互信息诊断（全 74 维 Top）

| 特征 | mutual information |
|---|---:|
| Ω | 0.3160 |
| Pressure_std | 0.3090 |
| Temperature_p75 | 0.3082 |
| Temperature_max | 0.3069 |
| Temperature_p25 | 0.3021 |
| Temperature_mean | 0.2940 |
| Temperature_std | 0.2869 |
| Temperature_min | 0.2452 |
| Density_max | 0.1902 |
| Pressure_max | 0.1894 |
| Density_std | 0.1815 |
| Temperature_kurt | 0.1770 |

互信息同样显示：Ω 是最强的几何无关输入之一；场量统计大量占据高信息量位置。互信息是非线性依赖诊断，不代表物理因果关系。

---

## 4. 固定留出划分的 ExtraTrees 诊断

使用 `test_size=0.10`、`random_state=42`，分别训练 3 个随机种子的 ExtraTrees 回归器；该结果只用于输入信息量诊断，不替代当前 PyTorch 模型。

| 输入组 | seed R² | 均值 |
|---|---|---:|
| geometry + conditions | 0.7249 / 0.7262 / 0.7318 | **0.7276** |
| field statistics | 0.8182 / 0.8207 / 0.8145 | **0.8178** |
| all 74 | 0.8006 / 0.7993 / 0.8005 | **0.8002** |

树模型结果不应与神经网络 R² 直接横向比较；它主要支持“场量统计组携带较强 η 信息”的诊断。all 组低于 field 组说明树模型存在特征冗余/样本量/超参数效应，不能解释为加入几何一定有害。

---

## 5. 当前判断

1. geometry-conditioned η 下降不是简单的随机种子问题；三 seed 的均值为 0.8825，且场统计特征与 η 的关联显著更强。
2. 当前 50 维几何统计没有表达出足够的效率相关信息，或 PointNet/融合损失没有有效抽取这些信息。
3. 不能直接把 Pressure/Temperature 统计重新加回去来“修复 η”，那会回到 field-conditioned 目标泄漏/场条件代理问题。
4. 下一步应优先进行受控消融：固定数据划分，分别比较几何统计、点云几何、工况和物理派生特征；每种配置至少 3 seed。

---

## 6. 下一步实验优先级

### A. 几何表示消融

- 50 维 geometry stats only
- 6 通道 point-cloud geometry only
- geometry stats + point-cloud geometry（当前）
- 512 / 1024 / 2048 点

### B. 训练容量消融

- 40 / 80 epoch
- 固定 seed 42/43/44
- 保持相同 split_seed=42

### C. 物理派生特征（必须先定义来源）

只允许使用几何和工况可计算的量，例如：

- 坐标轴向跨度、展向跨度、弦向尺度比
- 法向量方向分布的离散度
- 坐标-法向相关统计
- 工况无量纲组合（需明确物理定义和单位）

不允许从 Pressure/Density/Temperature 场反推“新特征”后继续称 geometry-only。

### D. 保守结论

在上述消融完成、且 P4 RANS 尚未完成前：

- 不修改 README 的主模型 R²；
- 不把 geometry-conditioned 结果标为生产模型；
- 不把 field-conditioned 场重建误差标为几何前向误差。
