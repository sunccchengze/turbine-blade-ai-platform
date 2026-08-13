# SKILL 运用指南

> 本文件是孙承泽通用技能仓库的完整操作手册。它回答五个问题：怎么找到技能、怎么选、怎么组合成专家团、怎么执行、怎么证明交付合格。
>
> 本仓库不预设具体专业方向。目标项目的事实、用户要求和验收标准始终高于历史技能中的项目偏好。

---

## 0. 先看结论

使用本仓库时，默认执行下面这条最短链路：

```text
读目标项目
  → 写清任务和验收标准
  → 搜索 8–12 个候选技能
  → 选 1 个主技能 + 0–2 个支撑技能 + 0–1 个审查技能
  → 只加载命中的 SKILL.md 和必要 references
  → 按制品契约执行
  → 用实际命令、来源或渲染结果验证
  → 交付结果、证据和剩余限制
```

四条底线：

1. **不全量加载。** 两千多个技能同时进入上下文，只会互相干扰。
2. **不按名气选技能。** 看任务匹配度、输入输出和验证方法。
3. **不把历史项目事实带进新项目。** 风电、叶轮机械、校园公益等内容只是历史来源，不是全局默认。
4. **没有验证，不宣布完成。** “应该能用”不等于已经通过。

---

## 1. 仓库里现在有什么

以当前 `catalog/skills.json` 为准，仓库共发现 **2,265 个 `SKILL.md` 入口**。

| 层级 | 数量 | 含义 | 默认使用方式 |
|---|---:|---|---|
| `router` | 1 | 根路由技能 | 每个新项目先读 |
| `maintained` | 9 | 本仓库直接维护或明确装载的核心技能 | 优先使用 |
| `community` | 1,556 | 历史技能并集选出的资源完整主版本 | 按任务搜索 |
| `variant` | 697 | 同名但正文不同的备选版本 | 主版本不合适时再读 |
| `tool-bundled` | 2 | OpenWiki 随工具附带的技能 | 使用对应工具时读取 |

### 全量源与快索引

仓库采用两层结构：

- **全量权威层**：`full-sources/`。固定到每个上游提交，包含完整技能包、完整资源和完整项目代码；
- **快速检索层**：`skills/community/`、`skills/variants/` 和 `catalog/skills.json`。用于快速搜索与渐进加载，不代表上游完整文件边界。

首次克隆后执行：

```bash
git submodule update --init --recursive
```

如需一个去重后的完整工作目录：

```bash
python scripts/materialize_full_library.py
```

输出位于被忽略的 `full-library/`。默认删除已有解压内容的压缩副本；同路径、不同内容的文件会保留到 `source-variants/`，不会静默覆盖。

### 1.1 维护级技能

| 技能 | 用途 | 入口 |
|---|---|---|
| `universal-skill-router` | 通用检索和最小组队 | [`../SKILL.md`](../SKILL.md) |
| `human-writing` | 中文创作、改稿、现实与虚构边界 | [`../skills/human-writing/SKILL.md`](../skills/human-writing/SKILL.md) |
| `humanizer-zh` | 系统识别和清除中文 AI 痕迹 | [`../skills/humanizer-zh/SKILL.md`](../skills/humanizer-zh/SKILL.md) |
| `stop-slop` | 快速删除模板腔和空泛表达 | [`../skills/stop-slop/SKILL.md`](../skills/stop-slop/SKILL.md) |
| `victor-design-system` | 海报、演示、产品 UI 的证据驱动设计 | [`../skills/victor-design/SKILL.md`](../skills/victor-design/SKILL.md) |
| `openwiki` | 生成和维护代码库 Agent 文档 | [`../skills/openwiki/SKILL.md`](../skills/openwiki/SKILL.md) |
| `screencoder` | 将 UI 截图重建为可编辑 HTML/CSS | [`../skills/screencoder/SKILL.md`](../skills/screencoder/SKILL.md) |
| `research-expert-system` | 全科研生命周期路由、证据与研究诚信门禁 | [`../skills/research-expert-system/SKILL.md`](../skills/research-expert-system/SKILL.md) |
| `ai-cabinet-decision-making` | 重要决策的五席位压力测试 | [`../skills/ai-cabinet/SKILL.md`](../skills/ai-cabinet/SKILL.md) |
| `multi-agent-orchestration` | 复杂任务的多 Agent 编排 | [`../skills/multi-agent-orchestration/SKILL.md`](../skills/multi-agent-orchestration/SKILL.md) |

