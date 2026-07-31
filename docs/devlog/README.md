# 🗓️ 开发日志 Devlog（Day 1 – Day 19）

> 本文件记录「AI 赋能的叶轮机械多学科设计优化平台」从立项到上线的完整开发过程。
> 每条记录都对应仓库中的真实提交（SHA 可点开查看），所有数字均可在本仓库复现
> （复现方法见 [README § 快速复现](../../README.md)）。
>
> This devlog mirrors the real commit history of this repository. Every entry links to
> an actual commit, and every number is reproducible from this repo (see README § Reproduce).

**周期**：2026-07-30（Day 1）→ 2026-07-31（Day 37 文档预演，当前）
**提交数**：57 个（截至 Day 37 文档，`f9e1556`）
**作者**：孙承泽 · 本科二年级 · 独立完成（Sun Chengze · Undergraduate (Year 2) · Independent Project）

---

## Day 01 — 项目初始化

- `eb7c1dc` Day 01: Initialize project repository and README
- `38d6a77` Day 01: Setup project structure and conda environment
- `1f1ea25` Day 01: Add .gitkeep to track empty directories

**产出**：仓库骨架（backend / frontend / notebooks / models / docs / data）、README 初稿、conda 环境规划。
**想法**：用「Day N」命名提交，让整个开发过程在 Git 历史里可读 —— 这在后期成了最有价值的门面资产。

---

## Day 02 — 数据获取

- `177cc97` Day 02: Download PLAID Rotor37 dataset, extract 1000 samples to CSV

**产出**：从 Hugging Face `PLAID-datasets/Rotor37` 下载 NASA Rotor 37 公开基准数据集，
解析为 `1000 组 CFD 样本 × 29,773 表面节点` 的结构化 CSV。
**为什么选它**：公开、可复现、是叶轮机械领域的经典验证基准（NASA TP-1337 原始报告）。

---

## Day 03 — 探索性数据分析 EDA

- `e58f9aa` Day 03: EDA complete, visualize blade geometry and pressure

**产出**：叶片几何与压力场可视化（`docs/fig01`–`fig04`）、输入-输出关系初探。
**关键发现**：原始表面场量（29,773 节点 × 9 物理量）维度巨大，直接建模会维度灾难 —— 为 Day 4 的特征工程埋下伏笔。

---

## Day 04 — 特征工程

- `f5f38d3` Day 04: Feature engineering complete, 74-dim feature matrix extracted

**产出**：29,773 × 9 原始场量 → **74 维统计特征**（9 组物理量 × 8 个统计量 + 转速 Omega + 背压 P），
样本级特征矩阵 `1000 × 74`。
**设计取舍**：统计特征化丢失空间分布信息，但在 1,000 样本量级换来训练稳定性
（这一取舍在 README「局限与未来工作」中有诚实披露）。

---

## Day 05 — 基线模型

- `6e6f87d` Day 05: Baseline MLP trained, first R2 scores obtained

**产出**：首个基线 MLP，拿到第一批 R² 分数，建立评估基准
（最终基线 MLP 在留出测试集上的对照：π 0.9664 / η 0.9132 / ṁ 0.9492，见 README）。
**意义**：有对照才有说服力 —— 后续残差网络的提升全部相对这个基线量化。

---

## Day 06 — 残差代理模型（主力模型）

- `e0ab6fb` Day 06: Residual network R2 all >0.95, physics constraints working

**产出**：**残差网络 + 物理约束损失**（多任务加权 MSE + `ReLU(·)²` 边界惩罚），
三个输出 R² 全部 > 0.95；物理约束生效（η≤1.0、η≥0.5、π≥1.0、ṁ≥0）。
**架构**：74 → 256 → 残差块×3 → 128 → 残差块×2 → 3（523,011 参数），
详见 `notebooks/04_residual_physics_model.ipynb` 与 README「模型架构」。

---

## Day 07 — 不确定性量化 UQ

