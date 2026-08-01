"""
run_su2_validation_p4.py
P4 SU2 抽查验证模块：P3 生成的候选叶片 → SU2 RANS 验证 → 「代理 vs CFD」对比

内阁裁决（plan-30day-D38.md）：P4 降级为「抽查验证模块」——只验 top 5–10 个解，
时间盒 ≤5 天；SU2 与 PLAID 定位为「相对趋势验证」（定量对不上属正常，写讨论点）。

用法（需本地安装 SU2，Docker 方式）：
    docker pull su2code/su2
    python backend/scripts/run_su2_validation_p4.py --candidates candidates.npy --dry-run

--dry-run：不实际调用 SU2，输出骨架 JSON（占位），验证流程可跑通。
真实运行：需要 SU2 二进制 + Rotor37 网格 + 配置文件（本脚本生成 config 模板）。

输出：data/processed/p4/runs/<ts>/（comparison.json: 代理预测 vs CFD 实测）
"""

import argparse
import json
import shutil
import subprocess
import time
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
RUNS_DIR = ROOT / "data" / "processed" / "p4" / "runs"

SU2_CFD = shutil.which("SU2_CFD") or shutil.which("su2_cfd") or "SU2_CFD"


def write_config_template(run_dir, candidate_id):
    """生成 SU2 配置文件模板（占位；真实网格/边界条件待按 Rotor37 几何装配）。"""
    cfg = run_dir / f"case_{candidate_id}.cfg"
    cfg.write_text(
        f"""SOLVER= RANS
KIND_TURB_MODEL= SA
MATH_PROBLEM= DIRECT
RESTART_SOL= NO
MACH_NUMBER= 0.4
AOA= 0.0
REYNOLDS_NUMBER= 2.5e6
REYNOLDS_LENGTH= 0.05
FREESTREAM_PRESSURE= 101325.0
FREESTREAM_TEMPERATURE= 288.15
MESH_FILENAME= rotor37_mesh.su2
ITER= 2000
MONITOR_OUTPUT= RESTART
WRT_SOL_FREQ= 2000
# 注：真实算例需 Rotor37 网格 + 混平面（多排）配置，见 SU2 turbomachinery 教程
""", encoding="utf-8")
    return cfg


def run_su2(cfg_path, dry_run=True):
    """调用 SU2_CFD（或占位返回）。"""
    if dry_run:
        return {
            "status": "dry_run（未调用真实 SU2；真实运行需 SU2 二进制 + 网格）",
            "CFD_efficiency": None,
            "CFD_pressure_ratio": None,
            "CFD_massflow": None,
        }
    # 真实调用（占位实现，等 SU2 环境就绪）
    proc = subprocess.run([SU2_CFD, str(cfg_path)], capture_output=True, text=True)
    return {"status": f"SU2 exit {proc.returncode}", "log_tail": proc.stdout[-500:]}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--candidates", type=str, default=None,
                    help="P3 生成的候选几何 .npy（可选）")
    ap.add_argument("--dry-run", action="store_true", default=True,
                    help="占位运行（不调真实 SU2）")
    ap.add_argument("--n_validate", type=int, default=5)
    args = ap.parse_args()

    ts = time.strftime("%Y%m%d-%H%M%S")
    run_dir = RUNS_DIR / ts
    run_dir.mkdir(parents=True, exist_ok=True)

    # 候选几何（无则用占位）
    if args.candidates and Path(args.candidates).exists():
        cands = np.load(args.candidates)
        n = min(len(cands), args.n_validate)
        print(f"使用 {n} 个候选（来自 {args.candidates}）")
    else:
        n = args.n_validate
        print(f"未提供候选，使用 {n} 个占位候选（dry-run）")

    comparison = {"candidates": [], "note": "SU2 与 PLAID 定位为相对趋势验证"}
    for i in range(n):
        cfg = write_config_template(run_dir, i)
        result = run_su2(cfg, dry_run=args.dry_run)
        comparison["candidates"].append({
            "candidate_id": i,
            "surrogate_prediction": {"Efficiency": None, "Compression_ratio": None, "Massflow": None},
            # 占位：真实运行后填入 P1 代理预测 + SU2 实测
            "CFD_result": result,
        })

    out = run_dir / "comparison.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(comparison, f, ensure_ascii=False, indent=2)
    print(f"\n✅ P4 抽查验证模块骨架已生成：{out}")
    print(f"   验证候选数：{n} | 模式：{'dry-run 占位' if args.dry_run else '真实 SU2'}")


if __name__ == "__main__":
    main()
