# 🌀 AI 赋能的叶轮机械多学科设计优化平台

**AI-Enabled Multidisciplinary Design Optimization Platform for Turbomachinery**

> 用深度学习代理模型替代 CFD 做前端筛选，把叶片气动性能评估从「小时级」压到「毫秒级」，
> 并用 NSGA-II 在 74 维设计空间里找出 Pareto 最优解。
>
> A deep-learning surrogate replaces CFD for front-end design screening — cutting blade aerodynamic
> evaluation from hours to milliseconds — with NSGA-II searching a 74-dimensional design space for
> Pareto-optimal solutions.

<p align="center">
  <a href="https://turbine-blade-ai-scz.pages.dev"><b>🚀 在线体验 Live Demo</b></a> ·
  <a href="https://turbine-blade-api-c4f40.containers.snapdeploy.app/docs"><b>📡 API 文档 API Docs</b></a> ·
  <a href="#-快速复现-reproduce"><b>🔧 快速复现 Reproduce</b></a>
</p>

<p align="center">
  <img alt="Python" src="https://img.shields.io/badge/Python-3.10-3776AB?logo=python&amp;logoColor=white">
  <img alt="PyTorch" src="https://img.shields.io/badge/PyTorch-Residual%20Surrogate-EE4C2C?logo=pytorch&amp;logoColor=white">
  <img alt="ONNX" src="https://img.shields.io/badge/ONNX-Runtime%201.18-005CED?logo=onnx&amp;logoColor=white">
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi&amp;logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&amp;logoColor=black">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-22d3ee">
  <img alt="data" src="https://img.shields.io/badge/data-NASA%20Rotor%2037-orange">
</p>

---

## 🌍 研究背景 Background

2026 年 2 月，德国卡尔斯鲁厄理工学院（KIT）让一台**无压气机**氢燃料燃气轮机连续运行 **303 秒**，
打破了 NASA 此前 250 秒的纪录 —— 它用增压燃烧（pressure-gain combustion）取代了机械压气机。
传统燃气轮机约 **50%** 的输出功要用来驱动压气机。当这部分被省去，
整机性能的瓶颈就从「压气机效率」转移到了**叶片气动效率**本身 ——
这正是 AI 加速叶片设计优化变得前所未有重要的原因。

> In Feb 2026, KIT ran a compressorless hydrogen gas turbine for **303 seconds**, surpassing NASA's
> previous 250-second record by replacing the mechanical compressor with pressure-gain combustion.
> Since conventional turbines spend ~50% of output power driving the compressor, removing it shifts
> the bottleneck squarely onto blade aerodynamic efficiency.

**本项目的定位**：KIT 的突破是**行业引子**（回答「为什么是现在」）。
本项目的**技术载体**是公开基准数据集 **NASA Rotor 37 压气机** —— 压气机与涡轮同属叶轮机械，
方法学互通，用公开基准做方法与平台验证是可复现的做法。

---

## 🎯 解决什么问题 What This Solves

单个叶片设计的三维 CFD RANS 仿真需要**数小时**。设计空间探索动辄成千上万次评估 ——
纯靠 CFD，一次二维参数扫描就要几十天机时。

```
参数化叶片几何 Parametric Geometry

        ↓

NASA Rotor 37 基准数据（1,000 组 CFD 样本 / 每组 29,773 表面节点）

        ↓

特征工程 → 74 维统计特征

        ↓

残差代理模型 Residual Surrogate（物理约束 + 多任务加权损失）

        ↓

    ┌───────────────┬────────────────┬──────────────────┐

    ↓               ↓                ↓                  ↓

实时预测         设计空间探索      MC Dropout UQ     NSGA-II 优化

Predict          Explore           不确定性量化      100 Pareto 解

        ↓

交互式 Web 平台（React + Three.js + Plotly）
```

---

## 📊 实测性能 Measured Performance

