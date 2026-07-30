"""
下载 PLAID Rotor37 数据集
来源：Hugging Face - PLAID-datasets/Rotor37
包含：3D CFD RANS 仿真结果，压气机叶片几何变化下的性能预测数据
"""

from datasets import load_dataset
import os

print("=" * 50)
print("开始下载 PLAID Rotor37 数据集...")
print("来源：PLAID-datasets/Rotor37 @ Hugging Face")
print("=" * 50)

# 下载数据集
hf_dataset = load_dataset(
    "PLAID-datasets/Rotor37",
    split="all_samples",
    cache_dir="./cache"
)

print(f"\n✅ 下载成功！")
print(f"数据集大小：{len(hf_dataset)} 个样本")
print(f"\n数据集特征：")
print(hf_dataset.features)