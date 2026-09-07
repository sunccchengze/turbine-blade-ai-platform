# Agent 准则与专家团（本人自有资产）

2026-09-07 从 `技能库&准则/` 迁出时，这批文件**是本人自己写的方法论与人格卡**，
不属于第三方克隆，因此从归档中捞回、独立收进 `docs/`，不随第三方副本一起迁出。

> 背景：S02 把 `技能库&准则/`（44,189 文件 / 约 1.2 GB 的第三方 Agent Skills 整仓副本）
> 移出版本控制（commit `1bae982d`）。当时的清单脚本只遍历子目录，
> 导致该目录**根下的散装 .md 未被登记**，其中就包含下列自有文件。本目录即为补救。

## 一、方法论与规约

| 文件 | 内容 | 来源 |
|---|---|---|
| `SKILL运用指南.md` | 技能路由总纲：17 节 + 附录，含回复声明铁律、多 Agent 架构、领域技能路由 | 自有 |
| `内阁决策.md` | AI 内阁五角色决策法（第一性原理 / 反对派 / 机会派 / 局外人 / 执行者 + 主席综合） | 自有 |
| `MULTI_AGENT_ORCHESTRATION.md` | 四类 Agent 分工矩阵与双盲红蓝对抗架构 | 自有 |
| `科研技能装载-019ff854.md` | 从 `-SKILL-` 仓装载科研层的台账（哪些上游、为什么装） | 自有 |
| `AGENT宪法级准则.md` | 降低 LLM 编码常见错误的行为准则（原名「最高优先级AGENT必须遵守的宪法级文件 - 副本.md」） | 自有 |

### `SKILL运用指南.md` 的冲突消解（2026-09-07）

该文件此前**长期带着未解决的 git 冲突标记**（`<<<<<<< HEAD` / `>>>>>>> aa6c0e44`，共 3 处）。
本次按以下原则消解，未丢弃任何内容：

- **主体**取 HEAD 侧（17 节重构版，结构更完整）；
- **标题与元信息**合并两侧（保留「两机」方向与负责人班级等更完整的表述）；
- **aa6c0e44 侧独有**的「核心明星技能专精深度解析」移入 **附录 A**；
- 两侧重复的章节（技能矩阵、Windows 同步协议、调度路由表）以 HEAD 侧为准。

## 二、专家团人格卡 `personas/`

女娲蒸馏（`nuwa-distilled/`）产出的 5 张人格卡定义：

| 文件 | 人格 | 与 `docs/GHG-*` 的关系 |
|---|---|---|
| `personas/antony-jameson-perspective.md` | Jameson · 伴随法 CFD | 对应 `GHG-10` 审查报告 |
| `personas/bojie-li-perspective.md` | 李博杰 · Agent Harness | 对应 `GHG-08` |
| `personas/da-vinci-perspective.md` | 达·芬奇 · 拓扑手稿 | 对应 `GHG-09` |
| `personas/david-goldberg-perspective.md` | Goldberg · 遗传算法 | 对应 `GHG-11` |
| `personas/self-harness-perspective.md` | **自演化架构师** | **无对应 GHG 报告，此卡为独苗** |

> 区别：`docs/GHG-*.md` 是这些人格产出的**观后感/审查报告**，本目录 `personas/` 是**人格卡定义**本身。
> 两者格式与用途不同，故不合并编号。

`self-harness-perspective` 的三条核心（归因下沉 / 最小变动状态机 / 回归验证铁律）
在 `docs/GHG` 系列中没有对应篇目，是这次抢救中风险最高的一份。

## 三、仍只存在于本地副本与 git 历史的内容

`技能库&准则/` 根下另有两份**第三方**散装文件，未捞回本仓，已在 `NOTICES.md` 登记：

- `Stop-slop.md`（Hardik Pandya · 去 AI 味写作）
- `Humanizer - 中文版.md`（译自 blader/humanizer）

其余 72 个第三方目录见 `NOTICES.md`。所有已迁出内容仍可用
`git show 1bae982d^:"技能库&准则/<路径>"` 从历史取回。
