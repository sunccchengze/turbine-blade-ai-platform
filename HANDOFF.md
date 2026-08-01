# HANDOFF.md —— 会话交接总文档（涡轮叶片 AI 平台）

> **写给下一会话的 AI agent（和孙承泽本人）**：读完本文件，你应该能 100% 接手本项目，不丢任何上下文、不重复劳动、不踩已知的坑。
>
> **最后更新**：2026-08-01（Day 38 交接准备完成）· **v6**
> **维护规则**：每次会话结束前，由当时的 AI agent 更新本文件的「当前状态快照」和「悬而未决清单」。
>
> ⚠️ v6 更正：本文件**实际已被 git 跟踪**（header 旧说法已过时），克隆仓库即含本文件；但内容含内部信息，如不想让评审看到可考虑后续移除跟踪（`git rm --cached HANDOFF.md` + 加 .gitignore）。
>
> ⚠️ 本文件含内部作战信息，已在 `.gitignore` 中屏蔽，**不要提交、不要推到 GitHub**。

---

## ‼️ 0.-1 五条铁律（前几代 AI 都栽过，看完再动手）

1. **推送优先于一切。** 每完成一个可交付单元，立刻 `commit` + `push`。**绝不攒提交**。未推送的提交 = 不存在的提交（af73fdc 教训）。
2. **绝不主动合并 PR。** 🩸 Arena 会在 PR 合并/关闭后**立刻关闭本会话的远程通道**，之后所有 push / gh 全失败。
   → 合并 PR 只能是会话的最后一个动作，或留给承泽在 GitHub 网页点。要继续干活就让 PR 开着。
3. **推不上去时，立刻导 patch 存档，然后如实上报。** 不要静默跳过、不要假装成功。
4. **引用任何数字前先自己复现，不许照抄。** 🩸 Day 19 抓到 R² 错的；Day 22 又抓到 NSGA-II 数字是旧环境产物。宋老师是 MDO 教授，「训练集还是测试集」「怎么复现」是最基本一问。**答不出口径，比数字低一点致命得多。**
5. **遇到权限 / 网络 / 环境问题，直接说，不要绕过去假装完成。** 沙盒有网络白名单（§10 #10）；GitHub App 无 `workflows` 权限（§10 #15）。

---

## ★ 0.0 给承泽：把记忆带进新会话（3 步）

1. **保存本文件**：下载/复制 `HANDOFF.md`（连同更新内容一起）。
2. **新会话第一步**：在 Arena 开新会话，连接仓库 `sunccchengze/turbine-blade-ai-platform`，上传/粘贴 `HANDOFF.md`。
3. **新会话第二步**：发送「§12 开场白模板」（本会话任务 = 脱胎换骨升级冲刺 + 设计优化课题）。提示：PR #4 已由承泽合并（HEAD=70f5e6c），无需再保 PR；新会话分支名以系统提示为准。

> ⚠️ 附件可能不落盘（真实发生过）。AI 说找不到 HANDOFF.md → 直接把全文粘贴进对话框。

---

## 0. 开场必做清单（前 10 分钟）

```bash
cd /home/user/turbine-blade-ai-platform
git fetch origin
git log --oneline -8
git status
git rev-parse --is-shallow-repository   # true 则 git fetch --unshallow origin
git ls-remote origin >/dev/null 2>&1 && echo "REMOTE OK" || echo "REMOTE BLOCKED"
```

- UTF-8 体检（§0 原脚本，8 个文件）：每次会话开始必跑（沙盒曾损坏中文文件）。
- 前端依赖：`cd frontend && npm install --no-audit --no-fund && cd ..`（node_modules 不跨会话持久）。

### 0.1 Day 19 恢复 ✅ 已解决（勿再操作）

Day 19 提交 `43b461d` 曾未推送（旧会话在 PR #3 合并后被关闭）。本会话已用承泽粘贴的
`D19_RECOVERY.md`（README 全文 + 3 个代码文件改动）重建为 `1839aa5`，4 项验证全过并推送。
patch 备份方式失效（`handoff/` 不随 clone 过来）→ 若再遇「提交未推送丢失」，让承泽像 D19 一样
直接粘贴恢复指令 + README 全文（README 全文在仓库 `README.md` 的 git 历史里有，可用 `git show 1839aa5^:README.md` 前的版本对照）。

