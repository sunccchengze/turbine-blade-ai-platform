# D41+ 执行清单

## 当前阶段：Gate 0 基线

- [x] 运行主 R² 复现并记录输出
- [x] 运行 Pareto 证据链并核对是否有意外改写
- [x] 运行生产侧后端基线（R²/API/compile）；训练 smoke 已在独立 torch 环境完成
- [x] 安装前端依赖并执行 build/lint
- [x] 接入真实点云并完成 P1 2 epoch/256 点诊断训练
- [x] 修复 P1 场指标反标准化量纲 bug
- [x] 更新 `docs/stage-guardrails-D41.md` 的基线证据
- [ ] 使用用户 RTX 4050 CUDA 环境完成正式 P1 训练
- [ ] 提交并推送本阶段基线记录

## 下一阶段：P4 输入审计

- [x] 接入并审计 `data/processed/pointcloud/rotor37_pc.npz`（1000×2048×9，sample_id 完全对齐）
- [x] 追踪 Pareto 候选到几何/网格的文件级数据流
- [x] 确认 Rotor37 样本含真实表面拓扑，但不含体网格/流体域/入口出口
- [x] 用户已获得 R37_coarse.su2、R37_fine.su2、CGNS、cfg、inlet.dat 资源
- [x] 新增外部 SU2 case 只读审计脚本
- [x] 用户审计 coarse mesh + cfg：130432 HEXAHEDRON、140201 节点、9 markers
- [x] 坐标 extent 显示 Z 轴最大，轴向与 cfg 基本一致
- [x] 新增工作 cfg 生成脚本，不修改原始 cfg
- [x] 生成并审阅 `R37_from_scratch_work.cfg`
- [x] 同步后生成 `R37_from_scratch_smoke.cfg`
- [x] SU2 v8.5 preprocessing 读取 coarse mesh 成功
- [x] 网格方向、周期点匹配和质量统计输出成功
- [x] SU2 真实启动并读入 coarse R37 case
- [x] 记录二阶/RANS smoke 在 inner iter 3 NaN 发散
- [x] 用 `R37_from_scratch_1stOrder.cfg` 生成工作 smoke cfg 并运行 20 iteration
- [x] 一阶 smoke Exit Success，无 NaN，但未收敛
- [x] 一阶 500 iteration 稳定运行但未收敛（relrms=-3.38664）
- [x] 运行 `audit_su2_marker_geometry.py`：INLET→OUTLET 主轴为 Z
- [ ] 审计 `inlet_kw_new.dat` 的列定义和速度分量
- [x] 读取 history.csv 表头和末尾，确认残差/CFL/性能列含义
- [x] 进一步核对 inlet_kw_new.dat 与 cfg 的入口物理语义
- [x] 审阅 forces_breakdown.dat / CFL 演化
- [x] 生成 `--fixed-cfl` 一阶 500 iteration 对照：relrms=-1.54914，过于保守
- [x] 生成 bounded-CFL max=5 一阶 500 iteration：relrms=-2.71473
- [x] 生成 bounded-CFL max=10 一阶 500 iteration：relrms=-3.10767
- [x] 生成 bounded-CFL max=20 一阶 500 iteration：relrms=-3.21966
- [x] bounded-CFL max=20 一阶 1000 iteration：relrms=-3.39242，平台未达收敛
- [x] 审阅 TURBOMACHINERY 输出：iOuterIter=0 文件不能作为末态时间序列
- [x] 失败 restart 路线已停止
- [x] 新增隔离 SU2 运行目录和 SHA256 manifest 机制
- [x] 独立目录重新运行一阶 coarse baseline，复现 relrms=-3.39242
- [x] clean working cfg 复核新增 MARKER_ANALYZE=(INLET,OUTLET)
- [x] clean analyze case 复跑：仍 relrms=-3.39242，MARKER_ANALYZE 未改变收敛平台
- [x] 带完整 stdout 日志复跑并提取 10 个 Stage Performance 节点
- [ ] 运行 `parse_su2_stage_performance.py` 生成 JSON/CSV 记录
- [ ] 收敛后再逐步恢复二阶/正式收敛
- [ ] 核验外部网格版本、边界、许可证和与项目工况的对应关系
- [x] 输出 P4 输入审计报告

