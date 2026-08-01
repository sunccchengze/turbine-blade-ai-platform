"""
export_fused_onnx.py
导出 P1 双头融合模型为 ONNX（部署用，替换现有 74 维代理）

用法：python backend/scripts/export_fused_onnx.py --checkpoint <fused_best.pt路径>
输出：backend/models/fused_surrogate.onnx

注意：ONNX 输入 = (X_pc 点云, stats 74维, conds 2维)——前端部署时需重构调用链。
"""

import argparse
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))
from scripts.train_fused_p1 import make_fused_model


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--checkpoint", type=str, required=True,
                    help="train_fused_p1.py 生成的 fused_best.pt 路径")
    ap.add_argument("--n_stats", type=int, default=74)
    ap.add_argument("--n_pc", type=int, default=9)
    args = ap.parse_args()

    import torch
    Fused = make_fused_model(args.n_stats, args.n_pc)
    model = Fused()
    model.load_state_dict(torch.load(args.checkpoint, map_location="cpu"))
    model.eval()

    # 构造示例输入（ONNX 导出需要）
    x_pc = torch.randn(1, 512, args.n_pc)
    stats = torch.randn(1, args.n_stats)
    conds = torch.randn(1, 2)

    out_path = ROOT / "backend" / "models" / "fused_surrogate.onnx"
    import io
    import onnx
    buf = io.BytesIO()
    torch.onnx.export(
        model, (x_pc, stats, conds),
        buf,
        input_names=["X_pc", "stats", "conds"],
        output_names=["scalars"],
        dynamic_axes={"X_pc": {0: "batch", 1: "n_points"}, "stats": {0: "batch"}, "conds": {0: "batch"}},
        opset_version=18,
    )
    buf.seek(0)
    model_onnx = onnx.load_model_from_string(buf.read())
    onnx.save(model_onnx, str(out_path))   # onnx.save 默认单文件内嵌权重
    print(f"✅ ONNX 已导出（单文件）：{out_path}")
    print(f"   输入: X_pc (B,512,{args.n_pc}), stats (B,74), conds (B,2)")
    print(f"   输出: scalars (B,3)")


if __name__ == "__main__":
    main()
