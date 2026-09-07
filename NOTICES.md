# 第三方资产清单（迁移存档索引）

本仓曾在根目录携带 `技能库&准则/`，内含第三方 Agent Skills / 工具仓库的整仓副本。
为保持公开仓轻量并厘清授权，这些副本已从版本控制中移出（保留在本地与私有存档），
此处登记来源目录、许可证与在本项目中的实际用途。

- 条目数：72
- 生成方式：`python tools/make_notices.py`（许可证自动探测，用途需人工填写）
- 许可证一栏若为「待人工确认」或「未找到」，以上游仓库页面为准。
- 「用途」列于 2026-09-07 自动回填，来源标注在each条目末尾：
  `[指南§1]`/`[指南附录A]`/`[装载台账]` = 摘自本人自有文档（`docs/agent-charter/`）；
  `[上游自述]` = 摘自该库自带 README/SKILL.md 首段客观描述；`[本人定制]` = 本人自写。
  **前者可直接采信，`[上游自述]` 仅说明「这库是什么」，不等于「在本项目里用它做了什么」，
  如需严格口径请本人复核。**

> ⚠️ **许可证注意**：`academic-research-skills` 与 `academic-research-skills-codex` 的自动探测结果为
> CC-BY-4.0，但其 README 徽章实为 **CC BY-NC 4.0（禁止商业使用）**。以 README 为准，
> 若本项目有任何商业化打算需重新评估。

