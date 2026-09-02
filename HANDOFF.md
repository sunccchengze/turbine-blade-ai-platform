# HANDOFF.md —— 会话交接总文档（叶轮机械 AI 平台 · v8 终极完全体）

> **写给下一会话的 AI Agent（和孙承泽本人）**：读完本文件与 `学习路.md`，你应该能 100% 接手本项目与承泽的长期科研成长辅导，不丢任何上下文、不重复劳动、严格执行苏格拉底式 Deep Tutor 教学。
>
> **最后更新**：2026-09-02（Session `01a061af` · 仓库收敛 + 会话纪律回补）
> **项目线上地址**：`https://turbine-blade-ai-scz.pages.dev/`（Cloudflare Pages 全球 CDN）
> **关联大创仓库**：`sunccchengze/wind_farm_viz`（风电场偏航优化可视化系统，技能库已 100% 对齐）
> **当前会话分支**：`arena/01a061af-turbine-blade-ai-platform`
> **‼️ 开工必读（高于本文件任何一节）**：`docs/BRANCH-SAFETY.md` —— Arena 会话通道安全手册。
> v8 重写曾把「绝不主动合并 PR」连同整节沙盒坑删掉，本文件不再承担这份纪律，改由该文件专载。
> **对外名称**：气动代理筛选站（结构/热接入前禁用 MDO）
> **Agent 宪章**：`docs/AGENT_CHARTER.md` · 目标 Level 2 · 公开数字只出 `evidence/`
> **对承泽讲课**：`技能库&准则/chengze-deep-tutor/SKILL.md` + `docs/tutor-style-changelog.md`（A1：深入浅出，禁儿童故事，禁生词硬猜）
> **继承提交**：`a8d0fe1a`（`arena/019ffee7-turbine-blade-ai-platform`，A7 全量去 LaTeX 版）——2026-09-02 仓库收敛后的内容终点
> **收工指针**：当前会话以 **`docs/SESSION_HANDOFF-20260902.md`** 为准；`docs/SESSION_HANDOFF-20260813.md` / `-20260814.md` 与 `docs/branch-audit-20260902.md` 为历史与背景。讲课术以 `docs/tutor-style-changelog.md` 最后一条（现 A7）为准。本文件 §2 里 η 从 0.9211 暴跌等旧叙事不得写入给郭老师的信。

> ⚠️ 2026-09-02 修订说明：v8 重写时**删掉了** v6 的「绝不主动合并 PR」铁律与整节「沙盒坑与教训（血泪汇总）」，
> 当时只剩 `SESSION_HANDOFF` 里一句无来由的「不推 main。不主动开/合 PR。」。现已把二者回补（§0.-1 十一条 + 文末 §9），
> 并把细则迁入 `docs/BRANCH-SAFETY.md`。**下次重写本文件时，禁止再删铁律区与 §9。**

---

## ‼️ 0.-1 十一条铁律（全代 Agent 必须时刻铭记）

> 1–5 为**会话/仓库纪律**，2026-09-02 从 v6 回补（v8 曾整段删除）；6–11 为 v8 原有的工程/学术纪律。
> 细则、命令与实测记录在 **`docs/BRANCH-SAFETY.md`**，本节只留结论。

1. **推送优先于一切。** 每完成一个可交付单元，立刻 `git add -A` + `git commit` + `git push origin <当前会话分支>`。**绝不攒提交**。**未推送的提交 = 不存在的提交**（`af73fdc`、Day 19 `43b461d` 两笔实证）。
2. **🩸 绝不主动合并 PR。** Arena 会在 PR **合并或关闭**后立刻关闭本会话的远程通道，之后所有 push / gh 全失败，未推送的提交随之丢失。
   → 合并 PR 只能是会话的**最后一个动作**，或留给承泽在 GitHub 网页点。要继续干活就让 PR 开着。
   → **别用「分支还在不在」判断通道是否健康**：本仓 7 个 PR 里 5 个合并后分支照旧存活，链接照样断。
   → 要把内容送上 `main` 又不碰 PR：`git push origin <你的分支>:main` 快进推送（须承泽同意，见 `docs/BRANCH-SAFETY.md` §2）。
