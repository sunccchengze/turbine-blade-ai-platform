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

## 5. Fine mesh 短运行与资源边界

用户在本机启动了 `R37_fine.su2` 的一阶 SA 短运行。SU2 已完成 fine mesh 读取和 preprocessing：3,557,497 个节点、3,474,432 个六面体单元、9 个 marker；周期面匹配最大距离为 `2.46585e-09`，最小正交角为 `29.4059°`。

随后进入 solver，但由于系统内存占用达到约 99%、电脑几乎失去响应，用户主动用 `Ctrl+C` 终止运行。这一终止是正确的资源安全决策，不是求解器自然退出，也不是收敛失败的物理证据。

终止前输出了极少量的早期迭代信息：

| Inner Iter | relrms[Rho] | Efi_tt (%) | PR_tt |
|---:|---:|---:|---:|
| 0 | -4.859153 | 110.714 | 1.02363 |
| 1 | -4.912433 | 未形成可引用的稳定序列 | 未形成可引用的稳定序列 |

这些数值只说明 fine case 能够进入求解器并开始更新，不能说明 fine RANS 已收敛，也不能与 coarse 的 1000 次 Stage Performance 做性能对照。早期 `Efi_tt` 和 `PR_tt` 受初始场影响，不得作为最终压比/效率。

**资源边界结论：** 当前个人电脑不适合继续执行 fine mesh 的长时间 RANS。后续不再要求用户重复运行 fine mesh，也不把“没有完成 fine 收敛”归因于用户操作问题。

---

## 6. 当前最大缺口

1. coarse mesh 高 aspect ratio 可能限制收敛；
2. 一阶 SA 只能作为稳定降级路径，未形成最终高保真结果；
3. 二阶 SST 从自由来流启动会 NaN，需要更稳的初场/数值路径；
4. restart 续算目前不稳定；
5. fine mesh 已证明可被 preprocessing 读取，但受本机内存边界限制，未完成 solver 证据；
6. 需要把性能平台和 residual 收敛标准分开讨论，不能用平台替代严格收敛。

---

## 7. 下一步决策

### 路线 A：停止本机 fine 长运行

不再在当前电脑上运行 fine mesh 的 20/100/500/1000 次长时间 RANS。保留 preprocessing 和中止前日志作为“高质量外部体网格可读取、但本地资源不足以完成求解”的证据。

### 路线 B：coarse 只做一次受控诊断（可选）

如果仍希望继续 P4，可只在 coarse 上做一次小范围、可回滚的参数对照，并预先设置资源上限；不再盲目增加迭代次数。若没有明显改善，就冻结 P4 结论。

### 路线 C：阶段性收口

将 P4 正式结论冻结为：

```text
真实 SU2 物理通路验证 + 未收敛 Stage Performance 趋势
```

同时保留“最终定量 RANS 验证未完成”的明确声明，转向前端收口和完整研究报告。若未来获得服务器/HPC，再将 fine mesh 作为独立复现实验，而不是当前项目必须完成的前置条件。

### 路线 D：数值收敛诊断

如果仍要做一次 coarse 诊断，优先比较：

- 更稳的初始场；
- 更保守的线性求解器/限制器；
- 课程原始 first-order cfg 的完整参数对照；
- 适度放宽/重新定义收敛监测字段，但不得通过降低标准伪造收敛。
