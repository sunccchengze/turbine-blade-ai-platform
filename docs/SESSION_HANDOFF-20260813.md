# 本会话交接（2026-08-13 · `019ff6c7`）

下一会话**先读本文件**，再读宪章和 skill。根目录 `HANDOFF.md` 仍是 2026-07/08 初的旧作战本，里面的「MDO 平台 / 本科二年级 / 100,000× 当贡献 / P1–P4 已 Gate」**不得当现状**。

## 0. 环境

```
仓库: sunccchengze/turbine-blade-ai-platform
分支: arena/019ff6c7-turbine-blade-ai-platform   ← 只在这条上 commit/push
HEAD: ef7f2e4a  rewrite: reorder textbook machine-first, define every noun
上一笔: d1cc8f67  学习站公式不再漏 \( \)
```

开工：

```bash
git fetch origin arena/019ff6c7-turbine-blade-ai-platform:refs/remotes/origin/arena/019ff6c7-turbine-blade-ai-platform
git reset --hard origin/arena/019ff6c7-turbine-blade-ai-platform
```

Windows：`cd /d D:\turbine-blade-ai-platform && git fetch origin && git checkout arena/019ff6c7-turbine-blade-ai-platform && git pull origin arena/019ff6c7-turbine-blade-ai-platform`

不推 `main`。不主动开/合 PR。

## 1. 人与目标

- 孙承泽：西交大能动强基 2501，两机，大一升大二。高数入门可当桥；马赫/等熵/RANS/神经网/代理/ONNX **从零定义**。
- 长期：跨音速压气机气动、代理、以后才谈 MDO。毕业现实目标 **Level 2**（宪章）。
- 对外名：**气动代理筛选站**。禁：MDO（结构/热未接）、可制造 Pareto、校准 95% CI、PINN 当现状、Rotor 37=涡轮、信里点宋老师。
- 学长终态：知道何时可信、能出真实几何、接受 RANS 裁决、全过程可复现。
- 郭信：`docs/暑期总结-致郭振东-发送正文.txt`，发送包 `docs/郭老师发送包.md`。是否已发出：本会话**未确认**。

## 2. 本会话做了什么

1. **公式渲染** `d1cc8f67`：`player.js` 正则多转义，表格露出 `\(\pi\)`。已内置 KaTeX，`_\max` 先加花括号。
2. **教材重排** `ef7f2e4a`：U01=机器与三个数；证据档改 U11；每章先认词+仓库指认；日历不锁两周。
3. 预备篇 `教材/00-怎么读这本书.md`、`教材/名词本.md`、学习站 `教材/web/how.html`。
4. 教学纪律 A3：`docs/tutor-style-changelog.md` + `技能库&准则/chengze-deep-tutor/SKILL.md`。
5. 承泽拍板：先验=高数可当桥；目录由技能定；打破两周；验收=发送包十问+能指仓库。

## 3. 诚实边界（下一手不要吹满）

- 12 章正文均已按六层加厚（U01/U11 重写；U02–U10、U12 加厚完成）。练习题号未改。若某章仍读卡，按章号再挖，不要再整本推倒。
- 3005 个 SKILL.md **扫过路径，没有逐份精读**。真正进正文的见下节。
- 决策指标仍全 `null`。无 CST/FFD，无收敛 RANS 表。融合 R² / conformal 93.5–96.5% / 100,000× **未冻结**。
- 线上 Pages 可能仍滞后本分支（进口总压 / 100000× / 多学科）。发信前按发送包 §4 核对。
- Q4 三句复述（权重/覆盖率/加宽）、Q5 teach-back：**未完成**。Deep Tutor 曾按本人要求暂停。
- `技能库&准则/SKILL运用指南.md` 仍有未解决 `<<<<<<<`，不要整文件乱改。

## 4. 冻住的数（只认 `evidence/metrics.json`）

- holdout n=100 seed=42：R² π 0.9844 / η 0.9561 / ṁ 0.9827
- η_max 0.9173（代理，相对训练均值 0.8703 为 +5.4%）
- ṁ_max 21.74 kg/s @ η≈0.873；π_max 2.1073
- 覆盖率 89/65/88；名义 95% 启发式带，未校准
- SU2 粗网格 relrms=−3.39，`converged=false`，E3
- ONNX ≈2.11 MB，523011 参数；P=**背压**

## 5. 下一会话建议顺序

1. 装载：本文件 → 宪章 → Deep Tutor skill + changelog **最后一条（A3）**。
2. 回复开头必须有**技能/席位显式表**（LRN-20260810-01）。扫过 ≠ 用过。
3. 承泽若继续自学：从 `教材/web/how.html` 或 U01 开始。哪章读卡，按 U01 标准加厚那一章（优先 U02 欧拉或 U04 RANS）。
4. 若发郭信：走发送包 §4–5；先核对线上站口径。
5. 工程不要发明 CFD。Level 2 三块铁证仍缺。

## 6. 关键路径

- 讲课：`技能库&准则/chengze-deep-tutor/SKILL.md`、`docs/tutor-style-changelog.md`
- 宪章：`docs/AGENT_CHARTER.md`
- 教材：`教材/00-怎么读这本书.md`、`教材/U01-…` … `U12-…`、`教材/名词本.md`
- 学习站：`教材/web/`（`python 教材/web/build_local.py`）
- 郭：`docs/郭老师发送包.md`
- 内阁记录：`docs/教材重塑-目录与内阁.md`
