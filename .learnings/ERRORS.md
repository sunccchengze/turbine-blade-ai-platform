# Errors

Command failures, integration errors, and critical precedent rollbacks.

---

## [ERR-20260810-01] 混淆压气机载体与涡轮概念 (Critical)
- **Severity**: critical
- **Context**: 论文摘要与答辩 Deck 撰写
- **Error Description**: 容易将 NASA Rotor 37 压气机混淆为燃气涡轮透平叶片。
- **Root Cause**: 未严格区分上位概念（叶轮机械）与验证载体（Rotor 37 压气机）。
- **Resolution / Prevention**: 全站统一术语标准：上位叶轮机械，载体 Rotor 37 压气机，引子 KIT 无压气机燃气轮机。

---

## [ERR-20260810-02] 代理预测与物理验证混为一谈 (High)
- **Severity**: high
- **Context**: Pareto 前沿与代理模型能力宣称
- **Error Description**: 在 RANS 未完全收敛的情况下直接宣称“找到性能提升 5.8% 的物理最优叶型”。
- **Root Cause**: 缺乏科研证据分级意识，将代理模型推断等同于物理实验结论。
- **Resolution / Prevention**: 严格执行 stage-guardrails-D41.md，所有数字明确标注来自代理预测 (E2) 还是 RANS 真实求解 (E3/E4)。

---

## [ERR-20260813-04] 清 OVERRIDE 时误删 UNITS 列表 (High)
- **Severity**: high
- **Context**: `教材/web/build_local.py`
- **Error Description**: 用「行里含 `"U0`/`U1`」过滤旧题号覆盖时，把 `UNITS = [("U01", ...)]` 一并删空，重建脚本只出期末卷。
- **Root Cause**: 过滤条件按前缀而不是按字典键。
- **Resolution / Prevention**: 改构建脚本用结构删除，禁止按 `"U0` 扫整文件；改完立刻跑 `python 教材/web/build_local.py` 看 12 行 unit 输出。

## [ERR-20260813-03] 用了技能却不显式点名 (High)
- **Severity**: high
- **Context**: 教材全本重塑后的回复
- **Error Description**: 承泽问「你到底用了哪些技能和专家」。回复没有调用表。扫了 3005 个 SKILL.md 路径，精读只有内阁、Deep Tutor、Humanizer、Stop-slop、科学批判、不确定度。
- **Root Cause**: 把「遍历技能库」做成扫描充数；漏 LRN-20260810-01。
- **Resolution / Prevention**: 凡改教材/讲课，回复开头必须有席位+技能表。写「打开了但判定用不上」。禁止把路径扫描说成精读。

## [ERR-20260813-02] 教材第一章用未定义名词开讲，不能自学 (Critical)
- **Severity**: critical
- **Context**: 教材 U01 旧版「红线与证据等级」
- **Error Description**: 一上来甩代理、ONNX、留出集、R²、SU2（被听成 SUR）、relrms、RANS、null、细网格多点，且练习考本章没教的 PINN/TNO。
- **Root Cause**: 把「郭老师会先问证据档」做成第一章，违反先认机器；未执行先认词。
- **Resolution / Prevention**: changelog A3；目录机器先行、证据档 U11；每章先认词；练习不超纲。

## [ERR-20260813-01] 把深入浅出做成儿童故事，深度被抽空 (Critical)
- **Severity**: critical
- **Context**: teach-back Q4（MC Dropout / 覆盖率 / 保形）
- **Error Description**: 用成绩单、收得住、儿童游戏式比喻代替定义、操作、公式和 `evidence/` 数字；74 维被说成成绩单/总结数字；该出现的「收敛」被口语「收得住」替换。承泽判定为小儿科，要求重做。
- **Root Cause**: 把「零先验」理解成「讲给小孩」；只降门槛、不挖深层；`docs/lecture-analogy-handbook.md` 的讲座短类比被误当成 1:1 讲课术。
- **Resolution / Prevention**: 强制 skill `技能库&准则/chengze-deep-tutor/SKILL.md`；风格变更只追加 `docs/tutor-style-changelog.md`；Q4 正讲见 `docs/teachback-Q4-MC-Dropout.md`。

---

## [ERR-20260810-03] AI 模板腔与非工程化视觉污染 (High)
- **Severity**: high
- **Context**: 前端界面与 PPT 制作
- **Error Description**: 出现大面积紫色渐变、带厚阴影的悬浮卡片、Emoji 符号（如火、齿轮、火箭等）等。
- **Root Cause**: 未调用 Stop-slop.md、taste-skill 与 ui-ux-pro-max 规则库。
- **Resolution / Prevention**: 严格执行 1px 发丝边框、等宽字体数据展示、标准三线表与 Swiss Grid 网格系统。

