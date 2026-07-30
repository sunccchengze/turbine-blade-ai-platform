import { useEffect, useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Cpu, RefreshCw, AlertCircle,
  TrendingUp, Gauge, Wind,
  ChevronRight, Info
} from 'lucide-react'
import { predictPerformance, getBaselineFeatures } from '../utils/api'

// ── 工具函数 ───────────────────────────────────────────────
function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max)
}

// ── 结果卡片 ───────────────────────────────────────────────
function ResultCard({ label, value, sigma, unit, color, icon: Icon, baseline }) {
  const improvement = baseline
    ? (((value - baseline) / Math.abs(baseline)) * 100).toFixed(2)
    : null

  const palettes = {
    primary: { text: '#818cf8', bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.2)'  },
    cyan:    { text: '#22d3ee', bg: 'rgba(34,211,238,0.08)',  border: 'rgba(34,211,238,0.2)'  },
    green:   { text: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)'  },
  }
  const p = palettes[color]

  return (
    <div className="glass-card card-glow" style={{
      padding: '20px',
      background: p.bg,
      border: `1px solid ${p.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: `${p.text}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={15} color={p.text} />
        </div>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
      </div>

      {/* 主数值 */}
      <div className="num" style={{
        fontSize: '32px', fontWeight: 700, color: p.text, lineHeight: 1,
        marginBottom: '6px',
      }}>
        {value !== null ? value.toFixed(4) : '—'}
        <span style={{ fontSize: '13px', fontWeight: 400, color: '#64748b', marginLeft: '4px' }}>
          {unit}
        </span>
      </div>

      {/* 置信区间 */}
      {sigma !== null && sigma !== undefined && (
        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
          ± {sigma.toFixed(4)}{' '}
          <span style={{ color: '#475569' }}>95% CI</span>
        </div>
      )}

      {/* 与基准对比 */}
      {improvement !== null && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          padding: '2px 8px', borderRadius: '9999px',
          background: parseFloat(improvement) >= 0
            ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
          fontSize: '11px', fontWeight: 600,
          color: parseFloat(improvement) >= 0 ? '#34d399' : '#f87171',
        }}>
          {parseFloat(improvement) >= 0 ? '▲' : '▼'} {Math.abs(improvement)}% vs baseline
        </div>
      )}
    </div>
  )
}

