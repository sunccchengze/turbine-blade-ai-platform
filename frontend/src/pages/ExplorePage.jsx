import { useEffect, useRef, useState, useCallback } from 'react'
import Plot from 'react-plotly.js'
import { motion } from 'framer-motion'
import {
  Compass, RefreshCw, AlertCircle,
  Info, MousePointerClick, Zap, Crosshair
} from 'lucide-react'
import { getBaselineFeatures, sweepDesignSpace } from '../utils/api'

// ── 输出指标配置：符号（英文）+ 中文注解 ────────────────────
const OUTPUTS = [
  { key: 'Efficiency',        symbol: 'η', label: '等熵效率', unit: '',     color: '#34d399' },
  { key: 'Compression_ratio', symbol: 'π', label: '总压比',   unit: '',     color: '#818cf8' },
  { key: 'Massflow',          symbol: 'ṁ', label: '质量流量', unit: 'kg/s', color: '#22d3ee' },
]

// 单位提示（统计量无物理单位的留空）
const UNITS = {
  Omega: 'rpm', P: 'Pa', Pressure_mean: 'Pa', Density_mean: 'kg/m³',
  Temperature_mean: 'K', CoordinateX_mean: 'mm', CoordinateY_mean: 'mm',
  CoordinateZ_mean: 'mm',
}

// 特征分组（中文组名 + 前缀匹配）
const FEATURE_GROUPS = [
  { group: '运行工况 Operating',      match: n => ['Omega', 'P'].includes(n) },
  { group: '压力场 Pressure Field',    match: n => n.startsWith('Pressure_') },
  { group: '温度场 Temperature Field', match: n => n.startsWith('Temperature_') },
  { group: '密度场 Density Field',     match: n => n.startsWith('Density_') },
  { group: '几何坐标 Geometry',        match: n => n.startsWith('Coordinate') },
  { group: '表面法向 Surface Normals', match: n => n.startsWith('Normals') },
]

const linspace = (a, b, n) =>
  Array.from({ length: n }, (_, i) => a + (b - a) * (i / (n - 1)))

// ── 小组件：选择器标签 ─────────────────────────────────────
function FieldLabel({ children }) {
  return (
    <div style={{
      fontSize: '11px', fontWeight: 600, color: '#64748b',
      textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px',
    }}>
      {children}
    </div>
  )
}

// ── 小组件：参数下拉（按物理分组）──────────────────────────
function ParamSelect({ value, onChange, names }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', padding: '9px 12px', borderRadius: '8px',
        background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)',
        color: '#e2e8f0', fontSize: '13px', outline: 'none', cursor: 'pointer',
      }}
    >
      {FEATURE_GROUPS.map(({ group, match }) => {
        const items = names.filter(match)
        if (!items.length) return null
        return (
          <optgroup key={group} label={group}>
            {items.map(n => (
              <option key={n} value={n}>
                {n}{UNITS[n] ? ` (${UNITS[n]})` : ''}
              </option>
            ))}
          </optgroup>
        )
      })}
    </select>
  )
}