3. **推不上去时，立刻导 patch 存档，然后如实上报。** 不要静默跳过、不要假装成功：
   `git format-patch origin/main..HEAD -o /tmp/patches/` 或 `git bundle create /tmp/backup.bundle HEAD`。
   推送前的 gnutls TLS 报错是**会话将关闭的前兆**，别机械重试超 2–3 次。
4. **引用任何数字前先自己复现，不许照抄。** 🩸 Day 19 抓到 R² 错的；Day 22 又抓到 NSGA-II 数字是旧环境产物。宋老师是 MDO 教授，「训练集还是测试集」「怎么复现」是最基本一问。**答不出口径，比数字低一点致命得多。**
5. **遇到权限 / 网络 / 环境问题，直接说，不要绕过去假装完成。** 沙盒有网络白名单（§9 #10 #17）；GitHub App 无 `workflows` 权限（§9 #15）；本仓 clone 是 shallow（§9 #18）。
6. **严禁破坏纯前端 WASM 架构。** 平台已彻底从 SnapDeploy 60~90s 冷启动解脱出来，推断全部跑在浏览器 WASM（`onnxruntime-web/wasm` 13.4 MB CPU SIMD），严禁擅自引入会超 Cloudflare Pages 25 MiB 限制的 WebGPU JSEP 包。
7. **严格执行零 AI 模板味（Anti-AI Slop）。** 
   - 杜绝通用圆角卡片、粗边框与弥散投影；
   - 严禁在专业学术图表中使用 Emoji（🚀, 🔥, 📊, ⚙️, ✅, ⚠️, ⏸️）；
   - 保持瑞士国际主义网格（Swiss Grid）、1px 发丝线与等宽数字对齐。
8. **数字口径严格区分四级证据链（E0 $\to$ E4）。**
   - E0：规划（E0 Planning）；
   - E1：静态数据（E1 Static Baseline）；
   - E2：代理模型预测（E2 Surrogate Predicted，Pareto 100 组候选）；
   - E3：求解器定性趋势（E3 Solver Trend，SU2 粗网格 140k $relrms=-3.39$）；
   - E4：全闭环真实 CFD 验证（E4 Closed-loop RANS，国家超算精细网格 3.55M）；
   - **严禁向评审宣称未经验证的 Pareto 解为“已通过 CFD 验证”或“可直接加工”**。
9. **诚实披露认知不确定度。** $\eta$ 65% 置信区间覆盖度作为认知不确定度（Epistemic Uncertainty）指标诚实披露，并作为主动学习（Active Learning）进一步 CFD 采样的航标。
10. **始终默认深色模式（Dark Mode First）。** `index.html` 根节点锁定 `data-theme="dark"`，LocalStorage 使用 `turbine-theme-v2`，保证首屏零闪烁。
11. **Windows 同步命令协议（Rule 13）。** 凡指导用户本地操作，一律提供单行绝对路径命令：
    ```bat
    cd /d D:\turbine-blade-ai-platform && git fetch origin && git checkout <当前会话分支> && git pull origin <当前会话分支>
    ```

---

## 0. 开场必做清单（前 10 分钟 · 2026-09-02 从 v6 回补，v8 曾删）

```bash
cd /home/user/turbine-blade-ai-platform
git fetch origin
git log --oneline -8
git status
git rev-parse --is-shallow-repository   # true → 本地 merge-base 会假报「无共同祖先」，见 §9 #18
git ls-remote origin >/dev/null 2>&1 && echo "REMOTE OK" || echo "REMOTE BLOCKED"
```

- **`REMOTE BLOCKED` = 会话通道已断**（多半是上个会话合了 PR）。立刻转 `docs/BRANCH-SAFETY.md` §6 自救流程，不要继续写代码。
- UTF-8 体检（中文文件名与中文内容曾被沙盒损坏）：每会话开跑一次。
- 前端依赖：`cd frontend && npm install --no-audit --no-fund && cd ..`（`node_modules` 不跨会话持久）。
- 开工前**显式声明**本次装载的技能/席位表（`.learnings/LEARNINGS.md` LRN-20260810-01）。

