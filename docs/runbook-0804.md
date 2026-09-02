# 📋 8/4 优化日 · 操作手册 v2（瘦身版）

> ⛔ **时效标记（2026-09-02 追加 · 由分支收敛会话自动判定）** —— 本文件是 **2026-08-08** 的历史快照，**不是现状**。
> 以下写法在今天已经不成立：
> - 第 131 行「2. 把 arena 分支合并进 main（GitHub 网页 Pull Request → Merge）→ SnapDeploy 手动 Redeploy 后端（必须，否则线上还是旧代码）」→ **后端 Redeploy：平台已纯前端 WASM，线上无部署中的后端，推 main 之后没有这一步**
> - 第 132 行「3. 线上验证：浏览器打开 https://turbine-blade-api-c4f40.containers.snapdeploy.app/health 应返回 healthy」→ **引用已下线的 SnapDeploy 容器域名**
> - 第 134 行「> 如果今天累了，这三件可以放明早 8 点前做（答辩 10 点）。但Redeploy 必须在你合 PR 之后做，别忘。」→ **后端 Redeploy：平台已纯前端 WASM，线上无部署中的后端，推 main 之后没有这一步**
> - 第 155 行「17:00  傍晚3件（HANDOFF/合PR/Redeploy，可放明早）」→ **后端 Redeploy：平台已纯前端 WASM，线上无部署中的后端，推 main 之后没有这一步**
>
> 现行口径唯一来源：`HANDOFF.md`（§0.-1 十一条铁律、§9.5 架构现状）、`docs/BRANCH-SAFETY.md`（会话与 git 纪律）、`evidence/metrics.json`（对外数字）。
> ——以及第二轮：
> - 第 5 行「> - 第 131 行「2. 把 arena 分支合并进 main（GitHub 网页 Pull Request → Merge）→ SnapDeploy 手动 Redeploy 后端（必须，否则线上还是旧代」→ **部署拓扑已变：线上只有 Cloudflare Pages 静态站点**
> - 第 7 行「> - 第 134 行「> 如果今天累了，这三件可以放明早 8 点前做（答辩 10 点）。但Redeploy 必须在你合 PR 之后做，别忘。」→ 后端 Redeploy：平台已纯前端 WASM，线上无部署中」→ **部署拓扑已变：线上只有 Cloudflare Pages 静态站点**
> - 第 8 行「> - 第 155 行「17:00  傍晚3件（HANDOFF/合PR/Redeploy，可放明早）」→ 后端 Redeploy：平台已纯前端 WASM，线上无部署中的后端，推 main 之后没有这一步」→ **部署拓扑已变：线上只有 Cloudflare Pages 静态站点**
> **正文一字未改**——当时的判断与过程仍按原样保留，供回顾历程用。

> v2 修订：采纳前会话 agent 的合理建议——①先环境探针，不猜你电脑；②主 R² 不下载任何数据，30 秒出结果；
> ③官方 test split 降级为「可选 + 时间盒 ≤1 小时」（口径与主数字分开，绝不混报）；④日程瘦身，今天只认两件主线。
> 每步成功长什么样、失败怎么办、把哪几行发我，都写清楚了。遇到报错：**把终端最后 20–30 行发我，别自己猜。**

---

## 🚦 第 0 步：环境探针（5 分钟 · 必须先做）

打开 **Anaconda Prompt**（开始菜单搜索 "Anaconda Prompt"）。**逐行**输入下面每一行（每行回车，看输出）：

```bat
conda env list
conda activate turbine-ai
cd C:\Users\45120\turbine_blade_ai_platform
cd
dir
python -c "import sys; print(sys.executable); import sklearn,onnxruntime,pandas; print('sklearn', sklearn.__version__); print('ort', onnxruntime.__version__)"
where docker
where SU2_CFD
dir backend\models\surrogate_model.onnx
dir backend\data\processed\plaid_rotor37_features.csv
dir backend\scripts\reproduce_r2.py
dir backend\scripts\make_naca0012_su2_case.py
dir data\processed\p4\naca0012_quickstart
git remote -v
git log --oneline -3
```

