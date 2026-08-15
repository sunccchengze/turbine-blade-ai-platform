# 调研入库 · 2026-08-14 DeepSearch：AI 赋能叶轮机械 MDO 前沿 与 郭/宋团队线

> **来源**：承泽 2026-08-14 用 DeepSearch 得到的结果，本人要求存入仓库记忆。
> **性质**：**外部检索合成材料（E0 调研线索）**。全文无一处带原始文献链接，数字未经原文核对。
> **使用红线（重要，违者违规）**：
> 1. 本文任何数字**不得**当作本项目数字、不得写入 `evidence/`、信、README、网站、PPT。
> 2. 引用其中任何一条（如 KT-EGO、SDNO、+5.98% 效率）之前，**必须先找到原始论文核对**。
> 3. 涉及郭振东、宋立明的个人履历与团队归属，属**内部背景记忆**：只用于理解选题与导师语境；**严禁**写进给郭老师的信（信纪律：不点宋老师），严禁对外背书未经核对的个人履历。
> 4. 与既有研判的关系：本文档补充、不改写 `docs/frontier-AI-MDO-20260813.md`（发文门槛）与 `docs/guo-line-and-next-path.md`（郭老师线）。冲突时以那两份+原文为准。
> 5. 本文件是内部文档：不要链到对外页面，不要放进发送包。

---

## 0. 一句话摘要（我加的导读，不是 DeepSearch 原文）

DeepSearch 给的图景与我们既有研判**方向一致**：国际前沿 2021–2026 已从「正向迭代设计」转向「逆设计 + 物理信息 + 生成式 + 强化学习」，郭/宋线走的是「高维昂贵黑箱 + 多保真 + 知识迁移 + 物理增强神经算子」。**我们的切口不变**：CST 几何旋钮 + 65% 覆盖率当加点传感器 + 场算子跟 TNO 学——这份材料不是用来扩叙事，是用来**对着原文补文献清单**的。

---

## 1. DeepSearch 原文 A：国际前沿综述（2021–2026）

> 以下为承泽检索结果原文（仅修正 HTML 转义字符 &gt; → >、&amp; → &）。数字全部待核。

# Executive Summary: The Paradigm Shift to Autonomous, Physics-Informed Design

Between 2021 and 2026, AI-enabled multidisciplinary design optimization (MDO) for turbomachinery has transitioned from experimental research to **industrial deployment**, fundamentally shifting from iterative "forward design" to **autonomous inverse design**. The international frontier is now defined by **Physics-Informed Neural Networks (PINNs)** and **Deep Reinforcement Learning (DRL)**, which solve complex aero-structural-thermal coupling problems with unprecedented speed. Key breakthroughs include **design cycle reductions from days to seconds**, **isentropic efficiency gains of up to 6%**, and the ability to navigate **Pareto fronts** for conflicting objectives like weight reduction (over **30%**) and stress mitigation without compromising performance.

## Core Technological Breakthroughs (2021–2026)

The last five years have witnessed a move away from traditional gradient-based methods toward **generative** and **physics-informed** workflows that require significantly less computational power while exploring wider design spaces.

### 1. Generative and Inverse Design Frameworks

The industry has largely abandoned manual geometry iteration in favor of **inverse design**, where low-dimensional performance targets are mapped directly to high-dimensional geometric data using advanced AI architectures.

*   **Architecture Evolution**: Frameworks now utilize Invertible Neural Networks (INN), Variational Autoencoders (VAE), Generative Adversarial Networks (GAN), and Diffusion Models to generate 3D blade shapes in as little as **30 seconds**.

*   **Design Space Expansion**: These generative models traverse design spaces beyond conventional human intuition, revealing structural solutions that traditional CAD methods miss.

*   **Iteration Speed**: Designers can now perform tens of optimization iterations before running a single high-fidelity CFD simulation.

### 2. Physics-Informed Machine Learning (PINNs)

To overcome the "data scarcity" problem in novel designs, **Physics-Informed Neural Networks (PINNs)** have become the standard for ensuring physical consistency without massive training datasets.

*   **Equation Solving**: Hybrid data-PINN approaches now solve steady-state **Euler equations** for turbomachinery flows directly, achieving **R² values of 0.99** and prediction errors below **5%**.

*   **Sample Efficiency**: Recent studies demonstrate that PINNs offer **10–20x sample efficiency** improvements over traditional data-driven surrogates.

