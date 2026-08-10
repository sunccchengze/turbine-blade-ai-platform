import { useEffect, useRef } from 'react'

/**
 * AmbientAerodynamicBackground (全站子页面柔和气动氛围背景系统)
 * 
 * 特性：
 * 1. 520px 柔焦漫射光斑 (明晰且柔和的高对比微光，随鼠标惯性滑行)
 * 2. 24 条慢速平行层流发丝线 (0.35 px/frame 静谧漂浮，遇探针平滑微绕流)
 * 3. 48px CFD 几何网格感应与呼吸微光
 * 4. 0% CPU 离屏休眠与硬件级全穿透保障
 */
export default function AmbientAerodynamicBackground() {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let animationFrameId = null
    let isVisible = true
    let width = 0
    let height = 0
    let dpr = window.devicePixelRatio || 1

    const mouse = {
      x: window.innerWidth * 0.72,
      y: window.innerHeight * 0.28,
      targetX: window.innerWidth * 0.72,
      targetY: window.innerHeight * 0.28,
      active: false,
    }

    const PARTICLE_COUNT = 24
    const particles = []

    const initParticles = (w, h) => {
      particles.length = 0
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          baseY: Math.random() * h,
          speed: 0.35 + Math.random() * 0.45,
          length: 35 + Math.random() * 55,
          opacity: 0.16 + Math.random() * 0.18,
        })
      }
    }

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)

      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.scale(dpr, dpr)

      if (particles.length === 0) {
        initParticles(width, height)
      }
    }

    resize()
    window.addEventListener('resize', resize)

    const onPointerMove = (e) => {
      mouse.targetX = e.clientX
      mouse.targetY = e.clientY
      mouse.active = true
    }

    const onPointerLeave = () => {
      mouse.targetX = width * 0.72
      mouse.targetY = height * 0.28
      mouse.active = false
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('mouseleave', onPointerLeave, { passive: true })

    const onVisibilityChange = () => {
      isVisible = !document.hidden
      if (isVisible && !animationFrameId) {
        render()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)


    const render = () => {
      if (!isVisible) {
        animationFrameId = null
        return
      }

      const isLight = document.documentElement.dataset.theme === 'light'
      ctx.clearRect(0, 0, width, height)

      // 1. 平滑流体惯性插值 (LERP α=0.045)
      mouse.x += (mouse.targetX - mouse.x) * 0.045
      mouse.y += (mouse.targetY - mouse.y) * 0.045

      // 2. 520px 柔焦漫射气动聚光斑
      const spotRadius = 520
      const spotGrad = ctx.createRadialGradient(
        mouse.x, mouse.y, 0,
        mouse.x, mouse.y, spotRadius
      )
      if (isLight) {
        spotGrad.addColorStop(0, 'rgba(45, 117, 105, 0.09)')
        spotGrad.addColorStop(0.35, 'rgba(45, 117, 105, 0.035)')
        spotGrad.addColorStop(1, 'rgba(248, 247, 242, 0)')
      } else {
        spotGrad.addColorStop(0, 'rgba(52, 211, 153, 0.11)')
        spotGrad.addColorStop(0.35, 'rgba(134, 185, 170, 0.04)')
        spotGrad.addColorStop(1, 'rgba(11, 14, 13, 0)')
      }

      ctx.fillStyle = spotGrad
      ctx.beginPath()
      ctx.arc(mouse.x, mouse.y, spotRadius, 0, Math.PI * 2)
      ctx.fill()

      // 3. 48px CFD 几何网格节点微感应
      const GRID = 48
      const PROXIMITY_RADIUS = 130
      const PROXIMITY_SQ = PROXIMITY_RADIUS * PROXIMITY_RADIUS

      for (let x = 0; x <= width; x += GRID) {
        for (let y = 0; y <= height; y += GRID) {
          const dx = x - mouse.x
          const dy = y - mouse.y
          const distSq = dx * dx + dy * dy

          if (distSq < PROXIMITY_SQ) {
            const intensity = Math.pow(1 - distSq / PROXIMITY_SQ, 2)
            ctx.fillStyle = isLight
              ? `rgba(45, 117, 105, ${0.12 + intensity * 0.35})`
              : `rgba(52, 211, 153, ${0.15 + intensity * 0.4})`
            ctx.fillRect(x - 1, y - 1, 2, 2)
          }
        }
      }

      // 4. 24 条平行层流发丝线 (遇探针平滑微绕流)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.speed

        if (p.x > width + p.length) {
          p.x = -p.length
          p.y = Math.random() * height
          p.baseY = p.y
        }

        const dx = p.x - mouse.x
        const dy = p.baseY - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const R = 75

        if (dist < R && dist > 1) {
          const push = (1 - dist / R) * (dy >= 0 ? 1 : -1) * 14
          p.y += (p.baseY + push - p.y) * 0.1
        } else {
          p.y += (p.baseY - p.y) * 0.04
        }

        const lineGrad = ctx.createLinearGradient(p.x - p.length, p.y, p.x, p.y)
        if (isLight) {
          lineGrad.addColorStop(0, 'rgba(45, 117, 105, 0)')
          lineGrad.addColorStop(1, `rgba(45, 117, 105, ${p.opacity})`)
        } else {
          lineGrad.addColorStop(0, 'rgba(134, 185, 170, 0)')
          lineGrad.addColorStop(1, `rgba(181, 222, 208, ${p.opacity})`)
        }

        ctx.strokeStyle = lineGrad
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(p.x - p.length, p.y)
        ctx.lineTo(p.x, p.y)
        ctx.stroke()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('mouseleave', onPointerLeave)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
