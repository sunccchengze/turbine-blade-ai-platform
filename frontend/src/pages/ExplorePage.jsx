import { useCallback, useEffect, useRef, useState } from 'react'
import Plot from 'react-plotly.js'
import { AlertCircle, Info, MousePointerClick, RefreshCw, Zap } from 'lucide-react'
import { getBaselineFeatures, sweepDesignSpace } from '../utils/api'

const OUTPUTS = [
  { key: 'Efficiency', symbol: 'η', label: '效率', color: '#2d7569' },
  { key: 'Compression_ratio', symbol: 'π', label: '总压比', color: '#a87817' },
  { key: 'Massflow', symbol: 'ṁ', label: '质量流量', color: '#ad5038', unit: 'kg/s' },
]
const UNITS = { Omega: 'rad/s', P: 'Pa', Pressure_mean: 'Pa', Density_mean: 'kg/m³', Temperature_mean: 'K', CoordinateX_mean: 'm', CoordinateY_mean: 'm', CoordinateZ_mean: 'm' }
const GROUPS = [
  ['运行工况 / Operating', n => ['Omega', 'P'].includes(n)],
  ['压力场 / Pressure', n => n.startsWith('Pressure_')],
  ['温度场 / Temperature', n => n.startsWith('Temperature_')],
  ['密度场 / Density', n => n.startsWith('Density_')],
  ['几何坐标 / Geometry', n => n.startsWith('Coordinate')],
  ['表面法向 / Normals', n => n.startsWith('Normals')],
]
const linspace = (a, b, n) => Array.from({ length: n }, (_, i) => a + (b - a) * i / (n - 1))

function SelectField({ label, value, onChange, names }) {
  return <label style={{ display: 'grid', gap: 7 }}><span style={{ color: 'var(--faint)', font: '10px var(--mono)', letterSpacing: '.08em' }}>{label}</span><select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '11px 12px', color: 'var(--paper)', background: 'var(--ink)', border: '1px solid var(--line-strong)', borderRadius: 6, outline: 'none' }}>{GROUPS.map(([group, match]) => { const items = names.filter(match); return items.length ? <optgroup key={group} label={group}>{items.map(name => <option key={name} value={name}>{name}{UNITS[name] ? ` (${UNITS[name]})` : ''}</option>)}</optgroup> : null })}</select></label>
}
function RangeField({ label, value, stat, onChange }) {
  return <label style={{ display: 'grid', gap: 7 }}><span style={{ color: 'var(--faint)', font: '10px var(--mono)', letterSpacing: '.08em' }}>{label}</span><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>{value.map((v, i) => <input key={i} type="number" value={v} onChange={e => { const next = [...value]; next[i] = Number(e.target.value); onChange(next) }} style={{ minWidth: 0, padding: '10px 11px', color: 'var(--paper)', background: 'var(--ink)', border: '1px solid var(--line-strong)', borderRadius: 6, outline: 'none', font: '12px var(--mono)' }} />)}</div><span style={{ color: 'var(--faint)', font: '10px var(--mono)' }}>TRAINING RANGE [{stat.min.toPrecision(5)} → {stat.max.toPrecision(5)}]</span></label>
}
function SectionTitle({ children }) { return <div style={{ color: 'var(--faint)', font: '10px var(--mono)', letterSpacing: '.13em', textTransform: 'uppercase' }}>{children}</div> }