- `3a4e7d8` Day 07: MC Dropout UQ implemented, confidence intervals generated

**产出**：MC Dropout（推理时保持 Dropout，100 次采样，±1.96σ 置信区间）。
**诚实披露**：后来实测发现名义 95% 区间实际覆盖率仅 65–89%（低估不确定性），
已在 README 中如实说明 —— 它的定位是相对置信度指示器，不是严格的统计保证。

---

## Day 08 — 多目标优化

- `1d34040` Day 08: NSGA-II optimization complete, Pareto front generated

**产出**：NSGA-II（pymoo，种群 100、200 代），约束 π≥1.8、η≥0.84，得到 **100 个 Pareto 非支配解**。
**结果**：最优 η = 0.9173（+5.40% vs 训练集均值），最大 ṁ = 21.74 kg/s（+11.42%）
（数字于 Day 22 统一为 pymoo 0.6.1 + 生产 ONNX 的可复现流水线，见 `backend/scripts/generate_pareto_evolution.py`）。

---

## Day 09 — 后端 API

- `a198ea7` Day 09: FastAPI backend running, all endpoints verified

**产出**：FastAPI 后端跑通，核心端点验证完成（单点预测 / 模型信息 / 优化结果 / UQ 结果）。

---

## Day 10 — 前端骨架

- `7547c30` Day 10: React frontend complete, homepage styled and fixed

**产出**：React（Vite）前端骨架 + 首页，深蓝科技风视觉体系成形。

---

## Day 11 — 核心页面

- `0e68e80` Day 11: PredictPage with real-time API integration and UQ toggle
- `90fe66c` Day 11: All four pages complete - Predict, Optimize, UQ, Home

**产出**：实时预测页（74 维输入 → 三项性能，可切换 UQ）、优化页、UQ 页、首页四页齐全。

---

## Day 12 — 3D 叶片查看器

- `7a17a42` Day 12: Three.js 3D blade viewer working with physics-based geometry

**产出**：Three.js 3D 叶片查看器，基于物理参数化几何生成叶型（`BladeViewer3D`）。

---

## Day 13 — 生产化与部署 🚀（单日 10 个提交）

- `e3fa1fc` Day 13: Add Railway deployment config
- `7a15f24` Day 13: Use CPU-only torch for Render deployment
- `b3412da` Day 13: Switch to ONNX Runtime, remove PyTorch dependency
- `5218b6a` Day 13: Add Dockerfile for SnapDeploy deployment
- `21cc290` Fix model path for Docker deployment
- `5c3438b` Day 13: Update API URL for production deployment
- `208a0ea` Fix CORS and ensure data files included in deployment
- `998eef8` Fix data file paths for Docker container
- `fd7ac66` Fix optimize router paths for Docker
- `b45aa62` Day 13: Add engineering note, fix all paths, ready for final deploy

**产出**：完整生产化链路 —— PyTorch → **ONNX**（2.11 MB，523,011 参数，推理 0.13–0.37 ms），
移除 torch 运行时依赖；Dockerfile / Procfile 部署配置；CORS、模型路径、数据路径、路由路径全部按容器环境修正。
**单日连踩五个部署坑**（平台切换、模型序列化、容器内路径、CORS、路由前缀），最终 SnapDeploy 容器上线。
**教训**：容器部署的坑集中在「路径」与「依赖版本」两处 —— 后来专门在代码里加了工程注记。

---

## Day 14 — 冷启动与容错

- `43fc599` Day 14: Add WakeUpBanner for cold start, improve error handling

**产出**：WakeUpBanner（后端冷启动提示）+ 全站错误兜底。
**背景**：容器平台冷启动需要数秒，用户在首次访问时可能撞上「服务未就绪」—— 需要可解释的提示而非白屏。

---

## Day 15 — 设计空间探索器（第 5 页，主秀场）

- `e48e1f8` Day 15: Add Design Space Explorer (Page 5)