### 0.2 合并后的连锁检查

- 前端改动 → Cloudflare Pages（跟 main / 分支预览）自动部署。
- 后端改动 → 合入 main 后**必须 SnapDeploy 手动 Redeploy**（改 `requirements.txt` 必须重建镜像）。
- **本 PR 有后端改动**（`optimize.py` + 2 个 CSV）→ 合入后必须 Redeploy，否则线上 `/optimize` 演化动画显示占位、3D 联动回退默认叶型。

---

## 1. 项目全景（30 秒版）

| 项 | 内容 |
|---|---|
| 项目名 | **AI 赋能的叶轮机械多学科设计优化平台**（全站统一） |
| 作者 | 孙承泽（本科二年级，独立完成） |
| 故事线 | KIT 2026.02 无压气机燃气轮机 303 秒（破 NASA 250 秒）→ 叶片优化命题被改写 → 暑假自主立项 |
| 技术载体 | NASA Rotor 37 **压气机**（PLAID 数据集，1,000 组 CFD 样本，74 维特征） |
| 模型 | PyTorch 残差代理网络 + 物理约束；ONNX 2.11 MB、523,011 参数、0.13–0.37 ms/次 |
| 平台 | FastAPI（ONNX）+ React + Three.js + Plotly；实时预测 / 探索器 / NSGA-II / MC Dropout UQ / 3D |
| 宣称加速比 | ~100,000×（保守；端到端量级 ~10⁶） |
| 当前位置 | **D19–D24、D27、D28、D30(前两件)、D31、D32、D34/36/37 文档 已完成并推送（PR #4 开启）** |

**叙事分层**：叶轮机械 Turbomachinery 是上位概念；KIT（涡轮）是引子；载体明说是压气机 Rotor 37。

---

## 2. 人：用户与评审团

- 承泽：本科大二，Windows 11 + Anaconda，全中文沟通，结构清晰，鼓励式，每个改动讲透「做什么/为什么」。
- 双模式协作：AI = 导师讲解 + 直接改代码提交；承泽本地/线上验收后反馈。
- 已授权 AI 拍板：Q17/Q18/Q22/Q26/Q27/Q28。审美分歧 Q29 → **双方案对比预览再定（未决）**。
- 评审：宋立明教授、郭振东老师 + 院士/教授 + 学长学姐；**发链接自助访问**；无硬 deadline；宋老师会翻 GitHub。
- 需「无人值守可信度」：冷启动横幅、错误兜底、物理越界保护都稳。**他会自己线上验收，效率很高，别让他等。**

---

## 3. 当前状态快照（2026-07-31 · Day 37 文档预演）

### 3.1 Git 状态

```
工作区: /home/user/turbine-blade-ai-platform
分支:   arena/019fb778-turbine-blade-ai-platform（本会话分支，PR #4 已开）
71b6c56  ← HEAD：docs 修正（预热模板说明）等，共 10 个提交在 PR #4
3b4ba54  ← Day 30: preheat 模板 + 启动脚本
2d92da5  ← devlog D34/36/37
f9e1556  ← Day 34/36 验收清单
ce4b37b  ← Day 37 汇报一页纸 + Q&A 20 问
3c368d6  ← Day 32 文档
4c1c8c5  ← Day 32 术语/单位表
718dd76  ← Day 32 单位修正（Ω rad/s）
fb25138  ← Day 31 压力测试问答稿
1efb5ea  ← Day 28 移动端布局修复
05e9a5c  ← 走查表 v1.1
bf151fa  ← Day 23 Tooltip + 走查表
df6abf2  ← Day 24 方法论页
06c1d0f  ← Day 27 精度验证区块
f6f196a  ← Day 24 文档
9db2953  ← devlog D20-22
5d768f8  ← Day 22 演化动画 + 数据统一
b829618  ← Day 21 Pareto→3D
ca61c0f  ← Day 20 About + devlog
1839aa5  ← Day 19（重建 43b461d）
16821b4  ← origin/main（PR #3 合并）
```

