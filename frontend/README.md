# 前端 Frontend

> 叶轮机械多学科设计优化平台的前端应用。完整说明见仓库根目录 [README](../README.md)。
>
> Frontend of the Turbomachinery MDO platform. Full documentation: [main README](../README.md).

## 技术栈 Tech Stack

React 19 · Vite · Three.js（3D 叶片查看器）· Plotly.js（图表）· Framer Motion · Axios

## 开发 Dev

```bash
npm install
npm run dev        # http://localhost:5173（端口被占会自动顺延，后端 CORS 已放行任意本地端口）
```

> 默认连接线上后端；本地调试在 `.env.local` 写 `VITE_API_URL=http://localhost:8000`。

## 构建与检查 Build & Lint

```bash
npm run build      # 产物在 dist/（Cloudflare Pages 构建命令）
npm run lint       # oxlint；当前 0 warnings / 0 errors（2026-07-31 终审清零）
```

## 页面 Pages

| 路由 | 页面 |
|---|---|
| `/` | 首页（叙事 + 核心指标） |
| `/predict` | 实时预测（74 维输入 → 三项性能 + MC Dropout UQ） |
| `/explore` | **设计空间探索器**（响应面热力图，主功能） |
| `/optimize` | 多目标优化（Pareto 前沿 + 演化动画 + 3D 叶型联动） |
| `/uq` | 不确定性分析 |
| `/methodology` | 方法论（数据 → 模型 → 验证 → 诚实披露） |
| `/about` | 关于与署名 |
| `*` | 404 兜底 |
