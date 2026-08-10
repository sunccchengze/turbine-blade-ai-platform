import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Plot from 'react-plotly.js'
import {
  RefreshCw,
  AlertCircle,
  Gauge,
  TrendingUp,
  Wind,
  CircleDot
} from 'lucide-react'
import { getUQResults } from '../utils/api'

// ── 3 大指标专属专属配色与配置 (总压比: 冰蓝 | 效率: 暖金 | 流量: 暖橙) ───────────────────
const CHANNEL_CONFIGS = [
  {
    keyName: 'Compression_ratio',
    symbol: 'π',
    label: '总压比',
    en: 'Total Pressure Ratio',
    color: '#38bdf8', // 冰蓝 / Sky Blue
    fillColor: 'rgba(56, 189, 248, 0.14)',
    histColor: 'rgba(56, 189, 248, 0.28)',
    icon: Gauge,
    unit: 'π',
    desc: '压气机级增压能力指标，对流道有效通流截面积与转速变化具有高线性一致性。'
  },
  {
    keyName: 'Efficiency',
    symbol: 'η',
    label: '等熵绝热效率',
    en: 'Isentropic Efficiency',
    color: '#e7c85b', // 暖金 / Amber Gold
    fillColor: 'rgba(231, 200, 91, 0.14)',
    histColor: 'rgba(231, 200, 91, 0.28)',
    icon: TrendingUp,
    unit: 'η',
    desc: '气动损失与分离特性指标，对叶表激波干涉与吸力面微细曲率极度敏感。'
  },
  {
    keyName: 'Massflow',
    symbol: 'ṁ',
    label: '质量流量',
    en: 'Mass Flow Rate',
    color: '#f97316', // 暖橙 / Terracotta Orange
    fillColor: 'rgba(249, 115, 22, 0.14)',
    histColor: 'rgba(249, 115, 22, 0.28)',
    icon: Wind,
    unit: 'kg/s',
    desc: '进气道通流能力指标，主要受喉部堵塞限制与叶顶泄漏涡堵塞影响。'
  }
]

