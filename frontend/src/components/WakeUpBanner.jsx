import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Server, RefreshCw } from 'lucide-react'
import { checkHealth } from '../utils/api'

export default function WakeUpBanner() {
  const [status, setStatus] = useState('checking') // checking | awake | sleeping
  const [dots,   setDots]   = useState('')

  useEffect(() => {
    // 动态省略号
    const dotTimer = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.')
    }, 500)

    // 检查后端状态
    const checkBackend = async () => {
      try {
        await checkHealth()
        setStatus('awake')
      } catch {
        setStatus('sleeping')
        // 每10秒重试
        setTimeout(checkBackend, 10000)
      }
    }

    checkBackend()
    return () => clearInterval(dotTimer)
  }, [])

  return (
    <AnimatePresence>
      {status !== 'awake' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          style={{
            position: 'fixed', top: '74px', left: 0, right: 0,
            zIndex: 40,
            background: status === 'checking'
              ? 'rgba(99,102,241,0.12)'
              : 'rgba(251,191,36,0.10)',
            borderBottom: `1px solid ${
              status === 'checking'
                ? 'rgba(99,102,241,0.2)'
                : 'rgba(251,191,36,0.2)'
            }`,
            backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{
            maxWidth: '1152px', margin: '0 auto',
            padding: '8px 24px',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            {status === 'checking' ? (
              <RefreshCw
                size={13}
                color="#818cf8"
                style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}
              />
            ) : (
              <Server size={13} color="#fbbf24" style={{ flexShrink: 0 }} />
            )}
            <span style={{
              fontSize: '12px', fontWeight: 500,
              color: status === 'checking' ? '#818cf8' : '#fbbf24',
            }}>
              {status === 'checking'
                ? `正在连接推理服务器${dots}`
                : `服务器正在从休眠中唤醒${dots}（首次加载约需 30 秒）`
              }
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}