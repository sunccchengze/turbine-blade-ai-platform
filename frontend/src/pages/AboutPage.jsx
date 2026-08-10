import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Database,
  Rocket,
  ShieldCheck,
  FlaskConical,
  Orbit,
  CircleDot,
  Terminal,
} from 'lucide-react'

const milestones = [
  {
    day: '01–08',
    icon: Database,
    title: '基准数据与代理模型构建',
    desc: '从公开 PLAID NASA Rotor 37 数据集提取 1,000 组 CFD 样本与 74 维统计特征，完成 PyTorch 残差代理网络、MC Dropout UQ 与 NSGA-II 算法闭环。',
    tone: 'var(--teal-bright)'
  },
  {
    day: '09–18',
    icon: Rocket,
    title: '全栈交互平台上线',
    desc: 'FastAPI、React 19、Three.js 3D 叶片渲染、Plotly.js 与 ONNX 运行时组成第一版可用平台，打通多学科设计空间实时联动。',
    tone: 'var(--teal-bright)'
  },
  {
    day: '19–37',
    icon: ShieldCheck,
    title: '证据链分级与口径修正',
    desc: '修正 R² 与 Pareto 口径，区分“代理预测”与“CFD 事实”，引入多 Agent 独立红蓝对抗机制，补齐方法论与答辩防守体系。',
    tone: 'var(--yellow)'
  },
  {
    day: '39–41',
    icon: FlaskConical,
    title: '真实点云与表面网格拓扑审计',
    desc: '接入真实点云 (1000×2048×9)，完成 0 非流形边拓扑审计、Ball Pivoting / Poisson 表面保真对照，确认原始叶片几何流道无畸变。',
    tone: 'var(--teal-bright)'
  },
  {
    day: '42–43',
    icon: Orbit,
    title: 'SU2 真实物理闭环与纯前端 WASM 改造',
    desc: '跑通 SU2 coarse 网格 10 阶段流动性能趋势提取（E3 级），公开演示全量改造为浏览器 ONNX Runtime Web (WASM) 纯前端极速架构，践行 D43 瑞士工科设计系统。',
    tone: 'var(--rust)'
  },
]

