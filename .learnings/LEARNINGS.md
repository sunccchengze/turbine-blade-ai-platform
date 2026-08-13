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

## [LRN-20260813-03] 教材必须先认机器，证据档后置；练习不超纲
- **Logged**: 2026-08-13
- **Priority**: critical
- **Status**: verified
- **Category**: correction
- **Trigger**: user_rule（第一章读不懂；要求全部重塑）
- **Correct Approach**:
  1. 高数可当桥；马赫/等熵/RANS/神经网/代理/ONNX 从零定义；
  2. 目录：U01 机器与三个数 … U11 证据档 … U12 郭老师线；
  3. 每章先认词 + 仓库指认；本章题不得出现本章没讲的专名；
  4. 日历服从深度；验收=十问+能指仓库。

## [LRN-20260813-02] 教材练习必须 选择:填空:问答 = 2:2:6
- **Logged**: 2026-08-13
- **Priority**: high
- **Status**: verified
- **Category**: user_rule
- **Correct Approach**: 节 2+2+6；单元卷 6+6+18；期末 8+8+24。禁止整卷主观简答。见 changelog A2。

## [LRN-20260813-01] 对承泽讲知识必须走深入浅出六层，禁止童话腔
- **Logged**: 2026-08-13
- **Priority**: critical
- **Status**: verified
- **Category**: correction
- **Trigger**: user_rule（原话见 `docs/tutor-style-changelog.md` A1）
- **Context**: teach-back Q4 重讲；长期 Deep Tutor
- **Correct Approach**:
  1. 装载 `技能库&准则/chengze-deep-tutor/SKILL.md` + changelog 最后一条；
  2. 每个概念：画面 → 拆词（M/C/Dropout 这种必须拆开）→ 操作 → 公式 → `evidence/` 数据 → 边界与回收；
  3. 禁止成绩单/体检表/收得住/下雨/儿童游戏；禁止只讲大概；禁止丢未定义生词；
  4. 「收敛」分 MC 估计量 / 覆盖率校准 / RANS 残差三义；
  5. 74 维 = 9 场 × 8 统计量（std 不是方差）+ Ω + P，是全局统计约化，不是几何旋钮；
  6. 以后每次风格调整：先追加 changelog，再改 skill。

---

## [LRN-20260810-05] 决策交互偏好：选择题式收口（默认交互模式）
- **Logged**: 2026-08-10T09:30:00Z
- **Priority**: critical
- **Status**: verified
- **Category**: best_practice
- **Trigger**: user_rule
- **Context**: 所有需要用户裁定的分岔点
- **Correct Approach**: 涉及方案选择、授权放行、口径取舍时，一律用结构化选择题（2~4 个候选 + 可自定义）收口，不写长篇开放式提问；每个选项附一句话代价/后果说明。
