import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Wand2,
  RefreshCw,
  AlertCircle,
  CircleDot,
  Target
} from 'lucide-react'
import BladeViewer3D from '../components/BladeViewer3D'
import { generateDesign, getBaselineFeatures } from '../utils/api'

const PRESETS = [
  { label: '高效率型 · High Efficiency', values: { Efficiency: 0.915, Massflow: 19.8, Compression_ratio: 2.02 } },
  { label: '大通流型 · Max Massflow', values: { Efficiency: 0.885, Massflow: 21.4, Compression_ratio: 2.08 } },
  { label: '高压比型 · High Pressure', values: { Efficiency: 0.875, Massflow: 20.5, Compression_ratio: 2.18 } },
]

export default function GeneratePage() {
  const [targets, setTargets] = useState({ Efficiency: 0.895, Massflow: 20.2, Compression_ratio: 2.05 })
  const [result, setResult] = useState(null)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [_baseline, setBaseline] = useState(null)
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < 960)

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 960)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    getBaselineFeatures().then(setBaseline).catch(() => {})
  }, [])

  // 运行逆向生成与最近邻候选匹配
  const handleGenerate = async (targetValues = targets) => {
    setLoading(true)
    setError(null)
    try {
      const res = await generateDesign(targetValues, 5)
      setResult(res)
      setSelectedIdx(0)
    } catch (e) {
      setError(e.message || '生成失败，请重试 / Generation failed')
    } finally {
      setLoading(false)
    }
  }

  // 首次进入自动生成一组候选
  useEffect(() => {
    handleGenerate({ Efficiency: 0.895, Massflow: 20.2, Compression_ratio: 2.05 })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const candidates = result?.candidates || []
  const selectedCandidate = candidates[selectedIdx] || candidates[0]

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
              05 / 逆向生成设计 · AERODYNAMIC INVERSE GENERATION
            </div>
            <h1 style={{
              color: 'var(--paper)',
              font: '700 clamp(32px, 4.5vw, 54px)/1.1 var(--display)',
              letterSpacing: '-0.045em',
              marginTop: 12
            }}>
              按需指标逆向寻优与叶型生成<br />
              <span style={{ color: 'var(--teal-bright)' }}>Target-Driven Inverse Geometry Retrieval</span>
            </h1>
          </div>
          <p style={{ maxWidth: 420, color: 'var(--muted)', fontSize: 13, lineHeight: 1.8 }}>
            设定目标总压比、等熵效率与流量指标。系统利用浏览器 WASM 代理模型从 1,000 组真实气动数据流道中逆向检索 Top 5 最优匹配候选并重构 3D 几何。
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
            INVERSE RETRIEVAL + ONNX VERIFIED
          </span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span>1,000 样本全局几何流道</span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span>Top 5 候选方案排队</span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span style={{ color: 'var(--yellow)' }}>候选为代理模型预测，最终仍需 CFD 终审</span>
        </div>

        {error && (
          <div style={{
            marginBottom: 18,
            padding: '12px 16px',
            border: '1px solid var(--rust)',
            background: 'rgba(197,104,74,0.08)',
            color: 'var(--rust)',
            borderRadius: 6,
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* 双栏工作台主布局 (等高拉伸与底部绝对对齐) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isNarrow ? '1fr' : '340px minmax(0, 1fr)',
          gap: 20,
          alignItems: 'stretch'
        }}>
          
          {/* 左栏：目标参数控制面板 */}
          <motion.aside
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 6,
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Target size={15} style={{ color: 'var(--yellow)' }} />
                  <span style={{ font: '11px var(--mono)', color: 'var(--paper)', fontWeight: 700 }}>
                    目标气动指标设定 · TARGETS
                  </span>
                </div>
                <span style={{ font: '10px var(--mono)', color: 'var(--teal-bright)', fontWeight: 600 }}>
                  INVERSE INPUT
                </span>
              </div>

              {/* 预设工况快速选择 */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ color: 'var(--faint)', font: '10px var(--mono)', letterSpacing: '0.08em', marginBottom: 8 }}>
                  预设典型工况 / PRESET PROFILES
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {PRESETS.map(p => (
                    <button
                      key={p.label}
                      onClick={() => {
                        setTargets(p.values)
                        handleGenerate(p.values)
                      }}
                      style={{
                        padding: '8px 10px',
                        background: 'var(--ink)',
                        border: '1px solid var(--line)',
                        color: 'var(--muted)',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '11px',
                        textAlign: 'left',
                        fontFamily: 'var(--body)',
                        transition: 'all 0.2s'
                      }}
                      className="card-glow"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3 大输入字段 */}
              <div style={{ display: 'grid', gap: 14 }}>
                <label style={{ display: 'grid', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--paper)', fontSize: 12, fontWeight: 600 }}>目标等熵绝热效率 η</span>
                    <span className="num" style={{ color: 'var(--yellow)', fontSize: 12, fontWeight: 700 }}>
                      {targets.Efficiency.toFixed(4)}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0.84}
                    max={0.93}
                    step={0.001}
                    value={targets.Efficiency}
                    onChange={e => setTargets({ ...targets, Efficiency: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--ink)',
                      border: '1px solid var(--line-strong)',
                      color: 'var(--paper)',
                      borderRadius: 4,
                      font: '13px var(--mono)'
                    }}
                  />
                  <span style={{ color: 'var(--faint)', font: '9px var(--mono)' }}>训练分布安全区间 [0.8400 → 0.9300]</span>
                </label>

                <label style={{ display: 'grid', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--paper)', fontSize: 12, fontWeight: 600 }}>目标质量流量 ṁ (kg/s)</span>
                    <span className="num" style={{ color: 'var(--teal-bright)', fontSize: 12, fontWeight: 700 }}>
                      {targets.Massflow.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={18.0}
                    max={22.0}
                    step={0.1}
                    value={targets.Massflow}
                    onChange={e => setTargets({ ...targets, Massflow: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--ink)',
                      border: '1px solid var(--line-strong)',
                      color: 'var(--paper)',
                      borderRadius: 4,
                      font: '13px var(--mono)'
                    }}
                  />
                  <span style={{ color: 'var(--faint)', font: '9px var(--mono)' }}>通流流量区间 [18.00 → 22.00 kg/s]</span>
                </label>

                <label style={{ display: 'grid', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--paper)', fontSize: 12, fontWeight: 600 }}>目标级总压比 π</span>
                    <span className="num" style={{ color: 'var(--rust)', fontSize: 12, fontWeight: 700 }}>
                      {targets.Compression_ratio.toFixed(4)}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={1.80}
                    max={2.22}
                    step={0.01}
                    value={targets.Compression_ratio}
                    onChange={e => setTargets({ ...targets, Compression_ratio: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--ink)',
                      border: '1px solid var(--line-strong)',
                      color: 'var(--paper)',
                      borderRadius: 4,
                      font: '13px var(--mono)'
                    }}
                  />
                  <span style={{ color: 'var(--faint)', font: '9px var(--mono)' }}>压比范围 [1.8000 → 2.2200]</span>
                </label>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <button
                onClick={() => handleGenerate()}
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', height: 44 }}
              >
                {loading ? <RefreshCw size={14} className="spin" /> : <Wand2 size={14} />}
                <span>{loading ? '正在逆向寻优…' : '逆向生成候选方案 / Retrieve ↗'}</span>
              </button>

              <div style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: '1px solid var(--line)',
                color: 'var(--faint)',
                fontSize: '11px',
                lineHeight: 1.6
              }}>
                前置流体拓扑守恒：自动保证叶片壁面厚度非负与单连通网格几何有效性。
              </div>
            </div>
          </motion.aside>

          {/* 右栏：Top 5 候选矩阵与 3D 叶片数字孪生 */}
          <motion.section
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 18,
              height: '100%'
            }}
          >
            {/* Top 5 候选选择器胶囊行 */}
            <div style={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 6,
              padding: '16px 20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ font: '11px var(--mono)', color: 'var(--paper)', fontWeight: 700 }}>
                  TOP 5 匹配候选叶型 · MATCHED CANDIDATES
                </span>
                <span style={{ font: '10px var(--mono)', color: 'var(--faint)' }}>
                  点击切换渲染目标
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {candidates.map((c, idx) => {
                  const active = selectedIdx === idx
                  return (
                    <button
                      key={c.sample_id || idx}
                      onClick={() => setSelectedIdx(idx)}
                      style={{
                        padding: '10px 8px',
                        background: active ? 'rgba(52,211,153,0.08)' : 'var(--ink)',
                        border: `1px solid ${active ? 'var(--teal-bright)' : 'var(--line)'}`,
                        borderRadius: 4,
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        color: active ? 'var(--teal-bright)' : 'var(--muted)',
                        font: '11px var(--mono)',
                        fontWeight: 700
                      }}>
                        RANK {c.rank || idx + 1}
                      </div>
                      <div style={{ color: 'var(--faint)', font: '9px var(--mono)', marginTop: 2 }}>
                        {c.sample_id ? `ID #${c.sample_id}` : `Dist ${c.distance?.toFixed(2)}`}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 3D 叶片数字孪生实时渲染 */}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ font: '11px var(--mono)', color: 'var(--paper)', fontWeight: 600 }}>
                    3D GEOMETRY RECONSTRUCTION
                  </span>
                  <span style={{ font: '10px var(--mono)', color: 'var(--teal-bright)', fontWeight: 600 }}>
                    [RANK {selectedIdx + 1}]
                  </span>
                </div>
                <span style={{ font: '10px var(--mono)', color: 'var(--faint)' }}>
                  DRAG TO ROTATE · SCROLL TO ZOOM
                </span>
              </div>

              {selectedCandidate ? (
                <BladeViewer3D
                  params={selectedCandidate.geometry || {}}
                  efficiency={selectedCandidate.predictions?.Efficiency}
                  pressureRatio={selectedCandidate.predictions?.Compression_ratio}
                  massflow={selectedCandidate.predictions?.Massflow}
                  height={250}
                />
              ) : (
                <div style={{ height: 250, display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
                  <p>正在生成 3D 叶片几何…</p>
                </div>
              )}
            </div>

            {/* 目标值 vs 预测值 对比卡片 */}
            <div style={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 6,
              padding: '20px 22px'
            }}>
              <div style={{ color: 'var(--faint)', font: '10px var(--mono)', letterSpacing: '0.12em', marginBottom: 14 }}>
                目标指标 vs 当前候选预测值对照 · ACCURACY COMPARISON
              </div>

              {selectedCandidate?.predictions ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <div style={{ padding: '12px', background: 'var(--ink)', border: '1px solid var(--line)', borderRadius: 4 }}>
                    <div style={{ color: 'var(--faint)', fontSize: 10, fontFamily: 'var(--mono)' }}>等熵效率 η</div>
                    <div className="num" style={{ color: 'var(--yellow)', fontSize: 18, fontWeight: 700, marginTop: 4 }}>
                      {selectedCandidate.predictions.Efficiency.toFixed(4)}
                    </div>
                    <div style={{ color: 'var(--faint)', font: '10px var(--mono)', marginTop: 4 }}>
                      目标: {targets.Efficiency.toFixed(4)}
                    </div>
                  </div>

                  <div style={{ padding: '12px', background: 'var(--ink)', border: '1px solid var(--line)', borderRadius: 4 }}>
                    <div style={{ color: 'var(--faint)', fontSize: 10, fontFamily: 'var(--mono)' }}>质量流量 ṁ</div>
                    <div className="num" style={{ color: 'var(--teal-bright)', fontSize: 18, fontWeight: 700, marginTop: 4 }}>
                      {selectedCandidate.predictions.Massflow.toFixed(2)} <span style={{ fontSize: 10, color: 'var(--muted)' }}>kg/s</span>
                    </div>
                    <div style={{ color: 'var(--faint)', font: '10px var(--mono)', marginTop: 4 }}>
                      目标: {targets.Massflow.toFixed(2)} kg/s
                    </div>
                  </div>

                  <div style={{ padding: '12px', background: 'var(--ink)', border: '1px solid var(--line)', borderRadius: 4 }}>
                    <div style={{ color: 'var(--faint)', fontSize: 10, fontFamily: 'var(--mono)' }}>级总压比 π</div>
                    <div className="num" style={{ color: 'var(--rust)', fontSize: 18, fontWeight: 700, marginTop: 4 }}>
                      {selectedCandidate.predictions.Compression_ratio.toFixed(4)}
                    </div>
                    <div style={{ color: 'var(--faint)', font: '10px var(--mono)', marginTop: 4 }}>
                      目标: {targets.Compression_ratio.toFixed(4)}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* 科学边界声明 */}
            <div style={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 6,
              padding: '14px 18px',
              fontSize: '11px',
              color: 'var(--faint)',
              lineHeight: 1.6
            }}>
              <strong style={{ color: 'var(--paper)' }}>科学边界声明：</strong> 逆向生成的几何参数来自公开 1,000 组流道中高密度近邻流形与残差物理网络验证，用于快速初选构型，尚未经由完整 Navier-Stokes 残差终审。
            </div>

          </motion.section>
        </div>

      </div>
    </main>
  )
}