- ✅ **PR #4 已合并**（HEAD=70f5e6c，即 main 最新）。本会话分支 `arena/019fb861-turbine-blade-ai-platform` 从该提交分出；新会话分支以系统提示为准，勿自创。
  ⚠️ PR #4 含后端改动（`optimize.py` + 2 个 CSV）→ 承泽需在 SnapDeploy **手动 Redeploy**，否则线上 /optimize 演化动画显示占位、3D 联动回退默认叶型。
- 仓库为 **shallow（depth=1）** → 新会话先 `git fetch --unshallow origin` 再回溯 devlog。

### 3.2 线上部署拓扑

| 层 | 平台 | 地址 | 部署方式 |
|---|---|---|---|
| 前端 | Cloudflare Pages | https://turbine-blade-ai-scz.pages.dev | 随 main 自动部署；**分支预览**：`https://arena-019fb778-turbine-blade.turbine-blade-ai-scz.pages.dev`（PR #4 最新代码，承泽已用它验收 ✅） |
| 后端 | SnapDeploy 容器 | https://turbine-blade-api-c4f40.containers.snapdeploy.app | **合入 main 后需手动 Redeploy**（本 PR 改了 optimize.py + CSV） |

- 线上 `/sweep` 已确认可用（Day 19 承泽双端验证）。
- 🚫 AI 沙盒够不着 `*.pages.dev` / `*.snapdeploy.app`（TLS 白名单）→ 线上验证全交承泽。

### 3.3 已完成（本会话冲刺 D19–D37 部分）

- **D19** `1839aa5`：README 双语重制 + R² 口径修正（测试集 0.9844/0.9561/0.9827，附复现脚本；API 加 `r2_evaluated_on`）。
- **D20** `ca61c0f`：About 页（署名孙承泽·本科二年级·独立完成）+ devlog（Day 1–19）。
- **D21** `b829618`：Pareto→3D 联动（`/pareto` 每条解带 `geometry`；点选渲染叶型）。
- **D22** `5d768f8`：NSGA-II 演化动画（`/pareto-evolution` 21 帧）+ **数据流水线统一**（`backend/scripts/generate_pareto_evolution.py` 一键复现）。
- **D23** `bf151fa`：功能冻结 + 走查表 v1（PredictPage 6 参数 Tooltip）。
- **D24/27** `df6abf2`/`06c1d0f`：方法论页（六步 + 诚实披露）+ 精度验证图（fig09/fig10 打包进 `frontend/public/figures/`）。
- **D28** `1efb5ea`：移动端布局修复（<900px 单列 ×3 页；导航断点 1024）。
- **D30** `3b4ba54`：预热 workflow **模板**（`docs/preheat-workflow.md`，GitHub App 无 workflows 权限，需承泽网页安装）+ 启动脚本（`scripts/start-local.bat/.sh`）。
- **D31** `fb25138`：`docs/pressure-test-D31.md`（5 大质疑点答法 + R² 故事）。
- **D32** `4c1c8c5`：`docs/terminology.md` 术语/单位表；**修正 Ω=rad/s（原误标 rpm）、坐标=m（原误标 mm）**。
- **D34/36/37**：`docs/final-acceptance-D36.md`（外行试讲 + 终版验收清单）；`docs/report-one-pager-D37.md`（一页纸 + Q&A 20 问）。

**本会话关键实测（可直接引用）**：
- R²（留出测试集 n=100, random_state=42）：π 0.9844 / η 0.9561 / ṁ 0.9827（ONNX 实测，R² 复现脚本输出一致）。
- NSGA-II（seed 42、pymoo 0.6.1、生产 ONNX）：max η **0.9173**（+5.40%）、max ṁ **21.74 kg/s**（+11.42%）、max π 2.1073。
- sweep 625 点 22.0–23.7 ms；越界 422 ✅；单点预测 200 ✅；`/api/optimize/debug-path` 404 ✅。
- 前端 build 445.26 kB / gzip 145.57 kB；lint **16 warnings / 0 errors**（基线，勿扩大）。

### 3.4 🔴 数字口径史（两笔，都要能讲）

1. **R²**（Day 19 修正）：原 0.9861/0.9588/0.9845 不对应任何划分 → 统一为测试集实测 0.9844/0.9561/0.9827。
   口径：留出测试集 n=100、random_state=42、训练未见、ONNX 实测、脚本可复现。
