import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  Database, Brain, Sigma, FlaskConical, ShieldCheck,
  ChevronRight, ArrowRight, BookOpen, GitBranch,
} from 'lucide-react'

const fadeUp = (delay = 0) => ({
  hidden:  { opacity: 0, y: 20 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }
  },
})

function ScrollSection({ children }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
    >
      {children}
    </motion.div>
  )
}

function SectionHeader({ tag, title, subtitle }) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <motion.div variants={fadeUp(0)} style={{ marginBottom: '10px' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '4px 12px', borderRadius: '9999px',
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.2)',
          fontSize: '11px', fontWeight: 600, color: '#818cf8',
          letterSpacing: '0.04em',
        }}>
          {tag}
        </span>
      </motion.div>
      <motion.h2
        variants={fadeUp(0.08)}
        style={{
          fontSize: 'clamp(1.6rem, 3vw, 2rem)',
          fontWeight: 700, color: '#f1f5f9', lineHeight: 1.2,
          marginBottom: '10px',
        }}
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p variants={fadeUp(0.12)} style={{ color: '#94a3b8', maxWidth: '760px', lineHeight: 1.7, fontSize: '14px' }}>
          {subtitle}
        </motion.p>
      )}
    </div>
  )
}

// 流程步骤卡片
function StepCard({ index, icon: Icon, title, en, desc, children }) {
  return (
    <motion.div
      variants={fadeUp(0)}
      style={{
        padding: '24px', borderRadius: '14px',
        background: 'rgba(30,41,59,0.4)',
        border: '1px solid rgba(255,255,255,0.06)',
        marginBottom: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
          background: 'rgba(99,102,241,0.15)',
          border: '1px solid rgba(99,102,241,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: 700, color: '#a5b4fc',
        }}>
          {index}
        </div>
        <Icon size={16} color="#818cf8" style={{ flexShrink: 0 }} />
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>{title}</h3>
          <div style={{ fontSize: '11px', color: '#475569' }}>{en}</div>
        </div>
      </div>
      <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.8 }}>{desc}</p>
      {children}
    </motion.div>
  )
}

// 代码块（等宽、深底）
function CodeBlock({ children }) {
  return (
    <pre style={{
      marginTop: '12px', padding: '14px 16px', borderRadius: '10px',
      background: 'rgba(2,6,23,0.7)',
      border: '1px solid rgba(255,255,255,0.06)',
      fontSize: '12px', lineHeight: 1.7, color: '#c7d2fe',
      overflowX: 'auto', whiteSpace: 'pre',
    }}>
      {children}
    </pre>
  )
}

