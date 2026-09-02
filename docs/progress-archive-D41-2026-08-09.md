# D41+ 进度存档 · 2026-08-09 夜间

> ⛔ **时效标记（2026-09-02 追加 · 由分支收敛会话自动判定）** —— 本文件是 **2026-08-09** 的历史快照，**不是现状**。
> 以下写法在今天已经不成立：
> - 第 100 行「- 前端和后端随 GitHub `main` 自动部署；因此任何线上口径收口都必须先合入/同步 main 后，再分别检查 Cloudflare Pages 和 SnapDeploy 的实际版本。后端仍可能因 SnapDe」→ **后端不随 main 部署：main 只触发 Cloudflare Pages 静态构建**
>
> 现行口径唯一来源：`HANDOFF.md`（§0.-1 十一条铁律、§9.5 架构现状）、`docs/BRANCH-SAFETY.md`（会话与 git 纪律）、`evidence/metrics.json`（对外数字）。
> ——以及第二轮：
> - 第 5 行「> - 第 100 行「- 前端和后端随 GitHub `main` 自动部署；因此任何线上口径收口都必须先合入/同步 main 后，再分别检查 Cloudflare Pages 和 SnapDeploy 的」→ **部署拓扑已变：线上只有 Cloudflare Pages 静态站点**
> - 第 107 行「- 前端和后端随 GitHub `main` 自动部署；因此任何线上口径收口都必须先合入/同步 main 后，再分别检查 Cloudflare Pages 和 SnapDeploy 的实际版本。后端仍可能因 」→ **部署拓扑已变：线上只有 Cloudflare Pages 静态站点**
> - 第 182 行「- 由于 SnapDeploy 冷启动影响公开演示，前端数据层已切换为静态资源 + 浏览器 ONNX Runtime Web。」→ **「等冷启动」这个前提已不存在：模型与数据随前端静态部署，浏览器内推理**
> - 第 184 行「- FastAPI 保留为研究复现/未来 HPC 服务，不再是公开演示的必需依赖。」→ **FastAPI 后端不上线：仅本地/离线训练与产物生成时用**
> **正文一字未改**——当时的判断与过程仍按原样保留，供回顾历程用。

> 写给下一次会话的交接记录。明早继续前先阅读本文件、`docs/stage-guardrails-D41.md`、`tasks/plan.md` 和 `tasks/todo.md`。

## 1. 当前分支与仓库状态

- 工作分支：`arena/019fe072-turbine-blade-ai-platform`
- 本次存档目标：装载 DeepTutor、完成燃气轮机小白项目介绍、保存实验进度。
- 当前项目生产依赖仍不包含 PyTorch；训练依赖使用独立的 `backend/requirements-training.txt`。
- 真实点云文件：`data/processed/pointcloud/rotor37_pc.npz`，1000×2048×9，sample_id 与特征 CSV 完全对齐。

## 2. 本阶段已经完成

### 数据与模型

- 真实 Rotor37 点云审计通过：9 通道，包含坐标/Pressure/Density/Temperature/Normals。
- P1 融合训练链路在用户 RTX 4050 Laptop GPU、CUDA 12.6 上跑通。
- 修复了场指标反标准化 bug，并将 Pressure、Temperature 指标分通道输出。
- 新增 geometry-conditioned 模式：输入只用坐标、Normals、工况和 50 维几何统计，不把目标场输入模型。
- 新增表示消融：`combined`、`stats-only`、`pointcloud-only`。
- 新增 `--seed`、`--split_seed`、`--data_seed`、`--norm_type`、`--representation`、`--input_mode`。

### 已完成的主要实验

1. **field-conditioned 融合诊断**（9 通道/74 维，存在场条件输入）：
   - π R²=0.9926
   - η R²=0.9553
   - ṁ R²=0.9928
   - 该结果只能叫场条件融合诊断，不能写成纯几何前向结果。

2. **geometry-conditioned combined，多 seed**：
   - π：0.984367 ± 0.000833
   - η：0.882533 ± 0.014949
   - ṁ：0.982667 ± 0.005522

3. **stats-only，多 seed**：
   - π：0.980867 ± 0.002950
   - η：0.851433 ± 0.025515
   - ṁ：0.981700 ± 0.001744

