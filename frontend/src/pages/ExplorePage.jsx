import { useCallback, useEffect, useRef, useState } from 'react'
import Plot from 'react-plotly.js'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  MousePointerClick,
  RefreshCw,
  Zap,
  Sliders,
  CircleDot,
  ShieldCheck
} from 'lucide-react'
import { getBaselineFeatures, sweepDesignSpace } from '../utils/api'

const OUTPUTS = [
  { key: 'Efficiency', symbol: 'η', label: '等熵效率', color: 'var(--yellow)' },
  { key: 'Compression_ratio', symbol: 'π', label: '总压比', color: 'var(--teal-bright)' },
  { key: 'Massflow', symbol: 'ṁ', label: '质量流量', color: 'var(--rust)', unit: 'kg/s' },
]

const UNITS = {
  Omega: 'rad/s',
  P: 'Pa',
  Pressure_mean: 'Pa',
  Density_mean: 'kg/m³',
  Temperature_mean: 'K',
  CoordinateX_mean: 'm',
  CoordinateY_mean: 'm',
  CoordinateZ_mean: 'm'
}

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
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ color: 'var(--faint)', font: '10px var(--mono)', letterSpacing: '0.08em' }}>{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          color: 'var(--paper)',
          background: 'var(--ink)',
          border: '1px solid var(--line-strong)',
          borderRadius: 4,
          outline: 'none',
          fontSize: '12px',
          fontFamily: 'var(--body)'
        }}
      >
        {GROUPS.map(([group, match]) => {
          const items = names.filter(match)
          return items.length ? (
            <optgroup key={group} label={group}>
              {items.map(name => (
                <option key={name} value={name}>
                  {name}{UNITS[name] ? ` (${UNITS[name]})` : ''}
                </option>
              ))}
            </optgroup>
          ) : null
        })}
      </select>
    </label>
  )
}

