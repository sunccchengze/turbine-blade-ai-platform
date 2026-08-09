# P4 输入链路审计 · D41

> 目的：在尝试真实 SU2/RANS 之前，逐文件确认“候选设计 → 几何 → 网格 → 求解器 → 性能提取”是否真的存在。本文只记录仓库内可验证事实，不把计划或 dry-run 当作结果。
>
> **审计日期**：2026-08-08  
> **证据等级**：E1（代码/配置存在）与 E2（代理/留出证据）为主；尚未达到 E3。

---

## 1. 结论摘要

当前仓库可以完整追踪到：

```text
74 维特征
  → ONNX 代理模型
  → NSGA-II / 逆设计候选
  → 参数化示意几何
```

但目前不能在仓库内完成：

```text
真实 Rotor37 几何
  → 可运行 SU2 网格
  → Rotor37 对应边界条件
  → RANS 收敛
  → π / η / ṁ 性能提取
```

**P4 当前状态：真实点云资产已接入并通过审计；真实 RANS 仍被 CFD 网格/边界条件/性能提取链路阻塞。**

> 点云文件已统一放置于 `data/processed/pointcloud/rotor37_pc.npz`，大小约 69.3 MB；因目录默认被 `.gitignore` 忽略，本次对该文件显式强制跟踪。
>
> **几何质量 Gate 已通过（用户本机实测）**：1000 个样本均无 NaN/Inf、无近退化跨度、无异常重复率、法向量单位性通过、无协方差秩塌缩。该结论支持进入表面/拓扑重建，不等于已经拥有 SU2 网格。

---

## 2. 已确认存在的输入和产物

| 环节 | 文件/位置 | 实际状态 | 证据等级 |
|---|---|---|---|
| 统计特征 | `backend/data/processed/plaid_rotor37_features.csv` | 1000 组、74 维输入和 3 维输出 | E2 |
| 真实点云 | `data/processed/pointcloud/rotor37_pc.npz` | 1000×2048×9；keys 完整；与特征 CSV 的 sample_id 完全对齐 | E2 |
| Pareto 候选 | `backend/data/processed/pareto_front_solutions.csv` | 100 个代理模型候选，含 74 维设计列 | E2 |
| Pareto 证据 | `backend/data/processed/pareto_evidence.json` | 范围、距离、留出误差分析已生成 | E2 |
| 代理模型 | `backend/models/surrogate_model.onnx` | 可由 FastAPI 和复现脚本加载 | E2 |
| 标准化器 | `backend/models/scaler_X_v2.pkl`、`scaler_y_v2.pkl` | 生产推理依赖 | E2 |
| P3 训练脚本 | `backend/scripts/generate_design_p3.py` | 当前优先合成翼型；真实翼型文件存在时才读取 | E1 |
| 逆设计服务 | `backend/app/services/inverse_design.py` | 训练库近邻 + L-BFGS-B；返回特征和几何 payload | E1/E2 |
| 前端几何 | `frontend/src/components/BladeViewer3D.jsx` | 根据少量统计量生成参数化 Three.js 形状 | E1 |
| P4 骨架 | `backend/scripts/run_su2_validation_p4.py` | 支持 dry-run；真实调用仍需外部网格和求解器 | E1 |
| P4 准备器 | `backend/scripts/prepare_su2_p4.py` | 生成简化单排模板和 Docker 批跑脚本 | E1 |

---

## 3. 已确认缺失或未闭环的资产

### 3.1 真实网格不存在

仓库中未发现可用于 Rotor37 RANS 的：

- `.su2` 网格
- `.cgns` 网格
- `.vtk` / `.msh` 等可转换网格
- Rotor37 多排/混合平面装配文件

`run_su2_validation_p4.py` 生成的 `rotor37_mesh.su2` 只是配置模板中引用的文件名，并不是真实文件。

### 3.2 真实候选几何没有接入 P4

`inverse_design.py` 返回的 `geometry` 只包含：

- `Omega`
- `P`
- `Pressure_mean`
- `Pressure_std`
- `Temperature_mean`
- `CoordinateY_mean`

前端再用这些统计量构造参数化示意叶片。它不是 Rotor37 原始表面，也不是可直接网格化的真实 CAD/CFD 几何。

### 3.3 P4 脚本的真实运行部分仍是骨架

当前脚本存在以下限制：

