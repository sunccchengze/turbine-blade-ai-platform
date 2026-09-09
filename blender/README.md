# Blender：高细节轴流燃气轮机剖切模型

`generate_gas_turbine.py` 是一个**不依赖外部插件或素材**的 Blender 场景生成器。它会建立一个适合产品级剖切展示的两转子轴流燃气轮机总成，并保存为可继续编辑的 `.blend` 文件。

> 重要边界：这是按真实燃机架构、部件关系、维护/热端细节构建的**通用高保真可视化模型**，并非任何 OEM 发动机的受控 CAD、蓝图或制造数据。若要成为某一具体型号的“完全真实”数字孪生，必须由该型号的受控装配图、叶型坐标、冷却回路、材料牌号、间隙与检验规范替换相应参数。

## 本工作区已直接交付的文件

- **模型文件**：`blender/output/axial_gas_turbine_cutaway.blend`
- **已验证生成版本**：Blender 4.5.3 LTS
- **内容量**：1,994 个对象、982 个网格、15 个 PBR 材质、13 个集合（Collections）
- **验证**：已在生成后重新打开该 `.blend`，并检查相机、燃烧室、压气机、涡轮、轴系和集合层级均存在。
- **预览图**：`blender/output/axial_gas_turbine_hero_preview.png`（960×540、Cycles CPU 32 samples）

## 已生成的内部结构

- 进气唇口、声学内衬、整流支板、旋转锥体与前轴承鼻锥；
- **8 级轴流压气机**：转子盘、旋转叶片、静叶、内外平台、可调静叶驱动环、机匣加强环与迷宫密封；
- 压气机出口扩压器和去旋静叶；
- **环形燃烧室**：压力机匣、内外火焰筒、穹顶、旋流器、16 路燃油喷嘴、环形燃油总管、主燃区/掺混区/气膜冷却孔、点火器及内窥镜检修口；
- **3 级轴流涡轮**：冷却导向叶片、涡轮盘、转子叶片、叶尖围带、热障涂层、机匣封严带和叶尖冲击冷却孔；
- 内外同轴轴系、滚动轴承、轴承座、迷宫齿、排气支板、尾锥与喷口；
- 附件齿轮箱、燃油/滑油管路、温度探头、电缆、起吊耳、分面法兰和径向紧固件；
- 面向镜头的 **120° 剖切机匣**、真实厚度的断面唇边、PBR 金属/陶瓷/氧化热端材质、摄影棚灯光、主相机和燃烧室特写相机。

所有子系统都按集合（Collection）整理；在 Outliner 中可单独隐藏、替换或加细。

## 使用方式

### Blender 图形界面

1. 交付的二进制文件已用 **Blender 4.5.3 LTS** 实测生成与重载；请使用 **Blender 4.5 LTS 或更高版本**直接打开该 `.blend`。脚本本身兼容 Blender 3.6 LTS+。
2. 打开 **Scripting** 工作区，点击 **Open**，选择 `blender/generate_gas_turbine.py`。
3. 点击 **Run Script**。
4. 生成完毕后，从 Outliner 选择 `Hero Cutaway Camera`，在 Render 视图中检查；脚本默认会保存到：
   `blender/output/axial_gas_turbine_cutaway.blend`。

### 命令行生成

从仓库根目录运行：

```bash
blender --background --python blender/generate_gas_turbine.py -- \
  --output blender/output/axial_gas_turbine_cutaway.blend
```

同时保存一张主视觉图：

```bash
blender --background --python blender/generate_gas_turbine.py -- \
  --output blender/output/axial_gas_turbine_cutaway.blend \
  --render blender/output/axial_gas_turbine_hero.png
```

快速预览（降低叶排密度和 Cycles 采样）：

```bash
blender --background --python blender/generate_gas_turbine.py -- --quick \
  --output blender/output/axial_gas_turbine_preview.blend
```

可选参数：

| 参数 | 作用 |
|---|---|
| `--quick` | 用于构图/低配预览，降低叶片数量与采样。 |
| `--render <路径>` | 生成后渲染 PNG/EXR 静帧。 |
| `--engine CYCLES` | 默认渲染器；也可传 `BLENDER_EEVEE_NEXT`。 |
| `--labels` | 在模型下方加入工段文字与引线。 |
| `--no-floor` | 去掉摄影棚地面和背景，便于导出到其他场景。 |
| `--resolution-scale 25..200` | 以百分比调节 1920×1080 输出。 |

## 可编辑性与精确复刻工作流

- 每排叶片共享一个 **linked mesh**，因此可编辑 `Blade master` 后令全排同步；若需要单叶损伤、叶尖间隙或不同叶型，可执行 **Make Single User**。
- 机匣不是 Boolean 临时洞，而是有厚度的扇形实体；断面唇边单独命名为 `Cutaway machined edge`。
- 所有 `MODEL NOTES — READ ME` 也会嵌入 `.blend` 的 Text Editor，便于交付时保留模型范围说明。
- 若提供某型发动机的合法、受控源数据，应按以下顺序替换：`stage schedule → blade airfoil sections → annulus/hub line → combustor liner & nozzle layout → cooling & seal details → material/texture references`；不要把通用展示几何误用于性能、制造或维修判断。

## 本仓库环境说明

当前 Arena 工作区没有预装 Blender 可执行文件，因此这里交付的是已做静态语法验证的生成脚本及运行说明；在带 Blender 的本机/工作站运行一次即可得到 `.blend` 和可选渲染图。生成的二进制输出位于 `blender/output/`，默认不纳入 Git。