> 表中包含根路由，因此入口数比 `maintained` 层级多一个。

### 1.2 社区技能大类

非 variant 主入口目前按目录元数据分为：

| 分类 | 数量 | 典型内容 |
|---|---:|---|
| `agents-orchestration` | 685 | Agent、MCP、记忆、工作流、技能开发 |
| `design-media` | 410 | UI、视觉、演示、图像、视频和动效 |
| `engineering-code` | 117 | 编码、测试、调试、前后端和 API |
| `security-compliance` | 110 | 安全、隐私、合规和审计 |
| `business-strategy` | 81 | 产品、市场、运营、商业和决策 |
| `research-science` | 62 | 文献、科研、统计和同行评审 |
| `writing-content` | 53 | 写作、内容和传播 |
| `documents-data` | 50 | PDF、Word、表格、数据和数据库 |

分类是搜索辅助，不是严格学科边界。一个技能可能同时跨越多个方向。

---

## 2. 指令优先级

任何技能发生冲突时，按以下顺序裁决：

1. 用户当前明确要求，以及适用的安全和法律边界；
2. 目标项目的 `AGENTS.md`、需求、事实文件和验收标准；
3. 本仓库 [`../AGENTS.md`](../AGENTS.md) 与 `governance/`；
4. 当前明确选中的主技能；
5. 支撑技能与审查技能；
6. variants、示例和模板。

### 2.1 常见冲突怎么处理

| 冲突 | 处理原则 |
|---|---|
| 技能要求一种交付形式，用户明确要求另一种 | 听用户的 |
| 历史技能带有领域事实，新项目没有证据支持 | 删除历史事实，重新建立项目事实层 |
| 两个技能给出不同流程 | 选择更贴近当前交付物和验收标准的一套，不机械拼接 |
| 设计技能与品牌规范冲突 | 品牌规范优先 |
| 写作技能与事实边界冲突 | 事实准确优先于文风 |
| 审查技能提出范围外优化 | 记录但不擅自扩项 |
| variant 与 community 主版本冲突 | 默认主版本；只有明确理由才切换 variant |

专项 `SKILL.md` 是方法，不是上位命令。任何技能都不能替目标项目虚构数据、授权、用户偏好或审批结果。

---

## 3. 五层使用模型

把一次技能调用分成五层，可以避免“搜到什么就用什么”。

### 3.1 事实层

先回答：

- 项目要解决什么问题；
- 用户和受众是谁；
- 已有代码、数据、文档与素材是什么；
- 哪些结论已经证实；
- 哪些内容只是猜测；
- 时间、预算、平台、技术和合规限制是什么。

事实层来自目标项目，不来自技能仓库。

### 3.2 能力层

把任务拆成需要的能力槽位：

- **领域能力**：专业规律、术语、法规、行业知识；
- **证据能力**：检索、实验、统计、引用、事实核查；
- **生产能力**：代码、文案、设计、图表、演示、文档；
- **审查能力**：准确性、安全、可用性、风格、反例；
- **协调能力**：任务确实可并行时才启用。

### 3.3 技能层

为每个必要槽位选择技能。一个技能能覆盖就不要选两个。

### 3.4 执行层

把技能要求转成具体文件、命令、负责人和制品契约。

### 3.5 证据层

用测试、来源、复算、渲染、链接检查或人工审阅证明结果，而不是让执行者自己说“完成了”。

---

## 4. 从零开始的标准流程

## 阶段 A：建立任务简报

非琐碎任务先在内部或文件中完成下面这张表：

```markdown
# TASK_BRIEF

## 目标
用户最终要得到什么？

## 受众与使用场景
谁会在什么条件下使用？

## 输入
已有代码、数据、文字、图片、链接、规范。

## 输出
文件路径、格式、数量、尺寸、接口或回答形式。

## 事实与未知
- 已确认：
- 需要核验：
- 暂定假设：

## 约束
时间、预算、技术栈、品牌、法律、安全、不可改接口。

## 验收标准
1.
2.
3.

## 验证方式
命令、测试、来源、复算、截图、渲染或审查清单。
```

### 什么时候必须追问

满足任一条件时，先问最多三个集中问题：