export default function ExplorePage() {
  const [baseline, setBaseline] = useState(null)
  const [error, setError] = useState(null)
  const [paramX, setParamX] = useState('Omega')
  const [paramY, setParamY] = useState('Pressure_mean')
  const [output, setOutput] = useState('Efficiency')
  const [gridN, setGridN] = useState(20)
  const [xRange, setXRange] = useState([0, 1])
  const [yRange, setYRange] = useState([0, 1])
  const [result, setResult] = useState(null)
  const [sweeping, setSweeping] = useState(false)
  const [sweepError, setSweepError] = useState(null)
  const [clicked, setClicked] = useState(null)
  const initialized = useRef(false)
  const debounce = useRef(null)

  useEffect(() => { getBaselineFeatures().then(data => { setBaseline(data); setXRange([data.stats.Omega.min, data.stats.Omega.max]); setYRange([data.stats.Pressure_mean.min, data.stats.Pressure_mean.max]); initialized.current = true }).catch(() => setError('本地数据加载失败，请刷新页面。 Local static data could not be loaded.')) }, [])

  const runSweep = useCallback((overrides = {}) => {
    if (!baseline) return
    const px = overrides.paramX ?? paramX; const py = overrides.paramY ?? paramY; const out = overrides.output ?? output; const n = overrides.gridN ?? gridN; const xr = overrides.xRange ?? xRange; const yr = overrides.yRange ?? yRange
    if (px === py) { setSweepError('X 与 Y 不能选择同一个特征。'); return }
    const ranges = [[px, xr], [py, yr]]
    const invalid = ranges.find(([name, range]) => range[0] >= range[1] || range[0] < baseline.stats[name].min || range[1] > baseline.stats[name].max)
    if (invalid) { setSweepError(`“${invalid[0]}”超出训练数据范围。代理模型拒绝外推。`); return }
    setSweepError(null); setSweeping(true)
    sweepDesignSpace({ base_features: baseline.feature_names.map(k => baseline.features[k]), param_x: px, param_y: py, x_values: linspace(xr[0], xr[1], n), y_values: linspace(yr[0], yr[1], n), output: out }).then(data => { setResult(data); setClicked(null) }).catch(e => setSweepError(e.message || '扫描失败，请重试。')).finally(() => setSweeping(false))
  }, [baseline, paramX, paramY, output, gridN, xRange, yRange])

  useEffect(() => { if (baseline && !result && !sweeping) runSweep() }, [baseline]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!initialized.current) return; clearTimeout(debounce.current); debounce.current = setTimeout(() => runSweep(), 300); return () => clearTimeout(debounce.current) }, [paramX, paramY, output, gridN]) // eslint-disable-line react-hooks/exhaustive-deps

  const switchAxis = (axis, name) => {
    const stat = baseline.stats[name]
    if (axis === 'x') {
      setParamX(name)
      setXRange([stat.min, stat.max])
    } else {
      setParamY(name)
      setYRange([stat.min, stat.max])
    }
  }
  const meta = OUTPUTS.find(item => item.key === output)

  if (error) return <div style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 28px', color: 'var(--rust)', textAlign: 'center' }}><AlertCircle size={25} /><p style={{ marginTop: 12 }}>{error}</p></div>
  if (!baseline) return <div style={{ maxWidth: 1100, margin: '0 auto', padding: '110px 28px', color: 'var(--muted)', textAlign: 'center' }}><RefreshCw size={22} className="spin" /><p style={{ marginTop: 12 }}>加载本地设计数据…</p></div>

  const plotData = result ? [{ x: result.x_values, y: result.y_values, z: result.z, type: 'heatmap', colorscale: [[0, '#17201d'], [.5, '#4e8072'], [1, '#e7c85b']], colorbar: { title: { text: `${meta.symbol} ${meta.label}`, font: { color: 'var(--muted)', size: 11 } }, tickfont: { color: 'var(--muted)', size: 10 }, outlinewidth: 0, thickness: 12 }, hovertemplate: `${paramX}: %{x:.4g}<br>${paramY}: %{y:.4g}<br>${meta.symbol}: %{z:.5f}<extra></extra>` }, { x: [baseline.features[paramX]], y: [baseline.features[paramY]], type: 'scatter', mode: 'markers', name: '基准 / Baseline', marker: { symbol: 'star', size: 15, color: '#e7c85b', line: { color: '#111615', width: 1.5 } }, hovertemplate: '基准设计 / Baseline<extra></extra>' }] : []
  const plotLayout = { autosize: true, height: 500, margin: { l: 70, r: 20, t: 20, b: 66 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: { family: 'DM Mono, monospace', color: '#8f9d93', size: 10 }, xaxis: { title: { text: `${paramX}${UNITS[paramX] ? ` (${UNITS[paramX]})` : ''}`, font: { size: 11 } }, gridcolor: 'rgba(143,157,147,.16)', zeroline: false }, yaxis: { title: { text: `${paramY}${UNITS[paramY] ? ` (${UNITS[paramY]})` : ''}`, font: { size: 11 } }, gridcolor: 'rgba(143,157,147,.16)', zeroline: false }, showlegend: true, legend: { x: 0, y: 1.08, orientation: 'h', font: { size: 10, color: '#8f9d93' } } }

  return <main style={{ maxWidth: 1240, margin: '0 auto', padding: '58px 28px 90px' }}>
    <header style={{ display: 'flex', justifyContent: 'space-between', gap: 28, alignItems: 'end', flexWrap: 'wrap', marginBottom: 36 }}><div><SectionTitle>02 / 设计空间探索器 · Design Space Explorer</SectionTitle><h1 style={{ color: 'var(--paper)', font: '600 clamp(36px,5vw,62px)/1.08 var(--display)', letterSpacing: '-.04em', marginTop: 14 }}>在设计空间里，<br /><span style={{ color: 'var(--teal-bright)' }}>看清性能如何变化。</span><br /><span style={{ color: 'var(--faint)', font: '500 clamp(16px,2vw,24px)/1.25 var(--body)', letterSpacing: '-.02em' }}>See how performance moves through the design space.</span></h1></div><p style={{ maxWidth: 350, color: 'var(--muted)', fontSize: 13, lineHeight: 1.8 }}>固定其余特征，只扫两个维度。响应面是代理模型的预测，不是真实 CFD 场。</p></header>
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 310px) minmax(0,1fr)', gap: 14, alignItems: 'start' }}>
      <aside className="surface-card" style={{ padding: 20, position: 'sticky', top: 92 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}><SectionTitle>控制面 · Control surface</SectionTitle><span className="badge" style={{ color: 'var(--teal-bright)' }}>LOCAL</span></div><div style={{ display: 'grid', gap: 18 }}><SelectField label="X AXIS / 扫描维度" value={paramX} onChange={name => switchAxis('x', name)} names={baseline.feature_names} /><RangeField label="X RANGE / 范围" value={xRange} stat={baseline.stats[paramX]} onChange={setXRange} /><SelectField label="Y AXIS / 扫描维度" value={paramY} onChange={name => switchAxis('y', name)} names={baseline.feature_names} /><RangeField label="Y RANGE / 范围" value={yRange} stat={baseline.stats[paramY]} onChange={setYRange} /><div><SectionTitle>OUTPUT / 输出</SectionTitle><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5, marginTop: 8 }}>{OUTPUTS.map(item => <button key={item.key} onClick={() => setOutput(item.key)} style={{ padding: '10px 4px', color: output === item.key ? 'var(--ink)' : 'var(--muted)', background: output === item.key ? 'var(--yellow)' : 'transparent', border: `1px solid ${output === item.key ? 'var(--yellow)' : 'var(--line)'}`, borderRadius: 5, cursor: 'pointer', font: '11px var(--mono)' }}>{item.symbol}<br /><span style={{ fontSize: 9 }}>{item.label}</span></button>)}</div></div><label style={{ display: 'grid', gap: 7 }}><span style={{ color: 'var(--faint)', font: '10px var(--mono)' }}>GRID / 分辨率</span><input type="range" min="10" max="30" step="5" value={gridN} onChange={e => setGridN(Number(e.target.value))} style={{ accentColor: 'var(--teal)' }} /><span className="num" style={{ color: 'var(--muted)', fontSize: 11 }}>{gridN} × {gridN} = {gridN * gridN} evaluations</span></label><button onClick={() => runSweep()} disabled={sweeping} style={{ padding: '12px 14px', color: 'var(--ink)', background: 'var(--yellow)', border: 0, borderRadius: 5, cursor: sweeping ? 'wait' : 'pointer', fontWeight: 800, fontSize: 12 }}>{sweeping ? '正在扫描…' : '运行本地扫描  ↗'}</button></div><div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--line)', color: 'var(--faint)', fontSize: 11, lineHeight: 1.7 }}><Info size={13} color="var(--yellow)" style={{ verticalAlign: 'middle', marginRight: 5 }} /> 越界范围会被拒绝。代理模型只在训练分布内做内插预测。</div></aside>
      <section><div className="surface-card" style={{ padding: 18, position: 'relative' }}>{sweeping && <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'grid', placeItems: 'center', background: 'rgba(11,14,13,.58)', borderRadius: 10 }}><RefreshCw size={22} color="var(--yellow)" className="spin" /></div>}{result && <Plot data={plotData} layout={plotLayout} config={{ displayModeBar: false, responsive: true }} useResizeHandler style={{ width: '100%' }} onClick={event => { const point = event.points?.[0]; if (point?.z !== undefined) setClicked({ x: point.x, y: point.y, z: point.z }) }} />}{sweepError && <div style={{ color: 'var(--rust)', borderTop: '1px solid rgba(173,80,56,.3)', paddingTop: 12, fontSize: 12 }}>{sweepError}</div>}<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}><span className="badge" style={{ color: 'var(--teal-bright)' }}><Zap size={10} /> {result?.n_evaluations || 0} LOCAL EVALUATIONS</span><span className="badge" style={{ color: 'var(--muted)' }}>MODEL / ONNX WASM</span></div></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginTop: 14 }}><div className="surface-card" style={{ padding: 20 }}><SectionTitle>响应面读数 · Surface readout</SectionTitle>{result && <div style={{ display: 'grid', gap: 13, marginTop: 18 }}>{[['MAX', result.z_max, 'var(--teal-bright)'], ['MIN', result.z_min, 'var(--rust)'], ['BASELINE', result.baseline_prediction, 'var(--yellow)']].map(([label, value, color]) => <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--line)', paddingBottom: 10 }}><span style={{ color: 'var(--muted)', font: '10px var(--mono)' }}>{label}</span><span className="num" style={{ color, fontSize: 17 }}>{Number(value).toFixed(5)}</span></div>)}</div>}</div><div className="surface-card" style={{ padding: 20 }}><SectionTitle><MousePointerClick size={11} style={{ verticalAlign: 'middle' }} /> 点位检查 · Point inspector</SectionTitle>{clicked ? <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>{[[paramX, clicked.x], [paramY, clicked.y], [`${meta.symbol} ${meta.label}`, clicked.z]].map(([label, value], i) => <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: 10 }}><span style={{ color: 'var(--muted)', fontSize: 12 }}>{label}</span><span className="num" style={{ color: i === 2 ? meta.color : 'var(--paper)', fontSize: 13 }}>{Number(value).toPrecision(6)}</span></div>)}</div> : <p style={{ color: 'var(--faint)', fontSize: 12, lineHeight: 1.7, marginTop: 18 }}>点击响应面任意位置，读取局部预测。<br />Click the surface to inspect a local prediction.</p>}</div></div></section>
    </div>
  </main>
}