---

## 1. 核心基本面与人物画像 (User & Mission Profile)

| 核心维度 | 关键信息 |
|---|---|
| **研究者 / 负责人** | **孙承泽**（西安交通大学能动学院 · 能动强基 2501 班，燃气轮机与航空发动机“两机”方向，大一升大二） |
| **主攻方向** | 燃气轮机与航空发动机“两机”国家重大战略方向、气动热力学、多学科设计优化 (MDO) |
| **指导教师 / 汇报对象** | **郭振东** 副教授（班主任，能动学院/太行国家实验室双聘，ex-NTU DSAIR 机器流体动力学专家）<br>**宋立明** 教授（叶轮机械研究所副所长、两机重大专项负责人） |
| **学术长远目标** | 直博交大“两机”重大专项课题，大三赴海外顶级实验室（MIT GTL / Cambridge Whittle / NTU / Stanford）访问交流 1 年，发表 ASME Turbo Expo / Journal of Turbomachinery 顶刊 |
| **当前核心武器库** | 1. 纯前端 WASM 0.23ms 优化平台 (`https://turbine-blade-ai-scz.pages.dev/`)<br>2. 40 分钟郭老师组会大师汇报全景讲稿 (`docs/defense-40min-master-script-Guo.md`)<br>3. 58 大领域专业技能库与 Open Code Review 规则库 (`技能库&准则/`)<br>4. 13 大师内阁智囊团与女娲蒸馏体系 (`技能库&准则/nuwa-distilled/`)<br>5. 5 阶段本科到博士全景学习路线图 (`学习路.md`)<br>6. 《御风记》第 11 讲影视级全自动科普视频 (`videos/御风记_第11讲_温度与材料极限_为什么航发这么难造.mp4`) |

---

## 2. 物理洞察与气动第一性原理 (Aerodynamic First Principles)

1. **激波阻力悬崖（Shock Drag Cliff）**：
   - 跨音速压气机转子（NASA Rotor 37）叶尖相对马赫数 $M_{rel} \approx 1.48$。
   - 当流量逼近喉部壅塞极限 $\dot{m}_{choke} \approx 21.74\text{ kg/s}$ 时，通道内部形成强正激波，诱发剧烈的激波-吸力面边界层干扰与流动大分离，导致等熵效率 $\eta$ 从 0.9211 暴跌至 0.872。
2. **两机与风电的流体对称性**：
   - **风电场（宏观 3×3 阵列）**：通过前两排偏航让利 $30^\circ \to 20^\circ \to 0^\circ$，使反向旋转涡对偏转下游尾流，全场增益 **+24.04%**；
   - **压气机（微观 74 维叶型）**：通过前缘几何微翘与吸力面型线优化，将正激波弱化为斜激波，抑制边界层撕裂，效率提升 **+5.4%**。

---

## 3. 全量装载的 58 大领域技能库与 8 大支柱

本仓库已从全球开源社区全量装载 58 项专业库，并在 `技能库&准则/nuwa-distilled/` 中配备独家大师智囊：

