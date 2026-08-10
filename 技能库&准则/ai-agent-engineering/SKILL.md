---
name: ai-agent-engineering
description: 整合华为天才少年李博杰《深入理解 AI Agent：设计原理与工程实践》（20k+ Stars）全书精华体系与 92 个工程实战范式。围绕「Agent = LLM + 上下文 + 工具」核心公式，覆盖上下文工程（KV Cache/压缩）、知识库与用户记忆、MCP 工具架构、Coding Agent 代码即工具、统计评估驱动、后训练与持续进化、多 Agent 协作网络。
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
metadata:
  author: 李博杰 (Bojie Li)
  repo: https://github.com/bojieli/ai-agent-book
  source_chapters: 10 Chapters (book/chapter1~10.md)
---

# 现代 AI Agent 架构与全栈工程实践 (李博杰体系)

> **核心公理**：$\text{Agent} = \text{LLM (推理引擎)} + \text{上下文 (工作集)} + \text{工具 (行动接口)}$

---

## 一、 十大章节核心工程映射表

| 章节编号与主题 | 核心工程论点 | 在本项目（风电场偏航优化平台）中的落地 |
|---|---|---|
| **Ch 1 · Agent 基础与 Harness** | 模型即 Agent，但模型之外的 Harness 才是真正的竞争力 | 打造完善的 `技能库&准则/` 规则库、质量门禁与自反思回路 |
| **Ch 2 · 上下文工程** | 上下文决定能力上限；KV Cache 命中优化、Prompt 模版、上下文压缩 | 严格控制 Working Context 预算，高频规则置顶，避免长会话退化 |
| **Ch 3 · 用户记忆与知识库** | 跨会话记忆、结构化索引、知识图谱与外部 RAG 注入 | 沉淀 `HANDOFF.md`、`cases_array.csv`、14天修炼计划等持久记忆 |
| **Ch 4 · 工具与 MCP 协议** | 工具是双手：感知、执行、协作；主动工具发现与异步执行 | 封装 FLORIS 计算脚本、Photoshop 8BPS 渲染器、PPTX 编译工具 |
| **Ch 5 · Coding Agent** | 代码是「能创造新工具的工具」，沙箱内即时编译与执行 | 动态编写 Python 提取流场，即时出图并校验，自造绘图工具 |
| **Ch 6 · Agent 评估与显著性** | 拒绝“感觉良好”，建立确定性环境、自动化指标与统计检验 | 采用 `cases_array.csv` 严密量化 $+24.04\%$ 净增益与逐排数据 |
| **Ch 7 · 模型后训练与强化学习** | 预训练/SFT/RL 三阶段；样本效率提升 250-400 倍 | 对接洪祖名单机 PPO 强化学习功率跟踪模型（`ppo_tracking_v3`） |
| **Ch 8 · 持续自演化 (Self-Evolution)** | 从运行轨迹获得学习信号，更新知识、指令与运行支架 | 融合上海 AI Lab `Self-Harness` 弱点挖掘与最小补丁闭环 |
| **Ch 9 · 多模态与物理世界交互** | 从纯文本扩展至 WebGL、GUI、高精度 300 DPI 分层图元 | 打造 Three.js 3D 九机流场曲面与 Adobe layered PSD |
| **Ch 10 · 多 Agent 群体智能** | 上下文隔离、通信拓扑、契约化交接与红蓝双盲对抗 | 建立工兵 Agent + 红队审查 Agent + 阿里 OCR 门禁协作体系 |
