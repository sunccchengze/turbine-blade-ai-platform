import { Link } from 'react-router-dom'
import { useEffect } from 'react'

const STAGES = [
  {
    id: '01',
    era: '1970s–90s',
    title: '公共考题',
    body: 'NASA Rotor 37 成为跨音速压气机验 CFD 的基准。对象是压气机转子，不是涡轮。',
    here: false,
  },
  {
    id: '02',
    era: '2010s',
    title: '少样本设计',
    body: '伴随、叶型参数化，再是 Kriging / EGO / 多保真。问的是：少算几次真计算，空间能不能探清。',
    here: false,
  },
  {
    id: '03',
    era: '本站',
    title: '标量代理筛选',
    body: '1000 组公开 CFD → 74 维统计特征 → 三个气动标量 → 离线 NSGA-II。能筛，还不能造叶子。',
    here: true,
  },
  {
    id: '04',
    era: '2024–26',
    title: '场与加点',
    body: '神经算子先报场再报性能；主动学习用有限次高保真改可制造几何。这是下一步，不是现状。',
    here: false,
  },
]

const WORKSPACES = [
  { n: '00', to: '/', name: '总览', note: '证据分档。E2 / E3 写在脸上。' },
  { n: '01', to: '/predict', name: '预测', note: '74 维滑块 → π, η, ṁ。本地推断。' },
  { n: '02', to: '/explore', name: '探索', note: '两维切片。代理只在训练分布里插值。' },
  { n: '03', to: '/optimize', name: '优化', note: '特征空间里的非支配候选，不是可制造叶片。' },
  { n: '04', to: '/uq', name: '不确定度', note: '启发式区间。η 覆盖率约 65%，不是校准 95%。' },
  { n: '05', to: '/generate', name: '生成', note: '库内近邻检索，不是新叶型。' },
  { n: '06', to: '/methodology', name: '方法', note: '数据怎么切、损失怎么写、粗网格为什么停。' },
]

const NUMBERS = [
  { v: '0.9844 / 0.9561 / 0.9827', k: '留出集 R²  π / η / ṁ', s: 'n=100, seed=42，训练未见。工程开发划分，不是跨几何族泛化证明。' },
  { v: '0.9173', k: '代理最高效率', s: '相对训练均值约 +5.4%。未用收敛 RANS 核。' },
  { v: '65%', k: 'η 区间覆盖率', s: 'MC Dropout 启发式带。系统说 95% 时并没有盖住 95%。' },
  { v: '−3.39', k: '粗网格残差平台', s: '14 万单元、一阶迎风。E3 趋势，不是细网格闭环。' },
]

const REDLINES = [
  '三个输出都是气动性能。结构、热、振动、寿命、制造约束都还没接。所以不叫多学科设计优化。',
  '74 维是从流场抽出来的统计量，不是 CST / FFD 那种能进求解器的设计变量。NSGA-II 找到的是特征空间里的向量。',
  '100 个点叫代理候选，不叫可制造的 Pareto 最优叶片。',
  '输出上下界（η、π、流量非负）是物理引导的边界正则，不是 PINN，也不是 N-S 残差。',
]

const LOG = [
  { d: '01–08', t: '数据与标量网络', b: 'PLAID 1000×74。残差网。MC Dropout。NSGA-II。' },
  { d: '09–18', t: '能在浏览器里跑', b: '走过容器冷启动，再改到 Cloudflare Pages + WASM。' },
  { d: '19–37', t: '口径收回来', b: 'R²、Pareto 按可复现脚本对齐。代理和 CFD 分开写。' },
  { d: '39–43', t: '几何审计与粗网格', b: '点云拓扑。SU2 粗网格停在 −3.39。细网格内存不够。' },
]

function Label({ children }) {
  return (
    <div style={{
      color: 'var(--yellow)',
      font: '10px var(--mono)',
      letterSpacing: '0.12em',
      marginBottom: 12,
    }}>
      {children}
    </div>
  )
}

