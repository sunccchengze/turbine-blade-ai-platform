# BRANCH-SAFETY.md —— Arena 会话 / Git 通道安全手册（本仓版）

> **写给每一个进入本仓库的 AI Agent。动手之前先读完这页。**
>
> 为什么单独开这份文件：`HANDOFF.md` 在 `019feb03` 被整体重写成 v8「七条铁律」时，
> **把「绝不主动合并 PR」这条血泪教训连同整节「沙盒坑与教训」一起删掉了**（2026-09-02 审计实测，
> 见 `docs/branch-audit-20260902.md` §4.2）。教训只要还寄生在会被重写的文档里，就会第二次丢。
> 本文件是**专用载体**，不参与交接文档的例行重写。
>
> 最后更新：2026-09-02（Session `01a061af`）· 来源：本仓 `HANDOFF.md` v6 §0.-1 / §0.1 / §9 #6 #7 #12 #13 #15 #17，
> 以及 `sunccchengze/ai` 的 `BRANCH-SAFETY.md`（快进推送手册，本仓已实测，见 §2）。

---

## 1. 🩸 核心事实：合 PR 会切断本会话与 GitHub 的链接

**触发条件**：本会话的 PR 被**合并或关闭**——不只是合并。`gh pr merge` 和 `gh pr close` 一样致命。

**后果**：Arena 立刻关闭本会话的远程通道。此后所有 `git push` / `gh` 调用全部失败，
而**尚未推送的提交随之永久丢失**。

```bash
gh pr create ...   # ✅ 开 PR 没问题
gh pr merge  ...   # 🩸 关闭远程通道
gh pr close  ...   # 🩸 同样关闭远程通道
```

**三条最容易踩的误解**（都实测过，别再推翻）：

| 误解 | 真相 |
|---|---|
| 「我只合不改，没事」 | 合并**或关闭**都触发；关 PR 也一样断 |
| 「分支还在就说明链接还健康」 | **别用分支存活判断**。本仓 7 个 PR 中 5 个合并后分支照旧存活（`delete_branch_on_merge` 是关闭状态），链接照样断 |
| 「我还能从 GitHub 侧查到链接状态」 | 查不到。通道健康只能在 Arena 会话内观察，GitHub API 一律返回正常 |

**前兆信号**：推送前先撞一次 gnutls TLS 报错，看着像网络抖动，**其实是会话将关闭的前兆**。
别机械重试超过 2–3 次——立刻 `commit` 并尝试推送，推不上去就按 §6 导 patch 并如实上报。

**Day 19 事故（这条铁律的由来）**：提交 `43b461d`（README 全文 + 3 个代码文件）在 PR #3 合并后
随旧会话关闭而丢失，只能由承泽手工粘贴 `D19_RECOVERY.md` 重建为 `1839aa5`。
**代价 = 一天的工作在 GitHub 上凭空蒸发，且重建只能靠人肉记忆。**

---

## 2. ⭐ 快进推送 —— 让内容进 `main` 而不碰 PR

**这是本手册最重要的操作。** 它既把成果送进 `main`，又完全不触发上面的陷阱。

```bash
git push origin <你的分支>:main
```

不开 PR、不合 PR、不关 PR，`main` 直接前进到你分支的位置。

| | PR 合并 | 快进推送 |
|---|---|---|
| `main` 拿到你的内容 | ✅ | ✅ |
| 触发 Arena 关闭远程通道 | 🩸 会 | ✅ 不会 |
| 之后还能 push / gh | ❌ | ✅ 能 |
| 留下 PR 记录 / code review | ✅ | ❌ 没有 |
| 产生 merge commit | 会 | 不会（线性历史） |

原理：`git push <分支>:main` 走**纯 Git ref 更新**，GitHub 侧只是把 `main` 这个指针挪一格，
不存在「PR 被合并/关闭」事件，因此不触发通道关闭。

### 完整流程（照抄即可）

```bash
# ── 0. 前置：工作区干净、该提交的都 commit 了 ─────────────
git status --short

# ── 1. 自检：main 必须是本分支的祖先，否则不能快进 ────────
git fetch origin main
git merge-base --is-ancestor origin/main HEAD \
  && echo "✅ FF 安全，可以推" \
  || echo "❌ main 有你没有的提交，先 rebase"

# ── 2. 先推自己的会话分支（保命，铁律 1：绝不攒提交）─────
git push origin <你的分支>

# ── 3. 快进推送到 main ─────────────────────────────────
git push origin <你的分支>:main

# ── 4. 核对：两个 ref 指向同一 commit ───────────────────
git ls-remote --heads origin | sed 's#refs/heads/##'
```

### 第 1 步说要 rebase 时

说明 `main` 上有你没有的提交，快进不成立。**禁止 `git push -f origin ...:main`**——
那会覆盖别人的工作。正确做法：