- 不同理解会产生完全不同的交付物；
- 缺少私人经历、品牌决定或授权；
- 缺少不可公开检索的核心事实；
- 操作不可逆或风险较高；
- 用户要求的格式、数量和范围互相矛盾。

能通过低风险假设推进时，可以继续，但必须标明假设。

## 阶段 B：生成搜索词

搜索词使用下面的结构：

```text
领域词 + 交付物 + 方法或风险
```

不要只搜“设计”“研究”“代码”。示例：

```bash
python scripts/search_skills.py "React dashboard accessibility testing" --limit 12
python scripts/search_skills.py "中文 人物稿 事实核查" --limit 12
python scripts/search_skills.py "生物信息 文献综述 统计" --limit 12
python scripts/search_skills.py "海报 subject evidence editable delivery" --limit 12
python scripts/search_skills.py "API security threat review" --limit 12
```

中英文术语混搜通常更容易命中不同来源的技能。

### 搜索命令

```bash
# 默认搜索，不显示 variants
python scripts/search_skills.py "关键词" --limit 12

# 限定分类
python scripts/search_skills.py "关键词" \
  --category research-science \
  --limit 12

# 比较同名不同版本
python scripts/search_skills.py "关键词" \
  --include-variants \
  --limit 20

# 输出 JSON，便于 Agent 二次筛选
python scripts/search_skills.py "关键词" --json
```

可用分类：

```text
agents-orchestration
business-strategy
design-media
documents-data
engineering-code
research-science
security-compliance
writing-content
general
```

## 阶段 C：筛选候选技能

不要只看技能名。逐项检查：

1. **触发条件**：它是否真的适用于当前任务；
2. **输入契合度**：它要求的资料和工具是否存在；
3. **输出契合度**：它能否产生用户要求的载体；
4. **证据能力**：它有没有验证步骤或质量门禁；
5. **上下文成本**：它是否过重，是否引入无关规则；
6. **冲突风险**：它是否携带不属于当前项目的强制偏好。

可以用 0–2 分快速打分：

| 指标 | 0 分 | 1 分 | 2 分 |
|---|---|---|---|
| 目标匹配 | 偏题 | 部分匹配 | 直接命中 |
| 交付形式 | 不支持 | 可适配 | 原生支持 |
| 项目兼容 | 明显冲突 | 需裁剪 | 直接兼容 |
| 可验证性 | 无门禁 | 有检查表 | 有命令或明确证据 |
| 上下文成本 | 很重 | 中等 | 精简 |

优先选总分高且没有硬冲突的技能。分数只是筛选器，不能取代判断。

## 阶段 D：最小组队

默认配置：

```text
1 个主技能
0–2 个支撑技能
0–1 个独立审查技能
```

### 主技能

对最终交付物负责。例如：

- 写中文长文：`human-writing`；
- 做海报或产品 UI：`victor-design-system`；
- 修复杂 Bug：`systematic-debugging`；
- 写科研报告：`scientific-writing`；
- 建代码库 Wiki：`openwiki`。

### 支撑技能

只补主技能缺少的能力。例如：

- `literature-review` 补文献；
- `statistical-analysis` 补统计；
- `accessibility` 补无障碍；
- `docx`、`pptx`、`xlsx` 补具体文件生产；
- `humanizer-zh` 补中文审校。

### 审查技能

尽量与生产者分开：

- `verification-before-completion`；
- `peer-review`；
- `security-review`；
- `webapp-testing`；
- `stop-slop`。

### 何时允许超过四个技能

只有任务同时包含多个独立交付物、明显不同的专业领域，或高风险审查要求时才增加。每新增一个技能，都要能指出它填补了哪个能力缺口。

## 阶段 E：渐进加载

按这个顺序读取：

1. 候选技能的 frontmatter 和 `SKILL.md`；
2. 主技能明确要求的 references；
3. 当前任务确实要运行的 scripts；
4. 必须复用的 templates 或 assets；
5. 只有主版本不适用时才读 variants；
6. 快索引未包含所需资源时，从对应 `full-sources/` 完整包继续读取。

禁止为了“保险”把整个 collection 加入上下文。

### 上下文预算建议

```text
第 1 轮：只看搜索结果，保留 8–12 个候选
第 2 轮：打开 3–5 个 SKILL.md
第 3 轮：确定 1–4 个技能
第 4 轮：只加载被选技能要求的 references
```

## 阶段 F：记录技能方案

复杂任务建议留下一个简短方案：