*   **Boundary Conditions**: Advanced hybrid models successfully handle complex boundary conditions with a **99% structural similarity index** in flow field predictions.

### 3. Deep Reinforcement Learning (DRL) for Autonomous Optimization

**Deep Reinforcement Learning** has replaced many traditional evolutionary algorithms in high-complexity scenarios, enabling autonomous decision-making for aerodynamic optimization.

*   **Convergence Speed**: DRL agents have achieved optimal compressor designs in just **8 steps**, compared to **200+ iterations** required by traditional methods.

*   **Algorithm Superiority**: The **Deep Deterministic Policy Gradient (DDPG)** algorithm has shown ideal stability in optimizing **9-stage compressors**, outperforming standard Genetic Algorithms (GA) in 1D design optimization.

*   **Mesh Generation**: DRL now enables **non-iterative optimal mesh generation** for blade passages, drastically reducing human intervention and computational costs.

## Quantifiable Performance Metrics

Recent international case studies (2021–2026) provide concrete evidence of AI's impact on efficiency, weight, and development timelines across various turbomachinery applications.

| Application | Metric Improved | Gain / Reduction | Methodology |

| :--- | :--- | :--- | :--- |

| **Combined Compressors** | Isentropic Efficiency | **+5.98%** | CNN Surrogate Model |

| **Centrifugal Compressors** | Isentropic Efficiency | **+13.93%** | Neural Networks |

| **Axial Pumps** | Hydraulic Efficiency | **+6.7%** | RSM + BBD + NSGA-II + XGBoost |

| **Centrifugal Pumps** | Cavitation Performance | **+19.3%** | Hybrid CFD-AI |

| **Impellers** | Mass Reduction | **>30%** | Topology Optimization |

| **Blade Stress** | Centrifugal Stress | **800 MPa → 400 MPa** | Multidisciplinary Optimization |

| **Design Cycle** | Time to Solution | **Days → Seconds** | AI-driven CFD / Inverse Design |

| **Compressor Design** | Optimization Steps | **200+ → 8** | Deep Reinforcement Learning |

*   **Efficiency Gains**: Commercial implementations report consistent **2–4% efficiency gains** in gas turbines and centrifugal compressors, while specific research cases show up to **5.7%** gains through aeromechanical optimization.

*   **Speed Acceleration**: Cloud-native simulation platforms integrated with AI enable **80% faster design cycles**, with some ANN-assisted designs completing in **2 minutes** versus **10 hours** for traditional CFD.

*   **Robustness**: Active subspace methods have reduced **24D geometric uncertainties** to 4D spaces, increasing compressor efficiency by **1.04%** while reducing variance by **42%**.

## Multidisciplinary Integration Strategies

Modern MDO frameworks no longer treat aerodynamics, structures, and thermal management as silos; instead, they use **hybrid algorithms** to navigate trade-offs simultaneously.

### Aero-Structural-Thermal Coupling

*   **Algorithmic Fusion**: Modified **NSGA-II** algorithms combined with **Artificial Neural Networks (ANN)** and **TOPSIS** are now standard for optimizing compressor rotor blades, balancing isentropic efficiency against stress distribution.

*   **Fatigue & Thermal**: AI-powered digital twins utilize **XGBoost models** (achieving **R² > 0.93**) to predict fatigue life and optimize thermal management, extending component lifecycle performance.

*   **Trade-off Management**: Multidisciplinary approaches successfully reduce blade stress by **50%** (800 MPa to 400 MPa) with a negligible **2% efficiency trade-off**, a balance difficult to achieve with manual design.

### Uncertainty Quantification and Robustness

*   **Dimensionality Reduction**: Techniques like the **Shapley method** identify key geometric variables (e.g., reducing to 4 key variables) to drive robust optimization.

*   **Variance Reduction**: Robust optimization strategies have demonstrated the ability to increase efficiency while significantly lowering performance variance due to manufacturing tolerances.

## Industrial Software Ecosystem (2025–2026)

The software landscape has evolved from standalone AI tools to **embedded AI** within major CAE suites, facilitating seamless adoption by major manufacturers like Siemens, GE Vernova, and Ansys.

*   **TURBOdesign Suite 2026.1**: Features **3D Inverse Design** coupled with **Physics-Enhanced Machine Learning**, reducing blade design parameters by **20x** compared to traditional CAD. It integrates universally with solvers like Ansys Fluent and Siemens Simcenter STAR-CCM+.