4. **pointcloud-only，固定 data_seed，多 seed**：
   - π：0.972533 ± 0.010514
   - η：0.816067 ± 0.083724
   - ṁ：0.972567 ± 0.006469
   - pointcloud-only 存在明显训练不稳定。

5. **LayerNorm 对照**：
   - η：0.683200 ± 0.070757
   - 明显不如 BatchNorm；BatchNorm 保持默认。

6. **pointcloud-only，BatchNorm，lr=3e-4，多 seed**：
   - π：0.959667 ± 0.010661
   - η：0.868433 ± 0.028823
   - ṁ：0.952600 ± 0.023767
   - η 稳定性提升，但 π/ṁ 与场指标变差。

7. **损失权重单点对照，seed=42，lr=3e-4**：
   - lam=0.5：π/η/ṁ = 0.9554/0.8376/0.9563
   - lam=0.25：π/η/ṁ = 0.9595/0.8821/0.9425
   - lam=0.1：π/η/ṁ = 0.9604/0.9052/0.9662，Pressure relative L2=0.1256
   - lam=0：π/η/ṁ = 0.9643/0.8842/0.9613；场头无监督，场指标不可比较。

## 3. 当前科学结论

- 74 维场统计特征对 η 很重要；排除 Pressure/Density/Temperature 后，η 明显下降。
- 点云几何对 π/ṁ 有一定增量；与几何统计融合时表现最好。
- pointcloud-only 不是当前生产候选，且存在初始化/优化/多任务冲突问题。
- combined 是当前 geometry-conditioned 的最佳研究候选，但仍低于原 74 维基线的 η=0.9561。
- 所有上述结果均为代理模型留出集结果，不是 CFD/RANS 物理验证。
- P4 最大缺口仍然存在：真实 Rotor37 几何/网格/SU2 边界条件/性能提取闭环未完成。

## 4. 明早第一优先级

1. 阅读 `docs/p1-input-mode-ablation-D41.md`，确认消融表和证据口径。
2. 结束 P1 pointcloud-only 调参，不再无限网格搜索。
3. 冻结 combined 的研究配置，整理模型权重、配置、seed 和 metrics。
4. 转向 P4 输入资产审计：寻找 Rotor37 原始几何、CGNS/SU2 网格或网格拓扑。
5. 如果仍没有真实网格，先明确 P4 阻塞，不把教程 SU2 结果写成 Rotor37 CFD 验证。

## 5. 规则提醒

- 不把代理预测 Pareto 解写成物理最优叶片。
- 不把逐维范围内写成几何可制造。
- 不把官方黑盒 test 写成官方 test R²。
- 不把 dry-run 写成 RANS 已验证。
- 不把目标场输入条件下的重建写成 geometry-only 场预测。
- 不在完成真实几何—网格—RANS 闭环前继续扩大宣传性功能。

## 6. 本次新增文档与技能

- `技能库&准则/DeepTutor/`：从 HKUDS/DeepTutor 装载的源代码、`SKILL.md`、README、学习引擎和 CLI 文档；已排除 Git 元数据和生成构建产物。
- `docs/项目介绍-燃气轮机小白版.md`：约 5000 字的面向燃气轮机小白的项目介绍，明确区分燃气轮机背景、Rotor 37 压气机验证载体、代理模型、Pareto、UQ 和 P4 缺口。

## 7. 用户补充的长期背景（2026-08-09）

- “AI 赋能的燃气轮机叶片多学科设计优化”是宋立明教授和郭振东老师向承泽推荐的未来研究方向。
- 承泽尚未与两位老师正式交流，暂不了解他们的具体评价标准；不能替老师揣测偏好。
- 承泽坦白自身燃气轮机基础接近小白，当前主要认识若干专业名词；项目完成后再系统学习，不把学习计划打断当前研发主线。
- 目前确认缺少 Rotor37 CFD 网格/完整几何闭环资产；真实点云并不等于 SU2 网格。
- 前端和后端随 GitHub `main` 自动部署；因此任何线上口径收口都必须先合入/同步 main 后，再分别检查 Cloudflare Pages 和 SnapDeploy 的实际版本。后端仍可能因 SnapDeploy 休眠出现冷启动。
- 长期倾向：把项目做成暑期高质量独立项目（1）+ 课题组交流/印象材料（3）+ 可继续发展的研究作品/论文起点（4）。