2. **NSGA-II**（Day 22 修正）：原 0.9211/21.64/2.1012 是旧 pymoo 环境产物 → 统一为可复现 0.9173/21.74/2.1073。
   评估器本身逐位一致（R²=1.000000），差异纯来自优化器版本。README/devlog/主图/动画末帧/API 全部同源。
3. **MC Dropout 诚实披露**：95% 名义区间实际覆盖 65–89%（η 最差 65%）—— 低估不确定性，README 已披露，D31 第 3 问会问。

---

## 4. 语言与品牌标准（全站统一）

- **逐句中英双语**：中文在前，英文小一号灰色紧随（模式 A 长段落 / 模式 B 短标签；英文灰 #475569/#64748b）。
- JSX 中 `>` 必须写 `&gt;`。术语保留英文：Surrogate Model、MC Dropout、NSGA-II、ONNX、Pareto、η、π、ṁ、CFD、UQ、MDO、R²。
- 站名：「AI 赋能的叶轮机械多学科设计优化平台」。用「叶轮机械 Turbomachinery」，不说「涡轮叶片平台」。
- 署名：「孙承泽 · 本科二年级 · 独立完成 / Sun Chengze · Undergraduate (Year 2) · Independent Project」。

## 5. 叙事标准（Q10 定稿）

1. 上位概念统一：叶轮机械 Turbomachinery 多学科设计优化。
2. KIT = 行业引子（为什么是现在）：303 秒氢燃料无压气机燃气轮机破 NASA 250 秒，省去压气机（传统 ~50% 输出功用于驱动压气机）→ 瓶颈转移到叶片气动效率。**不要把 KIT 说成本项目对象。**
3. 载体明说：NASA Rotor 37 压气机公开基准；压气机/涡轮同属叶轮机械，方法学互通。
4. 成长线：KIT 启发 → 暑假自主立项 → 独立完成全栈。
5. KIT 事实（已联网核实）：303 秒、氢燃料、pressure-gain combustion 取代机械压气机、破 NASA 250 秒、Daniel Banuti 教授、Hannover Messe 2026.04.20–24。

---

## 6. 悬而未决 / 待用户验证

1. 🔴 **后端 Redeploy（承泽本人操作）**：PR #4 已合并（70f5e6c），SnapDeploy 需手动 Redeploy，否则线上 /optimize 演化动画显示占位。
2. 🔴 **预热 workflow 安装**：承泽按 `docs/preheat-workflow.md` 在 GitHub Actions 页 30 秒安装（AI 无 workflows 权限）。
3. **Q29 审美双方案 A/B 预览**：未做，排 D23 后/下次会话。
4. **D29 移动端真机走查**：代码级已修（D28），真机未走。
5. **D25–26 方法论页打磨**：核心已完成，可加图/精修。
6. **D30 第三件（录屏）**、**D35 演示视频终版**：未做。
7. **D33 文案终稿**、**D34 外行试讲**：清单已备，待执行。

## 7. 作战表（更新至 2026-07-31）

| Day | 任务 | 状态 |
|---|---|---|
| D18–19 | 验收 / README 双语 + R² 修正 | ✅ 完成 |
| D20–24 | About+devlog / Pareto→3D / 演化动画+数据统一 / 冻结+走查 / 方法论页 | ✅ 完成 |
| D25–26 | 方法论页打磨（可加图/精修） | 🔵 核心已完成，可收尾 |
| D27 | 精度验证区块 | ✅ 完成（方法论页内） |
| D28–29 | 移动端适配 | 🔵 代码级完成（D28），真机走查待做 |
| D30 | 备份三件套 | 🔵 前两件完成（模板+脚本），录屏待 D35 |
| D31 | 压力测试日 | ✅ 完成（问答稿） |
| D32–33 | 术语统一表 + 文案终稿 | 🔵 术语表完成（D32），终稿校对待做 |
| D34 | 外行试讲 | 🔵 清单已备，待执行 |
| D35 | 按反馈修 + 演示视频终版 | ⬜ 未做 |
| D36 | 终版验收 | 🔵 清单已备，待执行 |
| D37 | 汇报一页纸 + Q&A 20 问 | ✅ 文档完成 |
| **D38+** | **脱胎换骨升级冲刺（研究型）**：任务书见 §12 | 🔵 待执行 |

> 铁不动摇项已完成（D18/D19/D20/D23）。剩余均为打磨/验收类。