**产出**：`POST /api/predict/sweep` 批量推理端点 + ExplorePage 响应面热力图：
任选两维参数（转速 Ω / 背压 P / 9 组表面量统计）→ 一次推理生成整张网格 → 点击任意点读数对比基准。
**性能实测**：25×25 = 625 点 **23.7 ms**；40×40 = 1,600 点 **45.4 ms**；
网格值与单点预测**逐位一致**（批量推理与单点推理的数值完全对齐）。

---

## Day 16 — 可靠性收尾

- `01728b9` Day 16: Fix chart resize, remove debug endpoint, align sklearn, code-split

**产出**：五个隐患清零 —— ① 图表 resize 修复（Plotly `useResizeHandler`）② 删除 debug 端点
（`/api/optimize/debug-path`，也是线上镜像新旧的最快探针）③ scikit-learn 对齐 **1.7.2**
（与 scaler 导出版本一致）④ `arginTop` 笔误修复 ⑤ React.lazy 代码分割，首屏 **6.0 MB → 440 kB**。

---

## Day 17 — 全站中英双语（分 3 部分）

- `fe2c839` Day 17 (part 1): CORS any-port fix + Chinese-English UI pass (Home/Nav/Banner)
- `acb9205` HomePage typography: enlarge KIT card text, tighten Engineering Note
- `3aff43f` Day 17 (part 2): full bilingual CN-EN pass on Predict/Optimize/UQ pages
- `b05c087` Day 17 (part 3): unify dual-language format on Home + Explore, adopt official site title

**产出**：全站**逐句中英双语**（中文在前，英文次级样式紧随，学术海报式）；定稿站名
「AI 赋能的叶轮机械多学科设计优化平台」；CORS 改为放行任意本地端口
（Vite 端口被占顺延 5173→5174 不再假死）；KIT 叙事理顺（行业引子，载体明说 Rotor 37）。
**范例规范**：双语格式规范进入后续所有页面（README 与 About 页沿用同一套）。

---

## Day 18 — 线上部署总验收

- `e23b769` Day 18: update README status line to Day 18 (bilingual UI complete)

**产出**：代码侧总验收全绿（10 个端点齐全、debug 端点 404、sweep 性能达标、
网格-单点逐位一致、物理越界 422、CORS any-port、前端 build 443.74 kB / gzip 144.93 kB、
lint 16 warnings 0 errors）；线上部分由作者在**移动端 + 电脑端**双端验证通过
（`/explore` 热力图正常渲染，即线上后端已带 `/sweep`）。

---

## Day 19 — README 中英双语重制 + R² 口径修正

- `1839aa5` Day 19: bilingual README rewrite + correct R2 figures to reproducible values

**产出**：README 全文重写为**中英双语门面版**（研究背景 → 管线图 → 实测性能 → 模型架构 →
平台功能 → 技术栈 → API 参考 → 快速复现 → 数据说明 → 局限与未来工作 → 开发进度 → 参考文献 → 署名）。
**R² 口径修正**：网站/API 长期显示的 0.9861/0.9588/0.9845 经复现核对不对应任何数据划分，
统一修正为**留出测试集（n=100, random_state=42）实测**的 **0.9844 / 0.9561 / 0.9827**，
并在 README 附一键复现脚本、API 新增 `r2_evaluated_on` 字段说明评估口径。
**为什么重要**：评估口径（训练集/测试集）是评审第一问 —— 答不出口径比数字低一点致命得多。

---

## Day 20 — About 页 + 署名 + devlog

- `ca61c0f` Day 20: About page with author credit + devlog for Day 1-19

**产出**：新增 `/about` 页（署名「孙承泽 · 本科二年级 · 独立完成」、项目缘起、技术旅程时间线、
方法与数据、GitHub 链接），独立 chunk 懒加载（14.9 kB，不进首屏）；导航加入口、首页 footer 加署名模块；
新建 `docs/devlog/README.md` 回溯 Day 1–19（37 个真实提交对号入座）。

---

## Day 21 — Pareto → 3D 叶片联动

