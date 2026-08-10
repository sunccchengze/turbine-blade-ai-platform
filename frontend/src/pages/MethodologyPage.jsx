import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Database,
  Brain,
  ShieldCheck,
  Target,
  FlaskConical,
  Ruler,
  Check,
  CircleAlert,
  CircleDot,
  Cpu,
} from 'lucide-react'

const steps = [
  {
    num: '01',
    icon: Database,
    title: '公开基准数据集',
    en: 'PUBLIC BENCHMARK & DATASET',
    desc: '基于公开的 PLAID 数据集与 NASA Rotor 37 跨音速压气机转子，提取 1,000 组真实 CFD 流场样本（含总压比、绝热效率与质量流量）。明确验证载体为压气机转子，杜绝与透平涡轮概念混淆。',
    tone: 'var(--teal-bright)'
  },
  {
    num: '02',
    icon: Ruler,
    title: '特征工程与降维映射',
    en: 'FEATURE SPACE & DIMENSIONALITY',
    desc: '从 29,773 个表面网格节点中提取 74 维包含前缘/压力面/吸力面曲率、厚度分布与进气工况的宏观统计特征。在保全全局物理几何构型的前提下，将输入维度压缩至适于残差网络稳定训练的紧凑空间。',
    tone: 'var(--teal-bright)'
  },
  {
    num: '03',
    icon: Brain,
    title: '物理残差代理网络与 WASM 部署',
    en: 'RESIDUAL SURROGATE & ONNX RUNTIME WEB',
    desc: '采用带物理软约束损失函数的 PyTorch 残差网络（523,011 参数），输出总压比 π、等熵效率 η 和质量流量 ṁ。导出为 2.01MB ONNX 并在浏览器通过 SIMD WASM 进行毫秒级本地推理，实现 0 后端冷启动依赖。',
    tone: 'var(--yellow)'
  },
  {
    num: '04',
    icon: ShieldCheck,
    title: '认知不确定性量化 (UQ)',
    en: 'EPISTEMIC UNCERTAINTY QUANTIFICATION',
    desc: '训练阶段启用 100 次 MC Dropout 采样计算预测标准差 σ。留出测试集（n=100）实测显示：压比覆盖率 89%、流量覆盖率 88%、效率覆盖率 65%。全站如实作为“相对置信度指示器”，绝不作虚假 95% 保证。',
    tone: 'var(--yellow)'
  },
  {
    num: '05',
    icon: Target,
    title: '多目标 NSGA-II 进化寻优',
    en: 'MULTI-OBJECTIVE EVOLUTION SEARCH',
    desc: '在 74 维设计空间中以 π ≥ 1.80、η ≥ 0.84 为物理硬约束，经过 200 代遗传演化搜索得到 100 组三目标非支配 Pareto 候选解集，并在前端提供实时 3D 叶片几何点选联动。',
    tone: 'var(--teal-bright)'
  },
  {
    num: '06',
    icon: FlaskConical,
    title: 'SU2 真实物理闭环与超算对接',
    en: 'SU2 SOLVER CLOSURE & HPC ROADMAP',
    desc: '已通过 14 万粗网格与 355 万细网格的表面流形性与边界条件审计，跑通 SU2 求解器粗网格一阶 1000 步 Stage 性能提取（relrms=-3.39，E3 级趋势）。高精度二阶收敛已就绪，留待 HPC 集群最终终审。',
    tone: 'var(--rust)'
  },
]

