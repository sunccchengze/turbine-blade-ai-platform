# 世界级科研能力使用指南

本指南把仓库中的科研技能组织成一套可审计、可复现、有人类门禁的研究系统。它追求的是更可靠的科研过程，不承诺“自动产出顶刊论文”。

## 1. 已全量固定的科研源

所有项目均以 Git 子模块固定到明确提交。初始化后可获得完整 SKILL、references、scripts、assets、测试、示例及项目工具。

| 来源 | 固定能力 | 技能入口 | 许可证状态 |
|---|---|---:|---|
| Academic Research Skills | 深度研究、写作、评审和 10 阶段 pipeline | 4 | CC BY-NC 4.0，仅非商业 |
| ARS-Codex | ARS 的 Codex 原生适配 | 2 | CC BY-NC 4.0，仅非商业 |
| Nature Skills | 检索、统计、绘图、写作、润色、回复和 PPT | 19 | Apache-2.0 |
| Scientific Agent Skills | 生命科学、医学、化学、材料、物理、数据库和计算工具 | 161 | MIT |
| ARIS | 自主 ML 选题、实验、审查、写作与 rebuttal | 187 | MIT |
| AI Research Skills | AI/ML 研究工程全栈 | 98 | MIT |
| Research Paper Writing Skills | ML/CV/NLP 学术写作 | 1 | MIT |
| PaperSpine | 论文论点主线、证据蓝图、改稿和 LaTeX 审计 | 5 | MIT |
| Paper Craft Skills | 论文深读、方法图、文章和 Deck | 3 | README 声明 MIT，但无独立 LICENSE |
| Hermes Agent | research-paper-writing、arxiv、ideation、Notebook 等 | 197 | MIT |
| hamelnb | live Jupyter kernel 与变量/单元格操作 | 3 | 未发现明确许可证 |

机器目录：[`../catalog/research-skills.json`](../catalog/research-skills.json)。来源锁：[`../catalog/sources.lock.json`](../catalog/sources.lock.json)。

> 技能数量是固定提交中的 `SKILL.md` 路径数，不是质量排名。相同技能可能在不同项目中重复，实际使用时仍执行最小组队。

## 2. 初始化

```bash
git submodule update --init --recursive
```

只初始化科研源：

```bash
git submodule update --init --recursive full-sources/research
```

生成去除冗余压缩档的本地全量科研工作区：

```bash
python scripts/materialize_full_library.py
```

科研项目会出现在 `full-library/research/<source-id>/`。该目录被 Git 忽略，不向主仓库提交。

## 3. 科研技能搜索

```bash
python scripts/search_skills.py "systematic review citation verification" --limit 20
python scripts/search_skills.py "RNA-seq differential expression pathway" --limit 20
python scripts/search_skills.py "ML experiment ablation reproducibility" --limit 20
python scripts/search_skills.py "论文 论点 证据 改稿 LaTeX" --limit 20
python scripts/search_skills.py "arxiv ideation jupyter live kernel" --limit 20
```

搜索结果中的 `full-source` 路径只有在初始化子模块后才能直接读取。

## 4. 研究项目启动简报

```markdown
# RESEARCH_BRIEF

## 负责人和决策权
- 研究负责人：
- AI 可自主执行：
- 必须人工批准：

## 研究问题
- 目标问题：
- 研究对象和范围：
- 明确不回答：

## 当前证据
- 已有数据：
- 已有文献：
- 已有代码/模型：
- 未验证假设：

## 方法边界
- 研究类型：探索 / 验证 / 系统综述 / 复现 / 方法开发
- 主要指标：
- 约束与预算：
- 停止规则：

## 伦理与合规
- 人体/动物/临床：
- 隐私和敏感数据：
- 双重用途风险：
- 所需审批：

## 交付
- 论文/报告/代码/数据/图表/演示：
- 目标 venue：
- 截止时间：
- 验收与复现方式：
```

