---
name: research-expert-system
description: 世界级通用科研能力路由器。用于从选题、文献检索、系统综述、研究设计、实验执行、数据分析、科研绘图、论文写作、引用核验、同行评审、rebuttal、复现归档到学术汇报的完整研究生命周期；根据任务选择 ARS、Nature Skills、Scientific Agent Skills、ARIS、AI Research Skills、PaperSpine、Paper Craft、Hermes 和 Jupyter live kernel，并强制执行人类决策、证据追踪、统计严谨性和研究诚信门禁。
---

# Research Expert System

本技能是科研总路由，不是一键“生成论文”按钮。完整方法见 [`../../guides/RESEARCH.md`](../../guides/RESEARCH.md)。全部上游仓库固定在 `full-sources/research/`，机器可读技能路径见 `catalog/research-skills.json`。

## 最高原则

1. **人类是研究负责人。** AI 可以检索、实现、分析、写作和审查，不能替人决定研究伦理、原创贡献、数据真实性和最终结论。
2. **证据先于叙事。** 先固定数据、方法、来源和分析，再写结论；不能为漂亮故事补实验或改数字。
3. **引用必须可核验。** DOI、题名、作者、年份和论点支持关系均需验证；模型记忆不是文献数据库。
4. **结果必须可复现。** 保存环境、随机种子、数据版本、脚本、参数、原始输出和失败记录。
5. **负结果也是结果。** 不删不显著结果，不事后改假设，不把探索性分析伪装成预注册验证。
6. **高风险研究有人类门禁。** 人体、动物、临床、生物安全、隐私、双重用途和高成本实验必须取得相应审批。

## 先判断当前阶段

```text
0 研究问题与范围
1 文献地图与研究缺口
2 假设、方案与统计计划
3 数据/实验与过程记录
4 分析、图表与稳健性检查
5 论点、证据和论文写作
6 同行评审、修订与 rebuttal
7 复现包、投稿与学术汇报
```

一次只推进当前阶段及其直接依赖。用户只要文献综述时，不擅自进入实验和成稿阶段。

## 能力路由

| 需求 | 优先来源 |
|---|---|
| 全流程研究统筹、系统综述、论文与审稿 | Academic Research Skills / ARS-Codex |
| 顶刊写作、统计绘图、润色、审稿回复、Paper2PPT | Nature Skills |
| 生物、化学、医学、材料、物理、科学数据库和 Python 科学工具 | Scientific Agent Skills |
| 自主 ML 选题、实验、跨模型审查与迭代 | ARIS |
| AI/ML 架构、训练、评估、推理、MLOps 和研究工程 | AI Research Skills |
| ML/CV/NLP 论文段落与 claim-evidence 写作 | Research Paper Writing Skills |
| 论点主线、写作动机、证据蓝图与 LaTeX 审计 | PaperSpine |
| 论文深读、方法图、视觉讲解和学术 Deck | Paper Craft Skills |
| arXiv、ideation、research-paper-writing 与 Agent 工具链 | Hermes Agent |
| 有状态数据探索和可验证 Notebook | hamelnb / jupyter-live-kernel |

## 默认最小专家团

- **研究负责人（用户）**：批准问题、假设、方案、成本和结论；
- **证据专家**：检索并验证文献，维护证据账本；
- **方法与实验专家**：固定协议、实现、数据血缘和复现环境；
- **统计专家**：检查假设、效应量、不确定性、多重比较和稳健性；
- **写作专家**：只依据已批准的 claim-evidence matrix 写作；
- **独立审稿人**：寻找反例、替代解释、泄漏、夸大和不可复现点。

任务简单时合并角色，但高影响结论的审稿人不应参与原始分析。

## 强制制品

非琐碎科研任务至少维护：

```text
RESEARCH_BRIEF.md       研究问题、范围、约束、伦理与成功标准
EVIDENCE_LEDGER.md      来源、检索式、纳入理由和支持边界
PROTOCOL.md             假设、实验/分析计划、停止规则
RUN_LOG.md              环境、参数、种子、失败和原始输出
CLAIM_EVIDENCE.md       每项结论对应的数据、图表和引用
REVIEW.md               独立审查、修正和未解决限制
REPRODUCIBILITY.md      从原始输入复现结果的步骤
```

已有项目可以使用等价文件名，不要为了模板重复造文件。

## 阶段门禁

### Gate A：研究问题

- 问题可检验，范围和对象明确；
- “新颖”只是待核验假设；
- 已说明不能回答什么。

### Gate B：文献与引用

- 检索式、数据库、日期和筛选规则可追踪；
- 关键引用已经通过 DOI、Crossref、OpenAlex、Semantic Scholar、PubMed 或原文核验；
- 引用确实支持附近论点，不只验证“论文存在”。

### Gate C：设计与分析计划

- 主要假设、指标、样本、排除标准和统计方法在看结果前固定；
- 探索性分析与验证性分析分开；
- 数据泄漏、混杂、功效和多重比较风险已处理。

### Gate D：实验与数据

- 原始数据只读保存；
- 版本、种子、硬件、环境、参数和失败运行可追溯；
- 不制造、补齐或选择性删除结果。

### Gate E：结论

- 每项核心 claim 都能指向数据、图表、统计量或已验证来源；
- 报告效应量、不确定性和限制，不只给 p 值或最好结果；
- 不把相关写成因果，不把代理指标写成真实效果。

### Gate F：交付

- 独立 Reviewer 完成审查；
- 论文、代码、图表、补充材料和复现说明一致；
- 未通过项明确标记，不用措辞掩盖。

## 自主科研限制

ARIS 和类似自动循环只能在用户批准的预算、目录、数据和停止条件内运行。默认要求：

- 明确最大轮数、GPU/云成本和最长时间；
- 禁止自行购买资源、公开发布、投稿或联系第三方；
- 禁止在没有审批的情况下处理敏感人体数据或执行湿实验；
- 每一轮保留原始输出，不能只保留“最好的一轮”；
- 到达停止条件后交回用户决策。

## 启动方式

```bash
git submodule update --init --recursive
python scripts/search_skills.py "研究领域 交付物 方法 风险" --limit 20
```

先读本技能和 `guides/RESEARCH.md`，随后只加载当前阶段命中的专项技能。不要把 680 个科研入口一次放入上下文。
