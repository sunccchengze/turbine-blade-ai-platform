# UI UX Pro Max (109k Stars 工业级设计智能系统实战指南)

> **核心地位**：本仓库已全量装载 GitHub 109k+ Stars 的顶级设计智能库 `UI UX Pro Max`。
> 它拥有 **161 条行业设计推理规则、67 种 UI 风格库、95 套专业色盘、56 组字体阶梯、24 类图表规范** 以及跨 React / Vue / Three.js / HTML-Tailwind 的适配器。

---

## 一、 快速检索与一键生成 Design System 命令

在本地或终端中，可直接调用内置的 Python 检索引擎：

```bash
# 1. 为科学工作台/高密度仪表盘生成专属设计系统 (Markdown 格式)
python3 "技能库&准则/ui-ux-pro-max/src/ui-ux-pro-max/scripts/search.py" \
  "scientific energy dashboard telemetry" \
  --design-system --density 8 --variance 7 --motion 6 --format markdown

# 2. 检索特定领域的配色与色彩逻辑 (如 Morandi / Slate)
python3 "技能库&准则/ui-ux-pro-max/src/ui-ux-pro-max/scripts/search.py" \
  "morandi scientific" -d color --json

# 3. 检索 Three.js / WebGL 3D 交互设计规范
python3 "技能库&准则/ui-ux-pro-max/src/ui-ux-pro-max/scripts/search.py" \
  "threejs 3d viewport" -s threejs --full

# 4. 检索图表可视化规范 (如 3D Surface / Heatmap / Windrose)
python3 "技能库&准.../scripts/search.py" "heatmap contour flow" -d chart
```

---

## 二、 在本项目（风电场偏航优化平台）中的四大实战落地

| 维度 | UI UX Pro Max 规范与数据支撑 | 本项目落地场景 |
|---|---|---|
| **1. 彻底消除 AI 廉价感 (Anti-Slop)** | 强制执行 `ui-reasoning.csv` 中的第 1 条规则：**严禁使用 Emoji 充当图标，必须使用精细矢量 SVG（Lucide/Heroicons）**；严禁粗暴大阴影。 | 优化 `site/index.html`、`wake.html` 及 `王牌PPT.pptx`，统一采用 1px 发丝边框与精准无衬线/宋体排版。 |
| **2. 莫兰迪工科色盘与对比度** | 基于 `colors.csv` 与 `typography.csv`，确保背景底色与文字对比度严格 $\ge 4.5:1$（WCAG AA 级标准）。 | 静态站米白底色 `#F8F6F0` + 深岩板文本 `#1E293B` + 雾蓝 `#5B84B1` + 鼠尾草绿 `#6F8761`。 |
| **3. Three.js 3D 视口与高度曲面** | 基于 `stacks/threejs.csv`，规范 WebGL 渲染循环、阻尼插值（Lerp）、抗锯齿（FXAA）与透明度混合（Blending）。 | 驱动 `site/3d_farm.html` 九机三维旋转与 `site/3d_surface.html` 高度速度剖面切片探针。 |
| **4. 仪表盘高密度数据阶梯 (Density 8/10)** | 基于 `charts.csv` 与 `app-interface.csv`，锁定等宽数字（`tabular-nums`），杜绝实时数据刷新时的抖动与错位。 | 支撑 `site/dashboard.html` 闭环总控台与 `site/windrose.html` 16 扇区多花瓣风玫瑰。 |

---

## 三、 Pre-Delivery 交付前强制自检清单 (Checklist)

在任何 HTML 页面或 PPT 交付前，必须核对以下 7 项硬指标：
- [ ] **No Emojis as Icons**：绝无 Emoji 图标，一律采用精细矢量线框；
- [ ] **Tabular Nums**：所有跳动的功率、风速数值强制应用等宽数字；
- [ ] **Hairline 1px**：边框一律使用 `1px solid rgba(...)`，禁用粗笨边框；
- [ ] **Smooth Transitions**：所有 Hover / Click 状态过渡时间在 150ms ~ 250ms 之间；
- [ ] **Contrast Ratio**：浅色模式下文字与背景对比度 $\ge 4.5:1$；
- [ ] **Z-Index Layering**：背景视频 (0) $\to$ 磨砂遮罩 (1) $\to$ Canvas粒子 (2) $\to$ 卡片UI (3) $\to$ 悬浮弹窗 (10)；
- [ ] **Responsive Breakpoints**：严格适配 375px (手机)、768px (平板)、1024px (笔记本)、1440px+ (大屏)。