```markdown
# SKILL_PLAN

## 主技能
- 名称：
- 负责：
- 选择理由：

## 支撑技能
- 名称：
- 补足能力：

## 审查技能
- 名称：
- 否决条件：

## 明确不使用
- 技能：
- 原因：与项目冲突 / 重复 / 上下文过重

## 冲突裁决
目标项目的哪条规则覆盖了技能默认值？
```

简单任务不需要创建文件，在内部确认即可。

## 阶段 G：执行与验证

统一工作循环：

```text
Think → Spec → Implement → Verify → Deliver
```

- **Think**：区分事实、假设和未知；
- **Spec**：固定范围、接口、制品和验收标准；
- **Implement**：完成最小但完整的实现；
- **Verify**：取得实际测试、来源、复算或渲染证据；
- **Deliver**：交付结果，说明证据和剩余限制。

完整门禁见 [`../governance/QUALITY_GATES.md`](../governance/QUALITY_GATES.md)。

---

## 5. 任务路由矩阵

下面是起点，不是固定配方。先搜索，再根据项目裁剪。

| 任务 | 建议主技能 | 常用支撑 | 常用审查 |
|---|---|---|---|
| 需求尚不清楚 | `brainstorming` | `ai-cabinet-decision-making` | 用户确认 |
| 重要路线选择 | `ai-cabinet-decision-making` | 领域检索技能 | 执行可行性复核 |
| 修复复杂 Bug | `systematic-debugging` | `test-driven-development` | `verification-before-completion` |
| 开发新功能 | `writing-plans` 或相应工程技能 | `test-driven-development` | `security-review` / 回归测试 |
| Web 产品 UI | `victor-design-system` 或 `frontend-design` | `ui-ux-pro-max`, `accessibility` | `webapp-testing` |
| 海报、主视觉 | `victor-design-system` | 图像或品牌技能 | 真实渲染审查 |
| UI 截图转 HTML/CSS | `screencoder` | `frontend-design`, `accessibility` | `webapp-testing` + 截图对比 |
| PPT/答辩 | `victor-design-system` + `pptx` | `scientific-writing` / 内容技能 | 可读性与可编辑性交付审查 |
| 中文长文 | `human-writing` | 检索或领域技能 | `humanizer-zh` / `stop-slop` |
| 科研综述 | `research-expert-system` / `literature-review` | `deep-research` | `peer-review` |
| 科研论文 | `scientific-writing` | `statistical-analysis` | `peer-review` |
| 数据分析 | 对应领域或数据技能 | `statistical-analysis`, `xlsx` | 复算与边界值检查 |
| Word 文档 | `docx` | 写作或研究技能 | 版式与链接检查 |
| PDF 处理 | `pdf` | OCR/提取技能 | 页数、文字与渲染检查 |
| 表格交付 | `xlsx` | 数据分析技能 | 公式、单位和样本复算 |
| 安全评审 | `security-review` | 栈相关安全技能 | 独立红队 |
| 代码库文档 | `openwiki` | `mermaid-diagrams` | 源码事实核对 |
| 自定义连接器 | `write-connector` | MCP/API 技能 | 密钥与权限审查 |
| 多交付物并行 | `multi-agent-orchestration` | 各 Worker 专项技能 | 独立 Reviewer |

### 5.1 编码任务推荐链

```text
brainstorming（需求分叉明显时）
  → writing-plans
  → test-driven-development
  → 具体语言/框架技能
  → systematic-debugging（出现异常时）
  → verification-before-completion
```

不要为了“流程完整”把整条链全部加载。没有分叉就不用 brainstorming；没有 Bug 就不用 systematic-debugging。

### 5.2 研究任务推荐链

完整科研体系先读 [`RESEARCH.md`](RESEARCH.md)，统一入口使用 `research-expert-system`。

```text
问题定义
  → literature-review / deep-research
  → 领域技能
  → statistical-analysis
  → scientific-writing
  → peer-review
```

研究交付必须区分：

- 原始来源结论；
- 仓库或实验实测；
- 工程假设；
- 模型推断；
- 尚未验证的问题。

### 5.3 中文写作推荐链

```text
事实材料检查
  → human-writing
  → 领域事实核查
  → humanizer-zh 或 stop-slop 二选一审校
```

