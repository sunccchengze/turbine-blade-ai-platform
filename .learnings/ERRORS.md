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
