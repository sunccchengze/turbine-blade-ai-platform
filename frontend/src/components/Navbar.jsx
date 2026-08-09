import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Activity, Compass, Cpu, TrendingUp, BarChart3, Home, Menu, X, User, BookOpen, Wand2, Radio, Sun, Moon } from 'lucide-react'

const navItems = [
  { path: '/', label: '概览', en: 'Overview', icon: Home },
  { path: '/predict', label: '预测', en: 'Predict', icon: Cpu },
  { path: '/explore', label: '探索', en: 'Explore', icon: Compass },
  { path: '/optimize', label: '优化', en: 'Optimize', icon: TrendingUp },
  { path: '/generate', label: '生成', en: 'Generate', icon: Wand2 },
  { path: '/uq', label: 'UQ', en: 'Uncertainty', icon: BarChart3 },
  { path: '/methodology', label: '方法', en: 'Method', icon: BookOpen },
]

export default function Navbar({ theme, onToggleTheme }) {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14)
    const onResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize) }
  }, [])

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, background: scrolled ? 'rgba(11,14,13,.94)' : 'rgba(11,14,13,.78)', backdropFilter: 'blur(18px)', borderBottom: '1px solid var(--line)' }}>
      <div style={{ height: 2, background: 'var(--yellow)' }} />
      <nav style={{ maxWidth: 1240, height: 68, margin: '0 auto', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, border: '1px solid var(--teal)', color: 'var(--teal-bright)', display: 'grid', placeItems: 'center', borderRadius: 7 }}><Activity size={17} /></div>
          <div>
            <div style={{ color: 'var(--paper)', font: '600 16px var(--display)', letterSpacing: '-.03em' }}>TurbineAI</div>
            <div style={{ color: 'var(--faint)', font: '10px var(--mono)', letterSpacing: '.08em' }}>ROTOR / 37</div>
          </div>
        </Link>

        {!isMobile && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {navItems.map(({ path, label, en, icon: Icon }) => {
            const active = location.pathname === path
            return <Link className={`nav-link ${active ? 'nav-link-active' : ''}`} key={path} to={path} style={{ padding: '9px 10px', borderBottom: active ? '1px solid var(--yellow)' : '1px solid transparent', background: active ? 'rgba(231,200,91,.06)' : 'transparent', borderRadius: 5 }}>
              <Icon size={13} color={active ? 'var(--yellow)' : 'currentColor'} />
              <span style={{ fontSize: 12 }}>{label}</span>
              <span style={{ font: '9px var(--mono)', color: 'var(--faint)' }}>{en}</span>
            </Link>
          })}
        </div>}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="badge" style={{ color: 'var(--teal-bright)', borderColor: 'rgba(134,185,170,.28)', background: 'rgba(134,185,170,.06)' }}>
            <Radio size={10} /> LOCAL / WASM
          </div>
          <button onClick={onToggleTheme} aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'} title={theme === 'dark' ? '浅色模式 Light mode' : '深色模式 Dark mode'} style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', color: 'var(--yellow)', background: 'transparent', border: '1px solid var(--line)', borderRadius: 6, cursor: 'pointer' }}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <Link to="/about" aria-label="关于 About" style={{ color: 'var(--muted)', display: isMobile ? 'none' : 'grid', placeItems: 'center' }}><User size={15} /></Link>
          {isMobile && <button onClick={() => setMobileOpen(value => !value)} aria-label={mobileOpen ? '关闭菜单' : '打开菜单'} style={{ display: 'grid', placeItems: 'center', color: 'var(--paper)', background: 'none', border: 0, cursor: 'pointer' }}>{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>}
        </div>
      </nav>
      {mobileOpen && isMobile && <div style={{ padding: '8px 24px 16px', borderTop: '1px solid var(--line)', background: 'var(--ink)' }}>
        {[...navItems, { path: '/about', label: '关于', en: 'About', icon: User }].map(({ path, label, en, icon: Icon }) => <Link key={path} to={path} onClick={() => setMobileOpen(false)} className="nav-link" style={{ padding: '11px 8px', color: location.pathname === path ? 'var(--paper)' : 'var(--muted)' }}><Icon size={14} /><span>{label}</span><span style={{ font: '10px var(--mono)', color: 'var(--faint)' }}>{en}</span></Link>)}
      </div>}
    </header>
  )
}
