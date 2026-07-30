"""
提取 PLAID Rotor37 全部 1200 个样本的 scalars
带容错处理：自动跳过字段缺失的样本
"""

from datasets import load_dataset
import pickle
import numpy as np
import pandas as pd
import os

print("=" * 60)
print("提取 PLAID Rotor37 Scalars")
print("=" * 60)

dataset = load_dataset(
    "PLAID-datasets/Rotor37",
    split="all_samples",
    cache_dir="./cache"
)

print(f"✅ 数据集加载成功，共 {len(dataset)} 个样本")
print("开始提取 scalars...\n")

records   = []
skipped   = []
all_keys_seen = set()

for i in range(len(dataset)):
    if i % 100 == 0:
        print(f"  进度：{i}/{len(dataset)}...")

    sample = pickle.loads(dataset[i]["sample"])
    sc     = sample.get("scalars", {})

    # 记录所有出现过的键名
    all_keys_seen.update(str(k) for k in sc.keys())

    # 检查必要字段是否存在
    required = ["Compression_ratio", "Efficiency", "Massflow", "Omega", "P"]
    
    # 用字符串比较（因为键是 np.str_ 类型）
    sc_str = {str(k): v for k, v in sc.items()}
    
    missing = [r for r in required if r not in sc_str]

    if missing:
        # 打印前5个有问题的样本
        if len(skipped) < 5:
            print(f"\n  ⚠️  样本 {i} 缺少字段：{missing}")
            print(f"     实际字段：{list(sc_str.keys())}")
            print(f"     实际值：  {sc_str}")
        skipped.append(i)
        continue

    records.append({
        "sample_id":         i,
        "Omega":             float(sc_str["Omega"]),
        "P":                 float(sc_str["P"]),
        "Compression_ratio": float(sc_str["Compression_ratio"]),
        "Efficiency":        float(sc_str["Efficiency"]),
        "Massflow":          float(sc_str["Massflow"]),
    })

# ── 汇报跳过情况 ──────────────────────────────────────────
print(f"\n✅ 提取完成！")
print(f"   成功：{len(records)} 个样本")
print(f"   跳过：{len(skipped)} 个样本")
if skipped:
    print(f"   跳过的样本编号：{skipped[:20]}{'...' if len(skipped)>20 else ''}")

print(f"\n所有出现过的键名：{all_keys_seen}")

# ── 统计摘要 ──────────────────────────────────────────────
df = pd.DataFrame(records)

print("\n" + "=" * 60)
print("数据统计摘要")
print("=" * 60)
print(df.describe().round(4))

# ── 异常值检查 ────────────────────────────────────────────
print("\n" + "=" * 60)
print("异常值检查")
print("=" * 60)

eff_bad = df[df["Efficiency"] > 1.0]
if len(eff_bad) > 0:
    print(f"⚠️  效率 > 1 的样本：{len(eff_bad)} 个（过滤掉）")
    df = df[df["Efficiency"] <= 1.0]
else:
    print("✅ 效率全部 <= 1，物理合理")

eff_low = df[df["Efficiency"] < 0.5]
if len(eff_low) > 0:
    print(f"⚠️  效率 < 0.5 的样本：{len(eff_low)} 个")
else:
    print("✅ 效率全部 >= 0.5，无异常低效率")

comp_bad = df[df["Compression_ratio"] < 1.0]
if len(comp_bad) > 0:
    print(f"⚠️  压比 < 1 的样本：{len(comp_bad)} 个（过滤掉）")
    df = df[df["Compression_ratio"] >= 1.0]
else:
    print("✅ 压比全部 >= 1，物理合理")

print(f"\n过滤后剩余：{len(df)} 个样本")

# ── 保存 CSV ──────────────────────────────────────────────
output_path = "../../data/processed/plaid_rotor37_scalars.csv"
os.makedirs(os.path.dirname(output_path), exist_ok=True)
df.to_csv(output_path, index=False)

print("\n" + "=" * 60)
print(f"✅ CSV 已保存：{output_path}")
print(f"   行数：{len(df)}")
print(f"   列数：{len(df.columns)}")
print(f"   列名：{list(df.columns)}")

print("\n前 5 行预览：")
print(df.head().to_string())

print("\n🎉 数据提取完成！")