- `b829618` Day 21: Pareto-to-3D blade linkage (select solution -> render geometry)

**产出**：`/api/optimize/pareto` 每条解新增 `geometry`（Ω / P / 表面压力均值·标准差 / 温度均值 / 径向均值）；
OptimizePage 点选 Pareto 解 → `BladeViewer3D` 实时渲染对应叶型 + 工况参数小表。

---

## Day 22 — NSGA-II 演化动画 + 数据流水线统一

- `5d768f8` Day 22: NSGA-II evolution animation + unify Pareto data pipeline (reproducible via backend/scripts)

**产出**：
- `backend/scripts/generate_pareto_evolution.py`：同 seed (42) 同配置重跑 NSGA-II，每 10 代记录一帧
  非支配前沿 → `pareto_evolution.csv`（21 帧、1,830 条，全流程约 3 秒，可一键复现）。
- 新端点 `GET /api/optimize/pareto-evolution`。
- OptimizePage 新增**演化动画**（Plotly frames：播放/暂停 + 代际滑块，200 代优化过程 8 秒播完）。
- **数字口径统一**：复现时发现原 `pareto_front_solutions.csv`（及 README 引用的 η 0.9211 / ṁ 21.64 / π 2.1012）
  是旧 pymoo 环境产物，与当前可复现流水线不一致（评估器本身逐位一致，R²=1.000000，差异纯来自优化器版本）。
  已统一为同源新结果 **η 0.9173 / ṁ 21.74 / π 2.1073**，并同步更新 README 与 devlog ——
  现在主图、动画末帧、README、API 全部来自同一条可复现流水线。

---

## Day 23 — 功能冻结 + 全站走查表 v1

- `bf151fa` Day 23: param tooltips on PredictPage + full-site walkthrough checklist v1

**产出**：PredictPage 参数 Tooltip 重实现（`ParamSlider` 新增 `hint` 属性，6 个参数 hover/键盘 focus 弹双语解释卡）；
`docs/D23-walkthrough-v1.md` 全站走查表（4 大类 14 项，双语/交互/视觉全过；4 项待办排期到 D28–29 / D32–33）。
**功能冻结**：此后不加计划外新功能。

---

## Day 24 — 方法论页

- `df6abf2` Day 24: Methodology page (data -> features -> surrogate -> physics -> UQ -> NSGA-II)

**产出**：新增 `/methodology` 页（独立 chunk 15.7 kB 懒加载）：数据 → 特征工程（74 维）→ 残差网络架构 →
留出测试集精度（0.9844/0.9561/0.9827）→ MC Dropout（含覆盖率诚实披露）→ NSGA-II（0.9173/21.74/2.1073，
与 README/动画同源）→ 五条诚实披露。导航加入口。
**口径一致**：本页所有数字与 README、devlog、API 来自同一条可复现流水线。

---

## Day 27 — 精度验证区块

- `06c1d0f` Day 27: validation block on Methodology page (pred-vs-true + residual figures)

**产出**：方法论页新增「精度验证」区块：基线 MLP（fig09）与残差网络（fig10）的预测 vs 真实散点 +
残差分布直方图（测试集 n=100），图片经 `frontend/public/figures/` 随站点打包（懒加载）。
**对比价值**：并排展示基线 vs 残差网络，直接可见残差模型散点更贴 y=x、残差均值近零（无系统性偏差）。

---

## Day 30 — 备份三件套（前两件）

- 预热 workflow：**模板在 `docs/preheat-workflow.md`**（每 10 分钟 ping 后端 `/health`，失败不报错，冷启动期自动重试）。
  ⚠️ Arena 的 GitHub App 无 `workflows` 权限，无法直接推送 `.github/workflows/*.yml`（推送被 GitHub 拒绝），
  已改为网页可粘贴的模板，承泽在 Actions 页 30 秒安装。
- 本地一键启动 `scripts/start-local.bat`（Windows / conda turbine-ai）+ `scripts/start-local.sh`（Unix/WSL）。