## [ERR-20260814-01] 教材「加厚」仍不能自学：定义不闭环、先认词表自引用 (Critical)
- **Severity**: critical
- **Context**: 教材 U01–U12（A4 加厚版）
- **Error Description**: ①U01 总压定义里用「等熵」，等熵排在后面；声速定义用「静温」，静温从未定义；γ、R 无值。②U02 表里出现「焓、激波、附面层、动量矩」不标注来源章。③「先认词表」被当正文甩出，正文不再逐词讲。④公式符号无单位无数例（如 Δh₀ 公式）。⑤CSV/JSON/字段等电脑名词默认读者会。结论：650 分零先验读者逐句读不通，必须边读边搜。
- **Root Cause**: 把「加厚」理解成「每章都有六层段落」，没做定义闭环审计；讲课者默认读者认识大学物理与仓库术语。
- **Resolution / Prevention**: changelog A5；SKILL.md §10 零搜索铁律；U01 起逐章重塑；每章重塑后以「零搜索」验收。

## [ERR-20260902-02] 把已作废的后端部署规则当现行规则告诉用户（回补 v6 时未与架构对账）(Critical)
- **Severity**: critical
- **Context**: 2026-09-02 仓库收敛；我在汇报「删除分支前的副作用」时
- **Error Description**: 引用 v6 HANDOFF §0.2「后端改动 → 合入 main 后必须 SnapDeploy 手动 Redeploy」，并断言本次 main 前进 202 笔含后端改动、需要承泽手动 Redeploy 线上后端。项目自 v8（2026-08）起已纯前端化，无任何部署中的后端，该规则早已作废；且我在回补 §9/§10 时把这条死规则一并写进了 `HANDOFF.md`。
- **Root Cause**: 回补历史文档时只做了「v6 有、v8 没有 → 补回去」的差集，没做「这条现在还是真的吗」的校验；把文档存在性当成事实有效性。
- **Resolution / Prevention**: ① 用代码复核：`frontend/src/utils/api.js` 载入 `onnxruntime-web/wasm` + `/models/surrogate_model.onnx` + `/data/*.json`，前端无 API 基址（`grep -rn "VITE_API_URL|localhost:8000" frontend/src` 为空）；② 删除 HANDOFF §10 的 Redeploy 条目并标注作废，新增 §9.5「架构现状」与 §9 #20「回补旧文档必须与现行架构对账」；③ 配套 LRN-20260902-03；④ 收工前自查：本轮所有「你必须手动去做 X」类断言，逐条回到代码或现行铁律里找出处。

## [ERR-20260902-01] HANDOFF v8 重写删掉了「绝不主动合并 PR」与整节沙盒坑 (Critical)
- **Severity**: critical
- **Context**: `019feb03` 把 HANDOFF 从 v6 五条铁律重写为 v8 七条铁律（2026-08-12）
- **Error Description**: v8 的七条里第 2 条被换成「严禁破坏纯前端 WASM 架构」，铁律「绝不主动合并 PR」整条消失；v6 的 §9「沙盒坑与教训（血泪汇总）」17 条、§0.1 Day 19 恢复流程、§0 开场必做清单同样全部丢失。只剩 `docs/SESSION_HANDOFF-20260813.md` / `-20260814.md` 各一句无来由的「不推 `main`。不主动开/合 PR。」——没有触发条件、没有后果、没有自救路径。后果：读 v8 HANDOFF 开工的会话会以为可以随手合 PR，重演 Day 19（未推送提交随会话关闭而丢）。
- **Root Cause**: 重写总文档时按「本轮主题」取舍内容，把与当轮任务无关的运维纪律当噪音删掉；且纪律只寄生活在会被重写的正文里，无专用载体、无条目级校验。
- **Resolution / Prevention**: 2026-09-02 回补：铁律恢复为 11 条（§0.-1）、§9 沙盒坑回补并增补 #18 shallow 假报无共同祖先、#19 体积；细则迁入专用文件 `docs/BRANCH-SAFETY.md`，HANDOFF 顶部挂「开工必读」指针并写明「下次重写禁止再删铁律区与 §9」；配套 LRN-20260902-02 强制重写前做条目级 diff + 收工 grep 自检。

