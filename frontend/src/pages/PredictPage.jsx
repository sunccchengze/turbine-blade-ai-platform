import { useEffect, useState, useCallback, useRef } from 'react'
import BladeViewer3D from '../components/BladeViewer3D'
import { motion } from 'framer-motion'
import {
  RefreshCw, AlertCircle,
  TrendingUp, Gauge, Wind,
  Info
} from 'lucide-react'
import { predictPerformance, getBaselineFeatures } from '../utils/api'

// ── 结果卡片 ───────────────────────────────────────────────
function ResultCard({ label, value, sigma, unit, color, icon: Icon, baseline }) {
  const improvement = baseline
    ? (((value - baseline) / Math.abs(baseline)) * 100).toFixed(2)
    : null

  const palettes = {
    primary: { text: '#86b9aa', bg: 'rgba(134,185,170,0.08)',  border: 'rgba(134,185,170,0.2)'  },
    cyan:    { text: '#b5ded0', bg: 'rgba(181,222,208,0.08)',  border: 'rgba(181,222,208,0.2)'  },
    green:   { text: '#e7c85b', bg: 'rgba(231,200,91,0.08)',  border: 'rgba(231,200,91,0.2)'  },
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
          <span style={{ color: '#475569', fontSize: '11px' }} title="训练期 MC Dropout 相对置信度提示（非严格95%保证）">名义 95% CI (±1.96σ)</span>
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
          {parseFloat(improvement) >= 0 ? '▲' : '▼'} {Math.abs(improvement)}% 相对基准 vs baseline
        </div>
      )}
    </div>
  )
}