export default function AboutPage() {
  useEffect(() => { window.scrollTo(0, 0) }, [])

  return (
    <main style={{ minHeight: '100vh', background: 'transparent', padding: '56px 28px 88px' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>

        <header style={{
          paddingBottom: 22,
          marginBottom: 8,
          borderBottom: '1px solid var(--line)',
        }}>
          <div style={{ color: 'var(--yellow)', font: '10px var(--mono)', letterSpacing: '0.14em' }}>
            07 / 关于 · ABOUT
          </div>
          <h1 style={{
            color: 'var(--paper)',
            font: '700 clamp(28px, 4vw, 44px)/1.12 var(--display)',
            letterSpacing: '-0.04em',
            marginTop: 12,
          }}>
            气动代理筛选站
            <span style={{
              display: 'block',
              marginTop: 10,
              color: 'var(--muted)',
              font: '500 16px/1.5 var(--body)',
              letterSpacing: 0,
            }}>
              Aerodynamic surrogate screening, not a closed MDO loop
            </span>
          </h1>
          <p style={{ maxWidth: 640, color: 'var(--muted)', fontSize: 14, lineHeight: 1.85, marginTop: 16 }}>
            孙承泽 · 交大能动强基 2501。暑假小尝试。载体是 NASA Rotor 37 压气机公开 CFD，不是涡轮，也还不是多学科。代理筛路，物理没定音。
          </p>
          <div style={{
            marginTop: 16,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px 18px',
            color: 'var(--faint)',
            font: '11px var(--mono)',
          }}>
            <span style={{ color: 'var(--teal-bright)' }}>LOCAL WASM</span>
            <span>Rotor 37 / PLAID</span>
            <span>证据停在 E2</span>
            <span style={{ color: 'var(--yellow)' }}>下一步：校准加点</span>
          </div>
        </header>

        <section style={{ padding: '36px 0 8px' }}>
          <Label>WHERE THIS SITS / 我停在哪</Label>
          <p style={{ color: 'var(--faint)', fontSize: 13, lineHeight: 1.7, marginBottom: 18, maxWidth: 720 }}>
            这一页先回答位置，再谈自己做了什么。第三档是本站。第四档是要往上走的地方。
          </p>
          {STAGES.map((row) => (
            <div
              key={row.id}
              className="about-stage"
              style={{
                display: 'grid',
                gridTemplateColumns: '44px 92px minmax(96px, 0.26fr) 1fr',
                gap: 16,
                alignItems: 'baseline',
                padding: '14px 0 14px 12px',
                borderTop: '1px solid var(--line)',
                borderLeft: row.here ? '2px solid var(--yellow)' : '2px solid transparent',
              }}
            >
              <span className="num" style={{ color: row.here ? 'var(--yellow)' : 'var(--faint)', fontSize: 12 }}>{row.id}</span>
              <span className="num" style={{ color: 'var(--faint)', fontSize: 11 }}>{row.era}</span>
              <span style={{ color: 'var(--paper)', fontSize: 14, fontWeight: 650 }}>
                {row.title}
                {row.here && (
                  <span style={{ marginLeft: 8, color: 'var(--yellow)', font: '10px var(--mono)' }}>HERE</span>
                )}
              </span>
              <span style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>{row.body}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--line)' }} />
          <p style={{ color: 'var(--faint)', fontSize: 12, lineHeight: 1.85, marginTop: 16, maxWidth: 780 }}>
            02 这一档里，多保真该不该掺低保真、下一个真样本落在哪，是郭振东老师公开工作里反复问的问题。
            04 里，同一转子上已经有先报场再报性能的算子。本站没有场，也没有加点闭环。所以它是筛选器，不是设计器。
          </p>
        </section>

        <section style={{ padding: '32px 0 8px' }}>
          <div
            className="about-split"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.15fr) minmax(280px, 0.85fr)',
              gap: 32,
              alignItems: 'start',
            }}
          >
            <div>
              <Label>WHAT IT IS / 这个站</Label>
              {WORKSPACES.map((w) => (
                <Link
                  key={w.n}
                  to={w.to}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '36px 64px 1fr',
                    gap: 12,
                    padding: '10px 0',
                    borderTop: '1px solid var(--line)',
                    textDecoration: 'none',
                  }}
                >
                  <span className="num" style={{ color: 'var(--faint)', fontSize: 11 }}>{w.n}</span>
                  <span style={{ color: 'var(--paper)', fontSize: 13, fontWeight: 650 }}>{w.name}</span>
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>{w.note}</span>
                </Link>
              ))}
              <div style={{ borderTop: '1px solid var(--line)' }} />
            </div>
            <div>
              <Label>NUMBERS / 口径</Label>
              {NUMBERS.map((n) => (
                <div key={n.k} style={{ padding: '12px 0', borderTop: '1px solid var(--line)' }}>
                  <div className="num" style={{ color: 'var(--paper)', fontSize: 18, fontWeight: 600 }}>{n.v}</div>
                  <div style={{ color: 'var(--paper)', fontSize: 12, marginTop: 4 }}>{n.k}</div>
                  <div style={{ color: 'var(--faint)', fontSize: 12, lineHeight: 1.65, marginTop: 4 }}>{n.s}</div>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--line)' }} />
            </div>
          </div>
        </section>

        <section style={{ padding: '32px 0 8px' }}>
          <Label>DO NOT CLAIM / 不能写成</Label>
          {REDLINES.map((t, i) => (
            <div
              key={t}
              style={{
                display: 'grid',
                gridTemplateColumns: '36px 1fr',
                gap: 12,
                padding: '14px 0',
                borderTop: '1px solid var(--line)',
                borderBottom: i === REDLINES.length - 1 ? '1px solid var(--line)' : 'none',
              }}
            >
              <span className="num" style={{ color: 'var(--yellow)', fontSize: 12 }}>0{i + 1}</span>
              <span style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.75 }}>{t}</span>
            </div>
          ))}
        </section>

        <section style={{ padding: '32px 0 8px' }}>
          <Label>NEXT / 下一件事</Label>
          <h2 style={{
            color: 'var(--paper)',
            font: '650 22px/1.3 var(--display)',
            letterSpacing: '-0.02em',
            marginBottom: 10,
          }}>
            把 65% 覆盖率当成加点传感器
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.85, maxWidth: 740 }}>
            几何改成 CST 或 FFD，让优化器搜可实现参数，而不是任意搜派生统计量。
            不确定度改成集成加保形校准：系统说 90%，真值大约就要有 90% 落在区间里。
            再用几十次收敛 RANS 核基准、近邻对照、若干候选和一两个高不确定反例。
            场预报跟已有算子学，不另起一套。最优候选被 RANS 否决，也算结果。
          </p>
          <div style={{ marginTop: 16, display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13 }}>
            <Link to="/uq" style={{ color: 'var(--yellow)', textDecoration: 'none' }}>看不确定度页 →</Link>
            <Link to="/methodology" style={{ color: 'var(--muted)', textDecoration: 'none' }}>看方法页 →</Link>
            <Link to="/optimize" style={{ color: 'var(--muted)', textDecoration: 'none' }}>看代理候选 →</Link>
          </div>
        </section>

        <section style={{ padding: '32px 0 8px' }}>
          <Label>LOG / 工程日志</Label>
          {LOG.map((r) => (
            <div
              key={r.d}
              style={{
                display: 'grid',
                gridTemplateColumns: '72px minmax(120px, 0.28fr) 1fr',
                gap: 14,
                padding: '10px 0',
                borderTop: '1px solid var(--line)',
              }}
            >
              <span className="num" style={{ color: 'var(--faint)', fontSize: 11 }}>DAY {r.d}</span>
              <span style={{ color: 'var(--paper)', fontSize: 13 }}>{r.t}</span>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>{r.b}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--line)' }} />
        </section>

        <section style={{ padding: '32px 0 8px' }}>
          <Label>REPRODUCE</Label>
          <pre style={{
            margin: 0,
            padding: '16px 18px',
            background: 'var(--ink-2)',
            border: '1px solid var(--line)',
            color: 'var(--teal-bright)',
            font: '12px/1.8 var(--mono)',
            overflowX: 'auto',
          }}>
{`git clone -b arena/019ff6c7-turbine-blade-ai-platform \\
  https://github.com/sunccchengze/turbine-blade-ai-platform.git
cd turbine-blade-ai-platform/frontend && npm install && npm run dev`}
          </pre>
          <p style={{ color: 'var(--faint)', fontSize: 12, marginTop: 10 }}>
            打开即本地 WASM，不必起后端。数字应能对上 README 复现脚本，对不上就以脚本为准。
          </p>
        </section>

        <footer style={{
          marginTop: 28,
          paddingTop: 18,
          borderTop: '1px solid var(--line)',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          font: '12px var(--mono)',
          color: 'var(--faint)',
        }}>
          <span>西安交通大学 · 能源与动力工程学院 · 能动强基 2501 · 孙承泽</span>
          <Link to="/" style={{ color: 'var(--yellow)', textDecoration: 'none' }}>返回总览 →</Link>
        </footer>
      </div>

      <style>{`
        @media (max-width: 800px) {
          .about-stage { grid-template-columns: 36px 1fr !important; }
          .about-stage span:nth-child(2) { display: none; }
          .about-split { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  )
}
