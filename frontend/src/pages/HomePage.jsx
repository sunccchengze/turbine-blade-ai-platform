import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  CircleDot,
  Database,
  Layers3,
  Orbit,
  ShieldCheck,
  Cpu,
  Compass,
  TrendingUp,
  BarChart3,
  Wand2,
  BookOpen,
  Terminal,
  Activity
} from 'lucide-react'
import AerodynamicBackground from '../components/AerodynamicBackground'

const fade = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
}

function SectionHead({ index, title, en, children }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 24,
      marginBottom: 28,
      flexWrap: 'wrap',
      paddingBottom: 16,
      borderBottom: '1px solid var(--line)'
    }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <span className="num" style={{ color: 'var(--yellow)', fontSize: 11, paddingTop: 4, fontWeight: 700 }}>
          {index}
        </span>
        <div>
          <h2 style={{
            color: 'var(--paper)',
            font: '600 clamp(22px, 2.8vw, 34px)/1.15 var(--display)',
            letterSpacing: '-0.04em'
          }}>
            {title}
          </h2>
          <div style={{
            color: 'var(--faint)',
            font: '10px var(--mono)',
            marginTop: 6,
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}>
            {en}
          </div>
        </div>
      </div>
      {children && (
        <div style={{ maxWidth: 420, color: 'var(--muted)', fontSize: 12, lineHeight: 1.75 }}>
          {children}
        </div>
      )}
    </div>
  )
}

