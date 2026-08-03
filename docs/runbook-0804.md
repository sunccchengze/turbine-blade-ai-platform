# 📋 8/4 优化日 · 保姆级逐步骤操作手册（runbook）

> 写给承泽本人：假设你什么都不会，每一步写清楚"打开什么 → 输入什么 → 看到什么算成功 → 卡住发什么给我"。
> 遇到任何看不懂的报错：**把终端最后 20–30 行文字截图/复制发我**，不要自己猜。
> 总原则：**每完成一步，把输出发我，我告诉你下一步。**

---

## 第 0 步：把仓库更新到最新（5 分钟）

**打开**：Windows 开始菜单 → 搜索 "Anaconda Prompt" → 打开它（一个黑色窗口，里面能输命令）

**输入**（一行一行来，每行回车）：
```bash
cd C:\你的项目路径\turbine-blade-ai-platform
git fetch origin
git checkout arena/019fc539-turbine-blade-ai-platform
git pull origin arena/019fc539-turbine-blade-ai-platform
```

**看到什么算成功**：最后出现 `Already up to date` 或 `Fast-forward ... files changed`。

**确认**：
```bash
dir docs
```
应该能看到 `defense-ops-D40.md`、`defense-pitch-D40.md`、`runbook-0804.md`（本文件）、`verify-reproducibility-workflow.yml`。

**卡住**：`git checkout` 报 "error: Your local changes..." → 发我截图，我会让你先 stash。

---

## 第 1 步：官方 test split R²（上午主线，约 1–2 小时，大部分时间在等下载）

> 目的：宋老师必问 Q3「官方 200 组测试集上你的模型是多少？」——这是正面回答。
> 脚本我已经写好（`backend/scripts/eval_official_test_split.py`），你只负责执行。

### 1a. 装依赖（2 分钟）
```bash
cd C:\你的项目路径\turbine-blade-ai-platform
pip install datasets scipy
```
看到 `Successfully installed ...` 就算成功。

### 1b. 先跑自检（重要！先验证特征口径和训练数据一致）
```bash
python backend/scripts/eval_official_test_split.py --smoke
```
- **首次会下载数据集**（约 1–2 GB，5–30 分钟，看网速）。下载期间**别干等**——跳到第 2 步做 SU2。
- 下载完成后会打印类似：
  ```
  sample_id=0: 特征最大偏差 = 1.2e-08 ✅
  sample_id=1: 特征最大偏差 = 8.9e-09 ✅
  自检完成（与现有 CSV 一致 = 特征口径与训练完全相同）
  ```
- ✅ = 口径一致，可以进行下一步。❌ = 把输出发我。

### 1c. 正式跑官方 test split（下载完后）
```bash
python backend/scripts/eval_official_test_split.py
```
- 会打印表格，类似：
  ```
  | 输出 | R²（官方test） | R²（仓库留出集） |
  | π Compression_ratio | 0.98xx | 0.9844 |
  | η Efficiency | 0.94xx | 0.9561 |
  | ṁ Massflow | 0.97xx | 0.9827 |
  ```
- **把这三行数字发我** → 我帮你写进 README 和 PPT 第 12 页。
- 产出文件：`backend/data/processed/official_test_eval.csv`

**三种可能的结果**（都正常，别慌）：
| 情况 | 说明 | 答辩怎么讲 |
|---|---|---|
| 和留出集差不多 | 最强结果：跨分布泛化成立 | 「两个口径都报，官方 test 独立于训练」 |
| 掉 1–3 个点 | 正常，官方 test 工况分布不同 | 如实报 + 解释分布差异 |
| 掉很多 | 更要如实报 | 诚实本身就是加分项（宋老师要的就是敢报） |

**卡住**：下载失败 / 报错 / 卡在进度 → 截图发我。常见坑：`pickle.loads` 失败（说明数据格式变了，我改脚本）、内存不足（我改成分批）。

---

## 第 2 步：SU2 工具链验证（下载等待时做，约 30–60 分钟）

> 目的：证明 SU2 v8.5 在你机器上能完整跑通一个 RANS 算例（SA 湍流模型，和你们 P4 配置一致）。
> 这是「发动机点火成功」——答辩里讲 P4 时的底气。

### 2a. 下载两个文件（浏览器直接下载，放同一个文件夹，比如 `C:\su2_test\`）
1. 配置文件：https://raw.githubusercontent.com/su2code/Tutorials/master/compressible_flow/Turbulent_Flat_Plate/turb_SA_flatplate.cfg
2. 网格文件：https://raw.githubusercontent.com/su2code/Tutorials/master/compressible_flow/Turbulent_Flat_Plate/mesh_flatplate_turb_137x97.su2