```text
技能库&准则/
├── 🌟 顶级科学研究与代码图谱 (新装载)
│   ├── Understand-Anything/           # 💡【核心王牌】代码知识图谱生成与交互式探索器
│   ├── scientific-agent-skills/       # 🔬 170,000+ 科学家验证的顶刊学术研究全能套件
│   ├── nature-skills/                 # 📝 符合 Nature 顶刊规范的学术表达与绘图
│   ├── academic-research-skills/      # 📚 学术全流程 (调研→撰写→同行评审→定稿)
│   ├── claude-scholar/                # 🎓 跨构思、实验到出版的半自动科研助手
│   ├── scipilot-figure-skill/         # 📊 出版级（Nature/Science）插图生成协作者
│   ├── drawio-skill/                  # 📐 Draw.io 架构图/SysML/C4 流程图自动化生成
│   ├── uiverse-galaxy/                # 🌌 全球最大开源 UI 库（纯 CSS / Tailwind）
│   ├── deepsec/                       # 🛡️ Vercel 团队出品的智能体代码漏洞安全 Harness
│   ├── prime-agent/                   # 🧠 自进化强化学习 RLM 长期自主任务智能体
│   ├── img2threejs/                   # 🧊 2D 图像/草图转程序化质量门禁 Three.js 3D 模型
│   ├── scroll-world/                  # 🌐 滚动式 3D 沉浸式世界落地页生成 Skill
│   ├── cloudflare-computer/           # 🖥️ 给 Agent 配备完整计算机操作能力
│   ├── Qwen-MM-Plugins/               # 👁️ 多模态全能插件（视频分析/Blender/FreeCAD/ASR）
│   ├── claude-video-vision/           # 🎬 Claude 视频视觉解析（抽帧+多模态音频分析）
│   ├── claude-video/                  # 🎥 自动化视频下载、抽帧、转录与理解
│   └── video-use/                     # 🎞️ 智能体代码级视频剪辑与 Manim 数学动画
│
├── 🏛️ 女娲蒸馏 13 大师智囊库 (nuwa-distilled/)
│   ├── da-vinci-perspective/          # 【老达】达芬奇 · 74维几何解构与发丝线美学
│   ├── antony-jameson-perspective/    # 【老詹】詹姆森 · CFD伴随优化与跨音速激波守恒
│   ├── david-goldberg-perspective/    # 【老高】戈德堡 · 遗传算法与Pareto超体积演化
│   ├── bojie-li-perspective/          # 【李博杰】· 现代 AI Agent 架构与 Harness 工程
│   └── self-harness-perspective/      # 【自演化】· 智能体自我诊断、修补与验证
│
└── 🛠️ 工业级审查、全栈工程与动效生态
    ├── open-code-review/              # 阿里开源代码审查门禁 (.opencodereview/rule.json)
    ├── ECC/                           # 84 大工程缺陷检测与修复规范
    ├── gstack/                        # 全栈工程治理与自动化构建工具集
    ├── playwright/                    # Playwright 浏览器 E2E 自动化端到端测试
    ├── ui-ux-pro-max/                 # 109k Stars 顶级设计智能库（161 条行业推理规则）
    ├── taste-skill/ & impeccable/     # 莫兰迪工科美学与发丝线像素级质控
    ├── motionsites-design-system/     # 物理动效、发丝线与莫兰迪色盘规范
    ├── gsap-skills/                   # GSAP 物理动力学与粒子流线仿真动效
    ├── DeepTutor/                     # 苏格拉底式启发教学与知识图谱框架
    ├── codex-research-workflow/       # 10 大科研全流程工作流 (选题/统计/绘图/润色/答辩)
    ├── karpathy-skills/               # Andrej Karpathy 极简神经网络与代码干净度
    └── memory-system/                 # 6 阶长期记忆与跨 Session 接力系统
```

---

## 4. Deep Tutor 长期辅导模式指令（写给新 Agent）

在新 Session 中，Agent 的主要角色正式确立为**孙承泽的专属学术导师（Deep Tutor）**。开场必须先装载讲课术，再谈内容。

0. **强制讲课 skill（2026-08-13 A1，高于旧「小白类比」）**  
   - 读 `技能库&准则/chengze-deep-tutor/SKILL.md`  
   - 读 `docs/tutor-style-changelog.md` **最后一条（现为 A3：先认机器，证据档后置）**  
   - 对承泽 1:1 讲知识：画面 → 拆词 → 操作 → 公式 → `evidence/` 数据 → 边界与回收。  
   - **禁止**儿童故事 / 成绩单 / 收得住 / 只讲大概 / 丢生词让他猜。  
   - 他说「重讲」时必须按六层讲完，不许用苏格拉底当借口只问不讲。  
   - 他以后每改一次风格：先追加 changelog，再改 skill，再记 `.learnings`。  
   - `docs/lecture-analogy-handbook.md` 只给对外讲座，**不是** 1:1 讲课术。