| 目录 | 许可证文件 | 许可证（自动探测） | 用途（人工填） |
|---|---|---|---|
| `academic-research-skills` | LICENSE | CC-BY-4.0 | 学术研究技能套件 ARS（Imbad0202），论文全流程；许可 CC BY-NC 4.0（非商业） <sub>[上游自述]</sub> |
| `academic-research-skills-codex` | LICENSE | CC-BY-4.0 | ARS 的 Codex 原生适配（上游 Imbad0202/academic-research-skills-codex） <sub>[装载台账]</sub> |
| `addyosmani-agent-skills` | LICENSE | MIT | 【全流程工程开发主工具箱】TDD 测试驱动、系统调试、API 契约治理、CEO/设计/工程/QA 角色流水线 <sub>[指南§1]</sub> |
| `agent-browser` | LICENSE | Apache-2.0 | 【前端交互与动效系统】物理插值平滑转场、Three.js 叶片阻尼旋转、Canvas 气动粒子流线、无后端 ONNX Runtime Web WASM 纯前端本地推理 <sub>[指南§1]</sub> |
| `agent-reach` | LICENSE | MIT | 【全网多平台生态连接器】69k Stars 多平台连接器，覆盖 B站、小红书、微信公众号、小宇宙、雪球、Twitter/X、Reddit、YouTube，实时汲取一手权威资讯 <sub>[指南§1]</sub> |
| `agent-skills-main` | LICENSE | MIT | 【全流程工程开发主工具箱】TDD 测试驱动、系统调试、API 契约治理、CEO/设计/工程/QA 角色流水线 <sub>[指南§1]</sub> |
| `ai-agent-engineering` | 未找到 | 待人工确认 | 【AI Agent 全栈工程】李博杰体系 $\text{Agent} = \text{LLM} + \text{上下文} + \text{工具}$；Harness 优先、代码即工具、KV Cache 与上下文预算严控 <sub>[指南§1]</sub> |
| `ai-research-skills` | LICENSE | MIT | ML 训练、评估、消融、MLOps（上游 Orchestra-Research/AI-Research-SKILLs） <sub>[装载台账]</sub> |
| `AIGC_text_detector-main` | LICENSE | Apache-2.0 | AI 生成文本检测（多尺度正-无标注学习，arXiv:2305.18149），查稿件 AI 味 <sub>[上游自述]</sub> |
| `alirezarezvani-claude-skills` | LICENSE | MIT | 362 个通用 Agent Skills 合集，覆盖工程/安全/科研/C 级顾问角色 <sub>[上游自述]</sub> |
| `anydoc-main` | LICENSE | MIT | 【学术论文与知识图谱】顶刊学术论文框架、文献知识图谱构建、苏格拉底式 C 模式深度知识拆解 <sub>[指南§1]</sub> |
| `anysearch-skill` | NOTICE | Apache-2.0 | 实时搜索引擎技能：网页/垂域/并行批量检索与 URL 正文抽取 <sub>[上游自述]</sub> |
| `aris` | LICENSE | MIT | 自主选题、实验队列、对抗审稿；必须设轮次和花费上限（上游 wanshuiyin/Auto-claude-code-research-in-sleep） <sub>[装载台账]</sub> |
| `awesome-design-md` | LICENSE | MIT | 【设计美学与 UI/UX 智能】109k Stars UI UX Pro Max 规则库，D43 视觉规范（Control Room + Rotor Editorial + 流场美学），莫兰迪工科色盘与 1px 发丝线 <sub>[指南§1]</sub> |
| `awesome-shadcn-ui` | LICENSE | MIT | 【设计美学与 UI/UX 智能】109k Stars UI UX Pro Max 规则库，D43 视觉规范（Control Room + Rotor Editorial + 流场美学），莫兰迪工科色盘与 1px 发丝线 <sub>[指南§1]</sub> |
| `boraoztunc-skills` | NOTICE-mengto.md | 待人工确认 | 【全流程工程开发主工具箱】TDD 测试驱动、系统调试、API 契约治理、CEO/设计/工程/QA 角色流水线 <sub>[指南§1]</sub> |
| `browser-use` | LICENSE | MIT | 【前端交互与动效系统】物理插值平滑转场、Three.js 叶片阻尼旋转、Canvas 气动粒子流线、无后端 ONNX Runtime Web WASM 纯前端本地推理 <sub>[指南§1]</sub> |
| `buildwithclaude-hub` | LICENSE | MIT | Claude Skills/Agents/Commands/Hooks/Plugins 汇总站（davepoon） <sub>[上游自述]</sub> |
| `chengze-deep-tutor` | 未找到 | 待人工确认 | 【本人定制】孙承泽 1:1 强制讲课术：拆名词、teach-back、纠错、深入浅出 <sub>[本人定制]</sub> |
| `claude-scholar` | LICENSE | MIT | 学术文献研读与综述技能（Galaxy-Dawn） <sub>[上游自述]</sub> |
| `claude-video` | LICENSE | MIT | /watch 插件：让 agent 能看视频 <sub>[上游自述]</sub> |
| `claude-video-vision` | LICENSE | MIT | 视频感知层：ffmpeg 抽帧 + 音频转写（Gemini/Whisper/OpenAI 后端） <sub>[上游自述]</sub> |
| `cloudflare-computer` | LICENSE | MIT | Durable Object 内的虚拟文件系统与可插拔执行沙箱 <sub>[上游自述]</sub> |
| `codex-research-workflow` | 未找到 | 待人工确认 | 【Codex 10 大科研工作流】小葛 AI / Nature Skills 全链路：选题 $\to$ 检索 $\to$ 综述 $\to$ 统筹 $\to$ 统计 $\to$ 绘图 $\to$ 写作 $\to$ 润色 $\to$ 审稿答辩 $\to$ P… <sub>[指南§1]</sub> |
| `deepsec` | NOTICE | 待人工确认 | 2.4 🌟 【deepsec & open-code-review】—— 工业级漏洞检测与代码门禁 **核心能力**：自动拦截 `NaN/Inf` 矩阵计算、浮点裸显、内存泄漏与越界风险，确保交付代码 100% 工业级健… <sub>[指南附录A]</sub> |
| `DeepTutor` | LICENSE | Apache-2.0 | 【学术论文与知识图谱】顶刊学术论文框架、文献知识图谱构建、苏格拉底式 C 模式深度知识拆解 <sub>[指南§1]</sub> |
| `drawio-skill` | LICENSE | MIT | 自然语言/代码库/IaC/SQL → drawio 架构图，导出 PNG/SVG/PDF <sub>[上游自述]</sub> |
| `ECC` | LICENSE | MIT | 【全流程工程开发主工具箱】TDD 测试驱动、系统调试、API 契约治理、CEO/设计/工程/QA 角色流水线 <sub>[指南§1]</sub> |
| `free-domain-service` | LICENSE | GPL-3.0 | 【免费域名与边缘部署】DigitalPlat FreeDomain 自动化域名申请与 Cloudflare Pages 免费 SSL 绑定 <sub>[指南§1]</sub> |
| `frontend-slides` | LICENSE | MIT | 【演示文稿与路演答辩】瑞士国际主义网格排版（Swiss Grid）、高密度学术答辩 Deck 生成 <sub>[指南§1]</sub> |
| `gpt-image-2-skill` | 未找到 | 待人工确认 | 【图像生成与视觉工程】31 大场景结构化 Prompt 库与七条铁律（结构先于华丽、字面文字严格引号、物理材质精准、显式构图、重绘守恒、16倍数、透明通道） <sub>[指南§1]</sub> |
| `gsap-skills` | LICENSE | MIT | 【前端交互与动效系统】物理插值平滑转场、Three.js 叶片阻尼旋转、Canvas 气动粒子流线、无后端 ONNX Runtime Web WASM 纯前端本地推理 <sub>[指南§1]</sub> |
| `gstack` | LICENSE | MIT | 【全流程工程开发主工具箱】TDD 测试驱动、系统调试、API 契约治理、CEO/设计/工程/QA 角色流水线 <sub>[指南§1]</sub> |
| `guizang-ppt-skill-main` | LICENSE | GPL-3.0 | 【演示文稿与路演答辩】瑞士国际主义网格排版（Swiss Grid）、高密度学术答辩 Deck 生成 <sub>[指南§1]</sub> |
| `hamelnb` | 未找到 | 待人工确认 | 有状态 Jupyter，终稿必须重启 kernel（上游 hamelsmu/hamelnb） <sub>[装载台账]</sub> |
| `huashu-design` | LICENSE | MIT | 【设计美学与 UI/UX 智能】109k Stars UI UX Pro Max 规则库，D43 视觉规范（Control Room + Rotor Editorial + 流场美学），莫兰迪工科色盘与 1px 发丝线 <sub>[指南§1]</sub> |
| `human-writing` | LICENSE | MIT | 活人感写作（与 Humanizer / Stop-slop 配合，不叠用） <sub>[装载台账]</sub> |
| `human-writing-main` | LICENSE | MIT | 活人感写作（与 Humanizer / Stop-slop 配合，不叠用） <sub>[装载台账·同源]</sub> |
| `img2threejs` | LICENSE | Apache-2.0 | 2.3 🌟 【img2threejs & scroll-world】—— 图像转 3D 与空间流体交互 **核心能力**： 1. 将 2D 叶片草图与流场切片直接程序化转为 Three.js 参数化几何体； 2. 纯代码… <sub>[指南附录A]</sub> |
| `impeccable` | LICENSE | Apache-2.0 | 【设计美学与 UI/UX 智能】109k Stars UI UX Pro Max 规则库，D43 视觉规范（Control Room + Rotor Editorial + 流场美学），莫兰迪工科色盘与 1px 发丝线 <sub>[指南§1]</sub> |
| `karpathy-skills` | 未找到 | 待人工确认 | 【全流程工程开发主工具箱】TDD 测试驱动、系统调试、API 契约治理、CEO/设计/工程/QA 角色流水线 <sub>[指南§1]</sub> |
| `last30days-skill-main` | LICENSE | MIT | 近 30 天时效性检索（GitHub Trending 日榜第一） <sub>[上游自述]</sub> |
| `llm-wiki-skill-main` | 未找到 | 待人工确认 | 【学术论文与知识图谱】顶刊学术论文框架、文献知识图谱构建、苏格拉底式 C 模式深度知识拆解 <sub>[指南§1]</sub> |
| `memory-system` | 未找到 | 待人工确认 | 【智能体跨会话永久记忆】6 阶全栈记忆引擎（自演化/三层记忆/记忆熵/评估器/判例库/学习系统），实现跨 Session 零损耗无缝接力 <sub>[指南§1]</sub> |
| `motionsites-design-system` | 未找到 | 待人工确认 | 【前端交互与动效系统】物理插值平滑转场、Three.js 叶片阻尼旋转、Canvas 气动粒子流线、无后端 ONNX Runtime Web WASM 纯前端本地推理 <sub>[指南§1]</sub> |
| `nature-skills` | LICENSE | Apache-2.0 | 2.2 🌟 【scientific-agent-skills & nature-skills】—— 顶级科学研究与学术论文全流程 **核心能力**： 1. **Nature 规范排版**：严格执行三线表、发丝线、标准误差… <sub>[指南附录A]</sub> |
| `nuwa-distilled` | 未找到 | 待人工确认 | 【多 Agent 协同与自演化】总指挥/工兵/红队三权分立，制品契约交接，双盲否决权审查；基于上海 AI Lab (arXiv:2606.09498) 的运行时支架自演化 <sub>[指南§1]</sub> |
| `nuwa-skill` | LICENSE | MIT | 【女娲大师智囊与心智模型】费曼（第一性原理/大白话）、芒格（逆向工程/防翻车）、Karpathy（极简可复现/不猜修）、乔布斯（克制美学）、图夫特（数据墨水比）等 <sub>[指南§1]</sub> |
| `obra-superpowers` | LICENSE | MIT | 完整的 agent 软件开发方法论与可组合技能集 <sub>[上游自述]</sub> |
| `open-code-review` | 未找到 | 待人工确认 | 2.4 🌟 【deepsec & open-code-review】—— 工业级漏洞检测与代码门禁 **核心能力**：自动拦截 `NaN/Inf` 矩阵计算、浮点裸显、内存泄漏与越界风险，确保交付代码 100% 工业级健… <sub>[指南附录A]</sub> |
| `paper-craft-skills` | 未找到 | 待人工确认 | 深读、方法图、学术 Deck（上游 zsyggg/paper-craft-skills） <sub>[装载台账]</sub> |
| `paperspine` | LICENSE | MIT | 论点主线、证据蓝图、LaTeX 审计（上游 WUBING2023/PaperSpine） <sub>[装载台账]</sub> |
| `playwright` | NOTICE | 待人工确认 | 【前端交互与动效系统】物理插值平滑转场、Three.js 叶片阻尼旋转、Canvas 气动粒子流线、无后端 ONNX Runtime Web WASM 纯前端本地推理 <sub>[指南§1]</sub> |
| `prime-agent` | LICENSE | MIT | Prime Intellect 的 agent 框架 <sub>[上游自述]</sub> |
| `Qwen-MM-Plugins` | LICENSE | Apache-2.0 | Qwen 原生多模态插件，让 agent harness 具备多模态能力 <sub>[上游自述]</sub> |
| `qwen-mm-plugins` | LICENSE | Apache-2.0 | 同 `Qwen-MM-Plugins`（重复副本，建议存档时去重） <sub>[上游自述]</sub> |
| `research-expert-system` | 未找到 | 待人工确认 | 科研总路由：选题→证据→协议→实验→claim-evidence→审稿 <sub>[装载台账]</sub> |
| `Research-Paper-Writing-Skills-main` | LICENSE | MIT | 【学术论文与知识图谱】顶刊学术论文框架、文献知识图谱构建、苏格拉底式 C 模式深度知识拆解 <sub>[指南§1]</sub> |
| `scientific-agent-skills` | LICENSE.md | MIT | 2.2 🌟 【scientific-agent-skills & nature-skills】—— 顶级科学研究与学术论文全流程 **核心能力**： 1. **Nature 规范排版**：严格执行三线表、发丝线、标准误差… <sub>[指南附录A]</sub> |
| `scipilot-figure-skill` | LICENSE | MIT | 科研数据可视化顾问：先做数据剖析再定图型，非单纯画图工具 <sub>[上游自述]</sub> |
| `scroll-world` | LICENSE | MIT | 2.3 🌟 【img2threejs & scroll-world】—— 图像转 3D 与空间流体交互 **核心能力**： 1. 将 2D 叶片草图与流场切片直接程序化转为 Three.js 参数化几何体； 2. 纯代码… <sub>[指南附录A]</sub> |
| `self-harness` | 未找到 | 待人工确认 | 【多 Agent 协同与自演化】总指挥/工兵/红队三权分立，制品契约交接，双盲否决权审查；基于上海 AI Lab (arXiv:2606.09498) 的运行时支架自演化 <sub>[指南§1]</sub> |
| `skill-repo-guides` | 未找到 | 待人工确认 | 八阶段门禁与最小专家团（RESEARCH.md） <sub>[装载台账]</sub> |
| `skills-main` | THIRD_PARTY_NOTICES.md | BSD-3-Clause | 【演示文稿与路演答辩】瑞士国际主义网格排版（Swiss Grid）、高密度学术答辩 Deck 生成 <sub>[指南§1]</sub> |
| `superpowers-main` | LICENSE | MIT | 【全流程工程开发主工具箱】TDD 测试驱动、系统调试、API 契约治理、CEO/设计/工程/QA 角色流水线 <sub>[指南§1]</sub> |
| `taste-skill` | LICENSE | MIT | 【设计美学与 UI/UX 智能】109k Stars UI UX Pro Max 规则库，D43 视觉规范（Control Room + Rotor Editorial + 流场美学），莫兰迪工科色盘与 1px 发丝线 <sub>[指南§1]</sub> |
| `ui-ux-pro-max` | LICENSE | MIT | 【设计美学与 UI/UX 智能】109k Stars UI UX Pro Max 规则库，D43 视觉规范（Control Room + Rotor Editorial + 流场美学），莫兰迪工科色盘与 1px 发丝线 <sub>[指南§1]</sub> |
| `uiverse-galaxy` | LICENSE | MIT | 3000+ 开源 UI 组件库（Uiverse.io） <sub>[上游自述]</sub> |
| `Understand-Anything` | LICENSE | MIT | 2.1 🌟 【Understand-Anything】—— 代码知识图谱与教学探索器 **核心理念**：*“Graphs that teach > graphs that impress.”*（能讲清逻辑的图，远胜过仅仅… <sub>[指南附录A]</sub> |
| `understand-anything` | LICENSE | MIT | 代码库/知识库 → 可交互知识图谱（与 `Understand-Anything` 同源，重复副本） <sub>[上游自述]</sub> |
| `video-use` | LICENSE | MIT | 对话式视频剪辑：转写、剪辑、调色、字幕烧录 <sub>[上游自述]</sub> |
| `WRITING.md-main` | LICENSE | MIT | Anbeeld 写作规则集，消除 AI 默认输出腔调 <sub>[上游自述]</sub> |