（右键 → 另存为 → 存到 `C:\su2_test\`，文件名保持原样。两个文件必须在同一文件夹。）

### 2b. 运行 SU2（Anaconda Prompt 里）
```bash
cd C:\su2_test
C:\SU2-extracted\bin\SU2_CFD.exe turb_SA_flatplate.cfg
```

### 看到什么算成功
- 先打印网格信息（`Geometry Preprocessing`、点数/单元数）
- 然后开始迭代，屏幕一行行刷：
  ```
  | Inner_Iter | Time_Iter | WALL_TIME | RMS_DENSITY | RMS_NU_TILDE | LIFT | DRAG |
  | 0 | 0 | 0:00:00 | ... |
  | 100 | 0 | ... | 1e-04 | ... |
  ```
- RMS_DENSITY 一路往下降（1e-2 → 1e-4 → 1e-8 → 1e-10），最后**自动停**（收敛）。预计 5–30 分钟。
- 结束后文件夹里会多出几个文件（`history`、`restart_flow`、`.vtk` 等）。

### 卡住怎么办
| 现象 | 原因 | 动作 |
|---|---|---|
| `SU2_CFD.exe 不是内部或外部命令` | 路径不对 | 确认 SU2 装在 `C:\SU2-extracted\bin\`；不对就搜索你电脑上 `SU2_CFD.exe` 在哪，把命令里的路径换成实际的 |
| 打开后秒退/报 DLL 错误 | 缺 VC++ 运行库 | 截图发我 |
| 跑着跑着 NaN / 发散 | 教程算例很少发散，先别管 | 截图发我 |
| 半小时还没停 | 正常，网格在收敛 | 等；或把 ITER 改小（我教你改 cfg 里的 `ITER=`） |

**跑通后**：把屏幕最后几行 + 生成的 `history` 文件名发我 → 我教你提取 DRAG 收敛值（答辩素材：SU2 RANS 端到端验证完成）。

---

## 第 3 步：真算例尝试（下午，时间盒 2–3 小时，尽力而为）

> 目标（最优）：把 1 个 Pareto 解对应的叶片网格喂给 SU2，跑出 η/π/ṁ，和代理预测对照。
> 难度提示：这一步等于"研究生一周的活"——**今天跑不通 100% 正常**，收获是搞清楚卡点，写进 P4 计划。

**诚实路线（推荐）**：
1. 先确认第 2 步已跑通（地基）；
2. 尝试把 PLAID 样本的网格导出成 .cgns 文件（SU2 支持 `MESH_FORMAT= CGNS`，需要装 `pip install pycgns`，**如果你愿意试，我给你写导出脚本**——但格式坑很多）；
3. 配置旋转坐标系 + 周期边界（需要 SU2 turbomachinery 教程级别的配置）；
4. 跑通 → 对照表填进 `run_su2_validation_p4.py` 的输出结构；没跑通 → 记录卡点。

**第 3 步结束无论成败，都发我一个总结**：「教程算例 ✅/❌ + 真算例卡在 X 步」→ 我帮你写进答辩材料和 README 的 P4 状态。

---

## 第 4 步：清理 + 合并 + 部署（傍晚，30 分钟）

### 4a. 移除 HANDOFF.md（宋老师批评 7）
```bash
cd C:\你的项目路径\turbine-blade-ai-platform
git rm --cached HANDOFF.md
echo HANDOFF.md >> .gitignore
git add -A
git commit -m "D40: remove internal HANDOFF.md from repo (review feedback)"
git push origin arena/019fc539-turbine-blade-ai-platform
```

### 4b. 合并进 main（GitHub 网页操作）
1. 浏览器打开 https://github.com/sunccchengze/turbine-blade-ai-platform
2. Pull requests → New pull request → base `main` ← compare `arena/019fc539-turbine-blade-ai-platform` → Create PR → **Merge**
3. ⚠️ 这是你最后一个 GitHub 动作，之后我们不再动分支（合并后会话远程通道可能关闭——正常现象，不用慌）

### 4c. 后端 Redeploy（必须！）
- 打开 SnapDeploy 控制台 → 找到 `turbine-blade-api-c4f40` 容器 → **Redeploy**
- 不 Redeploy 的话，线上 UQ 还是旧的 `mode:"uncertainty"`，演示时会露馅

### 4d. 线上验证
```bash
curl https://turbine-blade-api-c4f40.containers.snapdeploy.app/health
```
预期：`{"status":"healthy",...}`。再开浏览器看首页新文案（"代理模型预测的最优设计"）。

### 4e. 全量复现核对（答辩前夜定心丸，20 分钟）
在**锁版环境**里跑 README 复现脚本（预期 0.9844/0.9561/0.9827）和：
```bash
python backend/scripts/generate_pareto_evolution.py   # 预期 max η=0.9173 max ṁ=21.74
python backend/scripts/pareto_evidence.py             # 证据链报告
```
数字对不上 → 发我，八成是环境版本问题（按 README 全锁版重装）。

---

## 第 5 步：今晚（答辩准备日晚上）
- 做 PPT（大纲见 `docs/defense-pitch-D40.md`，24 页）
- 对讲稿过一遍（40 分钟计时）
- **22:30 前睡觉**。8/5 早上 07:30 打开线上站唤醒后端，08:30 彩排第二遍。

---

## 今天的节奏卡片（贴墙上）

```
08:00 第0步 更新仓库 → 第1a步 装依赖
08:10 第1b步 启动 smoke（下载开始）→ 立即去做第2步
08:15 第2步 SU2 下载教程文件 → 跑算例（等收敛时回来）
09:30 第1c步 正式跑官方 test（下载完了的话）
10:30 第2步 SU2 收尾（跑通/截图）
11:00 把第1步、第2步结果发我 → 我写 README/PPT 素材
下午 第3步 真算例（时间盒 2–3 小时，成败都总结）
17:00 第4步 清理+合并+部署+复现核对
19:00 开始做 PPT（大纲在 defense-pitch-D40.md）
22:30 睡觉
```

**每完成一步就发我输出**，我全程在线陪跑。