```bash
git fetch origin main
git rebase origin/main            # 把你的提交挪到 main 之上；解决冲突
git push -f origin <你的分支>      # 自己的分支可以 -f
git push origin <你的分支>:main     # 再快进
```

### 代价与边界（不粉饰）

- **没有 PR 记录、没有 review**。需要评审流程的场合请走 PR，并把合并留到会话最后一个动作。
- **要求线性历史**：`main` 必须是本分支祖先。
- **受保护分支不适用**：若 `main` 开了 branch protection 要求走 PR，推送会被拒——那时只能开 PR。
  （本仓 2026-09-02 无法核实保护状态：`gh api .../branches/main/protection` 返回 403
  `Resource not accessible by integration`，GitHub App 无读保护规则的权限。）
- **本会话与 Arena 的默认纪律仍是「只在 `arena/<id>-*` 分支上 commit/push」**。
  快进推 `main` 是对该纪律的**有意豁免**，必须先取得承泽明确同意，agent 不得自行按下去。

---

## 3. 十一条铁律（与 `HANDOFF.md` §0.-1 同步，此处为准）

1. **推送优先于一切。** 每个可交付单元立刻 commit + push 到**当前会话分支**。**绝不攒提交**；
   **未推送的提交 = 不存在的提交**（`af73fdc`、Day 19 `43b461d`）。
2. **🩸 绝不主动合并/关闭 PR。** 见 §1。合并只能是会话最后一个动作，或留给承泽在网页点。
   要继续干活就让 PR 开着；要把内容送上 `main` 而不开 PR，用 §2。
3. **推不上去时立刻导 patch 存档，然后如实上报。** 不静默跳过、不假装成功：
   ```bash
   git format-patch origin/main..HEAD -o /tmp/patches/
   git bundle create /tmp/backup.bundle HEAD
   ```
   （注意：`/tmp` 不随 clone 持久，必须在同一会话内把内容交给承泽，或提交进仓库内的普通目录。）
4. **引用任何数字前先自己复现，不许照抄。** Day 19 抓到 R² 错、Day 22 抓到 NSGA-II 是旧环境产物。
   答不出口径（训练集还是测试集、怎么复现），比数字低一点致命得多。
5. **遇到权限 / 网络 / 环境问题直接说，不要绕过去假装完成。** 见 §4。
6. **严禁破坏纯前端 WASM 架构**（`onnxruntime-web/wasm`，勿引入超 Cloudflare Pages 25 MiB 的 WebGPU JSEP 包）。
7. **零 AI 模板味**：禁通用圆角卡片/弥散投影，禁学术图表里的 Emoji，保持 Swiss Grid、1px 发丝线、等宽数字。
8. **数字口径按 E0→E4 四级证据链区分**，严禁把未验证的 Pareto 解说成「已通过 CFD 验证」。
   公开数字只出自 `evidence/`。
9. **诚实披露认知不确定度**（η 置信区间覆盖度作为主动学习航标）。
10. **深色模式优先**：`index.html` 锁 `data-theme="dark"`，`turbine-theme-v2`，首屏零闪烁。
11. **指导承泽本地操作一律给单行绝对路径命令**（Windows 同步协议）。

---

## 4. 沙盒坑与教训（血泪汇总 · 从 v6 HANDOFF §9 完整搬回）

1. `node_modules` 不跨会话持久；重要产物别只放 `dist/build/cache/__pycache__/.venv` 等被排除目录。
2. `pkill -f "uvicorn app.main"` 会匹配自身 shell；用 `pkill -f "uvicorn ap[p].main"`，且别和启动命令同一次调用。
3. **uvicorn 残留进程坑**：kill 父进程后子进程可能仍占 8000 端口，新服务失败但「看起来正常」（Day 21 实测：旧进程返回旧代码）。验证前 `ps aux | grep uvicorn` 清干净，验证后 `ss -tln | grep 8000` 确认释放。
4. **UTF-8 损坏史**：`HomePage.jsx` 曾出现 `arginTop` 这类截断；每会话开始跑一次中文文件体检（沙盒曾损坏中文文件）。
5. uvicorn 后台常驻会让 bash 显示超时，属正常。
6. 🩸 未推送的提交 = 不存在的提交（`af73fdc`）。
7. 会话权限不确定：**开工先 `git ls-remote` 探一次**。
8. GitHub 身份：`clone` 会把 `git config` 带成承泽本人。本仓既有约定 = author 保持 `sunccchengze`，
   并在 commit message 末尾追加 `Co-authored-by: arena-agent <297053741+arena-agent@users.noreply.github.com>`。
