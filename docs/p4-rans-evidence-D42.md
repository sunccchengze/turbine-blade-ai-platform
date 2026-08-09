# P4 Rotor37 RANS 证据报告 · D42

> 本报告只记录仓库和用户本机真实运行得到的证据，不把未收敛性能包装成最终 CFD 验证。
>
> **求解器**：SU2 v8.5.0 Harrier，Windows 原生  
> **网格**：R37 coarse，140201 nodes / 130432 HEXAHEDRON  ￼
> **cfg**：SA 一阶、轴流压气机、旋转速度 `(0,0,-1800)`、PER1/PER2、INLET/OUTLET  ￼
> **运行目录**：隔离目录，带 `run_manifest.json` 和 SHA256 输入记录

---

## 1. 已通过的 Gate

| Gate | 状态 | 证据 |
|---|---|---|
| 外部网格文件读取 | ✅ | 130432 个 HEXAHEDRON，140201 个节点 |
| 体单元方向 | ✅ | SU2：All volume elements are correctly oriented |
| 网格 marker | ✅ | INLET、OUTLET、BLADE、HUB、SHROUD、PER1、PER2、HUB_UPSTREAM、HUB_DOWNSTREAM |
| 周期面匹配 | ✅ | PER1/PER2，7650 points，max distance 1.30339e-09 |
| Z 轴方向 | ✅ | INLET→OUTLET 主轴为 Z |
| 入口 profile | ✅ | `inlet_kw_new.dat`，18 rows × 7 cols，SU2 按 ALPHA_PHI 读取 |
| 压气机性能配置 | ✅ | AXIAL、COMPRESSOR、MASSFLUX、Giles OUTLET |
| 旋转框架 | ✅ | Angular velocity `(0,0,-1800)` rad/s |
| SU2 preprocessing | ✅ | geometry/solver/numerics preprocessing 完成 |
| 真实 solver 启动 | ✅ | RANS/SA 一阶可进入 inner iteration |
| 输出链路 | ✅ | history、restart、Paraview、Tecplot、forces、TURBOMACHINERY 输出 |

---

## 2. 网格质量风险

SU2 preprocessing 输出：

| 指标 | 值 |
|---|---:|
| 最小正交角 | 23.7461° |
| 最大 CV face aspect ratio | 13117.4 |
| 最大 CV sub-volume ratio | 34.3578 |

网格可以被读取和计算，但极高的控制体面长宽比是收敛风险，后续若长期残差平台不变，应考虑更细/更高质量网格或课程提供的 fine mesh。

---

## 3. 数值运行对照

### 3.1 二阶初始 smoke

- 二阶 Roe + SST/旋转框架；
- preprocessing 成功；
- 第 3 个 inner iteration 出现 NaN；
- 判定：二阶从自由来流直接启动不稳定。

### 3.2 一阶 SA 基线

- 20 iterations：Exit Success，无 NaN；
- 500 iterations：`relrms[Rho]=-3.38664`，未达到 `< -4`；
- 1000 iterations：`relrms[Rho]=-3.39242`，未达到 `< -4`。

### 3.3 CFL 对照

| 配置 | iterations | 最终 relrms[Rho] | 判定 |
|---|---:|---:|---|
| 固定 CFL=1 | 500 | -1.54914 | 过于保守 |
| adaptive max=50 | 500 | -3.38664 | 推进较快，后期平台/振荡风险 |
| bounded max=5 | 500 | -2.71473 | 稳定但推进不足 |
| bounded max=10 | 500 | -3.10767 | 改善 |
| bounded max=20 | 500 | -3.21966 | 小幅改善 |
| bounded max=20 | 1000 | -3.39242 | 接近平台，仍未收敛 |

### 3.4 Restart 对照

- restart 文件能被 SU2 读取；
- 从 `relrms≈-3.39` 状态续算后退化到 `-0.2216`；
- restart + bounded CFL max=5 后进一步退化到 `-0.0531`；
- 判定：当前 restart 配置没有保持部分收敛状态，已停止该路线，避免覆盖证据。

---

## 4. Stage Performance 趋势

完整 stdout 已提取 10 个 Stage Performance 节点：

| Inner Iter | Efi_tt (%) | PR_tt |
|---:|---:|---:|
| 0 | 110.8720 | 1.04501 |
| 100 | 90.5675 | 1.92520 |
| 200 | 87.3375 | 1.81431 |
| 300 | 85.2434 | 1.79978 |
| 400 | 84.4473 | 1.79603 |
| 500 | 83.9077 | 1.79411 |
| 600 | 83.4999 | 1.79288 |
| 700 | 83.1825 | 1.79202 |
| 800 | 82.9305 | 1.79139 |
| 900 | 82.7267 | 1.79092 |

解释：

- 初始场性能不代表物理结果；
- 100–600 次仍处于明显调整阶段；
- 700–900 次变化开始减小，显示出准平台趋势；
- 但整体 residual 没有达到 `< -4`，所以不能称最终 CFD 性能；
- 当前解析器输出 `converged=false`，结果等级为 **non-converged diagnostic trend**。

可引用的严格表述：

> SU2 coarse Rotor37 case 已完成真实网格读取、旋转 RANS 初始化和 1000 次一阶迭代；Stage Performance 从初始状态向准平台演化，但残差未满足预设收敛标准，因此本文不将其作为最终定量 CFD 验证，只作为物理通路和性能趋势证据。

不可引用的表述：

- “RANS 已验证代理模型”；
- “SU2 得到了最终效率”；
- “Pareto 设计已经被 CFD 证明”；
- “PR_tt=1.79092 是 Rotor37 最终压比”；
- “Efi_tt=82.7267% 是最终效率”。

---

## 5. 当前最大缺口

1. coarse mesh 高 aspect ratio 可能限制收敛；
2. 一阶 SA 只能作为稳定降级路径，未形成最终高保真结果；
3. 二阶 SST 从自由来流启动会 NaN，需要更稳的初场/数值路径；
4. restart 续算目前不稳定；
5. 需要判断课程 fine mesh 是否能改善收敛；
6. 需要把性能平台和 residual 收敛标准分开讨论，不能用平台替代严格收敛。

---

## 6. 下一步决策

### 路线 A：Fine mesh 对照

在独立运行目录中，用同一套 marker/cfg/入口 profile 替换 `R37_fine.su2`，只做 preprocessing 和短 smoke；确认 fine mesh 的节点/单元规模与许可证后，再决定是否运行。

### 路线 B：数值收敛诊断

如果 fine mesh 不适合本机，则保持 coarse mesh，优先尝试：

- 更稳的初始场；
- 更保守的线性求解器/限制器；
- 课程原始 first-order cfg 的完整参数对照；
- 适度放宽/重新定义收敛监测字段，但不得通过降低标准伪造收敛。

### 路线 C：阶段性收口

若时间和算力不允许达到严格收敛，则将 P4 正式结论冻结为：

```text
真实 SU2 物理通路验证 + 未收敛 Stage Performance 趋势
```

同时保留“最终定量 RANS 验证未完成”的明确声明，转向前端收口和完整研究报告。
