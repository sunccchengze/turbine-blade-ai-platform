# Implementation Plan: D41+ 代理模型到真实 RANS 的科研闭环

## Overview

在保留 `arena/019fc539-turbine-blade-ai-platform` 全部工作和完整技能库的基础上，先锁定现有基线，再以风险优先方式打通最小真实 SU2/RANS 验证链路。所有结果按 `docs/stage-guardrails-D41.md` 的 E0–E4 证据等级标注，禁止把代理预测、dry-run 或教程算例包装成 Rotor37 物理结论。

## 技能编排

- `planning-and-task-breakdown`：本计划与任务清单。
- `incremental-implementation`：每个小切片独立验证、提交。
- `source-driven-development`：依赖版本和框架接口以锁定文件及官方文档为准。
- `systematic-debugging`：任何失败先复现、定位边界和根因，再改动。
- `verification-before-completion`：完成声明前必须提供实际命令输出。
- `research-paper-writing`：实验口径、方法、局限和证据链保持可审查。
- `内阁决策.md`：重大路线用追问/反对/机会/外行/执行五视角审查。

## Dependency Graph

```text
Gate 0 baseline
    ├── lock versions and reproducibility
    ├── existing Pareto evidence
    └── smoke/build health
          ↓
P4 input audit: candidate → geometry → mesh → SU2 boundary conditions
          ↓
P4-min: one real geometry + one real RANS result
          ↓
P4-3: highest η + highest ṁ + compromise solution
          ↓
geometry feasibility metrics + evidence report
          ↓
UQ calibration / active learning / presentation updates
```

## Task List

### Phase 0: Gate 0 基线

- [ ] T0.1 运行 `backend/scripts/reproduce_r2.py`，记录三路 R²、依赖版本和失败信息。
- [ ] T0.2 运行 Pareto 结果生成与 `backend/scripts/pareto_evidence.py`，确认结果没有被意外改写。
- [ ] T0.3 运行后端 smoke；安装前端依赖后执行 build/lint。
- [ ] T0.4 用 `docs/stage-guardrails-D41.md` 做一次反对派检查，更新基线记录。

**Gate 0 验收**：所有能在当前沙盒完成的基线命令有真实输出；不能完成的命令明确记录阻塞原因，不用占位结果冒充通过。

### Phase 1: P4 输入链路审计（高风险优先）

- [ ] T1.1 审计 Pareto 候选文件的字段、几何来源和样本 ID，确认可追溯到具体候选。
- [ ] T1.2 审计 `generate_design_p3.py`、`inverse_design.py` 和 3D 展示的真实数据流，标出参数化示意与真实几何的边界。
- [ ] T1.3 确认 Rotor37 原始/转换网格、边界条件、SU2 版本和运行环境；缺失信息向用户索取。
- [ ] T1.4 若真实网格不可用，先建立“不能做 Rotor37 RANS”的阻塞记录；只允许用教程算例证明 SU2 通路，不升级为项目验证。

**Gate P4-input 验收**：能画出真实文件级数据流，或者明确列出阻断真实 RANS 的最小缺口。

### Phase 2: P4-min 单解真实验证

- [ ] T2.1 选定一个代表性候选并记录选择理由。
- [ ] T2.2 生成/准备真实几何与网格，做几何有效性和网格质量检查。
- [ ] T2.3 运行真实 SU2/RANS，保存 cfg、mesh、stdout/stderr、残差和最终状态。
- [ ] T2.4 提取 π、η、ṁ，生成代理 vs RANS 对照表；失败也必须生成失败报告。

**Gate P4-min 验收**：至少 1 个真实候选有可追溯的真实求解证据，或已经证明具体阻塞点并完成降级决策。

### Phase 3: P4-3 三解对照

- [ ] T3.1 选择最高效率、最高流量和折中解。
- [ ] T3.2 批量运行并保存每个解的输入、日志、收敛和输出。
- [ ] T3.3 计算绝对误差、相对误差、排序一致性和失败率。
- [ ] T3.4 编写 `docs/` 验证报告，更新 README/前端文案前先通过反对派审查。

**Gate P4-3 验收**：3 个真实对照结果，明确哪些是定量结论、哪些只是趋势结论。

### Phase 4: 几何可行性和 UQ

- [ ] T4.1 定义几何自交、厚度、连续性、网格成功率和 RANS 收敛率指标。
- [ ] T4.2 将 Pareto 特征→几何→网格→RANS 结果串成可复现报告。
- [ ] T4.3 用真实误差样本评估/校准 UQ；在此之前不扩大 95% 保证表述。
- [ ] T4.4 评估 UQ 驱动的主动学习候选选择。

### Phase 5: 展示与发布收口

- [ ] T5.1 只在物理证据达到相应等级后更新首页、README、PPT 和答辩稿。
- [ ] T5.2 重新完成后端测试、前端 build/lint、浏览器验收和线上 Redeploy 验证。
- [ ] T5.3 进行独立代码/科研证据审查并更新阶段防跑偏记录。

## Verification Commands

```bash
python backend/scripts/reproduce_r2.py
python backend/scripts/pareto_evidence.py
python backend/scripts/generate_pareto_evolution.py
bash backend/scripts/run_all_smoke.sh
cd frontend && npm install --no-audit --no-fund && npm run build && npm run lint
```

真实 RANS 相关命令只有在网格、边界条件和 SU2 环境确认后才执行；禁止对占位配置直接下物理结论。

## Risks and Mitigations

| 风险 | 影响 | 缓解 |
|---|---|---|
| Rotor37 几何/网格缺失 | 无法做真实 RANS | 先做输入审计，向用户索取原始文件；教程算例只标为通路验证 |
| SU2 与 PLAID 求解设置不等价 | 定量值不可直接比较 | 预先定义“相对趋势验证”，记录湍流模型、边界和网格差异 |
| 特征无法反解真实几何 | Pareto 解不可实现 | 将几何有效性/网格成功/RANS 收敛纳入 Gate，不用逐维范围替代 |
| 环境版本漂移 | R²/Pareto 不复现 | 使用 `backend/requirements.txt` 全锁版并记录 Python/OS/硬件 |
| 运行耗时或发散 | 进度阻塞 | 单解优先、时间盒、保存失败日志、按证据等级降级 |
| 文案领先于证据 | 科研诚信风险 | 每次发布前回看 `stage-guardrails-D41.md` |

## Open Questions for User

1. 本地是否已有 Rotor37 的原始几何/CGNS/SU2 网格文件？路径或压缩包在哪里？
2. 本地 SU2 的准确版本、运行方式（原生/WSL/Docker）和可用命令是什么？
3. 是否已经有任何真实 RANS 日志、残差文件或性能提取结果？
4. 若真实 Rotor37 网格暂缺，是否允许先把“SU2 教程算例通路”作为独立 E1 里程碑，而不把它写成项目 CFD 验证？
