import { useEffect, useRef } from 'react'

/**
 * AmbientAerodynamicBackground (全站子页面柔和气动氛围背景系统)
 * 
 * 特性：
 * 1. 650px 广域超柔焦漫射光斑 (极低不透明度 3.5%~5%)
 * 2. 400ms 慢速流体惯性阻尼跟随 (LERP α=0.025)
 * 3. 12 条超慢速平行层流发丝线 (0.25 px/frame 静谧漂浮)
 * 4. 48px CFD 几何网格 8s 周期正弦呼吸微光
 * 5. 全局单例穿透 (pointer-events: none)，0% CPU 开销
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
      x: window.innerWidth * 0.75,
      y: window.innerHeight * 0.25,
      targetX: window.innerWidth * 0.75,
      targetY: window.innerHeight * 0.25,
      active: false,
    }

    const PARTICLE_COUNT = 12
    const particles = []

    const initParticles = (w, h) => {
      particles.length = 0
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          baseY: Math.random() * h,
          speed: 0.2 + Math.random() * 0.3,
          length: 40 + Math.random() * 60,
          opacity: 0.06 + Math.random() * 0.08,
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
      mouse.targetX = width * 0.75
      mouse.targetY = height * 0.25
      mouse.active = false
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('mouseleave', onPointerLeave, { passive: true })

    const onVisibilityChange = () => {
      isVisible = !document.hidden
      if (isVisible && !animationFrameId) {
        render(0)
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    let startTime = performance.now()

    const render = (time) => {
      if (!isVisible) {
        animationFrameId = null
        return
      }

      const isLight = document.documentElement.dataset.theme === 'light'
      ctx.clearRect(0, 0, width, height)

      // 1. 超慢速流体惯性插值 (LERP α=0.025)
      mouse.x += (mouse.targetX - mouse.x) * 0.025
      mouse.y += (mouse.targetY - mouse.y) * 0.025

      // 2. 650px 广域柔焦探照微光
      const spotRadius = 650
      const spotGrad = ctx.createRadialGradient(
        mouse.x, mouse.y, 0,
        mouse.x, mouse.y, spotRadius
      )
      if (isLight) {
        spotGrad.addColorStop(0, 'rgba(45, 117, 105, 0.045)')
        spotGrad.addColorStop(0.4, 'rgba(45, 117, 105, 0.015)')
        spotGrad.addColorStop(1, 'rgba(248, 247, 242, 0)')
      } else {
        spotGrad.addColorStop(0, 'rgba(52, 211, 153, 0.06)')
        spotGrad.addColorStop(0.4, 'rgba(134, 185, 170, 0.018)')
        spotGrad.addColorStop(1, 'rgba(11, 14, 13, 0)')
      }

      ctx.fillStyle = spotGrad
      ctx.beginPath()
      ctx.arc(mouse.x, mouse.y, spotRadius, 0, Math.PI * 2)
      ctx.fill()

      // 3. 48px CFD 网格 8s 周期正弦呼吸微光
      const elapsed = (time - startTime) / 1000
      const breathe = Math.sin(elapsed * 0.78) * 0.015 + 0.035

      ctx.strokeStyle = isLight
        ? `rgba(45, 117, 105, ${breathe * 1.1})`
        : `rgba(134, 185, 170, ${breathe})`
      ctx.lineWidth = 0.75

      // 绘制极其微弱的网格线
      ctx.beginPath()
      const GRID = 48
      for (let x = 0; x <= width; x += GRID) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
      }
      for (let y = 0; y <= height; y += GRID) {
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
      }
      ctx.stroke()

      // 4. 12 条超慢速平行层流发丝线
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.speed

        if (p.x > width + p.length) {
          p.x = -p.length
          p.y = Math.random() * height
          p.baseY = p.y
        }

        // 微小微扰
        const dy = p.baseY - mouse.y
        const dist = Math.abs(dy)
        if (dist < 120) {
          p.y += (p.baseY + (dy >= 0 ? 1 : -1) * 6 - p.y) * 0.03
        } else {
          p.y += (p.baseY - p.y) * 0.015
        }

        const lineGrad = ctx.createLinearGradient(p.x - p.length, p.y, p.x, p.y)
        if (isLight) {
          lineGrad.addColorStop(0, 'rgba(45, 117, 105, 0)')
          lineGrad.addColorStop(1, `rgba(45, 117, 105, ${p.opacity * 0.7})`)
        } else {
          lineGrad.addColorStop(0, 'rgba(134, 185, 170, 0)')
          lineGrad.addColorStop(1, `rgba(181, 222, 208, ${p.opacity})`)
        }

        ctx.strokeStyle = lineGrad
        ctx.lineWidth = 0.8
        ctx.beginPath()
        ctx.moveTo(p.x - p.length, p.y)
        ctx.lineTo(p.x, p.y)
        ctx.stroke()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render(0)

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
