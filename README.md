# 🔥 Turbine Blade AI Platform

> AI-driven aerodynamic surrogate model and multi-objective optimization  
> platform for axial compressor blade design

---

## 🌍 Background

In February 2026, KIT (Karlsruhe Institute of Technology) demonstrated a 
compressorless gas turbine running for 303 seconds — breaking NASA's record. 
This breakthrough shifts the performance bottleneck squarely onto turbine 
blade aerodynamic efficiency, making AI-accelerated blade design optimization 
more critical than ever.

---

## 🎯 What This Project Does

Traditional CFD simulation of one blade design takes hours.  
This platform trains a deep learning surrogate model on NASA Rotor 37 
benchmark data to predict blade aerodynamic performance in milliseconds —  
then uses multi-objective optimization (NSGA-II) to find Pareto-optimal designs.

**Full pipeline:**

Parametric Blade Geometry
        ↓
NASA Rotor 37 Benchmark Data
        ↓
PyTorch CNN Surrogate Model (with physical constraints)
        ↓
NSGA-II Multi-Objective Optimization
        ↓
Interactive 3D Design Explorer (React + Three.js)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| AI Model | PyTorch (CNN + Physics Constraints) |
| Optimization | NSGA-II (pymoo) |
| Backend API | FastAPI |
| Frontend | React + Three.js + Plotly.js |
| Deployment | Vercel (frontend) + Railway (backend) |
| Data | NASA Rotor 37 benchmark dataset |

---

## 📅 Development Progress

- [x] Day 01-12: Data pipeline & preprocessing (PLAID NASA Rotor 37, 1,000 samples)
- [x] Day 13-28: PyTorch surrogate model (Residual MLP + physics constraints, MC Dropout UQ, NSGA-II)
- [ ] Day 29-42: Full-stack interactive platform (FastAPI + React + Three.js — 5 pages live, in progress)
- [ ] Day 43-50: Testing, optimization & deployment

**Current status — Day 16:** backend & frontend deployed and live;
design-space explorer (response-surface heatmap) shipped on Day 15.

---

## 📚 References

- KIT Press Release 010/2026: Compressorless Gas Turbine
- Reid, L. & Moore, R.D. (1978). NASA Rotor 37 Design and Performance
- ASME Turbo Expo 2026, Milan