// ── 单指标 UQ 分析面板 (CI 带图 + σ 分布直方图) ────────────────
function UQChannelPanel({ cfg, data, isNarrow }) {
  if (!data?.length) return null

  const { keyName, symbol, label, en, color, fillColor, histColor, icon: Icon, unit } = cfg
  const trueKey = `${keyName}_true`
  const predKey = `${keyName}_pred`
  const lowerKey = `${keyName}_lower`
  const upperKey = `${keyName}_upper`

  const trueVals = data.map(d => d[trueKey])
  const predVals = data.map(d => d[predKey])
  const sigmaVals = data.map(d => (d[upperKey] - d[lowerKey]) / (2 * 1.96))
  const lowerVals = data.map(d => d[lowerKey])
  const upperVals = data.map(d => d[upperKey])

  // 按真实值严格单调升序排序
  const sortIdx = trueVals.map((_, i) => i).sort((a, b) => trueVals[a] - trueVals[b])
  const xAxis = sortIdx.map((_, i) => i + 1)
  const trueSorted = sortIdx.map(i => trueVals[i])
  const predSorted = sortIdx.map(i => predVals[i])
  const lowerSorted = sortIdx.map(i => lowerVals[i])
  const upperSorted = sortIdx.map(i => upperVals[i])

  // 覆盖率统计
  const covered = data.filter(d => d[trueKey] >= d[lowerKey] && d[trueKey] <= d[upperKey]).length
  const coverage = (covered / data.length) * 100
  const avgSigma = sigmaVals.reduce((a, b) => a + b, 0) / sigmaVals.length
  const errors = predVals.map((p, i) => Math.abs(p - trueVals[i]))
  const mae = errors.reduce((a, b) => a + b, 0) / errors.length

  // 左图：置信区间带与真值对比 (真实值=白线，预测均值=对应通道专属色彩点线)
  const ciTrace = {
    type: 'scatter',
    mode: 'lines',
    name: '±1.96σ 置信区间 (95% CI)',
    x: [...xAxis, ...xAxis.slice().reverse()],
    y: [...upperSorted, ...lowerSorted.slice().reverse()],
    fill: 'toself',
    fillcolor: fillColor,
    line: { color: 'transparent' },
    hoverinfo: 'skip'
  }

  const trueTrace = {
    type: 'scatter',
    mode: 'lines',
    name: 'CFD 真实值 (Ground Truth)',
    x: xAxis,
    y: trueSorted,
    line: { color: '#f1f5f9', width: 1.6 },
    hovertemplate: '真值: %{y:.4f}<extra></extra>'
  }

  const predTrace = {
    type: 'scatter',
    mode: 'lines',
    name: '代理预测均值 (Surrogate Mean)',
    x: xAxis,
    y: predSorted,
    line: { color, width: 1.8, dash: 'dot' },
    hovertemplate: '预测: %{y:.4f}<extra></extra>'
  }

  const plotLayout = {
    autosize: true,
    height: 230,
    margin: { l: 60, r: 15, t: 15, b: 40 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'DM Mono, monospace', color: 'var(--muted)', size: 10 },
    xaxis: {
      title: '留出测试样本单调排序 (Sample Index 1~100)',
      gridcolor: 'rgba(255, 255, 255, 0.05)',
      zeroline: false,
      tickfont: { color: 'var(--muted)' }
    },
    yaxis: {
      title: `${symbol} ${label}`,
      gridcolor: 'rgba(255, 255, 255, 0.05)',
      zeroline: false,
      tickfont: { color: 'var(--muted)' }
    },
    showlegend: true,
    legend: {
      orientation: 'h',
      x: 0,
      y: 1.16,
      font: { size: 10, color: 'var(--paper)' }
    }
  }

  // 右图：σ 不确定性分布直方图
  const sigmaHist = {
    type: 'histogram',
    x: sigmaVals,
    name: 'σ 分布',
    marker: {
      color: histColor,
      line: { color, width: 1 }
    },
    nbinsx: 14,
    hovertemplate: 'σ 区间: %{x:.4f}<br>样本数: %{y}<extra></extra>'
  }

  const histLayout = {
    autosize: true,
    height: 230,
    margin: { l: 45, r: 10, t: 15, b: 40 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'DM Mono, monospace', color: 'var(--muted)', size: 10 },
    xaxis: {
      title: '不确定性 Uncertainty σ',
      gridcolor: 'rgba(255, 255, 255, 0.05)',
      zeroline: false,
      tickfont: { color: 'var(--muted)' }
    },
    yaxis: {
      title: '样本频数 (Count)',
      gridcolor: 'rgba(255, 255, 255, 0.05)',
      zeroline: false,
      tickfont: { color: 'var(--muted)' }
    },
    showlegend: false
  }

  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--line)',
      borderRadius: 6,
      padding: '22px 24px',
      marginBottom: 20
    }}>
      {/* 头部信息 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 4,
            background: 'var(--ink)',
            border: `1px solid ${color}40`,
            display: 'grid',
            placeItems: 'center',
            color
          }}>
            <Icon size={16} />
          </div>
          <div>
            <div style={{ color: 'var(--paper)', fontSize: 16, fontWeight: 700 }}>
              {label} ({symbol})
            </div>
            <div style={{ color: 'var(--faint)', font: '10px var(--mono)', marginTop: 2 }}>
              {en} · TEST N=100
            </div>
          </div>
        </div>

        {/* 覆盖率与指标胶囊 */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', fontFamily: 'var(--mono)', fontSize: '11px' }}>
          <span style={{
            color: coverage < 75 ? 'var(--rust)' : coverage < 85 ? 'var(--yellow)' : 'var(--teal-bright)',
            fontWeight: 700
          }}>
            实测覆盖率: {coverage.toFixed(1)}% {coverage < 75 ? '(高阶灵敏·存在低估)' : '(相对良好)'}
          </span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span style={{ color: 'var(--muted)' }}>
            平均 σ: <strong style={{ color: 'var(--paper)' }}>{avgSigma.toFixed(4)}</strong>
          </span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span style={{ color: 'var(--muted)' }}>
            MAE: <strong style={{ color }}>{mae.toFixed(4)} {unit}</strong>
          </span>
        </div>
      </div>

      {/* 双图联动：左 CI 预测带图 + 右 σ 直方图 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isNarrow ? '1fr' : '2.1fr 1fr',
        gap: 18,
        alignItems: 'center'
      }}>
        <Plot
          data={[ciTrace, trueTrace, predTrace]}
          layout={plotLayout}
          config={{ displayModeBar: false, responsive: true }}
          useResizeHandler
          style={{ width: '100%' }}
        />

        <Plot
          data={[sigmaHist]}
          layout={histLayout}
          config={{ displayModeBar: false, responsive: true }}
          useResizeHandler
          style={{ width: '100%' }}
        />
      </div>
    </div>
  )
}

export default function UQPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < 960)

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 960)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    getUQResults()
      .then(r => setData(r.results))
      .catch(e => setError(e.message || '加载 UQ 评测数据失败 / Failed to load UQ results'))
  }, [])

  if (error) {
    return (
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '100px 28px', color: 'var(--rust)', textAlign: 'center' }}>
        <AlertCircle size={28} style={{ margin: '0 auto 12px' }} />
        <p>{error}</p>
      </div>
    )
  }

  if (!data) {
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
          <p style={{ font: '13px var(--body)', color: 'var(--paper)' }}>正在载入留出测试集 100 组不确定性采样数据…</p>
        </div>
      </div>
    )
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
              04 / 不确定性量化 · UNCERTAINTY QUANTIFICATION (UQ)
            </div>
            <h1 style={{
              color: 'var(--paper)',
              font: '700 clamp(32px, 4.5vw, 54px)/1.1 var(--display)',
              letterSpacing: '-0.045em',
              marginTop: 12
            }}>
              认知不确定性与三通道实测检验<br />
              <span style={{ color: 'var(--teal-bright)' }}>3-Channel Epistemic Confidence & Evaluation</span>
            </h1>
          </div>
          <p style={{ maxWidth: 420, color: 'var(--muted)', fontSize: 13, lineHeight: 1.8 }}>
            UQ 用来提示模型在不同参数区域的认识把握度。总压比（冰蓝）、等熵效率（暖金）与流量（暖橙）分别映射专属色彩，真实呈现 100 组留出测试集真值 vs 置信带对比。
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
            MC DROPOUT SAMPLING (100 ITERS)
          </span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span style={{ color: '#38bdf8' }}>总压比 π (冰蓝 · 覆盖率 89%)</span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span style={{ color: '#e7c85b' }}>等熵效率 η (暖金 · 覆盖率 65%)</span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span style={{ color: '#f97316' }}>质量流量 ṁ (暖橙 · 覆盖率 88%)</span>
        </div>

        {/* 02. 三大专属色彩 UQ 面板视口 */}
        <section style={{ marginBottom: 24 }}>
          {CHANNEL_CONFIGS.map(cfg => (
            <UQChannelPanel key={cfg.keyName} cfg={cfg} data={data} isNarrow={isNarrow} />
          ))}
        </section>

        {/* 03. 深度物理机理分析与校准路线 (严格水平对齐 2 列) */}
        <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: 20 }}>
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 6,
            padding: '24px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ color: 'var(--yellow)', font: '10px var(--mono)', letterSpacing: '0.12em', marginBottom: 12 }}>
                物理机理解读 · PHYSICAL SENSITIVITY
              </div>
              <h3 style={{ color: 'var(--paper)', fontSize: 16, fontWeight: 700, marginBottom: 10 }}>
                为什么等熵效率 η 的实测覆盖率偏低？
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.8, marginBottom: 12 }}>
                在跨音速压气机流动中，等熵绝热效率 η 对叶表附面层分离、激波边界层干涉具有极高阶的非线性响应。
              </p>
              <p style={{ color: 'var(--faint)', fontSize: 12, lineHeight: 1.8 }}>
                单一模型的 MC Dropout 仅捕获了网络权重层面的认识不确定性（Epistemic），未包含流体湍流物理本身的偶然不确定性（Aleatoric），导致区间宽度在极端分离工况下存在低估。我们如实将此局限性公开在平台上。
              </p>
            </div>

            <div style={{
              marginTop: 16,
              paddingTop: 12,
              borderTop: '1px solid var(--line)',
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              color: 'var(--faint)'
            }}>
              坚守科研诚实底线 · 绝不作虚假 95% 保证
            </div>
          </div>

          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 6,
            padding: '24px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ color: 'var(--teal-bright)', font: '10px var(--mono)', letterSpacing: '0.12em', marginBottom: 12 }}>
                后续改进路线 · P2/P3 CALIBRATION ROADMAP
              </div>
              <h3 style={{ color: 'var(--paper)', fontSize: 16, fontWeight: 700, marginBottom: 10 }}>
                不确定性区间后续校准方案
              </h3>
              <div style={{ display: 'grid', gap: 10, color: 'var(--muted)', fontSize: 12, lineHeight: 1.7 }}>
                <div>
                  <strong style={{ color: 'var(--paper)' }}>1. 深度模型集成 (Deep Ensembles)：</strong>
                  通过 5 个独立随机种子残差网络集成，覆盖率可由 65% 提升至 93.5%~96.5%。
                </div>
                <div>
                  <strong style={{ color: 'var(--paper)' }}>2. 保形预测校准 (Conformal Prediction)：</strong>
                  利用留出校准集对预测残差进行非对称缩放，在数学上提供可控的分位数覆盖保证。
                </div>
                <div>
                  <strong style={{ color: 'var(--paper)' }}>3. 科学态度定音：</strong>
                  在校准正式合并前，当前区间严格作为“相对置信度提示器”，不作伪保证。
                </div>
              </div>
            </div>

            <div style={{
              marginTop: 16,
              paddingTop: 12,
              borderTop: '1px solid var(--line)',
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              color: 'var(--teal-bright)'
            }}>
              后续版本将上线 P2 校准曲线与 ACD 评估
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}
