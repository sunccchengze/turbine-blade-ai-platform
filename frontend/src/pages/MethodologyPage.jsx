import { Link } from 'react-router-dom'
import { ArrowUpRight, Database, Brain, ShieldCheck, Target, FlaskConical, Ruler, Check, CircleAlert } from 'lucide-react'
import { PageHeader, SectionLabel, Surface, StatusTag } from '../components/ResearchUI'

const steps = [
  ['01', Database, '公开基准', 'Public benchmark', 'PLAID / NASA Rotor 37 提供 1,000 组压气机 CFD 样本。这里的 Rotor 37 是压气机载体，不是涡轮数据。'],
  ['02', Ruler, '特征工程', 'Feature space', '29,773 个表面节点被压缩为 74 维统计特征。代价是失去空间分布，收益是小样本下的稳定训练。'],
  ['03', Brain, '代理模型', 'Surrogate model', '残差网络输出总压比 π、等熵效率 η 和质量流量 ṁ。生产推理使用 ONNX Runtime Web。'],
  ['04', ShieldCheck, '不确定性', 'Uncertainty', '训练期 MC Dropout 的 σ 作为相对信心提示。覆盖率约 65–89%，不是严格的 95% 统计保证。'],
  ['05', Target, '多目标搜索', 'NSGA-II search', '在 74 维空间搜索 π ≥ 1.8、η ≥ 0.84 的非支配候选，结果仍属于代理模型预测。'],
  ['06', FlaskConical, '物理 Gate', 'Physics gate', '点云与表面拓扑已审计，真实 SU2 通路已启动。最终收敛 RANS 与候选对照仍待服务器或 HPC。'],
]

export default function MethodologyPage() {
  return <main style={{ maxWidth: 1240, margin: '0 auto', padding: '58px 28px 90px' }}>
    <PageHeader index="06" tag="方法论 · METHODOLOGY" title="每一步都留下证据" en="Every step leaves a trace" lead="这不是一条把预测包装成事实的流水线。每个阶段都标出输入、输出和不能越过的边界。" />
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 18, borderBottom: '1px solid var(--line)', marginBottom: 20 }}><StatusTag>证据优先</StatusTag><StatusTag>中文主叙事</StatusTag><StatusTag tone="gold">RANS 最终验证待完成</StatusTag></div>
    <section style={{ display: 'grid', gap: 10 }}>{steps.map(([n, Icon, title, en, desc], i) => <Surface key={n} style={{ display: 'grid', gridTemplateColumns: '44px 28px minmax(140px, .35fr) 1fr', gap: 16, alignItems: 'start', padding: '22px 20px' }}><span className="num" style={{ color: i === 5 ? 'var(--yellow)' : 'var(--teal)', fontSize: 12 }}>{n}</span><Icon size={18} color={i === 5 ? 'var(--yellow)' : 'var(--teal)'} /><div><div style={{ color: 'var(--paper)', fontWeight: 700, fontSize: 15 }}>{title}</div><div style={{ color: 'var(--faint)', font: '10px var(--mono)', marginTop: 4 }}>{en}</div></div><p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.8 }}>{desc}</p></Surface>)}</section>
    <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
      <Surface><SectionLabel>Production numbers</SectionLabel><div style={{ display: 'grid', gap: 12, marginTop: 16 }}>{[['π','0.9844','held-out R²'],['η','0.9561','held-out R²'],['ṁ','0.9827','held-out R²']].map(([k,v,n]) => <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: 10 }}><span style={{ color: 'var(--muted)' }}>{k}</span><span className="num" style={{ color: 'var(--teal-bright)' }}>{v} <small style={{ color: 'var(--faint)', fontSize: 10 }}>{n}</small></span></div>)}</div></Surface>
      <Surface><SectionLabel>Physics boundary</SectionLabel><div style={{ display: 'grid', gap: 10, marginTop: 16, color: 'var(--muted)', fontSize: 12 }}><div><Check size={13} color="var(--teal)" style={{ verticalAlign: 'middle', marginRight: 7 }} />真实 SU2 体网格已读入并进入 solver</div><div><Check size={13} color="var(--teal)" style={{ verticalAlign: 'middle', marginRight: 7 }} />coarse 非收敛性能趋势已留档</div><div><CircleAlert size={13} color="var(--yellow)" style={{ verticalAlign: 'middle', marginRight: 7 }} />fine 长跑受本机内存限制</div></div></Surface>
    </section>
    <div style={{ marginTop: 30 }}><Link to="/explore" style={{ color: 'var(--teal-bright)', textDecoration: 'none', fontSize: 13 }}>去探索设计空间 <ArrowUpRight size={14} style={{ verticalAlign: 'middle' }} /></Link></div>
  </main>
}