**注意**：GitHub Actions 定时任务只在默认分支（main）生效 —— 合入 main 后才会自动预热；
若仓库未启用 Actions 需承泽在 Settings → Actions 开启。第三件（录屏）随 D35 演示视频终版完成。

---

## Day 28 — 移动端适配（代码级第一轮）

- `1efb5ea` Day 28: mobile-first layout fixes (stack columns <900px, nav breakpoint 1024)

**产出**：三处固定双栏布局在窄屏（<900px）改为单列 —— PredictPage（360px 左栏）、OptimizePage（300px 侧栏）、
UQPage（2fr 1fr）；Navbar 胶囊断点 768→1024（7 个导航项不再在平板宽度溢出）。
**过程教训**：UQPage 初版把状态加在主组件、却在子组件里使用，lint 抓到「declared but never used」——
改为 prop 传递后复核通过。移动端真机全面走查仍在 D29。

---

## Day 31 — 质疑点压力测试问答稿

- `fb25138` Day 31: pressure-test Q&A prep (5 challenges + R2 story)

**产出**：`docs/pressure-test-D31.md` —— 评审最可能问的 5 个质疑点逐条演答（样本量/未跑 CFD/物理约束弱/
提交历史太干净/压气机数据讲涡轮故事），外加 R² 口径修正的如实回应与汇报当天操作清单。

---

## Day 32 — 术语与单位统一

- `718dd76` Day 32: fix unit labels (Omega rad/s, coordinates m) — factual correctness
- `4c1c8c5` Day 32: terminology/units table + fix history card unit

**产出**：`docs/terminology.md` 术语统一表（站名/术语/输出变量/单位/双语格式/数字口径）。
**发现并修正显示错误**：Ω 单位曾标 rpm（实际 rad/s，Rotor 37 设计转速 16,188 rpm ≈ 1,695 rad/s，
数据范围 1620–1800 rad/s；rpm 量级差 4–5 倍）；坐标均值单位曾标 mm（实际 m）。
落点：ExplorePage UNITS 表、PredictPage 滑块/历史条目。

---

## Day 34 / 36 — 外行试讲与终版验收清单

- `f9e1556` Day 34/36: stranger-test & final acceptance checklists

**产出**：`docs/final-acceptance-D36.md` —— 外行试讲流程与卡点记录模板（任务 A/B/C + 三问）、
终版验收清单（页面×双端、内容口径、兜底）、汇报日时间线。

---

## Day 37 — 汇报一页纸 + Q&A 预演稿

- `ce4b37b` Day 37: one-page report + 20-question Q&A rehearsal draft

**产出**：`docs/report-one-pager-D37.md` —— 一页纸汇报结构（背景钩子/八步成果/诚实边界/入口）、
Q&A 20 问标准答法（数据模型/精度验证/优化/工程部署/项目个人五组）、汇报当天操作清单。
与 `pressure-test-D31.md`（5 大质疑点）配套使用。

---

## 里程碑一览


| 里程碑 | Day | 提交 |
|---|---|---|
| 数据就绪（1000×74 特征矩阵） | 04 | `f5f38d3` |
| 主力模型达标（R² 全 >0.95） | 06 | `e0ab6fb` |
| 模型全家桶（UQ + NSGA-II） | 07–08 | `3a4e7d8` `1d34040` |
| 全栈平台成形（后端 + 前端 + 3D） | 09–12 | `a198ea7` … `7a17a42` |
| 生产化上线（ONNX + Docker + SnapDeploy） | 13 | `b45aa62` |
| 探索器主秀场上线 | 15 | `e48e1f8` |
| 可靠性清零 + 性能优化 | 16 | `01728b9` |
| 全站双语 + 定稿站名 | 17 | `b05c087` |
| 线上总验收 | 18 | `e23b769` |
| 门面 README + 数字口径修正 | 19 | `1839aa5` |

> 后续进度在此文档持续追加（Day 20+）。
