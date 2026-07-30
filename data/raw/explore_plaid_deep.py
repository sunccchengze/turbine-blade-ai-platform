"""
深度探索 PLAID Rotor37 数据集 v3（修复字符串数组bug）
"""

from datasets import load_dataset
import pickle
import numpy as np

print("=" * 60)
print("加载 PLAID Rotor37 数据集...")
print("=" * 60)

dataset = load_dataset(
    "PLAID-datasets/Rotor37",
    split="all_samples",
    cache_dir="./cache"
)
print(f"✅ 加载成功，共 {len(dataset)} 个样本")
sample = pickle.loads(dataset[0]["sample"])


def summarize_obj(obj):
    if isinstance(obj, np.ndarray):
        if obj.size == 0:
            return f"ndarray shape={obj.shape}, dtype={obj.dtype}, empty"
        if obj.dtype.kind in ('S', 'U', 'O'):
            return (
                f"ndarray shape={obj.shape}, dtype={obj.dtype}, "
                f"(string, 前3个值: {obj.flatten()[:3]})"
            )
        return (
            f"ndarray shape={obj.shape}, dtype={obj.dtype}, "
            f"min={np.nanmin(obj):.6g}, max={np.nanmax(obj):.6g}, "
            f"mean={np.nanmean(obj):.6g}"
        )
    elif isinstance(obj, dict):
        return f"dict, keys={list(obj.keys())}"
    elif isinstance(obj, list):
        return f"list, len={len(obj)}"
    elif isinstance(obj, tuple):
        return f"tuple, len={len(obj)}"
    elif obj is None:
        return "None"
    else:
        return f"{type(obj).__name__}: {repr(obj)[:100]}"


def is_cgns_node(obj):
    return (
        isinstance(obj, list)
        and len(obj) == 4
        and isinstance(obj[0], str)
        and isinstance(obj[2], list)
        and isinstance(obj[3], str)
    )


def print_cgns_tree(node, indent=0, max_depth=5, max_children=20):
    prefix = "  " * indent
    if not is_cgns_node(node):
        print(f"{prefix}非标准CGNS节点: {summarize_obj(node)}")
        return
    name  = node[0]
    value = node[1]
    children = node[2]
    label = node[3]
    print(f"{prefix}📁 {name} | label={label} | value={summarize_obj(value)} | children={len(children)}")
    if indent >= max_depth:
        if children:
            print(f"{prefix}  ... 达到最大深度，停止展开")
        return
    for child in children[:max_children]:
        if is_cgns_node(child):
            print_cgns_tree(child, indent+1, max_depth, max_children)
        else:
            print(f"{prefix}  ❓ child: {summarize_obj(child)}")
    if len(children) > max_children:
        print(f"{prefix}  ... 还有 {len(children)-max_children} 个子节点未显示")


def search_arrays(obj, path="root"):
    results = []
    if isinstance(obj, np.ndarray):
        results.append((path, obj))
    elif isinstance(obj, dict):
        for k, v in obj.items():
            results.extend(search_arrays(v, f"{path}/{k}"))
    elif isinstance(obj, list):
        if is_cgns_node(obj):
            name, value, children, label = obj
            results.extend(search_arrays(value, f"{path}/{name}[value:{label}]"))
            for child in children:
                results.extend(search_arrays(child, f"{path}/{name}"))
        else:
            for i, item in enumerate(obj):
                results.extend(search_arrays(item, f"{path}[{i}]"))
    elif isinstance(obj, tuple):
        for i, item in enumerate(obj):
            results.extend(search_arrays(item, f"{path}({i})"))
    return results


# ── Part 1：scalars ──────────────────────────────────────
print("\n" + "=" * 60)
print("Part 1：探索 scalars")
print("=" * 60)
scalars = sample.get("scalars", {})
print(f"scalars 总览：{summarize_obj(scalars)}")
if isinstance(scalars, dict):
    for k, v in scalars.items():
        print(f"\n  字段名: {k}")
        print(f"  内容:   {summarize_obj(v)}")
        if isinstance(v, dict):
            for kk, vv in v.items():
                print(f"    子字段: {kk} → {summarize_obj(vv)}")


# ── Part 2：前5个样本 scalars 对比 ───────────────────────
print("\n" + "=" * 60)
print("Part 2：前 5 个样本 scalars 对比")
print("=" * 60)
for i in range(5):
    s  = pickle.loads(dataset[i]["sample"])
    sc = s.get("scalars", {})
    print(f"\n样本 {i}:")
    if isinstance(sc, dict):
        for k, v in sc.items():
            print(f"  {k}: {summarize_obj(v)}")
    else:
        print(f"  scalars 类型异常: {type(sc)}")


# ── Part 3：meshes CGNS 树 ────────────────────────────────
print("\n" + "=" * 60)
print("Part 3：探索 meshes 的 CGNS 树结构")
print("=" * 60)
meshes = sample.get("meshes", None)
print(f"meshes 总览：{summarize_obj(meshes)}")
if isinstance(meshes, dict):
    for k, tree in meshes.items():
        print(f"\nmesh key = {k}")
        print_cgns_tree(tree, max_depth=6, max_children=30)
else:
    print("meshes 不是 dict")


# ── Part 4：所有 numpy 数组 ───────────────────────────────
print("\n" + "=" * 60)
print("Part 4：搜索所有 numpy 数组")
print("=" * 60)
all_arrays = search_arrays(sample)
print(f"共找到 {len(all_arrays)} 个 numpy 数组。\n")
for idx, (path, arr) in enumerate(all_arrays):
    print(f"[{idx}] 路径: {path}")
    print(f"     {summarize_obj(arr)}")
    print(f"     前5个值: {arr.flatten()[:5]}")
    print()


# ── Part 5：关键词搜索 ────────────────────────────────────
print("\n" + "=" * 60)
print("Part 5：关键词搜索")
print("=" * 60)
keywords = [
    "Coordinate", "CoordinateX", "CoordinateY", "CoordinateZ",
    "Pressure", "Temperature", "Density", "Velocity",
    "Efficiency", "Compression", "Massflow", "MassFlow",
    "Omega", "Normal",
]
for kw in keywords:
    hits = [(p, a) for p, a in all_arrays if kw.lower() in p.lower()]
    if hits:
        print(f"\n关键词 '{kw}' 命中 {len(hits)} 个数组：")
        for path, arr in hits:
            print(f"  - {path}")
            print(f"    {summarize_obj(arr)}")

print("\n✅ 深度探索完成！")