## 8. 技术知识库（接手必懂，摘要）

- 数据 `backend/data/processed/plaid_rotor37_features.csv`（1000×78）；**74 维输入** = Ω + P + 9 组物理量 × 8 统计量；**3 维输出** = `Compression_ratio`(π) / `Efficiency`(η) / `Massflow`(ṁ)（API 真实字段名）。
- 模型：Linear(74→256)+BN+ReLU+Dropout(0.1) → 残差块×3(256) → Linear(256→128) → 残差块×2(128) → Linear(128→3)；523,011 参数；损失 = 加权 MSE([1.0,3.0,1.5]) + λ=0.1 物理惩罚。
- ONNX `backend/models/surrogate_model.onnx` + `scaler_X_v2.pkl/scaler_y_v2.pkl`；**scikit-learn 必须 ==1.7.2**。
- 端点：`/api/predict/`、`/api/predict/sweep`（x/y ≤40 点）、`/api/predict/baseline-features`、`/api/predict/model-info`（含 r2_scores + r2_evaluated_on）、`/api/predict/health`、`/api/optimize/pareto`（含 geometry）、**`/api/optimize/pareto-evolution`**（D22 新增）、`/api/optimize/training-data-stats`、`/api/optimize/uq-results`、`/health`、`/`。`/api/optimize/debug-path` 已删（404 = 新镜像）。
- 前端：五页 + About + Methodology；`App.jsx` 懒加载路由；`utils/api.js`（BASE_URL 线上默认，`.env.local` 本地覆盖）；CORS any-port regex（`backend/app/main.py`）。
- 图素材 `docs/fig01–16`；fig09/fig10 已复制进 `frontend/public/figures/`（随站打包）。
- `docs/`：devlog/、D23-walkthrough-v1.md、pressure-test-D31.md、terminology.md、final-acceptance-D36.md、report-one-pager-D37.md、preheat-workflow.md。
- `docs/knowledge-boost-2026-07.md`（Day 38 新增）：2026 上半年国际前沿（KIT 303s / CFM RISE PDR / CJ-1000A / AEP100 / 空客×MTU / RDE / scramjet 等）+ AI×叶轮机械文献弹药库（5 篇代理优化真实工作）+ 数字锚表 + 自测题。**升级冲刺的主要素材库。**
- `docs/upgrade-blueprint-D38.md`（Day 38 新增）：**升级作战总纲**（P1 场级代理 / P2 校准UQ / P3 扩散生成 / P4 SU2 闭环 / E5 LLM 助手；技术选型、引用、里程碑、数字口径、验收清单）。升级会话先读它。
- `docs/plan-30day-D38.md`（Day 38 新增）：**30 天逐日计划（AI 内阁评审定稿版）**：Day 1–30 每天任务、Phase Gate、降级路径、验收清单。本会话执行基线。
- `backend/scripts/generate_pareto_evolution.py`：一键复现 NSGA-II（3 秒）→ 生成 pareto_evolution.csv + 覆盖 pareto_front_solutions.csv（同源）。
- `backend/scripts/build_pointcloud_dataset.py`（Day 38/39 新增）：**P1 点云管线**——PLAID 原始 pickle → 表面点云（CGNS 树提取坐标+场量）→ FPS 下采样 2048 点 → 去质心+缩放归一 → 存 `data/processed/pointcloud/rotor37_pc.npz`（与特征 CSV 同 sample_id 对齐）。**需能访问 Hugging Face（云 GPU 跑）**；`--smoke` 合成数据自检已过。

### 12.1b 算力通路（2026-08-01 承泽实况确认）

- 承泽本机：**Intel UHD Graphics 核显（4GB 共享显存）——对 DL 训练基本不可用**；CPU 5 核、RAM ≥8G → 只做轻量 CPU 活（基线复现、脚本、前端）。
- 沙盒：无 GPU；**TLS 白名单连不上 huggingface.co（curl -sI 返回 0 是假阳性，GET 实际 000）** → 原始点云数据与重型训练必须走云 GPU。
- **训练通路 = 云 GPU**：Colab 免费（T4 12GB）或 Kaggle（P100 30h/周）跑 `build_pointcloud_dataset.py` + P1/P3 训练；AutoDL 按需租卡作后备。数据集 .npz（~100–300MB）生成后放 `data/processed/pointcloud/`（已 gitignore），跨会话由脚本+命令记录保证可复现。