1. **苏格拉底式 C 模式用在回收，不用在逃避讲解**：他会了只纠错、不代写；他不会或要求重讲，先完整讲，再指定关键词让他复述。
2. **紧扣《学习路.md》阶段里程碑**：
   - **阶段 0**：郭老师沟通 + 流体力学/CFD 二阶收敛；
   - **阶段 1**：CST/FFD 高保真叶型参数化 + Jameson 伴随气动优化；
   - **阶段 2**：领衔国创大创团队 + 挑战杯特等奖 + PINN/FNO 神经算子；
   - **阶段 3**：ASME Turbo Expo / J. Turbomach. 顶刊论文 + 直博两机重大专项；
   - **阶段 4**：海外名校 1 年访学 + 博士领军。
3. **保持长效记忆连续性**：定期查阅并更新 `.learnings/LEARNINGS.md`、`.learnings/ERRORS.md`、`.learnings/FEATURE_REQUESTS.md`、`docs/tutor-style-changelog.md`。

---

## 5. 新 Session 开场对接指令

承泽在建立新 Session 后，直接发送以下开场白即可全面唤醒 Deep Tutor 模式。

### 5.1 Session `019ff6c7` 对齐与交付改口（2026-08-13）

| 项 | 状态 |
|---|---|
| 工作分支 | `arena/019ff6c7-turbine-blade-ai-platform`（继承 `019feb03` @ `eacef427`，严禁从 main 空骨架开工） |
| 郭老师侧 | 暑期简报第 4 稿可发：`docs/暑期总结-致郭振东-发送正文.txt` + `docs/郭老师发送包.md`（末段志向+下一步都留） |
| 教材 | 12 单元已写完 `教材/README.md`；答案 `教材/教材配套答案详解.md`。Deep Tutor 暂停，改两周自学 |
| 数字口径 | 对外用可复现 Pareto：η_max=0.9173，ṁ_max=21.74 kg/s 时 η≈0.873；讲稿旧值 0.9211 不得写入给老师的信 |
| 阶段 0 动手 | Task 0.1 SU2 / 0.2 Laval / 0.3 柱坐标 NS 仍未勾选 |
| 发文研判 | 2026-08-13：当前资产不够一区/二区 TOP；对照见 `docs/frontier-AI-MDO-20260813.md` |
| 郭老师线 | 多保真选数据集 → EI/CLBO 加点 → TNO 场算子；承泽切口见 `docs/guo-line-and-next-path.md` |
| 科研技能 | 已从 `-SKILL-@019ff854` 装载 ARS-Codex / AI-Research-Skills / ARIS / PaperSpine / Paper Craft / hamelnb；入口 `技能库&准则/research-expert-system/` |

---

> 编号说明：§6–§8 是 v6 的「作战表 / 悬案清单 / 数字口径」，已被 `docs/SESSION_HANDOFF-*.md` 与
> `evidence/` 取代，故本文件从 §5 直接跳到 §9，不是漏写。

## 9. 沙盒坑与教训（血泪汇总 · 2026-09-02 从 v6 完整回补，v8 曾整节删除）

