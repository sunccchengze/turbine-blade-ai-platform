import axios from 'axios'

const BASE_URL = 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

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

export const getTrainingStats = async () => {
  const response = await api.get('/api/optimize/training-data-stats')
  return response.data
}

export const getUQResults = async () => {
  const response = await api.get('/api/optimize/uq-results')
  return response.data
}