## 5. 完整科研生命周期

### 阶段 0：问题定义

目标是得到可检验的问题，不是漂亮题目。

检查：

- 对象、干预/变量、对照和结果是否明确；
- 贡献属于新现象、新方法、新数据、新解释还是工程改进；
- 成功和失败如何定义；
- 哪些结论超出当前设计能力。

推荐：ARS Socratic、Hermes ideation、ARIS idea-discovery。最终问题必须由研究负责人批准。

### 阶段 1：文献与证据地图

建立可复查检索，而不是让模型凭记忆列论文。

至少记录：

- 数据库和检索日期；
- 完整检索式；
- 纳入/排除规则；
- 去重方法；
- 每篇材料的 DOI/URL、版本和访问日期；
- 结论由原文哪一页、图、表或段落支持。

系统综述按领域选择 PRISMA 等规范。引用存在性和论点支持关系要分开核验。

### 阶段 2：假设、协议和统计计划

在读取最终结果前固定：

- 主要/次要假设；
- 主要/次要指标；
- 样本量或功效依据；
- 数据排除与异常值规则；
- 统计模型、协变量和多重比较处理；
- 消融、对照、基线和稳健性分析；
- 停止规则。

事后新增分析必须标为探索性。

### 阶段 3：数据与实验

数据血缘：

```text
原始输入（只读）
  → 清洗脚本
  → 分析数据
  → 实验配置
  → 原始输出
  → 汇总表
  → 图表和论文数字
```

每个数字应能沿链路追溯。保存环境锁、代码提交、种子、硬件、配置、日志和失败运行。

ARIS 或 AI Research Skills 可执行 ML 实验，但必须限制目录、成本、时间、GPU 和外部服务权限。

### 阶段 4：分析与可视化

统计审查：

- 模型假设是否成立；
- 是否存在数据泄漏和重复测量处理错误；
- 是否报告效应量和置信区间；
- 多重比较是否控制；
- 缺失数据如何处理；
- 结论对参数、样本和随机种子是否稳健；
- 图表是否展示分布，而非只展示均值；
- 坐标轴、单位、误差条和样本量是否完整。

使用 hamelnb 做探索时，最终必须重启 kernel 并从头运行，不能只依赖存活状态。

### 阶段 5：Claim–Evidence Matrix

写论文前建立：

| Claim ID | 结论 | 类型 | 数据/图表 | 统计证据 | 文献支持 | 限制 | 状态 |
|---|---|---|---|---|---|---|---|
| C-01 |  | 主要/次要/探索 |  |  |  |  | draft/verified/rejected |

没有证据行的 claim 不进入摘要和结论。背景引用不能替代本研究数据，相关性不能写成因果。

### 阶段 6：论文写作

推荐组合：

```text
总控：research-expert-system / ARS-Codex
论点：PaperSpine
段落：Research Paper Writing Skills 或 Nature Writing
统计与图：Nature Skills / Scientific Agent Skills
风格审校：human-writing 或 humanizer-zh（不能改动科学含义）
```

写作顺序可按项目选择，但摘要必须最后根据已验证正文更新。所有表格、正文数字、补充材料和代码输出必须一致。

### 阶段 7：同行评审、修订和 Rebuttal

独立 Reviewer 检查：

- 新颖性是否只在有限检索范围内成立；
- 方法是否能回答研究问题；
- 基线和消融是否公平；
- 数据和代码能否支持每项结论；
- 有无过度宣称、遗漏负结果或选择性报告；
- 图表和文字是否矛盾；
- 引用是否准确；
- 复现材料是否足够。

修订使用可追踪矩阵：审稿意见 → 判断 → 修改位置 → 新证据 → 未采纳理由。不得伪造补实验。

### 阶段 8：复现、投稿与传播

发布包至少包括：

