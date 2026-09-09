# Blender：LM2500-class 公开资料标定燃气轮机剖切模型

本目录直接交付一个可打开、可编辑的 Blender 二进制场景：

- **主模型：** [`output/axial_gas_turbine_cutaway.blend`](output/axial_gas_turbine_cutaway.blend)
- **Cycles 主视觉预览：** [`output/axial_gas_turbine_hero_preview.png`](output/axial_gas_turbine_hero_preview.png)
- **Cycles 热端细节预览：** [`output/axial_gas_turbine_hot_section_detail.png`](output/axial_gas_turbine_hot_section_detail.png)
- **可复现生成器：** [`generate_gas_turbine.py`](generate_gas_turbine.py)
- **场景结构核验器：** [`validate_blend.py`](validate_blend.py)
- **公开资料来源、映射与使用边界：** [`REFERENCE_BASIS.md`](REFERENCE_BASIS.md)

> **准确表述：** 这是一个按公开资料校正的、可编辑的**结构可视化模型**，并不是“完全仿真”。它不是 GE 的 OEM CAD、制造图、CFD/传热/FEA 结果、性能模型、认证构型或制造级数字孪生。请先阅读 [公开资料标定与边界说明](REFERENCE_BASIS.md)。

## 公开资料所标定的架构

模型选择资料充分的 **GE LM2500 基础构型**作为架构标定参考，而非声称复刻任何一台特定序列号发动机。依据 GE Aerospace 的公开 LM2500 数据表及技术演进资料，场景明确构建了：

| 已公开的架构特征 | 场景中的可见实现 |
|---|---|
| 16 级轴流压气机 | `HPC Stage 01`–`HPC Stage 16`：每级均含转子、静子、内外平台、整流环和部分级间密封。环形流道按级数逐步收缩。 |
| 进口导叶和前 6 级可调静叶 | `Inlet guide vane row`；前六级静叶对象均标记为 `variable compressor stator vane`，并有 6 组外部驱动环、连杆与扭力轴。 |
| 直通式全环形燃烧室与 30 个喷嘴 | 全环形压力机匣、内外火焰筒、穹顶和扩压器；连续燃油总管及 `Fuel nozzle 01`–`Fuel nozzle 30`。 |
| 2 级空气冷却高压涡轮 | `HPT Stage 1`、`HPT Stage 2` 的冷却导向叶片、涡轮叶片、热端机匣和封严带；首级有**明确标注为教学性**的透明剖切叶片、蛇形通道和气膜出口细节。 |
| 6 级自由动力涡轮 | `Free Power Turbine Stage 01`–`06`：独立于燃气发生器的空心轴、六组导叶/叶轮、机匣加强环、轴承腔、输出联轴器和排气架。 |

权威链接、每项映射和没有公开的数据清单在 [`REFERENCE_BASIS.md`](REFERENCE_BASIS.md) 中；模型内部的 `MODEL NOTES — READ ME` 文本块也保留相同的范围声明。

## 可以直接在 Blender 中查看什么

打开 `output/axial_gas_turbine_cutaway.blend` 后：

1. 在 **Outliner** 展开 `GAS TURBINE — CUTAWAY ASSEMBLY`；其下分为入口、前 6 级 VSV 压气机、后 10 级压气机、燃烧室、HPT、自由动力涡轮、轴系、附件和剖切机匣等集合。
2. 选择 **Hero Cutaway Camera**，按 `Numpad 0` 进入主镜头；切掉面向镜头的 120° 机匣扇区，以露出内部流道与部件层级。
3. 在 **Text Editor** 打开 `MODEL NOTES — READ ME`；该说明嵌入 `.blend`，记录公开资料基线、对象范围和不能宣称为仿真的部分。
4. 需要局部编辑时，叶排使用 linked mesh。编辑每排的 `Blade master` 会同步该排；需要个别叶片变化时可在 Blender 中执行 **Make Single User**。

## 细节范围