## 9. 沙盒坑与教训（血泪汇总）

1. `node_modules` 不跨会话持久；重要产物别只放 `dist/build/cache/__pycache__/.venv` 等被排除目录。
2. `pkill -f "uvicorn app.main"` 会匹配自身 shell；用 `pkill -f "uvicorn ap[p].main"`，且别和启动命令同一次调用。
3. **uvicorn 残留进程坑**：kill 父进程后子进程可能还占 8000 端口，新起服务失败还「看起来正常」（Day 21 实测：旧进程返回旧代码）。每次验证前 `ps aux | grep uvicorn` 清干净，验证后 `ss -tln | grep 8000` 确认释放。
4. UTF-8 损坏史：HomePage.jsx 曾 `arginTop` 等；每会话跑 §0 体检。
5. uvicorn 后台常驻会让 bash 显示超时，属正常。
6. 🩸 未推送的提交 = 不存在的提交（af73fdc）。
7. 会话权限不确定：开工先 `git ls-remote` 探一次。
8. GitHub 身份：`git config user.name "Arena Agent"` / `user.email "arena-agent@arena.ai"`（clone 会带成 sunccchengze，先改再提交）。
9. 聊天贴 patch 会被改坏（空白/HTML 实体）→ 用「整篇覆盖 + 模糊匹配脚本」恢复，别依赖 git apply。
10. 沙盒出口白名单：GitHub/PyPI/npm 通；`*.pages.dev`、`*.snapdeploy.app`、example.com 全 TLS 失败。AI 验不了线上。
11. 附件上传可能不落盘 → 让承泽直接粘贴内容。
12. 🩸 PR 一合并，会话远程通道即关（Day 19 栽过）。铁律 2。
13. 推送前常先撞一次 gnutls TLS 报错，看着像抖动，其实是会话将关闭的前兆；别机械重试超 2–3 次。
14. 🩸 别照抄历史数字（R² 与 NSGA-II 两笔都是）。口径必须写清。
15. 🩸 **GitHub App 无 `workflows` 权限**：推送含 `.github/workflows/*.yml` 的提交会被 GitHub 拒绝
    （`refusing to allow a GitHub App to create or update workflow ... without workflows permission`）。
    → workflow 类交付做成 `docs/*.md` 模板让承泽网页安装，别硬推。
16. **作用域坑**：在子组件里用主组件 state 会 lint 报「declared but never used」+ 运行时 ReferenceError
    （Day 28 UQPage 实测）。改前确认变量作用域；状态留主组件、prop 传子组件。
17. 🩸 **沙盒 TLS 白名单连不上 huggingface.co**（Day 38 实测）：`curl -sI https://huggingface.co` 返回 exit 0 是**假阳性**，实际 GET 全部 000（TLS EOF）。测连通性用 GET 带 -o /dev/null -w "%{http_code}"，别信 HEAD。原始数据/重型训练走云 GPU。

## 10. 承泽本地环境（Windows）

- 路径 `C:\Users\45120\turbine_blade_ai_project`（实际为 `turbine_blade_ai_platform`，main 分支），记得 `git pull` / `git fetch` 后切 PR 分支看预览。
- conda：base / pytorch_env / **turbine-ai**（跑后端）；`frontend/.env.local` 已配 `VITE_API_URL=http://localhost:8000`。
- 桌面 `PredictPage_backup.jsx`（Tooltip 半成品，已参考实现，可留档）。
- notebook 被 Jupyter 改动 → `git checkout -- notebooks/` 丢弃。
- **只能承泽本人操作**：SnapDeploy Redeploy（合 main 后必做）、Cloudflare Pages 面板、线上 URL 验收、预热 workflow 安装、Windows 本地验收（§11.1 命令）。

## 11. 验收命令速查（§13 同源）