1. `node_modules` 不跨会话持久；重要产物别只放 `dist/build/cache/__pycache__/.venv` 等被排除目录。
2. `pkill -f "uvicorn app.main"` 会匹配自身 shell；用 `pkill -f "uvicorn ap[p].main"`，且别和启动命令同一次调用。
3. **uvicorn 残留进程坑**：kill 父进程后子进程可能还占 8000 端口，新起服务失败还「看起来正常」（Day 21 实测：旧进程返回旧代码）。每次验证前 `ps aux | grep uvicorn` 清干净，验证后 `ss -tln | grep 8000` 确认释放。
4. UTF-8 损坏史：HomePage.jsx 曾 `arginTop` 等；每会话跑 §0 体检。
5. uvicorn 后台常驻会让 bash 显示超时，属正常。
6. 🩸 未推送的提交 = 不存在的提交（af73fdc）。
7. 会话权限不确定：开工先 `git ls-remote` 探一次。
8. GitHub 身份：clone 会带成 `sunccchengze`；本仓约定 = author 保持承泽 + commit message 追加 `Co-authored-by: arena-agent <297053741+arena-agent@users.noreply.github.com>`。
9. 聊天贴 patch 会被改坏（空白/HTML 实体）→ 用「整篇覆盖 + 模糊匹配脚本」恢复，别依赖 `git apply`。
10. 沙盒出口白名单：GitHub/PyPI/npm 通；`*.pages.dev`、`*.snapdeploy.app`、example.com 全 TLS 失败。AI 验不了线上。
11. 附件上传可能不落盘 → 让承泽直接粘贴内容。
12. 🩸 **PR 一合并或关闭，会话远程通道即关**（Day 19 栽过）。铁律 2；细则 `docs/BRANCH-SAFETY.md` §1。
13. 推送前常先撞一次 gnutls TLS 报错，看着像抖动，其实是会话将关闭的前兆；别机械重试超 2–3 次。
14. 🩸 别照抄历史数字（R² 与 NSGA-II 两笔都是）。口径必须写清。
15. 🩸 **GitHub App 无 `workflows` 权限**：推送含 `.github/workflows/*.yml` 的提交会被 GitHub 拒绝
    （`refusing to allow a GitHub App to create or update workflow ... without workflows permission`）。
    → workflow 类交付做成 `docs/*.md` 模板让承泽网页安装（先例 `docs/verify-reproducibility-workflow.yml`），别硬推。
16. **作用域坑**：在子组件里用主组件 state 会 lint 报「declared but never used」+ 运行时 ReferenceError（Day 28 UQPage 实测）。状态留主组件、prop 传子组件。
17. 🩸 **沙盒 TLS 白名单连不上 huggingface.co**（Day 38 实测）：`curl -sI` 返回 exit 0 是**假阳性**，实际 GET 全部 000（TLS EOF）。测连通性用 GET 带 `-o /dev/null -w "%{http_code}"`，别信 HEAD。原始数据/重型训练走云 GPU。
18. **本仓 clone 常为 shallow**（2026-09-02 实测：`.git/shallow` 卡住 main 的父提交）：本地 `git merge-base` 会**假报「无共同祖先」**，跨家族祖先判断必须走 GitHub API `compare` 或 `git fetch --unshallow origin`。
19. `技能库&准则/` 已把仓库撑到 1.29 GB / 44 189 文件（2026-09-02 审计）；新技能库优先 submodule / 外部 Release，别再往仓里塞 vendored zip/gif/mp4。

---

## 10. 承泽本地环境（Windows）

- 本地路径存在两处历史记录，**未确认哪个是现状**：v6 记 `C:\Users\45120\turbine_blade_ai_project`，v8 铁律记 `D:\turbine-blade-ai-platform`。开新会话涉及本地命令时先问一句，别猜。
- conda：base / pytorch_env / **turbine-ai**（跑后端）；`frontend/.env.local` 已配 `VITE_API_URL=http://localhost:8000`。
- notebook 被 Jupyter 改动 → `git checkout -- notebooks/` 丢弃。
- **只能承泽本人操作**：SnapDeploy Redeploy（合 main 后必做）、Cloudflare Pages 面板、线上 URL 验收、预热 workflow 安装、Windows 本地验收。

---

## 11. 仓库收敛状态（2026-09-02）

11 条分支的完整台账、逐文件核验与「留哪条」的判定见 **`docs/branch-audit-20260902.md`**。
一句话：**内容终点 = `arena/019ffee7`**（= main + 200 笔，且不回退 main 任何文件）；
`019fb618 / 019fb74d / 019fb778 / 019fbdff` 已全含于 main，`019fb8ff / 019fc539` 的未合并内容已被 ffee7 以相同或更新版本覆盖，
`019fe072 / 019feb03 / 019ff6c7` 是 ffee7 的祖先。旧分支按承泽决定**暂不删除**（2026-09-02 决定），体积问题本轮不处理。