- `--dry-run` 是默认安全路径。
- 默认配置使用 `MACH_NUMBER=0.4`、`AOA=0.0`、单一外流 RANS 模板，不是已对齐的 Rotor37 跨声速多排工况。
- `MESH_FILENAME=rotor37_mesh.su2` 只是占位引用。
- `surrogate_prediction` 在 comparison 输出中仍为 `None`。
- 真实运行分支只返回 SU2 日志尾部，尚未实现从场量/表面结果提取 π、η、ṁ。

### 3.4 相关规划文件并不等于运行产物

文档提到的以下路径在当前仓库中不存在：

- `backend/scripts/make_naca0012_su2_case.py`
- `data/processed/p4/naca0012_quickstart`
- `backend/data/processed/official_test_sanity.json`
- `.github/workflows/verify.yml`

其中：

- 前两个是旧会话/本地环境遗留引用，不能作为当前仓库能力声明。
- `official_test_sanity.json` 只有在下载官方数据并执行脚本后才会生成。
- 当前仓库只有 `docs/verify-reproducibility-workflow.yml` 模板，不是 `.github/workflows/verify.yml` 已安装的 CI。

---

## 4. 最小阻塞清单

要达到 P4-min，用户需要提供或确认：

1. Rotor37 原始几何或已经转换好的 CFD 网格。
2. 网格格式和转换链路（CGNS → SU2，或其他可运行格式）。
3. SU2 准确版本和运行方式：原生、WSL 或 Docker。
4. 入口/出口/周期/转子参考系/转速/压力/温度等边界条件。
5. 性能提取定义：压比、等熵效率、质量流量如何从 SU2 输出计算。
6. 至少一个候选解如何从 Pareto 特征对应到真实几何的映射。

在这些信息未齐之前，最诚实的下一步不是修改前端，而是由用户提供本地资产或确认允许先做独立 SU2 教程通路验证。

---

## 5. 新增几何质量审计入口

已新增：

```text
backend/scripts/audit_geometry_feasibility.py
```

它对 `rotor37_pc.npz` 做逐样本有限性、坐标跨度、协方差秩、坐标重复率、法向单位性和工况范围审计，并输出 JSON + 人读报告。它不生成 SU2 网格，也不替代网格质量和 RANS 验证。

## 6. 实验性表面拓扑重建入口

已新增：

```text
backend/scripts/prototype_surface_reconstruction.py
```

它用点云坐标和法向量构造局部切平面三角扇，输出 OBJ 预览和边界/非流形/退化三角形报告。该输出只用于判断点云是否值得继续做正式拓扑重建，明确不是 SU2/CGNS 网格。

## 7. 实验性拓扑原型 Gate 结果

用户本机对 sample 0、`k=12` 运行结果：

```text
vertices = 2048
faces = 18359
edges = 14358
boundary_edges = 743
nonmanifold_edges = 10307
degenerate_local_triangles_skipped = 0
```

判定：**Gate 不通过**。非流形边占比过高，局部切平面三角扇没有恢复出合法的全局表面拓扑。该 OBJ 只能用于观察点云连接倾向，不能用于 SU2/CGNS 或 CFD。

邻域敏感性诊断：

| k | faces | boundary_edges | nonmanifold_edges |
|---:|---:|---:|---:|
| 6 | 7285 | 1599 | 4000 |
| 8 | 10429 | 916 | 6475 |
| 12 | 18359 | 743 | 10307 |

即使 k=6，非流形边仍有 4000 条；继续调整 k 不能解决全局拓扑缺失问题，因此结束局部切平面三角扇路线。

这次失败归因于原型算法的全局拓扑缺失，不归因于此前点云几何质量 Gate；原始点云仍通过有限性、重复率、法向和空间秩检查。

## 8. Open3D 表面候选 Gate 结果

用户本机 sample 0 运行 Poisson + BPA 的结果：

| 方法 | 顶点 | 三角面 | 边界边 | 非流形边 | 包围盒判断 |
|---|---:|---:|---:|---:|---|
| Poisson | 5639 | 11074 | 178 | 8 | 明显外扩，需裁剪/保真审查 |
| BPA | 1598 | 2790 | 454 | 0 | 基本贴合原始点云 |

判定：BPA 比局部切平面三角扇明显更好，非流形边为 0 且包围盒基本贴合；但 454 条边界边说明表面仍非闭合，且没有 Rotor37 边界/周期面/体网格信息。Poisson 的非流形边较少，但包围盒外扩，不能直接解释为真实叶片表面。

### 双向几何保真审计

用户本机进一步运行 `audit_surface_candidate.py`：