// ── 滑块组件 ───────────────────────────────────────────────
function ParamSlider({ label, value, min, max, step, onChange, unit, color = '#818cf8' }) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '8px',
      }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>
          {label}
        </span>
        <span className="num" style={{
          fontSize: '13px', fontWeight: 700, color,
          background: `${color}12`,
          padding: '2px 8px', borderRadius: '6px',
          border: `1px solid ${color}20`,
        }}>
          {typeof value === 'number' ? value.toFixed(0) : value}
          {unit && <span style={{ fontSize: '10px', marginLeft: '3px', color: '#64748b' }}>{unit}</span>}
        </span>
      </div>

      <div style={{ position: 'relative', height: '20px', display: 'flex', alignItems: 'center' }}>
        {/* 轨道底色 */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: '4px',
          borderRadius: '2px', background: 'rgba(255,255,255,0.06)',
        }} />
        {/* 已填充部分 */}
        <div style={{
          position: 'absolute', left: 0, width: `${pct}%`, height: '4px',
          borderRadius: '2px',
          background: `linear-gradient(to right, ${color}80, ${color})`,
          transition: 'width 0.1s',
        }} />
        {/* 原生 input range */}
        <input
          type="range"
          min={min} max={max} step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{
            position: 'absolute', left: 0, right: 0,
            width: '100%', opacity: 0, cursor: 'pointer',
            height: '20px', margin: 0,
          }}
        />
        {/* 自定义滑块圆点 */}
        <div style={{
          position: 'absolute',
          left: `calc(${pct}% - 8px)`,
          width: '16px', height: '16px', borderRadius: '50%',
          background: color,
          boxShadow: `0 0 8px ${color}60`,
          border: '2px solid rgba(15,23,42,0.8)',
          transition: 'left 0.1s',
          pointerEvents: 'none',
        }} />
      </div>

      {/* min/max 标注 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        <span style={{ fontSize: '10px', color: '#334155' }}>{min.toLocaleString()}</span>
        <span style={{ fontSize: '10px', color: '#334155' }}>{max.toLocaleString()}</span>
      </div>
    </div>
  )
}

// ── 主页面 ─────────────────────────────────────────────────
export default function PredictPage() {
  const [baseline,     setBaseline]     = useState(null)
  const [features,     setFeatures]     = useState(null)
  const [stats,        setStats]        = useState(null)
  const [result,       setResult]       = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)
  const [history,      setHistory]      = useState([])
  const [withUQ,       setWithUQ]       = useState(true)
  const debounceRef = useRef(null)

  // 加载基准特征
  useEffect(() => {
    getBaselineFeatures()
      .then(data => {
        setBaseline(data)
        setFeatures({ ...data.features })
        setStats(data.stats)
      })
      .catch(err => setError('Failed to load baseline features'))
  }, [])

  // 防抖预测（用户停止拖动300ms后触发）
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
        // 加入历史
        setHistory(prev => [{
          timestamp: new Date().toLocaleTimeString(),
          result: res,
          omega: feats.Omega,
          p: feats.P,
        }, ...prev].slice(0, 8))
      } catch (e) {
        setError(e.message || 'Prediction failed')
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [withUQ])

  // 修改参数
  const handleChange = (key, val) => {
    const newFeats = { ...features, [key]: val }
    setFeatures(newFeats)
    triggerPredict(newFeats)
  }

  // 重置基准
  const handleReset = () => {
    if (!baseline) return
    const resetFeats = { ...baseline.features }
    setFeatures(resetFeats)
    triggerPredict(resetFeats)
  }

  // 页面加载完成后自动预测一次
  useEffect(() => {
    if (features) triggerPredict(features)
  }, [features && Object.keys(features).length > 0])

  // 从结果中提取数值
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
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <RefreshCw size={32} style={{ margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
          <p>Loading baseline features...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '32px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(99,102,241,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Cpu size={18} color="#818cf8" />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9' }}>
              Live Prediction
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '560px' }}>
            Adjust blade operating parameters and get real-time aerodynamic performance
            predictions from the surrogate model — no CFD required.
          </p>
        </motion.div>

        {error && (
          <div style={{
            marginBottom: '20px', padding: '12px 16px', borderRadius: '10px',
            background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '13px', color: '#f87171',
          }}>
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px' }}>

          {/* ── 左侧：参数控制面板 ─────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="glass-card" style={{ padding: '24px' }}>

              {/* 面板标题 */}
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: '24px',
              }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>
                  Operating Parameters
                </h3>
                <button
                  onClick={handleReset}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '5px 10px', borderRadius: '7px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#64748b', fontSize: '11px', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
                  onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                >
                  <RefreshCw size={11} /> Reset
                </button>
              </div>

              {/* Omega 滑块 */}
              <ParamSlider
                label="Rotational Speed Ω"
                value={features.Omega}
                min={stats.Omega.min}
                max={stats.Omega.max}
                step={1}
                unit="rpm"
                color="#818cf8"
                onChange={v => handleChange('Omega', v)}
              />

              {/* P 滑块 */}
              <ParamSlider
                label="Inlet Pressure P"
                value={features.P}
                min={stats.P.min}
                max={stats.P.max}
                step={100}
                unit="Pa"
                color="#22d3ee"
                onChange={v => handleChange('P', v)}
              />

              {/* 分隔线 */}
              <div style={{
                height: '1px',
                background: 'rgba(255,255,255,0.05)',
                margin: '20px 0',
              }} />

              {/* 关键几何特征 */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  marginBottom: '16px',
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                    Key Geometric Features
                  </span>
                  <div style={{ position: 'relative', display: 'inline-flex' }}
                    title="These represent statistical properties of the blade surface geometry">
                    <Info size={12} color="#475569" style={{ cursor: 'help' }} />
                  </div>
                </div>

                {[
                  { key: 'Pressure_mean',    label: 'Surface Pressure Mean',  color: '#fb923c', unit: 'Pa'  },
                  { key: 'Pressure_std',     label: 'Surface Pressure Std',   color: '#f87171', unit: 'Pa'  },
                  { key: 'Temperature_mean', label: 'Surface Temp Mean',      color: '#fbbf24', unit: 'K'   },
                  { key: 'CoordinateY_mean', label: 'Radial Position Mean',   color: '#34d399', unit: 'm'   },
                ].map(({ key, label, color, unit }) => {
                  if (!stats[key]) return null
                  return (
                    <ParamSlider
                      key={key}
                      label={label}
                      value={features[key]}
                      min={stats[key].min}
                      max={stats[key].max}
                      step={(stats[key].max - stats[key].min) / 100}
                      unit={unit}
                      color={color}
                      onChange={v => handleChange(key, v)}
                    />
                  )
                })}
              </div>

              {/* UQ 开关 */}
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>
                    Uncertainty Quantification
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                    MC Dropout · 100 samples
                  </div>
                </div>
                <button
                  onClick={() => setWithUQ(!withUQ)}
                  style={{
                    width: '40px', height: '22px', borderRadius: '11px',
                    background: withUQ ? '#4f46e5' : 'rgba(255,255,255,0.1)',
                    border: 'none', cursor: 'pointer',
                    position: 'relative', transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '3px',
                    left: withUQ ? '21px' : '3px',
                    width: '16px', height: '16px', borderRadius: '50%',
                    background: 'white', transition: 'left 0.2s',
                  }} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* ── 右侧：预测结果 ─────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >

            {/* 加载指示器 */}
            {loading && (
              <div style={{
                marginBottom: '12px', padding: '8px 14px', borderRadius: '8px',
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.15)',
                display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '12px', color: '#818cf8',
              }}>
                <RefreshCw size={12} style={{ animation: 'spin 0.8s linear infinite' }} />
                Computing prediction...
              </div>
            )}

            {/* 三个结果卡片 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '14px', marginBottom: '20px',
            }}>
              <ResultCard
                label="Pressure Ratio"
                value={getPredVal('Compression_ratio')}
                sigma={getPredSigma('Compression_ratio')}
                unit="π"
                color="primary"
                icon={Gauge}
                baseline={baseline?.true_performance?.Compression_ratio}
              />
              <ResultCard
                label="Efficiency"
                value={getPredVal('Efficiency')}
                sigma={getPredSigma('Efficiency')}
                unit="η"
                color="cyan"
                icon={TrendingUp}
                baseline={baseline?.true_performance?.Efficiency}
              />
              <ResultCard
                label="Mass Flow"
                value={getPredVal('Massflow')}
                sigma={getPredSigma('Massflow')}
                unit="kg/s"
                color="green"
                icon={Wind}
                baseline={baseline?.true_performance?.Massflow}
              />
            </div>

            {/* 当前参数摘要 */}
            <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
              <div style={{
                fontSize: '11px', fontWeight: 600, color: '#475569',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                marginBottom: '12px',
              }}>
                Current Parameters
              </div>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Ω', value: features.Omega?.toFixed(0), unit: 'rpm', color: '#818cf8' },
                  { label: 'P', value: features.P?.toFixed(0),     unit: 'Pa',  color: '#22d3ee' },
                  { label: 'P_mean', value: features.Pressure_mean?.toFixed(0), unit: 'Pa', color: '#fb923c' },
                  { label: 'T_mean', value: features.Temperature_mean?.toFixed(1), unit: 'K', color: '#fbbf24' },
                ].map(({ label, value, unit, color }) => (
                  <div key={label}>
                    <span style={{ fontSize: '11px', color: '#475569' }}>{label} </span>
                    <span className="num" style={{ fontSize: '13px', fontWeight: 700, color }}>
                      {value}
                    </span>
                    <span style={{ fontSize: '10px', color: '#334155', marginLeft: '2px' }}>{unit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 历史记录 */}
            {history.length > 0 && (
              <div className="glass-card" style={{ padding: '16px 20px' }}>
                <div style={{
                  fontSize: '11px', fontWeight: 600, color: '#475569',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  marginBottom: '12px',
                }}>
                  Prediction History
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {history.map((h, i) => {
                    const eff = h.result?.predictions?.Efficiency?.mean
                      ?? h.result?.predictions?.Efficiency?.value
                    const comp = h.result?.predictions?.Compression_ratio?.mean
                      ?? h.result?.predictions?.Compression_ratio?.value
                    return (
                      <div
                        key={i}
                        style={{
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px', borderRadius: '7px',
                          background: i === 0 ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                          border: i === 0 ? '1px solid rgba(99,102,241,0.15)' : '1px solid transparent',
                          fontSize: '12px',
                        }}
                      >
                        <span style={{ color: '#475569', fontFamily: 'monospace' }}>
                          {h.timestamp}
                        </span>
                        <span style={{ color: '#64748b' }}>
                          Ω={h.omega?.toFixed(0)} · P={h.p?.toFixed(0)}
                        </span>
                        <span className="num" style={{ color: '#22d3ee' }}>
                          η={eff?.toFixed(4)}
                        </span>
                        <span className="num" style={{ color: '#818cf8' }}>
                          π={comp?.toFixed(4)}
                        </span>
                        {i === 0 && (
                          <span style={{
                            fontSize: '10px', padding: '1px 6px', borderRadius: '4px',
                            background: 'rgba(99,102,241,0.15)', color: '#818cf8',
                          }}>
                            latest
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}