- README 和运行顺序；
- 环境与依赖锁；
- 数据来源、许可和校验值；
- 主分析脚本；
- 生成图表和表格的脚本；
- 配置、种子与预计资源；
- 已知差异和不可复现部分；
- AI 使用披露（遵循 venue 要求）。

Paper Craft 和 Nature Skills 可生成汇报或视觉解释，但传播材料不得比论文证据更强。

## 6. 专家团配置

### 文献综述

```text
负责人：用户
总控：ARS deep-research
检索与证据：Hermes arxiv + Scientific Agent 数据库技能
审查：citation verification + independent reviewer
```

### 生物/医学/化学研究

```text
总控：research-expert-system
领域计算：Scientific Agent Skills
统计：statistical-analysis / power
写作：Nature Skills
审查：领域专家 + 伦理/隐私审查
```

医疗技能仅支持科研，不替代临床诊断和治疗决策。

### AI/ML 研究

```text
总控：ARS-Codex 或 ARIS research-pipeline
研究工程：AI Research Skills
实验：ARIS + hamelnb
论文：PaperSpine + Research Paper Writing Skills
审查：ARIS adversarial review + 人类研究负责人
```

### 论文改稿

```text
证据审计：PaperSpine
结构/段落：Research Paper Writing Skills
期刊表达与图表：Nature Skills
独立审稿：ARS reviewer
```

不得通过“润色”改变结果方向、效应大小和限制。

### 文献汇报与方法图

```text
深读：Paper Craft paper-analyzer
论点核验：PaperSpine
图/Deck：Paper Craft + Nature Skills
审查：原论文逐图逐 claim 对照
```

## 7. 研究证据等级

可按项目调整，但必须在项目内一致：

| 等级 | 含义 | 可支持的措辞 |
|---|---|---|
| E0 | 想法或未验证假设 | “我们假设”“待验证” |
| E1 | 文献或静态材料支持 | “已有研究报告”并附来源 |
| E2 | 探索性分析/单次实验 | “初步观察到” |
| E3 | 预定协议、多次运行和稳健性检查 | “结果支持” |
| E4 | 独立复现、外部验证或真实部署 | “在指定边界内得到验证” |

不能用更高等级措辞包装较低等级证据。

## 8. 自动化科研安全阀

在启动无人值守循环前写清：

```yaml
max_rounds: 3
max_wall_time_hours: 4
max_compute_cost: 20 USD
allowed_directories:
  - experiments/
allowed_network:
  - arxiv.org
  - api.crossref.org
human_approval_required_for:
  - changing primary hypothesis
  - purchasing compute
  - external publication
  - deleting raw data
stop_on:
  - budget exceeded
  - repeated failure twice
  - evidence integrity failure
```

不要允许 Agent 无限循环、无限花费或自行发布。

## 9. 研究诚信红线

- 不编造论文、DOI、作者和引用；
- 不编造或补齐实验数据；
- 不删除不符合预期的样本或运行，除非按预定规则；
- 不 p-hacking、HARKing 或只报告最好种子；
- 不把模型生成的解释当机制证据；
- 不将私密数据发送给未批准的模型服务；
- 不绕过 IRB、伦理审查、生物安全或数据许可；
- 不代写需要申明个人原创的作业或审稿意见；
- 不隐瞒 AI 在文稿和分析中的实质参与。

## 10. 最终交付清单

- [ ] 研究问题和范围由负责人确认；
- [ ] 检索过程可复查；
- [ ] 关键引用存在且支持对应论点；
- [ ] 协议、假设和探索性分析已区分；
- [ ] 数据血缘、环境、种子和运行日志完整；
- [ ] 统计方法、效应量、不确定性和限制完整；
- [ ] 每项核心 claim 有证据映射；
- [ ] 独立审查已完成；
- [ ] 论文、图表、代码和补充材料一致；
- [ ] 复现说明经过从头运行验证；
- [ ] 许可、隐私、伦理和 AI 披露已检查；
- [ ] 未验证内容没有被写成事实。
