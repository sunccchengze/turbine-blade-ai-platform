import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import Plot from 'react-plotly.js'
import { motion } from 'framer-motion'
import {
  RefreshCw,
  CircleDot,
  MousePointerClick,
  Play,
  Pause,
  RotateCcw,
  FastForward,
} from 'lucide-react'
import BladeViewer3D from '../components/BladeViewer3D'
import { getParetoEvolution, getParetoFront, getTrainingStats } from '../utils/api'

export default function OptimizePage() {
  const [data, setData] = useState(null)
  const [stats, setStats] = useState(null)
  const [evolution, setEvolution] = useState(null)
  const [selected, setSelected] = useState(null)
  const [colorDim, setColorDim] = useState('Compression_ratio')
  const [genIndex, setGenIndex] = useState(20) // 0 to 20 (21 代快照，默认最后一代 200)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < 960)
  const playTimerRef = useRef(null)

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 960)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    Promise.all([getParetoFront(), getTrainingStats(), getParetoEvolution()])
      .then(([p, s, e]) => {
        setData(p)
        setStats(s)
        const gens = e.generations || e
        setEvolution(gens)
        setGenIndex(gens.length - 1)
        // 默认选中最高效率候选
        const bestEta = p.pareto_front.reduce((a, b) => (a.Efficiency > b.Efficiency ? a : b))
        setSelected(bestEta)
      })
  }, [])

  // 当前代的演化快照数据
  const currentGen = useMemo(() => {
    if (!evolution || evolution.length === 0) return null
    const safeIdx = Math.max(0, Math.min(evolution.length - 1, genIndex))
    return evolution[safeIdx]
  }, [evolution, genIndex])

  // 自动播放进化历程
  useEffect(() => {
    if (isPlaying && evolution) {
      playTimerRef.current = setInterval(() => {
        setGenIndex(prev => {
          if (prev >= evolution.length - 1) {
            setIsPlaying(false)
            return evolution.length - 1
          }
          return prev + 1
        })
      }, 260)
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current)
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current)
    }
  }, [isPlaying, evolution])

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false)
    } else {
      if (evolution && genIndex >= evolution.length - 1) {
        setGenIndex(0) // 从初代重新开始播放
      }
      setIsPlaying(true)
    }
  }, [isPlaying, genIndex, evolution])

  // 当前代数统计
  const currentGenStats = useMemo(() => {
    if (!currentGen || !currentGen.solutions || currentGen.solutions.length === 0) {
      return { n: 0, avgEta: 0, maxEta: 0, maxPi: 0 }
    }
    const sols = currentGen.solutions
    const n = sols.length
    const avgEta = sols.reduce((sum, s) => sum + s.Efficiency, 0) / n
    const maxEta = Math.max(...sols.map(s => s.Efficiency))
    const maxPi = Math.max(...sols.map(s => s.Compression_ratio))
    return { n, avgEta, maxEta, maxPi }
  }, [currentGen])

  // 构造散点图数据 (随代数动态演化)
  const plot = useMemo(() => {
    if (!data || !currentGen) return []

    const isFinalGen = evolution && genIndex === evolution.length - 1
    const activeSolutions = isFinalGen ? data.pareto_front : currentGen.solutions
    const vals = activeSolutions.map(d => d[colorDim])
    const colorTitle = colorDim === 'Compression_ratio' ? '总压比 π' : colorDim === 'Efficiency' ? '等熵效率 η' : '流量 ṁ (kg/s)'

    // 最终前沿参考线 (当处于早期代数时显示虚线参考)
    const finalFront = data.pareto_front
    const sortedFinal = [...finalFront].sort((a, b) => a.Massflow - b.Massflow)

    const traces = []

    // 1. 早期代数时绘制最终前沿的参考背景虚线
    if (!isFinalGen) {
      traces.push({
        x: sortedFinal.map(d => d.Massflow),
        y: sortedFinal.map(d => d.Efficiency),
        mode: 'lines',
        type: 'scatter',
        name: '最终前沿参考 (Gen 200)',
        line: { color: 'rgba(231, 200, 91, 0.28)', dash: 'dot', width: 1.5 },
        hoverinfo: 'none'
      })
    }

    // 2. 当前代数实际活跃解集
    traces.push({
      x: activeSolutions.map(d => d.Massflow),
      y: activeSolutions.map(d => d.Efficiency),
      mode: 'markers',
      type: 'scatter',
      name: `第 ${currentGen.generation} 代解集 (${activeSolutions.length}个)`,
      marker: {
        size: isFinalGen ? 9 : 10,
        color: vals,
        colorscale: [
          [0, '#12201b'],
          [0.35, '#265446'],
          [0.7, '#5b9281'],
          [1, '#e7c85b']
        ],
        colorbar: {
          title: { text: colorTitle, font: { color: 'var(--muted)', size: 11 } },
          tickfont: { color: 'var(--muted)', size: 10 },
          outlinewidth: 0,
          thickness: 14
        },
        line: { width: 0 }
      },
      text: activeSolutions.map((d, i) => `[Gen ${currentGen.generation} · 候选 #${d.design_id || i + 1}]<br>等熵效率 η: ${d.Efficiency.toFixed(4)}<br>质量流量 ṁ: ${d.Massflow.toFixed(2)} kg/s<br>总压比 π: ${d.Compression_ratio.toFixed(4)}`),
      hovertemplate: '%{text}<extra></extra>'
    })

    // 3. 当前选中的高亮标记
    if (selected) {
      traces.push({
        x: [selected.Massflow],
        y: [selected.Efficiency],
        mode: 'markers',
        type: 'scatter',
        name: `已选候选 #${selected.design_id || 'Selected'}`,
        marker: {
          symbol: 'circle-open-dot',
          size: 18,
          color: '#ffffff',
          line: { color: 'var(--yellow)', width: 2 }
        },
        hovertemplate: `已选候选设计<br>η: ${selected.Efficiency.toFixed(4)}<extra></extra>`
      })
    }

    // 4. 训练集均值基准点 (金色菱形)
    if (stats) {
      traces.push({
        x: [stats?.statistics?.Massflow?.mean],
        y: [stats?.statistics?.Efficiency?.mean],
        mode: 'markers',
        type: 'scatter',
        name: '训练均值基准',
        marker: {
          symbol: 'diamond',
          size: 12,
          color: '#e7c85b',
          line: { color: '#0b0e0d', width: 1 }
        },
        hovertemplate: '数据集均值 Baseline<extra></extra>'
      })
    }

    return traces
  }, [data, currentGen, evolution, genIndex, colorDim, stats, selected])

  if (!data || !stats) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent'
      }}>
        <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
          <RefreshCw size={28} className="spin" style={{ margin: '0 auto 14px', color: 'var(--yellow)' }} />
          <p style={{ font: '13px var(--body)', color: 'var(--paper)' }}>正在载入 NSGA-II 帕累托优化前沿与解集空间…</p>
        </div>
      </div>
    )
  }

  const s = data.summary

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
              03 / 多目标优化 · MULTI-OBJECTIVE PARETO WORKSPACE
            </div>
            <h1 style={{
              color: 'var(--paper)',
              font: '700 clamp(32px, 4.5vw, 54px)/1.1 var(--display)',
              letterSpacing: '-0.045em',
              marginTop: 12
            }}>
              代理 Pareto 气动权衡<br />
              <span style={{ color: 'var(--teal-bright)' }}>Surrogate Pareto · schematic blade, not CAD</span>
            </h1>
          </div>
          <p style={{ maxWidth: 420, color: 'var(--muted)', fontSize: 13, lineHeight: 1.8 }}>
            NSGA-II 算法在 74 维设计空间中完成 200 代多目标进化搜索。点击散点即时联动 3D 叶片重构，拖动下方时间轴动态回放种群从初始离散到前沿收敛的全过程。
          </p>
        </motion.header>

        {/* 顶部系统遥测条 (无框工科 Token) */}
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
            NSGA-II MULTI-OBJECTIVE ENGINE
          </span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span>约束条件: π ≥ 1.80 · η ≥ 0.84</span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span>当前显示: <strong style={{ color: 'var(--yellow)' }}>GEN {currentGen?.generation ?? 200}</strong> ({currentGenStats.n} 解)</span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span style={{ color: 'var(--faint)' }}>点击散点联动 3D 几何，点击播放可动态回放演化</span>
        </div>

        {/* 02. 4 大核心指标卡片 (严格水平基线对齐) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 16,
          marginBottom: 24
        }}>
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 6,
            padding: '22px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div style={{ height: 44, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ font: '10px var(--mono)', color: 'var(--faint)', letterSpacing: '0.08em' }}>01 / MAX EFFICIENCY</span>
                <span style={{ font: '10px var(--mono)', color: 'var(--yellow)', fontWeight: 600 }}>PEAK ETA</span>
              </div>
              <div style={{ color: 'var(--paper)', fontSize: 15, fontWeight: 700, marginTop: 4 }}>最高绝热效率 η</div>
            </div>
            <div style={{ height: 48, display: 'flex', alignItems: 'center' }}>
              <span className="num" style={{ color: 'var(--yellow)', fontSize: 36, fontWeight: 700, lineHeight: 1 }}>
                {s.efficiency.max.toFixed(4)}
              </span>
            </div>
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)', fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
              SURROGATE OPTIMUM CANDIDATE
            </div>
          </div>

          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 6,
            padding: '22px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div style={{ height: 44, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ font: '10px var(--mono)', color: 'var(--faint)', letterSpacing: '0.08em' }}>02 / MAX MASSFLOW</span>
                <span style={{ font: '10px var(--mono)', color: 'var(--teal-bright)', fontWeight: 600 }}>FLOW CHOKE</span>
              </div>
              <div style={{ color: 'var(--paper)', fontSize: 15, fontWeight: 700, marginTop: 4 }}>最大质量流量 ṁ</div>
            </div>
            <div style={{ height: 48, display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="num" style={{ color: 'var(--teal-bright)', fontSize: 36, fontWeight: 700, lineHeight: 1 }}>
                {s.massflow.max.toFixed(2)}
              </span>
              <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>kg/s</span>
            </div>
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)', fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
              CHOKING FLOW (ṁ &gt; 21.2 kg/s 临近堵塞边界)
            </div>
          </div>

          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 6,
            padding: '22px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div style={{ height: 44, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ font: '10px var(--mono)', color: 'var(--faint)', letterSpacing: '0.08em' }}>03 / MAX RATIO</span>
                <span style={{ font: '10px var(--mono)', color: 'var(--rust)', fontWeight: 600 }}>COMPRESSION</span>
              </div>
              <div style={{ color: 'var(--paper)', fontSize: 15, fontWeight: 700, marginTop: 4 }}>最高级总压比 π</div>
            </div>
            <div style={{ height: 48, display: 'flex', alignItems: 'center' }}>
              <span className="num" style={{ color: 'var(--rust)', fontSize: 36, fontWeight: 700, lineHeight: 1 }}>
                {s.compression_ratio.max.toFixed(4)}
              </span>
            </div>
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)', fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
              MAX STAGE PRESSURE RISE
            </div>
          </div>

          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 6,
            padding: '22px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div style={{ height: 44, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ font: '10px var(--mono)', color: 'var(--faint)', letterSpacing: '0.08em' }}>04 / POPULATION</span>
                <span style={{ font: '10px var(--mono)', color: 'var(--teal-bright)', fontWeight: 600 }}>NON-DOMINATED</span>
              </div>
              <div style={{ color: 'var(--paper)', fontSize: 15, fontWeight: 700, marginTop: 4 }}>非支配候选解数</div>
            </div>
            <div style={{ height: 48, display: 'flex', alignItems: 'center' }}>
              <span className="num" style={{ color: 'var(--paper)', fontSize: 36, fontWeight: 700, lineHeight: 1 }}>
                100 <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--muted)' }}>sets</span>
              </span>
            </div>
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)', fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
              NSGA-II 200 GENERATIONS
            </div>
          </div>
        </div>

        {/* 03. 主交互工作区 (底部绝对对齐) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isNarrow ? '1fr' : 'minmax(0, 1.2fr) minmax(360px, 0.95fr)',
          gap: 20,
          alignItems: 'stretch'
        }}>
          
          {/* 左侧：Plotly Pareto 权衡散点图 */}
          <motion.div
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 6,
              padding: '22px 20px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                flexWrap: 'wrap',
                gap: 12
              }}>
                <div>
                  <div style={{ color: 'var(--faint)', font: '10px var(--mono)', letterSpacing: '0.12em' }}>
                    PARETO FRONTIER SCATTER / 散点权衡空间
                  </div>
                  <div style={{ color: 'var(--paper)', fontSize: 14, fontWeight: 700, marginTop: 2 }}>
                    质量流量 ṁ × 等熵效率 η 权衡分布 {currentGen ? `(GEN ${currentGen.generation})` : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ color: 'var(--faint)', font: '10px var(--mono)', marginRight: 4 }}>着色维度:</span>
                  {[
                    ['Compression_ratio', '总压比 π', 'var(--teal-bright)'],
                    ['Efficiency', '等熵效率 η', 'var(--yellow)'],
                    ['Massflow', '质量流量 ṁ', 'var(--rust)']
                  ].map(([key, label, color]) => {
                    const active = colorDim === key
                    return (
                      <button
                        key={key}
                        onClick={() => setColorDim(key)}
                        style={{
                          padding: '6px 12px',
                          color: active ? '#0b0e0d' : 'var(--paper)',
                          background: active ? color : 'var(--ink)',
                          border: `1px solid ${active ? color : 'var(--line)'}`,
                          borderRadius: 4,
                          cursor: 'pointer',
                          font: '11px var(--mono)',
                          fontWeight: 600,
                          transition: 'all 0.2s'
                        }}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 散点图视口 (柔和网格、无白边圆点、金色菱形基准) */}
              <Plot
                data={plot}
                layout={{
                  autosize: true,
                  height: 440,
                  margin: { l: 65, r: 20, t: 20, b: 60 },
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: 'rgba(0,0,0,0)',
                  font: { family: 'DM Mono, monospace', color: 'var(--muted)', size: 10 },
                  xaxis: {
                    title: '质量流量 ṁ (kg/s)',
                    gridcolor: 'rgba(255, 255, 255, 0.05)',
                    zeroline: false,
                    tickfont: { color: 'var(--muted)' }
                  },
                  yaxis: {
                    title: '等熵绝热效率 η',
                    gridcolor: 'rgba(255, 255, 255, 0.05)',
                    zeroline: false,
                    tickfont: { color: 'var(--muted)' }
                  },
                  showlegend: false
                }}
                config={{ displayModeBar: false, responsive: true }}
                useResizeHandler
                style={{ width: '100%' }}
                onClick={e => {
                  const p = e.points?.[0]
                  if (p?.pointIndex != null && currentGen?.solutions?.[p.pointIndex]) {
                    setSelected(currentGen.solutions[p.pointIndex])
                  }
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: 16,
              alignItems: 'center',
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid var(--line)',
              fontSize: '11px',
              fontFamily: 'var(--mono)',
              color: 'var(--muted)',
              flexWrap: 'wrap'
            }}>
              <span style={{ color: 'var(--teal-bright)', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                <MousePointerClick size={12} /> 点击任意散点即可选定该候选解
              </span>
              <span style={{ color: 'var(--line-strong)' }}>|</span>
              <span style={{ color: 'var(--yellow)' }}>◆ 金色菱形为训练集均值 Baseline</span>
            </div>
          </motion.div>

          {/* 右侧：候选解检查器 + 3D 叶片数字孪生 (与左侧高度绝对拉平) */}
          <motion.aside
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 16,
              height: '100%'
            }}
          >
            {/* 选中候选卡片 */}
            <div style={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 6,
              padding: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <div style={{ color: 'var(--yellow)', font: '10px var(--mono)', letterSpacing: '0.12em' }}>
                    SELECTED PARETO CANDIDATE
                  </div>
                  <div style={{ color: 'var(--paper)', fontSize: 16, fontWeight: 700, marginTop: 2 }}>
                    候选设计 #{selected?.design_id ?? 'Selected'}
                  </div>
                </div>
                <span style={{
                  color: 'var(--teal-bright)',
                  font: '10px var(--mono)',
                  letterSpacing: '0.06em',
                  fontWeight: 600
                }}>
                  ACTIVE
                </span>
              </div>

              {selected ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  <div style={{ padding: '10px 8px', background: 'var(--ink)', border: '1px solid var(--line)', borderRadius: 4, textAlign: 'center' }}>
                    <div style={{ color: 'var(--faint)', fontSize: 10 }}>等熵效率 η</div>
                    <div className="num" style={{ color: 'var(--yellow)', fontSize: 16, fontWeight: 700, marginTop: 4 }}>
                      {selected.Efficiency.toFixed(4)}
                    </div>
                  </div>

                  <div style={{ padding: '10px 8px', background: 'var(--ink)', border: '1px solid var(--line)', borderRadius: 4, textAlign: 'center' }}>
                    <div style={{ color: 'var(--faint)', fontSize: 10 }}>质量流量 ṁ</div>
                    <div className="num" style={{ color: 'var(--teal-bright)', fontSize: 16, fontWeight: 700, marginTop: 4 }}>
                      {selected.Massflow.toFixed(2)} <span style={{ fontSize: 9, color: 'var(--faint)' }}>kg/s</span>
                    </div>
                  </div>

                  <div style={{ padding: '10px 8px', background: 'var(--ink)', border: '1px solid var(--line)', borderRadius: 4, textAlign: 'center' }}>
                    <div style={{ color: 'var(--faint)', fontSize: 10 }}>级总压比 π</div>
                    <div className="num" style={{ color: 'var(--rust)', fontSize: 16, fontWeight: 700, marginTop: 4 }}>
                      {selected.Compression_ratio.toFixed(4)}
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--muted)', fontSize: 12 }}>请在左侧散点图中点选候选点。</p>
              )}

              {/* 激波波阻机理解析 (老詹 2.1) */}
              <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--ink)', border: '1px solid var(--line)', borderRadius: 4, color: 'var(--yellow)', fontSize: '11px', fontFamily: 'var(--mono)', lineHeight: 1.6 }}>
                💡 气动权衡机理：大流量高做功下叶栅喉部超音速激波增强（Wave Drag 波阻增大）诱发吸力面分离，是等熵效率向大流量侧跌落的物理根因。
              </div>
            </div>

            {/* 3D 叶片数字孪生视口 */}
            <div style={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 6,
              overflow: 'hidden',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{
                padding: '10px 16px',
                borderBottom: '1px solid var(--line)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ font: '11px var(--mono)', color: 'var(--paper)', fontWeight: 600 }}>
                  3D BLADE MESH RECONSTRUCTION
                </span>
                <span style={{ font: '10px var(--mono)', color: 'var(--faint)' }}>
                  DRAG TO ROTATE
                </span>
              </div>
              <BladeViewer3D
                params={selected?.features || {}}
                efficiency={selected?.Efficiency}
                pressureRatio={selected?.Compression_ratio}
                massflow={selected?.Massflow}
                height={220}
              />
            </div>

            {/* 证据定性提示 */}
            <div style={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 6,
              padding: '14px 18px',
              fontSize: '11px',
              color: 'var(--faint)',
              lineHeight: 1.6
            }}>
              <strong style={{ color: 'var(--paper)' }}>科学边界声明：</strong> 当前 Pareto 候选由 NSGA-II 算法与残差物理代理网络粗筛生成（E2 级），尚未进行细网格 RANS CFD 正式物理闭环。
            </div>

          </motion.aside>
        </div>

        {/* 04. 底部：NSGA-II 算法演化收敛控制台 (全面激活动态回放与指标联动) */}
        <section style={{
          marginTop: 24,
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 6,
          padding: '22px 24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div>
              <div style={{ color: 'var(--yellow)', font: '10px var(--mono)', letterSpacing: '0.12em' }}>
                EVOLUTION TRAJECTORY CONTROLLER / 算法演化收敛控制台
              </div>
              <div style={{ color: 'var(--paper)', fontSize: 15, fontWeight: 700, marginTop: 2 }}>
                NSGA-II 200 代遗传演化历程动态回放
              </div>
            </div>

            {/* 控制按钮组 */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                onClick={togglePlay}
                className="btn-primary"
                style={{ height: 38, padding: '0 18px', fontSize: 12 }}
              >
                {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                <span>{isPlaying ? '暂停演化 / Pause' : '回放进化历程 / Play'}</span>
              </button>

              <button
                onClick={() => { setIsPlaying(false); setGenIndex(0) }}
                className="btn-secondary"
                style={{ height: 38, padding: '0 14px', fontSize: 12 }}
                title="复位到初始种群 Gen 1"
              >
                <RotateCcw size={12} />
                <span>复位 Gen 1</span>
              </button>

              <button
                onClick={() => { setIsPlaying(false); setGenIndex((evolution?.length || 1) - 1) }}
                className="btn-secondary"
                style={{ height: 38, padding: '0 14px', fontSize: 12 }}
                title="跳至最终代 Gen 200"
              >
                <FastForward size={12} />
                <span>最终代 Gen 200</span>
              </button>
            </div>
          </div>

          {/* 时间轴滑块与实时指标阵列 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isNarrow ? '1fr' : '1fr 380px',
            gap: 24,
            alignItems: 'center',
            paddingTop: 8
          }}>
            {/* 左侧：连续时间轴滑动条 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--mono)', marginBottom: 8 }}>
                <span style={{ color: 'var(--faint)' }}>初始随机种群 (GEN 1)</span>
                <span style={{ color: 'var(--yellow)', fontWeight: 700 }}>
                  当前帧：第 {currentGen?.generation ?? 200} 代 (GEN {currentGen?.generation ?? 200})
                </span>
                <span style={{ color: 'var(--teal-bright)' }}>收敛前沿 (GEN 200)</span>
              </div>

              <input
                type="range"
                min={0}
                max={(evolution?.length || 1) - 1}
                step={1}
                value={genIndex}
                onChange={e => {
                  setIsPlaying(false)
                  setGenIndex(Number(e.target.value))
                }}
                style={{
                  width: '100%',
                  accentColor: 'var(--yellow)',
                  cursor: 'pointer',
                  height: 6
                }}
              />

              <div style={{ color: 'var(--faint)', font: '9px var(--mono)', marginTop: 8 }}>
                * 种群多样性保持：NSGA-II 拥挤度比较算子 (Crowding Distance) 有效避免了前沿局部簇拥与早熟收敛，100 组解全域均匀展开。
              </div>
            </div>

            {/* 右侧：当前代数实时收敛状态胶囊 (含 Goldberg 3.1 超体积指标) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
              background: 'var(--ink)',
              padding: '10px 14px',
              borderRadius: 4,
              border: '1px solid var(--line)'
            }}>
              <div>
                <div style={{ color: 'var(--faint)', font: '9px var(--mono)' }}>当前代数</div>
                <div className="num" style={{ color: 'var(--yellow)', fontSize: 13, fontWeight: 700, marginTop: 2 }}>
                  GEN {currentGen?.generation ?? 200}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--faint)', font: '9px var(--mono)' }}>非支配解数</div>
                <div className="num" style={{ color: 'var(--paper)', fontSize: 13, fontWeight: 700, marginTop: 2 }}>
                  {currentGenStats.n} 个
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--faint)', font: '9px var(--mono)' }}>平均绝热效率</div>
                <div className="num" style={{ color: 'var(--teal-bright)', fontSize: 13, fontWeight: 700, marginTop: 2 }}>
                  {currentGenStats.avgEta.toFixed(4)}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--faint)', font: '9px var(--mono)' }}>超体积 HV</div>
                <div className="num" style={{ color: 'var(--faint)', fontSize: 13, fontWeight: 700, marginTop: 2 }}>
                  —
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </main>
  )
}
