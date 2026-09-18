# 本会话交接（2026-09-17 · `01a0afe9`）

下一会话**先读** `docs/BRANCH-SAFETY.md`（会话通道纪律），再读本文件，然后读 `HANDOFF.md` §0.-1 十一条铁律。
本会话的任务只有一件：**把上一任（会话 `01a0aa74`，2026-09-16）没做完的卡片学习系统收口做完**。

## 0. 环境

```
仓库: sunccchengze/turbine-blade-ai-platform
本会话分支: arena/01a0afe9-turbine-blade-ai-platform（从 arena/01a0aa74 @ d2c6fd2 分叉）
内容终点（上会话）: arena/01a0aa74 @ d2c6fd2（3 笔：内容文档 → React /cards → 单文件 deck）
clone 是 shallow：别信本地 merge-base，祖先判断走 GitHub compare 或 --unshallow
```

## 1. 上一任（01a0aa74）交付了什么

三笔提交，全部已推送：

| 提交 | 内容 |
|---|---|
| `39a08438` | `docs/学习路线-卡片式-AI与叶轮机械-v1.md`（18 张卡内容试读版）+ D41 路径文档微调 |
| `31f1af48` | `docs/卡片学习系统-调研与架构决策-v1.md`（调研 + MVP 契约）+ React `/cards` 全实现（App 路由、Navbar「学习」、`learningCards.js` 18 卡、页面 + CSS） |
| `d2c6fd2a` | 单文件 deck `aero-atlas-cards.html`（55 KB，零外部依赖，18 卡内嵌）+ `scripts/build-standalone-cards.mjs` |

## 2. 本会话审计出的缺口（上一任没做完的）

1. **站点集成缺失**：首页工作台网格（Section 03）没有 `/cards` 入口；README「平台功能」表没有 `/cards`；
   单文件版 deck 只躺在仓库根目录，**没进 `frontend/public/`**——Pages 只部署 `frontend/`，线上根本打不开它。
2. **调研文档第 5 步「验收」从未执行**，无记录。
3. **收工交接缺失**：上会话没写 `SESSION_HANDOFF`（铁律要求），`HANDOFF.md` 收工指针停在 20260902。

## 3. 本会话做了什么（逐笔已推）

1. **`aeb5c56` 首页集成**：Section 03 工作台网格加 07 号卡「Aero Atlas 卡片学习」
   （`frontend/src/pages/HomePage.jsx`，图标 `GraduationCap`，badge `18 CARDS`）。
2. **`c4939b1` 单文件版上线 + 交叉引用**：
   - `scripts/build-standalone-cards.mjs` 改为**双输出**：仓库根目录（本地版，内容不变）+
     `frontend/public/aero-atlas-cards.html`（随 Pages 部署，线上 `/aero-atlas-cards.html`）；
   - `/cards` 页面路线侧栏底部加「单文件离线版」链接；
   - README「平台功能」表加 `/cards` 行 + 单文件版说明；调研文档 §8 实现状态同步。
3. **`<本提交>` 验收自测 + 本交接文档 + `HANDOFF.md` 收工指针更新**。

## 4. 第 5 步验收自测结果（agent 侧可验证的部分）

| 项 | 命令 / 方法 | 结果 |
|---|---|---|
| 前端构建 | `cd frontend && npm install && npm run build` | ✅ 通过（5.5 s，仅 >500 kB chunk 警告，非错误） |
| Lint | `npm run lint`（oxlint，24 文件 92 规则） | ✅ 0 警告 0 错误 |
| SPA 回退 | `vite preview` 后 `curl /cards` | ✅ 200，返回 `index.html`（`_redirects: /* /index.html 200` 在 dist 中） |
| 单文件版线上可达 | `curl /aero-atlas-cards.html` | ✅ 200，55 699 B，`text/html` |
| 首屏不背卡片 | 路由懒加载，`dist/assets/LearningCardsPage-*.js` | ✅ 39 081 B JS + 17 537 B CSS，只在访问 `/cards` 时下载；首屏仍是 2 618 B index + 主 chunk |
| 单文件零依赖 | `grep http/https/<link/@import/src=` | ✅ 无任何外部请求（离线可用） |
| 单文件完整性 | 重跑构建脚本逐字节对比 + `node --check` 提取的 JS | ✅ 重生成与仓库文件一致；JS 语法通过；18 卡全部内嵌 |
| 移动端布局 | `LearningCardsPage.css` 1040/720 px 断点；单文件版 1030/700 px | ✅ 存在（单列、路线抽屉、按钮全宽） |
| 减动画模式 | `@media (prefers-reduced-motion: reduce)` | ✅ 两份实现均有（翻转/悬浮动效关闭） |
| 数据单一事实源 | React 与单文件版共用 `frontend/src/data/learningCards.js` | ✅ 构建脚本从该文件生成两份前端 |

**诚实边界（禁止越级，留给承泽验收）**：

- 沙盒没有真浏览器：**键盘 ← →/Space/R、localStorage 刷新恢复、屏幕阅读器、真机移动端手感**
  未验证。点击翻面与评级按钮已获承泽真机实测反馈（2026-09-18：按钮无反馈/不推进，
  已按 §3.5 修复，待复验）。`tasks/todo.md` 的「用户线上验收」条目维持未勾选。