| 指标 | BPA | Poisson |
|---|---:|---:|
| 原始点→表面 median | 0.01139 | 0.02566 |
| 原始点→表面 P95 | 0.05508 | 0.05641 |
| 表面→原始点 median | 0.01940 | 0.04447 |
| 表面→原始点 P95 | 0.03108 | 0.43549 |
| 法向 |dot|≥0.9 占比 | **0.9506** | 0.6116 |
| 包围盒 extent ratio | 0.986–0.997 | 1.099–1.714 |

**当前 Gate：BPA 通过表面候选保真初筛；Poisson 淘汰。正式 CFD 网格 Gate 仍不通过。** BPA 的几何保真和法向一致性较好，但 454 条边界边、缺少边界语义和体网格，仍不能直接进入 RANS。

## 9. 正式表面重建原型入口

已新增：

```text
backend/scripts/prototype_open3d_reconstruction.py
```

该脚本支持 Open3D Poisson 和 Ball Pivoting 两条实验路径，先统一法向方向，再输出 PLY 和网格质量报告。它仍然是表面候选，不是 SU2/CGNS 网格；Poisson 的水密倾向也不能替代真实边界、周期面和多排装配定义。

## 10. 表面候选保真审计入口

已新增：

```text
backend/scripts/audit_surface_candidate.py
```

它计算原始点云→表面、表面→原始点云的双向最近距离，P95/最大误差、法向一致性、边界边、非流形边和包围盒偏差。只有通过保真审计，才值得继续讨论边界修复或网格化；通过仍不等于 CFD 网格。

## 11. 边界语义审计入口

已新增：

```text
backend/scripts/audit_mesh_boundaries.py
```

它按边界边的图连接关系提取连通分量，报告每个分量的大小、包围盒、中心位置以及是否靠近原始点云包围盒极值。它不把边界自动解释为前缘/尾缘，也不自动封洞。

### BPA 边界结果（sample 0）

用户本机审计得到：

```text
boundary_components = 20
boundary_edges_total = 454
```

最大两个边界分量分别为 218 边和 153 边，中心均位于原始点云包围盒内部；其余分量多为 3–12 边的小分量。审计中的 `near_original_bbox_extreme_axis` 对主要分量为空，因此当前证据更支持“内部重建孔洞/碎片边界”，而不是叶片天然前缘、尾缘、根部或叶尖边界。

**判定：BPA 表面候选不具备可直接封闭并进入 CFD 的边界语义。** 不应在缺少原始几何拓扑的情况下任意补洞；下一步优先寻找 CGNS/SU2 原始网格或官方几何连接信息。

## 12. 原始 PLAID mesh 追溯入口

已新增：

```text
backend/scripts/extract_raw_mesh_p4.py
```

它以 streaming 方式从 `PLAID-datasets/Rotor37` 读取单个样本，审计原始 `meshes` 树中的坐标、单元连接、边界和 CGNS 相关数组，并把一个样本的 meshes 保存到被忽略的 `data/processed/p4/raw_mesh/`。该入口优先于从下采样点云猜测拓扑。

## 13. 原始 QUAD_4 表面导出入口

原始样本已确认包含 29773 个节点、29664 个 QUAD_4 单元和 `ElementConnectivity`。已新增：

```text
backend/scripts/convert_raw_mesh_to_su2_surface.py
```

它将 `sample_0000_meshes.pkl` 中的原始坐标和 1-based QUAD_4 连接关系转换为 0-based SU2 code 9 表面文件，并写入元数据。输出明确标记为 surface-only，不是体网格，不直接运行 RANS。

## 14. 原始 SU2 表面拓扑审计入口

已新增：

```text
backend/scripts/audit_su2_surface.py
```

它不调用 SU2 求解器，只检查原始 QUAD_4 表面的节点、边、边界边、非流形边、连通分量和包围盒，确认原始拓扑是否完整以及是否适合进入体网格准备。

## 15. 外部 Rotor37 流体域网格线索

公开的 SU2 Foundation《Flow simulation in axial compressors》Summer School 材料明确列出了 Rotor 37 流体域资源：粗/细 SU2 mesh、CGNS mesh、配置文件和入口 profile；材料说明 fine mesh 是 Cadence/Autogrid 生成的 structured multi-block mesh，约 3.5 million grid points，轴向为 Z 轴，并采用周期性 36。该资源与当前 PLAID 样本的 29773 节点 QUAD_4 表面不同，可能正是 P4 需要的流体域网格来源。

参考材料：

- https://su2foundation.org/wp-content/uploads/2025/10/3_Flow-simulation-in-axial-compressors.pdf
- SU2 官方 Mesh File 文档：https://su2code.github.io/docs/Mesh-File/

