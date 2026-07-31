import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Zap, Loader2 } from 'lucide-react'
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
          KIT Breakthrough · Feb 2026 · 303-second Compressorless Gas Turbine sets new world record
        </span>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
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
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  )
}