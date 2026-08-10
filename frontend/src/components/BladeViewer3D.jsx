import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import './BladeViewer3D.css'

function airfoilProfile(camber, thickness, n = 40) {
  const upper = []
  const lower = []
  const p = 0.4

  for (let i = 0; i <= n; i++) {
    const xc = i / n
    const yc = xc < p
      ? (camber / (p * p)) * (2 * p * xc - xc * xc)
      : (camber / ((1 - p) * (1 - p))) * (1 - 2 * p + 2 * p * xc - xc * xc)
    const yt = (thickness / 0.2) * (
        0.2969 * Math.sqrt(Math.max(1e-6, xc))
      - 0.1260 * xc
      - 0.3516 * xc * xc
      + 0.2843 * xc * xc * xc
      - 0.1015 * xc * xc * xc * xc
    )
    const dyc   = xc < p
      ? (camber / (p * p))           * (2 * p - 2 * xc)
      : (camber / ((1-p) * (1-p)))   * (2 * p - 2 * xc)
    const theta = Math.atan(dyc)
    upper.push([xc - yt * Math.sin(theta), yc + yt * Math.cos(theta)])
    lower.push([xc + yt * Math.sin(theta), yc - yt * Math.cos(theta)])
  }

  const profile = []
  for (const pt of upper)                profile.push(pt)
  for (const pt of [...lower].reverse()) profile.push(pt)
  return profile
}

function buildBladeGeometry(params) {
  const {
    omega = 1710, pMean = 109000,
    pStd  = 34000, tMean = 349, rMean = 0.220,
  } = params

  const omegaN = Math.max(0, Math.min(1, (omega - 1620) / 180))
  const pMeanN = Math.max(0, Math.min(1, (pMean - 50000)  / 100000))
  const pStdN  = Math.max(0, Math.min(1, (pStd  - 10000)  / 50000))
  const tMeanN = Math.max(0, Math.min(1, (tMean - 308)    / 72))
  const rMeanN = Math.max(0, Math.min(1, (rMean - 0.176)  / 0.075))

  const chord      = 0.038 + omegaN * 0.008
  const camber     = 0.06  + pMeanN * 0.12
  const thickness  = 0.08  + pStdN  * 0.04
  const twistRoot  = 55    + omegaN * 15
  const twistTip   = 25    + omegaN * 8
  const spanHeight = 0.068 + rMeanN * 0.018
  const sweep      = omegaN * 0.008

  const SPAN    = 18
  const PROFILE = 40

  const tmpl   = airfoilProfile(camber, thickness, PROFILE)
  const stride = tmpl.length

  const positions = []
  const colors    = []
  const indices   = []

  for (let s = 0; s <= SPAN; s++) {
    const t          = s / SPAN
    const radius     = 0.176 + t * spanHeight
    const chordLocal = chord * (1 - t * 0.18)
    const twistAngle = (twistRoot + (twistTip - twistRoot) * t) * Math.PI / 180
    const sweepX     = sweep * t

    for (let p = 0; p < stride; p++) {
      const [xc, zc] = tmpl[p]

      const xLocal = (xc - 0.5) * chordLocal + sweepX
      const zLocal = zc * chordLocal
      const xW     = xLocal * Math.cos(twistAngle) - zLocal * Math.sin(twistAngle)
      const zW     = xLocal * Math.sin(twistAngle) + zLocal * Math.cos(twistAngle)
      positions.push(xW, radius, zW)

      const isUpper  = p <= PROFILE
      const basePres = isUpper
        ? 0.20 + xc * 0.30
        : 0.55 + xc * 0.20
      const pFinal   = basePres + pMeanN * 0.15
      const hue      = Math.max(0.28, 0.46 - pFinal * 0.12)
      const light    = 0.40 + tMeanN * 0.14 + t * 0.06
      const col      = new THREE.Color().setHSL(hue, 0.38, light)
      colors.push(col.r, col.g, col.b)
    }
  }

  // 侧面三角形
  for (let s = 0; s < SPAN; s++) {
    for (let p = 0; p < stride - 1; p++) {
      const a = s * stride + p
      const b = a + 1
      const c = (s + 1) * stride + p
      const d = c + 1
      indices.push(a, c, b, b, c, d)
    }
    const a = s * stride + stride - 1
    const b = s * stride
    const c = (s + 1) * stride + stride - 1
    const d = (s + 1) * stride
    indices.push(a, c, b, b, c, d)
  }

  // 叶根端盖
  const rootCenter = positions.length / 3
  positions.push(0, 0.176, 0)
  colors.push(0.3, 0.4, 0.8)
  for (let p = 0; p < stride - 1; p++) {
    indices.push(rootCenter, p + 1, p)
  }

  // 叶尖端盖
  const tipCenter = positions.length / 3
  const tipBase   = SPAN * stride
  positions.push(0, 0.176 + spanHeight, 0)
  colors.push(0.5, 0.8, 0.6)
  for (let p = 0; p < stride - 1; p++) {
    indices.push(tipCenter, tipBase + p, tipBase + p + 1)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color',    new THREE.Float32BufferAttribute(colors,    3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  return geometry
}

function BladeMesh({ params }) {
  const groupRef = useRef()
  const isLight = typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light'

  const geometryKey = [
    Math.round((params.omega  || 1710)   / 5),
    Math.round((params.pMean  || 109000) / 1000),
    Math.round((params.pStd   || 34000)  / 500),
    Math.round((params.tMean  || 349)    / 2),
    Math.round((params.rMean  || 0.220)  * 200),
  ]

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const geometry = useMemo(() => buildBladeGeometry(params), geometryKey)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.18
    }
  })

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry}>
        <meshPhongMaterial
          vertexColors
          side={THREE.DoubleSide}
          shininess={isLight ? 85 : 70}
          specular={new THREE.Color(isLight ? 0x8ba699 : 0x6d887b)}
        />
      </mesh>
      <mesh geometry={geometry}>
        <meshBasicMaterial
          color={isLight ? '#2d7569' : '#49675d'}
          wireframe
          transparent
          opacity={isLight ? 0.08 : 0.05}
        />
      </mesh>
    </group>
  )
}