9. 聊天里贴 patch 会被改坏（空白/HTML 实体）→ 用「整篇覆盖 + 模糊匹配脚本」恢复，别指望 `git apply`。
10. 沙盒出口白名单：GitHub/PyPI/npm 通；`*.pages.dev`、`*.snapdeploy.app`、example.com 全 TLS 失败。**AI 验不了线上**。
11. 附件上传可能不落盘 → 让承泽直接粘贴内容（真实发生过）。
12. 🩸 **PR 一合并/关闭，会话远程通道即关**（Day 19 栽过）。铁律 2。
13. 推送前的 gnutls TLS 报错是会话将关闭的前兆，别机械重试超 2–3 次。铁律 3。
14. 🩸 别照抄历史数字（R² 与 NSGA-II 两笔都是）。口径必须写清。
15. 🩸 **GitHub App 无 `workflows` 权限**：推送含 `.github/workflows/*.yml` 的提交会被拒
    （`refusing to allow a GitHub App to create or update workflow ... without workflows permission`）。
    → workflow 类交付做成 `docs/*.md` 模板让承泽在 Actions 页手动安装（先例：`docs/verify-reproducibility-workflow.yml`）。
16. **作用域坑**：在子组件里用主组件 state → lint 报「declared but never used」+ 运行时 ReferenceError（Day 28 UQPage 实测）。状态留主组件，prop 传子组件。
17. 🩸 **huggingface.co 连不上**（Day 38 实测）：`curl -sI` 返回 exit 0 是**假阳性**，实际 GET 全部 000（TLS EOF）。
    测连通性用 `curl -o /dev/null -w "%{http_code}"` 发 **GET**。原始数据/重型训练走云 GPU。
18. **本仓 clone 是 shallow**（`.git/shallow` 卡在会话开头的 commit）：本地 `git merge-base` 会**假报「无共同祖先」**，
    跨家族祖先判断必须走 GitHub API `compare`，或 `git fetch --unshallow origin`（2026-09-02 实测踩中）。
19. **`技能库&准则/` 已把仓库撑到 1.29 GB / 44 189 文件**（2026-09-02 审计）。别再往里加 vendored 大文件；
    新技能库优先 submodule 或外部 Release。

---

## 5. 本仓实测记录

### 5.1 分支收敛审计（2026-09-02）

结论：11 条分支里 **9 条内容已完全被覆盖、1 条是唯一内容终点、1 条是 main 本身**；
唯一未合并的 `019fc539` 12 笔提交，其 23 个文件**全部**已被终点分支 `019ffee7` 以相同或更新版本收录
（21 个逐字节相同 + 5 个 ffee7 更新）。逐文件核验表见 `docs/branch-audit-20260902.md` §3。

### 5.2 快进推送实测 ✅ 本仓已验证（2026-09-02，Session `01a061af`）

本会话用它把 `arena/019ffee7`（+200 笔）与自己的一笔文档提交送上 `main`，全程 0 个 PR：

| 探针 | 结果 |
|---|---|
| `git merge-base --is-ancestor origin/main HEAD` | ✅ 通过 |
| `git push --dry-run origin HEAD:main` | ✅ 通过 |
| `git push origin <分支>:main` | ✅ `17e78a57..3eb11165`（2.3 s） |
| **推送之后**再 `git push origin <分支>` | ✅ 成功 —— **通道未被切断** |
| **推送之后** `gh api .../git/refs/heads/main` | ✅ 返回 `3eb11165` |

结论：与 `ai` 仓实测一致，快进推送不触发 Arena 关闭远程通道，push 与 gh 在推送后继续可用。
完整数据见 `docs/SESSION_HANDOFF-20260902.md` §2。注意：通道健康仍只能在会话内验证，GitHub 侧查不出来。

---

## 6. 通道断了怎么自救

1. **立刻停止重试推送**（超 2–3 次就是白耗）。
2. 本地若还有未推送提交，先导出：`git format-patch origin/main..HEAD -o /tmp/patches/` 或直接
   `git bundle create /tmp/backup.bundle HEAD`；把 patch 正文贴给承泽（本仓有先例：D19 靠粘贴 README 全文重建）。
3. 新开会话，让新 agent 读：本文件 → `docs/SESSION_HANDOFF-*.md` 最新一份 → `HANDOFF.md`。
4. 恢复提交用「整篇覆盖 + 逐文件比对」，不要用 `git apply`（§4 第 9 条）。
5. 如实向承泽上报丢了哪些、重建了哪些、哪些无法重建。

---

## 来源

- 本仓 `HANDOFF.md` v6：§0.-1 五条铁律、§0.0/§0.1 Day 19 恢复、§9 沙盒坑 #6 #7 #12 #13 #15 #17。
- 本仓 `docs/SESSION_HANDOFF-20260813.md` / `-20260814.md`：被弱化成的「不推 main。不主动开/合 PR。」一句。
- `sunccchengze/ai` → `BRANCH-SAFETY.md`（2026-09-02）：快进推送手册与对照表。
- `docs/branch-audit-20260902.md`：11 分支审计与逐文件核验。