export default function HomePage() {
  useEffect(() => {
    // 空闲期预加载静态数据与模型，实现切页 0ms 秒开 (李博杰 3.3)
    const prewarm = () => {
      fetch('/data/evolution.json').catch(() => {})
      fetch('/data/pareto.json').catch(() => {})
      fetch('/data/uq.json').catch(() => {})
    }
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(prewarm, { timeout: 2000 })
    } else {
      setTimeout(prewarm, 1000)
    }
  }, [])

  return (
    <main style={{ minHeight: '100vh', background: 'var(--ink)' }}>
      {/* 00. 顶部系统遥测条 (严格左对齐 28px，与导航栏 Logo 和 NewsBanner 绝对对齐) */}
      <div style={{
        borderBottom: '1px solid var(--line)',
        background: 'var(--panel)',
        fontSize: '11px',
        fontFamily: 'var(--mono)'
      }}>
        <div style={{
          maxWidth: 1240,
          margin: '0 auto',
          padding: '9px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: '10px 18px',
          flexWrap: 'wrap'
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--teal-bright)', fontWeight: 600 }}>
            <CircleDot size={8} className="spin" style={{ animationDuration: '4s' }} />
            本地 WASM 引擎就绪 / Local Active
          </span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span style={{ color: 'var(--muted)' }}>
            推理延迟: <strong style={{ color: 'var(--paper)' }}>0.23 ms</strong> (SIMD WASM)
          </span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span style={{ color: 'var(--muted)' }}>
            验证载体: <strong style={{ color: 'var(--paper)' }}>NASA Rotor 37 压气机</strong> (PLAID)
          </span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span style={{ color: 'var(--muted)' }}>
            筛选加速: <strong style={{ color: 'var(--yellow)' }}>~100,000×</strong> (vs 3D RANS)
          </span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span style={{ color: 'var(--muted)' }}>
            证据等级: <strong style={{ color: 'var(--teal)' }}>E2 代理 / E3 趋势</strong>
          </span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span style={{ color: 'var(--faint)' }}>纯前端零冷启动</span>
        </div>
      </div>

      {/* Hero Section (主舞台) */}
      <section className="grid-bg" style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--line)' }}>
        <AerodynamicBackground />
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '72px 28px 64px', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.1fr) minmax(320px, 0.9fr)',
            gap: 48,
            alignItems: 'start'
          }}>
            {/* 左侧：叙事与操作入口 */}
            <motion.div initial="hidden" animate="visible" variants={fade}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--yellow)',
                font: '10px var(--mono)',
                letterSpacing: '0.12em',
                marginBottom: 20
              }}>
                <Activity size={12} />
                AERO SCREENING · RESEARCH WORKSPACE
              </div>

              <h1 style={{
                color: 'var(--paper)',
                font: '700 clamp(38px, 4.8vw, 62px)/1.08 var(--display)',
                letterSpacing: '-0.055em',
                marginBottom: 20
              }}>
                Surrogate explores.<br />
                <span style={{ color: 'var(--teal-bright)' }}>Physics decides.</span><br />
                <span style={{
                  display: 'block',
                  marginTop: 14,
                  color: 'var(--paper)',
                  font: '700 clamp(20px, 2.5vw, 30px)/1.25 var(--display)',
                  letterSpacing: '-0.02em'
                }}>
                  模型探路 · 物理定音
                </span>
              </h1>

              <p style={{
                color: 'var(--muted)',
                fontSize: 15,
                lineHeight: 1.8,
                maxWidth: 580,
                marginBottom: 16
              }}>
                从 74 维统计参数到 NASA Rotor 37 真实叶型拓扑。利用物理残差代理网络在浏览器本地进行毫秒级气动筛选，再把高价值候选提交至工业级 SU2 求解器完成物理验证。
              </p>

              {/* 核心效能对比胶囊 */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                background: 'rgba(52,211,153,0.06)',
                border: '1px solid rgba(52,211,153,0.2)',
                borderRadius: 4,
                color: 'var(--paper)',
                fontSize: '11px',
                fontFamily: 'var(--mono)',
                marginBottom: 18,
                lineHeight: 1.6
              }}>
                <span>效能对比：单工况 3D RANS 稳态计算需数十秒至数小时 ➔ 本平台物理代理网络实现 0.23 ms 瞬时初筛</span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--faint)',
                font: '11px var(--mono)',
                marginBottom: 32,
                lineHeight: 1.6
              }}>
                <span style={{ color: 'var(--yellow)' }}>*</span>
                <span>PLAID 基准数据 · 纯前端 WASM 推理 · 100 组 Pareto 候选设计</span>
              </div>

              {/* 核心操作按钮组 (具备充裕呼吸空间与精致工科字距) */}
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                <Link to="/predict" className="btn-primary">
                  <Cpu size={15} />
                  <span>运行代理预测</span>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--mono)', opacity: 0.85, fontWeight: 500, marginLeft: 2 }}>Predict</span>
                </Link>

                <Link to="/explore" className="btn-secondary">
                  <Compass size={15} />
                  <span>探索数据流场</span>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--mono)', opacity: 0.75, fontWeight: 500, marginLeft: 2 }}>Explore</span>
                </Link>

                <Link
                  to="/methodology"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    color: 'var(--muted)',
                    padding: '12px 16px',
                    textDecoration: 'none',
                    fontSize: 12,
                    fontFamily: 'var(--mono)'
                  }}
                >
                  <BookOpen size={14} />
                  方法论证据 →
                </Link>
              </div>
            </motion.div>

            {/* 右侧：精密控制台 (Linear Precision Status Terminal，无多余边框) */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                ...fade,
                visible: { ...fade.visible, transition: { ...fade.visible.transition, delay: 0.1 } }
              }}
              style={{
                border: '1px solid var(--line-strong)',
                background: 'var(--panel)',
                borderRadius: 6,
                overflow: 'hidden'
              }}
            >
              {/* 顶部发丝状态头 */}
              <div style={{
                height: 2,
                background: 'linear-gradient(90deg, var(--teal-bright), var(--yellow), var(--rust))'
              }} />
              <div style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--line)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Terminal size={13} style={{ color: 'var(--yellow)' }} />
                  <span style={{ font: '11px var(--mono)', color: 'var(--paper)', fontWeight: 600 }}>
                    ROTOR 37 · REALTIME TELEMETRY
                  </span>
                </div>
                <span style={{ font: '10px var(--mono)', color: 'var(--teal-bright)', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                  <CircleDot size={8} /> E2 / E3 ACTIVE
                </span>
              </div>

              {/* 遥测指标 4 格阵列 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 1,
                background: 'var(--line)',
                borderBottom: '1px solid var(--line)'
              }}>
                <div style={{ background: 'var(--panel)', padding: '14px 18px' }}>
                  <div style={{ color: 'var(--faint)', font: '9px var(--mono)', letterSpacing: '0.08em' }}>INFERENCE LATENCY</div>
                  <div className="num" style={{ color: 'var(--teal-bright)', fontSize: 22, fontWeight: 700, marginTop: 4 }}>
                    0.23 <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted)' }}>ms</span>
                  </div>
                  <div style={{ color: 'var(--faint)', font: '10px var(--mono)', marginTop: 2 }}>WASM SIMD 1000 iter</div>
                </div>

                <div style={{ background: 'var(--panel)', padding: '14px 18px' }}>
                  <div style={{ color: 'var(--faint)', font: '9px var(--mono)', letterSpacing: '0.08em' }}>MODEL COMPLEXITY</div>
                  <div className="num" style={{ color: 'var(--paper)', fontSize: 22, fontWeight: 700, marginTop: 4 }}>
                    523k <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted)' }}>params</span>
                  </div>
                  <div style={{ color: 'var(--faint)', font: '10px var(--mono)', marginTop: 2 }}>2.01 MB single ONNX</div>
                </div>

                <div style={{ background: 'var(--panel)', padding: '14px 18px' }}>
                  <div style={{ color: 'var(--faint)', font: '9px var(--mono)', letterSpacing: '0.08em' }}>HELD-OUT TEST R²</div>
                  <div className="num" style={{ color: 'var(--yellow)', fontSize: 22, fontWeight: 700, marginTop: 4 }}>
                    0.9844
                  </div>
                  <div style={{ color: 'var(--faint)', font: '10px var(--mono)', marginTop: 2 }}>Total Pressure Ratio π</div>
                </div>

                <div style={{ background: 'var(--panel)', padding: '14px 18px' }}>
                  <div style={{ color: 'var(--faint)', font: '9px var(--mono)', letterSpacing: '0.08em' }}>PHYSICS STAGE</div>
                  <div className="num" style={{ color: 'var(--rust)', fontSize: 22, fontWeight: 700, marginTop: 4 }}>
                    10 pts
                  </div>
                  <div style={{ color: 'var(--faint)', font: '10px var(--mono)', marginTop: 2 }}>SU2 Stage Trend E3</div>
                </div>
              </div>

              {/* 4 阶段科研证据链流水 */}
              <div style={{ padding: '18px 20px' }}>
                <div style={{
                  color: 'var(--faint)',
                  font: '10px var(--mono)',
                  letterSpacing: '0.12em',
                  marginBottom: 12,
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>EVIDENCE FLOW PIPELINE</span>
                  <span>STATUS</span>
                </div>

                <div style={{ display: 'grid', gap: 0 }}>
                  {[
                    ['01', 'PUBLIC CFD SAMPLES', 'PLAID Rotor 37 / 1,000 样本 / 0 非流形边', 'VERIFIED E2', 'var(--teal-bright)'],
                    ['02', 'RESIDUAL SURROGATE', '74 维几何特征 → π, η, ṁ (WASM 本地)', 'ACTIVE E2', 'var(--teal-bright)'],
                    ['03', 'NSGA-II MULTI-OBJ', '100 组 Pareto 气动权衡候选解', 'FILTERED E2', 'var(--yellow)'],
                    ['04', 'SU2 SOLVER CLOSURE', '一阶 1000 步残差平台 -3.39 / 细网格待 HPC', 'TREND E3', 'var(--rust)'],
                  ].map(([num, title, desc, tag, color], idx) => (
                    <div
                      key={num}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '26px 1fr auto',
                        gap: 12,
                        padding: '10px 0',
                        alignItems: 'center',
                        borderBottom: idx < 3 ? '1px solid var(--line)' : 'none'
                      }}
                    >
                      <span className="num" style={{ color: 'var(--faint)', fontSize: 11, fontWeight: 600 }}>
                        {num}
                      </span>
                      <div>
                        <div style={{ color: 'var(--paper)', fontSize: 12, fontWeight: 600 }}>{title}</div>
                        <div style={{ color: 'var(--faint)', font: '10px var(--mono)', marginTop: 2 }}>{desc}</div>
                      </div>
                      <span style={{
                        color,
                        font: '10px var(--mono)',
                        letterSpacing: '0.06em',
                        fontWeight: 600
                      }}>
                        {tag}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 01: 数量化留出测试集验证矩阵 (严格水平与基线对齐，无丑边框) */}
      <section style={{ maxWidth: 1240, margin: '0 auto', padding: '64px 28px 24px' }}>
        <SectionHead
          index="01"
          title="留出测试集严格评测指标"
          en="HELD-OUT TEST SET EVALUATION / N=100 RANDOM_STATE=42"
        >
          所有决定系数 $R^2$、MAE 与 RMSE 均由独立留出测试集（$n=100$）严格测量产生，绝无训练集泄漏。此指标代表代理模型拟合精度，不替代真实 CFD。
        </SectionHead>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 16
        }}>
          {/* Card 1: 总压比 */}
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 6,
            padding: '22px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            {/* 卡片头部：固定高度 */}
            <div style={{ height: 44, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ font: '10px var(--mono)', color: 'var(--faint)', letterSpacing: '0.08em' }}>
                  01 / PRESSURE RATIO
                </span>
                <span style={{ font: '10px var(--mono)', color: 'var(--teal-bright)', letterSpacing: '0.08em', fontWeight: 600 }}>
                  PRIMARY GOAL
                </span>
              </div>
              <div style={{ color: 'var(--paper)', fontSize: 15, fontWeight: 700, marginTop: 4 }}>
                总压比 π
              </div>
            </div>

            {/* 大数字：固定高度与水平对齐 */}
            <div style={{ height: 48, display: 'flex', alignItems: 'center' }}>
              <span className="num" style={{ color: 'var(--teal-bright)', fontSize: 36, fontWeight: 700, lineHeight: 1 }}>
                0.9844
              </span>
            </div>

            {/* 底部指标：固定 3 列网格 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 6,
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid var(--line)',
              fontSize: '11px',
              fontFamily: 'var(--mono)',
              color: 'var(--muted)',
              whiteSpace: 'nowrap'
            }}>
              <div>MAE: <strong style={{ color: 'var(--paper)' }}>0.0097</strong></div>
              <div>RMSE: <strong style={{ color: 'var(--paper)' }}>0.0135</strong></div>
              <div>范围: <strong style={{ color: 'var(--paper)' }}>1.45~2.21</strong></div>
            </div>
          </div>

          {/* Card 2: 等熵效率 */}
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 6,
            padding: '22px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            {/* 卡片头部：固定高度 */}
            <div style={{ height: 44, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ font: '10px var(--mono)', color: 'var(--faint)', letterSpacing: '0.08em' }}>
                  02 / EFFICIENCY
                </span>
                <span style={{ font: '10px var(--mono)', color: 'var(--yellow)', letterSpacing: '0.08em', fontWeight: 600 }}>
                  AERO SENSITIVE
                </span>
              </div>
              <div style={{ color: 'var(--paper)', fontSize: 15, fontWeight: 700, marginTop: 4 }}>
                等熵绝热效率 η
              </div>
            </div>

            {/* 大数字：固定高度与水平对齐 */}
            <div style={{ height: 48, display: 'flex', alignItems: 'center' }}>
              <span className="num" style={{ color: 'var(--yellow)', fontSize: 36, fontWeight: 700, lineHeight: 1 }}>
                0.9561
              </span>
            </div>

            {/* 底部指标：固定 3 列网格 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 6,
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid var(--line)',
              fontSize: '11px',
              fontFamily: 'var(--mono)',
              color: 'var(--muted)',
              whiteSpace: 'nowrap'
            }}>
              <div>MAE: <strong style={{ color: 'var(--paper)' }}>0.0031</strong></div>
              <div>RMSE: <strong style={{ color: 'var(--paper)' }}>0.0044</strong></div>
              <div>范围: <strong style={{ color: 'var(--paper)' }}>0.82~0.93</strong></div>
            </div>
          </div>

          {/* Card 3: 质量流量 */}
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 6,
            padding: '22px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            {/* 卡片头部：固定高度 */}
            <div style={{ height: 44, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ font: '10px var(--mono)', color: 'var(--faint)', letterSpacing: '0.08em' }}>
                  03 / MASS FLOW
                </span>
                <span style={{ font: '10px var(--mono)', color: 'var(--teal-bright)', letterSpacing: '0.08em', fontWeight: 600 }}>
                  CHOKING LIMIT
                </span>
              </div>
              <div style={{ color: 'var(--paper)', fontSize: 15, fontWeight: 700, marginTop: 4 }}>
                质量流量 ṁ (kg/s)
              </div>
            </div>

            {/* 大数字：固定高度与水平对齐 */}
            <div style={{ height: 48, display: 'flex', alignItems: 'center' }}>
              <span className="num" style={{ color: 'var(--teal-bright)', fontSize: 36, fontWeight: 700, lineHeight: 1 }}>
                0.9827
              </span>
            </div>

            {/* 底部指标：固定 3 列网格 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 6,
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid var(--line)',
              fontSize: '11px',
              fontFamily: 'var(--mono)',
              color: 'var(--muted)',
              whiteSpace: 'nowrap'
            }}>
              <div>MAE: <strong style={{ color: 'var(--paper)' }}>0.142</strong></div>
              <div>RMSE: <strong style={{ color: 'var(--paper)' }}>0.201</strong></div>
              <div>范围: <strong style={{ color: 'var(--paper)' }}>18~22 kg/s</strong></div>
            </div>
          </div>

          {/* Card 4: 代理筛选加速比 */}
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 6,
            padding: '22px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            {/* 卡片头部：固定高度 */}
            <div style={{ height: 44, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ font: '10px var(--mono)', color: 'var(--faint)', letterSpacing: '0.08em' }}>
                  04 / SPEEDUP
                </span>
                <span style={{ font: '10px var(--mono)', color: 'var(--rust)', letterSpacing: '0.08em', fontWeight: 600 }}>
                  CFD ACCELERATION
                </span>
              </div>
              <div style={{ color: 'var(--paper)', fontSize: 15, fontWeight: 700, marginTop: 4 }}>
                代理筛选加速比
              </div>
            </div>

            {/* 大数字：固定高度与水平对齐 */}
            <div style={{ height: 48, display: 'flex', alignItems: 'center' }}>
              <span className="num" style={{ color: 'var(--rust)', fontSize: 36, fontWeight: 700, lineHeight: 1 }}>
                ~100,000×
              </span>
            </div>

            {/* 底部指标：固定 3 列网格 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 6,
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid var(--line)',
              fontSize: '11px',
              fontFamily: 'var(--mono)',
              color: 'var(--muted)',
              whiteSpace: 'nowrap'
            }}>
              <div>ONNX: <strong style={{ color: 'var(--paper)' }}>0.23ms</strong></div>
              <div>CFD: <strong style={{ color: 'var(--paper)' }}>30~60s</strong></div>
              <div>增益: <strong style={{ color: 'var(--paper)' }}>10⁵ 量级</strong></div>
            </div>
            <div style={{ color: 'var(--faint)', font: '9px var(--mono)', marginTop: 8 }}>
              * 单工况 3D RANS vs 单核 SIMD WASM，不含前置离线样本成本
            </div>
          </div>
        </div>
      </section>

      {/* Section 02: 全流程科研闭环架构 (Closed-Loop Scientific Architecture) */}
      <section style={{ maxWidth: 1240, margin: '0 auto', padding: '56px 28px 24px' }}>
        <SectionHead
          index="02"
          title="从参数空间到物理终审的四步闭环"
          en="SCIENTIFIC CLOSED LOOP: AUDIT → SURROGATE → PARETO → SOLVER"
        >
          平台构建了严谨的证据链条：每一步均有清晰的数学输入、算法处理与验证边界，严禁在未收敛求解器上作过度断言。
        </SectionHead>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16
        }}>
          {[
            {
              step: '01',
              label: 'AUDIT',
              title: '几何拓扑审计',
              desc: '对 1,000 组真实点云 (1000×2048×9) 与原始表面网格进行单连通与流形性检验，确认 0 非流形边，消除几何畸变。',
              icon: Database,
              color: 'var(--teal-bright)'
            },
            {
              step: '02',
              label: 'PREDICT',
              title: '毫秒级代理推理',
              desc: '74 维气动统计特征经标准化后送入 PyTorch/ONNX 残差代理网络，在浏览器 WASM 本地输出 π, η, ṁ 及置信度提示。',
              icon: Orbit,
              color: 'var(--teal-bright)'
            },
            {
              step: '03',
              label: 'OPTIMIZE',
              title: '多目标 Pareto 权衡',
              desc: 'NSGA-II 算法进行 20 代进化寻优，生成 100 组压比、效率与质量流量的三目标非支配候选解集。',
              icon: Layers3,
              color: 'var(--yellow)'
            },
            {
              step: '04',
              label: 'SOLVER',
              title: 'SU2 求解器物理校验',
              desc: '打通真实 Rotor 37 网格与边界条件输入，提取粗网格 10 阶段流动趋势（E3 级），细网格二阶收敛留待 HPC 集群。',
              icon: ShieldCheck,
              color: 'var(--rust)'
            },
          ].map(({ step, label, title, desc, icon: Icon, color }) => (
            <div
              key={step}
              style={{
                background: 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: 6,
                padding: '24px 20px',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon size={16} style={{ color }} />
                  <span style={{ font: '10px var(--mono)', color: 'var(--faint)', letterSpacing: '0.1em' }}>
                    {step} / {label}
                  </span>
                </div>
                <span className="num" style={{ color: 'var(--faint)', fontSize: 11 }}>
                  PHASE {step}
                </span>
              </div>
              <h3 style={{ color: 'var(--paper)', fontSize: 16, fontWeight: 700, marginBottom: 10 }}>
                {title}
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.8 }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 03: 科研工作台核心系统入口 (Workspace Gateway，无多余边框) */}
      <section style={{ maxWidth: 1240, margin: '0 auto', padding: '56px 28px 24px' }}>
        <SectionHead
          index="03"
          title="交互式科研工作台"
          en="INTERACTIVE SCIENTIFIC WORKSPACES & MODULES"
        >
          全站所有计算与图表均在浏览器端通过 WebAssembly 本地执行，无需等待后端服务器唤醒，支持毫秒级响应与多维联动。
        </SectionHead>

        {/* 推荐研究动线引导 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 20,
          fontFamily: 'var(--mono)',
          fontSize: '11px',
          color: 'var(--muted)',
          flexWrap: 'wrap',
          padding: '10px 14px',
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 4
        }}>
          <span style={{ color: 'var(--yellow)', fontWeight: 600 }}>推荐研究动线 / WORKFLOW:</span>
          <span style={{ color: 'var(--teal-bright)' }}>01 实时预测 (单点推断)</span>
          <span>➔</span>
          <span style={{ color: 'var(--teal-bright)' }}>02 流场探索 (二维切片)</span>
          <span>➔</span>
          <span style={{ color: 'var(--yellow)' }}>03 帕累托寻优 (多目标前沿)</span>
          <span>➔</span>
          <span style={{ color: 'var(--rust)' }}>04 认知检验 (不确定性量化)</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 16
        }}>
          {[
            {
              path: '/predict',
              num: '01',
              title: '气动性能预测工作台',
              en: 'Aerodynamic Performance Prediction',
              desc: '动态调整 74 维几何统计参数，实时获取压比、等熵效率与流量预测，并查看与基准设计的绝对/相对差异。',
              badge: 'WASM LOCAL',
              icon: Cpu,
              accent: 'var(--teal-bright)'
            },
            {
              path: '/explore',
              num: '02',
              title: '1,000 样本数据与流场探索',
              en: 'Dataset & Flow Field Exploration',
              desc: '3D 散点投影、PCA 降维、翼型截面切片与参数相关性热力图，全景审视 NASA Rotor 37 公开样本分布空间。',
              badge: '1000 SAMPLES',
              icon: Compass,
              accent: 'var(--teal-bright)'
            },
            {
              path: '/optimize',
              num: '03',
              title: 'NSGA-II 帕累托优化前沿',
              en: 'Multi-Objective Pareto Front',
              desc: '交互式查看 100 组三目标 Pareto 候选解，回放 20 代种群进化历程，点选候选设计实时驱动 3D 叶片几何渲染。',
              badge: '100 CANDIDATES',
              icon: TrendingUp,
              accent: 'var(--yellow)'
            },
            {
              path: '/uq',
              num: '04',
              title: '不确定性量化与灵敏度',
              en: 'Uncertainty Quantification (UQ)',
              desc: '基于 MC Dropout 提取预测方差 σ，坦诚呈现留出测试集区间覆盖率，深度剖析等熵效率通道的物理敏感性。',
              badge: 'MC DROPOUT',
              icon: BarChart3,
              accent: 'var(--yellow)'
            },
            {
              path: '/generate',
              num: '05',
              title: '扩散逆向生成设计',
              en: 'Generative Inverse Design',
              desc: '输入目标气动指标，通过逆向生成模型反演 74 维叶片几何参数，内置几何厚度非负性与曲率连续性校验。',
              badge: 'DIFFUSION PROTOTYPE',
              icon: Wand2,
              accent: 'var(--rust)'
            },
            {
              path: '/methodology',
              num: '06',
              title: '数学方法论与科学证明',
              en: 'Methodology & Theoretical Rigor',
              desc: '物理软惩罚损失函数推导、训练/留出集切分口径、ONNX 算力基准测试与完整复现指令。',
              badge: 'THEORETICAL PROOF',
              icon: BookOpen,
              accent: 'var(--paper)'
            },
          ].map(({ path, num, title, en, desc, badge, icon: Icon, accent }) => (
            <Link
              key={path}
              to={path}
              style={{
                display: 'block',
                background: 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: 6,
                padding: '24px 22px',
                textDecoration: 'none',
                transition: 'border-color 0.2s, transform 0.2s, background 0.2s'
              }}
              className="card-glow"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="num" style={{ color: accent, fontSize: 13, fontWeight: 700 }}>
                    {num}
                  </span>
                  <Icon size={16} style={{ color: accent }} />
                </div>
                <span style={{ font: '10px var(--mono)', color: accent, letterSpacing: '0.08em', fontWeight: 600 }}>
                  {badge}
                </span>
              </div>

              <h3 style={{ color: 'var(--paper)', fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
                {title}
              </h3>
              <div style={{ color: 'var(--faint)', font: '10px var(--mono)', marginBottom: 12, letterSpacing: '0.04em' }}>
                {en}
              </div>

              <p style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.75, marginBottom: 16 }}>
                {desc}
              </p>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: accent,
                fontSize: 11,
                fontFamily: 'var(--mono)',
                fontWeight: 600
              }}>
                进入工作台 / Enter Workspace <ArrowUpRight size={13} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Section 04: Nature 规范学术证据等级表 (全居中对齐，标准三线学术排版) */}
      <section style={{ maxWidth: 1240, margin: '0 auto', padding: '56px 28px 24px' }}>
        <SectionHead
          index="04"
          title="科研证据分级与客观边界"
          en="SCIENTIFIC EVIDENCE HIERARCHY & DEMARCATION"
        >
          坚守第一性原理与工科诚实原则：明确区分代理模型推断、统计测试指标与真实 CFD 物理计算，不将中间推断包装为权威事实。
        </SectionHead>

        <div style={{
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 6,
          overflowX: 'auto',
          padding: '20px 24px'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px',
            fontFamily: 'var(--mono)',
            textAlign: 'center'
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--line-strong)', color: 'var(--paper)' }}>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700 }}>证据等级 (GRADE)</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700 }}>定义与适用范围</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700 }}>本项目当前对应成果</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700 }}>科学结论边界</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--faint)' }}>E0 规划</td>
                <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--muted)' }}>设计假设与理论推演</td>
                <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--paper)' }}>无压气机燃气轮机启发与 Rotor 37 命题</td>
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <span style={{ color: 'var(--faint)' }}>[ 探索方向 / THEORETICAL ]</span>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--faint)' }}>E1 静态</td>
                <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--muted)' }}>代码架构、数据字典与接口协议</td>
                <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--paper)' }}>FastAPI 契约、ONNX 导出脚本、点云转换器</td>
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <span style={{ color: 'var(--yellow)' }}>[ 架构通路已就绪 / READY ]</span>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--teal-bright)', fontWeight: 700 }}>E2 代理/统计</td>
                <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--muted)' }}>留出测试集指标与代理模型搜索</td>
                <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--paper)' }}>R²=0.9844、100 组 NSGA-II Pareto 解集</td>
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <span style={{ color: 'var(--teal-bright)', fontWeight: 600 }}>[ 代理预测已复现 / REPRODUCED ]</span>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--rust)', fontWeight: 700 }}>E3 物理趋势</td>
                <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--muted)' }}>真实求解器启动与粗网格流动计算</td>
                <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--paper)' }}>SU2 粗网格一阶 1000 步 Stage 性能提取 (relrms=-3.39)</td>
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <span style={{ color: 'var(--rust)', fontWeight: 600 }}>[ 粗网格流动趋势 · 未收敛 / TREND ONLY ]</span>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--muted)' }}>E4 物理闭环</td>
                <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--muted)' }}>高精度 RANS CFD 二阶正式收敛验证</td>
                <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--faint)' }}>SU2 355万细网格 (受限本地内存，留待 HPC)</td>
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <span style={{ color: 'var(--muted)' }}>[ 待超算算力支持 / HPC PENDING ]</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 05: 科研哲学与定音 (Scientific Postulate & Conclusion) */}
      <section style={{ maxWidth: 1240, margin: '0 auto', padding: '56px 28px 80px' }}>
        <div style={{
          border: '1px solid var(--line)',
          background: 'var(--panel)',
          borderRadius: 6,
          padding: '36px 32px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 48,
          alignItems: 'center'
        }}>
          <div>
            <div style={{ color: 'var(--yellow)', font: '10px var(--mono)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              SCIENTIFIC POSTULATE / 科研总纲
            </div>
            <h2 style={{
              color: 'var(--paper)',
              font: '600 clamp(26px, 3.2vw, 42px)/1.15 var(--display)',
              letterSpacing: '-0.045em',
              marginTop: 14
            }}>
              A fast filter.<br />
              <span style={{ color: 'var(--teal-bright)' }}>A slower truth.</span>
            </h2>
            <div style={{ color: 'var(--faint)', font: '13px var(--body)', marginTop: 8 }}>
              快速筛选空间，慢速验证真理。
            </div>
          </div>

          <div style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.85 }}>
            <p style={{ marginBottom: 14 }}>
              代理模型负责用毫秒级算力缩小高维搜索空间；几何审计负责拦截自交与破损形状；RANS CFD 负责物理终审。
            </p>
            <p style={{ marginBottom: 20 }}>
              把这三个角色分得越清，平台就越有学术可信度。我们选择将全部真实指标、置信区间与未收敛风险公开展示在平台上。
            </p>
            <div style={{
              display: 'flex',
              gap: 16,
              alignItems: 'center',
              paddingTop: 16,
              borderTop: '1px solid var(--line)',
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              color: 'var(--faint)'
            }}>
              <span>西安交通大学 · 孙承泽</span>
              <span>•</span>
              <span>能动强基 2501</span>
              <span>•</span>
              <Link to="/about" style={{ color: 'var(--teal-bright)', textDecoration: 'none' }}>
                查看研发日志 →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