> ⚠️ 路径 `C:\Users\45120\turbine_blade_ai_platform` 是前会话记录的；如果 `cd` 后 `dir` 看不到 `backend\` 和 `frontend\`，
> 说明路径不对——把 `cd` 后 `dir` 的输出发我，我帮你找真实路径。

**看到什么算成功**：每行都有输出（没有 "cannot find / 不是内部或外部命令" 就行——`where docker` / `where SU2_CFD` 报错是**正常**的，代表没装或不在 PATH）。

**把全部输出复制发我** → 我根据结果告诉你 SU2 走 Docker 还是原生 exe，再给你下一步。

---

## ✅ 主线 1：主 R² 复现（30 秒 · 不下载任何数据）

> 目的：这是 README / 网站 / 答辩的唯一主口径数字（宋老师若现场要你跑，就是这个）。
> 用仓库已有文件，**不需要** pip install datasets、**不需要**下载 PLAID 原始数据。

```bat
cd C:\Users\45120\turbine_blade_ai_platform
python backend\scripts\reproduce_r2.py
```

**成功就是这三行**（n_test=100）：
```text
Compression_ratio    R² = 0.9844
Efficiency           R² = 0.9561
Massflow             R² = 0.9827
```
**截图保存**（答辩 PPT 里放这张图）。

**失败怎么办**：
| 报错 | 原因 | 动作 |
|---|---|---|
| `ModuleNotFoundError: sklearn` 等 | 环境不对 | 确认已 `conda activate turbine-ai`；不行就 `pip install scikit-learn==1.7.2 onnxruntime joblib pandas numpy` |
| `无法找到文件 backend\...` | 当前目录不对 | 先 `cd C:\Users\45120\turbine_blade_ai_platform` 再跑 |
| R² 数字对不上 | 版本不对 | 发我输出 + `python -c "import sklearn; print(sklearn.__version__)"` |

> 若仓库里没有 `reproduce_r2.py`（说明你 pull 的版本旧）：先 `git pull origin arena/019fc539-turbine-blade-ai-platform`；
> 或直接告诉我，我给你一条等价的一次性命令（不依赖文件）。

---

## ✅ 主线 2：SU2 跑通 1 个教程算例（根据探针结果选路线）

> 目的：证明本机 SU2 通路 OK（SA 湍流 RANS）——答辩讲 P4 的底气。**今天只做教学算例，不碰 Rotor37 真网格。**

### 路线 A：探针显示你装了 Docker（`where docker` 有输出）
```bat
docker pull su2code/su2
```
然后我给你 Docker 版的运行命令（教程 cfg 挂在容器里跑）。

### 路线 B：探针显示你有 `SU2_CFD.exe`（或 `dir C:\SU2-extracted\bin\SU2_CFD.exe` 有输出）
1. 浏览器下载两个文件到**同一个文件夹**（比如 `C:\su2_test\`，右键→另存为，文件名别改）：
   - https://raw.githubusercontent.com/su2code/Tutorials/master/compressible_flow/Turbulent_Flat_Plate/turb_SA_flatplate.cfg
   - https://raw.githubusercontent.com/su2code/Tutorials/master/compressible_flow/Turbulent_Flat_Plate/mesh_flatplate_turb_137x97.su2
2. 运行：
```bat
cd C:\su2_test
C:\SU2-extracted\bin\SU2_CFD.exe turb_SA_flatplate.cfg
```

### 路线 C：探针显示你本地有 `make_naca0012_su2_case.py` 或 `data\processed\p4\naca0012_quickstart`（前会话遗留，未推送）
→ 告诉我，直接用它（更快）。

### 成功标志（任一路线）
- 屏幕先打印网格信息（`Geometry Preprocessing` / 点数）
- 然后迭代日志一行行刷，`RMS_DENSITY` 一路下降（1e-2 → 1e-5 → 1e-8 → 1e-10）
- 最后自动停，文件夹里多出结果文件
- **把最后 10 行输出 + 生成的文件名发我**

### 失败怎么办
| 现象 | 动作 |
|---|---|
| 路径不对 / 命令不存在 | 把报错发我，我根据探针结果给你正确命令 |
| 跑着跑着 NaN / 发散 | 教程算例极少发散，先截图发我 |
| 半小时没停 | 正常（网格 13.7 万点在收敛）；把当前残差发我看 |

> 时间盒：**最多 2 小时**。跑通就收工，跑不通把卡点发我，不硬熬。

---

## ⏸ 可选任务（时间盒 ≤1 小时 · 网络不行就跳过）

### 官方 test split R²（宋老师 Q3 的补充口径）
> ⚠️ **口径澄清（重要）**：这是**另一套数字**，与 README 主口径（0.9844/0.9561/0.9827）不是一回事——
> 它是 PLAID 官方 200 组测试集上的评估（需要下载原始数据提取特征），**只在答辩中作为补充基准**，
> 永远不会替换主数字。脚本 `backend/scripts/eval_official_test_split.py` 已备好，含特征口径自检。
> 今天跑不通就跳过：答辩如实说「脚本已备好、口径已对齐训练侧，8/5 后补跑」——**不跑也不丢分**，跑出来是加分。

想做的话：
```bat
pip install datasets scipy
python backend\scripts\eval_official_test_split.py --smoke   # 先自检（首次下载 1–2GB，可后台挂着）
python backend\scripts\eval_official_test_split.py           # 正式评估
```
把 R² 三行发我（我会明确标注「官方 test 口径」分开记录）。

---

## 🕖 傍晚（30 分钟 · 可选做）

1. 移除 HANDOFF.md：`git rm --cached HANDOFF.md` + `echo HANDOFF.md >> .gitignore` + commit + push
2. 把 arena 分支合并进 main（GitHub 网页 Pull Request → Merge）→ **SnapDeploy 手动 Redeploy 后端**（必须，否则线上还是旧代码）
3. 线上验证：浏览器打开 https://turbine-blade-api-c4f40.containers.snapdeploy.app/health 应返回 healthy

> 如果今天累了，这三件可以放明早 8 点前做（答辩 10 点）。但**Redeploy 必须在你合 PR 之后做**，别忘。

---

## 🌙 今晚（答辩准备）

- 做 PPT：只做**骨架 + 关键页**（P10 精度表截图、P18 证据链、P19 SU2 结果）——大纲在 `docs/defense-pitch-D40.md`
- 对着讲稿过一遍（40 分钟计时，卡壳处标记）
- **22:30 睡觉**

---

## 📌 今天的节奏（贴墙）

```
08:00  第0步 环境探针 → 输出全发我
08:10  主线1 R² 复现（30秒）→ 截图发我
08:15  主线2 SU2（探针后我告诉你路线）→ 最多2小时
10:30  [可选] 官方 test split（下载后台挂着，≤1小时）
11:30  把今天所有输出发我 → 我更新 README/PPT 素材
下午   你休息 / 我帮你写 PPT 素材
17:00  傍晚3件（HANDOFF/合PR/Redeploy，可放明早）
19:00  PPT 骨架 + 讲稿过一遍
22:30  睡觉
```

**今天只认两件主线：R² 截图 + SU2 跑通一个算例。其余全是加分项。**
