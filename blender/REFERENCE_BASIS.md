# 公开资料标定与边界说明

**资产：** `axial_gas_turbine_cutaway.blend`
**标定基线：** GE Aerospace LM2500 基础构型的公开架构信息
**资料核对日期：** 2026-09-09

## 这份模型是什么

这是一个可以直接在 Blender 中打开和编辑的**公开资料标定结构可视化**。它将已公开、可核查的 LM2500 架构特征映射为剖切模型中的集合、对象名称和可见部件；其目的为沟通、培训、展示和后续艺术/技术建模迭代。

它不是 GE 的受控 CAD，也不是经过边界条件、材料模型和试验结果验证的 CFD、传热、转子动力学、FEA 或认证级数字孪生。

## 用于几何拓扑的权威公开资料

| 可核查公开特征 | 模型中的实现 | 主要来源 |
|---|---|---|
| 16 级轴流压气机 | `HPC Stage 01` 至 `HPC Stage 16` 的转子/静子排；流道从入口向扩压器连续收缩 | [GE Aerospace — LM2500 Datasheet（2023）](https://www.geaerospace.com/sites/default/files/2023-11/LM2500-Datasheet.pdf) |
| 进口导叶和前 6 级可调静叶 | `Inlet guide vane row`，以及 6 组 `VSV stage … actuation ring / drive lever / torque shaft` | [GE Aerospace — Technological Evolution of the LM2500 Aeroderivative Gas Turbine](https://www.geaerospace.com/news/press-releases/marine-industrial-engines/technological-evolution-popular-aeroderivative-gas-turbine) |
| 直通式全环形燃烧室、30 个燃油喷嘴 | `30-nozzle annular fuel manifold` 和编号 `Fuel nozzle 01` 至 `Fuel nozzle 30` | 同上 GE Aerospace 技术演进资料 |
| 2 级空气冷却高压涡轮 | `HPT Stage 1`、`HPT Stage 2`，冷却 NGV、冷却转子对象与一个透明的教学性叶片剖切细节 | GE Aerospace LM2500 数据表及技术演进资料 |
| 6 级自由动力涡轮 | `Free Power Turbine Stage 01` 至 `Free Power Turbine Stage 06`；独立空心轴和联轴器 | GE Aerospace LM2500 数据表 |
| 轴流压气机中一转子一静子、渐缩环形流道的通用原理 | 连续的转子/静子对、平台、外机匣与级间密封 | [U.S. DOE/NETL — *Gas Turbine Handbook*, Chapter 2](https://www.netl.doe.gov/sites/default/files/gas-turbine-handbook/2-0.pdf) |
| 高温涡轮内部蛇形通道及表面气膜冷却是合理的定性展示细节 | `HPT Stage 1 cooling passage` 和 `film-cooling exit` 对象；对象属性和模型说明均标示为 illustrative | [NASA NTRS — *Heat Transfer in Gas Turbines*](https://ntrs.nasa.gov/api/citations/20010071841/downloads/20010071841.pdf)；[NASA NTRS — *Heat Transfer on a Film-Cooled Rotating Blade*](https://ntrs.nasa.gov/api/citations/19990097987/downloads/19990097987.pdf?attachment=true) |

## 未公开、因而**没有**假装精确复刻的内容

以下信息不应从公开资料中臆造，也不能从该模型反推出：

- OEM 叶型坐标、弦长/安装角、真实叶片数、盘槽和榫头几何；
- 精确机匣、轴承、密封、燃烧室和附件尺寸、公差、材料牌号或热处理；
- 喷嘴流量分配、控制规律、压气机/涡轮性能图、燃烧边界条件；
- 实际冷却孔孔径、孔数、孔角、内部通道、涂层、间隙和寿命数据；
- 任意特定序列号、改型、海用封装或适航/认证构型。

因此，模型中非公开的叶片密度、比例、叶根平台/保持件、静叶挂钩、VSV 联动杆与作动器、管线走向、孔阵、轴承站位、检修盖板和透明 HPT 教学叶片都是**可编辑的视觉代理几何**。它们用于表达部件关系，绝不代表 LM2500 的受控设计数据。

为避免把“细节密度”误做成互相穿插的假几何，生成器会针对每一排的保守轴向/周向叶片包络执行正间隙检查；该检查只保证此可视化模型的网格排布不重叠，不是气动、热、振动或强度验证。

## 使用限制

- 可用于：可视化、教育、布局讨论、艺术渲染、非工程性的交互演示。
- 不可用于：设计放行、制造、检修/拆装指令、性能预测、寿命评估、控制标定、适航/海事认证或安全决策。
- 认证级发动机设计还涉及叶根保持、冷却、材料、间隙、振动、强度和寿命等验证项目；相关要求可参见 [FAA AC 33-8](https://www.faa.gov/documentLibrary/media/Advisory_Circular/AC_33-8.pdf)。本资产没有完成这些验证。

## 可追溯性位置

打开 `.blend` 后，可在 Blender 的 **Text Editor** 中查看嵌入的 `MODEL NOTES — READ ME`。场景也含有 `reference_basis`、`public_reference_url` 和 `asset_scope` 自定义属性；它们明确记录公开资料基线与非仿真边界。