- `human-writing` 负责从材料、说话位置和文体出发完成作品；
- `humanizer-zh` 适合系统清理多类中文 AI 模式；
- `stop-slop` 适合快速删空话和模板结构；
- 不建议同时让两个审校技能轮番重写，否则容易把作者声音磨平。

### 5.4 视觉设计推荐链

```text
确认载体与读者动作
  → victor-design-system
  → 读取一个对应 adapter
  → 按需加入 pptx / frontend-design / accessibility
  → 查看真实渲染
  → 通过交付门禁
```

设计任务不能只检查代码。必须查看实际页面、图片、幻灯片或导出文件。

### 5.5 OpenWiki 推荐链

```text
读目标代码库
  → openwiki
  → 设置 openwiki/INSTRUCTIONS.md
  → 生成或 update
  → 核对源码事实和 Mermaid
  → 审阅 diff
```

OpenWiki 源码位于 `tools/openwiki/`。凭证只能放用户环境或 CI secrets，不能提交到项目。

### 5.6 UI 截图转代码推荐链

```text
确认截图角色、目标视口和复刻边界
  → screencoder 建立可编辑 HTML/CSS 基线
  → 对齐区域、文字、图片和组件
  → Playwright 真实渲染与截图对比
  → accessibility / webapp-testing
  → 如需再设计，再调用 victor-design-system
```

先完成忠实基线，再做创意改造。不得用整张截图作为网页背景冒充实现；API key 只能放 ScreenCoder 的隔离工作副本，不能提交。

---

## 6. 专家团怎么组

专家团按职责建立，不按名人数量建立。

## 6.1 单 Agent 模式

适用于：

- 任务范围小；
- 只有一个交付物；
- 专业上下文一致；
- 可以在一个上下文中完成和验证。

一个 Agent 也可以依次使用主技能和审查技能，不必强行分角色。

## 6.2 双角色模式

```text
Producer：负责研究或制作
Reviewer：独立检查验收标准
```

适用于重要文案、代码变更、视觉交付和数据结论。

## 6.3 标准四角色模式

```text
总协调者
  ├─ 领域/证据 Worker
  ├─ 制作/实现 Worker
  ├─ 验证 Worker
  └─ 独立 Reviewer
```

角色可合并，但 Reviewer 在高风险任务中最好不参与原实现。

### 角色契约模板

```markdown
## 角色
领域证据审查员

## 输入
数据字典、候选结论、来源列表。

## 职责
核对单位、适用范围、证据等级和因果表述。

## 输出
review/domain-evidence.md

## 完成定义
每项结论都有通过/失败、依据和修改建议。

## 禁止
不改实现代码；不用常识补缺失数据。
```

## 6.4 什么时候不该用多 Agent

- 只改一个小文件；
- 子任务需要频繁共享未冻结状态；
- 多个 Agent 必须同时编辑同一文件；
- 协调成本高于执行成本；
- 用户只要一个快速直接的答案。

多 Agent 详细规则见 [`../governance/MULTI_AGENT_ORCHESTRATION.md`](../governance/MULTI_AGENT_ORCHESTRATION.md)。

---

## 7. 制品契约

Agent 之间不要交接“我大概弄好了”。交接必须落到可检查制品。

```markdown
# ARTIFACT_CONTRACT

## 输入
- 文件/来源：
- 版本/时间：

## 允许修改
- 路径：
- 禁止触碰：

## 输出
- 路径：
- 格式：
- 数据模式或接口：

## 验收
- 命令：
- 人工检查：

## 失败处理
- 谁返工：
- 哪些检查必须重跑：
```

### 常见制品

- 研究：来源表、证据账本、数据集、统计结果；
- 编码：补丁、测试、构建日志、迁移文件；
- 数据：CSV/JSON schema、复算脚本、图表；
- 设计：任务简报、母版、素材账本、真实渲染、可编辑源文件；
- 写作：材料清单、正文、少量关键来源；
- 审查：逐项通过/失败、证据、影响和最小修正。

---

## 8. 主版本、variant 和重复技能

## 8.1 默认选择顺序

```text
目标项目本地技能
  → maintained
  → community 主版本
  → tool-bundled
  → variant
```

目标项目本地技能最了解本项目，但仍不能覆盖用户明确要求。

## 8.2 什么时候查看 variant

- community 主版本依赖目标环境没有的工具；
- 主版本语言或框架不合适；
- 主版本规则与目标载体冲突；
- 需要比较不同方法；
- 为项目制作本地 adapter，需要吸收多版优点。

