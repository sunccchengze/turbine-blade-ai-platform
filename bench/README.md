# bench/ —— 基准题库（S1 起）

> 建库时间：2026-09-03 · 会话分支：`arena/01a06630-turbine-blade-ai-platform`
> 上游规格：`-SKILL-/四个月脚印计划-2026Sep-Dec.md` §2 S1（该文件在 MBTI 仓，不在本仓）。
> 本目录只做「题 + 答案 + 出处」，不改 `evidence/`，不碰 PR。

## 1. 现在有什么

| 文件 | 作用 |
|---|---|
| `v0-q1-20.json` | 第一批 20 题（Q01–Q20），全部只用 `evidence/` 已冻结数字与本仓文档 |
| `validate_v0.py` | 自检器：结构 + 出处逐条复现 + 从 `data/processed/*.csv` 交叉复算 |
| `selftest_validator.py` | 反向自测：注入 11 种错误，要求自检器每次都抓到 |

```bash
python3 bench/validate_v0.py           # PASS 302 项检查（20 题）
python3 bench/selftest_validator.py    # PASS 反向自测：11 条注入错误全部被抓
```

两个脚本都只用标准库（沙盒里没有 numpy / onnxruntime / pyyaml）。

## 2. 怎么用（S2 才做，本会话不做）

**裸答**：只看 `question`，不看 `answer` / `source` / `note`，把答案写下来；
答完再翻出处对分。评分只认两件事：数字对不对、口径说不说得清（训练集还是测试集、怎么复现）。
`must_not_say` 里出现的说法，说出口即判负——那是对外会被宋老师/郭老师当场问穿的表述。

## 3. 字段约定

| 字段 | 含义 |
|---|---|
| `answer` | 唯一正确答案，必须能在 `source.path` 原文复现 |
| `source.path` + `source.pointer` | 出处：文件 + 字段/小节指针；`and[]` 是追加出处 |
| `source.expect` | 该指针处的字面值，自检器按它逐条比对（JSON 走精确取值，YAML 走块内子串，MD 走全文子串） |
| `grade` | 该题答案**本身**的证据等级，不是它引用的结论的等级 |
| `grade_note` | 等级为什么这么标（`metrics.json` 未标等级的口径类事实按 E1 记） |
| `must_not_say` | 说出口即错的表述 |
| `recheck` | 本会话对原始产物做过的复算结果 |

`grade` 取值：`E1` 静态数据/口径 · `E2` 代理预测 · `E3` 求解器趋势 · `E4` 真实 CFD 闭环 ·
`rule` 对外纪律条款 · `secondary` 本仓二次来源（论文原文不在工作区，页码未核）。

## 4. 本会话实测到的三件事（`flags` 同源）

1. **F1（Q09 口径矛盾）**：`nsga2_surrogate.delta_eta_vs_train_mean = 0.054`，
   但同源 `max_eta − train_mean_eta = 0.9173097 − 0.8703 = 0.0470`；`0.054 / 0.8703 ≈ 6.2%`，也不是 5.4%。
   前沿 100 点 η 均值 0.8964（差 0.0261）也对不上。**S1 没改 `evidence/`**（改口径要承泽点头），题库照实记冻结值并标注矛盾。
2. **F2**：`train_mean_eta = 0.8703` 实测等于 `plaid_rotor37_scalars.csv` **全部 1000 行**的 η 均值，
   不是 800 行训练子集的均值。字段名叫 `train_mean`，口径是全样本。
3. **F3**：`docs/paper1–3.pdf` 解压文本核验为 NASA TM-107310 / TM-106711 / TP-1337，
   **不是**郭老师的 SMO 2018/2021、KT-EGO、TNO。论文页码题（Q21+）在拿到原文前不建、不编页码。

## 5. 本会话**没有**复现的部分（不粉饰）

- **R² 类（Q02 / Q03）未独立重算**：沙盒无 `numpy` / `onnxruntime`，且 800/100/100 的具体切分顺序未在本仓脚本里固化。
  只做了跨源一致性核对：`README.md` 精度表与 `evidence/metrics.json` 逐位一致。
- **NSGA-II 未重跑**（`backend/scripts/generate_pareto_evolution.py` 依赖 pymoo/numpy）。
  改为核对产物：`data/processed/pareto_front_solutions.csv` 的极值与行数与冻结值一致。
- **Q19 / Q20 是二次来源**，出处是 `docs/guo-line-and-next-path.md`，不是论文原文。

## 6. 下一批（Q21+）槽位

SMO 2018（多保真选数据集）· SMO 2021（并行 MF-EI）· KT-EGO（d>20）· TNO 2025 CJA ——
**须先有 PDF 原文再建题**，页码从原文抄。当前工作区没有这四篇，见 F3。
