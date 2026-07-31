"""
generate_pareto_evolution.py
生成 NSGA-II 优化过程的演化轨迹数据（Day 22 动画数据源）

与 notebooks/06_multiobjective_optimization.ipynb 完全同源：
- 同一数据集、同一随机种子 (SEED=42)、同一算法配置
- 评估使用生产 ONNX 模型（与后端推理一致，数值与 .pth 等价）

输出：backend/data/processed/pareto_evolution.csv
  列：gen, design_id, Efficiency, Massflow, Compression_ratio
  （记录 gen=1 及每 10 代一帧非支配前沿，共 21 帧；design_id 为帧内序号）

用法：python backend/scripts/generate_pareto_evolution.py
"""

import numpy as np
import pandas as pd
import joblib
import onnxruntime as ort
import warnings

from pathlib import Path
from sklearn.model_selection import train_test_split

from pymoo.core.problem import Problem
from pymoo.algorithms.moo.nsga2 import NSGA2
from pymoo.operators.crossover.sbx import SBX
from pymoo.operators.mutation.pm import PM
from pymoo.operators.sampling.rnd import FloatRandomSampling
from pymoo.optimize import minimize
from pymoo.core.callback import Callback
from pymoo.util.nds.non_dominated_sorting import NonDominatedSorting

warnings.filterwarnings('ignore')

SEED = 42
np.random.seed(SEED)

ROOT   = Path(__file__).resolve().parents[2]          # 仓库根
DATA   = ROOT / "backend" / "data" / "processed"
MODELS = ROOT / "backend" / "models"

# ── 1. 数据与模型（与 notebook 06 同源）──────────────────────
df = pd.read_csv(DATA / "plaid_rotor37_features.csv")
input_cols  = [c for c in df.columns
               if c not in ['sample_id', 'Compression_ratio',
                            'Efficiency', 'Massflow']]
output_cols = ['Compression_ratio', 'Efficiency', 'Massflow']

X_raw = df[input_cols].values.astype(np.float32)
y_raw = df[output_cols].values.astype(np.float32)

X_temp, X_test, y_temp, y_test = train_test_split(
    X_raw, y_raw, test_size=0.10, random_state=SEED)
X_train, X_val, y_train, y_val = train_test_split(
    X_temp, y_temp, test_size=0.111, random_state=SEED)

scaler_X = joblib.load(MODELS / "scaler_X_v2.pkl")
scaler_y = joblib.load(MODELS / "scaler_y_v2.pkl")
sess = ort.InferenceSession(str(MODELS / "surrogate_model.onnx"))
input_name = sess.get_inputs()[0].name

X_min = X_train.min(axis=0)
X_max = X_train.max(axis=0)


def surrogate_predict(X_original):
    """输入原始量纲 (N,74) → 输出原始量纲 (N,3)：[π, η, ṁ]"""
    X_scaled = scaler_X.transform(X_original.astype(np.float32))
    pred = sess.run(None, {input_name: X_scaled.astype(np.float32)})[0]
    return scaler_y.inverse_transform(pred)


# ── 2. 优化问题（与 notebook 06 完全一致）────────────────────
class TurbineBladeOptimization(Problem):
    """决策变量 74 维；目标1 最大化 η，目标2 最大化 ṁ；
    约束：π ≥ 1.8，η ≥ 0.84（pymoo 格式 g ≤ 0）"""

    def __init__(self):
        super().__init__(
            n_var=len(input_cols), n_obj=2, n_ieq_constr=2,
            xl=X_min.astype(np.float64), xu=X_max.astype(np.float64),
        )

    def _evaluate(self, X, out, *args, **kwargs):
        pred = surrogate_predict(X.astype(np.float32))
        comp_ratio, efficiency, massflow = pred[:, 0], pred[:, 1], pred[:, 2]
        out["F"] = np.column_stack([-efficiency, -massflow])
        out["G"] = np.column_stack([1.8 - comp_ratio, 0.84 - efficiency])


# ── 3. 演化记录器：每 10 代记录一帧非支配前沿 ────────────────
class EvolutionRecorder(Callback):
    def __init__(self, every=10):
        super().__init__()
        self.every   = every
        self.records = []          # [(gen, DataFrame)]

    def notify(self, algorithm):
        gen = algorithm.n_gen
        if gen % self.every != 0 and gen != 1:
            return
        pop = algorithm.pop
        F   = pop.get("F")
        if F is None or len(F) == 0:
            return
        # 非支配前沿（pymoo 默认最小化，F 已取负 → 前沿 = 非支配解）
        nds = NonDominatedSorting().do(F, only_non_dominated_front=True)
        X_nd = pop.get("X")[nds]
        pred = surrogate_predict(X_nd.astype(np.float32))
        frame = pd.DataFrame({
            "gen":                 gen,
            "design_id":           np.arange(len(nds)),
            "Efficiency":          pred[:, 1],
            "Massflow":            pred[:, 2],
            "Compression_ratio":   pred[:, 0],
        })
        self.records.append(frame)
        print(f"  gen {gen:>3}: 非支配解 {len(nds):>3} 个")


# ── 4. 运行优化 ─────────────────────────────────────────────
print("=" * 60)
print("NSGA-II 演化轨迹生成（200 代，每 10 代记录一帧）")
print("=" * 60)

recorder = EvolutionRecorder(every=10)
algorithm = NSGA2(
    pop_size=100,
    sampling=FloatRandomSampling(),
    crossover=SBX(prob=0.9, eta=15),
    mutation=PM(eta=20),
    eliminate_duplicates=True,
)

result = minimize(
    TurbineBladeOptimization(),
    algorithm,
    ('n_gen', 200),
    seed=SEED,
    verbose=False,
    callback=recorder,
)

# ── 5. 保存演化轨迹 ─────────────────────────────────────────
evolution_df = pd.concat(recorder.records, ignore_index=True)
evo_path = DATA / "pareto_evolution.csv"
evolution_df.to_csv(evo_path, index=False)

print(f"\n✅ 演化轨迹已保存：{evo_path}")
print(f"   帧数（代数快照）：{evolution_df['gen'].nunique()}")
print(f"   总记录数：{len(evolution_df)}")
print(f"   代数序列：{sorted(evolution_df['gen'].unique())}")
print(f"   末帧（gen=200）非支配解数：{len(evolution_df[evolution_df['gen']==200])}")

# ── 6. 保存最终 Pareto 前沿（与演化末帧同源，覆盖旧 CSV）──────
nds = NonDominatedSorting().do(result.F, only_non_dominated_front=True)
pareto_designs = result.X[nds]
pareto_pred    = surrogate_predict(pareto_designs.astype(np.float32))

pareto_df = pd.DataFrame({
    'design_id':         np.arange(len(nds)),
    'Efficiency':        pareto_pred[:, 1],
    'Massflow':          pareto_pred[:, 2],
    'Compression_ratio': pareto_pred[:, 0],
})
for j, col in enumerate(input_cols):
    pareto_df[col] = pareto_designs[:, j]
pareto_df = pareto_df.sort_values('Efficiency', ascending=False).reset_index(drop=True)

pf_path = DATA / "pareto_front_solutions.csv"
pareto_df.to_csv(pf_path, index=False)
print(f"\n✅ 最终 Pareto 前沿已更新：{pf_path}")
print(f"   解的数量：{len(pareto_df)}（按效率降序，含 74 维设计变量）")
print(f"   max η = {pareto_df['Efficiency'].max():.4f} · "
      f"max ṁ = {pareto_df['Massflow'].max():.2f} · "
      f"max π = {pareto_df['Compression_ratio'].max():.4f}")