export default function MethodologyPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'transparent', padding: '56px 28px 88px' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        
        {/* 01. 页面头部 (严格 28px 左对齐) */}
        <motion.header
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 28,
            flexWrap: 'wrap',
            marginBottom: 28,
            paddingBottom: 18,
            borderBottom: '1px solid var(--line)'
          }}
        >
          <div>
            <div style={{ color: 'var(--yellow)', font: '10px var(--mono)', letterSpacing: '0.14em' }}>
              06 / 方法论与科学证明 · METHODOLOGY & RIGOR
            </div>
            <h1 style={{
              color: 'var(--paper)',
              font: '700 clamp(32px, 4.5vw, 54px)/1.1 var(--display)',
              letterSpacing: '-0.045em',
              marginTop: 12
            }}>
              每一步都留下可审查的证据<br />
              <span style={{ color: 'var(--teal-bright)' }}>Every Step Leaves a Verifiable Trace</span>
            </h1>
          </div>
          <p style={{ maxWidth: 420, color: 'var(--muted)', fontSize: 13, lineHeight: 1.8 }}>
            拒绝把代理预测包装成已验证物理事实。平台将数据来源、特征工程、损失函数、模型指标与求解器边界完整透明公开。
          </p>
        </motion.header>

        {/* 顶部系统遥测条 (无框工科 Token) */}
        <div style={{
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          flexWrap: 'wrap',
          fontSize: '11px',
          fontFamily: 'var(--mono)',
          color: 'var(--muted)',
          marginBottom: 24
        }}>
          <span style={{ color: 'var(--teal-bright)', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <CircleDot size={8} className="spin" style={{ animationDuration: '4s' }} />
            SCIENTIFIC PROOF PIPELINE
          </span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span>物理证据分级 E0~E4 体系</span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span>独立留出测试集 R² 评测</span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span style={{ color: 'var(--yellow)' }}>SU2 真实物理闭环通路已就绪</span>
        </div>

        {/* 02. 六阶段严密科研流水道 */}
        <section style={{ display: 'grid', gap: 14, marginBottom: 28 }}>
          {steps.map(({ num, icon: Icon, title, en, desc, tone }) => (
            <div
              key={num}
              style={{
                background: 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: 6,
                padding: '24px 22px',
                display: 'grid',
                gridTemplateColumns: '40px 32px minmax(180px, 0.32fr) 1fr',
                gap: 18,
                alignItems: 'start'
              }}
              className="card-glow"
            >
              <span className="num" style={{ color: tone, fontSize: 13, fontWeight: 700, paddingTop: 2 }}>
                {num}
              </span>
              <div style={{ paddingTop: 1 }}>
                <Icon size={18} style={{ color: tone }} />
              </div>
              <div>
                <div style={{ color: 'var(--paper)', fontSize: 15, fontWeight: 700 }}>
                  {title}
                </div>
                <div style={{ color: 'var(--faint)', font: '10px var(--mono)', marginTop: 4 }}>
                  {en}
                </div>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.8 }}>
                {desc}
              </p>
            </div>
          ))}
        </section>

        {/* 03. 生产指标与物理边界对照 (严格水平对齐 2 列) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
          {/* Card 1: 生产指标 */}
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 6,
            padding: '22px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ color: 'var(--teal-bright)', font: '10px var(--mono)', letterSpacing: '0.12em', marginBottom: 14 }}>
                生产模型验证口径 · PRODUCTION ACCURACY (N=100)
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  ['总压比 π 决定系数', '0.9844', 'MAE 0.0097 · RMSE 0.0135'],
                  ['等熵效率 η 决定系数', '0.9561', 'MAE 0.0031 · RMSE 0.0044'],
                  ['质量流量 ṁ 决定系数', '0.9827', 'MAE 0.1420 kg/s · RMSE 0.2015']
                ].map(([label, val, note]) => (
                  <div key={label} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    borderBottom: '1px solid var(--line)',
                    paddingBottom: 8
                  }}>
                    <span style={{ color: 'var(--paper)', fontSize: 12, fontWeight: 600 }}>{label}</span>
                    <div style={{ textAlign: 'right' }}>
                      <span className="num" style={{ color: 'var(--teal-bright)', fontSize: 17, fontWeight: 700 }}>
                        {val}
                      </span>
                      <div style={{ color: 'var(--faint)', font: '9px var(--mono)' }}>{note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              marginTop: 16,
              paddingTop: 12,
              borderTop: '1px solid var(--line)',
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              color: 'var(--faint)'
            }}>
              基于单文件 2.01 MB ONNX (WASM SIMD) 实测产出
            </div>
          </div>

          {/* Card 2: 物理边界 */}
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 6,
            padding: '22px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ color: 'var(--yellow)', font: '10px var(--mono)', letterSpacing: '0.12em', marginBottom: 14 }}>
                物理求解器验收状态 · CFD SOLVER STATUS
              </div>
              <div style={{ display: 'grid', gap: 10, color: 'var(--muted)', fontSize: 12, lineHeight: 1.7 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <Check size={14} style={{ color: 'var(--teal-bright)', flexShrink: 0, marginTop: 3 }} />
                  <span><strong>SU2 粗网格已跑通：</strong> 14 万节点六面体网格完成一阶 1000 步计算，提取 10 个 Stage 性能趋势节点 (relrms=-3.39)。</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <Check size={14} style={{ color: 'var(--teal-bright)', flexShrink: 0, marginTop: 3 }} />
                  <span><strong>SU2 细网格已就绪：</strong> 355 万节点细网格已完成预处理与 marker 校验，受限单机内存主动止步。</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <CircleAlert size={14} style={{ color: 'var(--yellow)', flexShrink: 0, marginTop: 3 }} />
                  <span><strong>学术边界声明：</strong> 未获得高性能超算集群二阶全收敛证据前，全站绝不声称“物理终审已完成”。</span>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: 16,
              paddingTop: 12,
              borderTop: '1px solid var(--line)',
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              color: 'var(--faint)'
            }}>
              严格遵守 docs/stage-guardrails-D41.md 科研防跑偏宪法
            </div>
          </div>
        </div>

        {/* 04. 底部快捷操作 */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Link to="/explore" className="btn-primary">
            <Cpu size={14} />
            <span>进入设计空间探索</span>
            <span style={{ fontSize: 11, fontFamily: 'var(--mono)', opacity: 0.85 }}>Explore</span>
          </Link>

          <Link to="/predict" className="btn-secondary">
            <span>运行气动推理</span>
            <span style={{ fontSize: 11, fontFamily: 'var(--mono)', opacity: 0.75 }}>Predict</span>
          </Link>
        </div>

      </div>
    </main>
  )
}
