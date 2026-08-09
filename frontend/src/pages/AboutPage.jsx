import { Database, Rocket, ShieldCheck, FlaskConical, Orbit } from 'lucide-react'
import { PageHeader, SectionLabel, Surface, StatusTag } from '../components/ResearchUI'

const milestones = [
  ['01–08', Database, '数据与模型', '从 PLAID Rotor 37 到 74 维代理模型，完成 UQ 与 NSGA-II。'],
  ['09–18', Rocket, '平台上线', 'FastAPI、React、Three.js、Plotly 和 ONNX 组成第一版可用平台。'],
  ['19–37', ShieldCheck, '证据与可靠性', '修正 R² 与 Pareto 口径，补齐方法论、移动端和答辩材料。'],
  ['39–41', FlaskConical, '真实数据与几何', '接入点云，完成几何 Gate、原始表面拓扑审计与 BPA 对照。'],
  ['42–43', Orbit, 'SU2 与本地推理', '真实 SU2 通路启动，公开演示切换为浏览器 ONNX Runtime Web，并进行全站重构。'],
]

export default function AboutPage() {
  return <main style={{ maxWidth: 1240, margin: '0 auto', padding: '58px 28px 90px' }}>
    <PageHeader index="07" tag="关于 · ABOUT" title="一个人把问题做完整" en="A research platform built independently" lead="孙承泽 · 本科二年级 · 独立完成。这个项目从一条新闻开始，最后变成了数据、模型、平台、部署和物理边界的完整记录。" />
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 18, borderBottom: '1px solid var(--line)', marginBottom: 28 }}><StatusTag>孙承泽</StatusTag><StatusTag>本科二年级</StatusTag><StatusTag>独立项目</StatusTag></div>
    <section style={{ display: 'grid', gridTemplateColumns: '1fr .72fr', gap: 14, alignItems: 'start' }}><Surface><SectionLabel>Origin / 项目缘起</SectionLabel><h2 style={{ color: 'var(--paper)', font: '600 30px/1.12 var(--display)', letterSpacing: '-.04em', marginTop: 18 }}>KIT 的新闻是起点<br /><span style={{ color: 'var(--teal-bright)' }}>Rotor 37 是验证载体</span></h2><p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.9, marginTop: 22 }}>2026 年 2 月，KIT 无压气机氢燃料燃气轮机连续运行 303 秒。这个事件提出了一个叶轮机械问题：当设计空间变得更大，AI 能不能先帮人缩小真正值得计算的范围？项目选择公开的 NASA Rotor 37 压气机数据作为可复现载体，明确区分行业背景和当前实验对象。</p></Surface><Surface><SectionLabel>At a glance</SectionLabel><div style={{ display: 'grid', gap: 16, marginTop: 20 }}><div><div className="num" style={{ color: 'var(--teal-bright)', fontSize: 27 }}>1,000</div><div style={{ color: 'var(--faint)', fontSize: 11 }}>公开 CFD 样本</div></div><div><div className="num" style={{ color: 'var(--yellow)', fontSize: 27 }}>74</div><div style={{ color: 'var(--faint)', fontSize: 11 }}>输入特征维度</div></div><div><div className="num" style={{ color: 'var(--rust)', fontSize: 27 }}>D43</div><div style={{ color: 'var(--faint)', fontSize: 11 }}>当前设计阶段</div></div></div></Surface></section>
    <section style={{ marginTop: 52 }}><SectionLabel>Technology journey / 技术旅程</SectionLabel><div style={{ display: 'grid', gap: 10, marginTop: 18 }}>{milestones.map(([day, Icon, title, desc], i) => <Surface key={day} style={{ display: 'grid', gridTemplateColumns: '72px 28px 160px 1fr', gap: 16, alignItems: 'start', padding: '20px' }}><span className="num" style={{ color: i === milestones.length - 1 ? 'var(--yellow)' : 'var(--teal)', fontSize: 11 }}>DAY {day}</span><Icon size={18} color={i === milestones.length - 1 ? 'var(--yellow)' : 'var(--teal)'} /><strong style={{ color: 'var(--paper)', fontSize: 14 }}>{title}</strong><span style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>{desc}</span></Surface>)}</div></section>
  </main>
}