export default function MethodologyPage() {
  useEffect(() => { window.scrollTo(0, 0) }, [])

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px 80px' }}>

      {/* Hero */}
      <ScrollSection>
        <div style={{ padding: '64px 0 8px' }}>
          <motion.div variants={fadeUp(0)} style={{ marginBottom: '14px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 12px', borderRadius: '9999px',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)',
              fontSize: '11px', fontWeight: 600, color: '#818cf8',
              letterSpacing: '0.04em',
            }}>
              <BookOpen size={11} /> METHODOLOGY · 方法论
            </span>
          </motion.div>
          <motion.h1
            variants={fadeUp(0.08)}
            style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
              fontWeight: 800, color: '#f1f5f9', lineHeight: 1.25,
              marginBottom: '12px',
            }}
          >
            从 1,000 组 CFD 样本到毫秒级代理模型
            <br />
            <span style={{ fontSize: 'clamp(0.9rem, 2vw, 1.05rem)', fontWeight: 500, color: '#64748b' }}>
              From 1,000 CFD samples to a millisecond surrogate model
            </span>
          </motion.h1>
          <motion.p variants={fadeUp(0.16)} style={{ color: '#94a3b8', lineHeight: 1.8, fontSize: '14px', maxWidth: '760px' }}>
            完整管线：数据 → 特征工程 → 残差代理模型 → 物理约束 → 不确定性量化 → 多目标优化。
            每一步都公开、可复现；本页同时诚实说明每一步的边界与局限。
            <br />
            <span style={{ fontSize: '12px', color: '#475569' }}>
              Full pipeline: data → feature engineering → residual surrogate → physics constraints → UQ → NSGA-II.
              Every step is public and reproducible; limitations are stated honestly.
            </span>
          </motion.p>
        </div>
      </ScrollSection>

      {/* 1. 数据 */}
      <section style={{ padding: '48px 0 0' }}>
        <ScrollSection>
          <SectionHeader
            tag="Step 1 · Data"
            title="数据：公开基准"
            subtitle="Data: a public benchmark."
          />
          <StepCard
            index={1} icon={Database} title="NASA Rotor 37 · PLAID 数据集" en="PLAID dataset"
            desc="使用公开的 PLAID / NASA Rotor 37 压气机基准数据集：1,000 组三维 CFD RANS 仿真样本，每组含 29,773 个叶片表面节点。选择公开基准是为了可复现 —— 任何人下载同一份数据都能跑出同样的结果。"
          >
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.7, marginTop: '10px' }}>
              Public PLAID/NASA Rotor 37 benchmark: 1,000 3-D CFD RANS samples, 29,773 surface nodes each —
              reproducibility by construction.
            </div>
          </StepCard>
        </ScrollSection>
      </section>

      {/* 2. 特征工程 */}
      <section style={{ padding: '32px 0 0' }}>
        <ScrollSection>
          <SectionHeader
            tag="Step 2 · Features"
            title="特征工程：74 维统计特征"
            subtitle="Feature engineering: 74-D statistical features."
          />
          <StepCard
            index={2} icon={Sigma} title="维度压缩 Dimensionality Reduction" en="29,773 nodes → 74 features"
            desc="直接用 29,773 × 9 个原始场量会遭遇维度灾难。因此对 9 组表面物理量各取 8 个统计量压缩：坐标（X/Y/Z）、法向（X/Y/Z）、压力、密度、温度 × mean/std/min/max/p25/p75/skew/kurt = 72 维，再加工况参数 Omega（转速）与 P（背压），共 74 维输入。"
          >
            <CodeBlock>{`9 组物理量 = CoordinateX/Y/Z + NormalsX/Y/Z + Pressure/Density/Temperature
8 个统计量 = mean / std / min / max / p25 / p75 / skew / kurt
→ 9 × 8 = 72 维 + Omega(转速) + P(背压) = 74 维输入`}</CodeBlock>
            <div style={{
              marginTop: '12px', padding: '12px 14px', borderRadius: '10px',
              background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)',
              fontSize: '12px', color: '#a8a29e', lineHeight: 1.75,
            }}>
              ⚠️ 诚实披露：统计特征化丢失了空间分布信息（模型看不到「压力峰值出现在叶片哪个位置」）。
              在 1,000 样本量级下这是换取训练稳定性的刻意取舍；要保留空间信息应走向 PointNet / GNN 类几何深度学习。
              <br />
              <span style={{ color: '#57534e', fontSize: '11px' }}>
                Honest note: statistics discard spatial distribution; a deliberate trade-off at this sample size.
                PointNet/GNN-style geometric DL is the direction to preserve spatial structure.
              </span>
            </div>
          </StepCard>
        </ScrollSection>
      </section>

      {/* 3. 残差网络 */}
      <section style={{ padding: '32px 0 0' }}>
        <ScrollSection>
          <SectionHeader
            tag="Step 3 · Model"
            title="残差代理网络"
            subtitle="Residual surrogate network."
          />
          <StepCard
            index={3} icon={Brain} title="残差结构 + 物理约束损失" en="Residual blocks + physics-constrained loss"
            desc="输入投影（74→256）+ BatchNorm + ReLU + Dropout(0.1)，接 3 个残差块（256），中间投影到 128，再接 2 个残差块（128），输出层 128→3。共 523,011 参数。残差连接让梯度直接回流，最差退化为恒等映射，从而支持更深的网络。"
          >
            <CodeBlock>{`输入 (74)
  → Linear(74→256) + BN + ReLU + Dropout(0.1)
  → 残差块 ×3 (256→256)
  → Linear(256→128) + BN + ReLU + Dropout(0.1)
  → 残差块 ×2 (128→128)
  → Linear(128→3)
残差块: x → Linear → BN → ReLU → Dropout → Linear → BN → (+x) → ReLU`}</CodeBlock>
            <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748b', lineHeight: 1.75 }}>
              损失 = Σ wᵢ·MSEᵢ + λ·物理惩罚（w=[1.0, 3.0, 1.5]，效率权重最高因其变化范围仅 ~0.045；λ=0.1）。
              物理惩罚对违反边界的预测施加 ReLU(·)² 惩罚：η ≤ 1.0（热力学第二定律）、η ≥ 0.5、π ≥ 1.0、ṁ ≥ 0。
              <br />
              <span style={{ color: '#475569' }}>
                Loss = Σ wᵢ·MSEᵢ + λ·phys-penalty; η gets 3× weight as its range is only ~0.045.
              </span>
            </div>
          </StepCard>
        </ScrollSection>
      </section>

      {/* 4. 精度 */}
      <section style={{ padding: '32px 0 0' }}>
        <ScrollSection>
          <SectionHeader
            tag="Step 4 · Accuracy"
            title="精度：留出测试集口径"
            subtitle="Accuracy: held-out test set."
          />
          <motion.div
            variants={fadeUp(0)}
            style={{
              padding: '24px', borderRadius: '14px',
              background: 'rgba(30,41,59,0.4)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.8, marginBottom: '16px' }}>
              所有数字均在<strong style={{ color: '#e2e8f0' }}>留出测试集</strong>（n=100, random_state=42，训练时完全未见）上，
              由部署中的 ONNX 模型实测，可通过 README「快速复现」一键重跑验证。
              <br />
              <span style={{ fontSize: '11px', color: '#475569' }}>
                All figures measured on the held-out test set (n=100, random_state=42) with the deployed ONNX model — reproducible via README §Reproduce.
              </span>
            </p>
            {[
              { label: '总压比 π', en: 'Compression ratio', r2: '0.9844', color: '#818cf8' },
              { label: '等熵效率 η', en: 'Efficiency', r2: '0.9561', color: '#22d3ee' },
              { label: '质量流量 ṁ', en: 'Mass flow', r2: '0.9827', color: '#34d399' },
            ].map(row => (
              <div key={row.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', borderRadius: '10px', marginBottom: '8px',
                background: `${row.color}08`, border: `1px solid ${row.color}18`,
              }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
                  {row.label}
                  <span style={{ fontSize: '11px', fontWeight: 400, color: '#64748b', marginLeft: '8px' }}>{row.en}</span>
                </span>
                <span className="num" style={{ fontSize: '16px', fontWeight: 700, color: row.color }}>
                  R² = {row.r2}
                </span>
              </div>
            ))}
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '8px' }}>
              三个输出全部 R² &gt; 0.95。训练集 R²（0.99 级）高于测试集属正常过拟合迹象，README 以折叠块列出三套划分，避免误读。
            </div>
          </motion.div>
        </ScrollSection>
      </section>

      {/* 4.5 精度验证（D27） */}
      <section style={{ padding: '32px 0 0' }}>
        <ScrollSection>
          <SectionHeader
            tag="Step 4.5 · Validation"
            title="精度验证：预测 vs 真实"
            subtitle="Validation: predicted vs true on the held-out test set."
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            <motion.div
              variants={fadeUp(0)}
              style={{
                padding: '16px', borderRadius: '14px',
                background: 'rgba(30,41,59,0.4)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <img
                src="/figures/fig09_pred_vs_true.png"
                alt="Baseline MLP predicted vs true values on test set"
                style={{ width: '100%', borderRadius: '10px', display: 'block' }}
                loading="lazy"
              />
              <div style={{ marginTop: '12px', fontSize: '13px', color: '#94a3b8', lineHeight: 1.7 }}>
                <strong style={{ color: '#e2e8f0' }}>基线 MLP Baseline MLP</strong> —— 三个输出的预测 vs 真实散点
                （测试集 n=100，红色虚线为完美预测 y=x）。
                <br />
                <span style={{ fontSize: '11px', color: '#475569' }}>
                  Baseline MLP: predicted vs true scatter on the test set; dashed line = perfect prediction.
                </span>
              </div>
            </motion.div>
            <motion.div
              variants={fadeUp(0.08)}
              style={{
                padding: '16px', borderRadius: '14px',
                background: 'rgba(30,41,59,0.4)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <img
                src="/figures/fig10_residual_evaluation.png"
                alt="Residual network predicted vs true and residual distributions"
                style={{ width: '100%', borderRadius: '10px', display: 'block' }}
                loading="lazy"
              />
              <div style={{ marginTop: '12px', fontSize: '13px', color: '#94a3b8', lineHeight: 1.7 }}>
                <strong style={{ color: '#e2e8f0' }}>残差网络 Residual Network</strong> —— 上排预测 vs 真实，
                下排残差分布（均值接近 0，说明无系统性偏差）。
                <br />
                <span style={{ fontSize: '11px', color: '#475569' }}>
                  Residual network: predicted vs true (top) and residual histograms (bottom) — means near zero, no systematic bias.
                </span>
              </div>
            </motion.div>
          </div>
        </ScrollSection>
      </section>

      {/* 5. UQ */}
      <section style={{ padding: '32px 0 0' }}>
        <ScrollSection>
          <SectionHeader
            tag="Step 5 · Uncertainty"
            title="不确定性量化：MC Dropout"
            subtitle="Uncertainty quantification via MC Dropout."
          />
          <StepCard
            index={5} icon={ShieldCheck} title="100 次随机前向传播" en="100 stochastic forward passes"
            desc="推理时保持 Dropout 层激活，采样 100 次得到预测分布，取 ±1.96σ 作为 95% 置信区间。它只刻画模型参数的认知不确定性（epistemic），不含数据噪声（aleatoric）。"
          >
            <div style={{
              marginTop: '12px', padding: '12px 14px', borderRadius: '10px',
              background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)',
              fontSize: '12px', color: '#a8a29e', lineHeight: 1.75,
            }}>
              ⚠️ 诚实披露：名义 95% 的区间实际只覆盖 65–89% 的真值（η 最差 65%）—— MC Dropout 低估了真实不确定性。
              当前定位是「相对置信度指示器」（哪些区域模型更没把握），而非严格的统计保证；改进方向为 Deep Ensembles / 异方差输出头 / conformal prediction。
            </div>
          </StepCard>
        </ScrollSection>
      </section>

      {/* 6. NSGA-II */}
      <section style={{ padding: '32px 0 0' }}>
        <ScrollSection>
          <SectionHeader
            tag="Step 6 · Optimization"
            title="多目标优化：NSGA-II"
            subtitle="Multi-objective optimization with NSGA-II."
          />
          <StepCard
            index={6} icon={FlaskConical} title="200 代 · 种群 100" en="200 generations, population 100"
            desc="约束 π ≥ 1.8、η ≥ 0.84；在 74 维设计空间搜索，得到 100 个非支配解。结果由 backend/scripts/generate_pareto_evolution.py 一键复现（同 seed 42、同配置、生产 ONNX 评估）。"
          >
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '8px', marginTop: '12px',
            }}>
              {[
                { label: '最高效率 η', value: '0.9173', sub: '+5.40% vs 均值' },
                { label: '最大流量 ṁ', value: '21.74 kg/s', sub: '+11.43% vs 均值' },
                { label: '最高压比 π', value: '2.1073', sub: '均值 1.9839' },
              ].map(x => (
                <div key={x.label} style={{
                  padding: '12px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ fontSize: '10px', color: '#475569', marginBottom: '4px' }}>{x.label}</div>
                  <div className="num" style={{ fontSize: '15px', fontWeight: 700, color: '#22d3ee' }}>{x.value}</div>
                  <div style={{ fontSize: '10px', color: '#34d399', marginTop: '2px' }}>{x.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '10px' }}>
              代理模型毫秒级评估使 20,000 次评估（200 代 × 100 个体）仅需数秒 —— 同样的搜索若用 CFD 是数月量级。
            </div>
          </StepCard>
        </ScrollSection>
      </section>

      {/* 6.5 物理验证状态 */}
      <section style={{ padding: '32px 0 0' }}>
        <ScrollSection>
          <SectionHeader
            tag="Step 6.5 · Physics Gate"
            title="真实物理验证：通路已打通，最终收敛待完成"
            subtitle="Physics validation: the SU2 route is live; final converged RANS remains outstanding."
          />
          <motion.div
            variants={fadeUp(0)}
            style={{
              padding: '24px', borderRadius: '14px',
              background: 'rgba(30,41,59,0.4)',
              border: '1px solid rgba(251,191,36,0.18)',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
              {[
                ['已完成', '外部 Rotor37 SU2 体网格读取、周期面匹配、入口 profile 和 RANS 启动'],
                ['已有证据', 'coarse 一阶 SA 的 Stage Performance 非收敛趋势；fine 网格 preprocessing 与 solver 启动'],
                ['尚未完成', '最终收敛 RANS、Pareto 候选逐个 CFD 对照、代理误差的物理校验'],
              ].map(([label, text], i) => (
                <div key={label} style={{ padding: '13px', borderRadius: '10px', background: i === 2 ? 'rgba(251,191,36,0.06)' : 'rgba(255,255,255,0.025)', border: `1px solid ${i === 2 ? 'rgba(251,191,36,0.16)' : 'rgba(255,255,255,0.06)'}` }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: i === 2 ? '#fbbf24' : '#34d399', marginBottom: '6px' }}>{label}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.7 }}>{text}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '14px', fontSize: '12px', color: '#64748b', lineHeight: 1.75 }}>
              本地电脑无法承受 fine 网格长时间 RANS 求解，因此不把早期性能输出写成最终 CFD 结果。未来获得服务器或 HPC 后，可在相同 manifest 和 cfg 版本下恢复该实验。
            </div>
          </motion.div>
        </ScrollSection>
      </section>

      {/* 7. 局限总结 */}
      <section style={{ padding: '32px 0 0' }}>
        <ScrollSection>
          <SectionHeader
            tag="Honest Limits"
            title="对自身边界的诚实认识"
            subtitle="Honest statement of limitations."
          />
          <motion.div
            variants={fadeUp(0)}
            style={{
              padding: '24px', borderRadius: '14px',
              background: 'rgba(30,41,59,0.4)',
              border: '1px solid rgba(251,191,36,0.15)',
            }}
          >
            {[
              ['样本量 1,000', '对深度学习不算大。统计特征化 + 残差结构 + 物理约束是针对小样本的刻意设计，但泛化仍受限于数据规模。'],
              ['代理模型不替代 CFD', '定位是设计前端的快速筛选器：毫秒级评估把上万候选缩到几十个，最终方案仍需 CFD 校验。'],
              ['物理约束是边界裁剪级', '保证输出落在物理可行域内，但未在损失中嵌入 N-S 方程残差 —— PINN 式约束是明确的 future work。'],
              ['MC Dropout 低估不确定性', '95% 名义区间实际覆盖 65–89%，详见上文。'],
              ['未自行运行 CFD', '使用公开基准数据集；加速比基于文献常见的 30 min/场估算，非本机实测。'],
            ].map(([title, desc], i) => (
              <div key={title} style={{
                display: 'flex', gap: '10px', padding: '10px 0',
                borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                <span style={{ color: '#fbbf24', fontSize: '13px', flexShrink: 0 }}>{i + 1}.</span>
                <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.7 }}>
                  <strong>{title}</strong>
                  <span style={{ color: '#94a3b8' }}> —— {desc}</span>
                </div>
              </div>
            ))}
          </motion.div>
        </ScrollSection>
      </section>

      {/* CTA */}
      <section style={{ padding: '40px 0 0', textAlign: 'center' }}>
        <ScrollSection>
          <motion.div variants={fadeUp(0)} style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/explore" style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '10px 20px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #4f46e5, #0891b2)',
              color: '#fff', fontSize: '14px', fontWeight: 600,
              textDecoration: 'none', boxShadow: '0 4px 14px rgba(79,70,229,0.3)',
            }}>
              动手探索设计空间 <ArrowRight size={14} />
            </Link>
            <a
              href="https://github.com/sunccchengze/turbine-blade-ai-platform/tree/main/notebooks"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '10px 20px', borderRadius: '10px',
                background: 'rgba(30,41,59,0.6)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#e2e8f0', fontSize: '14px', fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <GitBranch size={14} /> 训练管线 Notebooks
            </a>
          </motion.div>
          <div style={{ marginTop: '20px' }}>
            <Link to="/" style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> 返回首页 Back to Home
            </Link>
          </div>
        </ScrollSection>
      </section>

    </div>
  )
}
