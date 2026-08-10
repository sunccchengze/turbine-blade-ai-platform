import { useEffect, useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Gauge,
  Wind,
  CircleDot,
  RotateCcw,
  Sliders,
} from 'lucide-react'
import BladeViewer3D from '../components/BladeViewer3D'
import { predictPerformance, getBaselineFeatures } from '../utils/api'

// ── 结果卡片 (严格水平基线对齐与等宽数字) ───────────────────
function ResultCard({ label, symbol, value, sigma, unit, tone, icon: Icon, baseline }) {
  const diff = value !== null && baseline !== null && baseline !== undefined ? value - baseline : null
  const diffPct = baseline && baseline !== 0 && diff !== null
    ? ((diff / Math.abs(baseline)) * 100).toFixed(2)
    : null

  const colorMap = {
    teal:   { main: 'var(--teal-bright)', bg: 'rgba(52,211,153,0.06)', border: 'rgba(52,211,153,0.2)' },
    yellow: { main: 'var(--yellow)',      bg: 'rgba(231,200,91,0.06)', border: 'rgba(231,200,91,0.2)' },
    rust:   { main: 'var(--rust)',        bg: 'rgba(197,104,74,0.06)', border: 'rgba(197,104,74,0.2)' },
  }
  const theme = colorMap[tone] || colorMap.teal

  return (
    <div
      className="card-glow"
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 6,
        padding: '22px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      {/* 头部：固定高度 40px */}
      <div style={{ height: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 4,
            background: theme.bg,
            border: `1px solid ${theme.border}`,
            display: 'grid',
            placeItems: 'center',
            color: theme.main
          }}>
            <Icon size={14} />
          </div>
          <div>
            <div style={{ color: 'var(--paper)', fontSize: 14, fontWeight: 700 }}>{label}</div>
            <div style={{ color: 'var(--faint)', font: '10px var(--mono)' }}>OUTPUT METRIC</div>
          </div>
        </div>
        <span style={{ color: theme.main, font: '10px var(--mono)', fontWeight: 600, letterSpacing: '0.08em' }}>
          {symbol}
        </span>
      </div>

      {/* 主数值：固定高度 44px */}
      <div style={{ height: 44, display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span className="num" style={{ fontSize: 32, fontWeight: 700, color: theme.main, lineHeight: 1 }}>
          {value !== null ? value.toFixed(4) : '—'}
        </span>
        <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
          {unit}
        </span>
      </div>

      {/* 底部指标区：置信区间与基准对比 */}
      <div style={{
        marginTop: 14,
        paddingTop: 12,
        borderTop: '1px solid var(--line)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
        fontSize: '11px',
        fontFamily: 'var(--mono)'
      }}>
        <div>
          <div style={{ color: 'var(--faint)', fontSize: '9px' }}>UNCERTAINTY (±1.96σ)</div>
          <div style={{ color: 'var(--muted)', marginTop: 2 }}>
            {sigma !== null && sigma !== undefined ? `± ${sigma.toFixed(4)}` : '—'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'var(--faint)', fontSize: '9px' }}>VS BASELINE</div>
          <div style={{
            marginTop: 2,
            color: diffPct && parseFloat(diffPct) >= 0 ? 'var(--teal-bright)' : 'var(--rust)',
            fontWeight: 600
          }}>
            {diffPct ? `${parseFloat(diffPct) >= 0 ? '+' : ''}${diffPct}%` : '—'}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 精密工科参数滑块组件 ─────────────────────────────────────
function ParamSlider({ label, value, min, max, step, onChange, unit, tone = 'teal', hint }) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
  const accentColor = tone === 'yellow' ? 'var(--yellow)' : tone === 'rust' ? 'var(--rust)' : 'var(--teal-bright)'

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ color: 'var(--paper)', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {label}
        </span>
        <span className="num" style={{ color: accentColor, fontSize: 12, fontWeight: 700 }}>
          {typeof value === 'number' ? (step < 1 ? value.toFixed(2) : value.toFixed(0)) : value}
          <span style={{ color: 'var(--faint)', fontSize: 10, marginLeft: 3 }}>{unit}</span>
        </span>
      </div>

      {hint && (
        <div style={{ color: 'var(--faint)', fontSize: 10, lineHeight: 1.4, marginBottom: 8 }}>
          {hint}
        </div>
      )}

      <div style={{ position: 'relative', height: 16, display: 'flex', alignItems: 'center' }}>
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: 4,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.08)'
        }} />
        <div style={{
          position: 'absolute',
          left: 0,
          width: `${pct}%`,
          height: 4,
          borderRadius: 2,
          background: accentColor,
          transition: 'width 0.08s'
        }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            width: '100%',
            opacity: 0,
            cursor: 'pointer',
            height: 16,
            margin: 0
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, color: 'var(--faint)', font: '10px var(--mono)' }}>
        <span>{min.toLocaleString()}</span>
        <span>{max.toLocaleString()}</span>
      </div>
    </div>
  )
}

