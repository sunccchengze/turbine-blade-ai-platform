import { useEffect, useMemo, useState } from 'react'
import Plot from 'react-plotly.js'
import { motion } from 'framer-motion'
import {
  RefreshCw,
  CircleDot,
  MousePointerClick,
} from 'lucide-react'
import BladeViewer3D from '../components/BladeViewer3D'
import { getParetoEvolution, getParetoFront, getTrainingStats } from '../utils/api'

export default function OptimizePage() {
  const [data, setData] = useState(null)
  const [stats, setStats] = useState(null)
  const [evolution, setEvolution] = useState(null)
  const [selected, setSelected] = useState(null)
  const [colorDim, setColorDim] = useState('Compression_ratio')
  const [selectedGen, setSelectedGen] = useState(20)
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < 960)

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
        setEvolution(e.generations)
        // 默认选中最高效率候选
        const bestEta = p.pareto_front.reduce((a, b) => (a.Efficiency > b.Efficiency ? a : b))
        setSelected(bestEta)
      })
  }, [])

  // 构造三目标散点数据
  const plot = useMemo(() => {
    if (!data) return []
    const vals = data.pareto_front.map(d => d[colorDim])
    const colorTitle = colorDim === 'Compression_ratio' ? '总压比 π' : colorDim === 'Efficiency' ? '等熵效率 η' : '流量 ṁ (kg/s)'

    return [
      {
        x: data.pareto_front.map(d => d.Massflow),
        y: data.pareto_front.map(d => d.Efficiency),
        mode: 'markers',
        type: 'scatter',
        name: 'Pareto 预测候选',
        marker: {
          size: 9,
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
        text: data.pareto_front.map(d => `[候选 #${d.design_id}]<br>等熵效率 η: ${d.Efficiency.toFixed(4)}<br>质量流量 ṁ: ${d.Massflow.toFixed(2)} kg/s<br>总压比 π: ${d.Compression_ratio.toFixed(4)}`),
        hovertemplate: '%{text}<extra></extra>'
      },
      // 当前选中的高亮标记
      selected ? {
        x: [selected.Massflow],
        y: [selected.Efficiency],
        mode: 'markers',
        type: 'scatter',
        name: `当前选中 #${selected.design_id}`,
        marker: {
          symbol: 'circle-open-dot',
          size: 18,
          color: '#ffffff',
          line: { color: 'var(--yellow)', width: 2 }
        },
        hovertemplate: `已选候选 #${selected.design_id}<extra></extra>`
      } : null,
      // 训练集均值基准点 (金色菱形)
      stats ? {
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
      } : null
    ].filter(Boolean)
  }, [data, colorDim, stats, selected])

  if (!data || !stats) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--ink)'
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
              帕累托前沿多学科权衡<br />
              <span style={{ color: 'var(--teal-bright)' }}>Pareto Trade-Offs & Blade Reconstruction</span>
            </h1>
          </div>
          <p style={{ maxWidth: 420, color: 'var(--muted)', fontSize: 13, lineHeight: 1.8 }}>
            NSGA-II 遗传算法在 74 维设计空间中搜索得到 100 组非支配候选解。在效率、流量与总压比之间权衡取舍，点击任意候选实时重构对应 3D 空间叶型。
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
            NSGA-II 100 PARETO CANDIDATES
          </span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span>约束条件: π ≥ 1.80 · η ≥ 0.84</span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span>进化代数: 20 GENERATIONS</span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span style={{ color: 'var(--yellow)' }}>点击图上任意散点查看局部 3D 几何</span>
        </div>

        {/* 02. 4 大核心指标卡片 (严格水平基线对齐) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 16,
          marginBottom: 24
        }}>
          {/* Card 1 */}
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

          {/* Card 2 */}
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
              CHOKING FLOW CAPACITY
            </div>
          </div>

          {/* Card 3 */}
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

          {/* Card 4 */}
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
              NSGA-II 20 GENERATIONS
            </div>
          </div>
        </div>

        {/* 03. 主交互工作区：三目标 Pareto 散点流场 + 3D 叶片数字孪生检查器 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isNarrow ? '1fr' : 'minmax(0, 1.25fr) minmax(360px, 0.95fr)',
          gap: 20,
          alignItems: 'start'
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
                  质量流量 ṁ × 等熵效率 η 权衡分布
                </div>
              </div>

              {/* 色彩维度选择器 */}
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

            {/* 散点图视口 */}
            <Plot
              data={plot}
              layout={{
                autosize: true,
                height: 460,
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
                if (p?.pointIndex != null && data?.pareto_front?.[p.pointIndex]) {
                  setSelected(data.pareto_front[p.pointIndex])
                }
              }}
            />

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
              <span style={{ color: 'var(--faint)' }}>所有散点均为残差代理网络预测值</span>
            </div>
            </div>
          </motion.div>

          {/* 右侧：选中候选点检查器与 3D 叶片数字孪生 */}
          <motion.aside
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 }}
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16, height: '100%' }}
          >
            {/* 选中候选卡片 */}
            <div style={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 6,
              padding: '22px 20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ color: 'var(--yellow)', font: '10px var(--mono)', letterSpacing: '0.12em' }}>
                    SELECTED PARETO CANDIDATE
                  </div>
                  <div style={{ color: 'var(--paper)', fontSize: 16, fontWeight: 700, marginTop: 2 }}>
                    候选设计 #{selected?.design_id ?? '—'}
                  </div>
                </div>
                <span style={{
                  color: 'var(--teal-bright)',
                  font: '10px var(--mono)',
                  letterSpacing: '0.06em',
                  fontWeight: 600
                }}>
                  ACTIVE SELECTION
                </span>
              </div>

              {selected ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    padding: '10px 12px',
                    background: 'var(--ink)',
                    border: '1px solid var(--line)',
                    borderRadius: 4
                  }}>
                    <span style={{ color: 'var(--muted)', fontSize: 12 }}>等熵效率 η</span>
                    <span className="num" style={{ color: 'var(--yellow)', fontSize: 18, fontWeight: 700 }}>
                      {selected.Efficiency.toFixed(4)}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    padding: '10px 12px',
                    background: 'var(--ink)',
                    border: '1px solid var(--line)',
                    borderRadius: 4
                  }}>
                    <span style={{ color: 'var(--muted)', fontSize: 12 }}>质量流量 ṁ</span>
                    <span className="num" style={{ color: 'var(--teal-bright)', fontSize: 18, fontWeight: 700 }}>
                      {selected.Massflow.toFixed(2)} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--muted)' }}>kg/s</span>
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    padding: '10px 12px',
                    background: 'var(--ink)',
                    border: '1px solid var(--line)',
                    borderRadius: 4
                  }}>
                    <span style={{ color: 'var(--muted)', fontSize: 12 }}>级总压比 π</span>
                    <span className="num" style={{ color: 'var(--rust)', fontSize: 18, fontWeight: 700 }}>
                      {selected.Compression_ratio.toFixed(4)}
                    </span>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--muted)', fontSize: 12 }}>请在左侧散点图中点选候选点。</p>
              )}
            </div>

            {/* 3D 叶片数字孪生实时渲染视口 */}
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
              padding: '16px 18px',
              fontSize: '11px',
              color: 'var(--faint)',
              lineHeight: 1.7
            }}>
              <strong style={{ color: 'var(--paper)' }}>科学边界声明：</strong> 当前 Pareto 候选由 NSGA-II 与代理模型粗筛生成（E2 级），尚未进行细网格 RANS CFD 正式物理闭环，不应直接表述为工程定型叶片。
            </div>

          </motion.aside>
        </div>

        {/* 04. 底部：20 代 NSGA-II 种群进化历程时间线 */}
        <section style={{
          marginTop: 24,
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 6,
          padding: '24px 22px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <div style={{ color: 'var(--yellow)', font: '10px var(--mono)', letterSpacing: '0.12em' }}>
                EVOLUTION TRAJECTORY / 种群收敛历程
              </div>
              <div style={{ color: 'var(--paper)', fontSize: 15, fontWeight: 700, marginTop: 2 }}>
                NSGA-II 20 代进化收敛历程
              </div>
            </div>
            <span style={{ font: '10px var(--mono)', color: 'var(--faint)' }}>
              20 GENS · 100 INDIVIDUALS PER GEN
            </span>
          </div>

          <div style={{
            display: 'flex',
            gap: 10,
            overflowX: 'auto',
            paddingBottom: 8
          }}>
            {(evolution || []).map(g => {
              const active = selectedGen === g.generation
              return (
                <div
                  key={g.generation}
                  onClick={() => setSelectedGen(g.generation)}
                  style={{
                    flex: '0 0 110px',
                    padding: '12px 14px',
                    background: active ? 'rgba(231,200,91,0.08)' : 'var(--ink)',
                    border: `1px solid ${active ? 'var(--yellow)' : 'var(--line)'}`,
                    borderRadius: 4,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div className="num" style={{ color: active ? 'var(--yellow)' : 'var(--muted)', fontSize: 12, fontWeight: 700 }}>
                    GEN {g.generation}
                  </div>
                  <div style={{ color: 'var(--faint)', fontSize: 10, fontFamily: 'var(--mono)', marginTop: 4 }}>
                    {g.n_solutions} solutions
                  </div>
                </div>
              )
            })}
          </div>
        </section>

      </div>
    </main>
  )
}