function RangeField({ label, value, stat, onChange }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ color: 'var(--faint)', font: '10px var(--mono)', letterSpacing: '0.08em' }}>{label}</span>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {value.map((v, i) => (
          <input
            key={i}
            type="number"
            value={v}
            onChange={e => {
              const next = [...value]
              next[i] = Number(e.target.value)
              onChange(next)
            }}
            style={{
              minWidth: 0,
              padding: '9px 10px',
              color: 'var(--paper)',
              background: 'var(--ink)',
              border: '1px solid var(--line-strong)',
              borderRadius: 4,
              outline: 'none',
              font: '12px var(--mono)'
            }}
          />
        ))}
      </div>
      <span style={{ color: 'var(--faint)', font: '9px var(--mono)' }}>
        训练数据分布区间 [{stat.min.toPrecision(5)} → {stat.max.toPrecision(5)}]
      </span>
    </label>
  )
}

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
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < 960)
  const initialized = useRef(false)
  const debounce = useRef(null)

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 960)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    getBaselineFeatures().then(data => {
      setBaseline(data)
      setXRange([data.stats.Omega.min, data.stats.Omega.max])
      setYRange([data.stats.Pressure_mean.min, data.stats.Pressure_mean.max])
      initialized.current = true
    }).catch(() => setError('本地数据加载失败，请刷新页面。 Local static data could not be loaded.'))
  }, [])

  const runSweep = useCallback((overrides = {}) => {
    if (!baseline) return
    const px = overrides.paramX ?? paramX
    const py = overrides.paramY ?? paramY
    const out = overrides.output ?? output
    const n = overrides.gridN ?? gridN
    const xr = overrides.xRange ?? xRange
    const yr = overrides.yRange ?? yRange

    if (px === py) {
      setSweepError('X 与 Y 轴不能选择同一个特征维度。')
      return
    }
    const ranges = [[px, xr], [py, yr]]
    const invalid = ranges.find(([name, range]) => range[0] >= range[1] || range[0] < baseline.stats[name].min || range[1] > baseline.stats[name].max)
    if (invalid) {
      setSweepError(`特征 “${invalid[0]}” 超出训练分布范围。代理模型拒绝外推。`)
      return
    }
    setSweepError(null)
    setSweeping(true)

    sweepDesignSpace({
      base_features: baseline.feature_names.map(k => baseline.features[k]),
      param_x: px,
      param_y: py,
      x_values: linspace(xr[0], xr[1], n),
      y_values: linspace(yr[0], yr[1], n),
      output: out
    }).then(data => {
      setResult(data)
      setClicked(null)
    }).catch(e => setSweepError(e.message || '扫描失败，请重试。')).finally(() => setSweeping(false))
  }, [baseline, paramX, paramY, output, gridN, xRange, yRange])

  useEffect(() => {
    if (baseline && !result && !sweeping) runSweep()
  }, [baseline]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!initialized.current) return
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => runSweep(), 300)
    return () => clearTimeout(debounce.current)
  }, [paramX, paramY, output, gridN]) // eslint-disable-line react-hooks/exhaustive-deps

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

  if (error) {
    return (
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '100px 28px', color: 'var(--rust)', textAlign: 'center' }}>
        <AlertCircle size={28} style={{ margin: '0 auto 12px' }} />
        <p>{error}</p>
      </div>
    )
  }

  if (!baseline) {
    return (
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '110px 28px', color: 'var(--muted)', textAlign: 'center' }}>
        <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px', color: 'var(--teal-bright)' }} />
        <p style={{ font: '13px var(--body)', color: 'var(--paper)' }}>正在初始化 74 维参数网格…</p>
      </div>
    )
  }

  const plotData = result ? [
    {
      x: result.x_values,
      y: result.y_values,
      z: result.z,
      type: 'contour',
      contours: {
        coloring: 'heatmap',
        showlines: true,
        line: {
          color: 'rgba(255, 255, 255, 0.20)',
          width: 0.75,
          smoothing: 1.3
        }
      },
      colorscale: [
        [0, '#0d1512'],
        [0.3, '#1f483d'],
        [0.7, '#4e8072'],
        [1, '#e7c85b']
      ],
      colorbar: {
        title: {
          text: `${meta.symbol} ${meta.label}`,
          font: { color: 'var(--muted)', size: 11 }
        },
        tickfont: { color: 'var(--muted)', size: 10 },
        outlinewidth: 0,
        thickness: 14
      },
      hovertemplate: `${paramX}: %{x:.4g}<br>${paramY}: %{y:.4g}<br>${meta.symbol}: %{z:.5f}<extra></extra>`
    },
    {
      x: [baseline.features[paramX]],
      y: [baseline.features[paramY]],
      type: 'scatter',
      mode: 'markers',
      name: 'Rotor 37 基准坐标',
      marker: {
        symbol: 'circle-open-dot',
        size: 14,
        color: '#ffffff',
        line: { color: '#e7c85b', width: 2 }
      },
      hovertemplate: `NASA Rotor 37 基准坐标 (Baseline)<br>${paramX}: %{x:.4g}<br>${paramY}: %{y:.4g}<extra></extra>`
    }
  ] : []

  const plotLayout = {
    autosize: true,
    height: 480,
    margin: { l: 65, r: 20, t: 20, b: 60 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'DM Mono, monospace', color: 'var(--muted)', size: 10 },
    xaxis: {
      title: `${paramX} ${UNITS[paramX] ? `(${UNITS[paramX]})` : ''}`,
      gridcolor: 'rgba(255, 255, 255, 0.05)',
      zeroline: false,
      tickfont: { color: 'var(--muted)' }
    },
    yaxis: {
      title: `${paramY} ${UNITS[paramY] ? `(${UNITS[paramY]})` : ''}`,
      gridcolor: 'rgba(255, 255, 255, 0.05)',
      zeroline: false,
      tickfont: { color: 'var(--muted)' }
    },
    showlegend: false
  }

  return (
    <main style={{ minHeight: '100vh', background: 'transparent', padding: '56px 28px 88px' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        
        {/* 01. 页面头部 (严格 28px 左对齐) */}
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
              02 / 设计空间探索 · DESIGN SPACE EXPLORATION
            </div>
            <h1 style={{
              color: 'var(--paper)',
              font: '700 clamp(32px, 4.5vw, 54px)/1.1 var(--display)',
              letterSpacing: '-0.045em',
              marginTop: 12
            }}>
              多维参数流场扫描<br />
              <span style={{ color: 'var(--teal-bright)' }}>2D Parametric Response Surface</span>
            </h1>
          </div>
          <p style={{ maxWidth: 420, color: 'var(--muted)', fontSize: 13, lineHeight: 1.8 }}>
            在 74 维气动特征空间中任选两维建立正交切片，利用浏览器内存代理模型实时计算网格响应面，快速洞察极值与性能悬崖。
          </p>
        </motion.header>

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
            WASM IN-MEMORY SWEEP
          </span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span>1,000 样本分布流道</span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span>防外推截断保护激活</span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span style={{ color: 'var(--yellow)' }}>⊙ 靶心圆标为 Rotor 37 基准坐标 (Baseline)</span>
        </div>

        {/* 02. 主工作区第一行：左侧控制台 + 右侧 2D 热力图 (绝对等高 540px 对齐) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isNarrow ? '1fr' : '340px minmax(0, 1fr)',
          gap: 20,
          alignItems: 'stretch',
          marginBottom: 20
        }}>
          
          {/* 左侧控制面板 */}
          <motion.aside
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 6,
              padding: '22px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sliders size={14} style={{ color: 'var(--yellow)' }} />
                  <span style={{ font: '11px var(--mono)', color: 'var(--paper)', fontWeight: 700 }}>
                    控制面 · CONTROL SURFACE
                  </span>
                </div>
                <span style={{ font: '10px var(--mono)', color: 'var(--teal-bright)', fontWeight: 600 }}>
                  LOCAL READY
                </span>
              </div>

              <div style={{ display: 'grid', gap: 14 }}>
                <SelectField
                  label="X 轴维度 / PARAM X"
                  value={paramX}
                  onChange={name => switchAxis('x', name)}
                  names={baseline.feature_names}
                />
                <RangeField
                  label="X 扫描范围 / X RANGE"
                  value={xRange}
                  stat={baseline.stats[paramX]}
                  onChange={setXRange}
                />

                <SelectField
                  label="Y 轴维度 / PARAM Y"
                  value={paramY}
                  onChange={name => switchAxis('y', name)}
                  names={baseline.feature_names}
                />
                <RangeField
                  label="Y 扫描范围 / Y RANGE"
                  value={yRange}
                  stat={baseline.stats[paramY]}
                  onChange={setYRange}
                />

                {/* 目标响应选择 */}
                <div>
                  <div style={{ color: 'var(--faint)', font: '10px var(--mono)', letterSpacing: '0.08em', marginBottom: 6 }}>
                    响应目标 / TARGET OUTPUT
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                    {OUTPUTS.map(item => {
                      const active = output === item.key
                      return (
                        <button
                          key={item.key}
                          onClick={() => setOutput(item.key)}
                          style={{
                            padding: '9px 6px',
                            color: active ? '#0b0e0d' : 'var(--paper)',
                            background: active ? item.color : 'var(--ink)',
                            border: `1px solid ${active ? item.color : 'var(--line)'}`,
                            borderRadius: 4,
                            cursor: 'pointer',
                            font: '12px var(--mono)',
                            fontWeight: 700,
                            transition: 'all 0.2s'
                          }}
                        >
                          {item.symbol}<br />
                          <span style={{ fontSize: 10, fontWeight: 500 }}>{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 分辨率滑块 */}
                <label style={{ display: 'grid', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', font: '10px var(--mono)' }}>
                    <span style={{ color: 'var(--faint)' }}>GRID / 分辨率</span>
                    <span style={{ color: 'var(--paper)' }}>{gridN} × {gridN} = {gridN * gridN} pts</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="30"
                    step="5"
                    value={gridN}
                    onChange={e => setGridN(Number(e.target.value))}
                    style={{ accentColor: 'var(--teal-bright)', cursor: 'pointer' }}
                  />
                </label>
              </div>
            </div>

            <button
              onClick={() => runSweep()}
              disabled={sweeping}
              className="btn-primary"
              style={{ width: '100%', marginTop: 12, height: 44 }}
            >
              {sweeping ? '正在极速扫描…' : '运行二维扫描 / Sweep  ↗'}
            </button>
          </motion.aside>

          {/* 右侧：Plotly 2D 热力图视口 */}
          <motion.div
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 }}
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 6,
              padding: '20px 22px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%'
            }}
          >
            {sweeping && (
              <div style={{
                position: 'absolute',
                inset: 0,
                zIndex: 2,
                display: 'grid',
                placeItems: 'center',
                background: 'rgba(11,14,13,0.65)',
                borderRadius: 6
              }}>
                <RefreshCw size={24} style={{ color: 'var(--yellow)' }} className="spin" />
              </div>
            )}

            {result && (
              <Plot
                data={plotData}
                layout={plotLayout}
                config={{ displayModeBar: false, responsive: true }}
                useResizeHandler
                style={{ width: '100%' }}
                onClick={event => {
                  const point = event.points?.[0]
                  if (point?.z !== undefined) setClicked({ x: point.x, y: point.y, z: point.z })
                }}
              />
            )}

            {sweepError && (
              <div style={{
                color: 'var(--rust)',
                borderTop: '1px solid rgba(197,104,74,0.3)',
                paddingTop: 12,
                fontSize: 12,
                marginTop: 10
              }}>
                {sweepError}
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: 16,
              alignItems: 'center',
              flexWrap: 'wrap',
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid var(--line)',
              fontSize: '11px',
              fontFamily: 'var(--mono)'
            }}>
              <span style={{ color: 'var(--teal-bright)', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                <Zap size={12} /> {result?.n_evaluations || 0} LOCAL EVALUATIONS
              </span>
              <span style={{ color: 'var(--line-strong)' }}>|</span>
              <span style={{ color: 'var(--muted)' }}>MODEL: ONNX SIMD WASM</span>
              <span style={{ color: 'var(--line-strong)' }}>|</span>
              <span style={{ color: 'var(--faint)' }}>点击热力图任意坐标读取局部点位</span>
            </div>
          </motion.div>
        </div>

        {/* 03. 主工作区第二行：三卡片读数底栏 (严格水平绝对对齐，等宽等高) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isNarrow ? '1fr' : '340px 1fr 1fr',
          gap: 20,
          alignItems: 'stretch'
        }}>
          {/* Card 1: 物理安全边界 */}
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 6,
            padding: '22px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ color: 'var(--yellow)', font: '10px var(--mono)', letterSpacing: '0.12em', marginBottom: 12 }}>
                物理安全边界 · BOUNDARY GUARD
              </div>
              <h4 style={{ color: 'var(--paper)', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                拒绝模型外推截断保护
              </h4>
              <p style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.75 }}>
                超出训练数据集最大/最小范围的参数输入会被自动拦截。残差代理网络仅在可信内插流形上提供高精度预测。
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 14,
              paddingTop: 10,
              borderTop: '1px solid var(--line)',
              fontSize: '11px',
              fontFamily: 'var(--mono)',
              color: 'var(--teal-bright)'
            }}>
              <ShieldCheck size={14} />
              <span>内插保护激活 (No Extrapolation)</span>
            </div>
          </div>

          {/* Card 2: 响应面极值读数 */}
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 6,
            padding: '22px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ color: 'var(--faint)', font: '10px var(--mono)', letterSpacing: '0.12em', marginBottom: 14 }}>
                响应面极值读数 · SURFACE READOUT
              </div>
              {result ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  {[
                    ['MAXIMUM 极高值', result.z_max, 'var(--teal-bright)'],
                    ['MINIMUM 极低值', result.z_min, 'var(--rust)'],
                    ['ROTOR 37 基准值', result.baseline_prediction, 'var(--yellow)']
                  ].map(([label, value, color]) => (
                    <div key={label} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      borderBottom: '1px solid var(--line)',
                      paddingBottom: 6
                    }}>
                      <span style={{ color: 'var(--muted)', font: '11px var(--mono)' }}>{label}</span>
                      <span className="num" style={{ color, fontSize: 17, fontWeight: 700 }}>
                        {Number(value).toFixed(5)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>正在计算响应面极值…</div>
              )}
            </div>

            <div style={{
              marginTop: 14,
              paddingTop: 10,
              borderTop: '1px solid var(--line)',
              fontSize: '11px',
              fontFamily: 'var(--mono)',
              color: 'var(--faint)'
            }}>
              网格分辨率: {gridN} × {gridN} 点位
            </div>
          </div>

          {/* Card 3: 点位检查器 */}
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 6,
            padding: '22px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ color: 'var(--faint)', font: '10px var(--mono)', letterSpacing: '0.12em', marginBottom: 14 }}>
                局部点位检查器 · POINT INSPECTOR
              </div>
              {clicked ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  {[
                    [`${paramX}`, clicked.x, 'var(--paper)'],
                    [`${paramY}`, clicked.y, 'var(--paper)'],
                    [`${meta.symbol} ${meta.label}`, clicked.z, meta.color]
                  ].map(([label, value, color]) => (
                    <div key={label} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      borderBottom: '1px solid var(--line)',
                      paddingBottom: 6
                    }}>
                      <span style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--mono)' }}>{label}</span>
                      <span className="num" style={{ color, fontSize: 16, fontWeight: 700 }}>
                        {Number(value).toPrecision(6)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.75 }}>
                  <MousePointerClick size={16} style={{ color: 'var(--yellow)', marginBottom: 8 }} />
                  <p>点击热力图上的任意点位，即可获取该局部坐标的精确气动预测与基准偏离量。</p>
                </div>
              )}
            </div>

            <div style={{
              marginTop: 14,
              paddingTop: 10,
              borderTop: '1px solid var(--line)',
              fontSize: '11px',
              fontFamily: 'var(--mono)',
              color: 'var(--faint)'
            }}>
              {clicked ? '当前点位已锁定' : '等待用户点击交互…'}
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}
