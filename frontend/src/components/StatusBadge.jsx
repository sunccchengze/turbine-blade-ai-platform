import { motion } from 'framer-motion'

export default function StatusBadge({ label, value, unit = '', color = 'primary' }) {
  const palettes = {
    primary: {
      border: 'rgba(99,102,241,0.2)',
      bg:     'rgba(99,102,241,0.06)',
      text:   '#818cf8',
      bar:    'linear-gradient(to right, #4f46e5, #818cf8)',
      dot:    '#6366f1',
    },
    cyan: {
      border: 'rgba(34,211,238,0.2)',
      bg:     'rgba(34,211,238,0.06)',
      text:   '#22d3ee',
      bar:    'linear-gradient(to right, #0891b2, #22d3ee)',
      dot:    '#06b6d4',
    },
    green: {
      border: 'rgba(52,211,153,0.2)',
      bg:     'rgba(52,211,153,0.06)',
      text:   '#34d399',
      bar:    'linear-gradient(to right, #059669, #34d399)',
      dot:    '#10b981',
    },
    amber: {
      border: 'rgba(251,191,36,0.2)',
      bg:     'rgba(251,191,36,0.06)',
      text:   '#fbbf24',
      bar:    'linear-gradient(to right, #d97706, #fbbf24)',
      dot:    '#f59e0b',
    },
    orange: {
      border: 'rgba(251,191,36,0.2)',
      bg:     'rgba(251,191,36,0.06)',
      text:   '#fbbf24',
      bar:    'linear-gradient(to right, #d97706, #fbbf24)',
      dot:    '#f59e0b',
    },
  }

  const p = palettes[color] || palettes.primary

  // 从 value 推断进度条宽度
  const getBarWidth = () => {
    if (typeof value === 'string' && value.includes('K×')) return '100%'
    const num = parseFloat(value)
    if (!isNaN(num) && num <= 1) return `${(num * 100).toFixed(1)}%`
    return '85%'
  }

  return (
    <div
      className="glass-card card-glow p-5"
      style={{ border: `1px solid ${p.border}`, background: p.bg }}
    >
      {/* 顶部：小圆点 + 标签 */}
      <div className="flex items-center gap-2 mb-4">
        <div style={{
          width: '6px', height: '6px',
          borderRadius: '50%',
          background: p.dot,
          boxShadow: `0 0 6px ${p.dot}`,
        }} />
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          {label}
        </span>
      </div>

      {/* 数值 */}
      <div className="num mb-4" style={{
        fontSize: '28px',
        fontWeight: 700,
        color: p.text,
        lineHeight: 1,
      }}>
        {value}
        {unit && (
          <span style={{ fontSize: '13px', fontWeight: 400, color: '#64748b', marginLeft: '4px' }}>
            {unit}
          </span>
        )}
      </div>

      {/* 进度条 */}
      <div className="stat-bar">
        <motion.div
          className="stat-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: getBarWidth() }}
          transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
          style={{ background: p.bar }}
        />
      </div>
    </div>
  )
}