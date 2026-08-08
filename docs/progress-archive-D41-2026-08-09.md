# D41+ 进度存档 · 2026-08-09 夜间

> 写给下一次会话的交接记录。明早继续前先阅读本文件、`docs/stage-guardrails-D41.md`、`tasks/plan.md` 和 `tasks/todo.md`。

## 1. 当前分支与仓库状态

- 工作分支：`arena/019fe072-turbine-blade-ai-platform`
- 本次存档目标：装载 DeepTutor、完成燃气轮机小白项目介绍、保存实验进度。
- 当前项目生产依赖仍不包含 PyTorch；训练依赖使用独立的 `backend/requirements-training.txt`。
- 真实点云文件：`data/processed/pointcloud/rotor37_pc.npz`，1000×2048×9，sample_id 与特征 CSV 完全对齐。

## 2. 本阶段已经完成

### 数据与模型

- 真实 Rotor37 点云审计通过：9 通道，包含坐标/Pressure/Density/Temperature/Normals。
- P1 融合训练链路在用户 RTX 4050 Laptop GPU、CUDA 12.6 上跑通。
- 修复了场指标反标准化 bug，并将 Pressure、Temperature 指标分通道输出。
- 新增 geometry-conditioned 模式：输入只用坐标、Normals、工况和 50 维几何统计，不把目标场输入模型。
- 新增表示消融：`combined`、`stats-only`、`pointcloud-only`。
- 新增 `--seed`、`--split_seed`、`--data_seed`、`--norm_type`、`--representation`、`--input_mode`。

### 已完成的主要实验

1. **field-conditioned 融合诊断**（9 通道/74 维，存在场条件输入）：
   - π R²=0.9926
   - η R²=0.9553
   - ṁ R²=0.9928
   - 该结果只能叫场条件融合诊断，不能写成纯几何前向结果。

2. **geometry-conditioned combined，多 seed**：
   - π：0.984367 ± 0.000833
   - η：0.882533 ± 0.014949
   - ṁ：0.982667 ± 0.005522

3. **stats-only，多 seed**：
   - π：0.980867 ± 0.002950
   - η：0.851433 ± 0.025515
   - ṁ：0.981700 ± 0.001744

4. **pointcloud-only，固定 data_seed，多 seed**：
   - π：0.972533 ± 0.010514
   - η：0.816067 ± 0.083724
   - ṁ：0.972567 ± 0.006469
   - pointcloud-only 存在明显训练不稳定。

5. **LayerNorm 对照**：
   - η：0.683200 ± 0.070757
   - 明显不如 BatchNorm；BatchNorm 保持默认。

6. **pointcloud-only，BatchNorm，lr=3e-4，多 seed**：
   - π：0.959667 ± 0.010661
   - η：0.868433 ± 0.028823
   - ṁ：0.952600 ± 0.023767
   - η 稳定性提升，但 π/ṁ 与场指标变差。

7. **损失权重单点对照，seed=42，lr=3e-4**：
   - lam=0.5：π/η/ṁ = 0.9554/0.8376/0.9563
   - lam=0.25：π/η/ṁ = 0.9595/0.8821/0.9425
   - lam=0.1：π/η/ṁ = 0.9604/0.9052/0.9662，Pressure relative L2=0.1256
   - lam=0：π/η/ṁ = 0.9643/0.8842/0.9613；场头无监督，场指标不可比较。

## 3. 当前科学结论

- 74 维场统计特征对 η 很重要；排除 Pressure/Density/Temperature 后，η 明显下降。
- 点云几何对 π/ṁ 有一定增量；与几何统计融合时表现最好。
- pointcloud-only 不是当前生产候选，且存在初始化/优化/多任务冲突问题。
- combined 是当前 geometry-conditioned 的最佳研究候选，但仍低于原 74 维基线的 η=0.9561。
- 所有上述结果均为代理模型留出集结果，不是 CFD/RANS 物理验证。
- P4 最大缺口仍然存在：真实 Rotor37 几何/网格/SU2 边界条件/性能提取闭环未完成。

## 4. 明早第一优先级

1. 阅读 `docs/p1-input-mode-ablation-D41.md`，确认消融表和证据口径。
2. 结束 P1 pointcloud-only 调参，不再无限网格搜索。
3. 冻结 combined 的研究配置，整理模型权重、配置、seed 和 metrics。
4. 转向 P4 输入资产审计：寻找 Rotor37 原始几何、CGNS/SU2 网格或网格拓扑。
5. 如果仍没有真实网格，先明确 P4 阻塞，不把教程 SU2 结果写成 Rotor37 CFD 验证。

## 5. 规则提醒

- 不把代理预测 Pareto 解写成物理最优叶片。
- 不把逐维范围内写成几何可制造。
- 不把官方黑盒 test 写成官方 test R²。
- 不把 dry-run 写成 RANS 已验证。
- 不把目标场输入条件下的重建写成 geometry-only 场预测。
- 不在完成真实几何—网格—RANS 闭环前继续扩大宣传性功能。

## 6. 本次新增文档与技能

- `技能库&准则/DeepTutor/`：从 HKUDS/DeepTutor 装载的源代码、`SKILL.md`、README、学习引擎和 CLI 文档；已排除 Git 元数据和生成构建产物。
- `docs/项目介绍-燃气轮机小白版.md`：约 5000 字的面向燃气轮机小白的项目介绍，明确区分燃气轮机背景、Rotor 37 压气机验证载体、代理模型、Pareto、UQ 和 P4 缺口。

## 7. DeepTutor 方法在本项目中的应用原则

明早继续时，对任何知识教学/项目讲解任务采用：

```text
诊断已有理解
→ 拆解知识点
→ 用类比和精确术语双层讲解
→ 提问/小测确认理解
→ 记录错误类型
→ 针对薄弱点复习
→ 间隔复习和重新验证
```

但它不能改变科研证据优先级：教学体验可以个性化，实验事实仍须由脚本、数据、日志和来源支持。