> 下表所有数字均可通过 [§ 快速复现](#-快速复现-reproduce) 在本仓库内重跑验证。
> All figures below are reproducible from this repository.

### 代理模型精度 Surrogate Accuracy

在 **留出测试集**（n=100, random_state=42，训练时完全未见）上，由部署中的 ONNX 模型实测：

| 输出 Output | 符号 | 基线 MLP R² | **残差模型 R²** | 提升 |
|---|---|---|---|---|
| 总压比 Compression ratio | π | 0.9664 | **0.9844** | +0.0180 |
| 等熵效率 Isentropic efficiency | η | 0.9132 | **0.9561** | +0.0429 |
| 质量流量 Mass flow | ṁ | 0.9492 | **0.9827** | +0.0335 |

三个输出全部 **R² > 0.95**。效率（η）最难拟合 —— 它在数据集中的变化范围仅约 0.045，
因此训练时给了 **3×** 的任务权重（见下方损失函数）。

<details>
<summary>不同数据划分下的 R²（点开查看 · 诚实披露）</summary>

| 划分 | π | η | ṁ |
|---|---|---|---|
| 训练集 train (n=800) | 0.9926 | 0.9915 | 0.9944 |
| 验证集 val (n=100) | 0.9819 | 0.9451 | 0.9834 |
| **测试集 test (n=100)** | **0.9844** | **0.9561** | **0.9827** |

本 README 与网站统一采用**测试集**数字。训练集 R² 明显更高属正常过拟合迹象，
列出来是为了不让读者误以为模型有 0.99 的泛化能力。

</details>

### 推理速度 Inference Speed

| 指标 | 实测值 |
|---|---|
| ONNX 单点推理（纯模型） | **0.13 ms** |
| API 端到端单次预测（含 HTTP + 校验 + 反标准化） | **1.85 ms** |
| 设计空间扫描 25×25 = 625 点 | **23.7 ms** |
| 设计空间扫描 40×40 = 1,600 点 | **45.4 ms** |
| 模型体积 PyTorch → ONNX | 2.12 MB → **2.11 MB**（523,011 参数） |

> 推理耗时**与硬件相关**，上表为某次 Linux 容器环境实测；在开发机上曾测得 0.37 ms/次。
> 数量级一致即可，不必逐位对齐。
> Inference timings are hardware-dependent; treat the order of magnitude, not the exact digits, as the claim.

**对比 CFD**：单场 RANS 仿真按 30 min 估算，端到端 API 加速比约 **10⁶ 量级**。
网站上采用保守表述 **~100,000×**，留足余量 —— 宁可少说，不可多说。

### 多目标优化 NSGA-II

约束 `π ≥ 1.8`、`η ≥ 0.84`；种群 100、迭代 200 代，得到 **100 个非支配解**：

| 指标 | 最优值 | 相对训练集均值 |
|---|---|---|
| 等熵效率 η | **0.9173** | **+5.40%**（均值 0.8703） |
| 质量流量 ṁ | **21.74 kg/s** | **+11.43%**（均值 19.51） |
| 总压比 π | 2.1073 | 均值 1.9839 |

### 不确定性量化 MC Dropout UQ

训练阶段推理时保持 Dropout 开启，采样 100 次得到预测分布，取 ±1.96σ 作为 95% 置信区间。
**注**：生产 API 的 UQ 模式使用**预计算的 σ 统计量**（ONNX 推理不重复采样），数值与表中「平均 σ」一致。

| 输出 | 平均 σ | 95% CI 实际覆盖率 |
|---|---|---|
| π | 0.0064 | 89% |
| η | 0.0010 | 65% |
| ṁ | 0.0611 | 88% |

> ⚠️ **诚实披露**：名义 95% 的区间实际只覆盖了 65–89% 的真值，
> 说明 MC Dropout **低估了真实不确定性**（尤其是效率 η）。
> 这是 MC Dropout 的已知局限 —— 它只刻画模型参数的认知不确定性（epistemic），
> 不包含数据噪声（aleatoric）。当前它的定位是**相对置信度指示器**（哪些区域模型更没把握），
> 而非严格的统计保证。改进方向见 [Future Work](#-局限与未来工作-limitations--future-work)。

---

## 🏗️ 模型架构 Model Architecture

### 残差代理模型 Residual Surrogate

```
输入 (74)
  → 输入投影 Linear(74→256) + BatchNorm + ReLU + Dropout(0.1)
  → 残差块 ×3 (256→256)
  → 中间投影 Linear(256→128) + BatchNorm + ReLU + Dropout(0.1)
  → 残差块 ×2 (128→128)
  → 输出层 Linear(128→3)
```

每个**残差块**：`x → Linear → BN → ReLU → Dropout → Linear → BN → (+x) → ReLU`

残差连接让梯度可以直接回流，最差情况下退化为恒等映射，从而支持更深的网络。

### 物理约束损失 Physics-Constrained Loss

```
总损失 = Σ wᵢ · MSEᵢ  +  λ · 物理惩罚项      (w = [1.0, 3.0, 1.5], λ = 0.1)
```

物理惩罚项对违反以下边界的预测施加 `ReLU(·)²` 惩罚：

| 约束 | 物理依据 |
|---|---|
| η ≤ 1.0 | 热力学第二定律 |
| η ≥ 0.5 | 排除极端失速工况 |
| π ≥ 1.0 | 压气机定义（否则成了膨胀机） |
| ṁ ≥ 0 | 物理常识 |

> ⚠️ **诚实披露**：当前的物理约束属于**边界裁剪级**（soft boundary penalty），
> 它保证输出落在物理可行域内，但**并未在损失中嵌入 N-S 方程残差**。
> 真正的 PINN 式约束是明确的 future work，不在当前版本的宣称范围内。

### 部署期物理防线 Runtime Guard

代理模型只在**训练数据分布内**可信。后端 `model.py` 内置 `FEATURE_STATS`，
任何超出训练范围的输入一律返回 **HTTP 422**，而不是给出一个看似合理的外推答案：

```json
{"detail": "'Omega' 扫描范围 [1620.09, 2699.87] 超出训练数据范围 [1620.09, 1799.91]。代理模型不支持外推预测。"}
```

**宁可拒绝回答，也不给错误答案** —— 这是工程可信度的底线。

---

## 🖥️ 平台功能 Platform Features

| 页面 | 路由 | 功能 |
|---|---|---|
| 首页 Home | `/` | 项目叙事、核心指标、技术管线 |
| 实时预测 Predict | `/predict` | 74 维输入 → 三项性能预测，可切换 MC Dropout UQ |
| **设计空间探索器 Explore** | `/explore` | **主功能**。任选两维参数生成响应面热力图，一次批量推理算完整张网格，点击任意点读数并对比基准 |
| 多目标优化 Optimize | `/optimize` | Pareto 前沿可视化，100 个非支配解 |
| 不确定性 UQ | `/uq` | 置信区间带、不确定性分布、σ-误差相关性 |

全站 **逐句中英双语**（中文在前，英文以次级样式紧随）。

---

## 🛠️ 技术栈 Tech Stack

| 层 | 技术 |
|---|---|
| 模型训练 | PyTorch（残差网络 + 物理约束损失 + 多任务加权） |
| 生产推理 | ONNX Runtime 1.18（比 PyTorch 快约 5×，无需 torch 依赖） |
| 优化算法 | NSGA-II（pymoo 0.6.1） |
| 后端 API | FastAPI 0.110 + uvicorn |
| 前端 | React 19 + Vite + Three.js（3D 叶片） + Plotly.js（图表） + Framer Motion |
| 部署 | Cloudflare Pages（前端） + SnapDeploy 容器（后端） |
| 数据 | PLAID / NASA Rotor 37（Hugging Face `PLAID-datasets/Rotor37`） |

---

## 📡 API 参考 API Reference

基址 Base: `https://turbine-blade-api-c4f40.containers.snapdeploy.app`

| 端点 | 方法 | 说明 |
|---|---|---|
| `/health` | GET | 健康检查 |
| `/api/predict/` | POST | 单点预测。入参 `{"features": [74 个数]}` |
| `/api/predict/sweep` | POST | 设计空间扫描：`base_features` + `param_x/param_y` + `x_values/y_values`（各 ≤40）+ `output` |
| `/api/predict/baseline-features` | GET | 基准设计特征 + 各维 min/max（前端初始化用） |
| `/api/predict/model-info` | GET | 模型元信息 |
| `/api/optimize/pareto` | GET | 100 个 Pareto 解 |
| `/api/optimize/training-data-stats` | GET | 训练集统计 |
| `/api/optimize/uq-results` | GET | MC Dropout UQ 结果 |

> `output` 只接受 `Compression_ratio` / `Efficiency` / `Massflow` 三个值。
> `base_features` 必须严格按 `/baseline-features` 返回的 `feature_names` 顺序排列。

---

## 🔧 快速复现 Reproduce

### 1. 后端 Backend

```bash
git clone https://github.com/sunccchengze/turbine-blade-ai-platform.git
cd turbine-blade-ai-platform
python -m venv .venv && source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt              # 注意 scikit-learn 必须 ==1.7.2
cd backend && uvicorn app.main:app --reload --port 8000
# 打开 http://localhost:8000/docs
```

> ⚠️ `scikit-learn==1.7.2` 与 `scaler_*_v2.pkl` 的导出版本一致，降级会触发版本警告。

### 2. 前端 Frontend

```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000" > .env.local   # 指向本地后端
npm run dev        # http://localhost:5173
```

### 3. 验证本 README 的精度数字

```bash
python - <<'EOF'
import numpy as np, pandas as pd, joblib, onnxruntime as ort
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score
df = pd.read_csv("backend/data/processed/plaid_rotor37_features.csv")
out = ['Compression_ratio', 'Efficiency', 'Massflow']
inc = [c for c in df.columns if c not in ['sample_id'] + out]
X, y = df[inc].values.astype(np.float32), df[out].values.astype(np.float32)
# 与训练时完全相同的划分
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.10, random_state=42)
sx = joblib.load("backend/models/scaler_X_v2.pkl")
sy = joblib.load("backend/models/scaler_y_v2.pkl")
sess = ort.InferenceSession("backend/models/surrogate_model.onnx")
pred = sy.inverse_transform(
    sess.run(None, {sess.get_inputs()[0].name: sx.transform(X_test).astype(np.float32)})[0])
for i, c in enumerate(out):
    print(f"{c:20s} R² = {r2_score(y_test[:, i], pred[:, i]):.4f}")
EOF
# 期望输出：0.9844 / 0.9561 / 0.9827
```

### 4. 完整训练管线 Notebooks

| Notebook | 内容 |
|---|---|
| `01_data_exploration.ipynb` | PLAID 数据加载与 EDA |
| `02_feature_engineering.ipynb` | 29,773 表面节点 → 74 维统计特征 |
| `03_baseline_mlp.ipynb` | 基线 MLP |
| `04_residual_physics_model.ipynb` | **残差网络 + 物理约束（主力模型）** |
| `05_uncertainty_quantification.ipynb` | MC Dropout UQ |
| `06_multiobjective_optimization.ipynb` | NSGA-II 多目标优化 |

### 5. 复现 NSGA-II 优化结果（约 3 秒）

```bash
python backend/scripts/generate_pareto_evolution.py
# 输出：backend/data/processed/pareto_evolution.csv（演化轨迹，21 帧）
#       backend/data/processed/pareto_front_solutions.csv（最终 Pareto 前沿，100 解）
# 期望：max η = 0.9173 · max ṁ = 21.74 kg/s · max π = 2.1073
```

与 notebook 06 同源（seed 42、同算法配置），评估使用部署中的生产 ONNX 模型。
网站 /optimize 的演化动画数据即由该脚本生成。

---

## 🧬 数据说明 Dataset

**PLAID / NASA Rotor 37** — 1,000 组三维 CFD RANS 仿真样本，每组含 29,773 个叶片表面节点。

**特征工程（74 维）**：直接用 29,773 × 9 个原始场量会导致维度灾难，
因此对 9 组表面物理量各取 8 个统计量压缩：

```
9 组物理量 = CoordinateX/Y/Z + NormalsX/Y/Z + Pressure/Density/Temperature
8 个统计量 = mean / std / min / max / p25 / p75 / skew / kurt
→ 9 × 8 = 72 维，加上工况参数 Omega（转速）与 P（背压）= 74 维
```

**3 维输出**：`Compression_ratio` (π) · `Efficiency` (η) · `Massflow` (ṁ)

> ⚠️ **诚实披露**：统计特征化是**刻意的设计选择**，代价是丢失了空间分布信息
> （模型看不到「压力峰值出现在叶片哪个位置」）。
> 在 1,000 样本量级下，这个取舍换来了训练稳定性；
> 若要保留空间信息，正确方向是 PointNet / GNN 类几何深度学习架构。

---

## ⚠️ 局限与未来工作 Limitations & Future Work

本项目对自身边界的诚实认识：

1. **样本量 1,000** —— 对深度学习不算大。统计特征化 + 残差结构 + 物理约束是针对小样本的刻意设计，
   但泛化能力仍受限于数据规模（训练集 R² 0.99 vs 测试集 0.96 的差距即为证据）。
2. **代理模型不替代 CFD** —— 它的定位是**设计前端的快速筛选器**：
   用毫秒级评估把设计空间从上万个候选缩小到几十个，最终方案仍需 CFD 校验。
3. **物理约束是边界裁剪级** —— 见上文。嵌入 N-S 方程残差的 PINN 式约束是明确的 future work。
4. **MC Dropout 低估不确定性** —— 95% 名义区间实际覆盖 65–89%。
   改进方向：Deep Ensembles、异方差输出头（同时预测 μ 与 σ）、或 conformal prediction 校准。
5. **未自行运行 CFD** —— 本项目使用公开基准数据集，未搭建自己的 CFD 求解链路。
   加速比基于文献常见的 30 min/场估算，非本机实测 CFD 时间。

---

## 📅 开发进度 Progress

- [x] **Day 01–12** 数据管线与预处理（PLAID NASA Rotor 37，1,000 样本 → 74 维特征）
- [x] **Day 13–17** PyTorch 代理模型（残差网络 + 物理约束、MC Dropout UQ、NSGA-II）、全栈平台上线、全站双语
- [x] **Day 18** 线上部署总验收
- [x] **Day 19** README 中英双语重制
- [x] **Day 20** About/署名模块 + devlog（docs/devlog 回溯 Day 1–19）
- [x] **Day 21** Pareto → 3D 叶片联动（点选解 → 渲染叶型）
- [x] **Day 22** NSGA-II 演化动画 + Pareto 数据流水线统一（backend/scripts 一键复现）
- [x] **Day 23** 功能冻结 + 全站走查表 v1（参数 Tooltip 重实现）
- [x] **Day 24** 方法论页（数据 → 特征 → 代理模型 → 物理约束 → UQ → NSGA-II，含诚实披露）
- [x] **Day 27** 精度验证区块（预测 vs 真实 + 残差分布图，基线 MLP vs 残差网络对比）
- [x] **Day 30** 备份三件套 · 前两件：预热 workflow（模板在 `docs/preheat-workflow.md`，需在 GitHub Actions 页手动安装）+ 本地一键启动脚本（`scripts/start-local.bat` / `.sh`）
- [x] **Day 28** 移动端适配（代码级第一轮）：窄屏 <900px 双栏改单列、导航断点 1024
- [x] **Day 31** 质疑点压力测试问答稿（docs/pressure-test-D31.md，5 问 + R² 口径故事）
- [x] **Day 32** 术语/单位统一表（docs/terminology.md）；修正 Ω 单位 rad/s、坐标单位 m 的显示错误
- [x] **Day 33** 全站数字清理与文案终稿第一轮（清除旧 NSGA-II 数字残留，精确百分比）
- [x] **Day 34/36** 外行试讲与终版验收清单（docs/final-acceptance-D36.md）
- [x] **Day 37** 汇报一页纸 + Q&A 20 问预演稿（docs/report-one-pager-D37.md）
- [ ] **Day 25–26, 29, 35** 方法论页打磨、移动端真机走查、演示视频终版（清单已备，待执行）

---

## 📚 参考 References

- Reid, L. & Moore, R. D. (1978). *Design and Overall Performance of Four Highly Loaded, High-Speed
  Inlet Stages for an Advanced High-Pressure-Ratio Core Compressor*. NASA TP-1337.
- PLAID Datasets — Rotor37. Hugging Face: `PLAID-datasets/Rotor37`
- Deb, K. et al. (2002). *A Fast and Elitist Multiobjective Genetic Algorithm: NSGA-II*. IEEE TEVC.
- Gal, Y. & Ghahramani, Z. (2016). *Dropout as a Bayesian Approximation*. ICML.
- He, K. et al. (2016). *Deep Residual Learning for Image Recognition*. CVPR.
- KIT Press Release (Feb 2026) — Compressorless hydrogen gas turbine, 303 s runtime
  ([h2-international](https://www.h2-international.com/technology/compressorless-gas-turbine-kit-surpasses-previous-nasa-runtime-record))

---

<div align="center">

**孙承泽 · 本科二年级 · 独立完成**

Sun Chengze · Undergraduate (Year 2) · Independent Project

<sub>灵感源自 KIT 无压气机燃气轮机突破 · Inspired by KIT's compressorless gas turbine breakthrough (Feb 2026)</sub>

</div>