当前行动：优先定位并获取 SU2 Foundation 的 coarse/fine Rotor37 mesh、cfg 和 inlet profile；在未核验文件来源、版本、边界和许可证前，不下载/提交大网格到仓库。

## 16. 原始 SU2 表面拓扑 Gate 结果

用户本机审计 `sample_0000_surface.su2`：

```text
vertices = 29773
quads = 29664
edges = 59436
boundary_edges = 216
nonmanifold_edges = 0
connected_components = 1
used_vertices = 29773
```

**判定：原始表面拓扑 Gate 通过。** 它是单连通、无非流形边、无未使用节点的真实 QUAD_4 表面；216 条边界边需要进一步解释，但远好于 BPA 的 20 个边界分量/454 条边界边。当前仍是 surface-only，不是体网格，也没有证明可以直接运行 RANS。

### CFD 域完整性结论

用户提取的原始 CGNS 树中只发现：

- `Elements_QUAD_4`：29664 个四边形表面单元；
- `ElementConnectivity`：118656 个连接索引；
- `GridCoordinates`：29773 个节点；
- `PointData` / `CellData`：Pressure、Density、Temperature、Normals；
- `ZoneBC/Rotor37/PointList`：表面边界标记。

未发现 TETRA/HEXA/PRISM 等体单元，也未发现入口、出口、周期面或流体域装配。因此 PLAID 当前样本是**叶片表面拓扑 + 表面场量数据**，不是可直接交给 SU2_CFD 的三维流体域网格。不能通过把这个 surface-only 文件改名或补一个 cfg 来伪装完成 RANS。

这次结果证明：后续应以 PLAID 原始 `ElementConnectivity` 作为叶片表面几何来源；要完成真实 RANS，仍需另行获取/构造流体域网格和边界条件。BPA 只保留为可视化/重建对照，不再作为 CFD 拓扑来源。

## 17. 外部 SU2 Rotor37 case 审计入口

已新增：

```text
backend/scripts/audit_external_su2_case.py
```

它只读审计 SU2 ASCII 网格的 NELEM/NPOIN、体单元/表面单元、marker 和 cfg 的关键参数，并自动检查 `MESH_FILENAME` 是否与实际文件一致、cfg marker 是否存在于网格、网格 marker 是否被 cfg 覆盖；不运行求解器。优先审计 coarse mesh，确认它确实是体网格且 marker/cfg 一致后，再处理 fine mesh。

## 18. 外部 coarse case 工作配置入口

已新增：

```text
backend/scripts/prepare_external_su2_working_cfg.py
```

它保留下载的原始 cfg，只将已审计确认的网格文件名指向 `R37_coarse.su2`，并修正 `95000.0.0` 为 `95000.0`，同时输出变更 JSON。坐标范围显示 Z 方向最大延展，与当前 cfg 的 Z 轴工况设置一致，但正式运行前仍需由 SU2 preprocessing 验证。

## 19. SU2 冒烟配置入口

已新增：

```text
backend/scripts/prepare_su2_smoke_cfg.py
```

它从已审计的工作 cfg 生成有限迭代配置，只验证 SU2 网格读取、marker、周期、入口 profile 和 RANS 初始化；冒烟输出不计入任何 π/η/ṁ 科研结果。

## 20. 下一步建议

### 方案 A：已有 Rotor37 资产

用户提供路径/压缩包后：

1. 先只读取并检查文件，不修改原始资产。
2. 运行网格质量、边界名称和坐标系审计。
3. 选择一个候选解，建立“候选 ID—几何—网格—工况”映射。
4. 生成真实 cfg，先跑单解，保存完整日志。
5. 实现性能提取并生成代理 vs RANS 对照。

### 方案 B：暂时没有 Rotor37 资产

1. 明确记录：无法进行 Rotor37 物理验证。
2. 可单独跑 SU2 官方教程，证据级别只记为 E1：**SU2 通路验证**。
3. 不把教程结果写入 Rotor37 性能表，不给首页增加“CFD 已验证”标签。
4. 并行推进特征→几何可行性检查，但不宣称几何已可制造。

### 方案 C：先补工程基础

在真实 RANS 之前，可以完成但不越级的工作：

- 为 P4 脚本增加候选输入 schema 和真实字段校验。
- 将 `surrogate_prediction` 从候选特征重新计算并写入报告。
- 将 dry-run 输出明确命名为 `dry_run_comparison.json`。
- 为真实运行增加“未收敛不得提取性能”的保护。
- 为所有结果写入运行环境、版本、网格哈希和输入文件哈希。

这些改动能提升可靠性，但不能替代真实 CFD 结果。
