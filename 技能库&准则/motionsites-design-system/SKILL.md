---
name: motionsites-design-system
description: 融合 MotionSites (motionsites.ai) 动效提示词工程与 Refero (styles.refero.design) 工业级 DESIGN.md 规范的现代化科学工作台前端视觉与动效构建引擎。通过“PRD/工程需求 → Refero DESIGN.md 规范约束 → MotionSites 交互动效代码结构”三位一体工作流，彻底消除前端 AI 模板味，打造顶刊实验室/高阶科学工作台级动效与交互。
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
metadata:
  trigger: 制作或优化网页界面、重构 CSS/JS 动效、添加微交互、设计科学仪表盘、实现丝滑物理流场与三维交互
  sources: MotionSites (motionsites.ai) + Refero Design (styles.refero.design)
---

# MotionSites × Refero 科学工作台视觉与动效设计系统

> **核心哲学**：美感不是玄学，而是“精确的设计约束（DESIGN.md）+ 参数化的物理动效（Motion Primitives）”。
> 告别千篇一律的 AI 圆角卡片与僵硬过渡，构建具备呼吸感、流体感、高数据密度的现代工科 Web 体验。

---

## 一、 黄金工作流（3 步闭环）

```text
  ┌─────────────────────────────────────────────────────────────┐
  │                 1. PRD / 科学功能需求定义                    │
  │  • 明确交互目标（如：偏航滑块实时流场演算、3D风机平滑旋转） │
  │  • 锁定信息层级与数据更新频次                              │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │          2. Refero DESIGN.md 工业级设计规范锁定              │
  │  • 颜色 Tokens（莫兰迪低饱和工科色谱、深浅双态、发丝线）    │
  │  • 字体阶梯（宋体/Serif 标题 + 无衬线数值 + 等宽元数据）     │
  │  • 空间网格（8px 栅格、1px 发丝边框、14px 毛玻璃背景模糊）  │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │          3. MotionSites 物理级动效提示与代码实现             │
  │  • 弹簧物理（Spring Physics）：阻尼系数与平滑插值            │
  │  • 粒子流动（Particle Streaks）：风速流场轨迹动画           │
  │  • 状态转场（State Transition）：非破坏性渐变与指标联动     │
  └─────────────────────────────────────────────────────────────┘
```

---

## 二、 核心动效原子库（Motion Primitives）

1. **流动风场粒子束 (Wind Stream Streaks)**：
   - 算法：基于 HTML5 Canvas / WebGL，粒子速度与偏航后局地风速 $u(x,y)$ 严格成正比；
   - 视觉：半透明渐隐轨迹（Tail length 12px, Opacity 0.4~0.8, Blur 0.5px）。

2. **叶轮偏航平滑插值 (Yaw Angle Spring Interpolation)**：
   - 算法：采用临界阻尼弹簧算法 $x_{t+1} = x_t + v_t \cdot \Delta t$，避免机械生硬转动；
   - 联动：转角改变时，下游尾流包络线（Wake Envelopes）实时形变。

3. **数据大字报数字滚动 (Telemetry Counter Ticker)**：
   - 算法：`requestAnimationFrame` + `easeOutExpo` 缓动插值；
   - 视觉：数字递增时微弱高亮，回落时平缓收敛。

4. **莫兰迪玻璃拟态悬浮 (Morandi Glassmorphism Hover)**：
   - 样式：`background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(14px);`；
   - 交互：Hover 时边框颜色由 `rgba(220, 213, 200, 0.6)` 柔和过渡至品牌色 `rgba(91, 132, 177, 0.8)`，Y 轴位移 $\le 2\text{px}$。