查看方式：

```bash
python scripts/search_skills.py "准确技能名" --include-variants --json
```

选择 variant 后，在 `SKILL_PLAN` 里记录路径和理由。不要把多个版本的所有规则直接合并。

## 8.3 完全相同的副本

字节完全相同的历史副本不重复保存。别名、原路径和 SHA-256 位于：

- [`../catalog/import-report.json`](../catalog/import-report.json)
- [`../catalog/sources.lock.json`](../catalog/sources.lock.json)

---

## 9. 质量门禁

## 9.1 所有任务都检查

- 交付形式是否与用户要求一致；
- 是否混入未经证实的事实；
- 是否满足范围和验收标准；
- 是否有实际验证证据；
- 是否说明未验证部分。

## 9.2 按交付物追加

| 交付物 | 必查项 |
|---|---|
| 代码 | 测试、构建、静态检查、边界值、回归 |
| 数据 | schema、单位、缺失值、样本复算、可重复脚本 |
| 研究 | 来源质量、引用对应、证据等级、统计方法 |
| 写作 | 材料是否足够、事实边界、重复、语气和读者 |
| 网页 | 真实浏览、响应式、交互、控制台、无障碍 |
| 图片/海报 | 真实渲染、文字、尺寸、构图、素材权限 |
| PPT | 页面完整、投影可读、字体、图表、可编辑源文件 |
| 文档 | 目录、链接、分页、导出、版本和引用 |
| 安全 | 威胁模型、权限、secret、依赖、失败模式 |

## 9.3 完成声明模板

```markdown
已完成：
- …

验证：
- `命令` → 结果
- 人工检查 → 结果

限制：
- 尚未验证…
- 需要用户确认…
```

没有运行验证命令，就不要伪造命令结果。

---

## 10. 安装到其他 Agent 或项目

先搜索准确技能名，再安装：

```bash
python scripts/install_skills.py \
  --name human-writing \
  --name victor-design-system \
  --target ../your-project/.agents/skills
```

### 常用参数

```bash
# 只预览
python scripts/install_skills.py \
  --name human-writing \
  --target ../your-project/.agents/skills \
  --dry-run

# 覆盖目标中已有的同名技能
python scripts/install_skills.py \
  --name human-writing \
  --target ../your-project/.agents/skills \
  --force
```

安装脚本默认选择非 variant 中优先级最高的版本。安装后仍应在目标项目中写清触发条件和项目事实。

---

## 11. 为新方向制作本地技能

当一个通用技能已经在目标项目中验证有效，可以制作项目 adapter。

```text
目标项目/
  AGENTS.md
  TASK_BRIEF.md
  .agents/skills/
    domain-evidence-review/
      SKILL.md
      references/
    implementation-workflow/
      SKILL.md
    delivery-review/
      SKILL.md
```

本地 adapter 应做到：

- 标明基于哪个上游技能和版本；
- 只写项目真实术语、路径、命令和门禁；
- 不复制不相关规则；
- 不伪造用户偏好；
- 用真实失败案例和测试验证；
- 项目事实变化后及时更新。

领域适配的完整方法见 [`DOMAIN_ADAPTATION.md`](DOMAIN_ADAPTATION.md)。

---

## 12. 典型案例

## 案例 A：陌生领域研究报告

```text
主技能：literature-review
支撑：deep-research + statistical-analysis
审查：peer-review
```

执行：

1. 定义研究问题和时间范围；
2. 建来源纳入/排除标准；
3. 提取可核验结论；
4. 需要时做统计；
5. 区分来源结论、推断和未知；
6. 独立同行评审。

## 案例 B：修复线上 Bug

```text
主技能：systematic-debugging
支撑：test-driven-development
审查：verification-before-completion
```

执行：

1. 复现 Bug；
2. 记录最小失败用例；
3. 找根因，不先猜修复；
4. 写失败测试；
5. 实施最小修复；
6. 跑针对测试和回归。

## 案例 C：制作答辩 PPT

```text
主技能：victor-design-system
支撑：pptx + scientific-writing
审查：内容事实审查 + 真实投影可读性检查
```

执行：

1. 确认受众、时长、页面数量和可编辑要求；
2. 固定叙事结构和事实；
3. 选择演示 adapter；
4. 建 HTML/设计母版或页面系统；
5. 生成 PPTX；
6. 查看真实导出和关键页面；
7. 检查字体、图表、引用和可编辑性。

