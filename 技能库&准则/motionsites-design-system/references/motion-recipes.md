# MotionSites 经典动效配方库 (Motion Recipes)

> 本文件收集并定制面向风电场科研可视化的 MotionSites 高阶动效提示词与代码实现模板。

---

## 配方 1：动态流场粒子轨迹 (Flow Stream Streaks)

### MotionSites 提示词模版
```text
Create a high-performance 2D Canvas wind streamline particle system for aerodynamic visualization.
- Canvas layered behind turbine SVG nodes but above the velocity contour heatmap.
- 120 particles emitted from the left edge (x=0) with randomized y positions within [-300, 300].
- Particle velocity vector matches the local wind speed field u(x,y) and deflection angle theta(x,y).
- Trail rendering using semi-transparent rgba(255,255,255,0.6) with fading tail (decay rate 0.92).
- When turbine yaw changes, particles dynamically steer and deflect into the corridor gaps in real time.
```

---

## 配方 2：平滑数值跳动器 (Telemetry Spring Counter)

### MotionSites 提示词模版
```text
Implement an animated numeric counter for power telemetry (kW) with tabular number alignment.
- When target value updates (e.g. from 8095 to 10041), smoothly animate using requestAnimationFrame.
- Easing: custom easeOutQuad or spring physics with subtle overshoot.
- Format: automatically insert thousands separators and append unit 'kW'.
- If power increases, flash a subtle sage-green (#6F8761) glow badge that fades out over 600ms.
```

---

## 配方 3：Three.js 3D 机组偏航平滑插值 (3D Turbine Yaw Interpolation)

### MotionSites 提示词模版
```text
Create a Three.js smooth rotor yaw transition controller.
- When the user drags the yaw slider to a new angle gamma_target, do not snap instantly.
- In the render loop: nacelle.rotation.y = THREE.MathUtils.lerp(nacelle.rotation.y, targetRad, 0.08).
- Keep rotor blade continuous spinning around hub z-axis (blade.rotation.z += omega * dt).
- Simultaneously update the translucent 3D wake deficit cone geometry attached to the nacelle rear.
```
