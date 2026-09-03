# bench/ —— 基准题库（S1 第一批 · v0）

> 用途：给后续会话「裸答」（S2）用的 20 题，每题唯一答案、每题可翻出处。
> 建立：2026-09-03，会话 `arena/01a0662f-turbine-blade-ai-platform`。

| 文件 | 说明 |
|---|---|
| `v0-q1-20.json` | 20 题正文。`expected` 字段 = 从 `evidence/metrics.json` 逐字段核对的期望值 |
| `verify_v0.py` | 只用标准库；`python3 bench/verify_v0.py` 逐题比对原文，退出码非 0 即有抄写误差 |

## 来源分级（与仓库 E0→E4 证据链一致）

- Q01–Q13、Q18：`evidence/metrics.json`（E2 / E3），数值全部由 `verify_v0.py` 机器核对
- Q14–Q17：`evidence/claims.yaml`（E1 / E4），文本锚点核对
- Q19–Q20：`docs/guo-line-and-next-path.md`（**二次来源**），论文页码留 `reserved_slots` Q21–Q24，PDF 不在工作区前不填

## 与交接草稿的差异（落地时改的）

1. Q01 字段名按原文写 `random_state`，不写 `seed`
2. Q17 由「举两例」改为「7 条全列」——否则答案不唯一，违反「每题唯一正确答案」
3. Q09 口径拆成两层写进 `note`：`claims.yaml C02` 允许「相对训练均值约 +5.4%」，`guo-line` §3 规定进组汇报不报 5.4%；两条都是原文
4. Q18 补了可机器核对的 `nominal` / `label` 字符串（第一次跑 verify 被抓出无锚点）

## 规则

- 改题先改 `expected`，再跑 `verify_v0.py`，绿了才 commit
- 不得为 Q21+ 编造论文页码（`HANDOFF.md` 铁律 4）
- 不得把任何 E2 数字写成 CFD 验证（铁律 8）
