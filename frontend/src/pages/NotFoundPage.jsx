import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Compass, Home } from 'lucide-react'

export default function NotFoundPage() {
  useEffect(() => { window.scrollTo(0, 0) }, [])

  return (
    <div style={{
      maxWidth: '640px', margin: '0 auto', padding: '80px 24px',
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: 'clamp(4rem, 12vw, 6rem)', fontWeight: 800,
        background: 'linear-gradient(135deg, #4f46e5, #22d3ee)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        lineHeight: 1.1,
      }}>
        404
      </div>
      <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f1f5f9', margin: '8px 0 10px' }}>
        页面不存在 Page Not Found
      </h1>
      <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.8, marginBottom: '28px' }}>
        你访问的地址不存在或已被移动。试试从这些地方继续——
        <br />
        <span style={{ fontSize: '12px', color: '#475569' }}>
          The address you requested doesn't exist or has moved. Try continuing from one of these:
        </span>
      </p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '10px 20px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #4f46e5, #0891b2)',
          color: '#fff', fontSize: '14px', fontWeight: 600,
          textDecoration: 'none', boxShadow: '0 4px 14px rgba(79,70,229,0.3)',
        }}>
          <Home size={14} /> 返回首页 Back to Home
        </Link>
        <Link to="/explore" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '10px 20px', borderRadius: '10px',
          background: 'rgba(30,41,59,0.6)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#e2e8f0', fontSize: '14px', fontWeight: 600,
          textDecoration: 'none',
        }}>
          <Compass size={14} /> 设计空间探索器 Explorer
        </Link>
      </div>
    </div>
  )
}