*   **Siemens Simcenter**: Utilizes **Reactive Response Surface (RRS)** and machine learning to optimize blade geometries, enabling topology-optimized gear pumps to be designed **80% faster**.

*   **CFturbo + OASIS**: This integrated platform offers "one-click" optimization, combining intelligent flow prediction with uncertainty quantification, reducing optimization cycles from **40 hours** to rapid automated runs.

*   **GE Vernova Autonomous Tuning**: Deploys AI for real-time diagnostics and tuning, eliminating up to **12 days of downtime** and reducing fuel consumption by **0.5–1.0%**.

## Emerging Frontiers & Future Directions

Research published in 2025 and 2026 points to the next wave of innovation, moving beyond current surrogate models to **foundation models** and **quantum-inspired** computing.

*   **Transformer Architectures**: Sequence-to-Sequence **Transformer-based models** are being applied to turbine blade profile optimization, reproducing 3D flow characteristics with high fidelity and enabling rapid design space exploration.

*   **Large Language Models (LLMs) for Engineering**: Emerging "Agentic AI" frameworks use **Model Context Protocols** to unify design workflows, automating requirement analysis and bridging the gap between text-based specs and geometric outputs.

*   **Quantum-Inspired Algorithms**: Early studies suggest quantum-inspired algorithms show promise for solving large-scale, non-convex optimization problems within hybrid digital twin frameworks, potentially overcoming local minima traps common in classical algorithms.

*   **Non-Iterative Meshing**: The use of DRL for **mesh generation** is becoming a standard pre-processing step, removing one of the most time-consuming bottlenecks in high-fidelity simulation.

## Limitations & Unknowns

Despite rapid progress, several critical blindspots remain that hinder universal adoption:

*   **Cost-Benefit Analysis**: There is a lack of comprehensive public data on the **ROI** of implementing these advanced AI frameworks versus traditional methods for small-to-mid-sized enterprises.

*   **Long-Term Reliability**: While short-term performance gains are well-documented, **long-term reliability data** for components designed entirely by generative AI (especially regarding fatigue over decades) is still emerging.

*   **Algorithm Benchmarking**: Direct, standardized benchmarks comparing **NSGA-II** against newer **Deep Learning** approaches across a wide range of turbomachinery types are inconsistent.

*   **Implementation Barriers**: High computational costs for training large models and a **skills gap** in the workforce remain significant barriers to entry for many organizations.

---

## 2. DeepSearch 原文 B：西安交大宋立明团队贡献

# 西安交通大学宋立明团队在AI赋能叶轮机械优化领域的贡献

宋立明教授及其团队（隶属于西安交通大学叶轮机械研究所，李军教授团队核心成员）在过去五年中，专注于**高维昂贵黑箱问题**的代理模型优化算法及其在叶轮机气动/多学科设计中的应用，是国际上将**知识迁移**与**多保真度代理模型**应用于叶轮机械设计的先驱团队之一。

## 1. 核心算法创新：解决高维优化难题

针对传统代理模型在处理超过40个变量时效能下降的痛点，宋立明团队提出了一系列改进的**高效全局优化（EGO）**算法，显著提升了高维设计空间的搜索效率。

*   **知识迁移辅助优化 (KT-EGO)**：团队提出了**KT-EGO**算法，利用已完成相似任务的知识来加速新设计问题的收敛。该方法通过迁移学习策略，解决了高维昂贵黑箱优化问题中样本稀缺的难题，大幅减少了CFD计算次数。*应用场景*：高维叶栅气动优化、复杂曲面叶片设计。

*   **动态聚合策略增强优化 (DAS-EGO)**：针对高维涡轮机械设计问题，开发了基于动态聚合策略的增强型EGO算法。该策略能够更智能地平衡全局探索与局部开发，避免陷入局部最优解。

*   **多点搜索高效全局优化 (MSEGO)**：改进了传统的EGO算法，提出**MSEGO**，通过多点搜索机制并行处理候选解，显著提升了计算效率，特别适用于叶轮机叶栅这类计算成本极高的设计问题。

## 2. 多保真度代理模型与物理增强学习

为了在保证精度的同时降低计算成本，宋立明团队深入研究了**多保真度（Multi-Fidelity）**建模技术，巧妙结合低精度（快速）与高精度（昂贵）数据。