## 根目录散装文件（2026-09-07 补登记）

初版清单脚本只遍历子目录，漏掉了 `技能库&准则/` 根下的散装文件。补录如下。

**本人自有** —— 已捞回 `docs/agent-charter/`，不属于第三方资产：

| 文件 | 去向 |
|---|---|
| `SKILL运用指南.md` | `docs/agent-charter/SKILL运用指南.md`（已消解遗留 git 冲突标记） |
| `内阁决策.md` | `docs/agent-charter/内阁决策.md` |
| `MULTI_AGENT_ORCHESTRATION.md` | `docs/agent-charter/MULTI_AGENT_ORCHESTRATION.md` |
| `科研技能装载-019ff854.md` | `docs/agent-charter/科研技能装载-019ff854.md` |
| `最高优先级AGENT必须遵守的宪法级文件 - 副本.md` | `docs/agent-charter/AGENT宪法级准则.md`（本人确认自有，2026-09-07） |
| `nuwa-distilled/*-perspective/SKILL.md`（5 张人格卡） | `docs/agent-charter/personas/` |

**第三方** —— 未捞回，随存档保留：

| 文件 | 上游 / 作者 | 许可证 | 用途（人工填） |
|---|---|---|---|
| `Stop-slop.md` | Hardik Pandya (hardikpandya/stop-slop) | 未随文件附带 | 消除 AI 写作痕迹的散文规则集 <sub>[上游自述]</sub> |
| `Humanizer - 中文版.md` | 译自 blader/humanizer | 未随文件附带 | 中文版去 AI 味编辑指南，基于维基百科「AI 写作特征」 <sub>[上游自述]</sub> |

> 已迁出内容均可用 `git show 1bae982d^:"技能库&准则/<路径>"` 从 git 历史取回。
