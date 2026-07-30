import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  Brain, Target, ChevronRight,
  TrendingUp, Award, Database,
  Activity, Shield, BarChart3,
  Calendar, MapPin, AlertTriangle, Zap
} from 'lucide-react'
import { getModelInfo, getTrainingStats } from '../utils/api'
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
  const [modelInfo,     setModelInfo]     = useState(null)
  const [trainingStats, setTrainingStats] = useState(null)

  useEffect(() => {
    getModelInfo().then(setModelInfo).catch(console.error)
    getTrainingStats().then(setTrainingStats).catch(console.error)
  }, [])

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
            AI-Driven Turbine Blade
            <br />
            <span className="gradient-text">Design Optimization</span>
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
            Trained on{' '}
            <span style={{ color: '#818cf8', fontWeight: 500 }}>NASA Rotor 37</span>
            {' '}benchmark CFD data — predicts blade aerodynamic performance in{' '}
            <span style={{ color: '#34d399', fontWeight: 500 }}>milliseconds</span>
            , enabling NSGA-II optimization at{' '}
            <span style={{ color: '#fbbf24', fontWeight: 500 }}>~100,000× CFD speed</span>.
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
              Live Prediction
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
              View Pareto Front
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
              title="Surrogate Model Accuracy"
              subtitle="Residual neural network with physics constraints, trained on 1,000 CFD samples"
            />
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '14px',
            }}>
              {[
                { label: 'Pressure Ratio R²', value: '0.9861', color: 'primary' },
                { label: 'Efficiency R²',     value: '0.9588', color: 'cyan'    },
                { label: 'Mass Flow R²',      value: '0.9845', color: 'green'   },
                { label: 'CFD Speedup',       value: '~100K×', color: 'amber'   },
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
              title="Why This Matters Now"
              subtitle="The KIT breakthrough fundamentally changes the turbine blade design equation"
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

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#94a3b8', lineHeight: 1.8 }}>
                    <p>
                      KIT demonstrated a compressorless gas turbine running for{' '}
                      <span style={{ color: '#fbbf24', fontWeight: 600 }}>303 seconds</span>
                      , breaking NASA's previous record. Traditional gas turbines consume nearly{' '}
                      <span style={{ color: '#f87171', fontWeight: 600 }}>50% of output power</span>
                      {' '}to drive the compressor stage.
                    </p>
                    <p>
                      Eliminating the compressor shifts the performance bottleneck onto{' '}
                      <span style={{ color: '#818cf8', fontWeight: 600 }}>
                        turbine blade aerodynamic efficiency
                      </span>
                      {' '}— making AI-accelerated blade optimization more critical than ever.
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
                      Compressor power eliminated:
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
                        Our AI Pipeline
                      </h3>
                      <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        End-to-end MDO framework
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      {
                        icon: Database, color: '#818cf8',
                        bg: 'rgba(99,102,241,0.08)',
                        label: 'NASA Rotor 37 Data',
                        desc: '1,000 CFD samples · 29,773 surface nodes each',
                      },
                      {
                        icon: Brain, color: '#a78bfa',
                        bg: 'rgba(167,139,250,0.08)',
                        label: 'Residual Surrogate Model',
                        desc: 'Physics-constrained · R² > 0.95 on all outputs',
                      },
                      {
                        icon: Shield, color: '#34d399',
                        bg: 'rgba(52,211,153,0.08)',
                        label: 'MC Dropout UQ',
                        desc: '100-sample inference · 95% confidence intervals',
                      },
                      {
                        icon: Target, color: '#fbbf24',
                        bg: 'rgba(251,191,36,0.08)',
                        label: 'NSGA-II Optimization',
                        desc: '100 Pareto-optimal designs · +5.83% efficiency',
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
              title="AI-Found Optimal Designs"
              subtitle="NSGA-II discovered designs that surpass all 1,000 CFD training samples"
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
                  title: 'Max Efficiency Design',
                  metric: 'η = 0.9211', delta: '+5.83%',
                  sub: 'vs. training avg',
                  desc: 'Highest isentropic efficiency in the Pareto front',
                  tag: 'Efficiency-optimal',
                },
                {
                  icon: TrendingUp,  color: '#34d399',
                  bg: 'rgba(52,211,153,0.06)', border: 'rgba(52,211,153,0.15)',
                  title: 'Max Throughput Design',
                  metric: 'ṁ = 21.64 kg/s', delta: '+10.95%',
                  sub: 'vs. training avg',
                  desc: 'Maximum mass flow rate within constraint bounds',
                  tag: 'Throughput-optimal',
                },
                {
                  icon: BarChart3,   color: '#22d3ee',
                  bg: 'rgba(34,211,238,0.06)', border: 'rgba(34,211,238,0.15)',
                  title: 'Pareto Front Size',
                  metric: '100 designs', delta: 'all satisfying',
                  sub: 'π ≥ 1.8, η ≥ 0.84',
                  desc: 'Non-dominated solutions for engineer selection',
                  tag: 'Multi-objective',
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
                    Key Takeaway
                  </span>
                </div>

                <h2 style={{
                  fontSize: 'clamp(1.2rem, 2.8vw, 1.65rem)',
                  fontWeight: 700, color: '#f1f5f9', lineHeight: 1.4,
                  marginBottom: '14px',
                }}>
                  From weeks of CFD simulation to seconds of AI inference —
                  <br />
                  <span className="gradient-text">
                    the same physics, a hundred thousand times faster.
                  </span>
                </h2>

                <p style={{
                  fontSize: '13px', color: '#64748b',
                  lineHeight: 1.8, marginBottom: '28px',
                }}>
                  Full MDO pipeline: data → surrogate model →
                  uncertainty quantification → Pareto optimization
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
                    Start Predicting <ChevronRight size={14} />
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
                    Explore Uncertainty <BarChart3 size={14} />
                  </Link>
                </div>
              </div>
            </motion.div>
          </ScrollSection>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '28px 24px', textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        <p style={{ fontSize: '12px', color: '#334155' }}>
          NASA Rotor 37 · PyTorch ResidualSurrogateModel · NSGA-II · MC Dropout UQ
        </p>
        <p style={{ fontSize: '11px', color: '#1e293b', marginTop: '4px' }}>
          Inspired by KIT's compressorless gas turbine breakthrough · Feb 2026
        </p>
      </footer>

    </div>
  )
}