*   **新型多保真度代理模型**：团队在《Journal of Turbomachinery》(2024) 等顶刊发表论文，提出了一种新型多保真度代理模型框架。该框架能够通过少量高精度样本校正大量低精度样本，有效解决了涡轮设计优化中数据获取成本高的问题。

*   **物理增强神经算子 (Physics-Enhanced Neural Operator)**：针对涡轮端壁冷却布局的泛化预测难题，团队提出了基于叠加原理的**SDNO (Superposition-based Deep Neural Operator)** 网络。该方法将物理机理（如薄膜冷却叠加原理）嵌入深度学习架构，显著提升了对变数量气膜孔冷却性能的预测精度和泛化能力。

## 3. 多学科设计优化 (MDO) 与工程应用

宋立明团队不仅关注算法理论，更致力于将AI技术应用于实际的**气动 - 结构 - 热力**多学科耦合设计。

*   **高压比离心叶轮多学科优化**：团队与李军教授等合作，对高压比离心叶轮进行了气动与强度的多学科多目标优化。通过数据挖掘技术，揭示了设计变量与性能指标之间的深层关联，实现了效率与强度的最佳平衡。

*   **汽轮机通流部分优化**：开发了汽轮机通流部分的准三维气动及热力分析优化软件（获多项软件著作权），成功应用于长叶片透平级的多学科多目标优化设计，显著提升了汽轮机的热效率和运行安全性。

*   **不确定性量化 (UQ)**：在优化设计中引入不确定性量化方法，针对涡轮动叶叶顶气热性能进行不确定分析，提高了设计方案的鲁棒性，确保在实际制造公差和运行波动下仍能保持高性能。

## 4. 代表性研究成果 (近五年)

| 年份 | 核心贡献 | 发表载体/项目 |

| :--- | :--- | :--- |

| **2024** | 提出动态聚合策略增强EGO算法，解决高维涡轮设计问题 | *Engineering Optimization* |

| **2024** | 开发物理增强神经算子框架，提升涡轮端壁冷却预测泛化性 | *International Journal of Heat and Mass Transfer* (相关研究) |

| **2023** | 提出新型多保真度代理模型，大幅降低涡轮设计优化成本 | *ASME Journal of Turbomachinery* |

| **2022** | 提出知识迁移辅助EGO (KT-EGO) 算法 | *Engineering Optimization* |

| **2021-2023** | 离心压缩机/叶轮多学科优化与数据挖掘 | *西安交通大学学报*, *工程热物理学报* |

**总结**：宋立明团队在AI赋能叶轮机械设计领域的特色在于**"算法原创性"**与**"物理机理融合"**。他们不单纯依赖数据驱动的"黑箱"模型，而是通过**知识迁移**、**多保真度融合**及**物理嵌入**，解决了传统AI方法在高维、小样本、高计算成本场景下的失效问题，为叶轮机的高效、鲁棒设计提供了重要的理论工具和工程解决方案。

---

## 3. DeepSearch 原文 C：郭振东在团队中的角色

是的，郭振东不仅在该团队中，而且是宋立明教授团队的核心骨干成员，现任西安交通大学能源与动力工程学院**副教授、博士生导师**。

他在团队中主要扮演**算法创新与AI交叉研究**的关键角色，特别是在将深度学习、迁移学习与传统代理模型优化结合方面做出了突出贡献。

### 1. 团队角色与定位

*   **核心成员**：郭振东是宋立明教授在"AI for Science"方向的主要合作者。两人曾共同指导学生获得首届"大湾区杯"粤澳港AI for Science科技竞赛**特等奖**（作品：基于神经算子的全景式叶轮机械性能预测模型）。

*   **学术背景**：拥有工学博士学位，曾任新加坡南洋理工大学数据科学与人工智能研究中心（DSAIR）研究员、美国佛罗里达大学访问学者、日本三菱重工高砂研究所访问研究员。这种跨学界与工业界的背景使他在团队中负责 bridging 理论算法与工程应用。

*   **人才头衔**：入选陕西省秦创原高层次科技人才，太行国家实验室双聘专家。

### 2. 主要研究方向与贡献

郭振东的研究高度聚焦于解决叶轮机械设计中"高维、黑箱、计算昂贵"的痛点，其核心贡献包括：

#### A. 先进代理模型与优化算法

*   **多保真度代理模型 (Multi-Fidelity Surrogate)**：针对高精度CFD计算成本高的问题，他提出了新型多保真度建模方法，通过融合大量低精度数据和少量高精度数据，显著降低了优化成本。相关成果发表在 *ASME Journal of Turbomachinery* 和 *Chinese Journal of Aeronautics* 上。

