import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ChevronRight, CircleDot, Database, Layers3, Orbit, ShieldCheck } from 'lucide-react'

const fade = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: .55, ease: [.22, .8, .24, 1] } } }

function Eyebrow({ children }) { return <div style={{ color: 'var(--yellow)', font: '10px var(--mono)', letterSpacing: '.16em', textTransform: 'uppercase' }}>{children}</div> }
function Rule() { return <div style={{ height: 1, background: 'var(--line)' }} /> }
function Metric({ value, label, note, accent = 'var(--teal)' }) {
  return <div className="card-glow" style={{ padding: '22px 20px', border: '1px solid var(--line)', background: 'var(--panel)', borderRadius: 8 }}>
    <div className="num" style={{ color: accent, fontSize: 30, lineHeight: 1.1, marginBottom: 12 }}>{value}</div>
    <div style={{ color: 'var(--paper)', fontSize: 13, fontWeight: 600 }}>{label}</div>
    <div style={{ color: 'var(--faint)', font: '10px var(--mono)', marginTop: 5 }}>{note}</div>
  </div>
}
function SectionHead({ index, title, en, children }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 24, marginBottom: 26, flexWrap: 'wrap' }}>
    <div style={{ display: 'flex', gap: 14, alignItems: 'start' }}><span className="num" style={{ color: 'var(--yellow)', fontSize: 12, paddingTop: 5 }}>{index}</span><div><h2 style={{ color: 'var(--paper)', font: '600 clamp(24px,3vw,38px)/1 var(--display)', letterSpacing: '-.045em' }}>{title}</h2><div style={{ color: 'var(--faint)', font: '10px var(--mono)', marginTop: 8, letterSpacing: '.08em' }}>{en}</div></div></div>
    {children && <div style={{ maxWidth: 380, color: 'var(--muted)', fontSize: 12, lineHeight: 1.7 }}>{children}</div>}
  </div>
}