## 下一项：P1 无泄漏输入消融

- [x] 增加 geometry-conditioned 模式：屏蔽 Pressure/Density/Temperature，只保留坐标、Normals 和工况
- [x] 明确 74 维统计特征中的场量来源，geometry-only 模式剔除场量统计特征
- [x] 在 RTX 4050 上完成 geometry-conditioned 40 epoch/1024 点正式训练
- [x] 对比 field-conditioned 与 geometry-conditioned 的标量 R² 和逐通道场指标
- [x] 结果未完成前，不更新 README 的模型能力宣称
- [x] 增加 `--seed` 并完成沙盒 seed 1/2 短训连通性验证
- [x] RTX 4050 上 geometry-conditioned 正式多 seed（42/43/44）稳定性实验
- [ ] geometry-conditioned 512/1024/2048 点与训练 epoch 消融
- [x] η 专项特征审计：Pearson/互信息/ExtraTrees 诊断报告
- [x] 增加 `combined` / `stats-only` / `pointcloud-only` 表示消融入口并完成短训连通性验证
- [x] RTX 4050 上 stats-only 与 pointcloud-only 正式 40 epoch/1024 点实验
- [x] η 专项表示消融：几何统计、法向、工况与物理派生量初步信息审计
- [x] 增加 `--data_seed`，隔离点云降采样随机性与训练 seed
- [x] pointcloud-only 固定 data_seed=42 的正式 3 seed 稳定性诊断
- [x] 增加 BatchNorm/LayerNorm 归一化对照入口
- [x] RTX 4050 上 pointcloud-only LayerNorm seed=42/43/44 对照
- [x] 补齐 pointcloud-only lr=3e-4 的 seed=42/44
- [x] pointcloud-only 固定 lr=3e-4 的 `lam_field=0.25` seed=42 诊断
- [x] pointcloud-only 固定 lr=3e-4 的 `lam_field=0.1` seed=42 单点诊断
- [x] pointcloud-only 固定 lr=3e-4 的 `lam_field=0` 标量专项诊断
- [x] pointcloud-only 损失权重权衡已完成，停止无限网格搜索
- [ ] 回到 combined 主模型的正式冻结/导出评估
- [x] 用户本机运行 `audit_geometry_feasibility.py`，全部几何质量 flags 为 0
- [x] 用户本机运行实验性拓扑原型并审阅结果：k=6/8/12 均大量非流形，Gate 不通过
- [x] Open3D Poisson/Ball Pivoting 表面重建原型入口
- [x] 用户本机运行 Open3D Poisson/BPA：BPA 非流形边 0，454 边界边；Poisson 非流形边 8，存在外扩
- [x] BPA/Poisson 双向表面保真审计：BPA 初筛通过，Poisson 淘汰
- [x] 运行 `audit_mesh_boundaries.py`：20 个边界分量，主要分量位于内部，倾向重建孔洞/碎片
- [x] BPA 边界语义 Gate 不通过，停止任意补洞路线
- [x] 同步后运行 `extract_raw_mesh_p4.py --index 0`
- [x] 审阅 PLAID 原始 meshes：29773 节点、29664 QUAD_4、ElementConnectivity、Rotor37 PointList
- [x] 运行 `convert_raw_mesh_to_su2_surface.py` 导出原始拓扑表面
- [x] 同步后运行 `audit_su2_surface.py`：单连通、0 非流形、29773 节点全部使用、216 边界边
- [x] 解释原始表面 216 条边界边的物理语义边界：不能证明是天然边界
- [x] 确认原始数据不含体网格/流体域/多排装配
- [ ] 寻找正式流体域网格/边界条件；若找不到，P4 降级为表面可实现性 + 独立 SU2 通路验证
- [ ] P4 Rotor37 正式表面拓扑/网格/SU2 输入链路
- [ ] η 专项物理派生特征消融

## 禁止越级

- [ ] 未完成真实 RANS 前，不更新为“CFD 已验证”
- [ ] 输入含目标场时，不称为“场预测”或“几何到场的前向代理”
- [ ] 未获得官方 test 标签前，不计算或声称官方 test R²
- [ ] 未完成特征到几何闭环前，不称 Pareto 解“可制造”
- [ ] 未经 build、API 和浏览器验收，不称前端/线上完成
