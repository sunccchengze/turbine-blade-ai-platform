"""
探索 PLAID Rotor37 数据集结构
目标：搞清楚每个样本里有什么字段，数据形状是什么
"""

from datasets import load_dataset
import pickle
import numpy as np
import io

print("=" * 60)
print("加载 PLAID Rotor37 数据集...")
print("=" * 60)

# 加载数据集
dataset = load_dataset(
    "PLAID-datasets/Rotor37",
    split="all_samples",
    cache_dir="./cache"
)

print(f"✅ 加载成功，共 {len(dataset)} 个样本\n")

# ── 解包第一个样本，看结构 ──────────────────────────────
print("=" * 60)
print("解包第 1 个样本，探索内部结构...")
print("=" * 60)

raw_bytes = dataset[0]['sample']
sample = pickle.loads(raw_bytes)

print(f"\n样本类型：{type(sample)}")

# 如果是字典，打印所有键
if isinstance(sample, dict):
    print(f"\n包含 {len(sample)} 个字段：")
    print("-" * 60)
    for key, value in sample.items():
        if isinstance(value, np.ndarray):
            print(f"  🔢 {key}")
            print(f"       形状: {value.shape}")
            print(f"       类型: {value.dtype}")
            print(f"       最小值: {value.min():.6f}")
            print(f"       最大值: {value.max():.6f}")
            print(f"       均值:   {value.mean():.6f}")
        elif isinstance(value, (int, float)):
            print(f"  📌 {key} = {value}")
        elif isinstance(value, str):
            print(f"  📝 {key} = '{value}'")
        else:
            print(f"  ❓ {key}: {type(value)}")
        print()

# 如果是列表
elif isinstance(sample, list):
    print(f"样本是列表，长度：{len(sample)}")
    for i, item in enumerate(sample[:3]):
        print(f"  [{i}]: {type(item)}, {item if not isinstance(item, np.ndarray) else f'array{item.shape}'}")

# 其他类型
else:
    print(f"样本内容：{sample}")

# ── 再看第 2 个样本，确认结构一致 ──────────────────────
print("\n" + "=" * 60)
print("解包第 2 个样本，确认结构一致...")
print("=" * 60)

sample2 = pickle.loads(dataset[1]['sample'])
if isinstance(sample2, dict):
    print(f"字段列表：{list(sample2.keys())}")
else:
    print(f"类型：{type(sample2)}")

print("\n✅ 数据探索完成！")