- 入口唇口、声学内衬、入口导叶、旋转锥体、前轴承鼻锥；
- 16 级压气机的转子盘、叶片、逐叶根部平台、保持凸耳、静叶机匣挂钩、外壳加强环、迷宫密封和前六级 VSV 操作机构；
- 前六级 VSV 的独立驱动环、通用联动杆、摇臂、枢轴、外部同步导轨和两支伺服作动器（均明确标为非 OEM 运动学代理）；
- 扩压器、去旋静叶、压气机出口腔、全环燃烧室、内外火焰筒、穹顶、30 路燃油喷嘴/总管、喷嘴安装法兰、空气雾化杯、旋流器、两支点火器、内窥镜口、主燃/掺混/气膜冷却可视化孔阵；
- 两级空气冷却 HPT、六级自由动力涡轮、逐叶根部平台/保持件、导叶外挂钩、涡轮盘/围带/封严带、冷却空气分配环、传动分离区、燃气发生器轴、自由动力轴、输出联轴器；
- 轴承滚子、保持架、支撑辐条、轴承座、密封齿、滑油供回路、HPT 冷却空气示意管路、排气支板、尾锥和喷口；
- 分体机匣、法兰、径向紧固件、五块带沉头紧固件的检修盖板、附件齿轮箱、燃油/滑油/压力/电气管线、温度探头、电缆、起吊耳、摄影棚材质/灯光和三台相机。

## 验证

本场景以 Blender 4.5.3 LTS 的 `bpy` runtime 生成、重新打开并通过结构核验。核验器检查的是场景对象层级和已公开的级数/喷嘴数量声明，不是工程性能验证：

```bash
blender --background blender/output/axial_gas_turbine_cutaway.blend \
  --python blender/validate_blend.py
```

通过时，核验器将确认：**16** 个压气机转子级、**6** 个 VSV 静子级、**30** 个喷嘴体、**2** 个 HPT 转子级、**6** 个自由动力涡轮转子级，以及嵌入的范围声明。它也检查本次细节通道中的根部平台、VSV 同步导轨、喷嘴雾化杯、轴承保持架、检修盖板和细节相机是否存在。命令会输出 Blender 版本、对象/网格总数和场景 metadata，便于审计。

## 重新生成

生成器不依赖外部插件或下载素材，在 Blender 3.6 LTS+ 中可运行；交付的 `.blend` 用 Blender 4.5.3 LTS 验证。默认构建保留完整可见叶排密度和 30 个喷嘴：

```bash
blender --background --python blender/generate_gas_turbine.py -- \
  --output blender/output/axial_gas_turbine_cutaway.blend \
  --render blender/output/axial_gas_turbine_hero_preview.png
```

快速构图模式会降低叶排密度，并为了性能将喷嘴减少到 18 个；它**不应**通过完整交付版的 `30_fuel_nozzles` 核验：

```bash
blender --background --python blender/generate_gas_turbine.py -- --quick \
  --output blender/output/preview_only.blend
```

可选参数：

| 参数 | 作用 |
|---|---|
| `--quick` | 构图/低配预览；降低叶排密度和喷嘴数，非交付构型。 |
| `--render <路径>` | 在保存 `.blend` 后输出 PNG/EXR 静帧。 |
| `--engine CYCLES` | 默认渲染器；也可尝试 `BLENDER_EEVEE_NEXT`。 |
| `--labels` | 在模型下方添加工段文字和引线。 |
| `--no-floor` | 去除摄影棚地面和背景，方便移入其他场景。 |
| `--resolution-scale 25..200` | 按百分比调整 1920×1080 输出。 |

## 使用与精度边界

- `.blend` 特意随本目录交付，而不是只给脚本；输出二进制是这次任务的主交付物。
- 公开资料支持拓扑、级数、喷嘴数和高层冷却/附件语义；它**不提供**受控叶型、尺寸、公差、精确通道或性能图。模型中的这些非公开部分是可编辑的视觉代理，不能被解释为 LM2500 的受控数据。
- 若未来获得合法的受控资料，建议按 `stage schedule → annulus/hub line → blade airfoil sections → combustor/nozzle layout → cooling & seal details → materials → validated operating boundary conditions` 的次序替换，并完成独立 CFD/热/结构/试验验证后，才讨论工程级仿真。
