import { motion } from 'framer-motion'

export function PageHeader({ index, title, en, lead, tag = 'RESEARCH WORKSPACE' }) {
  return <motion.header initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 28, flexWrap: 'wrap', marginBottom: 34 }}>
    <div><div style={{ color: 'var(--yellow)', font: '10px var(--mono)', letterSpacing: '.14em' }}>{index} / {tag}</div><h1 style={{ color: 'var(--paper)', font: '600 clamp(36px,5vw,64px)/1.08 var(--display)', letterSpacing: '-.055em', marginTop: 14 }}>{title}<br /><span style={{ color: 'var(--faint)', font: '500 clamp(16px,2vw,24px)/1.3 var(--body)', letterSpacing: '-.02em' }}>{en}</span></h1></div>
    {lead && <p style={{ maxWidth: 390, color: 'var(--muted)', fontSize: 13, lineHeight: 1.85 }}>{lead}</p>}
  </motion.header>
}

export function SectionLabel({ children }) { return <div style={{ color: 'var(--faint)', font: '10px var(--mono)', letterSpacing: '.13em', textTransform: 'uppercase' }}>{children}</div> }
export function Surface({ children, style = {}, className = '' }) { return <div className={`surface-card ${className}`} style={{ padding: 20, ...style }}>{children}</div> }
export function StatusTag({ children, tone = 'teal' }) { const color = tone === 'gold' ? 'var(--yellow)' : tone === 'rust' ? 'var(--rust)' : 'var(--teal-bright)'; return <span className="badge" style={{ color, borderColor: 'var(--line-strong)' }}>{children}</span> }
export function MetricTile({ value, label, note, tone = 'teal' }) { const color = tone === 'gold' ? 'var(--yellow)' : tone === 'rust' ? 'var(--rust)' : 'var(--teal-bright)'; return <Surface style={{ minHeight: 124 }}><div className="num" style={{ color, fontSize: 26 }}>{value}</div><div style={{ color: 'var(--paper)', fontWeight: 600, fontSize: 13, marginTop: 10 }}>{label}</div><div style={{ color: 'var(--faint)', font: '10px var(--mono)', marginTop: 4 }}>{note}</div></Surface> }
