import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  Eye,
  Gauge,
  HardDrive,
  Keyboard,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Target,
  Undo2,
} from 'lucide-react'
import { cardPhases, learningCards } from '../data/learningCards'
import './LearningCardsPage.css'

const PROGRESS_KEY = 'turbine-learning-card-progress-v1'
const CARD_SECONDS = 10 * 60

function readProgress() {
  try {
    const stored = window.localStorage.getItem(PROGRESS_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const rest = Math.max(0, seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${rest}`
}

function StatusMark({ status }) {
  if (status === 'mastered') return <span className="learning-status-mark mastered" aria-label="已掌握"><Check size={12} /></span>
  if (status === 'review') return <span className="learning-status-mark review" aria-label="需要复习"><RotateCcw size={11} /></span>
  return <span className="learning-status-mark idle" aria-hidden="true" />
}

function phaseProgress(phaseId, progress) {
  const phaseCards = learningCards.filter(card => card.phase === phaseId)
  const mastered = phaseCards.filter(card => progress[card.id]?.status === 'mastered').length
  return { mastered, total: phaseCards.length }
}

export default function LearningCardsPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(readProgress)
  const [flipped, setFlipped] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [remaining, setRemaining] = useState(CARD_SECONDS)
  const [roadmapOpen, setRoadmapOpen] = useState(false)

  const current = learningCards[currentIndex]
  const currentStatus = progress[current.id]?.status || 'idle'
  const masteredCount = learningCards.filter(card => progress[card.id]?.status === 'mastered').length
  const reviewCount = learningCards.filter(card => progress[card.id]?.status === 'review').length
  const completion = Math.round((masteredCount / learningCards.length) * 100)
  const nextCard = currentIndex < learningCards.length - 1 ? learningCards[currentIndex + 1] : null
  const previousCard = currentIndex > 0 ? learningCards[currentIndex - 1] : null

  const currentPhase = useMemo(
    () => cardPhases.find(phase => phase.id === current.phase),
    [current.phase],
  )

  useEffect(() => {
    try {
      window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
    } catch {
      // The page remains usable if storage is unavailable.
    }
  }, [progress])

  useEffect(() => {
    if (!sessionStarted || remaining <= 0) return undefined
    const timer = window.setInterval(() => {
      setRemaining(value => {
        if (value <= 1) {
          setSessionStarted(false)
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [sessionStarted, remaining])

  useEffect(() => {
    const onKeyDown = event => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName)) return
      if (event.key === 'ArrowRight' && flipped && nextCard) {
        event.preventDefault()
        goTo(currentIndex + 1)
      }
      if (event.key === 'ArrowLeft' && previousCard) {
        event.preventDefault()
        goTo(currentIndex - 1)
      }
      if (event.key === ' ' && !flipped) {
        event.preventDefault()
        reveal()
      }
      if (event.key.toLowerCase() === 'r' && flipped) {
        event.preventDefault()
        setFlipped(false)
        setTaskOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  function begin() {
    if (remaining <= 0) setRemaining(CARD_SECONDS)
    setSessionStarted(true)
  }

  function reveal() {
    begin()
    setFlipped(true)
  }

  function goTo(index) {
    if (index < 0 || index >= learningCards.length) return
    setCurrentIndex(index)
    setFlipped(false)
    setTaskOpen(false)
    setSessionStarted(false)
    setRemaining(CARD_SECONDS)
    setRoadmapOpen(false)
  }

  function mark(status) {
    setProgress(previous => ({
      ...previous,
      [current.id]: {
        status,
        attempts: (previous[current.id]?.attempts || 0) + 1,
        updatedAt: new Date().toISOString(),
      },
    }))
    setSessionStarted(false)
  }

  function resetProgress() {
    if (!window.confirm('确定要清除 18 张卡片的本地学习记录吗？')) return
    setProgress({})
    setCurrentIndex(0)
    setFlipped(false)
    setTaskOpen(false)
    setRemaining(CARD_SECONDS)
  }

  return (
    <main className="learning-page">
      <div className="learning-atmosphere learning-atmosphere-one" />
      <div className="learning-atmosphere learning-atmosphere-two" />
      <div className="learning-grid" aria-hidden="true" />

      <div className="learning-shell">
        <section className="learning-hero" aria-labelledby="learning-title">
          <div>
            <div className="learning-eyebrow"><Sparkles size={13} /> LEARNING DECK / 18 CARDS / LOCAL-FIRST</div>
            <h1 id="learning-title">Aero <span>Atlas</span></h1>
            <p>人工智能 × 叶轮机械 · 一次一张卡，每张十分钟，把公式、气流和模型接成一条线。</p>
          </div>
          <div className="learning-hero-actions">
            <div className="learning-saved"><HardDrive size={14} /> 本地已保存</div>
            <Link to="/" className="learning-exit"><ArrowLeft size={14} /> 返回平台</Link>
          </div>
        </section>

        <section className="learning-progress-banner" aria-label="学习总进度">
          <div className="learning-progress-copy">
            <span className="learning-progress-kicker">ROUTE PROGRESS</span>
            <strong>{masteredCount}<small> / {learningCards.length}</small></strong>
            <span>已掌握卡片</span>
          </div>
          <div className="learning-progress-track" aria-label={`已完成 ${completion}%`}>
            <span style={{ width: `${completion}%` }} />
          </div>
          <div className="learning-progress-meta">
            <span><Check size={13} /> {completion}% complete</span>
            <span><RotateCcw size={13} /> {reviewCount} 待复习</span>
          </div>
        </section>

        <div className="learning-mobile-rail-toggle">
          <button type="button" onClick={() => setRoadmapOpen(value => !value)} aria-expanded={roadmapOpen}>
            <Gauge size={15} /> 学习路线 <span>{current.order} / {learningCards.length}</span>
            <ChevronRight size={15} className={roadmapOpen ? 'rotate-90' : ''} />
          </button>
        </div>

        <div className={`learning-workspace ${roadmapOpen ? 'roadmap-open' : ''}`}>
          <section className="learning-stage-column">
            <div className="learning-stage-meta">
              <div className="learning-stage-label">
                <span className={`learning-phase-dot ${currentPhase.color}`} />
                <span>{currentPhase.title}</span>
                <span className="learning-slash">/</span>
                <span>{currentPhase.en}</span>
              </div>
              <div className="learning-shortcuts"><Keyboard size={13} /> ← → 导航 · Space 显示答案 · R 返回正面</div>
            </div>

            <div className={`learning-card-stage theme-${current.color} ${flipped ? 'is-flipped' : ''}`}>
              <div className="learning-flip-inner">
                <article className="learning-card-face learning-card-front" aria-hidden={flipped}>
                  <div className="learning-card-topline">
                    <span>{current.phaseLabel}</span>
                    <span className="learning-card-id">C{current.order.toString().padStart(2, '0')}</span>
                  </div>
                  <div className="learning-card-body">
                    <div className="learning-card-glyph" aria-hidden="true">{current.glyph}</div>
                    <div className="learning-card-question-label"><Eye size={14} /> CARD FRONT / 先思考</div>
                    <h2>{current.question}</h2>
                    <p className="learning-card-scenario">{current.scenario}</p>
                    <div className="learning-card-prompt">
                      <span>先不要看答案</span>
                      <strong>用一句话说出你现在的判断。</strong>
                    </div>
                  </div>
                  <div className="learning-card-footer">
                    <div className="learning-card-time"><Clock3 size={15} /> 10 MINUTE CARD</div>
                    <button type="button" className="learning-reveal-button" onClick={reveal} tabIndex={flipped ? -1 : 0}>
                      {sessionStarted ? '显示背面' : '开始这张卡'} <ArrowRight size={17} />
                    </button>
                  </div>
                </article>

                <article className="learning-card-face learning-card-back" aria-hidden={!flipped}>
                  <div className="learning-card-topline">
                    <span>{current.phaseLabel} / CARD BACK</span>
                    <span className="learning-card-status-label">{currentStatus === 'mastered' ? 'MASTERED' : currentStatus === 'review' ? 'REVIEW' : 'UNFILED'}</span>
                  </div>
                  <div className="learning-card-back-scroll">
                    <div className="learning-answer-label"><Lightbulb size={14} /> CORE IDEA / 核心关系</div>
                    <h2>{current.title}</h2>
                    <p className="learning-card-core">{current.core}</p>
                    <div className="learning-formula-panel">
                      <span>RELATION / 关系</span>
                      <strong>{current.formula}</strong>
                    </div>
                    <div className="learning-two-columns">
                      <div>
                        <span className="learning-section-label">KEY TERMS / 关键词</span>
                        <ul>{current.terms.map(term => <li key={term}>{term}</li>)}</ul>
                      </div>
                      <div>
                        <span className="learning-section-label">PROJECT MAPPING / 项目映射</span>
                        <p className="learning-project-note">{current.project}</p>
                      </div>
                    </div>
                    <div className="learning-drill-panel">
                      <div className="learning-drill-heading"><Target size={15} /> 5–8 MIN / MICRO DRILL</div>
                      <p>{current.drill.prompt}</p>
                      <button type="button" className="learning-answer-toggle" onClick={() => setTaskOpen(value => !value)} tabIndex={!flipped ? -1 : 0}>
                        {taskOpen ? '收起参考结果' : '显示参考结果'} <ChevronRight size={14} className={taskOpen ? 'rotate-90' : ''} />
                      </button>
                      {taskOpen && <div className="learning-drill-answer">
                        <ol>{current.drill.steps.map(step => <li key={step}>{step}</li>)}</ol>
                        <strong>{current.drill.answer}</strong>
                      </div>}
                    </div>
                    <div className="learning-trap"><AlertTriangle size={15} /><div><span>BOUNDARY / 边界</span><p>{current.trap}</p></div></div>
                  </div>
                  <div className="learning-card-footer learning-back-footer">
                    <button type="button" className="learning-secondary-button" onClick={() => { setFlipped(false); setTaskOpen(false) }} tabIndex={!flipped ? -1 : 0}><Undo2 size={15} /> 返回正面</button>
                    <div className="learning-rating-actions">
                      <button type="button" className="learning-review-button" onClick={() => mark('review')} tabIndex={!flipped ? -1 : 0}><RotateCcw size={14} /> 需要复习</button>
                      <button type="button" className="learning-master-button" onClick={() => mark('mastered')} tabIndex={!flipped ? -1 : 0}><Check size={15} /> 我能解释</button>
                    </div>
                  </div>
                </article>
              </div>
            </div>

            <div className="learning-below-card">
              <div className="learning-timer" data-running={sessionStarted}>
                <span className="learning-timer-ring"><Clock3 size={15} /></span>
                <div><span className="learning-section-label">CARD TIMER</span><strong>{formatTime(remaining)}</strong></div>
                {sessionStarted ? <span className="learning-timer-state">RUNNING</span> : <button type="button" onClick={begin}>{remaining === CARD_SECONDS ? '开始计时' : '继续计时'}</button>}
              </div>
              <div className="learning-quote">“先复述，再翻面；先解释，再前进。”</div>
            </div>

            <div className="learning-navigation">
              <button type="button" onClick={() => goTo(currentIndex - 1)} disabled={!previousCard}><ArrowLeft size={15} /> 上一张</button>
              <span>Card {current.order} of {learningCards.length}</span>
              <button type="button" onClick={() => goTo(currentIndex + 1)} disabled={!nextCard}>下一张 <ArrowRight size={15} /></button>
            </div>
          </section>

          <aside className="learning-roadmap" aria-label="18 张卡片学习路线">
            <div className="learning-roadmap-head">
              <div><span className="learning-section-label">THE ROUTE</span><h2>学习路线</h2></div>
              <span className="learning-route-count">{masteredCount}/{learningCards.length}</span>
            </div>
            <div className="learning-roadmap-list">
              {cardPhases.map(phase => {
                const stats = phaseProgress(phase.id, progress)
                const cards = learningCards.filter(card => card.phase === phase.id)
                return <div className="learning-phase-group" key={phase.id}>
                  <div className="learning-phase-heading"><span className={`learning-phase-dot ${phase.color}`} /><span>{phase.index} · {phase.title}</span><small>{stats.mastered}/{stats.total}</small></div>
                  {cards.map(card => {
                    const status = progress[card.id]?.status
                    const active = card.id === current.id
                    return <button type="button" className={`learning-roadmap-card ${active ? 'active' : ''} ${status || ''}`} key={card.id} onClick={() => goTo(card.order - 1)} aria-current={active ? 'step' : undefined}>
                      <span className="learning-roadmap-number">{card.glyph}</span>
                      <span className="learning-roadmap-title"><strong>{card.title}</strong><small>{card.en}</small></span>
                      <StatusMark status={status} />
                    </button>
                  })}
                </div>
              })}
            </div>
            <div className="learning-roadmap-foot">
              <div className="learning-storage-note"><HardDrive size={13} /><span>进度只保存在此浏览器</span></div>
              <button type="button" className="learning-reset" onClick={resetProgress}><RotateCcw size={13} /> 清除本地进度</button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
