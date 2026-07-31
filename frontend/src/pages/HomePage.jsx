import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  Brain, Target, ChevronRight,
  TrendingUp, Award, Database,
  Activity, Shield, BarChart3,
  Calendar, MapPin, AlertTriangle, Zap
} from 'lucide-react'
import StatusBadge from '../components/StatusBadge'

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

// 左对齐板块标题
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
        <motion.p
          variants={fadeUp(0.16)}
          style={{
            color: '#64748b', fontSize: '14px',
            lineHeight: 1.8, maxWidth: '520px',
          }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  )
}

export default function HomePage() {
  return (
    <div style={{ background: '#0f172a', minHeight: '100vh' }}>

      {/* ══════════════════════════════════════════
          HERO — 居中布局
      ══════════════════════════════════════════ */}
      <section
        className="grid-bg"
        style={{
          position: 'relative', overflow: 'hidden',
          padding: '80px 24px 96px',
        }}
      >
        <div className="hero-glow" />

        {/* 居中容器 */}
        <div style={{
          position: 'relative', zIndex: 10,
          maxWidth: '720px', margin: '0 auto', textAlign: 'center',
        }}>

          {/* 主标题 */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{
              fontSize: 'clamp(2.2rem, 5.5vw, 3.75rem)',
              fontWeight: 800, lineHeight: 1.1,
              color: '#f8fafc', letterSpacing: '-0.02em',
              marginBottom: '20px',
            }}
          >
            AI 赋能的叶轮机械
            <br />
            <span className="gradient-text">多学科设计优化平台</span>
          </motion.h1>

          {/* 副标题 */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            style={{
              color: '#94a3b8', fontSize: '1.05rem',
              lineHeight: 1.8, marginBottom: '36px',
            }}
          >
            基于{' '}
            <span style={{ color: '#818cf8', fontWeight: 500 }}>NASA Rotor 37</span>
            {' '}基准 CFD 数据训练，以{' '}
            <span style={{ color: '#34d399', fontWeight: 500 }}>毫秒级</span>
            {' '}速度预测叶片气动性能，让 NSGA-II 优化比 CFD 快{' '}
            <span style={{ color: '#fbbf24', fontWeight: 500 }}>约 100,000 倍</span>。
            <br />
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              Trained on NASA Rotor 37 benchmark CFD data — predicting blade aerodynamic
              performance in milliseconds and accelerating NSGA-II optimization ~100,000× vs CFD.
            </span>
          </motion.p>

          {/* CTA 按钮 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            style={{
              display: 'flex', gap: '12px',
              justifyContent: 'center', flexWrap: 'wrap',
            }}
          >
            <Link
              to="/predict"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                padding: '11px 22px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                color: '#fff', fontWeight: 600, fontSize: '14px',
                textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(79,70,229,0.35)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 28px rgba(79,70,229,0.45)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(79,70,229,0.35)'
              }}
            >
              实时预测
              <ChevronRight size={14} />
            </Link>

            <Link
              to="/optimize"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                padding: '11px 22px', borderRadius: '10px',
                background: 'rgba(99,102,241,0.08)',
                color: '#818cf8', fontWeight: 600, fontSize: '14px',
                textDecoration: 'none',
                border: '1px solid rgba(99,102,241,0.25)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(99,102,241,0.15)'
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(99,102,241,0.08)'
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)'
              }}
            >
              查看 Pareto 前沿
              <TrendingUp size={14} />
            </Link>
          </motion.div>

        </div>
      </section>

      {/* 分隔线 */}
      <div style={{ padding: '0 24px' }}>
        <div className="section-divider" />
      </div>

      {/* ══════════════════════════════════════════
          模型指标 — 左对齐标题
      ══════════════════════════════════════════ */}
      <section style={{ padding: '64px 24px' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
          <ScrollSection>
            <SectionHeader
              tag="Model Performance"
              title="代理模型精度"
              subtitle={<>带物理约束的残差代理模型（Residual Surrogate），基于 1,000 组 CFD 样本训练；
                R² 在留出测试集（n=100，训练时未见）上实测<br />
                <span style={{ fontSize: '12px', color: '#475569' }}>Physics-constrained residual surrogate model, trained on 1,000 CFD samples.
                R² measured on a held-out test set (n=100, unseen during training).</span></>}
            />
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '14px',
            }}>
              {[
                { label: '总压比 R²',   value: '0.9844', color: 'primary' },
                { label: '效率 R²',     value: '0.9561', color: 'cyan'    },
                { label: '质量流量 R²', value: '0.9827', color: 'green'   },
                { label: 'CFD 加速比',  value: '~100K×', color: 'amber'   },
              ].map((item, i) => (
                <motion.div key={item.label} variants={fadeUp(i * 0.08)}>
                  <StatusBadge {...item} />
                </motion.div>
              ))}
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* 分隔线 */}
      <div style={{ padding: '0 24px' }}>
        <div className="section-divider" />
      </div>

      {/* ══════════════════════════════════════════
          背景叙事 — 左对齐标题
      ══════════════════════════════════════════ */}
      <section style={{ padding: '64px 24px' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
          <ScrollSection>
            <SectionHeader
              tag="Research Context"
              title="为什么是现在"
              subtitle={<>KIT 的突破从根本上改写了叶轮机械叶片的设计命题<br />
                <span style={{ fontSize: '12px', color: '#475569' }}>The KIT breakthrough fundamentally changes the design equation for turbomachinery blades.</span></>}
            />
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '20px',
            }}>

              {/* KIT 突破卡片 */}
              <motion.div
                variants={fadeUp(0.1)}
                className="glass-card card-glow"
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  height: '3px',
                  background: 'linear-gradient(to right, #f59e0b, #f97316, #ef4444)',
                }} />
                <div style={{ padding: '24px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'flex-start',
                    gap: '12px', marginBottom: '16px',
                  }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px',
                      background: 'rgba(251,191,36,0.1)', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Zap size={18} color="#fbbf24" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>
                        The KIT Breakthrough
                      </h3>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Calendar size={10} /> February 2026
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <MapPin size={10} /> Karlsruhe, Germany
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14.5px', color: '#94a3b8', lineHeight: 2.1 }}>
                    <p>
                      KIT 实现无压气机燃气轮机连续运行{' '}
                      <span style={{ color: '#fbbf24', fontWeight: 600 }}>303 秒</span>
                      ，打破 NASA 此前的纪录。传统燃气轮机将近{' '}
                      <span style={{ color: '#f87171', fontWeight: 600 }}>50% 的输出功率</span>
                      {' '}要用于驱动压气机级。
                    </p>
                    <p>
                      取消压气机之后，性能瓶颈被转移到{' '}
                      <span style={{ color: '#818cf8', fontWeight: 600 }}>
                        涡轮叶片气动效率
                      </span>
                      {' '}上——AI 加速的叶片优化因此比以往任何时候都更加关键。
                    </p>
                    <p style={{ fontSize: '12px', color: '#475569' }}>
                      KIT ran a compressorless gas turbine for 303 seconds — breaking NASA's record.
                      Traditional turbines spend ~50% of output power driving the compressor; removing
                      it shifts the performance bottleneck onto turbine blade aerodynamic efficiency,
                      making AI-accelerated blade optimization more critical than ever.
                    </p>
                  </div>

                  <div style={{
                    marginTop: '16px', padding: '10px 14px', borderRadius: '8px',
                    background: 'rgba(239,68,68,0.05)',
                    border: '1px solid rgba(239,68,68,0.12)',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    <AlertTriangle size={13} color="#f87171" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      被省去的压气机功耗 Compressor power eliminated:
                    </span>
                    <span className="num" style={{ fontSize: '14px', fontWeight: 700, color: '#f87171' }}>
                      ~50%
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* AI 管线卡片 */}
              <motion.div
                variants={fadeUp(0.2)}
                className="glass-card card-glow"
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  height: '3px',
                  background: 'linear-gradient(to right, #6366f1, #22d3ee, #34d399)',
                }} />
                <div style={{ padding: '24px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    gap: '12px', marginBottom: '16px',
                  }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px',
                      background: 'rgba(99,102,241,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Brain size={18} color="#818cf8" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>
                        AI 技术管线
                      </h3>
                      <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        端到端 MDO 框架 · End-to-End
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      {
                        icon: Database, color: '#818cf8',
                        bg: 'rgba(99,102,241,0.08)',
                        label: 'NASA Rotor 37 Data',
                        desc: <>1,000 组 CFD 样本 · 每个样本 29,773 个表面节点<br />
                          <span style={{ color: '#475569' }}>1,000 CFD samples · 29,773 surface nodes each</span></>,
                      },
                      {
                        icon: Brain, color: '#a78bfa',
                        bg: 'rgba(167,139,250,0.08)',
                        label: 'Residual Surrogate Model',
                        desc: <>物理约束 · 全部输出 R² &gt; 0.95<br />
                          <span style={{ color: '#475569' }}>Physics-constrained · R² &gt; 0.95 on all outputs</span></>,
                      },
                      {
                        icon: Shield, color: '#34d399',
                        bg: 'rgba(52,211,153,0.08)',
                        label: 'MC Dropout UQ',
                        desc: <>σ 统计量（训练期 100 次采样）· 95% 置信区间<br />
                          <span style={{ color: '#475569' }}>σ statistics (100 samples during training) · 95% confidence intervals</span></>,
                      },
                      {
                        icon: Target, color: '#fbbf24',
                        bg: 'rgba(251,191,36,0.08)',
                        label: 'NSGA-II Optimization',
                        desc: <>100 个 Pareto 最优设计 · 效率 +5.40%（可复现，见 README）<br />
                          <span style={{ color: '#475569' }}>100 Pareto-optimal designs · +5.40% efficiency (reproducible, see README)</span></>,
                      },
                    ].map(({ icon: Icon, color, bg, label, desc }) => (
                      <div
                        key={label}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: '10px',
                          padding: '10px', borderRadius: '8px', background: bg,
                        }}
                      >
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '7px',
                          background: `${color}15`, flexShrink: 0, marginTop: '1px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon size={13} color={color} />
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
                            {label}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                            {desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

            </div>
          </ScrollSection>
        </div>
      </section>

      {/* 分隔线 */}
      <div style={{ padding: '0 24px' }}>
        <div className="section-divider" />
      </div>

      {/* ══════════════════════════════════════════
          优化成果 — 左对齐标题
      ══════════════════════════════════════════ */}
      <section style={{ padding: '64px 24px' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
          <ScrollSection>
            <SectionHeader
              tag="Optimization Results"
              title="AI 找到的最优设计"
              subtitle={<>NSGA-II 找到的设计方案超越了全部 1,000 个 CFD 训练样本<br />
                <span style={{ fontSize: '12px', color: '#475569' }}>NSGA-II discovered designs that surpass all 1,000 CFD training samples.</span></>}
            />
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
            }}>
              {[
                {
                  icon: Award,       color: '#818cf8',
                  bg: 'rgba(99,102,241,0.06)', border: 'rgba(99,102,241,0.15)',
                  title: '最高效率设计',
                  metric: 'η = 0.9173', delta: '+5.40%',
                  sub: '相对训练集均值 vs avg',
                  desc: <>Pareto 前沿中等熵效率最高的设计<br />
                    <span style={{ color: '#475569' }}>Highest isentropic efficiency on the Pareto front</span></>,
                  tag: '效率最优 Max η',
                },
                {
                  icon: TrendingUp,  color: '#34d399',
                  bg: 'rgba(52,211,153,0.06)', border: 'rgba(52,211,153,0.15)',
                  title: '最大通流设计',
                  metric: 'ṁ = 21.74 kg/s', delta: '+11.43%',
                  sub: '相对训练集均值 vs avg',
                  desc: <>约束边界之内质量流量最大的设计<br />
                    <span style={{ color: '#475569' }}>Maximum mass flow within constraint bounds</span></>,
                  tag: '通流最优 Max ṁ',
                },
                {
                  icon: BarChart3,   color: '#22d3ee',
                  bg: 'rgba(34,211,238,0.06)', border: 'rgba(34,211,238,0.15)',
                  title: 'Pareto 前沿规模',
                  metric: '100 个设计', delta: '全部满足',
                  sub: 'π ≥ 1.8, η ≥ 0.84',
                  desc: <>供工程师抉择的非支配解集 Non-dominated<br />
                    <span style={{ color: '#475569' }}>Non-dominated solutions for engineer selection</span></>,
                  tag: '多目标优化 MOO',
                },
              ].map(({ icon: Icon, color, bg, border, title, metric, delta, sub, desc, tag }, i) => (
                <motion.div
                  key={title}
                  variants={fadeUp(i * 0.1)}
                  className="glass-card card-glow"
                  style={{ background: bg, border: `1px solid ${border}`, padding: '20px' }}
                >
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: `${color}15`, marginBottom: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={18} color={color} />
                  </div>

                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
                    {title}
                  </h4>

                  <div className="num" style={{ fontSize: '24px', fontWeight: 700, color, marginBottom: '4px' }}>
                    {metric}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#34d399' }}>{delta}</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{sub}</span>
                  </div>

                  <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.6, marginBottom: '12px' }}>
                    {desc}
                  </p>

                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '3px 10px', borderRadius: '9999px',
                    background: `${color}12`, color,
                    border: `1px solid ${color}25`,
                    fontSize: '11px', fontWeight: 600,
                  }}>
                    {tag}
                  </span>
                </motion.div>
              ))}
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* 分隔线 */}
      <div style={{ padding: '0 24px' }}>
        <div className="section-divider" />
      </div>

      {/* ══════════════════════════════════════════
          总结区
      ══════════════════════════════════════════ */}
      <section style={{ padding: '64px 24px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <ScrollSection>
            <motion.div
              variants={fadeUp(0.1)}
              style={{
                borderRadius: '20px', padding: '56px 44px',
                textAlign: 'center', position: 'relative', overflow: 'hidden',
                background: 'linear-gradient(135deg, #0d1424 0%, #111827 100%)',
                border: '1px solid rgba(99,102,241,0.12)',
              }}
            >
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                width: '500px', height: '250px',
                background: 'radial-gradient(ellipse, rgba(99,102,241,0.07) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '7px', marginBottom: '16px',
                }}>
                  <Activity size={14} color="#818cf8" />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#818cf8' }}>
                    核心结论 Key Takeaway
                  </span>
                </div>

                <h2 style={{
                  fontSize: 'clamp(1.2rem, 2.8vw, 1.65rem)',
                  fontWeight: 700, color: '#f1f5f9', lineHeight: 1.4,
                  marginBottom: '14px',
                }}>
                  从以周计的 CFD 仿真，到秒级的 AI 推理——
                  <br />
                  <span className="gradient-text">
                    同样的物理，快十万倍。
                  </span>
                </h2>

                <p style={{
                  fontSize: '13px', color: '#475569',
                  lineHeight: 1.6, marginBottom: '6px',
                }}>
                  From weeks of CFD simulation to seconds of AI inference —
                  the same physics, ~100,000× faster.
                </p>

                <p style={{
                  fontSize: '13px', color: '#64748b',
                  lineHeight: 1.8, marginBottom: '28px',
                }}>
                  完整 MDO 管线：数据 → 代理模型 → 不确定性量化 → Pareto 优化
                  <br />
                  <span style={{ fontSize: '12px', color: '#475569' }}>
                    Full MDO pipeline: data → surrogate model → uncertainty quantification → Pareto optimization.
                  </span>
                </p>

                <div style={{
                  display: 'flex', gap: '10px',
                  justifyContent: 'center', flexWrap: 'wrap',
                }}>
                  <Link
                    to="/predict"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '7px',
                      padding: '10px 20px', borderRadius: '10px',
                      background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                      color: '#fff', fontWeight: 600, fontSize: '13px',
                      textDecoration: 'none',
                      boxShadow: '0 4px 14px rgba(79,70,229,0.3)',
                    }}
                  >
                    开始预测 <ChevronRight size={14} />
                  </Link>
                  <Link
                    to="/uq"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '7px',
                      padding: '10px 20px', borderRadius: '10px',
                      color: '#94a3b8', fontWeight: 600, fontSize: '13px',
                      textDecoration: 'none',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    探索不确定性 <BarChart3 size={14} />
                  </Link>
                </div>
              </div>
            </motion.div>
          </ScrollSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          技术说明卡片
      ══════════════════════════════════════════ */}
      <section style={{ padding: '0 24px 48px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <div
            className="glass-card"
            style={{
              padding: '24px 28px',
              border: '1px solid rgba(251,191,36,0.15)',
              background: 'rgba(251,191,36,0.03)',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'flex-start',
              gap: '14px',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(251,191,36,0.1)', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '16px' }}>⚙️</span>
              </div>
              <div>
                <h4 style={{
                  fontSize: '13px', fontWeight: 700,
                  color: '#fbbf24', marginBottom: '10px',
                  fontFamily: 'Poppins, sans-serif',
                }}>
                  工程说明 Engineering Note — 后端架构
                </h4>
                <div style={{
                  fontSize: '13px', color: '#94a3b8',
                  lineHeight: 2.0,
                }}>
                  <p>
                    开发阶段完整实现了基于{' '}
                    <span style={{ color: '#e2e8f0', fontWeight: 500 }}>
                      PyTorch 推理的 FastAPI 后端
                    </span>
                    {' '}，覆盖实时预测、MC Dropout 不确定性量化与
                    NSGA-II 优化 API。
                    <br />
                    <span style={{ fontSize: '12px', color: '#475569' }}>
                      A complete FastAPI backend with PyTorch inference was fully implemented,
                      covering real-time prediction, MC Dropout UQ, and NSGA-II optimization APIs.
                    </span>
                  </p>
                  <p>
                    生产部署时，PyTorch 模型被导出为{' '}
                    <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                      ONNX 格式
                    </span>
                    {' '}——Microsoft、Google、Meta、NVIDIA 等公司大规模部署
                    ML 模型所用的工业标准交换格式。运行体积从 ~500 MB 降至{' '}
                    <span style={{ color: '#34d399', fontWeight: 600 }}>2 MB</span>
                    ，推理提速{' '}
                    <span style={{ color: '#34d399', fontWeight: 600 }}>
                      5 倍（0.37 ms/次）
                    </span>
                    ，且精度零损失（R² 六位小数内完全一致）。
                    <br />
                    <span style={{ fontSize: '12px', color: '#475569' }}>
                      For production, the PyTorch model was exported to ONNX — the industry-standard
                      interchange format used by Microsoft, Google, Meta, and NVIDIA — cutting runtime
                      footprint from ~500 MB to 2 MB with 5× faster inference (0.37 ms/query) at zero
                      accuracy loss.
                    </span>
                  </p>
                  <p>
                    完整的 PyTorch 训练管线、残差网络结构、物理约束损失函数与
                    MC Dropout UQ 实现见{' '}
                    <a
                      href="https://github.com/sunccchengze/turbine-blade-ai-platform"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#818cf8', textDecoration: 'underline' }}
                    >
                      GitHub 仓库
                    </a>
                    {' '}（notebooks 03–06）。
                    <br />
                    <span style={{ fontSize: '12px', color: '#475569' }}>
                      The full training pipeline, residual architecture, physics-constrained loss,
                      and MC Dropout UQ implementation are available in the GitHub repository
                      (notebooks 03–06).
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '28px 24px', textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#cbd5e1' }}>
          孙承泽 · 本科二年级 · 独立完成
        </p>
        <p style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
          Sun Chengze · Undergraduate (Year 2) · Independent Project
        </p>
        <p style={{ fontSize: '12px', color: '#334155', marginTop: '14px' }}>
          NASA Rotor 37 · PyTorch ResidualSurrogateModel · NSGA-II · MC Dropout UQ
        </p>
        <p style={{ fontSize: '11px', color: '#1e293b', marginTop: '4px' }}>
          灵感源自 KIT 无压气机燃气轮机突破 · Inspired by KIT's compressorless gas turbine breakthrough (Feb 2026)
        </p>
        <Link
          to="/about"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            marginTop: '12px', color: '#818cf8', fontSize: '12px',
            textDecoration: 'none', borderBottom: '1px dashed rgba(129,140,248,0.4)',
          }}
        >
          关于与开发日志 About & Devlog
        </Link>
      </footer>

    </div>
  )
}