```bash
# 后端
python3 -m venv /tmp/venv && /tmp/venv/bin/pip install -r backend/requirements.txt requests
cd backend && /tmp/venv/bin/uvicorn app.main:app --port 8000
curl -s localhost:8000/api/predict/model-info | grep r2_evaluated_on
curl -s -o /dev/null -w "%{http_code}\n" localhost:8000/api/optimize/debug-path   # 期望 404
# R² 复现：README §快速复现 脚本 → 0.9844/0.9561/0.9827
# NSGA-II 复现：python backend/scripts/generate_pareto_evolution.py → 0.9173/21.74/2.1073
# 前端
cd frontend && npm install --no-audit --no-fund && npm run build && npm run lint  # 基线 16w/0e
```

## 12. 下一会话任务书：脱胎换骨升级冲刺 + 设计优化课题（v6 新增）

### 12.1 任务背景（一句话）

承泽已向郭老师汇报完毕（2026-08-01 前后）；项目进入「**脱胎换骨升级冲刺**」：把平台从「代理筛选器」升级为「**生成式闭环设计引擎**」。承泽已拍板：**全方案五层（P1 场级代理 / P2 校准UQ / P3 扩散生成 / P4 SU2 真闭环 / E5 LLM 助手）＋ 本地 GPU ＋ 交付物 = 平台升级**（课题申报书降级为可选「立项思路」）。作战总纲 = `docs/upgrade-blueprint-D38.md`（本会话已写好，含技术选型、引用依据、里程碑、数字口径、验收清单）。

### 12.2 任务产出物（按顺序交付）

0. **基线锁定 + 执行 30 天计划**：先复现 README 全部数字（R² 三组 / NSGA-II 三组），锁定基线再动工。**30 天逐日计划 + Gate/降级路径 = `docs/plan-30day-D38.md`（AI 内阁评审定稿版），是本会话的执行基线**。核心裁决：P1 双头融合（点云+统计）、P4 抽查验证模块（非完整飞轮）、P3 2D 先行、E5 MVP。
1. **P1 场级几何感知代理**（周 1–3）：PointNet 优先、FNO 并行小验证；点云下采样管线；3D 叶片压力/温度热力图。
2. **P2 校准不确定性**（周 3–4）：Deep Ensembles（5 种子）+ Conformal 校准；校准曲线 + ACD；修复 65–89% 覆盖问题。
3. **P3 条件扩散生成式反设计**（周 4–6）：VAE 潜在空间 + 条件扩散；先 2D 叶型（Bernstein）后 3D 点云；「生成图库」前端。
4. **P4 SU2 真实 CFD 闭环**（周 6–7）：生成→代理筛选→SU2 精验证 top-k→回灌重训；「已 CFD 验证」徽章；加速比改实测口径。
5. **E5 LLM 设计助手**（周 7–8）：自然语言→调参→代理预测→解释；前端对话面板。
6. **前端整合 + 数字口径更新**：README/terminology.md 更新（新指标族：场误差/覆盖/命中率/验证偏差/实测加速比）；全站双语规范。
7. **课题立项思路（可选）**：从蓝图 §7 导出（承泽暂不报课题，留火种）。
8. **HANDOFF.md 升到 v7**：状态快照、悬而未决、交付物登记。

> 详细技术选型、引用文献、里程碑、风险与降级全部在 `docs/upgrade-blueprint-D38.md`，先读它。

### 12.3 铁律与约束（必须遵守）

- 五条铁律（§0.-1）：推送优先 / 绝不主动合并 PR / 推不上去导 patch 如实上报 / 引用数字先复现 / 权限问题直说。
- 新会话分支以系统提示为准；不推 main；PR #4 已合，无需再保。
- 仓库 shallow → 先 `git fetch --unshallow origin`。
- `.github/workflows` 改动只做 docs 模板（无 workflows 权限）。
- 全站叙事统一「叶轮机械」；中英双语规范见 docs/terminology.md；JSX 中 `>` 写 `&gt;`。
- 新数字（如 GNN 模型 R²）一律标注口径并附复现脚本；诚实披露新旧对比。

### 12.4 给下一会话的开场白模板（承泽直接复制发送）

