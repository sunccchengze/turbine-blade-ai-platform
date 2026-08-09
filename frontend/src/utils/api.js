import * as ort from 'onnxruntime-web'

// 纯前端数据层：所有公开演示数据和 ONNX 模型随 Cloudflare Pages 静态部署，
// 不再依赖会冷启动的 FastAPI/SnapDeploy 服务。
const DATA_BASE = '/data'
const MODEL_URL = '/models/surrogate_model.onnx'
const OUTPUT_COLS = ['Compression_ratio', 'Efficiency', 'Massflow']

let dataPromise
let sessionPromise

const loadData = async () => {
  if (!dataPromise) {
    dataPromise = Promise.all([
      fetch(`${DATA_BASE}/features.json`).then(r => r.json()),
      fetch(`${DATA_BASE}/pareto.json`).then(r => r.json()),
      fetch(`${DATA_BASE}/evolution.json`).then(r => r.json()),
      fetch(`${DATA_BASE}/uq.json`).then(r => r.json()),
    ]).then(([rows, pareto, evolution, uq]) => ({ rows, pareto, evolution, uq }))
  }
  return dataPromise
}

const getFeatureNames = row => Object.keys(row).filter(k =>
  k !== 'sample_id' && !OUTPUT_COLS.includes(k)
)

const getStats = (rows, names) => Object.fromEntries(names.map(name => {
  const values = rows.map(row => row[name])
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
  return { [name]: { min: Math.min(...values), max: Math.max(...values), mean, std: Math.sqrt(variance) } }
}).map(item => Object.entries(item)[0]))

const getOutputStats = rows => getStats(rows, OUTPUT_COLS)

const buildBaseline = (rows, names) => {
  const stats = getStats(rows, names)
  const index = rows.reduce((best, row, i) => {
    const distance = names.reduce((sum, name) => {
      const scale = stats[name].std || 1
      return sum + ((row[name] - stats[name].mean) / scale) ** 2
    }, 0)
    return distance < best.distance ? { i, distance } : best
  }, { i: 0, distance: Infinity }).i
  const row = rows[index]
  return {
    status: 'success',
    baseline_idx: index,
    features: Object.fromEntries(names.map(name => [name, row[name]])),
    feature_names: names,
    true_performance: Object.fromEntries(OUTPUT_COLS.map(name => [name, row[name]])),
    stats,
  }
}

const getSession = async () => {
  if (!sessionPromise) {
    sessionPromise = ort.InferenceSession.create(MODEL_URL, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    })
  }
  return sessionPromise
}

const predictBatchLocal = async (featuresBatch) => {
  const { rows } = await loadData()
  const names = getFeatureNames(rows[0])
  const inputStats = getStats(rows, names)
  const outputStats = getOutputStats(rows)
  const matrix = featuresBatch.map(features => names.map(name =>
    (features[name] - inputStats[name].mean) / (inputStats[name].std || 1)
  ))
  const session = await getSession()
  const inputName = session.inputNames[0]
  const outputName = session.outputNames[0]
  const tensor = new ort.Tensor('float32', Float32Array.from(matrix.flat()), [matrix.length, names.length])
  const result = await session.run({ [inputName]: tensor })
  const values = Array.from(result[outputName].data)
  return matrix.map((_, i) => Object.fromEntries(OUTPUT_COLS.map((name, j) => [
    name, values[i * OUTPUT_COLS.length + j] * (outputStats[name].std || 1) + outputStats[name].mean,
  ])))
}

export const predictPerformance = async (features, includeUncertainty = false) => {
  const { rows } = await loadData()
  const predictions = (await predictBatchLocal([Object.fromEntries(
    getFeatureNames(rows[0]).map((name, i) => [name, features[i]])
  )]))[0]
  const outputStats = getOutputStats(rows)
  const result = Object.fromEntries(OUTPUT_COLS.map(name => {
    const std = outputStats[name].std * 0.02
    return [name, includeUncertainty
      ? { mean: predictions[name], std, lower_95: predictions[name] - 1.96 * std, upper_95: predictions[name] + 1.96 * std }
      : { value: predictions[name] }]
  }))
  return {
    status: 'success',
    mode: includeUncertainty ? 'statistical' : 'deterministic',
    predictions: result,
    model_version: 'ResidualSurrogate-v2-browser-wasm',
    note: '纯前端 ONNX Runtime Web 推理；UQ 使用静态统计 σ 指示器。',
  }
}

export const getBaselineFeatures = async () => {
  const { rows } = await loadData()
  return buildBaseline(rows, getFeatureNames(rows[0]))
}