export default function HomePage() {
  return <main>
    <section className="grid-bg" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="hero-glow" />
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '92px 28px 76px', position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.05fr) minmax(300px,.95fr)', gap: 70, alignItems: 'end' }}>
          <motion.div initial="hidden" animate="visible" variants={fade}>
            <Eyebrow>AI-ENABLED TURBOMACHINERY / RESEARCH PLATFORM</Eyebrow>
            <h1 style={{ color: 'var(--paper)', font: '600 clamp(40px,5.8vw,72px)/1.14 var(--display)', letterSpacing: '-.045em', maxWidth: 760, marginTop: 19 }}>Surrogate explores<br /><span style={{ color: 'var(--teal-bright)' }}>Physics decides</span><br /><span style={{ color: 'var(--faint)', font: '500 clamp(18px,2.5vw,30px)/1.3 var(--body)', letterSpacing: '-.02em' }}>模型探路·物理定音</span></h1>
            <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.8, maxWidth: 570, marginTop: 26 }}>用代理模型先筛选 74 维设计空间，再把值得计算的候选交给真实物理验证。现在，预测和探索都在浏览器本地运行。</p>
            <p style={{ color: 'var(--faint)', font: '11px var(--mono)', maxWidth: 570, lineHeight: 1.7, marginTop: 10 }}>Surrogate screening for NASA Rotor 37 compressor data. Pareto results are predictions, not converged RANS facts.</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 32, flexWrap: 'wrap' }}>
              <Link to="/explore" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--yellow)', color: 'var(--ink)', padding: '12px 17px', borderRadius: 5, textDecoration: 'none', fontSize: 12, fontWeight: 800 }}>Open design space <ArrowUpRight size={15} /></Link>
              <Link to="/methodology" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--paper)', border: '1px solid var(--line-strong)', padding: '11px 17px', borderRadius: 5, textDecoration: 'none', fontSize: 12 }}>Read the evidence <ChevronRight size={15} /></Link>
            </div>
          </motion.div>
          <motion.div initial="hidden" animate="visible" variants={{ ...fade, visible: { ...fade.visible, transition: { ...fade.visible.transition, delay: .12 } } }} style={{ border: '1px solid var(--line-strong)', background: 'rgba(17,22,21,.72)', borderRadius: 9, overflow: 'hidden', position: 'relative' }}>
            <div style={{ height: 3, background: 'var(--yellow)' }} /><div style={{ padding: 19, borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ font: '11px var(--mono)', color: 'var(--muted)' }}>RUN STATUS / 08.09.2026</span><span className="badge" style={{ color: 'var(--teal-bright)' }}><CircleDot size={9} /> LOCAL READY</span></div>
            <div style={{ padding: 25 }}><div style={{ color: 'var(--faint)', font: '10px var(--mono)', letterSpacing: '.1em' }}>CURRENT EVIDENCE PATH</div><div style={{ marginTop: 20, display: 'grid', gap: 0 }}>{[['01','PUBLIC DATA','PLAID / Rotor 37 / 1,000 samples'],['02','SURROGATE','ONNX / 74 features / 3 outputs'],['03','SEARCH','NSGA-II / 100 predicted candidates'],['04','PHYSICS GATE','SU2 route live / RANS pending']].map(([n, t, d], i) => <div key={n} style={{ display: 'grid', gridTemplateColumns: '32px 1fr', gap: 12, padding: '13px 0', borderBottom: i < 3 ? '1px solid var(--line)' : 0 }}><span className="num" style={{ color: i === 3 ? 'var(--yellow)' : 'var(--teal)', fontSize: 11 }}>{n}</span><div><div style={{ color: 'var(--paper)', fontSize: 12, fontWeight: 700 }}>{t}</div><div style={{ color: 'var(--faint)', font: '10px var(--mono)', marginTop: 4 }}>{d}</div></div></div>)}</div></div>
            <div className="scanline" style={{ height: 1, background: 'var(--teal)', opacity: .28, position: 'absolute', left: 0, right: 0, top: '22%' }} />
          </motion.div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginTop: 72, flexWrap: 'wrap', color: 'var(--faint)', font: '10px var(--mono)' }}><span>CONTEXT / KIT 303 SEC COMPRESSORLESS TURBINE</span><span>ACTUAL CARRIER / NASA ROTOR 37 COMPRESSOR</span><span>MODE / BROWSER WASM</span></div>
      </div>
    </section>

    <section style={{ maxWidth: 1240, margin: '0 auto', padding: '74px 28px 10px' }}><SectionHead index="01" title="What the model can say" en="HELD-OUT TEST SET / ONNX PRODUCTION MODEL">三个数字描述的是留出测试集上的代理精度。不是最终 CFD 性能。</SectionHead><div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}><Metric value="0.9844" label="总压比 R²" note="π / TEST N=100" /><Metric value="0.9561" label="效率 R²" note="η / TEST N=100" accent="var(--yellow)" /><Metric value="0.9827" label="质量流量 R²" note="ṁ / TEST N=100" /><Metric value="~100K×" label="筛选加速量级" note="ORDER OF MAGNITUDE" accent="var(--rust)" /></div></section>

    <section style={{ maxWidth: 1240, margin: '0 auto', padding: '74px 28px' }}><SectionHead index="02" title="The design loop" en="FROM PARAMETERS TO A PHYSICS GATE">每一步都留下证据。每一步也有自己的边界。</SectionHead><div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>{[{icon: Database, n:'01', t:'Observe', d:'公开 Rotor 37 数据与真实点云，先把输入审计清楚。'}, {icon: Orbit, n:'02', t:'Predict', d:'74 维统计特征进入 ONNX 代理，在浏览器本地推理。'}, {icon: Layers3, n:'03', t:'Search', d:'NSGA-II 生成 100 个候选，作为筛选结果而非事实。'}, {icon: ShieldCheck, n:'04', t:'Verify', d:'几何审计与 SU2 通路已启动，最终 RANS 仍待 HPC。'}].map(({ icon: Icon, n, t, d }, i) => <motion.div whileHover={{ y: -3 }} key={n} className="card-glow" style={{ padding: 21, minHeight: 205, border: '1px solid var(--line)', background: 'var(--panel)', borderRadius: 8, position: 'relative' }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><Icon size={18} color={i === 3 ? 'var(--yellow)' : 'var(--teal)'} /><span className="num" style={{ color: 'var(--faint)', fontSize: 11 }}>{n}</span></div><h3 style={{ color: 'var(--paper)', font: '600 22px var(--display)', marginTop: 38 }}>{t}</h3><p style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.7, marginTop: 8 }}>{d}</p></motion.div>)}</div></section>

    <Rule />
    <section style={{ maxWidth: 1240, margin: '0 auto', padding: '58px 28px 86px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 70, alignItems: 'start' }}><div><Eyebrow>THE DECISION</Eyebrow><h2 style={{ color: 'var(--paper)', font: '600 clamp(30px,4vw,52px)/.98 var(--display)', letterSpacing: '-.06em', marginTop: 17 }}>A fast filter.<br /><span style={{ color: 'var(--yellow)' }}>A slower truth.</span></h2></div><div style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.9 }}><p>代理模型负责缩小搜索空间。几何审计负责拒绝不可信的形状。RANS 负责最后裁决。把这三个角色混在一起，平台会显得更完整，结论却会变得更弱。</p><Link to="/optimize" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--teal-bright)', fontSize: 12, textDecoration: 'none', marginTop: 22 }}>Inspect predicted candidates <ArrowUpRight size={14} /></Link></div></section>
  </main>
}
