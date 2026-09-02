# 分支审计 · 2026-09-02（为「只留一个分支」准备的数据底稿）

> 状态：**已执行第 1–2 步**（见文末 §6 执行记录）：main 已快进到内容终点；旧分支按承泽决定全部保留；体积未动；tag 未打。
> 数据来源：本地 `git`（已 `git fetch origin '+refs/heads/*'`）+ GitHub REST API `compare` / `pulls`。
> ⚠️ 本仓 clone 是 **shallow**（`.git/shallow` = `17e78a57`），main 的真实父提交 `50d336c5` 不在本地。
> 因此本地 `git merge-base` 会假报「无共同祖先」——凡涉及跨家族祖先判断，一律以 API compare 为准。

---

## 1. 全分支总览（11 条）

| # | 分支 | tip | 末次提交 | 会话做了什么（内容） | 相对 main | 独有提交 | 文件数 | 工作树 | 判定 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `arena/019fb618` | `3aff43fc` | 2026-07-31 06:50 | Day 15–17：Design Space Explorer、可靠性修复、中英双语 UI | **behind** | **0** | 94 | 32.5 MB | 已全含 → 可删 |
| 2 | `arena/019fb74d` | `e23b7692` | 2026-07-31 08:51 | Day 17-18：Home/Explore 双语统一、部署验收、README 状态 | **behind** | **0** | 94 | 32.5 MB | 已全含 → 可删 |
| 3 | `arena/019fb778` | `08e22b54` | 2026-07-31 11:09 | Day 19–37：README 方法论节、Pareto-3D、演化动画、移动端、docs | **behind** | **0** | 109 | 33.1 MB | 已全含 → 可删 |
| 4 | `arena/019fb8ff` | `67e2ae7a` | 2026-07-31 16:26 | docs: add upgrade checklist（仅 1 个文件） | diverged | **1** | 110 | 33.1 MB | 该文件 ffee7 逐字节已有 → 可删 |
| 5 | `arena/019fbdff` | `e6b0e5d1` | 2026-08-01 15:48 | Day 38 升级蓝图 + 脱胎换骨冲刺；PR #6 即此分支 | **behind** | **0** | 140 | 33.7 MB | 已全含 → 可删 |
| 6 | `arena/019fc539` | `9cdeb370` | 2026-08-03 07:48 | **D40 全家桶**：GHG-01 宋老师评审、Pareto 证据链、讲座三件套、答辩作战包、runbook、4 张 PPT 图 | diverged | **12** | 161 | 34.3 MB | 见 §3：内容 100% 已被 ffee7 覆盖 → 可删 |
| — | **`main`** | `17e78a57` | 2026-08-08 16:13 | `Add files via upload`（GitHub 网页批量上传，父 = PR#7 merge `50d336c5`） | — | — | 157 | 70 MB | 两条家系的汇合点 |
| 7 | `arena/019fe072` | `f47b2686` | 2026-08-09 11:42 | D38–D43：装载技能库、backend/docs/frontend 大改、tasks/、D41 审计群、D43 设计方向 | **ahead** | 114 | 15 471 | 470 MB | 被 ffee7 线性包含 → 可删 |
| 8 | `arena/019feb03` | `eacef427` | 2026-08-12 16:20 | +53：首页/Predict/Explore 三页重设计（Swiss Grid、去 emoji、气动探针背景）、`videos/` 31 件、GHG-01…11 内阁复审、`.learnings/` 建档、**HANDOFF 升 v8** | ahead | 167 | 39 528 | 1.15 GB | 被 ffee7 线性包含 → 可删 |
| 9 | `arena/019ff6c7` | `b5d93614` | 2026-08-14 03:56 | +28：`教材/` 12 章、`AGENT_CHARTER`/`PROTOCOL`/`RESEARCH_BRIEF`/`CLAIM_EVIDENCE`、冻结 `evidence/`、About 页 D44、郭老师线、`SESSION_HANDOFF-20260813` | ahead | 195 | 44 722 | 1.29 GB | 被 ffee7 线性包含 → 可删 |
| 10 | **`arena/019ffee7`** | `a8d0fe1a` | 2026-08-15 14:31 | +5：A5 教材零搜索重塑 U01–U12、A6/A7 全量去 LaTeX 改 Unicode 平文本、DeepSearch 归档、`SESSION_HANDOFF-20260814` | ahead | **200** | 44 724 | **1.29 GB** | ⭐ **唯一需要保留的内容终点** |
| 11 | `arena/01a061af`（本会话） | = `17e78a57` | 未开工 | 无 | identical | 0 | 157 | 70 MB | 会话分支，勿删 |

