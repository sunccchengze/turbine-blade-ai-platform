import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  GraduationCap, Rocket, Database, Brain, BookOpen,
  GitCommit, FlaskConical, Target, ChevronRight, Sparkles,
  ShieldCheck, ArrowRight, GitBranch,
} from 'lucide-react'

const fadeUp = (delay = 0) => ({
  hidden:  { opacity: 0, y: 20 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }
  },
})

function ScrollSection({ children }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
    >
      {children}
    </motion.div>
  )
}

// 左对齐板块标题
function SectionHeader({ tag, title, subtitle }) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <motion.div variants={fadeUp(0)} style={{ marginBottom: '10px' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '4px 12px', borderRadius: '9999px',
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.2)',
          fontSize: '11px', fontWeight: 600, color: '#818cf8',
          letterSpacing: '0.04em',
        }}>
          {tag}
        </span>
      </motion.div>
      <motion.h2
        variants={fadeUp(0.08)}
        style={{
          fontSize: 'clamp(1.6rem, 3vw, 2rem)',
          fontWeight: 700, color: '#f1f5f9', lineHeight: 1.2,
          marginBottom: '10px',
        }}
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p variants={fadeUp(0.12)} style={{ color: '#94a3b8', maxWidth: '720px', lineHeight: 1.7, fontSize: '14px' }}>
          {subtitle}
        </motion.p>
      )}
    </div>
  )
}

// 时间线里程碑（与 docs/devlog 一一对应）
const milestones = [
  { day: '01–04', icon: Database,  title: '数据与特征',  en: 'Data & Features',     desc: 'PLAID NASA Rotor 37 公开基准：1,000 组 CFD 样本 → 74 维统计特征矩阵。' },
  { day: '05–08', icon: Brain,     title: '代理模型',    en: 'Surrogate Model',     desc: '残差网络 + 物理约束损失（R² 全部 > 0.95），MC Dropout UQ，NSGA-II 100 个 Pareto 解。' },
  { day: '09–13', icon: Rocket,    title: '全栈与上线',  en: 'Full Stack & Deploy', desc: 'FastAPI + React + Three.js；PyTorch → ONNX，Docker 容器部署，端到端毫秒级推理。' },
  { day: '14–17', icon: ShieldCheck, title: '可靠性与双语', en: 'Reliability & i18n', desc: '冷启动提示、错误兜底、代码分割（首屏 6 MB → 440 kB）、全站逐句中英双语。' },
  { day: '18–19', icon: FlaskConical, title: '验收与门面', en: 'Acceptance & Polish', desc: '线上总验收（双端验证通过）；README 双语重制，R² 统一为留出测试集口径并可复现。' },
]