*   **高效全局优化 (EGO) 改进**：参与了团队 **KT-EGO** (知识迁移辅助优化) 和 **DAS-EGO** (动态聚合策略) 等核心算法的开发，专门用于处理超过40个设计变量的高维优化问题。

*   **生成式多形式贝叶斯优化**：与南洋理工大学合作，探索了生成式模型在贝叶斯优化中的应用，进一步提升了搜索效率。

#### B. 智能流场预测与神经算子

*   **神经算子 (Neural Operators)**：他是团队中推动**神经算子**技术应用于叶轮机械全景式性能预测的关键人物。相比传统CNN，神经算子能更好地处理不同网格分辨率和几何变化，实现"一次训练，多处推理"。

*   **数据挖掘**：利用机器学习技术从海量仿真数据中挖掘设计变量与性能指标之间的非线性映射关系，为逆向设计提供理论支撑。

#### C. 不确定性量化 (UQ) 与鲁棒性设计

*   致力于将不确定性量化引入设计流程，确保设计方案在制造公差和运行波动下仍具有高性能（鲁棒性），这是工程落地的重要一环。

### 3. 代表性成果与项目

*   **科研项目**：主持中国航发产学研项目、太行国家实验室自主立项课题、航空发动机及燃气轮机重大专项子课题等百万级重点项目10余项。

*   **学术论文**：发表SCI/EI论文50余篇，包括计算智能顶刊 *IEEE Transactions on Cybernetics* (影响因子最高达19.1)、多学科设计优化权威期刊 *Structural and Multidisciplinary Optimization* 以及ASME/AIAA系列叶轮机械顶级期刊。

*   **知识产权**：授权发明专利7项，软件著作权10项。

### 总结

在宋立明团队中，**宋立明**教授更多把握整体方向与重大理论框架（如EGO算法的宏观改进），而**郭振东**副教授则在**深度学习前沿算法（如神经算子、迁移学习）的具体实现、多保真度策略的数学构建以及工程项目的落地**方面发挥着不可替代的执行与创新能力。两人互补合作，共同推动了西安交大在AI赋能叶轮机械设计领域的国际领先地位。

---

## 4. 待核对清单（下次要用前，先把原文找出来）

按优先级：

1. **KT-EGO**（2022 *Engineering Optimization*）、**DAS-EGO**（2024 同刊）、**MSEGO**——原文+算法细节（与 `docs/guo-line-and-next-path.md` 时间线对齐）。
2. **多保真代理**（2023/2024 *J. Turbomach.*、CJA）——重点核对：LF/HF 怎么配比、加点准则。
3. **SDNO**（2024，气膜冷却）与 **TNO**（2025 CJA 38(7):103473，Rotor 37 子午面场算子）——我们跟的是 TNO；SDNO 是 2024 那步。
4. 国际综述里**所有表格数字**（+5.98%、+13.93%、800→400 MPa、200+→8 步、2 分钟 vs 10 小时等）——全部无出处，必须逐条找回原文，否则一律视为不可引用。
5. 「大湾区杯」特等奖作品名（基于神经算子的全景式叶轮机械性能预测模型）——与 TNO 是否同一工作，见面时可自然提到，但信里不写。
6. 郭老师履历细节（佛罗里达/三菱重工高砂/秦创原/太行双聘）——只做背景，不对外复述；与 HANDOFF 既有画像一致处可互证，不一致处以本人为准。

## 5. 与我们的下一步的关系（结论不变）

- **不变**：切口仍是「CST 几何旋钮 + 65% 覆盖率当加点传感器 + 场算子跟 TNO 学」；Level 2 三块铁证不变；发文研判（`docs/frontier-AI-MDO-20260813.md`）不变。
- **增加的是文献地图**：国际侧（INN/VAE/GAN/Diffusion 逆设计、PINN-Euler、DRL/DDPG、Transformer、agentic MCP）都是「要读的原文清单」，不是「我们要现在复刻的清单」。
- 这份材料还反证了一件事：**「代理 MLP + NSGA-II」在国际前沿叙事里已经不构成增量**——我们真正的增量空间正是郭老师线：多保真加点 + 物理增强算子。和既有的 guo-line 判断一致。

---

*入库人：Agent（Arena 会话 019ffee7）· 2026-08-14 · 承泽授权存入。*