// ── 小组件：范围输入 ───────────────────────────────────────
function RangeInputs({ lo, hi, statLo, statHi, onChange }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {[[lo, 0], [hi, 1]].map(([val, idx]) => (
          <input
            key={idx}
            type="number"
            value={val}
            onChange={e => {
              const next = [lo, hi]
              next[idx] = parseFloat(e.target.value)
              onChange(next)
            }}
            style={{
              width: '100%', padding: '8px 10px', borderRadius: '8px',
              background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.2)',
              color: '#e2e8f0', fontSize: '13px', outline: 'none',
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: '11px', color: '#475569', marginTop: '5px' }}>
        训练数据范围 Training range: [{statLo?.toPrecision(5)} ~ {statHi?.toPrecision(5)}]
      </div>
    </div>
  )
}

// ── 主页面 ─────────────────────────────────────────────────
export default function ExplorePage() {
  const [baseline,   setBaseline]   = useState(null)
  const [loadError,  setLoadError]  = useState(null)

  const [paramX,  setParamX]  = useState('Omega')
  const [paramY,  setParamY]  = useState('Pressure_mean')
  const [outputK, setOutputK] = useState('Efficiency')
  const [gridN,   setGridN]   = useState(20)
  const [xRange,  setXRange]  = useState([0, 1])
  const [yRange,  setYRange]  = useState([0, 1])

  const [result,     setResult]     = useState(null)
  const [sweeping,   setSweeping]   = useState(false)
  const [sweepError, setSweepError] = useState(null)
  const [clicked,    setClicked]    = useState(null)

  const initialized = useRef(false)
  const debounce    = useRef(null)

  // ── 加载基准特征（含全量特征统计范围）────────────────────
  useEffect(() => {
    getBaselineFeatures()
      .then(data => {
        setBaseline(data)
        const sx = data.stats.Omega
        const sy = data.stats.Pressure_mean
        setXRange([sx.min, sx.max])
        setYRange([sy.min, sy.max])
        initialized.current = true
      })
      .catch(() => setLoadError('无法连接推理服务器。服务可能正在冷启动，请稍候刷新。 Cannot reach the inference server — it may be cold-starting, please refresh shortly.'))
  }, [])

  // ── 核心：发起扫描 ──────────────────────────────────────
  const runSweep = useCallback((overrides = {}) => {
    if (!initialized.current || !baseline) return

    const px  = overrides.paramX  ?? paramX
    const py  = overrides.paramY  ?? paramY
    const out = overrides.outputK ?? outputK
    const n   = overrides.gridN   ?? gridN
    const xr  = overrides.xRange  ?? xRange
    const yr  = overrides.yRange  ?? yRange

    // 客户端前置校验（与服务端的物理越界保护一致）
    if (px === py) {
      setSweepError('X 轴和 Y 轴不能是同一个参数，请换一个维度。X and Y must be different parameters.')
      return
    }
    const stats = baseline.stats
    const check = (name, [lo, hi]) => ({
      ok: lo < hi && lo >= stats[name].min && hi <= stats[name].max,
      lo: stats[name].min, hi: stats[name].max,
    })
    const cx = check(px, xr)
    const cy = check(py, yr)
    if (!cx.ok || !cy.ok) {
      const bad = !cx.ok ? [px, cx] : [py, cy]
      setSweepError(
        `'${bad[0]}' 的扫描范围超出了训练数据范围 [${bad[1].lo.toPrecision(5)} ~ ${bad[1].hi.toPrecision(5)}]。` +
        '代理模型（Surrogate Model）只在做内插预测时可信，这是刻意保留的物理防线。' +
        ' Interpolation only — extrapolation is deliberately blocked.'
      )
      return
    }

    setSweepError(null)
    setSweeping(true)

    // base_features 必须严格按 feature_names 的顺序排列
    const baseVec = baseline.feature_names.map(k => baseline.features[k])

    sweepDesignSpace({
      base_features: baseVec,
      param_x:  px,
      param_y:  py,
      x_values: linspace(xr[0], xr[1], n),
      y_values: linspace(yr[0], yr[1], n),
      output:   out,
    })
      .then(res => { setResult(res); setClicked(null) })
      .catch(err => setSweepError(
        err.response?.data?.detail || err.userMessage || '扫描请求失败，请重试。 Sweep request failed, please retry.'
      ))
      .finally(() => setSweeping(false))
  }, [baseline, paramX, paramY, outputK, gridN, xRange, yRange])

  // 基准加载完成后跑第一次
  useEffect(() => {
    if (initialized.current && baseline && !result && !sweeping) runSweep()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseline])

  // 参数/输出/分辨率变化 → 防抖自动重扫（范围输入需点按钮）
  useEffect(() => {
    if (!initialized.current || !baseline) return
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => runSweep(), 350)
    return () => clearTimeout(debounce.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramX, paramY, outputK, gridN])

  // 轴切换时把范围重置为该轴的训练数据满量程
  const switchAxis = (axis, name) => {
    if (!baseline) return
    const s = baseline.stats[name]
    if (axis === 'x') { setParamX(name); setXRange([s.min, s.max]) }
    else              { setParamY(name); setYRange([s.min, s.max]) }
  }

  // ── 派生数据 ────────────────────────────────────────────
  const outMeta = OUTPUTS.find(o => o.key === outputK)
  const baseXY  = baseline ? {
    x: baseline.features[paramX],
    y: baseline.features[paramY],
  } : null

  // 与基准点预测值的百分比差
  const pct = v =>
    result?.baseline_prediction
      ? (((v - result.baseline_prediction) / Math.abs(result.baseline_prediction)) * 100)
      : null

  // CFD 等价时间估算（按单场 CFD ≈ 30 min 估算——图中注明假设）
  const cfdDays = result ? ((result.n_evaluations * 0.5) / 24).toFixed(1) : null

  // ── 渲染态：加载/错误 ───────────────────────────────────
  if (loadError) {
    return (
      <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <AlertCircle size={28} color="#f87171" style={{ margin: '0 auto 12px' }} />
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>{loadError}</p>
      </div>
    )
  }
  if (!baseline) {
    return (
      <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '100px 24px', textAlign: 'center' }}>
        <RefreshCw size={22} color="#818cf8" className="spin" style={{ margin: '0 auto 12px' }} />
        <p style={{ color: '#64748b', fontSize: '13px' }}>正在加载基准设计特征… Loading…</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '40px 24px 80px' }}>

      {/* ── 页头 ─────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div style={{ marginBottom: '8px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px', borderRadius: '9999px',
            background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)',
            fontSize: '11px', fontWeight: 600, color: '#22d3ee', letterSpacing: '0.04em',
          }}>
            <Compass size={11} /> DESIGN SPACE EXPLORER
          </span>
        </div>
        <h1 style={{
          fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700,
          color: '#f1f5f9', marginBottom: '10px', lineHeight: 1.2,
        }}>
          设计空间探索器
        </h1>
        <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '720px', lineHeight: 1.7 }}>
          将 74 维特征中的两维做成「响应面（Response Surface）」：横纵各扫描
          {' '}{gridN} 次，整张网格由代理模型一次批量推理完成。
          颜色越亮的区域，{outMeta.label}（{outMeta.symbol}）越高——
          这就是多学科设计优化（MDO）里工程师建立设计直觉的方式。
          <br />
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            A two-parameter response surface over the 74-dimensional design space — the surrogate
            evaluates the entire {gridN}×{gridN} grid in one batched inference. Brighter regions
            mean higher {outMeta.label} ({outMeta.symbol}), which is how MDO engineers build
            design intuition.
          </span>
        </p>
      </motion.div>

      {/* ── 主布局：控制面板 + 热力图 ─────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px', marginTop: '28px', alignItems: 'start',
      }}>

        {/* 控制面板 */}
        <div className="glass-card" style={{ padding: '22px' }}>
          <FieldLabel>X 轴参数 X-Axis</FieldLabel>
          <ParamSelect value={paramX} onChange={n => switchAxis('x', n)}
                       names={baseline.feature_names} />
          <div style={{ height: '12px' }} />
          <FieldLabel>X 轴扫描范围 X Sweep Range</FieldLabel>
          <RangeInputs lo={xRange[0]} hi={xRange[1]}
                       statLo={baseline.stats[paramX].min} statHi={baseline.stats[paramX].max}
                       onChange={r => setXRange(r)} />

          <div style={{ height: '18px', borderBottom: '1px solid rgba(148,163,184,0.08)' }} />
          <div style={{ height: '18px' }} />

          <FieldLabel>Y 轴参数 Y-Axis</FieldLabel>
          <ParamSelect value={paramY} onChange={n => switchAxis('y', n)}
                       names={baseline.feature_names} />
          <div style={{ height: '12px' }} />
          <FieldLabel>Y 轴扫描范围 Y Sweep Range</FieldLabel>
          <RangeInputs lo={yRange[0]} hi={yRange[1]}
                       statLo={baseline.stats[paramY].min} statHi={baseline.stats[paramY].max}
                       onChange={r => setYRange(r)} />

          <div style={{ height: '18px', borderBottom: '1px solid rgba(148,163,184,0.08)' }} />
          <div style={{ height: '18px' }} />

          <FieldLabel>输出指标 Objective</FieldLabel>
          <div style={{ display: 'flex', gap: '8px' }}>
            {OUTPUTS.map(o => (
              <button
                key={o.key}
                onClick={() => setOutputK(o.key)}
                style={{
                  flex: 1, padding: '9px 4px', borderRadius: '8px', cursor: 'pointer',
                  border: outputK === o.key ? `1px solid ${o.color}55` : '1px solid rgba(148,163,184,0.15)',
                  background: outputK === o.key ? `${o.color}14` : 'transparent',
                  color: outputK === o.key ? o.color : '#94a3b8',
                  fontSize: '12px', fontWeight: 600, transition: 'all 0.2s',
                }}
              >
                {o.symbol} {o.label}
              </button>
            ))}
          </div>

          <div style={{ height: '16px' }} />
          <FieldLabel>网格分辨率 Resolution</FieldLabel>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[10, 15, 20, 25, 30, 40].map(n => (
              <button
                key={n}
                onClick={() => setGridN(n)}
                style={{
                  padding: '7px 12px', borderRadius: '8px', cursor: 'pointer',
                  border: gridN === n ? '1px solid rgba(129,140,248,0.5)' : '1px solid rgba(148,163,184,0.15)',
                  background: gridN === n ? 'rgba(99,102,241,0.12)' : 'transparent',
                  color: gridN === n ? '#818cf8' : '#94a3b8',
                  fontSize: '12px', fontWeight: 600, fontFamily: 'monospace',
                }}
              >
                {n}²
              </button>
            ))}
          </div>

          <button
            onClick={() => runSweep()}
            disabled={sweeping}
            style={{
              width: '100%', marginTop: '20px', padding: '12px',
              borderRadius: '10px', border: 'none', cursor: sweeping ? 'wait' : 'pointer',
              background: sweeping ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: '#fff', fontSize: '13px', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            <RefreshCw size={14} className={sweeping ? 'spin' : ''} />
            {sweeping ? '正在扫描…' : '应用范围并重新扫描 Run Sweep'}
          </button>

          {sweepError && (
            <div style={{
              marginTop: '14px', padding: '12px 14px', borderRadius: '10px',
              background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
              display: 'flex', gap: '8px', alignItems: 'flex-start',
            }}>
              <AlertCircle size={14} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '12px', color: '#fca5a5', lineHeight: 1.6 }}>{sweepError}</span>
            </div>
          )}

          {/* 越界保护说明 */}
          <div style={{
            marginTop: '16px', padding: '12px 14px', borderRadius: '10px',
            background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)',
            display: 'flex', gap: '8px', alignItems: 'flex-start',
          }}>
            <Info size={13} color="#818cf8" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.7 }}>
              为什么不允许超出训练范围？代理模型只「见过」训练数据分布内的物理规律，
              外推（Extrapolation）预测可能违背物理。宁可拒绝回答，也不给你错误答案——
              这是工程可信度的底线。
              <br />
              <span style={{ color: '#475569' }}>
                Why is out-of-range sweeping blocked? The surrogate has only seen physics inside
                the training distribution — extrapolation can break it. Refusing to answer beats
                giving a wrong answer: that is the bottom line of engineering trustworthiness.
              </span>
            </span>
          </div>
        </div>

        {/* 热力图区 */}
        <div style={{ minWidth: 0 }}>
          <div className="glass-card" style={{ padding: '18px', position: 'relative' }}>
            {sweeping && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 5, borderRadius: 'inherit',
                background: 'rgba(10,15,30,0.55)', backdropFilter: 'blur(2px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <RefreshCw size={20} color="#818cf8" className="spin" />
              </div>
            )}

            {result && (
              <Plot
                data={[
                  {
                    x: result.x_values, y: result.y_values, z: result.z,
                    type: 'heatmap', colorscale: 'Viridis',
                    colorbar: {
                      title: { text: `${outMeta.symbol} ${outMeta.label}`, font: { color: '#94a3b8', size: 12 } },
                      tickfont: { color: '#64748b', size: 11 },
                      thickness: 12, outlinewidth: 0,
                    },
                    hovertemplate:
                      `${paramX}: %{x:.4g}<br>${paramY}: %{y:.4g}` +
                      `<br>${outMeta.symbol}: %{z:.5f}<extra></extra>`,
                  },
                  // 基准设计位置标记
                  baseXY && {
                    x: [baseXY.x], y: [baseXY.y],
                    type: 'scatter', mode: 'markers',
                    marker: {
                      symbol: 'star', size: 16, color: '#fbbf24',
                      line: { color: '#0f172a', width: 1.5 },
                    },
                    name: '基准设计 Baseline',
                    hovertemplate: `基准设计 Baseline<br>${paramX}: %{x:.4g}<br>${paramY}: %{y:.4g}<extra></extra>`,
                  },
                ].filter(Boolean)}
                layout={{
                  autosize: true, height: 460,
                  margin: { l: 70, r: 20, t: 10, b: 60 },
                  paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
                  font: { color: '#94a3b8' },
                  xaxis: {
                    title: { text: `${paramX}${UNITS[paramX] ? ` (${UNITS[paramX]})` : ''}`, font: { size: 12 } },
                    gridcolor: 'rgba(148,163,184,0.08)', zeroline: false,
                  },
                  yaxis: {
                    title: { text: `${paramY}${UNITS[paramY] ? ` (${UNITS[paramY]})` : ''}`, font: { size: 12 } },
                    gridcolor: 'rgba(148,163,184,0.08)', zeroline: false,
                  },
                  showlegend: true,
                  legend: { x: 0, y: 1.08, orientation: 'h', font: { size: 11, color: '#94a3b8' } },
                }}
                config={{ displayModeBar: false, responsive: true }}
                useResizeHandler={true}
                style={{ width: '100%' }}
                onClick={ev => {
                  const p = ev.points?.[0]
                  if (p && p.z !== undefined) setClicked({ x: p.x, y: p.y, z: p.z })
                }}
              />
            )}

            {/* 底部统计条 */}
            {result && (
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '6px',
              }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '5px 10px', borderRadius: '8px', fontSize: '11px',
                  background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
                  color: '#34d399', fontWeight: 600, fontFamily: 'monospace',
                }}>
                  <Zap size={11} />
                  {result.n_evaluations} 次评估 · {result.elapsed_ms} ms
                </span>
                <span style={{
                  padding: '5px 10px', borderRadius: '8px', fontSize: '11px',
                  background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.12)',
                  color: '#64748b',
                }}>
                  同样的 {result.n_evaluations} 个点用 CFD 约需 {cfdDays} 天
                  （按单场仿真 ≈ 30 min 估算）
                  <br />
                  <span style={{ fontSize: '10px', color: '#475569' }}>
                    The same grid would take ~{cfdDays} days of CFD (est. 30 min per run).
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* 下方两卡：响应面统计 + 点击读数 */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '14px', marginTop: '14px',
          }}>
            <div className="glass-card" style={{ padding: '18px' }}>
              <div style={{
                fontSize: '11px', fontWeight: 600, color: '#64748b',
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px',
              }}>
                响应面统计 Surface Stats
              </div>
              {result && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                  {[
                    { label: `最高 ${outMeta.label} Max`, v: result.z_max, d: pct(result.z_max), c: '#34d399' },
                    { label: `最低 ${outMeta.label} Min`, v: result.z_min, d: pct(result.z_min), c: '#f87171' },
                    { label: '基准设计预测 Baseline', v: result.baseline_prediction, d: null, c: '#fbbf24' },
                  ].map(({ label, v, d, c }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{label}</span>
                      <span className="num" style={{ fontSize: '15px', fontWeight: 700, color: c }}>
                        {v.toFixed(5)}{outMeta.unit && ` ${outMeta.unit}`}
                        {d !== null && (
                          <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b', marginLeft: '6px' }}>
                            {d >= 0 ? '+' : ''}{d.toFixed(2)}%
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card" style={{ padding: '18px' }}>
              <div style={{
                fontSize: '11px', fontWeight: 600, color: '#64748b',
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px',
                display: 'flex', alignItems: 'center', gap: '5px',
              }}>
                <MousePointerClick size={12} /> 点击热力图读数 Point Inspector
              </div>
              {clicked ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    [paramX, clicked.x],
                    [paramY, clicked.y],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{k}</span>
                      <span className="num" style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
                        {Number(v).toPrecision(6)}{UNITS[k] && ` ${UNITS[k]}`}
                      </span>
                    </div>
                  ))}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                    paddingTop: '8px', borderTop: '1px solid rgba(148,163,184,0.1)',
                  }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Crosshair size={11} /> {outMeta.symbol} {outMeta.label}
                    </span>
                    <span className="num" style={{ fontSize: '16px', fontWeight: 700, color: outMeta.color }}>
                      {clicked.z.toFixed(5)}
                      {pct(clicked.z) !== null && (
                        <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b', marginLeft: '6px' }}>
                          vs 基准 baseline {pct(clicked.z) >= 0 ? '+' : ''}{pct(clicked.z).toFixed(2)}%
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.7 }}>
                  点击热力图上的任意位置，查看该设计的预测性能与基准设计的差距。
                  <br />
                  Click anywhere on the heatmap to inspect that design's prediction vs. baseline.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