## 8. DeepTutor 学习路径

正式学习路径已保存至：

```text
docs/DeepTutor学习路径-燃气轮机叶轮机械-D41.md
```

启动条件：项目基本完成物理闭环与可实现性验证后。第一阶段从零基础诊断开始，依次学习燃气轮机直觉、流体力学、轴流压气机/涡轮、CFD/RANS/Rotor37、代理模型与数据泄漏、UQ/Pareto、MDO 和科研表达。每个模块采用：

```text
诊断 → 分层讲解 → 项目映射 → 小测 → 错误归因 → 费曼复述 → 间隔复习
```

## 9. 今晨 P4 几何 Gate

用户本机运行 `audit_geometry_feasibility.py` 成功：

- `nonfinite_samples=0`
- `near_degenerate_samples_extent_lt_1e-4=0`
- `low_unique_ratio_samples_lt_0.95=0`
- `normals_not_mostly_unit_samples_lt_0.90=0`
- `normal_variability_high_samples_std_gt_0.10=0`
- `rank_collapsed_samples_smallest_cov_eig_lt_1e-8=0`

结论：真实点云通过几何质量 Gate，可进入表面/拓扑重建；仍没有 SU2/CGNS 网格、边界条件和真实 RANS 性能提取。

## 10. 新增 Huashu Design

已装载 `技能库&准则/huashu-design/`，核心应用原则已补入 `技能库&准则/SKILL运用指南.md`：事实先于视觉、从现有上下文出发、先假设再变体、内容优先于动画、反 AI slop、五维设计审查。它将用于前端收口、可视化和讲座材料，不得改变科研证据等级。

## 11. DeepTutor 方法在本项目中的应用原则

明早继续时，对任何知识教学/项目讲解任务采用：

```text
诊断已有理解
→ 拆解知识点
→ 用类比和精确术语双层讲解
→ 提问/小测确认理解
→ 记录错误类型
→ 针对薄弱点复习
→ 间隔复习和重新验证
```

但它不能改变科研证据优先级：教学体验可以个性化，实验事实仍须由脚本、数据、日志和来源支持。

---

## 8. D42 终验收更新（2026-08-09）

### P4 真实 SU2 状态

- coarse Rotor37 外部体网格已完成 preprocessing、真实 RANS 启动、一阶 SA 对照和 Stage Performance 提取；residual 最终约 `-3.39242`，未达到 `< -4`。
- fine Rotor37 外部体网格已完成 preprocessing 并进入 solver；用户本机内存达到约 99%，电脑几乎卡死后主动中止。该中止是正确的资源安全决策，不是 SU2 自然收敛或新的物理失败证据。
- fine 不再在当前个人电脑上执行长时间 RANS；未来服务器/HPC 恢复。
- P4 当前冻结口径：`真实 SU2 物理通路验证 + 未收敛 Stage Performance 趋势`。

### 展示与交付状态

- 首页、Optimize、Methodology、UQ、About 已统一使用“代理模型预测候选”及“最终 RANS 待完成”口径。
- README、`docs/report-one-pager-D37.md`、`docs/defense-pitch-D40.md` 已同步当前证据等级。
- 新增 `docs/final-acceptance-D42.md` 作为阶段性交付验收清单。
- 前端 build/lint 通过：build 成功，lint 0 warnings/0 errors。
- Vite preview 已允许 Arena hosted preview host。

### 当前决策

项目不再被本机 fine mesh 计算阻塞，转入阶段性交付和 DeepTutor 学习准备。若没有新的服务器/HPC 资源，不继续进行 fine 长跑或无边界 CFL 调参。

### 纯前端部署决策

- 由于 SnapDeploy 冷启动影响公开演示，前端数据层已切换为静态资源 + 浏览器 ONNX Runtime Web。
- Pareto、演化、UQ、训练统计和特征数据随 Cloudflare Pages 部署；预测与 sweep 在浏览器本地运行。
- FastAPI 保留为研究复现/未来 HPC 服务，不再是公开演示的必需依赖。
- 纯前端部署只改变运行位置，不提高证据等级；Pareto 仍是代理预测候选，RANS 仍待收敛验证。
