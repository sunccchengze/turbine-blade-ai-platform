import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Plot from 'react-plotly.js'
import {
  Target, TrendingUp, Award,
  RefreshCw, AlertCircle, Info,
  ChevronRight, BarChart3
} from 'lucide-react'
import { getParetoFront, getTrainingStats, getParetoEvolution } from '../utils/api'
import BladeViewer3D from '../components/BladeViewer3D'

// ── 指标卡片 ───────────────────────────────────────────────
function MetricCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div className="glass-card" style={{
      padding: '16px 20px',
      border: `1px solid ${color}22`,
      background: `${color}08`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '7px',
          background: `${color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={13} color={color} />
        </div>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div className="num" style={{ fontSize: '22px', fontWeight: 700, color, marginBottom: '3px' }}>
        {value}
      </div>
      <div style={{ fontSize: '11px', color: '#475569' }}>{sub}</div>
    </div>
  )
}

// ── 主页面 ─────────────────────────────────────────────────
export default function OptimizePage() {
  const [paretoData,    setParetoData]    = useState(null)
  const [trainingStats, setTrainingStats] = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [selected,      setSelected]      = useState(null)
  const [colorBy,       setColorBy]       = useState('Compression_ratio')
  const [evolutionData, setEvolutionData] = useState(null)
  const [evolutionErr,  setEvolutionErr]  = useState(false)
  // 窄屏（<900px）时图表与右侧详情改单列，避免 300px 侧栏挤占主图
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < 900)

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 900)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    Promise.all([getParetoFront(), getTrainingStats()])
      .then(([pareto, stats]) => {
        setParetoData(pareto)
        setTrainingStats(stats)
        // 默认选中效率最高的点
        const best = pareto.pareto_front.reduce((a, b) =>
          a.Efficiency > b.Efficiency ? a : b
        )
        setSelected(best)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))

    // 演化轨迹（独立容错：旧后端无此端点时只隐藏动画，不影响主页面）
    getParetoEvolution()
      .then(setEvolutionData)
      .catch(() => setEvolutionErr(true))
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#64748b' }}>
        <RefreshCw size={28} style={{ margin: '0 auto 10px', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '14px' }}>正在加载 Pareto 前沿数据… Loading…</p>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        padding: '20px 24px', borderRadius: '12px',
        background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
        display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171',
      }}>
        <AlertCircle size={16} />
        <span style={{ fontSize: '14px' }}>{error}</span>
      </div>
    </div>
  )

  const pareto   = paretoData.pareto_front
  const summary  = paretoData.summary
  const baseline = trainingStats?.statistics

  // ── 图表数据准备 ───────────────────────────────────────────
  const colorValues = pareto.map(d => d[colorBy])
  const colorMin    = Math.min(...colorValues)
  const colorMax    = Math.max(...colorValues)

  // Pareto 前沿散点
  const paretoTrace = {
    type: 'scatter',
    mode: 'markers',
    name: 'Pareto 前沿 Front',
    x: pareto.map(d => d.Massflow),
    y: pareto.map(d => d.Efficiency),
    marker: {
      size: 10,
      color: colorValues,
      colorscale: 'Viridis',
      cmin: colorMin,
      cmax: colorMax,
      colorbar: {
        title: {
          text: colorBy === 'Compression_ratio' ? '总压比 π' : colorBy,
          font: { color: '#64748b', size: 11 },
        },
        tickfont: { color: '#64748b', size: 10 },
        bgcolor: 'rgba(0,0,0,0)',
        bordercolor: 'rgba(255,255,255,0.05)',
        thickness: 12,
      },
      line: { color: 'rgba(255,255,255,0.3)', width: 1 },
    },
    text: pareto.map(d =>
      `η = ${d.Efficiency.toFixed(4)}<br>` +
      `ṁ = ${d.Massflow.toFixed(3)} kg/s<br>` +
      `π = ${d.Compression_ratio.toFixed(4)}`
    ),
    hovertemplate: '%{text}<extra>Pareto 解 Solution</extra>',
  }

  // 训练数据散点（背景）
  const baselineTrace = baseline ? {
    type: 'scatter',
    mode: 'markers',
    name: '训练集均值 Training Avg',
    x: [baseline.Massflow.mean],
    y: [baseline.Efficiency.mean],
    marker: {
      size: 14, color: '#f87171', symbol: 'star',
      line: { color: 'rgba(255,255,255,0.5)', width: 1.5 },
    },
    text: [
      `训练集均值 Training Average<br>` +
      `η = ${baseline.Efficiency.mean.toFixed(4)}<br>` +
      `ṁ = ${baseline.Massflow.mean.toFixed(3)} kg/s`
    ],
    hovertemplate: '%{text}<extra>基准 Baseline</extra>',
  } : null

  // 选中点高亮
  const selectedTrace = selected ? {
    type: 'scatter',
    mode: 'markers',
    name: '当前选中 Selected',
    x: [selected.Massflow],
    y: [selected.Efficiency],
    marker: {
      size: 16, color: '#fbbf24', symbol: 'circle',
      line: { color: 'white', width: 2 },
    },
    hoverinfo: 'skip',
  } : null

  const traces = [
    paretoTrace,
    ...(baselineTrace ? [baselineTrace] : []),
    ...(selectedTrace ? [selectedTrace] : []),
  ]

  const layout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor:  'rgba(0,0,0,0)',
    font:  { color: '#94a3b8', family: 'Inter, sans-serif', size: 11 },
    xaxis: {
      title: { text: '质量流量 Mass Flow ṁ (kg/s)', font: { color: '#64748b', size: 12 } },
      gridcolor: 'rgba(255,255,255,0.04)',
      zerolinecolor: 'rgba(255,255,255,0.06)',
      tickfont: { color: '#475569' },
    },
    yaxis: {
      title: { text: '等熵效率 Isentropic Efficiency η', font: { color: '#64748b', size: 12 } },
      gridcolor: 'rgba(255,255,255,0.04)',
      zerolinecolor: 'rgba(255,255,255,0.06)',
      tickfont: { color: '#475569' },
    },
    legend: {
      bgcolor: 'rgba(15,23,42,0.8)',
      bordercolor: 'rgba(255,255,255,0.06)',
      borderwidth: 1,
      font: { color: '#94a3b8', size: 11 },
    },
    margin: { t: 20, b: 60, l: 60, r: 20 },
    hoverlabel: {
      bgcolor: '#1e293b',
      bordercolor: 'rgba(99,102,241,0.3)',
      font: { color: '#e2e8f0', size: 12 },
    },
  }

  const config = {
    displayModeBar: true,
    modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
    displaylogo: false,
    responsive: true,
  }

  // ── NSGA-II 演化动画（每 10 代一帧）──────────────────────
  const evolutionFrames = (evolutionData?.generations || []).map(g => ({
    name: `gen_${g.generation}`,
    data: [{
      type: 'scatter', mode: 'markers',
      x: g.solutions.map(s => s.Massflow),
      y: g.solutions.map(s => s.Efficiency),
      text: g.solutions.map(() => `第 ${g.generation} 代 Generation ${g.generation}`),
      marker: {
        size: 8, color: '#22d3ee', opacity: 0.85,
        line: { color: 'rgba(255,255,255,0.4)', width: 0.5 },
      },
      hovertemplate: 'η = %{y:.4f}<br>ṁ = %{x:.3f} kg/s<br>%{text}<extra>演化前沿 Evolution</extra>',
    }],
  }))

  // 坐标范围固定（取全部帧的 min/max + 5% padding），保证「前沿铺开」的动感
  const allEvoSolutions = (evolutionData?.generations || []).flatMap(g => g.solutions)
  let evoXmin = 19, evoXmax = 22, evoYmin = 0.85, evoYmax = 0.93
  if (allEvoSolutions.length > 0) {
    const xs = allEvoSolutions.map(s => s.Massflow)
    const ys = allEvoSolutions.map(s => s.Efficiency)
    const padX = (Math.max(...xs) - Math.min(...xs)) * 0.05 || 0.05
    const padY = (Math.max(...ys) - Math.min(...ys)) * 0.05 || 0.005
    evoXmin = Math.min(...xs) - padX; evoXmax = Math.max(...xs) + padX
    evoYmin = Math.min(...ys) - padY; evoYmax = Math.max(...ys) + padY
  }

  const evolutionTrace0 = evolutionFrames[0]?.data[0]
    || { type: 'scatter', mode: 'markers', x: [], y: [] }

  const evolutionLayout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor:  'rgba(0,0,0,0)',
    font:  { color: '#94a3b8', family: 'Inter, sans-serif', size: 11 },
    xaxis: {
      title: { text: '质量流量 Mass Flow ṁ (kg/s)', font: { color: '#64748b', size: 12 } },
      range: [evoXmin, evoXmax],
      gridcolor: 'rgba(255,255,255,0.04)', zerolinecolor: 'rgba(255,255,255,0.06)',
      tickfont: { color: '#475569' },
    },
    yaxis: {
      title: { text: '等熵效率 Isentropic Efficiency η', font: { color: '#64748b', size: 12 } },
      range: [evoYmin, evoYmax],
      gridcolor: 'rgba(255,255,255,0.04)', zerolinecolor: 'rgba(255,255,255,0.06)',
      tickfont: { color: '#475569' },
    },
    margin: { t: 44, b: 60, l: 60, r: 20 },
    annotations: [{
      text: 'NSGA-II 演化：每 10 代前沿快照 · 共 200 代',
      x: 0, y: 1.06, xref: 'paper', yref: 'paper', showarrow: false,
      font: { color: '#475569', size: 11 },
    }],
    updatemenus: [{
      type: 'buttons', showactive: false, x: 1, y: 1.12, xanchor: 'right', yanchor: 'top',
      font: { color: '#e2e8f0', size: 11 },
      bgcolor: 'rgba(99,102,241,0.2)', bordercolor: 'rgba(99,102,241,0.4)', borderwidth: 1,
      buttons: [
        { label: '▶ 播放 Play', method: 'animate',
          args: [null, { frame: { duration: 450, redraw: false }, fromcurrent: true, transition: { duration: 200 } }] },
        { label: '⏸ 暂停 Pause', method: 'animate',
          args: [[null], { frame: { duration: 0, redraw: false }, mode: 'immediate' }] },
      ],
    }],
    sliders: [{
      pad: { t: 24 },
      currentvalue: {
        prefix: '代数 Generation ', font: { color: '#818cf8', size: 12 },
        xanchor: 'right', offset: 6,
      },
      steps: evolutionFrames.map(f => ({
        label: String(f.name.replace('gen_', '')),
        method: 'animate',
        args: [[f.name], { mode: 'immediate', frame: { duration: 0, redraw: false } }],
      })),
      bgcolor: 'rgba(30,41,59,0.6)',
      bordercolor: 'rgba(255,255,255,0.08)',
      activebgcolor: 'rgba(99,102,241,0.4)',
      activecolor: '#e2e8f0',
      font: { color: '#94a3b8', size: 10 },
    }],
  }

  // 点击事件处理
  const handlePlotClick = (data) => {
    if (!data?.points?.length) return
    const pt    = data.points[0]
    const idx   = pt.pointIndex
    if (pt.data.name === 'Pareto 前沿 Front') {
      setSelected(pareto[idx])
    }
  }

  // 改进幅度计算
  const calcImprovement = (val, baseVal) => {
    if (!baseVal) return null
    return (((val - baseVal) / Math.abs(baseVal)) * 100).toFixed(2)
  }

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '28px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(34,211,238,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Target size={18} color="#22d3ee" />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9' }}>
              多目标设计优化
              <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600, marginLeft: '10px', letterSpacing: '0.08em' }}>
                MULTI-OBJECTIVE OPTIMIZATION
              </span>
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '700px', lineHeight: 1.7 }}>
            NSGA-II 多目标优化算法找到{' '}
            <span style={{ color: '#22d3ee', fontWeight: 500 }}>
              {paretoData?.n_solutions} 个 Pareto 最优
            </span>
            {' '}叶片设计方案，点击任意点查看其气动性能。全部设计满足约束：π ≥ 1.8，η ≥ 0.84。
            <br />
            <span style={{ fontSize: '12px', color: '#475569' }}>
              NSGA-II found {paretoData?.n_solutions} Pareto-optimal blade designs — click any point to inspect its performance. All designs satisfy: π ≥ 1.8, η ≥ 0.84.
            </span>
          </p>
        </motion.div>

        {/* 顶部指标卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px', marginBottom: '24px',
          }}
        >
          <MetricCard
            label="最高效率 Max Efficiency"
            value={`η = ${summary.efficiency.max.toFixed(4)}`}
            sub={`+${calcImprovement(summary.efficiency.max, baseline?.Efficiency?.mean)}% 相对训练均值 vs avg`}
            color="#818cf8"
            icon={Award}
          />
          <MetricCard
            label="最大流量 Max Mass Flow"
            value={`${summary.massflow.max.toFixed(2)} kg/s`}
            sub={`+${calcImprovement(summary.massflow.max, baseline?.Massflow?.mean)}% 相对训练均值 vs avg`}
            color="#34d399"
            icon={TrendingUp}
          />
          <MetricCard
            label="最高压比 Max Pressure Ratio"
            value={`π = ${summary.compression_ratio.max.toFixed(4)}`}
            sub={`+${calcImprovement(summary.compression_ratio.max, baseline?.Compression_ratio?.mean)}% 相对训练均值 vs avg`}
            color="#22d3ee"
            icon={BarChart3}
          />
          <MetricCard
            label="Pareto 最优解 Solutions"
            value={paretoData.n_solutions}
            sub="非支配设计 non-dominated"
            color="#fbbf24"
            icon={Target}
          />
        </motion.div>

        {/* 主体：图表 + 选中点详情 */}
        <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 300px', gap: '20px' }}>

          {/* Pareto 前沿图 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card"
            style={{ padding: '20px' }}
          >
            {/* 图表标题 + 颜色选择 */}
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', marginBottom: '16px',
            }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>
                  Pareto 前沿：效率–流量权衡 Efficiency vs Mass Flow
                </h3>
                <p style={{ fontSize: '11px', color: '#475569', marginTop: '3px' }}>
                  点击任意点查看详情 Click any point · ⭐ = 训练集均值 Training Avg
                </p>
              </div>

              {/* 颜色维度选择 */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { key: 'Compression_ratio', label: '着色 Color: π' },
                  { key: 'Efficiency',         label: '着色 Color: η' },
                  { key: 'Massflow',            label: '着色 Color: ṁ' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setColorBy(key)}
                    style={{
                      padding: '4px 10px', borderRadius: '6px',
                      fontSize: '11px', fontWeight: 500, cursor: 'pointer',
                      border: '1px solid',
                      background: colorBy === key ? 'rgba(99,102,241,0.2)' : 'transparent',
                      borderColor: colorBy === key ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)',
                      color: colorBy === key ? '#818cf8' : '#64748b',
                      transition: 'all 0.2s',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <Plot
              data={traces}
              layout={layout}
              config={config}
              onClick={handlePlotClick}
              useResizeHandler={true}
              style={{ width: '100%', height: '420px' }}
            />

            {/* NSGA-II 演化动画（Day 22） */}
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', marginBottom: '3px' }}>
                NSGA-II 演化动画 Evolution Animation
              </h3>
              <p style={{ fontSize: '11px', color: '#475569', marginBottom: '10px' }}>
                200 代优化过程中每 10 代的前沿快照 · 播放观看非支配前沿如何逐步铺开
                <br />
                <span style={{ fontSize: '10px', color: '#334155' }}>
                  Front snapshots every 10 generations during the 200-generation NSGA-II run.
                </span>
              </p>
              {evolutionErr ? (
                <div style={{
                  padding: '24px', textAlign: 'center', color: '#475569', fontSize: '12px',
                  border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '10px',
                }}>
                  演化动画需要后端端点 /api/optimize/pareto-evolution（更新后端后可用）
                </div>
              ) : evolutionFrames.length > 0 ? (
                <Plot
                  data={[evolutionTrace0]}
                  layout={evolutionLayout}
                  frames={evolutionFrames}
                  config={{ displayModeBar: false, displaylogo: false, responsive: true }}
                  useResizeHandler={true}
                  style={{ width: '100%', height: '380px' }}
                />
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: '#475569', fontSize: '12px' }}>
                  加载演化数据… Loading evolution data…
                </div>
              )}
            </div>
          </motion.div>

          {/* 右侧：选中点详情 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            {/* 选中点信息 */}
            <div className="glass-card" style={{
              padding: '20px',
              border: selected ? '1px solid rgba(251,191,36,0.2)' : '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '16px',
              }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: selected ? '#fbbf24' : '#334155',
                }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: selected ? '#fbbf24' : '#475569' }}>
                  {selected ? '选中的设计 Selected Design' : '点击图表中的点'}
                </span>
              </div>

              {selected ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: '等熵效率 Efficiency η', value: selected.Efficiency.toFixed(6),        color: '#818cf8', baseline: baseline?.Efficiency?.mean },
                    { label: '质量流量 Mass Flow ṁ',  value: `${selected.Massflow.toFixed(4)} kg/s`, color: '#34d399', baseline: baseline?.Massflow?.mean    },
                    { label: '总压比 Pressure Ratio π',value: selected.Compression_ratio.toFixed(6), color: '#22d3ee', baseline: baseline?.Compression_ratio?.mean },
                  ].map(({ label, value, color, baseline: bv }) => {
                    const numVal = parseFloat(value)
                    const imp    = bv ? (((numVal - bv) / Math.abs(bv)) * 100).toFixed(2) : null
                    return (
                      <div key={label} style={{
                        padding: '10px 12px', borderRadius: '8px',
                        background: `${color}08`,
                        border: `1px solid ${color}18`,
                      }}>
                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                          {label}
                        </div>
                        <div className="num" style={{ fontSize: '16px', fontWeight: 700, color }}>
                          {value}
                        </div>
                        {imp && (
                          <div style={{
                            fontSize: '10px', marginTop: '3px',
                            color: parseFloat(imp) >= 0 ? '#34d399' : '#f87171',
                          }}>
                            {parseFloat(imp) >= 0 ? '▲' : '▼'} {Math.abs(imp)}% 相对均值 vs avg
                          </div>
                        )}
                      </div>
                    )
                  })}

                  <div style={{
                    padding: '10px 12px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    fontSize: '11px', color: '#475569',
                  }}>
                    设计方案 Design #{selected.design_id}
                  </div>
                </div>
              ) : (
                <div style={{
                  textAlign: 'center', padding: '20px 0', color: '#334155', fontSize: '13px',
                }}>
                  点击 Pareto 前沿上的任意点，查看该设计方案的气动性能参数
                </div>
              )}
            </div>

            {/* 3D 叶型联动：点选 Pareto 解 → 渲染对应叶型 */}
            <div className="glass-card" style={{
              padding: '16px',
              border: selected ? '1px solid rgba(129,140,248,0.2)' : '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: selected ? '#a5b4fc' : '#475569' }}>
                  3D 叶型联动 3D Blade Preview
                </span>
                <div style={{ fontSize: '10px', color: '#475569', marginTop: '3px' }}>
                  基于该解的几何参数实时生成 · Generated from this solution's geometry parameters
                </div>
              </div>

              {selected ? (
                <>
                  <BladeViewer3D
                    params={selected.geometry || {}}
                    efficiency={selected.Efficiency}
                    pressureRatio={selected.Compression_ratio}
                    massflow={selected.Massflow}
                    height={220}
                  />
                  {/* 工况与几何参数 */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '8px', marginTop: '12px',
                  }}>
                    {[
                      { label: '转速 Ω', value: selected.geometry?.Omega != null ? `${selected.geometry.Omega.toFixed(0)} rad/s` : '—' },
                      { label: '背压 P', value: selected.geometry?.P != null ? `${(selected.geometry.P / 1000).toFixed(0)} kPa` : '—' },
                      { label: '表面压力均值', value: selected.geometry?.Pressure_mean != null ? `${(selected.geometry.Pressure_mean / 1000).toFixed(0)} kPa` : '—' },
                      { label: '表面温度均值', value: selected.geometry?.Temperature_mean != null ? `${selected.geometry.Temperature_mean.toFixed(0)} K` : '—' },
                    ].map(item => (
                      <div key={item.label} style={{
                        padding: '8px 10px', borderRadius: '8px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}>
                        <div style={{ fontSize: '10px', color: '#475569', marginBottom: '3px' }}>{item.label}</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{
                    fontSize: '10px', color: '#334155', marginTop: '10px', lineHeight: 1.6,
                  }}>
                    注：叶型为基于几何参数的示意重建，非 CFD 网格。Note: schematic geometry reconstruction from parameters, not CFD mesh.
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#334155', fontSize: '12px' }}>
                  选择一个 Pareto 解后在此预览对应叶型
                </div>
              )}
            </div>

            {/* 快捷选择 */}
            <div className="glass-card" style={{ padding: '16px' }}>
              <div style={{
                fontSize: '11px', fontWeight: 600, color: '#475569',
                textTransform: 'uppercase', letterSpacing: '0.04em',
                marginBottom: '10px',
              }}>
                快捷选择 Quick Select
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  {
                    label: '最高效率 Max Efficiency',
                    fn: () => pareto.reduce((a, b) => a.Efficiency > b.Efficiency ? a : b),
                    color: '#818cf8',
                  },
                  {
                    label: '最大流量 Max Mass Flow',
                    fn: () => pareto.reduce((a, b) => a.Massflow > b.Massflow ? a : b),
                    color: '#34d399',
                  },
                  {
                    label: '最高压比 Max Pressure Ratio',
                    fn: () => pareto.reduce((a, b) => a.Compression_ratio > b.Compression_ratio ? a : b),
                    color: '#22d3ee',
                  },
                  {
                    label: '均衡设计 Balanced (nearest center)',
                    fn: () => {
                      const effs  = pareto.map(d => d.Efficiency)
                      const flows = pareto.map(d => d.Massflow)
                      const normE = effs.map(v  => (v - Math.min(...effs))  / (Math.max(...effs)  - Math.min(...effs)))
                      const normF = flows.map(v => (v - Math.min(...flows)) / (Math.max(...flows) - Math.min(...flows)))
                      const dists = normE.map((e, i) => Math.sqrt((e - 0.5) ** 2 + (normF[i] - 0.5) ** 2))
                      return pareto[dists.indexOf(Math.min(...dists))]
                    },
                    color: '#fbbf24',
                  },
                ].map(({ label, fn, color }) => (
                  <button
                    key={label}
                    onClick={() => setSelected(fn())}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', borderRadius: '7px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      color: '#94a3b8', fontSize: '12px', cursor: 'pointer',
                      transition: 'all 0.2s', textAlign: 'left',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = `${color}10`
                      e.currentTarget.style.borderColor = `${color}25`
                      e.currentTarget.style.color = color
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
                      e.currentTarget.style.color = '#94a3b8'
                    }}
                  >
                    {label}
                    <ChevronRight size={12} />
                  </button>
                ))}
              </div>
            </div>

          </motion.div>
        </div>

        {/* 说明卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{ marginTop: '20px' }}
        >
          <div className="glass-card" style={{
            padding: '16px 20px',
            display: 'flex', alignItems: 'flex-start', gap: '12px',
          }}>
            <Info size={15} color="#64748b" style={{ flexShrink: 0, marginTop: '1px' }} />
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.8 }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>读懂这张图 How to read： </span>
              每个点代表一个无法在不牺牲另一目标的情况下继续改进的叶片设计（非支配解
              Non-dominated Solution）。向右移动提升质量流量，但可能牺牲效率。
              <span style={{ color: '#f87171' }}>⭐ 红星</span>
              {' '}为训练集均值——所有 Pareto 解至少在一个目标上严格优于它。色条默认展示第三个目标：总压比 π。
              <br />
              <span style={{ fontSize: '11px', color: '#334155' }}>
                Each point is a blade design that cannot be improved on both objectives simultaneously (non-dominated).
                Moving right increases mass flow but may reduce efficiency. The red star marks the training-data
                average — all Pareto solutions beat it in at least one objective. The colorbar shows the third
                objective (pressure ratio by default).
              </span>
            </div>
          </div>
        </motion.div>

      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}