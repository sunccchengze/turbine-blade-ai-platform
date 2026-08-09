import { useState } from 'react'
import { motion } from 'framer-motion'
import { Wand2, Target, Loader2, Sparkles, Layers } from 'lucide-react'
import { api } from '../utils/api'
import BladeViewer3D from '../components/BladeViewer3D'

// P3 生成式设计页面
// 目标性能 → /api/assistant/generate（代理逆设计：库近邻 + L-BFGS-B）→ 候选展示
// 真实扩散生成器训练完成后，可替换后端求解器；前端接口保持兼容。
export default function GeneratePage() {
  const [targets, setTargets] = useState({ Efficiency: 0.88, Massflow: 20.0, Compression_ratio: 2.0 })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedRank, setSelectedRank] = useState(1)

  const onGenerate = async () => {
    setLoading(true); setError(null); setResult(null); setSelectedRank(1)
    try {
      const { data } = await api.post('/api/assistant/generate', {
        Efficiency: targets.Efficiency,
        Massflow: targets.Massflow,
        Compression_ratio: targets.Compression_ratio,
        n_candidates: 5,
        refine: true,
      })
      setResult(data)
    } catch (e) {
      // 兼容旧后端：若 /generate 404，回退 /design 自然语言
      const status = e?.response?.status
      if (status === 404) {
        try {
          const text = `帮我把效率提到 ${targets.Efficiency}，流量不低于 ${targets.Massflow}，压比达到 ${targets.Compression_ratio}`
          const { data } = await api.post('/api/assistant/design', { text })
          setResult(data)
          return
        } catch (e2) {
          setError(e2?.response?.data?.detail || '生成失败，请稍后重试')
          return
        }
      }
      setError(e?.response?.data?.detail || e?.userMessage || '生成失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const candidates = result?.candidates || []
  const selected = candidates.find(c => c.rank === selectedRank) || candidates[0]
  const pred = selected?.predictions || result?.predictions
  const geom = selected?.geometry || result?.geometry

  const metricLabel = {
    Efficiency: '效率 η',
    Compression_ratio: '压比 π',
    Massflow: '流量 ṁ (kg/s)',
  }

  return (
    <div style={{ background: 'var(--ink)', minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(52,211,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wand2 size={18} color="var(--teal-bright)" />
            </div>
            <h1 style={{ fontSize: 'clamp(2.2rem, 4.8vw, 4rem)', fontWeight: 600, color: 'var(--paper)', fontFamily: 'var(--display)', letterSpacing: '-.05em', lineHeight: 1.08 }}>
              生成式设计
              <span style={{ fontSize: '11px', color: 'var(--faint)', fontWeight: 600, marginLeft: '10px', letterSpacing: '0.08em' }}>
                GENERATIVE DESIGN · INVERSE
              </span>
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--faint)', maxWidth: '820px', lineHeight: 1.7 }}>
            输入目标性能，AI 在代理模型上做逆设计：从 1000 组 Rotor 37 设计库中检索最接近方案，
            并对最优候选做局部精修。改目标 → 结果会变（不再是固定基准预测）。
            <br />
            <span style={{ fontSize: '12px', color: 'var(--faint)' }}>
              Inverse design on the ONNX surrogate (library nearest-neighbor + L-BFGS-B).
              P3 diffusion generator will replace the solver after full training.
            </span>
          </p>
        </motion.div>

        {/* 目标输入 */}
        <div style={{ background: 'var(--panel)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--paper)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target size={15} color="var(--teal-bright)" /> 目标性能 Target Performance
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {[
              { key: 'Efficiency', label: '效率 η', min: 0.85, max: 0.90, step: 0.001 },
              { key: 'Massflow', label: '流量 ṁ (kg/s)', min: 18.0, max: 21.0, step: 0.1 },
              { key: 'Compression_ratio', label: '压比 π', min: 1.85, max: 2.10, step: 0.01 },
            ].map(({ key, label, min, max, step }) => (
              <div key={key}>
                <label style={{ fontSize: '12px', color: 'var(--muted)' }}>{label}</label>
                <input
                  type="number" min={min} max={max} step={step}
                  value={targets[key]}
                  onChange={e => {
                    const v = parseFloat(e.target.value)
                    setTargets({ ...targets, [key]: Number.isFinite(v) ? v : targets[key] })
                  }}
                  style={{ width: '100%', marginTop: '6px', background: 'var(--ink)', border: '1px solid #334155', borderRadius: '8px', padding: '8px 10px', color: 'var(--paper)', fontSize: '14px' }}
                />
                <div style={{ fontSize: '10px', color: 'var(--faint)', marginTop: '4px' }}>
                  建议范围 {min} – {max}（训练分布内）
                </div>
              </div>
            ))}
          </div>
          <button onClick={onGenerate} disabled={loading}
            style={{ marginTop: '16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontWeight: 600, fontSize: '14px', cursor: loading ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: loading ? 0.6 : 1 }}>
            {loading ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
            {loading ? '正在逆设计…' : '生成设计 Generate'}
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', borderRadius: '12px', padding: '14px 18px', fontSize: '13px', marginBottom: '16px' }}>
            ⚠️ {typeof error === 'string' ? error : JSON.stringify(error)}
          </div>
        )}

        {result && pred && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)', gap: '16px' }}
            className="gen-result-grid">
            <div style={{ background: 'var(--panel)', borderRadius: '16px', padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--paper)', marginBottom: '14px' }}>
                设计结果 Design Result
                <span style={{ fontSize: '11px', color: 'var(--faint)', fontWeight: 500, marginLeft: '10px' }}>
                  {result.mode || 'inverse-design'}
                </span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                {['Efficiency', 'Compression_ratio', 'Massflow'].map(k => {
                  const val = pred[k]
                  const tgt = targets[k]
                  const gap = val != null && tgt != null ? val - tgt : null
                  const ok = gap == null ? true : (k === 'Massflow' ? gap >= -0.05 : Math.abs(gap) < 0.01)
                  return (
                    <div key={k} style={{ background: 'var(--ink)', borderRadius: '10px', padding: '14px', border: `1px solid ${ok ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.25)'}` }}>
                      <div style={{ fontSize: '11px', color: 'var(--faint)' }}>{metricLabel[k]}</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: ok ? 'var(--teal-bright)' : 'var(--yellow)' }}>
                        {val != null ? val.toFixed(k === 'Massflow' ? 2 : 4) : '—'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--faint)' }}>
                        目标 {k === 'Massflow' ? tgt.toFixed(1) : tgt.toFixed(k === 'Efficiency' ? 3 : 2)}
                        {gap != null && (
                          <span style={{ marginLeft: 6, color: gap >= 0 ? 'var(--teal-bright)' : 'var(--yellow)' }}>
                            ({gap >= 0 ? '+' : ''}{gap.toFixed(k === 'Massflow' ? 2 : 4)})
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {candidates.length > 1 && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Layers size={13} /> 候选方案（点击切换）
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {candidates.map(c => {
                      const active = (selected?.rank || 1) === c.rank
                      return (
                        <button key={c.rank} onClick={() => setSelectedRank(c.rank)}
                          style={{
                            background: active ? 'rgba(16,185,129,0.15)' : 'var(--ink)',
                            border: `1px solid ${active ? '#10b981' : '#334155'}`,
                            borderRadius: '8px', padding: '8px 12px', cursor: 'pointer',
                            color: active ? '#6ee7b7' : 'var(--muted)', fontSize: '12px', textAlign: 'left',
                          }}>
                          <div style={{ fontWeight: 700 }}>#{c.rank}{c.refined ? ' · 精修' : ''}</div>
                          <div style={{ fontSize: '11px', opacity: 0.85 }}>
                            η {c.predictions.Efficiency?.toFixed(4)} · π {c.predictions.Compression_ratio?.toFixed(3)} · ṁ {c.predictions.Massflow?.toFixed(2)}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div style={{ background: 'rgba(16,185,129,0.08)', borderLeft: '3px solid #10b981', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: '#a7f3d0', lineHeight: 1.7 }}>
                {(result.explanation || []).map((e, i) => <div key={i}>{e}</div>)}
              </div>
            </div>

            <div style={{ background: 'var(--panel)', borderRadius: '16px', padding: '16px', minHeight: '320px' }}>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '10px' }}>3D 叶型预览（参数化）</div>
              {geom ? (
                <div style={{ height: '300px', borderRadius: '12px', overflow: 'hidden', background: 'var(--ink)' }}>
                  <BladeViewer3D params={geom} />
                </div>
              ) : (
                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--faint)', fontSize: '13px' }}>
                  无几何参数
                </div>
              )}
              {selected && (
                <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--faint)', lineHeight: 1.6 }}>
                  sample_id={selected.sample_id} · dist={selected.distance?.toFixed?.(4) ?? selected.distance}
                  <br />
                  {selected.method}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}.spin{animation:spin 1s linear infinite}
        @media (max-width: 800px){ .gen-result-grid{ grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}