- 沙盒白名单访问不了 `*.pages.dev`：推 main 后 Pages 构建是否绿，**只能承泽在面板看**。
- 单文件版与 React 页的 localStorage 键不同（`aero-atlas-standalone-progress-v1` vs
  `turbine-learning-card-progress-v1`），两边进度互不同步——这是设计如此（独立入口），不是 bug。

## 5. 推送台账（无 PR，全部直推会话分支）

| 提交 | 内容 | 推送 |
|---|---|---|
| `aeb5c56` | 首页工作台加 `/cards` 入口 | ✅ |
| `c4939b1` | 单文件版双输出 + 交叉引用 + README | ✅ |
| `b7647ac` | 本交接 + HANDOFF 指针 + 推送台账 | ✅ |
| `c7dc7b1` | 推送实测记录 + unshallow 教训 | ✅ |
| 09-18 追补 | 评级闭环修复（反馈/过关推进/复习队列/命中测试守卫）+ 本节 §3.5，见 `git log` 末笔 | ✅ |

main 快进推送按 2026-09-07 常设授权执行（`git push origin <分支>:main`），实测结果：

| 步骤 | 命令 | 结果 |
|---|---|---|
| 自检（浅克隆） | `git merge-base --is-ancestor origin/main HEAD` | ❌ 假报非祖先（§9 #18 shallow 坑，本会话第三次实证） |
| 交叉验证 | GitHub API `compare f93801a...b7647ac` | ✅ `status=ahead, ahead_by=20, behind_by=0` |
| 取全量 | `git fetch --unshallow origin` | ✅ clone 不再 shallow，本地自检转 ✅ |
| 干跑 | `git push --dry-run origin <分支>:main` | ✅ `f93801ab..b7647ac0` |
| 快进推 main | `git push origin <分支>:main` | ✅ `f93801ab..b7647ac0` |
| 推后核对 | `git ls-remote --heads origin` | ✅ main 与会话分支同指 `b7647ac0`，通道未断 |

**教训补记**：本会话开头所有 `git log` 都只有 2 笔（浅克隆），祖先判断一度只能靠 GitHub compare；
`--unshallow` 之后本地工具链恢复正常。新会话开工先跑 `git rev-parse --is-shallow-repository`，
为 `true` 且需要推 main 时先 `git fetch --unshallow origin`。

## 3.5 验收反馈与评级闭环修复（2026-09-18 承泽实测反馈）

**反馈**：`/cards` 的「需要复习 / 我能解释」按钮「没有用」——点了没反馈、不推进流程，
「需要复习」也不会真的安排任何复习。

**修复（React 页 + 单文件版同步，同一数据模型）**：

1. **命中测试守卫**（可能的真 bug，移动端 3D 坑）：部分移动浏览器 `backface-visibility:hidden`
   不拦截 hit-test，被藏住的正面会挡住背面按钮的点击。
   两份实现均加 `.card-stage:not(.flipped) .back { pointer-events:none }` / 翻转后镜像规则。
2. **评级即时反馈**：点按钮 → 按钮变「已记录，进入下一张」（`.marked` 样式，700 ms）。
3. **过关即推进**（调研文档既定节奏「过关反馈 → 下一张」）：反馈结束后自动进入下一张；C18 停留。
4. **复习队列**：「需要复习」= 入队。进度条出现「复习 N 张」入口 → 进入 REVIEW MODE
   （顶部徽标「第 i/N 张」，导航/键盘限制在队列内）→ 再点「我能解释」出队、再点「需要复习」留在队列；
   队列清空自动退出复习模式，也可随时「退出复习」/点路线侧栏退出。复习队列是本地状态派生
   （status==='review' 的卡），不新增存储 schema，仍不是 FSRS（按调研文档第 6 步延后）。

**同轮新坑实证（沙盒 turn 间状态重置）**：turn 切换后 `.git` 被重置回会话分支基点 `d2c6fd2`
（本地 HEAD 回退，4 笔已推提交只剩远端副本），工作区改动以补丁形式恢复（实测无损）。
恢复流程：`git fetch origin +refs/heads/<分支>:refs/remotes/origin/<分支>` → 备份本轮新文件 →
`git reset --hard origin/<分支>` → 放回新文件。**教训：每个 turn 开工先
`git rev-parse HEAD` 对账远端 tip，不一致先恢复再干活。**

## 6. 下一会话建议顺序

1. 承泽线上验收 `/cards`（含移动端与键盘）与 `/aero-atlas-cards.html`，验收通过后
   在 `tasks/todo.md` 或本文件 §3.5 位置登记结果。
2. 按调研文档第 6 步：等 18 张卡真实使用反馈，再决定是否接 FSRS——**不提前扩功能**。
3. 18 卡内容要改：只改 `frontend/src/data/learningCards.js`（或先改
   `docs/学习路线-卡片式-AI与叶轮机械-v1.md` 再同步），然后 `node scripts/build-standalone-cards.mjs`
   重生成单文件版，build + lint 后推送。
4. 收工前自检：`grep -c "绝不主动合并 PR" HANDOFF.md` ≥ 1，本文件已更新，推送台账完整。
