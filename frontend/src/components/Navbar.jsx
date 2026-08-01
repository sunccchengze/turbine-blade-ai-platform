import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Compass, Cpu, TrendingUp, BarChart3, Home, Menu, X, User, BookOpen, Wand2 } from 'lucide-react'
import { checkHealth } from '../utils/api'

const navItems = [
  { path: '/',            label: '概览',     icon: Home       },
  { path: '/predict',     label: '实时预测', icon: Cpu        },
  { path: '/explore',     label: '空间探索', icon: Compass    },
  { path: '/optimize',    label: '优化',     icon: TrendingUp },
  { path: '/generate',    label: '生成设计', icon: Wand2      },
  { path: '/uq',          label: '不确定性', icon: BarChart3  },
  { path: '/methodology', label: '方法论',   icon: BookOpen   },
  { path: '/about',       label: '关于',     icon: User       },
]

export default function Navbar() {
  const location                      = useLocation()
  const [scrolled,    setScrolled]    = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [isMobile,    setIsMobile]    = useState(window.innerWidth < 1024)
  // API 真实健康状态（冷启动/挂掉时不再显示假的"API Live"）
  const [apiStatus,   setApiStatus]   = useState('checking')   // checking | live | down

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    const onResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('scroll', onScroll)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  // 健康检查：启动即查一次，之后每 30 秒刷新（容器冷启动数秒内可恢复）
  useEffect(() => {
    let alive = true
    const ping = async () => {
      try {
        await checkHealth()
        if (alive) setApiStatus('live')
      } catch {
        if (alive) setApiStatus('down')
      }
    }
    ping()
    const timer = setInterval(ping, 30000)
    return () => { alive = false; clearInterval(timer) }
  }, [])

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: scrolled ? 'rgba(15,23,42,0.88)' : 'rgba(15,23,42,0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* 顶部 2px 渐变线 */}
      <div style={{
        height: '2px',
        background: 'linear-gradient(to right, #6366f1, #22d3ee, #34d399)',
      }} />

      {/* 主导航行 */}
      <div style={{
        maxWidth: '1152px', margin: '0 auto',
        padding: '0 24px', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '9px',
            background: 'linear-gradient(135deg, #4f46e5, #0891b2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(79,70,229,0.3)', flexShrink: 0,
          }}>
            <Activity size={15} color="white" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9', lineHeight: 1 }}>
              TurbineAI
            </div>
            <div style={{ fontSize: '10px', color: '#6366f1', lineHeight: 1, marginTop: '2px' }}>
              NASA Rotor 37
            </div>
          </div>
        </Link>

        {/* 桌面端胶囊导航 */}
        {!isMobile && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '2px',
            padding: '3px', borderRadius: '10px',
            background: 'rgba(30,41,59,0.5)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path
              return (
                <Link
                  key={path}
                  to={path}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 14px', borderRadius: '7px',
                    fontSize: '13px', fontWeight: 500,
                    textDecoration: 'none', transition: 'all 0.2s',
                    color:      isActive ? '#f1f5f9' : '#94a3b8',
                    background: isActive ? 'rgba(99,102,241,0.2)' : 'transparent',
                    border:     isActive
                      ? '1px solid rgba(99,102,241,0.25)'
                      : '1px solid transparent',
                  }}
                >
                  <Icon size={13} />
                  {label}
                </Link>
              )
            })}
          </div>
        )}

        {/* 右侧：API真实状态 + 移动端按钮 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '4px 10px', borderRadius: '9999px',
            background: apiStatus === 'live' ? 'rgba(52,211,153,0.08)'
              : apiStatus === 'down' ? 'rgba(248,113,113,0.08)' : 'rgba(148,163,184,0.08)',
            border: apiStatus === 'live' ? '1px solid rgba(52,211,153,0.18)'
              : apiStatus === 'down' ? '1px solid rgba(248,113,113,0.18)' : '1px solid rgba(148,163,184,0.18)',
            fontSize: '11px', fontWeight: 600,
            color: apiStatus === 'live' ? '#34d399' : apiStatus === 'down' ? '#f87171' : '#94a3b8',
          }}>
            <div style={{
              width: '5px', height: '5px', borderRadius: '50%',
              background: apiStatus === 'live' ? '#34d399' : apiStatus === 'down' ? '#f87171' : '#94a3b8',
              flexShrink: 0,
            }} />
            {apiStatus === 'live' ? 'API Live'
              : apiStatus === 'down' ? 'API Offline' : 'Checking…'}
          </span>

          {isMobile && (
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? '关闭菜单 Close menu' : '打开菜单 Open menu'}
              style={{
                padding: '6px', color: '#94a3b8',
                background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>
      </div>

      {/* 移动端展开菜单 */}
      <AnimatePresence>
        {mobileOpen && isMobile && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
              overflow: 'hidden',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              background: 'rgba(15,23,42,0.98)',
            }}
          >
            <div style={{
              maxWidth: '1152px', margin: '0 auto',
              padding: '12px 24px',
              display: 'flex', flexDirection: 'column', gap: '4px',
            }}>
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 14px', borderRadius: '8px',
                    fontSize: '14px', fontWeight: 500, textDecoration: 'none',
                    color:      location.pathname === path ? '#f1f5f9' : '#94a3b8',
                    background: location.pathname === path
                      ? 'rgba(99,102,241,0.15)' : 'transparent',
                  }}
                >
                  <Icon size={14} />
                  {label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}