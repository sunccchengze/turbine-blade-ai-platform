"""
真实 Rotor37 点云几何可实现性审计。

目的：在尝试表面重建或 SU2 网格化前，先检查点云是否具备基本几何质量。
注意：本脚本不生成 CFD 网格，也不证明点云可直接用于 RANS；它只生成
“点云 -> 几何重建”阶段的可追溯输入审计证据。

用法：
    python backend/scripts/audit_geometry_feasibility.py
    python backend/scripts/audit_geometry_feasibility.py --npz path/to/rotor37_pc.npz

输出：
    backend/data/processed/geometry_feasibility.json
    backend/data/processed/geometry_feasibility_report.md
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_NPZ = ROOT / "data" / "processed" / "pointcloud" / "rotor37_pc.npz"
DEFAULT_JSON = ROOT / "backend" / "data" / "processed" / "geometry_feasibility.json"
DEFAULT_REPORT = ROOT / "backend" / "data" / "processed" / "geometry_feasibility_report.md"


def _sample_metrics(coords: np.ndarray, normals: np.ndarray) -> dict:
    finite = bool(np.isfinite(coords).all() and np.isfinite(normals).all())
    if not finite:
        return {"finite": False}

    center = coords.mean(axis=0)
    centered = coords - center
    bbox_min = coords.min(axis=0)
    bbox_max = coords.max(axis=0)
    extent = bbox_max - bbox_min
    # covariance eigenvalues: near-zero smallest eigenvalue can be expected for
    # a surface, while two collapsed dimensions indicate degenerate geometry.
    cov = np.cov(centered, rowvar=False)
    eig = np.linalg.eigvalsh(np.atleast_2d(cov))
    norm_len = np.linalg.norm(normals, axis=1)
    rounded = np.round(coords, decimals=5)
    unique_ratio = len(np.unique(rounded, axis=0)) / max(len(coords), 1)

    return {
        "finite": True,
        "center": center.tolist(),
        "bbox_min": bbox_min.tolist(),
        "bbox_max": bbox_max.tolist(),
        "extent": extent.tolist(),
        "extent_min": float(extent.min()),
        "extent_max": float(extent.max()),
        "cov_eigenvalues": eig.tolist(),
        "normal_length_mean": float(norm_len.mean()),
        "normal_length_std": float(norm_len.std()),
        "normal_length_min": float(norm_len.min()),
        "normal_length_max": float(norm_len.max()),
        "normal_unit_fraction": float(np.mean(np.abs(norm_len - 1.0) <= 0.05)),
        "coordinate_unique_ratio_1e-5": float(unique_ratio),
    }


def _summary(values: list[float]) -> dict:
    x = np.asarray(values, dtype=np.float64)
    return {
        "min": float(np.min(x)),
        "median": float(np.median(x)),
        "mean": float(np.mean(x)),
        "max": float(np.max(x)),
    }


def audit(path: Path) -> dict:
    data = np.load(path, allow_pickle=False)
    required = {"sample_id", "X_pc", "conds", "y"}
    missing = sorted(required - set(data.files))
    if missing:
        raise ValueError(f"NPZ 缺少 keys: {missing}")

    X = data["X_pc"].astype(np.float32)
    sample_id = data["sample_id"]
    conds = data["conds"].astype(np.float32)
    y = data["y"].astype(np.float32)
    if X.ndim != 3 or X.shape[2] < 9:
        raise ValueError(f"需要 S×N×至少9 通道点云，实际为 {X.shape}")
    if len(sample_id) != len(X) or len(conds) != len(X) or len(y) != len(X):
        raise ValueError("sample_id / X_pc / conds / y 样本数不一致")

    per_sample = []
    for i in range(len(X)):
        per_sample.append(_sample_metrics(X[i, :, :3], X[i, :, 6:9]))

    finite_flags = [m.get("finite", False) for m in per_sample]
    extent_min = [m["extent_min"] for m in per_sample if m.get("finite")]
    unique_ratio = [m["coordinate_unique_ratio_1e-5"] for m in per_sample if m.get("finite")]
    normal_unit = [m["normal_unit_fraction"] for m in per_sample if m.get("finite")]
    normal_std = [m["normal_length_std"] for m in per_sample if m.get("finite")]
    eig_min = [min(m["cov_eigenvalues"]) for m in per_sample if m.get("finite")]

    # Conservative flags are for review, not an automatic manufacturing verdict.
    flags = {
        "nonfinite_samples": int(sum(not x for x in finite_flags)),
        "near_degenerate_samples_extent_lt_1e-4": int(sum(x < 1e-4 for x in extent_min)),
        "low_unique_ratio_samples_lt_0.95": int(sum(x < 0.95 for x in unique_ratio)),
        "normals_not_mostly_unit_samples_lt_0.90": int(sum(x < 0.90 for x in normal_unit)),
        "normal_variability_high_samples_std_gt_0.10": int(sum(x > 0.10 for x in normal_std)),
        "rank_collapsed_samples_smallest_cov_eig_lt_1e-8": int(sum(x < 1e-8 for x in eig_min)),
    }

    return {
        "input": str(path),
        "shape": {"samples": int(X.shape[0]), "points": int(X.shape[1]), "channels": int(X.shape[2])},
        "keys": list(data.files),
        "sample_id": {"count": int(len(np.unique(sample_id))), "min": int(sample_id.min()), "max": int(sample_id.max())},
        "conditions": {"Omega_min": float(conds[:, 0].min()), "Omega_max": float(conds[:, 0].max()),
                       "P_min": float(conds[:, 1].min()), "P_max": float(conds[:, 1].max())},
        "performance_labels_present": True,
        "coordinate_global": {"min": X[:, :, :3].min(axis=(0, 1)).tolist(),
                               "max": X[:, :, :3].max(axis=(0, 1)).tolist()},
        "sample_metric_summary": {
            "extent_min": _summary(extent_min),
            "coordinate_unique_ratio_1e-5": _summary(unique_ratio),
            "normal_unit_fraction": _summary(normal_unit),
            "normal_length_std": _summary(normal_std),
            "smallest_cov_eigenvalue": _summary(eig_min),
        },
        "flags": flags,
        "interpretation": {
            "pointcloud_quality": "基本几何质量可审计；需人工检查 flagged samples",
            "mesh_status": "未生成 SU2/CGNS 体网格；点云不等于 CFD 网格",
            "next_gate": "表面重建/拓扑恢复后，再进行网格质量和边界条件审计",
        },
        "per_sample": per_sample,
    }


def write_report(result: dict, report_path: Path) -> None:
    s = result["sample_metric_summary"]
    f = result["flags"]
    lines = [
        "# Rotor37 点云几何可实现性审计报告\n",
        f"> 输入：`{result['input']}` · 形状：{result['shape']['samples']}×{result['shape']['points']}×{result['shape']['channels']}\n",
        "> 本报告只审计点云输入质量，不代表已经存在可运行的 SU2/CGNS 网格，也不代表 RANS 已验证。\n",
        "## 1. 输入概况\n",
        f"- keys：{', '.join(result['keys'])}",
        f"- sample_id：{result['sample_id']['count']} 个唯一值，范围 {result['sample_id']['min']}–{result['sample_id']['max']}",
        f"- Ω：{result['conditions']['Omega_min']:.3f}–{result['conditions']['Omega_max']:.3f}",
        f"- P：{result['conditions']['P_min']:.3f}–{result['conditions']['P_max']:.3f}\n",
        "## 2. 每样本几何质量统计\n",
        "| 指标 | min | median | mean | max |\n|---|---:|---:|---:|---:|",
    ]
    for key, label in [
        ("extent_min", "最小坐标跨度"),
        ("coordinate_unique_ratio_1e-5", "坐标唯一率"),
        ("normal_unit_fraction", "单位法向占比"),
        ("normal_length_std", "法向长度标准差"),
        ("smallest_cov_eigenvalue", "最小协方差特征值"),
    ]:
        v = s[key]
        lines.append(f"| {label} | {v['min']:.6g} | {v['median']:.6g} | {v['mean']:.6g} | {v['max']:.6g} |")
    lines += [
        "\n## 3. 需要人工复核的样本计数\n",
        "| 检查项 | 样本数 |",
        "|---|---:|",
        f"| 非有限值 | {f['nonfinite_samples']} |",
        f"| 坐标跨度接近退化（<1e-4） | {f['near_degenerate_samples_extent_lt_1e-4']} |",
        f"| 坐标唯一率低于 0.95 | {f['low_unique_ratio_samples_lt_0.95']} |",
        f"| 单位法向占比低于 0.90 | {f['normals_not_mostly_unit_samples_lt_0.90']} |",
        f"| 法向长度波动较大 | {f['normal_variability_high_samples_std_gt_0.10']} |",
        f"| 协方差秩疑似塌缩 | {f['rank_collapsed_samples_smallest_cov_eig_lt_1e-8']} |",
        "\n## 4. P4 边界\n",
        "当前点云可作为表面几何重建的输入，但仍缺少面片连接、体网格、边界名称、周期面/混合平面和 SU2 工况配置。下一 Gate 是：表面/拓扑重建 → 网格质量 → 边界条件 → 单算例 RANS。",
    ]
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--npz", type=Path, default=DEFAULT_NPZ)
    parser.add_argument("--json", type=Path, default=DEFAULT_JSON)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    args = parser.parse_args()
    result = audit(args.npz)
    args.json.parent.mkdir(parents=True, exist_ok=True)
    args.json.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    write_report(result, args.report)
    print(f"✅ 几何审计完成：{args.json}")
    print(f"✅ 人读报告完成：{args.report}")
    print(json.dumps(result["flags"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
