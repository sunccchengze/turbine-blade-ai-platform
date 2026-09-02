# 历程总表 —— 一步一步做出来的全部提交（2026-09-02 汇编）

> 汇编自本仓 Git 历史，**按会话分段、时间正序**；每段只列该会话独有（前序会话没有）的提交，
> 因此全表不重复，加起来即全部历程，共 **391 笔**。
>
> 2026-09-02 起，`019fb8ff`（1 笔）与 `019fc539`（12 笔，D40）已用 `git merge -s ours`
> **零文件改动**地永久并入主线 → 即使删掉那些分支，这段历史仍可从 `main` 查到。
>
> 重新生成命令见文末；看某一笔改了什么：`git show <sha>`。

| 会话段 | 笔数 |
|---|---|
| 家族A · Day 01–17 | 31 |
| 家族A · Day 17–18 | 3 |
| 家族A · Day 19–37 | 48 |
| 家族A · Day 30 尾 | 2 |
| 家族A · Day 38 | 87 |
| 家族A · Day 39–40 | 15 |
| 主线 · 2026-08-08 网页批量上传 `Add files via upload`（GitHub 上另有 PR #5 / #7 的合并提交，本地 shallow 看不见） | 1 |
| 家族B · D38–D43 | 114 |
| 家族B · D43–44 | 53 |
| 家族B · Day 44 | 28 |
| 家族B · A5/A6/A7 | 5 |
| 会话 01a061af · 2026-09-02 | 4 |

