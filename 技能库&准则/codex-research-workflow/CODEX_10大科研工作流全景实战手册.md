# Codex 10 大科研工作流全景实战手册 (小葛 AI / Nature Skills 全链路)

> **核心定位**：打通从“课题选题 $\to$ 文献检索 $\to$ 实验统计 $\to$ 顶刊绘图 $\to$ 论文写作与润色 $\to$ 审稿答辩 $\to$ 成果汇报 PPT”的完整科研闭环。

---

## 一、 10 大 Skill 阶段分工与在本项目的实战映射

| 阶段 | 核心 Skill | 触发功能与规范 | 在风电场偏航大创中的实战落地 |
|---|---|---|---|
| **01 选题** | `scientific-brainstorming` | 梳理研究方向，寻找创新切入点与空白区 | 确立从“单机对风”扩展到“3×3 阵列阶梯协同偏航”与“POD 流场降阶”的创新主线 |
| **02 检索** | `nature-academic-search` | 多源权威检索（Crossref/arXiv/Nature），严格 DOI 校验 | 检索 Fleming (NREL FLORIS)、Betz 极限、Brunton (POD/SVD) 经典文献 |
| **03 综述** | `nature-reader` & `literature-pipeline` | 双语对照 Markdown 阅读器，图文对应归纳 | 梳理尾流偏转模型（Jensen $\to$ Jimenez $\to$ GCH $\to$ CC）的演进脉络 |
| **04 统筹** | `academic-research-suite` | 结构化研究状态树（`research-state.yaml`） | 统一管理 4 位队友（田铭雨/袁夫达/厉今飞/洪祖名）的数据接口与交接契约 |
| **05 统计** | `nature-statistics` | 实验数据分布检验、置信区间与显著性检验 | 验证 3×3 阵列在不同风速下的净增益分布，输出置信区间与误差直方图 |
| **06 绘图** | `nature-figure` | Nature 规范多栏矢量科研插图（300 DPI） | 提取 FLORIS `.npz` 输出高保真流场云图（`scientific_cfd_fig.png`）与瀑布能量柱图 |
| **07 写作** | `nature-writing` | 经典顶刊结构（Hypothesis $\to$ Method $\to$ Results） | 编写大创中期报告与 Challenge Cup 申报书核心论证段落 |
| **08 润色** | `nature-polishing` | 彻底消除 AI 生成腔，精炼学术动词与客观语气 | 配合 `Stop-slop.md` 对文本进行去废话、去虚假排比与精准降噪 |
| **09 投稿** | `nature-reviewer` & `nature-response` | 模拟 3 位严苛审稿人打分，逐点撰写 Rebuttal | 模拟答辩专家针对“为何牺牲前排功率反而全场增益”进行尖锐质疑与防守演练 |
| **10 汇报** | `nature-paper2ppt` | 将学术图表与结论无损转换为高密度 PPTX | 编译生成 Swiss Grid 规范的 `王牌PPT.pptx` 与 20 页答辩演示文稿 |

---

## 二、 自动化调用与质量门禁

在多 Agent 架构中，这 10 个 Skill 按顺序作为串联流水线：
$$\text{01/02/03 输入端} \longrightarrow \text{04/05/06 实验与数据端} \longrightarrow \text{07/08 产出端} \longrightarrow \text{09/10 验收与交付端}$$