**114 + 53 + 28 + 5 = 200** —— 家族 B 四条分支是一条严格线性链，没有任何分叉。

---

## 2. 家系结构（真相）

```
… → 50d336c5 (PR#7 merge, 8/3)
        │
   ┌────┴──────────────────────────────┐
   │ 家族 A（8/3 前，已随 PR#1–#7 入 main）│  019fc539 ── 12 笔 D40 提交（未走 PR）
   │  019fb618 →019fb74d →019fb778 → …  │
   └────┬──────────────────────────────┘
        │
     17e78a5  main 「Add files via upload」(8/8, 网页上传，非 git 流程)
        │
   019fe072 (+114) → 019feb03 (+53) → 019ff6c7 (+28) → 019ffee7 (+5)   ← 家族 B，线性
```

- 家族 A 6 条：全部是「会话分支 + PR 已合并」的残留，`compare` 显示 `behind` 或 `ahead=1/12`。
- 家族 B 4 条：main 是它们的祖先，彼此严格线性，最新 = `019ffee7`。
- PR 台账（7 个，全 MERGED）：#1→`019fb618`、#2/#3→`019fb74d`、#4→`019fb778`、#5→`019fb861`(分支已删)、#6→`019fbdff`、#7→`019fc343`(分支已删)。**与 `sunccchengze/ai` 手册一致：`delete_branch_on_merge` 关闭时，7 个 PR 只有 2 条分支被删。**

---

## 3. 唯一「未合并」内容 = `019fc539` 的 12 笔提交 —— 逐文件核验

| 文件 | 在 ffee7 中 |
|---|---|
| `GHG-01.md`、`backend/app/model.py`、`backend/app/routers/predict.py`、`backend/data/processed/pareto_evidence.json`、`backend/scripts/{reproduce_r2,pareto_evidence,eval_official_test_split,make_lecture_figs}.py`、`docs/{defense-ops-D40,defense-ppt-script-D40,lecture-plan-v2,lecture-script,runbook-0804,verify-reproducibility-workflow.yml}`、`docs/lecture-figs/*.png`(4)、`docs/upgrade-checklist.md` | ✅ 逐字节相同 |
| `README.md` | ⚠️ ffee7 更新（口径降级：「NSGA-II 找出 Pareto 最优解」→「生成**代理模型预测的** Pareto 候选，仍需真实 RANS 复核」；部署改「Cloudflare Pages + 浏览器内 ONNX，无冷启动后端」） |
| `frontend/src/pages/HomePage.jsx` | ⚠️ ffee7 重写版（8/12 首页重设计） |
| `backend/data/processed/pareto_evidence_report.md` | ⚠️ ffee7 是 8/8 重跑版，本分支是 8/3 版 |
| `docs/lecture-analogy-handbook.md` | ⚠️ ffee7 加了 A1 限定语（「只给对外短讲，不是对承泽的 1:1 讲课术」） |
| `docs/defense-pitch-D40.md` | ⚠️ ffee7 更正 RANS 状态（「环境就绪」→「coarse 非收敛、fine 受内存限制」） |

**结论：`019fc539` 无任何内容需要抢救**；丢失的只是「这 12 步是怎么一步步做出来的」这段提交叙事（`main` 里对应位置被 8/8 的网页上传压平了）。
同理，家族 A 其余分支相对 main 独有文件数 = 0，家族 B 前 3 条相对 ffee7 独有文件数 = 0。
`main` 相对 ffee7 缺失文件数 = **0**（ffee7 完全不回退 main 的任何文件）。

---

## 4. 只留一个分支时的两个真问题（比分支本身更麻烦）

### 4.1 体积：`019ffee7` = 44 724 文件 / 1.29 GB 工作树

| 顶层目录 | 大小 | 文件数 |
|---|---|---|
| `技能库&准则/` | **1 124.2 MB** | 44 189 |
| `data/`（含 `pointcloud/rotor37_pc.npz` 66 MB） | 67.7 MB | 11 |
| `docs/` + `docs/征凤记14节/` | 51.3 MB | 259 |
| `videos/` | 19.6 MB | 32 |
| `backend/` + `frontend/` + 其余 | ~27 MB | ~230 |

- 好消息：**没有任何 `node_modules` 被提交**（grep = 0），`.gitignore` 有效。
- 坏消息：`技能库&准则/` 是第三方 vendored 仓 + zip/gif/mp4 的大杂烩（单文件最大 27.5 MB 的 `security-bench-haiku-responses.json`、两个 9.97 MB 同内容 gif、`llm-wiki-skill-main.zip` 13 MB…），它从 220 → 15 272 → 39 088 → 44 189 文件逐会话膨胀，把 1.29 GB 钉进了历史。
- 本地 `.git` 实测 758 MB（且这还是 shallow 的）。