export default function AboutPage() {
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
              07 / 关于项目 · ABOUT THE RESEARCH PLATFORM
            </div>
            <h1 style={{
              color: 'var(--paper)',
              font: '700 clamp(32px, 4.5vw, 54px)/1.1 var(--display)',
              letterSpacing: '-0.045em',
              marginTop: 12
            }}>
              独立科研与完整工程记录<br />
              <span style={{ color: 'var(--teal-bright)' }}>Built Independently from Problem to Code</span>
            </h1>
          </div>
          <p style={{ maxWidth: 420, color: 'var(--muted)', fontSize: 13, lineHeight: 1.8 }}>
            西安交通大学 · 孙承泽（本科二年级）独立立项研发。从一个工业命题开始，最终演化为数据、模型、3D 视口、纯前端 WASM 推理与物理闭环的完整科研生态。
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
            RESEARCH RECORD · D43 STAGE
          </span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span>作者：孙承泽 (本科二年级)</span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span>技术载体：NASA Rotor 37 压气机</span>
          <span style={{ color: 'var(--line-strong)' }}>|</span>
          <span style={{ color: 'var(--yellow)' }}>开源透明 · 全套可复现</span>
        </div>

        {/* 02. 项目缘起与核心数据概览 (严格水平对齐 2 列) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(320px, 0.8fr)',
          gap: 20,
          alignItems: 'stretch',
          marginBottom: 32
        }}>
          {/* 左侧：项目缘起 */}
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 6,
            padding: '28px 26px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ color: 'var(--yellow)', font: '10px var(--mono)', letterSpacing: '0.12em', marginBottom: 14 }}>
                ORIGIN / 项目缘起与技术背景
              </div>
              <h2 style={{
                color: 'var(--paper)',
                font: '700 24px/1.25 var(--display)',
                letterSpacing: '-0.03em',
                marginBottom: 16
              }}>
                KIT 的新闻是起点，<br />
                <span style={{ color: 'var(--teal-bright)' }}>NASA Rotor 37 是可复现的验证载体</span>
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.85, marginBottom: 14 }}>
                2026 年 2 月，卡尔斯鲁厄理工学院 (KIT) 发布无压气机燃气轮机连续运行 303 秒测试成果，打破了 NASA 保持 25 年的 250 秒世界纪录。这个事件引发了对叶轮机械设计极限与更广阔气动构型空间的探索兴趣。
              </p>
              <p style={{ color: 'var(--faint)', fontSize: 12, lineHeight: 1.8 }}>
                为确保研究结论的完全可审查与第三方复现，本项目选取公开的 NASA Rotor 37 跨音速压气机转子作为研究载体，坚守工科诚实原则，明确区分涡轮新闻引子与当前压气机实验对象。
              </p>
            </div>

            <div style={{
              marginTop: 20,
              paddingTop: 14,
              borderTop: '1px solid var(--line)',
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              color: 'var(--teal-bright)'
            }}>
              独立立项 · 严守学术诚信 · 第一性原理
            </div>
          </div>

          {/* 右侧：核心数字看板 */}
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 6,
            padding: '28px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ color: 'var(--faint)', font: '10px var(--mono)', letterSpacing: '0.12em', marginBottom: 16 }}>
                AT A GLANCE / 核心数字看板
              </div>
              <div style={{ display: 'grid', gap: 16 }}>
                {[
                  ['1,000', '公开 CFD 样本库', 'var(--teal-bright)', 'PLAID Rotor 37 全流道数据'],
                  ['74', '输入特征维度', 'var(--yellow)', '前缘/压力面/吸力面统计特征'],
                  ['523k', '生产模型参数量', 'var(--paper)', '2.01 MB 单文件 ONNX WASM'],
                  ['0.23 ms', '单次推理延迟', 'var(--rust)', '~100,000× 相比 3D CFD 加速比']
                ].map(([num, label, color, note]) => (
                  <div key={label} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    borderBottom: '1px solid var(--line)',
                    paddingBottom: 8
                  }}>
                    <div>
                      <div style={{ color: 'var(--paper)', fontSize: 13, fontWeight: 600 }}>{label}</div>
                      <div style={{ color: 'var(--faint)', font: '9px var(--mono)' }}>{note}</div>
                    </div>
                    <span className="num" style={{ color, fontSize: 20, fontWeight: 700 }}>
                      {num}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              marginTop: 20,
              paddingTop: 14,
              borderTop: '1px solid var(--line)',
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              color: 'var(--faint)'
            }}>
              全套数据与模型均可在浏览器本地完整复现
            </div>
          </div>
        </div>

        {/* 03. 技术旅程时间线 (43 天科研演化史) */}
        <section style={{ marginBottom: 32 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16
          }}>
            <div>
              <div style={{ color: 'var(--yellow)', font: '10px var(--mono)', letterSpacing: '0.12em' }}>
                TECHNOLOGY JOURNEY / 43 天研发演化历程
              </div>
              <div style={{ color: 'var(--paper)', fontSize: 16, fontWeight: 700, marginTop: 2 }}>
                从 Day 01 到 D43 的完整科研攻坚轨迹
              </div>
            </div>
            <span style={{ font: '10px var(--mono)', color: 'var(--faint)' }}>
              5 大关键技术里程碑
            </span>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {milestones.map(({ day, icon: Icon, title, desc, tone }) => (
              <div
                key={day}
                style={{
                  background: 'var(--panel)',
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  padding: '22px 24px',
                  display: 'grid',
                  gridTemplateColumns: '72px 32px minmax(200px, 0.32fr) 1fr',
                  gap: 18,
                  alignItems: 'center'
                }}
                className="card-glow"
              >
                <span className="num" style={{ color: tone, fontSize: 12, fontWeight: 700 }}>
                  DAY {day}
                </span>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Icon size={18} style={{ color: tone }} />
                </div>
                <div style={{ color: 'var(--paper)', fontSize: 14, fontWeight: 700 }}>
                  {title}
                </div>
                <p style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.8 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 04. 终端复现与操作指令 */}
        <section style={{
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 6,
          padding: '24px 26px',
          marginBottom: 32
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Terminal size={16} style={{ color: 'var(--yellow)' }} />
            <span style={{ font: '11px var(--mono)', color: 'var(--paper)', fontWeight: 700 }}>
              REPRODUCIBLE TERMINAL COMMANDS / 本地一键复现指令
            </span>
          </div>

          <div style={{
            background: 'var(--ink)',
            border: '1px solid var(--line)',
            borderRadius: 4,
            padding: '14px 18px',
            fontFamily: 'var(--mono)',
            fontSize: '12px',
            color: 'var(--teal-bright)',
            lineHeight: 1.8,
            overflowX: 'auto'
          }}>
            <code>
              # 1. 克隆代码仓库并同步当前会话分支<br />
              git clone -b arena/019feb03-turbine-blade-ai-platform https://github.com/sunccchengze/turbine-blade-ai-platform.git<br />
              cd turbine-blade-ai-platform<br /><br />
              # 2. 运行模型与静态数据资产一致性体检<br />
              python3 scripts/sync_model_assets.py<br /><br />
              # 3. 启动前端纯本地 WASM 推理服务<br />
              cd frontend && npm install && npm run dev
            </code>
          </div>
        </section>

        {/* 05. 底部作者致谢 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 20,
          borderTop: '1px solid var(--line)',
          fontSize: '12px',
          fontFamily: 'var(--mono)',
          color: 'var(--faint)',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <span>西安交通大学 · 能源与动力工程学院 · 孙承泽</span>
          <Link to="/" style={{ color: 'var(--teal-bright)', textDecoration: 'none' }}>
            返回首页 Overview →
          </Link>
        </div>

      </div>
    </main>
  )
}