function ParticleField() {
  const ref = useRef()
  const geo = useMemo(() => {
    const count = 100
    const pos   = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 0.35
      pos[i * 3 + 1] = Math.random() * 0.10 + 0.170
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.18
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    return g
  }, [])

  useFrame((s) => {
    if (ref.current) ref.current.rotation.y = s.clock.getElapsedTime() * 0.04
  })

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        color="#86b9aa" size={0.0012}
        transparent opacity={0.4} sizeAttenuation
      />
    </points>
  )
}

function Lights() {
  const isLight = typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light'
  return (
    <>
      <ambientLight intensity={isLight ? 0.75 : 0.5} />
      <directionalLight position={[0.18, 0.35, 0.15]} intensity={isLight ? 1.7 : 1.4} color={isLight ? '#ffffff' : '#f3eee0'} />
      <directionalLight position={[-0.18, 0.22, -0.12]} intensity={isLight ? 0.5 : 0.6} color="#86b9aa" />
      <pointLight position={[0.05, 0.25, 0.10]} intensity={isLight ? 0.7 : 0.8} color="#e7c85b" distance={0.4} />
    </>
  )
}

export default function BladeViewer3D({
  params        = {},
  efficiency    = null,
  pressureRatio = null,
  massflow      = null,
  height        = 300,
}) {
  const bladeParams = {
    omega : params.Omega            || 1710,
    pMean : params.Pressure_mean    || 109000,
    pStd  : params.Pressure_std     || 34000,
    tMean : params.Temperature_mean || 349,
    rMean : params.CoordinateY_mean || 0.220,
  }

  return (
    <div className="blade-viewer-container" style={{ height }}>
      <Canvas
        gl={{ antialias: true, alpha: true }}
        dpr={Math.min(window.devicePixelRatio, 2)}
      >
        <PerspectiveCamera makeDefault position={[0.10, 0.215, 0.16]} fov={40} />
        <Lights />
        <ParticleField />
        <Suspense fallback={null}>
          <BladeMesh params={bladeParams} />
        </Suspense>
        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          minDistance={0.06}
          maxDistance={0.40}
          enablePan={false}
          target={[0, 0.213, 0]}
        />
      </Canvas>

      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '12px 14px'
      }}>
        <div style={{
          fontFamily: 'var(--mono)',
          fontSize: '10px',
          fontWeight: 600,
          color: 'var(--muted)',
          letterSpacing: '0.08em'
        }}>
          NASA ROTOR 37 · 3D BLADE GEOMETRY
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          fontSize: '11px',
          fontFamily: 'var(--mono)'
        }}>
          {(efficiency != null || pressureRatio != null || massflow != null) ? (
            <div style={{ display: 'flex', gap: 10 }}>
              {efficiency != null && <span style={{ color: 'var(--yellow)', fontWeight: 600 }}>η = {Number(efficiency).toFixed(4)}</span>}
              {pressureRatio != null && <span style={{ color: 'var(--rust)', fontWeight: 600 }}>π = {Number(pressureRatio).toFixed(4)}</span>}
              {massflow != null && <span style={{ color: 'var(--teal-bright)', fontWeight: 600 }}>ṁ = {Number(massflow).toFixed(3)}</span>}
            </div>
          ) : <div />}

          <span style={{ fontSize: '10px', color: 'var(--faint)' }}>
            拖拽旋转 · 滚轮缩放
          </span>
        </div>
      </div>
    </div>
  )
}