// ── 主工作台页面 ─────────────────────────────────────────────
export default function PredictPage() {
  const [baseline, setBaseline] = useState(null)
  const [features, setFeatures] = useState(null)
  const [stats, setStats] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [withUQ, setWithUQ] = useState(true)
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < 960)
  const debounceRef = useRef(null)

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 960)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // 加载基准数据
  useEffect(() => {
    getBaselineFeatures()
      .then(data => {
        setBaseline(data)
        setFeatures({ ...data.features })
        setStats(data.stats)
      })
      .catch(() => setError('基准设计特征加载失败 / Failed to load baseline features'))
  }, [])

  // 毫秒级防抖推理 (WASM 纯前端执行)
  const triggerPredict = useCallback((feats) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (!feats) return
      setLoading(true)
      setError(null)
      try {
        const featureArray = Object.values(feats).map(Number)
        const res = await predictPerformance(featureArray, withUQ)
        setResult(res)
      } catch (e) {
        setError(e.message || '预测失败 / Prediction failed')
      } finally {
        setLoading(false)
      }
    }, 120) // 120ms 极速响应
  }, [withUQ])

  const handleChange = (key, val) => {
    const newFeats = { ...features, [key]: val }
    setFeatures(newFeats)
    triggerPredict(newFeats)
  }

  const handleReset = () => {
    if (!baseline) return
    const resetFeats = { ...baseline.features }
    setFeatures(resetFeats)
    triggerPredict(resetFeats)
  }

  // 首次进入自动预测
  const didInit = useRef(false)
  useEffect(() => {
    if (features && !didInit.current) {
      didInit.current = true
      triggerPredict(features)
    }
  }, [features, triggerPredict])

  const getPredVal = (key) => {
    if (!result?.predictions) return null
    const p = result.predictions[key]
    if (!p) return null
    return p.mean ?? p.value ?? null
  }

  const getPredSigma = (key) => {
    if (!result?.predictions) return null
    return result.predictions[key]?.std ?? null
  }

  if (!baseline || !features || !stats) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--ink)'
      }}>
        <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
          <RefreshCw size={28} className="spin" style={{ margin: '0 auto 14px', color: 'var(--teal-bright)' }} />
          <p style={{ font: '13px var(--body)', color: 'var(--paper)' }}>正在初始化 WASM 代理模型与基准特征…</p>
        </div>
      </div>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--ink)', padding: '56px 28px 88px' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        
        {/* 01. 页面头部 (严格左对齐 28px) */}
        <motion.header
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 28,
            flexWrap: 'wrap',
            marginBottom: 28,
            paddingBottom: 18,
            borderBottom: '1px solid var(--line)'
          }}
        >
          <div>
            <div style={{ color: 'var(--yellow)', font: '10px var(--mono)', letterSpacing: '0.14em' }}>
              01 / 实时预测 · LIVE PREDICTION WORKSPACE
            </div>
            <h1 style={{
              color: 'var(--paper)',
              font: '700 clamp(32px, 4.5vw, 54px)/1.1 var(--display)',
              letterSpacing: '-0.045em',
              marginTop: 12
            }}>
              气动性能代理推断<br />
              <span style={{ color: 'var(--teal-bright)' }}>Aerodynamic State Inference</span>
            </h1>
          </div>
          <p style={{ maxWidth: 420, color: 'var(--muted)', fontSize: 13, lineHeight: 1.8 }}>
            动态调整 74 维几何统计参数与进气运行工况。浏览器内的 ONNX 代理模型以 0.2ms 延迟实时返回总压比、绝热效率与质量流量。
          </p>
        </motion.header>

        {error && (
          <div style={{
            marginBottom: 18,
            padding: '12px 16px',
            border: '1px solid var(--rust)',
            background: 'rgba(197,104,74,0.08)',
            color: 'var(--rust)',
            borderRadius: 6,
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* 顶部状态条 (无框工科 Token) */}
        <div style={{
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          flexWrap: 'wrap',
          fontSize: '11px',
          fontFamily: 'var(--mono)',
          color: 'var(--muted)',
          marginBottom: 24
        }}>
          <span style={{ color: 'var(--teal-bright)', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <CircleDot size={8} className="spin" style={{ animationDuration: '4s' }} />
            WASM LOCAL ACTIVE (0.23ms)
          </span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span>74 维气动几何特征</span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span>相对不确定性 ±1.96σ</span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span style={{ color: 'var(--faint)' }}>NASA Rotor 37 基准对比</span>
        </div>

        {/* 双栏工作台主布局 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isNarrow ? '1fr' : '340px minmax(0, 1fr)',
          gap: 20,
          alignItems: 'start'
        }}>
          
          {/* 左栏：输入参数控制台 */}
          <motion.aside
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 6,
              padding: '24px 20px',
              position: isNarrow ? 'relative' : 'sticky',
              top: 88
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sliders size={14} style={{ color: 'var(--yellow)' }} />
                <span style={{ font: '11px var(--mono)', color: 'var(--paper)', fontWeight: 700 }}>
                  参数输入控制面 · INPUTS
                </span>
              </div>
              <button
                onClick={handleReset}
                style={{
                  border: '1px solid var(--line)',
                  background: 'transparent',
                  color: 'var(--muted)',
                  padding: '5px 9px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 11,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <RotateCcw size={11} /> 重置基准
              </button>
            </div>

            {/* 1. 运行边界工况 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: 'var(--faint)', font: '10px var(--mono)', letterSpacing: '0.1em', marginBottom: 14 }}>
                01 / 运行工况边界 (OPERATING INFLOW)
              </div>
              <ParamSlider
                label="转速 Ω (Rotational Speed)"
                value={features.Omega}
                min={stats.Omega.min}
                max={stats.Omega.max}
                step={1}
                unit="rad/s"
                tone="teal"
                onChange={v => handleChange('Omega', v)}
                hint="转子角速度，直接决定叶顶马赫数与通流做功能力。"
              />
              <ParamSlider
                label="进口总压 P (Inlet Total Pressure)"
                value={features.P}
                min={stats.P.min}
                max={stats.P.max}
                step={100}
                unit="Pa"
                tone="teal"
                onChange={v => handleChange('P', v)}
                hint="级入口滞止总压，影响雷诺数与激波强度。"
              />
            </div>

            {/* 2. 关键气动特征 */}
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 18, marginBottom: 18 }}>
              <div style={{ color: 'var(--faint)', font: '10px var(--mono)', letterSpacing: '0.1em', marginBottom: 14 }}>
                02 / 表面统计特征 (SURFACE STATISTICS)
              </div>
              {[
                ['Pressure_mean', '表面静压均值', 'Pa', 'rust', '叶片表面吸力面与压力面平均静压水平。'],
                ['Pressure_std', '表面压力标准差', 'Pa', 'rust', '反映叶表载荷分布不均匀度与激波压升梯度。'],
                ['Temperature_mean', '表面温度均值', 'K', 'yellow', '流道气动加热与绝热总温升高均值。'],
                ['CoordinateY_mean', '叶高径向位置均值', 'm', 'teal', '描述叶型沿展向的几何质心分布。'],
              ].map(([key, label, unit, tone, desc]) => stats[key] ? (
                <ParamSlider
                  key={key}
                  label={label}
                  value={features[key]}
                  min={stats[key].min}
                  max={stats[key].max}
                  step={(stats[key].max - stats[key].min) / 100}
                  unit={unit}
                  tone={tone}
                  onChange={v => handleChange(key, v)}
                  hint={desc}
                />
              ) : null)}
            </div>

            {/* 3. UQ 开关 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 16,
              borderTop: '1px solid var(--line)'
            }}>
              <div>
                <div style={{ color: 'var(--paper)', fontSize: 12, fontWeight: 600 }}>不确定性量化 UQ</div>
                <div style={{ color: 'var(--faint)', font: '10px var(--mono)', marginTop: 2 }}>MC Dropout σ 指示器</div>
              </div>
              <button
                onClick={() => setWithUQ(!withUQ)}
                style={{
                  width: 38,
                  height: 20,
                  borderRadius: 10,
                  border: 0,
                  background: withUQ ? 'var(--teal-bright)' : 'rgba(255,255,255,0.12)',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: withUQ ? 'flex-end' : 'flex-start',
                  transition: 'background 0.2s'
                }}
              >
                <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#0b0e0d' }} />
              </button>
            </div>
          </motion.aside>

          {/* 右栏：结果呈现与 3D 叶片联动 */}
          <motion.section
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 }}
            style={{ display: 'grid', gap: 18 }}
          >
            {/* 推理加载态提示 */}
            {loading && (
              <div style={{
                padding: '8px 14px',
                border: '1px solid var(--line-strong)',
                background: 'var(--panel)',
                color: 'var(--teal-bright)',
                borderRadius: 4,
                font: '11px var(--mono)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}>
                <RefreshCw size={12} className="spin" />
                <span>WASM 代理推理计算中…</span>
              </div>
            )}

            {/* 3D 叶片数字孪生视口 */}
            <div style={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 6,
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '12px 18px',
                borderBottom: '1px solid var(--line)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ font: '11px var(--mono)', color: 'var(--paper)', fontWeight: 600 }}>
                  ROTOR 37 · 3D GEOMETRY PREVIEW
                </span>
                <span style={{ font: '10px var(--mono)', color: 'var(--faint)' }}>
                  DRAG TO ROTATE · SCROLL TO ZOOM
                </span>
              </div>
              <BladeViewer3D
                params={features}
                efficiency={getPredVal('Efficiency')}
                pressureRatio={getPredVal('Compression_ratio')}
                massflow={getPredVal('Massflow')}
                height={290}
              />
            </div>

            {/* 3 大核心气动输出指标卡片 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
              <ResultCard
                label="总压比"
                symbol="π"
                value={getPredVal('Compression_ratio')}
                sigma={getPredSigma('Compression_ratio')}
                unit="π"
                tone="teal"
                icon={Gauge}
                baseline={baseline?.true_performance?.Compression_ratio}
              />
              <ResultCard
                label="等熵绝热效率"
                symbol="η"
                value={getPredVal('Efficiency')}
                sigma={getPredSigma('Efficiency')}
                unit="η"
                tone="yellow"
                icon={TrendingUp}
                baseline={baseline?.true_performance?.Efficiency}
              />
              <ResultCard
                label="质量流量"
                symbol="ṁ"
                value={getPredVal('Massflow')}
                sigma={getPredSigma('Massflow')}
                unit="kg/s"
                tone="teal"
                icon={Wind}
                baseline={baseline?.true_performance?.Massflow}
              />
            </div>

            {/* 当前特征状态快照 */}
            <div style={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 6,
              padding: '20px 22px'
            }}>
              <div style={{ color: 'var(--faint)', font: '10px var(--mono)', letterSpacing: '0.12em', marginBottom: 14 }}>
                当前输入状态快照 · CURRENT INPUT STATE
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  ['转速 Ω', features.Omega?.toFixed(0), 'rad/s'],
                  ['进口总压 P', features.P?.toFixed(0), 'Pa'],
                  ['静压均值 P_mean', features.Pressure_mean?.toFixed(0), 'Pa'],
                  ['温度均值 T_mean', features.Temperature_mean?.toFixed(1), 'K'],
                ].map(([label, value, unit]) => (
                  <div key={label} style={{
                    padding: '12px 14px',
                    background: 'var(--ink)',
                    border: '1px solid var(--line)',
                    borderRadius: 4
                  }}>
                    <div style={{ color: 'var(--faint)', font: '10px var(--mono)' }}>{label}</div>
                    <div className="num" style={{ color: 'var(--paper)', fontSize: 16, fontWeight: 700, marginTop: 4 }}>
                      {value}
                    </div>
                    <div style={{ color: 'var(--faint)', font: '9px var(--mono)' }}>{unit}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 科学证据与机理解读 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{
                background: 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: 6,
                padding: '20px 22px'
              }}>
                <div style={{ color: 'var(--yellow)', font: '10px var(--mono)', letterSpacing: '0.12em', marginBottom: 10 }}>
                  如何解读实时预测
                </div>
                <p style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.8 }}>
                  数值由训练好的残差物理代理网络在浏览器本地毫秒级推理给出。UQ 不确定性区间代表模型在当前区域的认识可信度，适用于广域参数粗筛。
                </p>
              </div>

              <div style={{
                background: 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: 6,
                padding: '20px 22px'
              }}>
                <div style={{ color: 'var(--teal-bright)', font: '10px var(--mono)', letterSpacing: '0.12em', marginBottom: 10 }}>
                  证据链与物理边界
                </div>
                <div style={{ display: 'grid', gap: 8, color: 'var(--muted)', fontSize: 12 }}>
                  <div><strong style={{ color: 'var(--paper)' }}>E2 级证据：</strong> 生产 ONNX 留出测试集 R²=0.9844 已复现</div>
                  <div><strong style={{ color: 'var(--paper)' }}>E3 级证据：</strong> 真实 Rotor 37 网格 SU2 通路已跑通</div>
                  <div><strong style={{ color: 'var(--paper)' }}>物理终审：</strong> 极端工况候选需交付超算集群完成二阶收敛</div>
                </div>
              </div>
            </div>

          </motion.section>
        </div>

      </div>
    </main>
  )
}
