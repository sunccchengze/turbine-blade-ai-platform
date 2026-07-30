"""
main.py
FastAPI 应用主入口
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import predict, optimize

# ── 创建 FastAPI 应用 ──────────────────────────────────────
app = FastAPI(
    title="Turbine Blade AI Platform API",
    description="""
## 叶轮机械叶片气动性能 AI 代理模型 API

基于 NASA Rotor 37 基准数据集训练的深度学习代理模型，
实现叶片气动性能的毫秒级预测和多目标设计优化。

### 背景
2026年2月，KIT（卡尔斯鲁厄理工学院）实现无压缩机燃气轮机
303秒连续运行，打破NASA纪录。这使涡轮叶片气动效率的优化
比以往任何时候都更加关键。

### 核心能力
- **实时预测**：74维叶片特征 → 压比/效率/质量流量（<100ms）
- **不确定性量化**：MC Dropout 置信区间估计
- **多目标优化**：NSGA-II Pareto 前沿（100个最优设计方案）

### 模型性能
| 指标 | R² |
|------|-----|
| 压比 | 0.9861 |
| 效率 | 0.9588 |
| 质量流量 | 0.9845 |
    """,
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS 配置（允许前端跨域访问）──────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # 开发阶段允许所有来源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 注册路由 ───────────────────────────────────────────────
app.include_router(predict.router)
app.include_router(optimize.router)


# ── 根路由 ─────────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "message":     "Turbine Blade AI Platform API",
        "version":     "2.0.0",
        "docs":        "/docs",
        "status":      "running",
        "endpoints": {
            "predict":          "/api/predict/",
            "predict_health":   "/api/predict/health",
            "model_info":       "/api/predict/model-info",
            "pareto_front":     "/api/optimize/pareto",
            "training_stats":   "/api/optimize/training-data-stats",
            "uq_results":       "/api/optimize/uq-results",
        }
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "version": "2.0.0"}