### 4.2 那条血泪教训本身

`HANDOFF.md` 在 `019feb03` 被重写成 v8「七条铁律」，**「绝不主动合并 PR」整条丢失**；只剩 `docs/SESSION_HANDOFF-2026081{3,4}.md` 一句无来由的「不推 main。不主动开/合 PR。」。合并后保留哪个版本，决定下一个 agent 会不会再把会话通道搞断。

---

## 5. 建议的收敛方案（待拍板，未执行）

1. **先上保险**：给 10 条 `arena/*` tip 各打一个 `archive/<分支名>` tag 推上去（分支可删，tag 保命，零成本、不改历史）。
2. **主线**：`019ffee7` → `main`。因 main 是其祖先，**可用 `git push origin arena/019ffee7-...:main` 快进**（见 `sunccchengze/ai/BRANCH-SAFETY.md`），或走 PR 但把合并留到会话最后一步。
3. **补铁律**：把「绝不主动合并/关闭 PR」+ 快进推送手册补进 ffee7 的 `HANDOFF.md` 铁律区与 `.learnings/LEARNINGS.md`（critical 级）。
4. **瘦身（可选，收益最大）**：`git rm -r --cached 技能库&准则/` + 写进 `.gitignore`，或把 npz/zip/gif/mp4 移到 Release/LFS。注意这只冻结**未来**体积，历史里的 1.29 GB 仍在；要真减需 `git filter-repo` 重写历史（会改所有 hash，Arena 会话分支绑定会失效 → 只能你本地做，不能我在会话分支上做）。
5. **删除**：确认无遗漏后，删 9 条 `arena/*` 分支（本会话分支除外），只留 `main`。

### 待你拍板的 4 个点
- 收敛终点用「快进推 main」还是「开 PR、你在网页点合」？
- 旧分支是「打 tag 后删除」还是「直接删除」还是「保留不动」？
- 要不要在本轮做瘦身（4.1）？若做，是仅 `--cached` 移除（安全）还是接受历史重写（彻底但断会话）？
- 铁律补写范围：只 `HANDOFF.md`，还是 `HANDOFF.md` + `.learnings/LEARNINGS.md` + 新建 `docs/BRANCH-SAFETY.md`（把 ai 仓那份手册搬进来，来源标注）？

---

## 6. 执行记录（2026-09-02）

| 计划步 | 状态 | 说明 |
|---|---|---|
| 1 打 `archive/*` tag | ✅ 已做 | 10 个 annotated tag 已推：`archive/019fb618` … `archive/019ffee7`，各自指向分支 tip |
| 2 主线收敛 | ✅ 已做 | 会话分支 ff-merge 到 `a8d0fe1a` → 提交 `3eb11165` → `git push origin arena/01a061af-...:main`，main `17e78a57..3eb11165`（+201 笔），**全程 0 PR** |
| 3 回补铁律 | ✅ 已做 | HANDOFF 铁律 7→11 条 + §0/§9/§10/§11 回补；新建 `docs/BRANCH-SAFETY.md`；`AGENT_CHARTER` 第 11–14 条；`.learnings` LRN-20260902-01/02 + ERR-20260902-01 |
| 3b 叙事保全 | ✅ 已做 | `git merge -s ours` 并入 `019fb8ff`(1 笔) 与 `019fc539`(12 笔)，两次均校验 `HEAD^{tree}` == `HEAD^1^{tree}`（零文件改动）；并生成 `docs/journey-历程总表.md`（391 笔分段汇编，段计数之和 == `rev-list --count HEAD`） |
| 4 体积瘦身 | ⏸️ 承泽决定不做 | 1.29 GB / 44 189 文件原样进 main |
| 5 删除 9 条分支 | ✅ 已做（承泽指令） | 10 条 `arena/019f*` 全部删除，`archive/*` tag 10 个全部保留 |
| 6 过期文档加时效标记 | ✅ 已做 | 20 份日期型文档顶部加 `⛔ 时效标记`，逐行标注作废指令；正文未改；6 个误伤已回滚 + `terminology.md` 直接更正该行 |

**顺带产出**：`main` 首次包含 `教材/`、`evidence/`、`videos/`、`.learnings/`、`docs/BRANCH-SAFETY.md`
与 v8 之后全部工作；`docs/verify-reproducibility-workflow.yml` 仍是模板（受 §9 #15 限制，需承泽在 Actions 页手动装）。

