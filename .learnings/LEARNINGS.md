# Learnings

Corrections, insights, and knowledge gaps captured during development.

**Categories**: correction | insight | knowledge_gap | best_practice

---

## [LRN-20260810-01] 必须在每条回复开头强制声明大师与技能 (Zero Exception)
- **Logged**: 2026-08-10T09:30:00Z
- **Priority**: critical
- **Status**: verified
- **Category**: best_practice
- **Trigger**: user_rule
- **Context**: 助手与用户的每一次对话交互
- **Correct Approach**:
  每条回复第一行必须以绝对一致的格式显式声明：
  ```markdown
  ### 🛠️ 技能调用与执行声明
  - **本次显式调度大师**：【大师名】（角色定位）
  - **本次显式调用SKILL**：
  ```

---

## [LRN-20260810-02] 叶轮机械与 Rotor 37 物理载体严格区分
- **Logged**: 2026-08-10T09:30:00Z
- **Priority**: critical
- **Status**: verified
- **Category**: correction
- **Trigger**: user_rule
- **Context**: 论文、文案、前端叙事与答辩准备
- **Correct Approach**:
  1. 上位概念为**叶轮机械 (Turbomachinery)**；
  2. 故事背景引子为 KIT 2026.02 无压气机燃气轮机 303 秒实验（打破 NASA 250 秒记录）；
  3. 实际研究对象与仿真数据载体为 **NASA Rotor 37 跨音速压气机转子**（PLAID 数据集，1000 样本，74 维统计特征）；
  4. 严禁将 Rotor 37 误称为“涡轮实测数据”。

---

## [LRN-20260810-03] 科研证据分级 (E0~E4) 与物理事实红线
- **Logged**: 2026-08-10T09:30:00Z
- **Priority**: critical
- **Status**: verified
- **Category**: best_practice
- **Trigger**: stage_guardrails_D41
- **Correct Approach**:
  1. **E0 规划** / **E1 静态** / **E2 代理模型与留出集指标** / **E3 物理求解器趋势** / **E4 真实闭环多点验证**；
  2. Pareto 100 个解必须称为“代理模型预测候选”，不可称为“已验证的物理最优叶片”；
  3. SU2 coarse 网格 10 阶段性能提取属于 E3 未收敛趋势（converged=false），如实标注；
  4. UQ MC Dropout 是“相对置信度指示器”，不能夸大为严格 95% 统计保证。

---

## [LRN-20260810-04] 前端视觉与本地推理基线
- **Logged**: 2026-08-10T09:30:00Z
- **Priority**: high
- **Status**: verified
- **Category**: best_practice
- **Trigger**: D43_design_brief
- **Correct Approach**:
  1. 视觉遵循 D43 确认方向：Control Room 信息骨架 + Rotor Editorial 瑞士排版 + 气动流场视觉；
  2. 浅色模式采用暖白纸感（Morandi/Light Slate），深色模式采用温黑与发丝线；
  3. 前端支持 ONNX Runtime Web (WASM) 纯前端本地推理，彻底消除后端冷启动依赖；
  4. 绝不使用浮动阴影白卡片、Emoji 装饰与 AI 生成营销套话。

---

## [LRN-20260810-05] 决策交互偏好：选择题式收口（默认交互模式）
- **Logged**: 2026-08-10T09:30:00Z
- **Priority**: critical
- **Status**: verified
- **Category**: best_practice
- **Trigger**: user_rule
- **Context**: 所有需要用户裁定的分岔点
- **Correct Approach**: 涉及方案选择、授权放行、口径取舍时，一律用结构化选择题（2~4 个候选 + 可自定义）收口，不写长篇开放式提问；每个选项附一句话代价/后果说明。
