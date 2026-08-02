import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Zap, Loader2, ArrowUp } from 'lucide-react'
import Navbar from './components/Navbar'
import WakeUpBanner from './components/WakeUpBanner'
import HomePage from './pages/HomePage'

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
    <div style={{
      background: 'rgba(251,191,36,0.06)',
      borderBottom: '1px solid rgba(251,191,36,0.12)',
    }}>
      <div style={{
        maxWidth: '1152px', margin: '0 auto',
        padding: '7px 24px',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          padding: '2px 8px', borderRadius: '9999px',
          background: 'rgba(251,191,36,0.15)',
          border: '1px solid rgba(251,191,36,0.25)',
          fontSize: '10px', fontWeight: 700, color: '#fbbf24',
          flexShrink: 0,
        }}>
          <Zap size={9} />
          NEW
        </span>
        <span style={{ fontSize: '12px', color: '#92400e' }}>
          KIT 突破 · 2026.02 · 无压气机燃气轮机连续运行 303 秒，刷新世界纪录
          <br />
          <span style={{ fontSize: '11px', color: '#a16207' }}>
            KIT Breakthrough · Feb 2026 · 303-second Compressorless Gas Turbine sets new world record
          </span>
        </span>
      </div>
    </div>
  )
}

// 每页浏览器标签标题（SPA 内随路由切换）
const PAGE_TITLES = {
  '/':            'AI 赋能的叶轮机械多学科设计优化平台',
  '/predict':     '实时预测 Predict · 叶轮机械 AI 平台',
  '/explore':     '设计空间探索 Explorer · 叶轮机械 AI 平台',
  '/optimize':    '多目标优化 Optimize · 叶轮机械 AI 平台',
  '/uq':          '不确定性 UQ · 叶轮机械 AI 平台',
  '/methodology': '方法论 Methodology · 叶轮机械 AI 平台',
  '/generate':    '生成设计 Generate · 叶轮机械 AI 平台',
  '/about':       '关于 About · 叶轮机械 AI 平台',
}

function RouteTitles() {
  const location = useLocation()
  useEffect(() => {
    document.title = PAGE_TITLES[location.pathname]
      || 'AI 赋能的叶轮机械多学科设计优化平台'
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

export default function App() {
  return (
    <BrowserRouter>
      <RouteTitles />
      <ScrollToTop />
      <BackToTop />
      {/* 全局背景光球 */}
      <div style={{
        position: 'fixed', inset: 0,
        overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
      }}>
        <div style={{
          position: 'absolute', top: '-10%', right: '-10%',
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 60%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: '-10%',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 60%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '20%',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(52,211,153,0.05) 0%, transparent 60%)',
          borderRadius: '50%',
        }} />
      </div>

      {/* 内容层 */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />
        <NewsBanner />
        <WakeUpBanner />
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