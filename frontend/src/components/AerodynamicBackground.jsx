import { useEffect, useRef } from 'react'

/**
 * AerodynamicBackground (气动探针流场交互背景系统)
 * 
 * 物理与交互特性：
 * 1. 惯性阻尼墨绿探照光斑 (Damped Follower Spotlight · LERP 滤波追踪)
 * 2. 气动流线与势流避障偏转 (Aerodynamic Streamlines with Dipole Deflection)
 * 3. 48px 几何网格近场节点感应高亮 (CFD Mesh Node Proximity Illumination)
 * 4. 压力波声学同心圆涟漪 (Acoustic Pressure Shock Wave on Click/Motion)
 * 5. 视口离屏自动休眠 (0% CPU 占用保障)
 */
export default function AerodynamicBackground({ className = '', style = {} }) {
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

    // 探针位置与阻尼目标
    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      active: false,
    }

    // 涟漪队列
    const ripples = []

    // 气动流线粒子（模拟风洞进气流动）
    const PARTICLE_COUNT = 36
    const particles = []

    const initParticles = (w, h) => {
      particles.length = 0
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          baseY: Math.random() * h,
          speed: 0.6 + Math.random() * 0.9,
          length: 25 + Math.random() * 45,
          opacity: 0.12 + Math.random() * 0.22,
        })
      }
    }

    // 尺寸重设
    const resize = () => {
      if (!container || !canvas) return
      const rect = container.getBoundingClientRect()
      width = rect.width
      height = rect.height
      dpr = Math.min(window.devicePixelRatio || 1, 2) // 限制最大 2x 避免 4K 屏过度绘制

      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.scale(dpr, dpr)

      if (particles.length === 0) {
        initParticles(width, height)
      }

      // 默认初始光斑位置（偏右上方）
      if (!mouse.active) {
        mouse.x = width * 0.72
        mouse.y = height * 0.28
        mouse.targetX = mouse.x
        mouse.targetY = mouse.y
      }
    }

    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)

    // 鼠标移动监听 (Passive 节流)
    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        mouse.targetX = x
        mouse.targetY = y
        mouse.active = true
      }
    }

    const onPointerLeave = () => {
      // 鼠标离开时平滑返回偏右上方初始位
      mouse.targetX = width * 0.72
      mouse.targetY = height * 0.28
      mouse.active = false
    }

    // 点击发射气动压力波涟漪
    const onPointerDown = (e) => {
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        ripples.push({
          x,
          y,
          r: 0,
          maxR: Math.min(width, height) * 0.45,
          opacity: 0.45,
          speed: 4.5,
        })
      }
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    document.addEventListener('mouseleave', onPointerLeave, { passive: true })

    // 视口可见性监听（滚动离开首屏时彻底暂停动画，实现 0% CPU 占用）
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
      if (isVisible && !animationFrameId) {
        render()
      }
    }, { threshold: 0.05 })
    intersectionObserver.observe(container)

    // 动画主循环
    const render = () => {
      if (!isVisible) {
        animationFrameId = null
        return
      }

      const isLight = document.documentElement.dataset.theme === 'light'
      ctx.clearRect(0, 0, width, height)

      // 1. 阻尼平滑插值 (LERP)
      const lerpFactor = mouse.active ? 0.08 : 0.03
      mouse.x += (mouse.targetX - mouse.x) * lerpFactor
      mouse.y += (mouse.targetY - mouse.y) * lerpFactor

      // 2. 绘制惯性阻尼墨绿探照聚光斑 (Damped Follower Spotlight)
      const spotRadius = 420
      const spotGrad = ctx.createRadialGradient(
        mouse.x, mouse.y, 0,
        mouse.x, mouse.y, spotRadius
      )
      if (isLight) {
        spotGrad.addColorStop(0, 'rgba(45, 117, 105, 0.12)')
        spotGrad.addColorStop(0.35, 'rgba(45, 117, 105, 0.05)')
        spotGrad.addColorStop(1, 'rgba(45, 117, 105, 0)')
      } else {
        spotGrad.addColorStop(0, 'rgba(52, 211, 153, 0.14)')
        spotGrad.addColorStop(0.4, 'rgba(134, 185, 170, 0.05)')
        spotGrad.addColorStop(1, 'rgba(11, 14, 13, 0)')
      }

      ctx.fillStyle = spotGrad
      ctx.beginPath()
      ctx.arc(mouse.x, mouse.y, spotRadius, 0, Math.PI * 2)
      ctx.fill()

      // 3. 绘制 48px CFD 正交几何网格与近场节点感应
      const GRID_SIZE = 48
      const PROXIMITY_RADIUS = 150
      const PROXIMITY_SQ = PROXIMITY_RADIUS * PROXIMITY_RADIUS

      ctx.lineWidth = 1

      // 绘制纵横网格线与感应交叉点
      for (let x = 0; x <= width; x += GRID_SIZE) {
        for (let y = 0; y <= height; y += GRID_SIZE) {
          const dx = x - mouse.x
          const dy = y - mouse.y
          const distSq = dx * dx + dy * dy

          if (distSq < PROXIMITY_SQ) {
            // 近场高亮加权
            const intensity = Math.pow(1 - distSq / PROXIMITY_SQ, 2)
            ctx.fillStyle = isLight
              ? `rgba(45, 117, 105, ${0.15 + intensity * 0.45})`
              : `rgba(52, 211, 153, ${0.18 + intensity * 0.55})`

            // 在网格交点绘制精密 2px 工科传感器方点 (Sensor Node)
            const nodeSize = 1.5 + intensity * 2
            ctx.fillRect(x - nodeSize / 2, y - nodeSize / 2, nodeSize, nodeSize)
          }
        }
      }

      // 4. 绘制气动流线粒子（势流避障偏转）
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.speed

        // 循环边界复位
        if (p.x > width + p.length) {
          p.x = -p.length
          p.y = Math.random() * height
          p.baseY = p.y
        }

        // 计算光标（探针）对流线的圆柱绕流偶极子偏转
        const dx = p.x - mouse.x
        const dy = p.baseY - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const R = 80 // 探针有效气动扰动半径

        if (dist < R && dist > 1) {
          // 势流偶极子垂直推挤偏转
          const push = (1 - dist / R) * (dy >= 0 ? 1 : -1) * 22
          p.y += (p.baseY + push - p.y) * 0.15
        } else {
          p.y += (p.baseY - p.y) * 0.06
        }

        // 绘制单条流线段
        const lineGrad = ctx.createLinearGradient(p.x - p.length, p.y, p.x, p.y)
        if (isLight) {
          lineGrad.addColorStop(0, 'rgba(45, 117, 105, 0)')
          lineGrad.addColorStop(1, `rgba(45, 117, 105, ${p.opacity})`)
        } else {
          lineGrad.addColorStop(0, 'rgba(134, 185, 170, 0)')
          lineGrad.addColorStop(1, `rgba(181, 222, 208, ${p.opacity})`)
        }

        ctx.strokeStyle = lineGrad
        ctx.beginPath()
        ctx.moveTo(p.x - p.length, p.y)
        ctx.lineTo(p.x, p.y)
        ctx.stroke()
      }

      // 5. 绘制压力波同心圆涟漪 (Acoustic Pressure Shock Waves)
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i]
        r.r += r.speed
        r.opacity *= 0.965 // 衰减

        if (r.r >= r.maxR || r.opacity <= 0.01) {
          ripples.splice(i, 1)
          continue
        }

        ctx.strokeStyle = isLight
          ? `rgba(45, 117, 105, ${r.opacity * 0.6})`
          : `rgba(181, 222, 208, ${r.opacity * 0.8})`
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2)
        ctx.stroke()

        // 伴随微弱的内层同心次级波
        if (r.r > 25) {
          ctx.strokeStyle = isLight
            ? `rgba(45, 117, 105, ${r.opacity * 0.3})`
            : `rgba(134, 185, 170, ${r.opacity * 0.4})`
          ctx.beginPath()
          ctx.arc(r.x, r.y, r.r - 20, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    // 启动动画
    render()

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('mouseleave', onPointerLeave)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={`aerodynamic-bg-container ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        ...style
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      />
    </div>
  )
}