## 案例 D：写中文行业长文

```text
主技能：human-writing
支撑：领域检索技能
审查：humanizer-zh 或 stop-slop
```

执行：

1. 检查是否有足够具体材料；
2. 核验数据、人物和引用；
3. 确定说话位置和读者；
4. 完成初稿；
5. 只选一个审校技能做最后清理；
6. 保留作者判断和自然节奏。

## 案例 E：给代码库建立长期文档

```text
主技能：openwiki
支撑：mermaid-diagrams
审查：源码事实核对
```

执行：

1. 阅读目标项目约束；
2. 初始化 OpenWiki；
3. 编写 `openwiki/INSTRUCTIONS.md`；
4. 生成 wiki；
5. 核对架构、路径和链接；
6. 将 update 加入 CI；
7. 不提交凭证。

---

## 13. 反模式

以下做法应直接避免：

- 一开始把全部 `SKILL.md` 读进上下文；
- 只因技能名字响亮就启用；
- 同时启用多个功能重复的技能；
- 把历史项目里的术语、数值和审美当成新项目事实；
- 让五个“专家”重复说同一套意见；
- 多 Agent 并行修改同一个文件；
- Producer 自己宣布审查通过；
- 用解释替代失败测试的返工；
- 写作材料不足时靠重复和虚构细节凑篇幅；
- 设计任务只看 HTML/CSS，不看真实渲染；
- 未运行命令却声称测试通过；
- 将 API key、Cookie、token 或 OAuth 凭证写进仓库；
- 把 variants 全部安装到目标项目；
- 修改第三方技能后仍声称与固定上游完全一致。

---

## 14. 维护仓库

## 14.1 重建目录

新增、删除或修改 `SKILL.md` 后运行：

```bash
python scripts/build_catalog.py
python scripts/validate_repository.py
```

## 14.2 初始化和物化全量技能

完整上游以 Git 子模块固定，首次克隆或更新后运行：

```bash
git submodule update --init --recursive
python scripts/materialize_full_library.py
```

物化器会：

- 合并三个历史 `技能库&准则` 的全部文件；
- 保留同路径但内容不同的来源版本；
- 完整复制 human-writing、victor-design、openwiki 和 ScreenCoder；
- 默认跳过已有解压内容的 zip/tar/gz/7z/rar 压缩副本；
- 在 `full-library/MANIFEST.json` 记录文件、冲突和压缩包统计。

需要压缩档本身时显式执行：

```bash
python scripts/materialize_full_library.py --keep-archives
```

## 14.3 重建快速检索层

`skills/community/` 和 `skills/variants/` 是快索引。只有需要更新索引快照时才运行：

```bash
python scripts/import_skill_union.py \
  --turbine /path/to/turbine-blade-ai-platform \
  --wind /path/to/wind_farm_viz \
  --repo-source /path/to/repo-dash
python scripts/build_catalog.py
python scripts/validate_repository.py
```

快索引可以裁剪大文件，但不得被当作全量权威源。

## 14.3 第三方来源

直接装载项目和历史集合的来源、提交与许可证见：

- [`../catalog/sources.lock.json`](../catalog/sources.lock.json)
- [`../third_party/NOTICE.md`](../third_party/NOTICE.md)
- `third_party/licenses/`
- `third_party/upstream/`

缺少可识别许可证的历史集合，不应在未核实真正上游前用于商业再分发。

---

## 15. Agent 启动检查清单

新 Agent 拿到仓库后，依次确认：

- [ ] 已读目标项目的 `AGENTS.md` 和需求；
- [ ] 已读本仓库根 `SKILL.md`；
- [ ] 已建立任务简报和验收标准；
- [ ] 已用“领域 + 交付物 + 方法/风险”搜索；
- [ ] 已将候选缩减到 1–4 个技能；
- [ ] 已说明每个技能填补的能力缺口；
- [ ] 已排除历史项目专属假设；
- [ ] 需要完整资源时已初始化 `full-sources/`，没有把快索引裁剪误判成上游缺失；
- [ ] 已按需定义制品契约；
- [ ] 已选择实际验证方式；
- [ ] 已在交付中说明证据和限制。

做到这十项，其他方向的 Agent 才算真正“消化吸收”了这个仓库，而不是简单把技能文件堆进上下文。
