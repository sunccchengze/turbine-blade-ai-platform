import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ||
  'https://turbine-blade-api-c4f40.containers.snapdeploy.app'

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,  // 60秒超时，应对冷启动
  headers: { 'Content-Type': 'application/json' },
})

// 请求拦截器
api.interceptors.request.use(config => config)

// 响应拦截器：统一错误处理
api.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ECONNABORTED') {
      error.userMessage = 'Server is waking up, please wait...'
    } else if (!error.response) {
      error.userMessage = 'Cannot connect to server. Please try again.'
    } else {
      error.userMessage = `Server error: ${error.response.status}`
    }
    return Promise.reject(error)
  }
)

// ── 预测相关 ──────────────────────────────────────────────
export const predictPerformance = async (features, includeUncertainty = false) => {
  const response = await api.post('/api/predict/', {
    features,
    include_uncertainty: includeUncertainty,
    n_mc_samples: 100,
  })
  return response.data
}

export const getBaselineFeatures = async () => {
  const response = await api.get('/api/predict/baseline-features')
  return response.data
}

// 设计空间二维扫描：固定其余72维，x×y网格批量预测（热力图数据源）
export const sweepDesignSpace = async (payload) => {
  const response = await api.post('/api/predict/sweep', payload)
  return response.data
}

export const getModelInfo = async () => {
  const response = await api.get('/api/predict/model-info')
  return response.data
}

export const checkHealth = async () => {
  const response = await api.get('/health')
  return response.data
}

// ── 优化相关 ──────────────────────────────────────────────
export const getParetoFront = async () => {
  const response = await api.get('/api/optimize/pareto')
  return response.data
}

// NSGA-II 演化轨迹（每 10 代一帧非支配前沿，演化动画数据源）
export const getParetoEvolution = async () => {
  const response = await api.get('/api/optimize/pareto-evolution')
  return response.data
}

export const getTrainingStats = async () => {
  const response = await api.get('/api/optimize/training-data-stats')
  return response.data
}

export const getUQResults = async () => {
  const response = await api.get('/api/optimize/uq-results')
  return response.data
}