## 家族A · Day 01–17：建仓、后端骨架、双语 UI 首轮
- eb7c1dc6 · 07-30 10:28 · Day 01: Initialize project repository and README
- 38d6a773 · 07-30 11:23 · Day 01: Setup project structure and conda environment
- 1f1ea25e · 07-30 11:25 · Day 01: Add .gitkeep to track empty directories
- 177cc97d · 07-30 14:43 · Day 02: Download PLAID Rotor37 dataset, extract 1000 samples to CSV
- e58f9aaa · 07-30 14:54 · Day 03: EDA complete, visualize blade geometry and pressure
- f5f38d31 · 07-30 15:11 · Day 04: Feature engineering complete, 74-dim feature matrix extracted
- 6e6f87d8 · 07-30 15:20 · Day 05: Baseline MLP trained, first R2 scores obtained
- e0ab6fb6 · 07-30 15:41 · Day 06: Residual network R2 all >0.95, physics constraints working
- 3a4e7d80 · 07-30 15:47 · Day 07: MC Dropout UQ implemented, confidence intervals generated
- 1d34040a · 07-30 15:55 · Day 08: NSGA-II optimization complete, Pareto front generated
- a198ea7b · 07-30 16:10 · Day 09: FastAPI backend running, all endpoints verified
- 7547c306 · 07-30 17:56 · Day 10: React frontend complete, homepage styled and fixed
- 0e68e804 · 07-30 18:04 · Day 11: PredictPage with real-time API integration and UQ toggle
- 90fe66ce · 07-30 18:12 · Day 11: All four pages complete - Predict, Optimize, UQ, Home
- 7a17a428 · 07-30 18:36 · Day 12: Three.js 3D blade viewer working with physics-based geometry
- e3fa1fc0 · 07-30 18:41 · Day 13: Add Railway deployment config
- 7a15f242 · 07-30 18:49 · Day 13: Use CPU-only torch for Render deployment
- b3412dae · 07-30 22:13 · Day 13: Switch to ONNX Runtime, remove PyTorch dependency
- 5218b6a5 · 07-30 22:56 · Day 13: Add Dockerfile for SnapDeploy deployment
- 21cc2904 · 07-30 23:11 · Fix model path for Docker deployment
- 5c3438ba · 07-30 23:23 · Day 13: Update API URL for production deployment
- 208a0ea5 · 07-30 23:44 · Fix CORS and ensure data files included in deployment
- 998eef8e · 07-30 23:50 · Fix data file paths for Docker container
- fd7ac66a · 07-31 09:48 · Fix optimize router paths for Docker
- b45aa629 · 07-31 10:03 · Day 13: Add engineering note, fix all paths, ready for final deploy
- 43fc599d · 07-31 10:12 · Day 14: Add WakeUpBanner for cold start, improve error handling
- e48e1f81 · 07-31 03:28 · Day 15: Add Design Space Explorer (Page 5)
- 01728b9b · 07-31 03:48 · Day 16: Fix chart resize, remove debug endpoint, align sklearn, code-split
- fe2c8391 · 07-31 04:01 · Day 17 (part 1): CORS any-port fix + Chinese-English UI pass (Home/Nav/Banner)
- acb92059 · 07-31 06:39 · HomePage typography: enlarge KIT card text, tighten Engineering Note
- 3aff43fc · 07-31 06:50 · Day 17 (part 2): full bilingual CN-EN pass on Predict/Optimize/UQ pages
## 家族A · Day 17–18：双语统一、部署验收
- 685b7bbc · 07-31 07:07 · Merge pull request #1 from sunccchengze/arena/019fb618-turbine-blade-ai-platform
- b05c0876 · 07-31 07:46 · Day 17 (part 3): unify dual-language format on Home + Explore, adopt official site title
- e23b7692 · 07-31 08:51 · Day 18: update README status line to Day 18 (bilingual UI complete)
## 家族A · Day 19–37：README 方法论、Pareto-3D、演化动画、移动端、文档（PR #4）
- 1274e36e · 07-31 08:42 · Merge pull request #2: Day 17 part 3 (bilingual Home+Explore, official title)
- 16821b40 · 07-31 08:52 · Merge pull request #3: Day 18 deployment acceptance
- 1839aa53 · 07-31 09:34 · Day 19: bilingual README rewrite + correct R2 figures to reproducible values
- ca61c0f8 · 07-31 09:37 · Day 20: About page with author credit + devlog for Day 1-19
- b8296183 · 07-31 09:39 · Day 21: Pareto-to-3D blade linkage (select solution -> render geometry)
- 5d768f8e · 07-31 09:43 · Day 22: NSGA-II evolution animation + unify Pareto data pipeline (reproducible via backend/scripts)
- 9db29536 · 07-31 09:43 · Day 22: append devlog entries for Day 20-22
- bf151fac · 07-31 09:56 · Day 23: param tooltips on PredictPage + full-site walkthrough checklist v1
- df6abf29 · 07-31 09:59 · Day 24: Methodology page (data -> features -> surrogate -> physics -> UQ -> NSGA-II)
- f6f196a4 · 07-31 09:59 · Day 24: update README progress + devlog (D23-D24)
- 06c1d0f4 · 07-31 10:00 · Day 27: validation block on Methodology page (pred-vs-true + residual figures)
- 6b1add0b · 07-31 10:00 · Day 30: preheat workflow + local launcher scripts, update docs
- 1efb5ea8 · 07-31 10:02 · Day 28: mobile-first layout fixes (stack columns <900px, nav breakpoint 1024)
- 05e9a5c3 · 07-31 10:03 · Day 28: walkthrough v1.1 + devlog (mobile fixes record)
- fb251381 · 07-31 10:03 · Day 31: pressure-test Q&A prep (5 challenges + R2 story)
- 718dd76a · 07-31 10:04 · Day 32: fix unit labels (Omega rad/s, coordinates m) — factual correctness
- 4c1c8c53 · 07-31 10:05 · Day 32: terminology/units table + fix history card unit
- 3c368d60 · 07-31 10:05 · Day 32: update README progress + devlog (D28/D31/D32)
- ce4b37b7 · 07-31 10:06 · Day 37: one-page report + 20-question Q&A rehearsal draft
- f9e1556b · 07-31 10:06 · Day 34/36: stranger-test & final acceptance checklists
- 2d92da5d · 07-31 10:07 · devlog: append D34/D36/D37 entries
- 2ed50c0f · 07-31 10:07 · Day 30: actually commit preheat workflow + launcher scripts (missed in prior add)
- 3b4ba54c · 07-31 10:08 · Day 30: preheat workflow as installable template in docs (GH App lacks workflows permission); add launcher scripts
- 71b6c56a · 07-31 10:08 · docs: note preheat workflow is an installable template (GH App permission)
- 24927c41 · 07-31 10:11 · Day 32/33: purge stale NSGA-II numbers site-wide (0.9211->0.9173, 21.64->21.74), precise deltas
- 9f6c7938 · 07-31 10:11 · devlog: D33 number-purge entry + commit counts
- 801897a3 · 07-31 10:19 · docs: add HANDOFF.md v5 (session handoff doc, per author request)
- d3e8224a · 07-31 10:20 · Polish: site title/SEO meta + custom favicon + 404 fallback page
- 9682e207 · 07-31 10:21 · Add MIT license + fix dead link in README clone command (suncchengze->sunccchengze)
- 197cd3ac · 07-31 10:22 · Polish: real API health indicator in navbar (no fake green dot)
- 0373c631 · 07-31 10:23 · Polish: per-route document title
- a811386d · 07-31 10:23 · Backend: complete endpoint registry in GET / (add baseline-features, pareto-evolution)
- 29b2363d · 07-31 10:23 · devlog: update commit count
- 7943369f · 07-31 10:24 · README: sync progress with D33/D34/D36/D37 completions
- 10953c39 · 07-31 10:24 · Chore: clean .gitignore (drop stale handoff note, add env/build ignores)
- 36ca2b44 · 07-31 10:25 · Backend: align API title with official name (Turbomachinery AI Platform)
- 5b12ff55 · 07-31 10:26 · Devlog: link commit SHAs to GitHub (clickable history)
- 875a491d · 07-31 10:26 · Data: sync pareto CSV across both data paths (notebooks + backend)
- a3fa15bb · 07-31 10:30 · README: add NSGA-II one-command reproduction section (verified 0.9173/21.74/2.1073)
- bfa4a12d · 07-31 10:32 · Polish: global scroll-to-top on route change (all pages)
- 12e23bc8 · 07-31 10:35 · Chore: replace Vite scaffold README with project frontend docs
- 1eca2c53 · 07-31 10:36 · Chore: remove 5 unreferenced scaffold assets (vite/react svg, hero.png, App.css, icons.svg)
- 531e39f5 · 07-31 10:42 · Final review: bilingual NewsBanner, remove dead code (PredictResponse, unused os), docstring spacing
- 25f01297 · 07-31 10:47 · Final review round 2: fix Pareto click-to-select bug, UQ precomputed-sigma disclosure site-wide, stale devlog header, misc polish
- 79a130e3 · 07-31 10:58 · Final review round 3: remove dead homepage fetches (2 fewer API calls), add SPA _redirects for deep links
- a519fb47 · 07-31 11:03 · Final review round 4: lint to 0 warnings, add backend .dockerignore, normalize effect deps
- a85aa80f · 07-31 11:08 · Final review round 5: a11y (aria/contrast) fixes + BackToTop button + Explore full-range reset
- 08e22b54 · 07-31 11:09 · Docs: sync lint baseline to 0 warnings after final review
## 家族A · Day 30 尾：升级清单（当时唯一未走 PR 的孤立提交）
- 70f5e6c7 · 07-31 11:10 · Merge pull request #4 from sunccchengze/arena/019fb778-turbine-blade-ai-platform
- 67e2ae7a · 07-31 16:26 · docs: add upgrade checklist
## 家族A · Day 38：脱胎换骨升级冲刺（PR #6）
- 5dc74600 · 07-31 16:23 · Day 38: 交接 v6（升级冲刺任务书）+ 知识弹药库（2026 国际前沿 + AI×叶轮机械文献）
- 7f94707c · 07-31 16:43 · Day 38: 升级蓝图 D38（五层脱胎换骨方案：场级代理/校准UQ/扩散生成/SU2闭环/LLM助手）+ HANDOFF v6.1 同步决策
- 42055ab5 · 07-31 16:47 · Day 38: 30天作战计划（AI内阁评审定稿版：P1双头/P4抽查/P3 2D先行）+ HANDOFF 指向计划
- affa19c5 · 08-01 02:14 · Day 38/39: P1 点云管线脚本（build_pointcloud_dataset.py，冒烟自检通过）+ 算力通路确认（云GPU）+ 沙盒HF不通坑记录
- a3846029 · 08-01 02:22 · Day 39: P1 双头 PointNet 训练脚本（场+标量，冒烟自检通过，134k 参数）
- 4d419310 · 08-01 10:42 · Add backend preheat workflow to check health status
- f2d99972 · 08-01 03:40 · Day 39: 合成点云占位数据生成器 + P1 训练支持 --synthetic（全链路跑通）
- 0e6ee9d7 · 08-01 03:43 · Day 39: P2 校准UQ（Deep Ensembles + Split Conformal，全链路跑通，合成数据验证）
- f292f667 · 08-01 03:45 · Day 39: P3 生成式设计（2D翼型条件VAE，有效性10/10，扩散接口预留）
- 2632ce0c · 08-01 03:45 · Day 39: E5 LLM设计助手API骨架（rule-based MVP，自然语言→调参→预测→解释，实测通过）
- 86bc4dca · 08-01 03:46 · Day 39: HANDOFF 记录冲刺进度（P1/P2/P3/E5 合成数据全链路跑通）
- bf0dc5f3 · 08-01 03:46 · Day 39: P1 场级预测占位端点（predict_surface_field，供前端3D热力图衔接）
- 03076b1e · 08-01 03:47 · Day 39: E5 设计助手前端对话面板（接入 /api/assistant/design，build 通过）
- ce7f05c4 · 08-01 03:47 · Day 39: P4 SU2抽查验证模块骨架（dry-run 跑通，真实SU2环境就绪后替换）
- 0fa0998f · 08-01 03:49 · Day 39: 五层管线一键冒烟脚本 run_all_smoke.sh（全绿）
- a4adb4b9 · 08-01 03:49 · Day 39: 30天计划标记五层沙盒侧完成状态（含待替换清单）
- f6f57c38 · 08-01 03:50 · Day 39: P3 潜在空间条件扩散（DDPM完整版，VAE+扩散跑通，合成数据验证）
- 46dc8e50 · 08-01 03:50 · Day 39: 真实数据替换指引（回传后逐层替换操作手册）
- 17f844fb · 08-01 03:51 · Day 39: gitignore P1-P4 训练产物目录
- d1e4eb94 · 08-01 03:52 · Day 39: 设计助手挂载首页 + api 实例导出修复（build 通过）
- 1c173710 · 08-01 03:52 · Day 39: E5 助手回归测试（可复现，全部通过）
- 5a1e81e1 · 08-01 03:53 · Day 39: HANDOFF 冲刺交付完整登记（五层+文档，12:00 前收口）
- f1e49ebf · 08-01 03:53 · Day 39: README 增加升级路线 Roadmap 章节（五层状态）
- 4c33dc25 · 08-01 03:53 · Day 39: devlog 记录 Day 38-39（升级蓝图 + 五层冲刺）
- 20a0f030 · 08-01 03:55 · Day 39: 30天计划 Gate 状态更新（G0 基线锁定 ✅）
- 22917635 · 08-01 04:02 · Day 39: 样本结构探索脚本（定位场量字段名，通道数3问题排查）
- a7ac83ac · 08-01 04:07 · Day 39: 场量探测脚本 probe_fields（2样本轻量探测，定位 Pressure/Temperature 位置）
- b19b517f · 08-01 04:17 · Day 39: 修复场量提取（Normals 复数匹配 + 通道诊断打印，复现验证 9 通道）
- bd711dbc · 08-01 07:26 · Day 39: 修复场量提取根因（CellData 字母序在前导致长度不匹配被跳过，现优先选与坐标同长数组；含CellData真实结构复现验证 9 通道）
- 11598f6a · 08-01 07:43 · Day 39: 修复P1场目标列动态推断（9通道下温度在索引5；3通道仅坐标时只训标量）
- 556fb276 · 08-01 07:44 · Day 39: 新增数据验证脚本 verify_pointcloud（通道完整性/物理范围/对齐检查）+ 合成数据通道顺序对齐真实布局
- 799d16a5 · 08-01 07:44 · Day 39: 冒烟脚本加数据验证步骤 + 替换指引补 9 通道说明与 verify 用法
- 5bee1763 · 08-01 07:45 · Day 39: 修P2两处bug（--synthetic默认改为优先真数据+回退合成；conformal q_level clip到1防小样本崩溃）
- 18416526 · 08-01 07:45 · Day 39: 30天计划补记今日修复与9通道布局
- a4fd7c6c · 08-01 07:47 · Day 39: UQ页新增校准曲线（CalibrationCurve，名义vs实测覆盖率，build+lint通过）
- 46e3b65a · 08-01 07:47 · Day 39: UQ校准曲线 lint 清零（nominal 提为模块级常量）
- d7f47b64 · 08-01 07:48 · Day 39: HANDOFF 补记下午修复与校准曲线
- 92aca46f · 08-01 07:48 · Day 39: 新增 /generate 生成式设计页（P3前端落点：目标→设计链路，build+lint通过）
- dff89047 · 08-01 07:49 · Day 39: 导航加「生成设计」入口
- a1446c9a · 08-01 07:49 · Day 39: README Roadmap 更新（校准曲线+生成页已上线）
- 6813ec24 · 08-01 07:49 · Day 39: devlog 记录下午成果 + 数据指引补训练注意事项
- d699fde3 · 08-01 08:48 · Day 39: verify 放宽 Pressure/Density 期望区间（匹配真实数据范围）
- c66f321f · 08-01 08:49 · Day 39: P1训练加输入场量标准化（Pressure~1e5量纲失衡修复，loss从数万降至6量级）
- de84459c · 08-01 08:49 · Day 39: HANDOFF 补记傍晚修复（verify区间+P1输入标准化）
- 05dbe624 · 08-01 09:12 · Day 39: P1训练加 --n_points 降采样快速模式（CPU训练从1-2小时缩到几分钟）
- fa5b25c9 · 08-01 09:24 · Day 39: P1双头融合模型（统计特征+点云→标量，冒烟通过）
- ae70fbf6 · 08-01 09:24 · Day 39: 记录P1纯点云真数据首个结果（π0.92/ṁ0.95 空间信息实证）
- 983ce1f7 · 08-01 09:29 · Day 39: 双头融合加场头（标量保底+场预测完整，冒烟通过）
- 4e89f3a9 · 08-01 09:29 · Day 39: P2校准UQ加 --n_points 降采样（CPU加速）
- d529fa6d · 08-01 09:29 · Day 39: 真数据一键训练脚本 run_real_data.sh（P1融合+P2UQ+P3生成）
- 7bffd2a6 · 08-01 09:29 · Day 39: HANDOFF 补记纯点云首个结果+双头融合+CPU加速
- 65670243 · 08-01 09:30 · Day 39: P3真数据前置——3D点云抽2D翼型截面（合成验证通过）
- 863b8eb1 · 08-01 09:30 · Day 39: P3生成优先用真实翼型（extract_airfoils产物），训练链路通
- 4b74a362 · 08-01 09:33 · Day 39: README 加真数据一键训练入口
- a4dd4639 · 08-01 09:33 · Day 39: 真数据训练完整指南（固化CPU陷阱+正确姿势）
- 9493a041 · 08-01 09:55 · Day 39: 🎉P1双头融合真数据结果——三指标全部超越基线（0.9902/0.9608/0.9869），Gate1通过
- c75c1406 · 08-01 09:57 · Day 39: P1融合ONNX导出脚本（验证通过，opset18）
- 30fd915f · 08-01 09:57 · Day 39: P3有效性检查兼容真实翼型（轮廓非退化，替代NACA专用检查）
- e0509865 · 08-01 09:57 · Day 39: HANDOFF 补记融合里程碑+ONNX导出+check_valid
- 68e1c471 · 08-01 10:02 · Day 39: 战报文档（里程碑+坑+交付清单）
- 45ad5547 · 08-01 10:04 · Day 39: 固化一键流程真结果（P1再超基线 + P2校准 η65→93.5%）
- 6912424a · 08-01 10:04 · Day 39: 30天计划记录P2校准Gate2通过
- ffd3f392 · 08-01 10:05 · Day 39: 30天计划记录P2校准Gate2 + P3真实翼型Gate3通过
- 785de744 · 08-01 10:05 · Day 39: HANDOFF 收官——五层真数据全链路点亮（P1/P2/P3 Gate全过）
- 05571301 · 08-01 10:06 · Day 39: 后端 fused 融合模型支持（可选加载+预测端点，未导出安全降级）
- 39cdf02d · 08-01 10:07 · Day 39: 融合训练加 --lam_field 场权重可调 + 场指标报告（原始量纲）
- 45667499 · 08-01 10:09 · Day 39: E5助手接LLM后端（可配置API key，无key回退rule-based，验证通过）
- cbdb802f · 08-01 10:11 · Day 39: P4 SU2一键准备（生成6算例配置+批跑脚本+操作说明）
- 5aa20723 · 08-01 10:11 · Day 39: 训练指南补场头/ONNX/SU2三节
- 387eed43 · 08-01 10:12 · Day 39: README Roadmap 更新（P4准备就绪+E5 LLM可切换）
- 0a329dba · 08-01 10:12 · Day 39: README 加融合模型 v3 精度小节（空间信息增量价值结论）
- 75ab1517 · 08-01 10:12 · Day 39: HANDOFF 收官补记（剩余三件事工具化）
- d1515218 · 08-01 10:22 · add fused onnx
- 5b3c9ec8 · 08-01 10:23 · Day 39: 修复ONNX导出——强制单文件内嵌权重（save_as_external_data=False）
- c34f2b3d · 08-01 10:24 · Day 39: ONNX导出改onnx.save单文件（兼容新版torch，权重内嵌）
- bcd1c049 · 08-01 10:25 · add fused onnx single-file
- d3aaa211 · 08-01 10:27 · Day 39: ONNX部署反标准化待办记录（fused端点已200通）
- 8991715d · 08-01 14:43 · Day 39: 修复SU2配置中文注释（SU2不支持中文，改英文）
- d0080184 · 08-01 14:45 · Day 39: 彻底去掉SU2 cfg注释行（#注释也不被SU2接受）
- 5358d705 · 08-01 14:46 · Day 39: SU2 v8.5 配置选项名更新（SPECIFIC_HEAT_CP/MG_SMOOTH_OUTPUT/BC_EVAL_FREQ）
- 5600ba6f · 08-01 14:48 · Day 39: 战报补 P4 环境就绪（SU2 v8.5 原生版，配置调试完成）
- e7e5958e · 08-01 14:52 · Day 39 收尾: 补齐工作区未提交改动（fused/校准曲线/assistant等）
- 9136916a · 08-01 14:52 · Day 39: fused反标准化——export_fused_stats.py + 端点读stats还原真实量纲
- 27b224c3 · 08-01 15:02 · add fused stats
- 805936c4 · 08-01 15:19 · Day 39: CORS放行所有 *.pages.dev 预览域名（含子域，修复分支预览连后端）
- 954fac5f · 08-01 23:35 · Merge pull request #5 from sunccchengze/arena/019fb861-turbine-blade-ai-platform
- e6b0e5d1 · 08-01 15:48 · fix: split merged requirement line in requirements.txt
## 家族A · Day 39–40：填坑 + 宋老师 GHG-01 评审 + 答辩作战包 + 新生讲座三件套（未走 PR）
- e52c2a6e · 08-01 15:50 · Merge pull request #6 from sunccchengze/arena/019fbdff-turbine-blade-ai-platform
- a378528d · 08-02 16:25 · fix(generate): inverse design so results track target performance
- 50d336c5 · 08-03 09:23 · Merge pull request #7 from sunccchengze/arena/019fc343-turbine-blade-ai-platform
- 122b024a · 08-03 01:32 · GHG-01: 宋立明教授观后感（仓库+网站全量评审，含复现记录）
- fabe5db4 · 08-03 01:41 · Day 40 填坑（宋老师 GHG-01 评审）：Pareto 证据链脚本+首页措辞降级+UQ mode 诚实化+README 锁版/时间线口径+官方test split评估脚本+CI 复现作业
- 0726d45f · 08-03 01:41 · verify workflow 改为模板（GitHub App 无 workflows 权限，需 Actions 页手动安装）
- 104fc56b · 08-03 01:43 · D40: 答辩作战包（项目侧填坑清单+SU2冲刺+自审 / 答辩侧PPT大纲+讲稿+话术）
- a53c3fee · 08-03 02:00 · D40: 8/4 优化日保姆级 runbook（官方test split + SU2 逐步指令）
- cd3f5945 · 08-03 02:41 · D40: 新增 reproduce_r2.py（主口径30秒复现，无需下载）+ runbook v2（探针优先/瘦身日程/口径澄清）
- 62323196 · 08-03 03:46 · D40: eval_official_test_split v2——官方test输出隐藏（实测确认），改为无监督sanity check（分布/物理/越界/域内性）+ 可选train全量一致性验证
- c87f69c3 · 08-03 03:56 · D40: eval_official_test_split v3——实测确认官方test为黑盒（几何+输出隐藏仅工况），改为train集合一致性(按Ω/P匹配)+工况范围+近邻标签参考
- d3c02eab · 08-03 04:01 · D40: 官方test黑盒结论入文档——README数据节+答辩话术Q3+作战包状态更新（train 1000/1000匹配+test 200/200同域+近邻标签一致）
- 57ccb691 · 08-03 04:03 · D40: PPT 逐页演讲稿（24页备注版，含真实弹药：R²/SU2/官方test黑盒）
- 06e0a760 · 08-03 04:27 · D40: 西交大新生讲座三件套——方案v2(9幕4h)+类比手册(40+名词人话版)+剧本式讲稿(含检查点/互动/时间盒)
- 9cdeb370 · 08-03 07:48 · D40: 讲座PPT图——生成4张深色主题图（ablation对照实验/pipeline链路/mesh-pixel网格/plaid CSV预览）
## 主线 · 2026-08-08 网页批量上传 `Add files via upload`（GitHub 上另有 PR #5 / #7 的合并提交，本地 shallow 看不见）
- 17e78a57 · 08-08 16:13 · Add files via upload
## 家族B · D38–D43：装载技能库、backend/docs/frontend 大改、任务与审计群
- 97a5c7d8 · 08-08 08:18 · feat: load skill library and add usage guide
- 31014a45 · 08-08 08:26 · feat: combine D40 work with complete skill library
- cbc289ce · 08-08 08:34 · docs: establish D41 guardrails and verification plan
- d8c6f6bf · 08-08 08:34 · docs: audit P4 inputs and record Gate 0 results
- 7c9a74a8 · 08-08 17:15 · Create rotor37_pc.npz
- 5d22d948 · 08-08 09:22 · data: place and verify Rotor 37 point cloud
- 41e2f26a · 08-08 09:22 · chore: remove duplicate point cloud upload path
- 0f94ae77 · 08-08 09:27 · fix: correct real point cloud field metric scaling
- 5fb90a30 · 08-08 10:36 · fix: report point cloud field metrics by channel
- 7519c45c · 08-08 10:56 · docs: guard against point cloud target leakage
- 40c495dd · 08-08 10:59 · feat: add geometry conditioned fusion mode
- f2bf7339 · 08-08 11:01 · docs: record leakage free P1 input ablation
- 85d9880f · 08-08 11:03 · feat: parameterize fused training random seed
- d9435489 · 08-08 11:03 · fix: hold out split constant across seed runs
- 9a7995c4 · 08-08 11:08 · docs: record geometry conditioned multi seed results
- 5e30681e · 08-08 11:11 · docs: audit efficiency feature information
- 8489b3fc · 08-08 11:13 · feat: add geometry representation ablations
- 058177b9 · 08-08 19:25 · 1
- 8eceb635 · 08-08 19:26 · Merge branch 'arena/019fe072-turbine-blade-ai-platform' of https://github.com/sunccchengze/turbine-blade-ai-platform into arena/019fe072-turbine-blade-ai-platform
- 8770c78e · 08-08 15:33 · docs: record stats only representation result
- b5d4eed5 · 08-08 15:33 · docs: correct stats only ablation deltas
- 342135ba · 08-08 15:50 · docs: complete geometry representation ablation
- 18ee9bd3 · 08-08 15:51 · feat: separate point cloud sampling seed
- 2cd5ef92 · 08-08 15:56 · docs: isolate point cloud sampling instability
- 0c3a4bd4 · 08-08 15:57 · feat: add point cloud normalization ablation
- 053bc793 · 08-08 16:06 · docs: record point cloud normalization ablation
- d219c345 · 08-08 16:08 · docs: record point cloud learning rate diagnostic
- ed5ad586 · 08-08 16:12 · docs: complete point cloud learning rate ablation
- d383056d · 08-08 16:15 · docs: record field loss weight diagnostic
- f1bc7d99 · 08-08 16:28 · docs: map scalar field loss tradeoff
- 01435302 · 08-08 16:31 · docs: close point cloud loss weight ablation
- f56b4b81 · 08-08 16:37 · docs: add DeepTutor skill and beginner project guide
- 7a8a0a1e · 08-08 17:00 · docs: archive learner context and DeepTutor study path
- 3c3c19f9 · 08-09 00:52 · feat: add Rotor37 geometry feasibility audit
- 373a7f57 · 08-09 00:56 · feat: load Huashu design skill and record geometry gate
- 186ef5e0 · 08-09 00:58 · feat: prototype point cloud surface topology
- 3c8c8c8e · 08-09 01:01 · docs: record topology prototype gate failure
- 346cf22f · 08-09 01:04 · feat: add Open3D surface reconstruction prototypes
- 6363cfa9 · 08-09 01:23 · feat: expand design skill library and record Open3D gate
- a0aa2639 · 08-09 01:25 · feat: add surface candidate fidelity audit
- 0f3568af · 08-09 01:33 · feat: load gstack and complete surface fidelity gate
- 0264d5ba · 08-09 01:44 · feat: audit reconstructed mesh boundary semantics
- 59ef1b2d · 08-09 01:48 · docs: enforce sync first and classify BPA boundaries
- cba44827 · 08-09 01:49 · feat: trace original Rotor37 mesh topology
- 93f3be9a · 08-09 02:03 · feat: export original Rotor37 surface topology to SU2
- 4bb595cf · 08-09 02:05 · feat: audit original SU2 surface topology
- 7aad17a5 · 08-09 02:09 · docs: pass original surface topology gate
- 1c5a74a5 · 08-09 02:11 · docs: establish original mesh is surface-only
- dd25aa0f · 08-09 02:13 · docs: identify SU2 Foundation Rotor37 mesh path
- 889f4073 · 08-09 02:34 · feat: audit external Rotor37 SU2 cases
- 077dc54f · 08-09 02:40 · fix: audit SU2 mesh config consistency
- 65f3aa04 · 08-09 02:43 · fix: parse all SU2 marker references
- 5d37a812 · 08-09 02:45 · fix: retain all SU2 boundary declarations
- 0b76463e · 08-09 02:55 · feat: report external mesh coordinate extent
- a9fcdd88 · 08-09 02:59 · feat: prepare safe Rotor37 coarse working cfg
- 11e589d6 · 08-09 03:03 · feat: prepare bounded SU2 smoke case
- 5a07ef25 · 08-09 03:09 · fix: disable restart for SU2 smoke case
- 2452e9aa · 08-09 03:12 · docs: record first SU2 RANS divergence
- c724fec6 · 08-09 03:16 · docs: record successful SU2 smoke run
- aa825949 · 08-09 03:21 · docs: record 500 iteration SU2 nonconvergence
- ecff0811 · 08-09 03:23 · feat: audit SU2 marker geometry axis
- 23562c38 · 08-09 03:25 · docs: confirm Rotor37 axial direction
- c686b60c · 08-09 03:28 · docs: record Rotor37 inlet profile semantics
- 4bcb9fc6 · 08-09 03:32 · feat: add fixed CFL SU2 stability diagnostic
- c1f49a72 · 08-09 03:36 · feat: add bounded CFL SU2 diagnostic
- 2918c5b5 · 08-09 03:41 · feat: parameterize bounded CFL limits
- 8dc894ae · 08-09 03:46 · docs: record bounded CFL max ten result
- 4e446cf9 · 08-09 05:31 · docs: record bounded CFL twenty result
- 2077f57d · 08-09 05:39 · docs: record SU2 thousand iteration plateau
- 1b140da0 · 08-09 05:44 · feat: prepare SU2 partial state continuation
- ef696567 · 08-09 05:47 · fix: use SU2 v8 restart filename option
- 4566273d · 08-09 05:55 · docs: record failed SU2 restart continuation
- 7c276834 · 08-09 06:04 · fix: bound CFL during SU2 restart
- f09c147f · 08-09 06:21 · docs: stop unstable SU2 restart path
- 4d7fb085 · 08-09 06:23 · feat: isolate SU2 run artifacts with manifest
- d882b9cd · 08-09 06:39 · docs: confirm isolated SU2 baseline reproducibility
- 87de4d2e · 08-09 06:41 · feat: audit turbomachinery performance config
- 97aaf2fe · 08-09 06:45 · docs: confirm turbomachinery performance config
- ca6b8244 · 08-09 06:49 · fix: add turbomachinery analysis marker to working cfg
- cd81e1f0 · 08-09 07:02 · fix: preserve turbomachinery analysis marker in derived cfg
- 39011ca1 · 08-09 07:25 · docs: pass turbomachinery analysis marker gate
- eaff75f6 · 08-09 07:52 · docs: record clean analyze case plateau
- a74bb948 · 08-09 08:17 · feat: parse SU2 stage performance history
- 77a97750 · 08-09 08:20 · docs: record nonconverged stage performance trend
- 94dcb4ad · 08-09 08:43 · docs: consolidate P4 RANS evidence
- de959d42 · 08-09 08:59 · fix: import regex in SU2 working cfg preparation
- cb4d7b94 · 08-09 09:14 · docs: pass fine Rotor37 mesh audit gate
- 0e5781bf · 08-09 09:35 · docs: record fine mesh resource boundary
- ce9b6a25 · 08-09 09:36 · docs: freeze local CFD scope
- f28b2e64 · 08-09 09:38 · feat: clarify surrogate and RANS evidence status
- ad12c95b · 08-09 09:38 · chore: allow hosted Vite preview origin
- 4701b93c · 08-09 09:42 · docs: align public claims with CFD evidence
- 92950995 · 08-09 09:42 · docs: update presentation for current CFD status
- 61ce685e · 08-09 09:59 · docs: add D42 stage delivery acceptance
- 2570e3f1 · 08-09 10:06 · feat: move public inference to frontend
- eb237e95 · 08-09 10:06 · docs: track frontend-only acceptance
- 5a2c2ff1 · 08-09 10:10 · design: propose three frontend redesign directions
- 6cd37c7c · 08-09 10:17 · feat: redesign platform around local control room
- 31475b9f · 08-09 10:20 · feat: add persistent light mode
- b13afa8e · 08-09 10:20 · fix: tune Plotly contrast for light theme
- 1cbfd4e8 · 08-09 10:28 · docs: capture design brief and reference constraints
- 063e2768 · 08-09 10:31 · feat: rebuild explorer as research workspace
- e82420d5 · 08-09 10:34 · copy: make redesigned surfaces Chinese-first
- f21d55bd · 08-09 10:39 · copy: refine Chinese hero typography
- 7968effc · 08-09 10:44 · copy: use Chinese-first hero headlines
- 3a9995b3 · 08-09 10:45 · copy: make homepage hero English-first
- 728b55f1 · 08-09 11:00 · fix: use Pages-compatible ONNX wasm bundle
- dbebde6e · 08-09 11:04 · copy: tighten homepage hero headline
- 04cefb7f · 08-09 11:06 · feat: refresh remaining page surfaces and hero
- c7ab08e1 · 08-09 11:07 · feat: rebuild predict as local inference workspace
- 25c2b26c · 08-09 11:11 · fix: close homepage hero subtitle gap
- e554dc12 · 08-09 11:13 · fix: align blade viewer with platform palette
- ad390f12 · 08-09 11:20 · feat: unify every page with research product system
- f47b2686 · 08-09 11:42 · fix: complete light theme surface contrast
## 家族B · D43–44：三页重设计、videos/、GHG 内阁复审、.learnings 建档、HANDOFF v8
- 5e104518 · 08-10 09:34 · feat: synchronize all advanced skills from wind_farm_viz into turbine blade platform
- 5dafa147 · 08-10 09:43 · fix: resolve 4 internal contradictions across branch names, asset sync, UQ labeling and CFD evidence
- 3ffea6fa · 08-10 09:57 · feat(homepage): complete redesign with Linear x Vercel x Swiss Grid scientific aesthetic
- e17605a3 · 08-10 10:02 · fix(homepage): remove emojis, eliminate scanline noise, and adopt bilingual telemetry header
- 8d2ed13d · 08-10 10:20 · fix(homepage): center evidence table, align 4 metric cards baseline, refine rectangular badge spacing
- e7994fb8 · 08-10 10:21 · style(typography): adopt DengXian font stack for Chinese prose and embolden headline subtitle
- 65e4c43c · 08-10 10:26 · feat(background): implement interactive aerodynamic probe background with LERP follower, CFD node illumination and shockwave ripples
- 212e4755 · 08-10 10:30 · style: perfect left alignment, borderless monospace tokens, and silky smooth light/dark fade transition
- 4bca87f7 · 08-10 10:33 · fix(theme): remove brittle CSS wildcard overrides and ensure perfect high-contrast primary button visibility in light mode
- 49e74e1b · 08-10 10:36 · feat(predict): complete redesign of Predict workspace with 44px solid buttons, aero-inflow controls, and instant WASM telemetry
- f60c58a4 · 08-10 10:39 · style(homepage): expand button horizontal breathing room with generous padding and single icon layout
- 68b4fdc6 · 08-10 10:41 · feat(explore): redesign Explore workspace with 2D parametric sweep, high-contrast toggle knob and aligned readout cards
- 25d71704 · 08-10 10:50 · style(explore): remove redundant star scatter legend and restore pure 2D heatmap flow aesthetics
- e76c5d4b · 08-10 10:54 · style(explore): replace star with precision aerospace reticle marker for Rotor 37 baseline without top legend overlay
- 5e0a50e5 · 08-10 10:59 · feat(optimize): implement global ambient aerodynamic background and redesign Optimize workspace with 3D Pareto scatter, evolution timeline, and blade twin linking
- 3143c5e5 · 08-10 11:06 · style(optimize): faint gridlines, borderless scatter dots, gold baseline diamond, and perfect bottom alignment across explore/optimize
- 2bd36ef5 · 08-10 11:09 · feat(optimize): fully activate NSGA-II evolution playback engine with dynamic scatter plot migration and real-time generation metrics
- 0c881481 · 08-10 11:10 · feat(uq): redesign UQ workspace with 3-channel held-out test evaluation, confidence ribbons, physical sensitivity analysis, and conformal calibration roadmap
- fe54f08d · 08-10 11:11 · fix(explore): lock left control panel and right readout cards into 100% equal-height stretch for absolute bottom alignment
- 56a3791c · 08-10 11:13 · fix(explore): adopt 2-row structural grid symmetry for absolute mathematical bottom baseline alignment
- cd5b6008 · 08-10 11:36 · feat(campaign-1): complete grand finale redesign of Generate, Methodology, and About pages with D43 Swiss Grid, DengXian typography and verifiable rigor
- 92948025 · 08-10 12:23 · style: apply 3-channel blue/gold/orange distinct palettes to UQ charts, and enforce spacious 36px button padding to eliminate edge crowding permanently
- 7a5b2ac4 · 08-10 13:13 · style(generate): add active state highlight, green dot, and [ SELECTED ] badge to preset profile buttons
- e214e5b6 · 08-10 13:15 · fix(api): use robust onnxruntime-web import with full WASM JSEP execution bundle
- e1fdf65e · 08-10 13:18 · fix(build): use onnxruntime-web/wasm bundle (13.4 MB) to strictly comply with Cloudflare Pages 25 MiB file size limit
- 6aaeee85 · 08-10 13:42 · style(uq): remove redundant color name labels from top telemetry bar
- 4ec9256b · 08-10 13:44 · docs: add 5-expert independent review reports and cabinet synthesis (Tufte, Munger, Karpathy, von Karman, Garry Tan)
- 260551d4 · 08-10 13:54 · feat(refinement): implement Munger, Karpathy, von Karman and Garry Tan approved findings with thermodynamic equations, choking bounds, and WASM self-healing
- 42d4cb73 · 08-10 13:55 · docs: add Round 2 expert review reports from Albert Betz, Steve Brunton, and Bojie Li with synthesis report
- 8b8adbbb · 08-10 14:03 · feat(round-2): implement all 6 approved expert items (Euler work, fine contours, heteroscedasticity, cosine similarity, 3D lighting, and idle prewarming)
- 9400c7b2 · 08-10 14:05 · feat: distill 3 new world-class masters via Nuwa (da Vinci, Antony Jameson, David Goldberg) and generate Round 3 review reports
- e53d6d2d · 08-10 14:16 · feat(round-3): implement da Vinci spanwise slices, Jameson wave drag analysis, Goldberg hypervolume metrics, and SVG airfoil geometric decomposition
- f3f2b396 · 08-10 14:17 · docs: complete final re-inspection and unanimous verdict from all 8 expert masters (score: 98.2/100)
- 8cc1daee · 08-10 14:34 · fix: restore solid 3D blade mesh without floating wire artifacts, vertically center methodology/about card numbering and icons, and restore discrete modular grid heatmap
- 7011f244 · 08-10 14:38 · fix(viewer3d): separate stats and rotation hint into flex row to completely prevent text collision in Optimize 3D card
- 9e715f96 · 08-10 15:43 · docs: add comprehensive 40-minute master presentation script and teleprompter for Guo Zhendong reporting
- d44aa1a8 · 08-10 16:01 · docs: finalize 40-minute master presentation script with physical insight into shock wave drag, Zhouzhi volunteer teaching, and 4-gen AI evolution
- 05749139 · 08-10 16:19 · docs: refine presentation script with realistic PyTorch-to-ONNX WASM migration story and correct Suzhou award to 3rd prize
- b3ed88cf · 08-10 16:23 · docs: enrich Third Act with authentic SnapDeploy 60-90s cold start struggle and WASM edge liberation narrative
- 0a6bfd45 · 08-10 16:28 · docs: add heartfelt, humble, and determined closing statement to Guo Zhendong presentation script
- 7ce5df47 · 08-11 00:47 · 御风记14
- 7247efbf · 08-10 16:50 · docs: enrich supporting portfolio links for Zhouzhi teaching, wind farm viz, and YZAXS recruitment site
- b0496b2c · 08-11 02:12 · feat(ocr): 装载阿里巴巴开源 Open Code Review 工业级规则库 (.opencodereview/rule.json)
- f785e901 · 08-11 02:34 · fix(theme): 强制默认深色模式 (darkmode) 并清除旧版本 localStorage light 残留
- 45ca5204 · 08-11 14:10 · docs: 建立从本科到博士5阶段《学习路.md》、更新HANDOFF.md至v7并完善.learnings记忆系统
- cc2522bd · 08-11 14:11 · docs: 升级 HANDOFF.md 至 v7 (Deep Tutor 专属长期教学与全栈记忆归档)
- e523144a · 08-11 14:59 · feat(skills): 全量装载 Understand-Anything、Nature-Skills、Scientific-Agent-Skills 等 19 大前沿顶级开源技能库
- 96909523 · 08-11 15:19 · feat(skills): 全量装载 17 大顶尖开源技能库（含 Understand-Anything/scientific-skills/deepsec/galaxy等）并升级SKILL运用指南
- 736985ce · 08-11 15:20 · chore(skills): 清理合并冲突临时文件
- 9de1437c · 08-12 15:05 · feat(video): 全自动化生成并交付《御风记》第11讲科普视频 (videos/御风记_第11讲_温度与材料极限_为什么航发这么难造.mp4)
- 9be0d939 · 08-12 15:49 · feat(video): 重构影视级《御风记》第11讲视频（AI原画底图+真人配音+同步字幕+发丝线瑞士网格）
- 3a551cfa · 08-12 15:59 · feat(video): 像素级优化《御风记》第11讲视觉设计（瑞士网格+字符全量修复+双栏等高对齐）
- eacef427 · 08-12 16:20 · docs: 完美终结当前会话，升级 HANDOFF.md 至 v8 终极版并全量对齐所有记忆与资产
## 家族B · Day 44：教材 12 章、宪章、evidence 冻结、About 重排、郭老师线
- 1a4817e5 · 08-12 16:25 · docs: 将 Session 019ff6c7 对齐到 019feb03 终极底座，并改写推送铁律
- 8f2457f9 · 08-13 02:35 · docs: 将郭老师 40 分钟录屏改为约 2000 字暑期简报
- 725f8901 · 08-13 02:44 · docs: 按承泽口吻重写致郭老师暑期简报第 2 稿
- 4893eb81 · 08-13 02:58 · docs: 按 2026-08-13 文献给出 AI-MDO 发文门槛与前沿对照
- 932d0012 · 08-13 03:23 · feat(skills): 从 -SKILL-@019ff854 装载科研层，并按郭老师路线改写信稿
- ef21e4a3 · 08-13 03:37 · docs: 写 About 页 D44 重构方案，按课题史与郭老师线重排信息
- b423f7c1 · 08-13 07:05 · feat(about): 按学长复审重写 About，对外名称改为气动筛选站
- 78cbe93e · 08-13 07:12 · docs: 学长抬高目标入宪，冻结 evidence/ 单一事实源
- b6738178 · 08-13 07:16 · docs: 记录 teach-back 首轮——Q1-Q4 不会，Q5 已触及 MDO 边界
- caca194b · 08-13 07:26 · docs: 记入 Q1 口述并纠正 std/九通道/背压
- 4f99c317 · 08-13 07:40 · docs: 补记 Q1 第二轮与 Q2 初答，纠正 R² 未覆盖 Pareto 边
- 36826fb2 · 08-13 07:55 · docs: 纠正偏度不是发回各点、Pareto 不是三头皆甜、喉部在叶道最窄处
- bc6a1527 · 08-13 07:57 · docs: 记入 Q3 口述——0.9173 是数不是叶子
- 74679c30 · 08-13 08:09 · docs: 记入 Q4 初答并拆开保形预测在补什么
- 89bec378 · 08-13 08:42 · docs: Q4 改成零基础词——MC/带子/覆盖率/附面层
- 5b554981 · 08-13 09:01 · docs: lock 深入浅出讲课术 as skill and reteach Q4
- 410235af · 08-13 09:58 · docs: Guo letter v4 send kit and textbook plan
- 0cab555b · 08-13 10:13 · docs: Guo letter v4 ending restored; 12-unit textbook complete
- cbad272a · 08-13 10:26 · docs: textbook items now 2:2:6 MC / fill / short-answer
- 92978b01 · 08-13 18:50 · Create U01网页.zip
- 198ebc0f · 08-13 18:59 · Create 期末A.zip
- 26a4403b · 08-13 11:11 · feat: local HTML study site with corrected answers
- d1cc8f67 · 08-13 13:49 · fix: render study-site math instead of leaking raw \( \) TeX
- ef7f2e4a · 08-13 15:37 · rewrite: reorder textbook machine-first, define every noun
- 234e970e · 08-14 03:49 · docs: session wrap-up — mistakes, A3 handoff, do-not-repeat
- a5624f76 · 08-14 03:52 · teach: thicken U02–U05 to six-layer standard
- 19a881ef · 08-14 03:55 · teach: finish six-layer thickening for U06–U12
- b5d93614 · 08-14 03:56 · docs: changelog A4 — all 12 units thickened
## 家族B · A5/A6/A7：教材零搜索重塑与全量去 LaTeX
- 1e6caddf · 08-14 14:26 · A5: textbook zero-search reshape — U01 exemplar rewritten with definition-closure chains
- 8f55d7b8 · 08-15 00:51 · A5 complete: U02-U12 zero-search reshape — dependency chains, four-piece glossaries, worked examples; questions and answer key untouched
- 80731cf8 · 08-15 01:18 · A6: chat formulas in plain text, no raw LaTeX — changelog + SKILL §10 + learnings
- e0fbf8ac · 08-15 03:07 · docs: archive DeepSearch 2026-08-14 frontier & Guo/Song team research notes (E0 leads, numbers unverified)
- a8d0fe1a · 08-15 14:31 · A7: plain Unicode math across textbook — zero LaTeX in all reader-facing files; web rebuilt
## 会话 01a061af · 2026-09-02：纪律回补、分支收敛、叙事并入
- 3eb11165 · 09-02 11:16 · docs: 回补 v8 重写丢失的会话纪律 + 快进推送手册（附 11 分支收敛审计）
- 33b61f14 · 09-02 11:17 · docs: 回填 FF 推送实测结果 + 本会话收工交接
- a89d4f3b · 09-02 11:29 · docs: 并入 019fb8ff 的叙事（1 笔，内容已在主线）
- 236c4db6 · 09-02 11:29 · docs: 并入 019fc539 的 D40 叙事（12 笔，内容已在主线）

---

## 怎么自己重新生成 / 深挖

```bash
git fetch origin
git log --oneline --graph --all --date=short --pretty='%h %ad %s' | less      # 全图
git log --oneline 9cdeb370 | head -25                                          # Day 40 那一段
git show 9cdeb370                                                               # 某笔完整 diff
git log --since=2026-07-30 --until=2026-08-04 --pretty='%h %ad %s' --date=short # 按日期切片
```

- 本表在 shallow clone 下生成，`main` 被网页上传压平的那一段（PR #5 / #7 的合并细节）本地不可见，
  在承泽本地仓库或 GitHub 的 `/commits` 页面可看全。
- 每个会话「当时的状态与思考」另见：`docs/SESSION_HANDOFF-*.md`、`docs/day39-battle-report.md`、
  `docs/devlog/README.md`、`docs/D23-walkthrough-v1.md`。