export default function AboutPage() {
  useEffect(() => { window.scrollTo(0, 0) }, [])

  return (
    <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 24px 80px' }}>

      {/* ═══════════ Hero：署名 ═══════════ */}
      <ScrollSection>
        <div style={{ textAlign: 'center', padding: '72px 0 24px' }}>
          <motion.div variants={fadeUp(0)} style={{ marginBottom: '18px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 12px', borderRadius: '9999px',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)',
              fontSize: '11px', fontWeight: 600, color: '#818cf8',
              letterSpacing: '0.04em',
            }}>
              <Sparkles size={11} /> ABOUT · 关于
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp(0.08)}
            style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
              fontWeight: 800, color: '#f1f5f9', lineHeight: 1.25,
              marginBottom: '14px',
            }}
          >
            AI 赋能的叶轮机械多学科设计优化平台
            <br />
            <span style={{ fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', fontWeight: 500, color: '#64748b' }}>
              AI-Enabled Multidisciplinary Design Optimization Platform for Turbomachinery
            </span>
          </motion.h1>

          {/* 署名块 */}
          <motion.div
            variants={fadeUp(0.16)}
            style={{
              display: 'inline-block', marginTop: '8px',
              padding: '18px 34px', borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(79,70,229,0.12), rgba(8,145,178,0.08))',
              border: '1px solid rgba(99,102,241,0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>
              <GraduationCap size={20} color="#818cf8" />
              孙承泽 · 本科二年级 · 独立完成
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
              Sun Chengze · Undergraduate (Year 2) · Independent Project
            </div>
          </motion.div>

          <motion.p variants={fadeUp(0.22)} style={{ color: '#64748b', fontSize: '13px', marginTop: '18px' }}>
            从新闻启发到独立交付的全栈项目 —— 数据、模型、平台、部署，一人完成。
            <br />
            <span style={{ fontSize: '12px' }}>
              A full-stack project delivered independently — data, model, platform, and deployment, all by one person.
            </span>
          </motion.p>
        </div>
      </ScrollSection>

      {/* ═══════════ 项目缘起 ═══════════ */}
      <section style={{ padding: '56px 0 8px' }}>
        <ScrollSection>
          <SectionHeader
            tag="The Origin"
            title="项目缘起"
            subtitle="一个新闻引发的自主立项。The origin — an independent project sparked by a single news story."
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {[
              {
                icon: Target, title: 'KIT 突破启发',
                en: 'Sparked by the KIT breakthrough',
                text: '2026 年 2 月，KIT 让无压气机氢燃料燃气轮机连续运行 303 秒，打破 NASA 250 秒纪录。省去压气机后，瓶颈转移到叶片气动效率本身。',
              },
              {
                icon: Rocket, title: '暑假自主立项',
                en: 'Self-initiated summer project',
                text: '受此启发，在暑假自主立项：用深度学习代理模型替代 CFD 做前端筛选，把叶片性能评估从小时级压到毫秒级，并用 NSGA-II 搜索 Pareto 最优设计。',
              },
              {
                icon: GraduationCap, title: '独立完成',
                en: 'Delivered independently',
                text: '从数据获取、特征工程、模型训练，到全栈平台、容器化部署与线上验收，全部独立完成。本页与开发日志（docs/devlog）记录了全过程。',
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                variants={fadeUp(i * 0.08)}
                style={{
                  padding: '24px', borderRadius: '14px',
                  background: 'rgba(30,41,59,0.4)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  transition: 'border-color 0.25s',
                }}
              >
                <card.icon size={18} color="#818cf8" style={{ marginBottom: '12px' }} />
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', marginBottom: '4px' }}>{card.title}</h3>
                <div style={{ fontSize: '11px', color: '#475569', marginBottom: '10px' }}>{card.en}</div>
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.75 }}>{card.text}</p>
              </motion.div>
            ))}
          </div>
        </ScrollSection>
      </section>

      {/* ═══════════ 技术旅程时间线 ═══════════ */}
      <section style={{ padding: '56px 0 8px' }}>
        <ScrollSection>
          <SectionHeader
            tag="The Journey"
            title="技术旅程"
            subtitle="37 个开发日、77 次提交：从零到线上。完整逐日记录见 docs/devlog。The journey — 37 development days, 77 commits, from zero to production. Full day-by-day log in docs/devlog."
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {milestones.map((m, i) => (
              <motion.div
                key={m.day}
                variants={fadeUp(i * 0.06)}
                style={{
                  display: 'flex', gap: '16px', alignItems: 'flex-start',
                  padding: '20px 24px', borderRadius: '14px',
                  background: 'rgba(30,41,59,0.4)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ flexShrink: 0, textAlign: 'center' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: 'rgba(99,102,241,0.15)',
                    border: '1px solid rgba(99,102,241,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <m.icon size={17} color="#818cf8" />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, color: '#22d3ee',
                      padding: '2px 8px', borderRadius: '6px',
                      background: 'rgba(34,211,238,0.08)',
                      border: '1px solid rgba(34,211,238,0.15)',
                    }}>
                      Day {m.day}
                    </span>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>{m.title}</h3>
                    <span style={{ fontSize: '11px', color: '#475569' }}>{m.en}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.75, marginTop: '8px' }}>{m.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollSection>
      </section>

      {/* ═══════════ 方法与数据 ═══════════ */}
      <section style={{ padding: '56px 0 8px' }}>
        <ScrollSection>
          <SectionHeader
            tag="Methods & Data"
            title="方法与数据"
            subtitle="公开基准、可复现数字。Public benchmark, reproducible numbers."
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <motion.div
              variants={fadeUp(0)}
              style={{
                padding: '24px', borderRadius: '14px',
                background: 'rgba(30,41,59,0.4)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <BookOpen size={18} color="#818cf8" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', marginBottom: '10px' }}>模型性能 Model Accuracy</h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.8 }}>
                留出测试集（n=100, random_state=42，训练时未见）实测：总压比 π R² 0.9844 · 效率 η R² 0.9561 · 质量流量 ṁ R² 0.9827。
                <br />
                <span style={{ fontSize: '11px', color: '#475569' }}>
                  Held-out test set (n=100): π 0.9844 · η 0.9561 · ṁ 0.9827.
                </span>
                <br />
                全部可通过 README「快速复现」一键重跑 —— 数字不是宣称，是脚本输出。
              </p>
            </motion.div>
            <motion.div
              variants={fadeUp(0.08)}
              style={{
                padding: '24px', borderRadius: '14px',
                background: 'rgba(30,41,59,0.4)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <Database size={18} color="#818cf8" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', marginBottom: '10px' }}>数据说明 About the Data</h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.8 }}>
                NASA Rotor 37 压气机公开基准（PLAID 数据集，1,000 组 CFD 样本），特征工程为 74 维统计特征。
                <br />
                <span style={{ fontSize: '11px', color: '#475569' }}>
                  NASA Rotor 37 public benchmark (PLAID, 1,000 CFD samples), engineered into 74-dim features.
                </span>
                <br />
                诚实说明：使用公开基准数据，未自行搭建 CFD 求解链路；代理模型的定位是设计前端筛选器，最终方案仍需 CFD 校验。
              </p>
            </motion.div>
          </div>
        </ScrollSection>
      </section>

      {/* ═══════════ CTA + 署名 ═══════════ */}
      <section style={{ padding: '56px 0 0' }}>
        <ScrollSection>
          <motion.div
            variants={fadeUp(0)}
            style={{
              textAlign: 'center', padding: '40px 24px', borderRadius: '18px',
              background: 'linear-gradient(135deg, rgba(79,70,229,0.10), rgba(8,145,178,0.06))',
              border: '1px solid rgba(99,102,241,0.2)',
            }}
          >
            <h2 style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.7rem)', fontWeight: 700, color: '#f1f5f9', marginBottom: '8px' }}>
              去看看它在 74 维设计空间里能找到什么
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>
              See what it finds in a 74-dimensional design space.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/explore" style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '10px 20px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #4f46e5, #0891b2)',
                color: '#fff', fontSize: '14px', fontWeight: 600,
                textDecoration: 'none', boxShadow: '0 4px 14px rgba(79,70,229,0.3)',
              }}>
                进入设计空间探索器 <ArrowRight size={14} />
              </Link>
              <a
                href="https://github.com/sunccchengze/turbine-blade-ai-platform"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '10px 20px', borderRadius: '10px',
                  background: 'rgba(30,41,59,0.6)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#e2e8f0', fontSize: '14px', fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <GitBranch size={14} /> GitHub 仓库 / 开发日志
              </a>
            </div>

            <div style={{
              marginTop: '32px', paddingTop: '24px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#f1f5f9' }}>
                孙承泽 · 本科二年级 · 独立完成
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                Sun Chengze · Undergraduate (Year 2) · Independent Project
              </div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '14px' }}>
                灵感源自 KIT 无压气机燃气轮机突破 (2026.02) · Inspired by KIT's compressorless gas turbine breakthrough (Feb 2026)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '10px', color: '#334155', fontSize: '11px' }}>
                完整开发过程见 <GitCommit size={11} style={{ margin: '0 2px' }} />
                <a
                  href="https://github.com/sunccchengze/turbine-blade-ai-platform/tree/main/docs/devlog"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#818cf8', textDecoration: 'underline' }}
                >
                  docs/devlog
                </a>
              </div>
            </div>
          </motion.div>
        </ScrollSection>
      </section>

      {/* 底部导航提示 */}
      <div style={{ textAlign: 'center', marginTop: '36px' }}>
        <Link to="/" style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> 返回首页 Back to Home
        </Link>
      </div>

    </div>
  )
}
