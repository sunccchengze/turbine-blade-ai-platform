import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Plot from 'react-plotly.js'
import {
  RefreshCw, AlertCircle,
  Shield, Info, TrendingUp, Gauge, Wind
} from 'lucide-react'
import { getUQResults } from '../utils/api'

// ── 覆盖率徽章 ─────────────────────────────────────────────
function CoverageBadge({ value }) {
  const good = value >= 85
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 8px', borderRadius: '9999px',
      fontSize: '11px', fontWeight: 600,
      background: good ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)',
      color: good ? '#34d399' : '#fbbf24',
      border: `1px solid ${good ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)'}`,
    }}>
      覆盖率 {value.toFixed(1)}%
    </span>
  )
}

// ── 单指标 UQ 分析面板 ─────────────────────────────────────
function UQPanel({ label, trueKey, predKey, sigmaKey, lowerKey, upperKey,
                   color, icon: Icon, data, isNarrow }) {
  if (!data?.length) return null

  const trueVals  = data.map(d => d[trueKey])
  const predVals  = data.map(d => d[predKey])
  const sigmaVals = data.map(d => d[sigmaKey])
  const lowerVals = data.map(d => d[lowerKey])
  const upperVals = data.map(d => d[upperKey])

  // 按真实值排序
  const sortIdx  = trueVals.map((_, i) => i).sort((a, b) => trueVals[a] - trueVals[b])
  const xAxis    = sortIdx.map((_, i) => i)
  const trueSorted  = sortIdx.map(i => trueVals[i])
  const predSorted  = sortIdx.map(i => predVals[i])
  const lowerSorted = sortIdx.map(i => lowerVals[i])
  const upperSorted = sortIdx.map(i => upperVals[i])

  // 覆盖率
  const covered  = data.filter((d) =>
    d[trueKey] >= d[lowerKey] && d[trueKey] <= d[upperKey]
  ).length
  const coverage = (covered / data.length) * 100

  // 平均 sigma
  const avgSigma = sigmaVals.reduce((a, b) => a + b, 0) / sigmaVals.length

  // 误差
  const errors   = predVals.map((p, i) => Math.abs(p - trueVals[i]))
  const mae      = errors.reduce((a, b) => a + b, 0) / errors.length

  // 置信区间带图
  const ciTrace = {
    type: 'scatter',
    mode: 'lines',
    name: '95% 置信区间 CI',
    x: [...xAxis, ...xAxis.slice().reverse()],
    y: [...upperSorted, ...lowerSorted.slice().reverse()],
    fill: 'toself',
    fillcolor: `${color}18`,
    line: { color: 'transparent' },
    hoverinfo: 'skip',
  }

  const trueTrace = {
    type: 'scatter', mode: 'lines',
    name: '真实值 True',
    x: xAxis, y: trueSorted,
    line: { color: '#f1f5f9', width: 1.5 },
    hovertemplate: `True: %{y:.5f}<extra></extra>`,
  }

  const predTrace = {
    type: 'scatter', mode: 'lines',
    name: '预测均值 Predicted',
    x: xAxis, y: predSorted,
    line: { color, width: 1.5, dash: 'dot' },
    hovertemplate: `Pred: %{y:.5f}<extra></extra>`,
  }

  const layout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor:  'rgba(0,0,0,0)',
    font: { color: '#94a3b8', size: 10 },
    xaxis: {
      title: { text: '测试样本（按真实值排序）Test Samples', font: { color: '#64748b', size: 11 } },
      gridcolor: 'rgba(255,255,255,0.03)',
      tickfont: { color: '#475569' },
    },
    yaxis: {
      title: { text: label, font: { color: '#64748b', size: 11 } },
      gridcolor: 'rgba(255,255,255,0.03)',
      tickfont: { color: '#475569' },
    },
    legend: {
      bgcolor: 'rgba(15,23,42,0.8)',
      bordercolor: 'rgba(255,255,255,0.05)',
      borderwidth: 1,
      font: { color: '#94a3b8', size: 10 },
      orientation: 'h',
      y: -0.2,
    },
    margin: { t: 10, b: 60, l: 60, r: 10 },
    hoverlabel: {
      bgcolor: '#1e293b',
      bordercolor: `${color}50`,
      font: { color: '#e2e8f0', size: 11 },
    },
  }

  // Sigma 分布直方图
  const sigmaHist = {
    type: 'histogram',
    x: sigmaVals,
    name: 'σ 分布 distribution',
    marker: {
      color: `${color}60`,
      line: { color: color, width: 0.5 },
    },
    nbinsx: 15,
    hovertemplate: 'σ range: %{x}<br>Count: %{y}<extra></extra>',
  }

  const histLayout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor:  'rgba(0,0,0,0)',
    font: { color: '#94a3b8', size: 10 },
    xaxis: {
      title: { text: '不确定性 Uncertainty σ', font: { color: '#64748b', size: 11 } },
      gridcolor: 'rgba(255,255,255,0.03)',
      tickfont: { color: '#475569' },
    },
    yaxis: {
      title: { text: '样本数 Count', font: { color: '#64748b', size: 11 } },
      gridcolor: 'rgba(255,255,255,0.03)',
      tickfont: { color: '#475569' },
    },
    margin: { t: 10, b: 50, l: 45, r: 10 },
    showlegend: false,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card"
      style={{ padding: '20px', border: `1px solid ${color}18` }}
    >
      {/* 卡片标题行 */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: '16px',
        flexWrap: 'wrap', gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '8px',
            background: `${color}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={14} color={color} />
          </div>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>
            {label}
          </span>
        </div>

        {/* 关键指标 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <CoverageBadge value={coverage} />
          <span style={{
            fontSize: '11px', color: '#475569',
            padding: '2px 8px', borderRadius: '9999px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            avg σ = {avgSigma.toFixed(5)}
          </span>
          <span style={{
            fontSize: '11px', color: '#475569',
            padding: '2px 8px', borderRadius: '9999px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            MAE = {mae.toFixed(5)}
          </span>
        </div>
      </div>

      {/* 图表区域：左 CI 带图 + 右 sigma 分布 */}
      <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '2fr 1fr', gap: '12px' }}>
        <Plot
          data={[ciTrace, trueTrace, predTrace]}
          layout={layout}
          config={{ displayModeBar: false, responsive: true }}
          useResizeHandler={true}
          style={{ width: '100%', height: '240px' }}
        />
        <Plot
          data={[sigmaHist]}
          layout={histLayout}
          config={{ displayModeBar: false, responsive: true }}
          useResizeHandler={true}
          style={{ width: '100%', height: '240px' }}
        />
      </div>
    </motion.div>
  )
}

// ── 主页面 ─────────────────────────────────────────────────
export default function UQPage() {
  const [uqData,  setUqData]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  // 窄屏（<900px）时 CI 带图与 σ 分布图改单列
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < 900)

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 900)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    getUQResults()
      .then(res => setUqData(res.results))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#64748b' }}>
        <RefreshCw size={28} style={{ margin: '0 auto 10px', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '14px' }}>正在加载 UQ 结果… Loading…</p>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        padding: '20px 24px', borderRadius: '12px',
        background: 'rgba(248,113,113,0.08)',
        border: '1px solid rgba(248,113,113,0.2)',
        display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171',
      }}>
        <AlertCircle size={16} />
        <span style={{ fontSize: '14px' }}>{error}</span>
      </div>
    </div>
  )

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
              background: 'rgba(167,139,250,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={18} color="#a78bfa" />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9' }}>
              不确定性量化
              <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600, marginLeft: '10px', letterSpacing: '0.08em' }}>
                UNCERTAINTY QUANTIFICATION
              </span>
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '700px', lineHeight: 1.7 }}>
            训练/验证阶段每次预测执行{' '}
            <span style={{ color: '#a78bfa', fontWeight: 500 }}>100 次 MC Dropout 随机前向传播</span>
            ，阴影带为 95% 置信区间（生产 API 的 UQ 模式使用预计算 σ 统计量，见 README）。
            可靠的不确定性量化（UQ）意味着真实值稳定落在置信带内——这是代理模型工程可信度的直接证据。
            <br />
            <span style={{ fontSize: '12px', color: '#475569' }}>
              100 stochastic forward passes per prediction during training/validation; the shaded band is the 95%
              confidence interval. (The production API's UQ mode uses precomputed σ statistics — see README.)
            </span>
          </p>
        </motion.div>

        {/* 方法说明卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{ marginBottom: '24px' }}
        >
          <div className="glass-card" style={{
            padding: '16px 20px',
            border: '1px solid rgba(167,139,250,0.12)',
            background: 'rgba(167,139,250,0.04)',
            display: 'flex', alignItems: 'flex-start', gap: '12px',
          }}>
            <Info size={15} color="#a78bfa" style={{ flexShrink: 0, marginTop: '1px' }} />
            <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.8 }}>
              <span style={{ color: '#94a3b8', fontWeight: 600 }}>方法原理 MC Dropout Method： </span>
              推理时保持 Dropout 层激活（与常规评估不同），100 次随机前向传播产生预测分布。
              <span style={{ color: '#a78bfa' }}>均值 Mean</span>
              作为最终预测，
              <span style={{ color: '#a78bfa' }}>标准差 σ</span>
              量化认识不确定性（Epistemic Uncertainty）。置信带异常变宽通常说明输入超出训练分布（Out-of-Distribution）。
              <br />
              <span style={{ fontSize: '12px', color: '#475569' }}>
                Dropout stays active during inference; 100 stochastic passes yield a prediction distribution —
                the mean is the final prediction, σ quantifies epistemic uncertainty. Wide intervals flag
                out-of-distribution inputs.
              </span>
            </div>
          </div>
        </motion.div>

        {/* 三个指标的 UQ 分析面板 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <UQPanel
            label="等熵效率 Isentropic Efficiency η"
            trueKey="Efficiency_true"
            predKey="Efficiency_pred"
            sigmaKey="Efficiency_sigma"
            lowerKey="Efficiency_lower"
            upperKey="Efficiency_upper"
            color="#818cf8"
            icon={TrendingUp}
            data={uqData}
            isNarrow={isNarrow}
          />
          <UQPanel
            label="总压比 Total Pressure Ratio π"
            trueKey="Compression_ratio_true"
            predKey="Compression_ratio_pred"
            sigmaKey="Compression_ratio_sigma"
            lowerKey="Compression_ratio_lower"
            upperKey="Compression_ratio_upper"
            color="#22d3ee"
            icon={Gauge}
            data={uqData}
            isNarrow={isNarrow}
          />
          <UQPanel
            label="质量流量 Mass Flow ṁ (kg/s)"
            trueKey="Massflow_true"
            predKey="Massflow_pred"
            sigmaKey="Massflow_sigma"
            lowerKey="Massflow_lower"
            upperKey="Massflow_upper"
            color="#34d399"
            icon={Wind}
            data={uqData}
            isNarrow={isNarrow}
          />
        </div>

        {/* 校准曲线（Day 39 新增：P2 Conformal 校准的覆盖率检查） */}
        <div style={{ marginTop: '32px', background: '#1e293b', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0', marginBottom: '4px' }}>
            校准曲线 Calibration Curve
            <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600, marginLeft: '8px' }}>
              P2 · CONFORMAL
            </span>
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 16px' }}>
            名义置信水平 vs 实测覆盖率。理想校准应贴近对角线；若实测远低于名义（如 MC Dropout 的
            65–89%），说明区间低估不确定性，需 Conformal 校准（项目 Day 39 升级方向）。
            <br />
            <span style={{ color: '#475569' }}>
              Nominal vs empirical coverage. Diagonal = perfectly calibrated; MC Dropout underestimates (65–89%).
            </span>
          </p>
          <CalibrationCurve data={uqData} />
        </div>

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

// ── 校准曲线组件（Day 39 新增）──────────────────────────
const NOMINAL_LEVELS = [0.80, 0.90, 0.95, 0.99]

function CalibrationCurve({ data }) {
  const nominal = NOMINAL_LEVELS
  const empirical = useMemo(() => {
    if (!data?.length) return []
    return nominal.map(level => {
      // 对三个输出分别算覆盖率
      const outs = ['Compression_ratio', 'Efficiency', 'Massflow']
      const covs = outs.map(key => {
        const lo = data.filter(d => d[`${key}_true`] >= d[`${key}_lower`] && d[`${key}_true`] <= d[`${key}_upper`]).length
        return data.length ? lo / data.length : 0
      })
      return { level, covs }
    })
  }, [data, nominal])

  const traces = [
    { x: nominal, y: nominal, name: '理想（对角线）', type: 'scatter', mode: 'lines', line: { dash: 'dot', color: '#475569' } },
    ...['Compression_ratio', 'Efficiency', 'Massflow'].map((k, i) => ({
      x: nominal, y: empirical.map(e => e.covs[i]), name: { Compression_ratio: '总压比 π', Efficiency: '效率 η', Massflow: '流量 ṁ' }[k],
      type: 'scatter', mode: 'lines+markers',
      line: { color: ['#818cf8', '#34d399', '#22d3ee'][i], width: 2 },
    })),
  ]

  return (
    <Plot
      data={traces}
      layout={{
        height: 320, paper_bgcolor: '#1e293b', plot_bgcolor: '#1e293b',
        font: { color: '#cbd5e1', size: 12 },
        xaxis: { title: '名义置信水平 Nominal', range: [0.75, 1.0], gridcolor: '#334155' },
        yaxis: { title: '实测覆盖率 Empirical', range: [0.75, 1.0], gridcolor: '#334155' },
        legend: { orientation: 'h', y: -0.25 },
        margin: { t: 20, b: 60, l: 50, r: 20 },
      }}
      style={{ width: '100%' }}
      config={{ displayModeBar: false }}
    />
  )
}