// ── 滑块组件 ───────────────────────────────────────────────
function ParamSlider({ label, value, min, max, step, onChange, unit, color = '#818cf8', hint }) {
  const pct = ((value - min) / (max - min)) * 100
  const [showHint, setShowHint] = useState(false)

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '8px',
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          fontSize: '12px', fontWeight: 600, color: '#94a3b8',
        }}>
          {label}
          {hint && (
            <span
              tabIndex={0}
              onMouseEnter={() => setShowHint(true)}
              onMouseLeave={() => setShowHint(false)}
              onFocus={() => setShowHint(true)}
              onBlur={() => setShowHint(false)}
              style={{
                position: 'relative', display: 'inline-flex',
                cursor: 'help', outline: 'none',
                borderRadius: '50%',
              }}
              aria-label={hint.en}
            >
              <Info size={12} color="#475569" style={{ pointerEvents: 'none' }} />
              {showHint && (
                <span style={{
                  position: 'absolute', left: '50%', bottom: 'calc(100% + 8px)',
                  transform: 'translateX(-50%)', width: '250px', zIndex: 30,
                  padding: '10px 12px', borderRadius: '10px',
                  background: 'rgba(15,23,42,0.97)',
                  border: '1px solid rgba(99,102,241,0.3)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
                  fontSize: '11px', lineHeight: 1.65, textAlign: 'left',
                  pointerEvents: 'none',
                }}>
                  <span style={{ color: '#c7d2fe' }}>{hint.cn}</span>
                  <br />
                  <span style={{ color: '#64748b' }}>{hint.en}</span>
                  {/* 小三角 */}
                  <span style={{
                    position: 'absolute', left: '50%', bottom: '-5px',
                    transform: 'translateX(-50%) rotate(45deg)',
                    width: '8px', height: '8px',
                    background: 'rgba(15,23,42,0.97)',
                    borderRight: '1px solid rgba(99,102,241,0.3)',
                    borderBottom: '1px solid rgba(99,102,241,0.3)',
                  }} />
                </span>
              )}
            </span>
          )}
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
        <span style={{ fontSize: '10px', color: '#475569' }}>{min.toLocaleString()}</span>
        <span style={{ fontSize: '10px', color: '#475569' }}>{max.toLocaleString()}</span>
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
  // 窄屏（<900px）时双栏改单列，避免 360px 固定左栏在手机上溢出
  const [isNarrow,     setIsNarrow]     = useState(() => window.innerWidth < 900)

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 900)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
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
      .catch(() => setError('基准设计特征加载失败 / Failed to load baseline features'))
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
      } catch (e) {
        setError(e.message || '预测失败 Prediction failed')
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

  // 页面加载完成后自动预测一次（用 ref 保证只触发一次，依赖数组干净）
  const didInit = useRef(false)
  useEffect(() => {
    if (features && !didInit.current) {
      didInit.current = true
      triggerPredict(features)
    }
  }, [features, triggerPredict])

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
          <p>正在加载基准设计特征… Loading…</p>
        </div>
      </div>
    )
  }

  return (
    <main style={{ background: 'var(--ink)', minHeight: '100vh', padding: '58px 28px 90px' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 28, flexWrap: 'wrap', marginBottom: 34 }}>
          <div>
            <div style={{ color: 'var(--yellow)', font: '10px var(--mono)', letterSpacing: '.14em' }}>01 / 实时预测 · LIVE PREDICTION</div>
            <h1 style={{ color: 'var(--paper)', font: '600 clamp(38px,5vw,64px)/1.08 var(--display)', letterSpacing: '-.055em', marginTop: 14 }}>让模型回答<br /><span style={{ color: 'var(--teal-bright)' }}>一个运行点的问题</span></h1>
          </div>
          <p style={{ maxWidth: 380, color: 'var(--muted)', fontSize: 13, lineHeight: 1.85 }}>调整运行与统计特征，浏览器内的 ONNX 代理模型会立即返回预测。结果用于筛选，不替代最终 RANS。</p>
        </motion.header>

        {error && <div style={{ marginBottom: 16, padding: '12px 16px', border: '1px solid rgba(173,80,56,.35)', color: 'var(--rust)', borderRadius: 7, fontSize: 12 }}><AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: 7 }} />{error}</div>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 18, borderBottom: '1px solid var(--line)', marginBottom: 18 }}>
          <span className="badge" style={{ color: 'var(--teal-bright)' }}>LOCAL / ONNX WASM</span>
          <span className="badge" style={{ color: 'var(--muted)' }}>74 维输入</span>
          <span className="badge" style={{ color: 'var(--yellow)' }}>名义区间 · 非严格保证</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '320px minmax(0,1fr)', gap: 14, alignItems: 'start' }}>
          <motion.aside initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} className="surface-card" style={{ padding: 20, position: isNarrow ? 'relative' : 'sticky', top: 92 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}><div style={{ color: 'var(--faint)', font: '10px var(--mono)', letterSpacing: '.13em' }}>输入控制面 · INPUTS</div><button onClick={handleReset} style={{ border: '1px solid var(--line)', background: 'transparent', color: 'var(--muted)', padding: '6px 9px', borderRadius: 5, cursor: 'pointer', fontSize: 11 }}><RefreshCw size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />重置</button></div>
            <ParamSlider label="转速 Ω · Rotational Speed" value={features.Omega} min={stats.Omega.min} max={stats.Omega.max} step={1} unit="rad/s" color="#86b9aa" onChange={v => handleChange('Omega', v)} hint={{ cn: '转子转速，决定压气机运行点与叶片相对速度场。', en: 'Rotor speed sets the operating point.' }} />
            <ParamSlider label="进口总压 P · Inlet Pressure" value={features.P} min={stats.P.min} max={stats.P.max} step={100} unit="Pa" color="#b5ded0" onChange={v => handleChange('P', v)} hint={{ cn: '进口总压与转速共同决定级压比与流量。', en: 'Inlet total pressure sets the stage condition.' }} />
            <div style={{ borderTop: '1px solid var(--line)', margin: '22px 0 18px', paddingTop: 18 }}><div style={{ color: 'var(--faint)', font: '10px var(--mono)', letterSpacing: '.1em', marginBottom: 17 }}>关键统计特征 · FEATURE CONTROLS</div>
              {[['Pressure_mean','表面压力均值','Pa','#c5684a'],['Pressure_std','表面压力标准差','Pa','#ad5038'],['Temperature_mean','表面温度均值','K','#e7c85b'],['CoordinateY_mean','径向位置均值','m','#86b9aa']].map(([key,label,unit,color]) => stats[key] ? <ParamSlider key={key} label={label} value={features[key]} min={stats[key].min} max={stats[key].max} step={(stats[key].max-stats[key].min)/100} unit={unit} color={color} onChange={v => handleChange(key,v)} hint={{ cn: `用于描述${label}的输入统计量。`, en: `Input statistic: ${label}.` }} /> : null)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--line)' }}><div><div style={{ color: 'var(--paper)', fontSize: 12 }}>不确定性量化 UQ</div><div style={{ color: 'var(--faint)', font: '10px var(--mono)', marginTop: 3 }}>训练期 σ 指示器</div></div><button onClick={() => setWithUQ(!withUQ)} role="switch" aria-checked={withUQ} style={{ width: 40, height: 22, borderRadius: 99, border: 0, background: withUQ ? 'var(--teal)' : 'var(--faint)', cursor: 'pointer', padding: 3, textAlign: withUQ ? 'right' : 'left' }}><span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: '50%', background: 'var(--paper)' }} /></button></div>
          </motion.aside>

          <motion.section initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .08 }}>
            {loading && <div style={{ padding: '10px 14px', marginBottom: 12, border: '1px solid rgba(134,185,170,.25)', color: 'var(--teal-bright)', borderRadius: 6, font: '11px var(--mono)' }}><RefreshCw size={12} className="spin" style={{ verticalAlign: 'middle', marginRight: 7 }} />代理模型推理中</div>}
            <div style={{ marginBottom: 14 }}><BladeViewer3D params={features} efficiency={getPredVal('Efficiency')} pressureRatio={getPredVal('Compression_ratio')} massflow={getPredVal('Massflow')} height={300} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
              <ResultCard label="总压比 π" value={getPredVal('Compression_ratio')} sigma={getPredSigma('Compression_ratio')} unit="π" color="primary" icon={Gauge} baseline={baseline?.true_performance?.Compression_ratio} />
              <ResultCard label="等熵效率 η" value={getPredVal('Efficiency')} sigma={getPredSigma('Efficiency')} unit="η" color="cyan" icon={TrendingUp} baseline={baseline?.true_performance?.Efficiency} />
              <ResultCard label="质量流量 ṁ" value={getPredVal('Massflow')} sigma={getPredSigma('Massflow')} unit="kg/s" color="green" icon={Wind} baseline={baseline?.true_performance?.Massflow} />
            </div>
            <div className="surface-card" style={{ padding: 19 }}><div style={{ color: 'var(--faint)', font: '10px var(--mono)', letterSpacing: '.12em', marginBottom: 15 }}>当前输入 · CURRENT INPUT STATE</div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>{[['Ω',features.Omega?.toFixed(0),'rad/s'],['P',features.P?.toFixed(0),'Pa'],['P mean',features.Pressure_mean?.toFixed(0),'Pa'],['T mean',features.Temperature_mean?.toFixed(1),'K']].map(([label,value,unit]) => <div key={label} style={{ padding: 11, background: 'var(--ink)', border: '1px solid var(--line)', borderRadius: 6 }}><div style={{ color: 'var(--faint)', font: '10px var(--mono)' }}>{label}</div><div className="num" style={{ color: 'var(--teal-bright)', fontSize: 14, marginTop: 5 }}>{value}</div><div style={{ color: 'var(--faint)', font: '9px var(--mono)' }}>{unit}</div></div>)}</div></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}><div className="surface-card" style={{ padding: 19 }}><div style={{ color: 'var(--faint)', font: '10px var(--mono)', letterSpacing: '.12em' }}>如何阅读结果</div><p style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.8, marginTop: 14 }}>数值来自代理模型的快速预测。UQ 区间用于提示模型信心，不是严格的统计保证。若要下物理结论，需要真实几何和收敛 RANS。</p></div><div className="surface-card" style={{ padding: 19 }}><div style={{ color: 'var(--faint)', font: '10px var(--mono)', letterSpacing: '.12em' }}>当前证据 · EVIDENCE</div><div style={{ display: 'grid', gap: 9, marginTop: 14, color: 'var(--muted)', fontSize: 12 }}><div><span style={{ color: 'var(--teal-bright)' }}>●</span> 生产 ONNX 本地推理</div><div><span style={{ color: 'var(--teal-bright)' }}>●</span> 留出集 R² 已复现</div><div><span style={{ color: 'var(--yellow)' }}>●</span> RANS 最终验证待完成</div></div></div></div>
          </motion.section>
        </div>
      </div>
    </main>
  )
}
