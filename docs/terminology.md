# 📖 术语统一表（D32 · 全站文案对照）

> 用途：全站（README / 网页 / API / devlog）术语与单位统一口径，供 D32–33 终稿校对与后续新增内容对照。
> 维护：新增文案前先查本表；新增术语后补录。

## 1. 站名与叙事

| 术语 | 规范用法 | 说明 |
|---|---|---|
| 站名 | **AI 赋能的叶轮机械多学科设计优化平台** | 唯一正式名称；英文 AI-Enabled Multidisciplinary Design Optimization Platform for Turbomachinery |
| 上位概念 | **叶轮机械 Turbomachinery** | 压气机/涡轮同属；禁止只说「涡轮平台」 |
| KIT 事件 | 行业**引子**，非项目对象 | 标准表述：KIT 无压气机氢燃料燃气轮机连续运行 303 秒，破 NASA 250 秒纪录 |
| 技术载体 | **NASA Rotor 37 压气机**（PLAID 数据集） | 方法学互通：压气机与涡轮同属叶轮机械 |

## 2. 核心术语（保留英文不翻译）

| 术语 | 规范 | 说明 |
|---|---|---|
| 代理模型 | Surrogate Model | 不译 |
| 残差网络 | Residual Network | — |
| 不确定性量化 | Uncertainty Quantification (UQ) | — |
| MC Dropout | MC Dropout | 不译 |
| 多目标优化 | NSGA-II | 不译 |
| ONNX | ONNX | 不译 |
| Pareto 前沿 | Pareto Front / Pareto 解 | — |
| 外推 | Extrapolation | 可注中文「外推」 |
| 物理约束 | Physics Constraints | — |
| 特征工程 | Feature Engineering | — |

## 3. 输出变量（API 字段名，全站统一）

| 中文 | 英文 | 符号 | API 字段 |
|---|---|---|---|
| 总压比 | Compression ratio | π | `Compression_ratio` |
| 等熵效率 | Isentropic efficiency | η | `Efficiency` |
| 质量流量 | Mass flow | ṁ | `Massflow` |

> ⚠️ API 字段名是 `Efficiency` / `Massflow` / `Compression_ratio`（不是 efficiency/mass_flow/pressure_ratio）。

## 4. 单位（2026-07-31 修正，Day 32）

| 变量 | 单位 | 依据 | 修正前 |
|---|---|---|---|
| Ω（转速） | **rad/s** | Rotor 37 设计转速 16,188 rpm ≈ 1,695 rad/s；数据范围 1620–1800 rad/s | ❌ 曾标 rpm（量级差 4–5 倍） |
| P（背压） | Pa（展示时可用 kPa） | 数据范围 ~359–377 kPa | — |
| Pressure_mean | Pa（展示可用 kPa） | ~107 kPa | — |
| Pressure_std | Pa | — | — |
| Temperature_mean | K | ~349 K | — |
| Density_mean | kg/m³ | — | — |
| CoordinateX/Y/Z_mean | **m** | 径向均值 ~0.22 m | ❌ 曾标 mm |

**修正落点**：`ExplorePage` UNITS 表、`PredictPage` 滑块 unit 与历史条目、D21 `OptimizePage` 工况卡（原本就正确）。

## 5. 双语格式（§4.1 规范）

- 中文在前，英文紧随：小一号（-1~2px）、灰色 `#475569`（暗）或 `#64748b`。
- 短标签模式：`总压比 R² Total Pressure Ratio R²`；长段落模式：中文句 + `<br/>` + 英文 span。
- JSX 中 `>` 必须写 `&gt;`。

## 6. 其他统一口径

| 项 | 规范 |
|---|---|
| R² 口径 | 留出测试集 n=100, random_state=42；README/网站/API 统一（API 含 `r2_evaluated_on` 字段） |
| NSGA-II 结果 | max η 0.9173 / max ṁ 21.74 kg/s / max π 2.1073（backend/scripts 一键复现，同源） |
| 加速比表述 | 网站保守「~100,000×」；README 注明端到端量级 ~10⁶ |
| 部署域名 | 前端 turbine-blade-ai-scz.pages.dev；后端 turbine-blade-api-c4f40.containers.snapdeploy.app |