```
你好，我上传了 HANDOFF.md（若未落盘，把全文贴给你）。这是一个「AI 赋能的叶轮机械
多学科设计优化平台」项目的交接，本次会话是【脱胎换骨升级冲刺】。承泽已拍板：
全方案五层 + 本地 GPU + 真 SU2 闭环 + 交付物 = 平台升级。

【第一步 · 对齐环境】
1. 连接仓库 sunccchengze/turbine-blade-ai-platform，按系统提示的分支工作（勿切分支）。
2. 按 HANDOFF.md §0 开场清单：git fetch、git status、浅仓库检查（shallow 则 fetch --unshallow）、
   UTF-8 体检（8 个文件）、cd frontend && npm install。
3. 读背景（按顺序）：README.md → HANDOFF.md（§1/§3/§8）→ docs/report-one-pager-D37.md →
   docs/pressure-test-D31.md → docs/knowledge-boost-2026-07.md →
   docs/upgrade-blueprint-D38.md（★升级作战总纲，先读它）→ notebooks/01–06。
4. 遵守五条铁律（HANDOFF §0.-1）。

【第二步 · 本会话任务 = 脱胎换骨升级】（详见 HANDOFF §12 + upgrade-blueprint-D38.md）
0. 基线锁定：先复现 README 全部数字（R² 三组 / NSGA-II 三组），锁定基线再动工。
1. P1 场级几何感知代理（PointNet 优先，FNO 并行验证）：点云下采样管线 + 3D 叶片压力/温度热力图。
2. P2 Deep Ensembles + Conformal 校准：把 MC Dropout 65–89% 覆盖修到「名义 95% = 实测 95%」。
3. P3 VAE 潜在空间 + 条件扩散生成式反设计：先 2D 叶型后 3D 点云，出「生成图库」。
4. P4 SU2 真 CFD 闭环：生成→代理筛选→SU2 验证 top-k→回灌重训；「已 CFD 验证」徽章；
   加速比改实测口径（SU2 与 PLAID 定位为相对趋势验证）。
5. E5 LLM 设计助手：自然语言→调参→预测→解释，前端对话面板。
6. 前端整合 + README/terminology 数字口径更新（新指标族：场误差/覆盖/命中率/验证偏差/实测加速比）。
7. 每完成一个可交付单元 commit + push；结束时汇报：做了什么、哪些数字可复现、哪些未验证。

【约束】不合并 PR、不推 main；.github/workflows 只做 docs 模板；全站叙事统一「叶轮机械」；
新数字先讲口径再报数字；所有新指标附复现脚本。
```

> 说明：蓝图 `upgrade-blueprint-D38.md` 已含技术选型、引用文献、周里程碑、风险与降级、验收清单——下一会话照蓝图执行即可。

---

## 附录 A：全新工作区自救指南

1. 克隆、切到系统指定分支（读系统提示，别自创分支）。
2. `git fetch origin`；`git log origin/main --oneline | head`。
   - main 含 Day 19（`1839aa5` 等价物）→ 正常。
   - **看 PR #4 是否已合**：`gh pr list --state open`；若本会话分支已无推送权限 → 说明通道已关，按铁律 2 处理，让承泽开新会话。
3. unshallow 检查；前端 npm install；跑 §0 UTF-8 体检。
4. 给承泽的开场白建议：
   「交接文档已读完。PR #4（D19–D37 文档）保持开启；我现在从作战表继续：方法论页打磨 / 移动端真机 / Q29 审美双方案。五条铁律已就位。」

---

**v6 我改了什么**（相对 v5）：
- 更正：HANDOFF.md 实际已被 git 跟踪（header 旧说法过时），仓库克隆即含本文件；若要隐藏需 `git rm --cached`。
- §3.1：PR #4 已合并（HEAD=70f5e6c）；本会话分支 `arena/019fb861-...`；shallow 提示。
- §6：PR #4 待办改为「后端 Redeploy（承泽本人操作）」。
- §7：新增 D38+ 升级冲刺行。
- §8：登记 `docs/knowledge-boost-2026-07.md`（Day 38 弹药库）。
- 新增 §12：下一会话任务书（脱胎换骨升级 + 设计优化课题）+ 开场白模板。
- §0.0：新会话开场白改指向 §12。

**v6.1 我改了什么**（2026-08-01，承泽拍板后）：
- 承泽决策：全方案五层（P1–P4 + E5）／本地 GPU／真 SU2 闭环／交付物=平台升级（课题申报书→可选立项思路）。
- §12 全面改写为五层任务书；新增 `docs/upgrade-blueprint-D38.md` 作战总纲（技术选型/引用/里程碑/口径/验收）。
- §12.4 开场白模板更新为新决策版本。
