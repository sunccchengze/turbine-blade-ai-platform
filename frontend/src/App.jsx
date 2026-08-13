import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Loader2, ArrowUp } from 'lucide-react'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import AmbientAerodynamicBackground from './components/AmbientAerodynamicBackground'

// ── 路由级代码分割 ──────────────────────────────────────────
// three.js (Predict) 和 Plotly (Explore/Optimize/UQ) 体积巨大，
// 按路由懒加载后，首页首屏只需下载 ~500KB 而非整个 6MB bundle。
const PredictPage  = lazy(() => import('./pages/PredictPage'))
const ExplorePage  = lazy(() => import('./pages/ExplorePage'))
const OptimizePage = lazy(() => import('./pages/OptimizePage'))
const UQPage       = lazy(() => import('./pages/UQPage'))
const AboutPage    = lazy(() => import('./pages/AboutPage'))
const MethodologyPage = lazy(() => import('./pages/MethodologyPage'))
const GeneratePage   = lazy(() => import('./pages/GeneratePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

// 懒加载占位屏：与站点暗色风格一致的轻量转圈
function PageLoading() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '50vh', gap: '12px',
    }}>
      <Loader2 size={24} color="#818cf8" className="spin" />
      <span style={{ fontSize: '12px', color: '#475569' }}>Loading module…</span>
    </div>
  )
}

function NewsBanner() {
  return (
    <div style={{ borderBottom: '1px solid var(--line)', background: 'var(--ink-2)' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '9px 28px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--yellow)', font: '10px var(--mono)', letterSpacing: '.12em' }}>FIELD NOTE / 02.2026</span>
        <span style={{ color: 'var(--muted)', fontSize: 11 }}>KIT 无压气机氢燃料燃气轮机连续运行 303 秒</span>
        <span style={{ color: 'var(--faint)', font: '10px var(--mono)' }}>context only · current carrier: NASA Rotor 37 compressor</span>
      </div>
    </div>
  )
}

// 每页浏览器标签标题（SPA 内随路由切换）
const PAGE_TITLES = {
  '/':            '气动代理筛选站 · NASA Rotor 37',
  '/predict':     '实时预测 · Rotor 37 筛选站',
  '/explore':     '空间探索 · Rotor 37 筛选站',
  '/optimize':    '代理候选 · Rotor 37 筛选站',
  '/uq':          '启发式不确定度 · Rotor 37 筛选站',
  '/methodology': '方法 · Rotor 37 筛选站',
  '/generate':    '库内检索 · Rotor 37 筛选站',
  '/about':       '关于 · 气动代理筛选站',
}

function RouteTitles() {
  const location = useLocation()
  useEffect(() => {
    document.title = PAGE_TITLES[location.pathname]
      || '气动代理筛选站 · NASA Rotor 37'
  }, [location.pathname])
  return null
}

// 路由切换自动回到页顶（SPA 细节：避免从页面中部切入新页面）
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

// 回到顶部悬浮按钮：长页面（首页/方法论/关于）滚动超过一屏后出现
function BackToTop() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  if (!visible) return null
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="回到顶部 Back to top"
      title="回到顶部 Back to top"
      style={{
        position: 'fixed', right: '22px', bottom: '22px', zIndex: 60,
        width: '42px', height: '42px', borderRadius: '12px',
        background: 'rgba(30,41,59,0.85)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(99,102,241,0.35)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#a5b4fc', boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(79,70,229,0.35)'; e.currentTarget.style.color = '#e0e7ff' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(30,41,59,0.85)'; e.currentTarget.style.color = '#a5b4fc' }}
    >
      <ArrowUp size={18} />
    </button>
  )
}

function GlobalBackground() {
  const location = useLocation()
  if (location.pathname === '/') return null
  return <AmbientAerodynamicBackground />
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('turbine-theme-v2')
      if (saved === 'light' || saved === 'dark') return saved
      // 清除旧版本可能残留的 light 键值，确保新打开或默认状态下 100% 为深色模式
      localStorage.removeItem('turbine-theme')
      localStorage.setItem('turbine-theme-v2', 'dark')
      return 'dark'
    } catch {
      return 'dark'
    }
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('turbine-theme-v2', theme)
    } catch {}
  }, [theme])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    if (typeof document !== 'undefined' && document.startViewTransition) {
      document.startViewTransition(() => {
        setTheme(next)
      })
    } else {
      setTheme(next)
    }
  }

  return (
    <BrowserRouter>
      <RouteTitles />
      <ScrollToTop />
      <GlobalBackground />
      <BackToTop />
      {/* 内容层 */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar theme={theme} onToggleTheme={toggleTheme} />
        <NewsBanner />
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/"         element={<HomePage />}    />
            <Route path="/predict"  element={<PredictPage />} />
            <Route path="/explore"  element={<ExplorePage />} />
            <Route path="/optimize" element={<OptimizePage />}/>
            <Route path="/uq"       element={<UQPage />}      />
            <Route path="/about"    element={<AboutPage />}   />
            <Route path="/methodology" element={<MethodologyPage />} />
            <Route path="/generate"  element={<GeneratePage />} />
            <Route path="*"           element={<NotFoundPage />}  />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  )
}