export const sweepDesignSpace = async payload => {
  const { rows } = await loadData()
  const names = getFeatureNames(rows[0])
  const baseline = Object.fromEntries(names.map((name, i) => [name, payload.base_features[i]]))
  const stats = getStats(rows, names)
  for (const [name, values] of [[payload.param_x, payload.x_values], [payload.param_y, payload.y_values]]) {
    if (Math.min(...values) < stats[name].min || Math.max(...values) > stats[name].max) {
      throw new Error(`'${name}' 扫描范围超出训练数据范围。代理模型不支持外推预测。`)
    }
  }
  const points = payload.y_values.flatMap(y => payload.x_values.map(x => ({ ...baseline, [payload.param_x]: x, [payload.param_y]: y })))
  const predictions = await predictBatchLocal(points)
  const z = payload.y_values.map((_, yi) => payload.x_values.map((_, xi) => predictions[yi * payload.x_values.length + xi][payload.output]))
  const flat = z.flat()
  return {
    status: 'success', param_x: payload.param_x, param_y: payload.param_y, output: payload.output,
    x_values: payload.x_values, y_values: payload.y_values, z,
    z_min: Math.min(...flat), z_max: Math.max(...flat), z_mean: flat.reduce((a, b) => a + b, 0) / flat.length,
    baseline_prediction: (await predictBatchLocal([baseline]))[0][payload.output],
    n_evaluations: flat.length, elapsed_ms: 0, model_version: 'ResidualSurrogate-v2-browser-wasm',
  }
}

export const getModelInfo = async () => ({
  model_name: 'ResidualSurrogateModel', version: 'v2-browser-wasm', input_dim: 74, output_dim: 3,
  outputs: OUTPUT_COLS, r2_scores: { Compression_ratio: 0.9844, Efficiency: 0.9561, Massflow: 0.9827 },
  r2_evaluated_on: 'held-out test set (n=100, random_state=42)',
  training_data: 'NASA Rotor 37 (PLAID Dataset, 1000 samples)',
})

export const checkHealth = async () => ({ status: 'healthy', model: 'ResidualSurrogateModel', version: 'v2-browser-wasm' })

export const getParetoFront = async () => {
  const { pareto } = await loadData()
  const summaryFor = key => {
    const values = pareto.map(row => row[key])
    return { min: Math.min(...values), max: Math.max(...values), mean: values.reduce((a, b) => a + b, 0) / values.length }
  }
  return {
    status: 'success', n_solutions: pareto.length, pareto_front: pareto,
    summary: { efficiency: summaryFor('Efficiency'), massflow: summaryFor('Massflow'), compression_ratio: summaryFor('Compression_ratio') },
    best_efficiency_solution: pareto.reduce((a, b) => a.Efficiency > b.Efficiency ? a : b),
    best_massflow_solution: pareto.reduce((a, b) => a.Massflow > b.Massflow ? a : b),
  }
}

export const getParetoEvolution = async () => {
  const { evolution } = await loadData()
  return { status: 'success', n_generations: evolution.length, max_generation: evolution.at(-1)?.generation, generations: evolution }
}

export const getTrainingStats = async () => {
  const { rows } = await loadData()
  const statistics = Object.fromEntries(OUTPUT_COLS.map(name => [name, getStats(rows, [name])[name]]))
  return { n_samples: rows.length, statistics }
}

export const getUQResults = async () => {
  const { uq } = await loadData()
  return { status: 'success', n_samples: uq.length, results: uq }
}

export const generateDesign = async (targets, nCandidates = 5) => {
  const baseline = await getBaselineFeatures()
  const { rows } = await loadData()
  const names = baseline.feature_names
  const targetKeys = ['Efficiency', 'Massflow', 'Compression_ratio']
  const ranked = rows
    .map(row => ({ row, distance: targetKeys.reduce((sum, key) => sum + ((row[key] - targets[key]) / (getStats(rows, [key])[key].std || 1)) ** 2, 0) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, nCandidates)
  const predictions = await predictBatchLocal(ranked.map(({ row }) => Object.fromEntries(names.map(name => [name, row[name]]))))
  const candidates = ranked.map(({ row, distance }, i) => ({
    rank: i + 1,
    sample_id: row.sample_id,
    distance: Math.sqrt(distance),
    method: 'browser local nearest-neighbor + ONNX surrogate',
    refined: false,
    geometry: { Omega: row.Omega, P: row.P, Pressure_mean: row.Pressure_mean, Pressure_std: row.Pressure_std, Temperature_mean: row.Temperature_mean, CoordinateY_mean: row.CoordinateY_mean },
    predictions: predictions[i],
  }))
  return { status: 'success', mode: 'browser-wasm', candidates, predictions: candidates[0]?.predictions, geometry: candidates[0]?.geometry, explanation: ['纯前端本地检索与 ONNX 推理已完成。', '结果是代理模型候选，最终仍需几何与收敛 RANS 验证。'], feature_names: names }
}

// 与旧页面兼容的最小 api facade：不发网络请求，所有调用留在浏览器内。
export const api = {
  post: async (path, payload) => {
    if (path === '/api/predict/') return { data: await predictPerformance(payload.features, payload.include_uncertainty) }
    if (path === '/api/assistant/generate') return { data: await generateDesign(payload, payload.n_candidates || 5) }
    if (path === '/api/assistant/design') {
      const targets = { Efficiency: 0.90, Massflow: 20, Compression_ratio: 2 }
      const numbers = String(payload.text || '').match(/[0-9]+(?:\.[0-9]+)?/g)?.map(Number) || []
      if (numbers[0]) targets.Efficiency = numbers[0]
      if (numbers[1]) targets.Massflow = numbers[1]
      if (numbers[2]) targets.Compression_ratio = numbers[2]
      return { data: await generateDesign(targets, 3) }
    }
    throw new Error(`Unsupported local endpoint: ${path}`)
  },
}
