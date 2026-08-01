import { useState } from 'react'
import { motion } from 'framer-motion'
import { Wand2, Target, Loader2, Sparkles } from 'lucide-react'
import { api } from '../utils/api'

// P3 生成式设计页面（Day 39 新增）
// 目标性能输入 → 调用 /api/assistant/design（rule-based MVP 生成预测）→ 候选展示
// 真实扩散生成器训练完成后，接入 P3 生成端点替换此处占位。
export default function GeneratePage() {
  const [targets, setTargets] = useState({ Efficiency: 0.90, Massflow: 20.5, Compression_ratio: 2.0 })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const onGenerate = async () => {
    setLoading(true); setError(null); setResult(null)
    try {
      // 用自然语言描述目标 → assistant 端点（真实生成模型接入前，先演示「目标→预测」链路）
      const text = `帮我把效率提到 ${targets.Efficiency}，流量不低于 ${targets.Massflow}，压比达到 ${targets.Compression_ratio}`
      const { data } = await api.post('/api/assistant/design', { text })
      setResult(data)
    } catch (e) {
      setError(e?.response?.data?.detail || '生成失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(52,211,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wand2 size={18} color="#34d399" />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9' }}>
              生成式设计
              <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600, marginLeft: '10px', letterSpacing: '0.08em' }}>
                GENERATIVE DESIGN · P3
              </span>
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '720px', lineHeight: 1.7 }}>
            输入目标性能，AI 生成叶片设计候选（扩散模型路线，Day 39 工程骨架就绪；真实生成器待 9 通道数据训练后接入）。
            当前演示「目标 → 预测」链路：输入目标，返回当前基准设计下的预测与差距。
            <br />
            <span style={{ fontSize: '12px', color: '#475569' }}>
              Specify target performance; AI proposes blade designs. Pipeline skeleton ready; real diffusion generator
              connects after training on the 9-channel dataset.
            </span>
          </p>
        </motion.div>

        {/* 目标输入 */}
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target size={15} color="#34d399" /> 目标性能 Target Performance
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {[
              { key: 'Efficiency', label: '效率 η', min: 0.8, max: 0.95, step: 0.01 },
              { key: 'Massflow', label: '流量 ṁ (kg/s)', min: 18, max: 22, step: 0.1 },
              { key: 'Compression_ratio', label: '压比 π', min: 1.8, max: 2.2, step: 0.01 },
            ].map(({ key, label, min, max, step }) => (
              <div key={key}>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>{label}</label>
                <input
                  type="number" min={min} max={max} step={step}
                  value={targets[key]}
                  onChange={e => setTargets({ ...targets, [key]: parseFloat(e.target.value) })}
                  style={{ width: '100%', marginTop: '6px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '8px 10px', color: '#e2e8f0', fontSize: '14px' }}
                />
              </div>
            ))}
          </div>
          <button onClick={onGenerate} disabled={loading}
            style={{ marginTop: '16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: loading ? 0.6 : 1 }}>
            {loading ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
            {loading ? '正在生成…' : '生成设计 Generate'}
          </button>
        </div>

        {/* 结果 */}
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', borderRadius: '12px', padding: '14px 18px', fontSize: '13px' }}>⚠️ {error}</div>}

        {result && (
          <div style={{ background: '#1e293b', borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', marginBottom: '14px' }}>
              设计结果 Design Result
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '14px' }}>
              {['Efficiency', 'Compression_ratio', 'Massflow'].map(k => (
                <div key={k} style={{ background: '#0f172a', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{{ Efficiency: '效率 η', Compression_ratio: '压比 π', Massflow: '流量 ṁ (kg/s)' }[k]}</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#34d399' }}>
                    {result.predictions[k]?.toFixed(k === 'Massflow' ? 2 : 4)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569' }}>
                    目标 {k === 'Massflow' ? targets.Massflow.toFixed(1) : k === 'Efficiency' ? targets.Efficiency.toFixed(2) : targets.Compression_ratio.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(16,185,129,0.08)', borderLeft: '3px solid #10b981', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: '#a7f3d0', lineHeight: 1.7 }}>
              {result.explanation?.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}.spin{animation:spin 1s linear infinite}`}</style>
    </div>
  )
}
