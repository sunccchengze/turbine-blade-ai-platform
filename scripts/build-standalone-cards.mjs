import { writeFile } from 'node:fs/promises'
import { learningCards, cardPhases } from '../frontend/src/data/learningCards.js'

const page = String.raw`<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Aero Atlas · AI × 叶轮机械学习卡片</title>
<style>
:root {
  --bg: #0a1413;
  --bg-2: #10201c;
  --panel: rgba(18, 39, 33, .86);
  --line: rgba(154, 203, 184, .19);
  --ink: #1a2a24;
  --muted: #759086;
  --paper: #f4efe3;
  --paper-2: #e9e2d3;
  --teal: #2d786c;
  --amber: #a77720;
  --rust: #ae5543;
  --yellow: #e4c75f;
  --sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --display: Georgia, "Times New Roman", serif;
  --mono: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
}
* { box-sizing: border-box; }
html { background: var(--bg); }
body { margin: 0; min-width: 320px; background: var(--bg); color: #eaf2eb; font-family: var(--sans); }
button { font: inherit; }
button:focus-visible { outline: 2px solid var(--yellow); outline-offset: 3px; }
button:disabled { cursor: not-allowed; opacity: .35; }
.atlas-page { min-height: 100vh; padding: 35px 24px 68px; position: relative; overflow: hidden; background: radial-gradient(circle at 84% -10%, rgba(47, 130, 116, .2), transparent 29rem), var(--bg); }
.atlas-page::before { content: ""; position: absolute; inset: 0; opacity: .28; pointer-events: none; background-image: linear-gradient(rgba(139, 201, 182, .06) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 201, 182, .06) 1px, transparent 1px); background-size: 54px 54px; mask-image: linear-gradient(#000, transparent 86%); }
.atlas-shell { max-width: 1370px; margin: auto; position: relative; z-index: 1; }
.atlas-header { display: flex; align-items: end; justify-content: space-between; gap: 24px; margin-bottom: 25px; }
.eyebrow, .micro-label { color: #91c7b7; font: 600 10px var(--mono); letter-spacing: .13em; text-transform: uppercase; }
.eyebrow { display: flex; gap: 8px; align-items: center; margin-bottom: 13px; }
.eyebrow::before { content: "✦"; color: var(--yellow); }
h1 { margin: 0 0 13px; color: #edf5ed; font: 700 clamp(39px, 5vw, 66px)/.94 var(--display); letter-spacing: -.07em; }
h1 em { color: var(--yellow); font-style: italic; }
.subtitle { margin: 0; max-width: 660px; color: #9cafa4; font-size: 14px; line-height: 1.65; }
.header-actions { display: grid; gap: 8px; justify-items: end; padding-bottom: 2px; }
.local-badge { color: #8cc2b1; display: flex; gap: 7px; align-items: center; font: 10px var(--mono); white-space: nowrap; }
.local-badge::before { content: "●"; color: #73bea8; font-size: 8px; }
.file-note { color: #617970; font: 9px var(--mono); text-align: right; }
.progress-bar { display: grid; grid-template-columns: 180px minmax(130px, 1fr) auto; align-items: center; gap: 22px; padding: 14px 18px; min-height: 76px; border: 1px solid var(--line); background: var(--panel); box-shadow: 0 15px 45px rgba(0,0,0,.15); }
.progress-copy { display: grid; grid-template-columns: auto auto; align-items: baseline; column-gap: 10px; }
.progress-copy .micro-label { grid-column: 1/-1; color: #6f8d80; margin-bottom: 3px; }
.progress-copy strong { color: var(--yellow); font: 700 27px var(--mono); letter-spacing: -.08em; }
.progress-copy small { color: #80968c; font-size: 11px; letter-spacing: 0; }
.progress-copy span:last-child { color: #adbbb1; font-size: 11px; }
.track { height: 5px; overflow: hidden; border-radius: 99px; background: rgba(233,240,234,.1); }
.track span { display: block; height: 100%; width: 0; border-radius: inherit; background: linear-gradient(90deg, #5caa96, #e1c15c); transition: width .35s ease; }
.progress-meta { display: flex; gap: 14px; align-items: center; color: #91aaa0; font: 10px var(--mono); white-space: nowrap; }
.progress-meta button { cursor: pointer; border: 1px solid rgba(151,199,181,.28); background: rgba(15,33,29,.6); color: #9fd8c3; font: 700 10px var(--mono); letter-spacing: .04em; padding: 6px 10px; border-radius: 3px; }
.progress-meta button:hover:not(:disabled) { color: var(--yellow); border-color: rgba(229,200,95,.45); }
.progress-meta button.exit { color: #e3987f; border-color: rgba(201,105,80,.35); }
.progress-meta button.exit:hover:not(:disabled) { color: #f0b39f; border-color: rgba(224,160,130,.5); }
.workspace { display: grid; grid-template-columns: minmax(0, 1fr) 295px; gap: 28px; align-items: start; margin-top: 25px; }
.stage-meta { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 0 4px 11px; }
.phase-label { display: flex; align-items: center; gap: 8px; color: #c2d1c6; font: 11px var(--mono); }
.phase-label strong { color: var(--yellow); }
.phase-label small { color: #6e857a; font-size: 9px; }
.dot { width: 7px; height: 7px; flex: 0 0 auto; border-radius: 50%; background: #7cc2ae; box-shadow: 0 0 12px rgba(124,194,174,.55); }
.dot.amber { background: #e6c65d; box-shadow: 0 0 12px rgba(230,198,93,.5); }
.dot.rust { background: #db8066; box-shadow: 0 0 12px rgba(219,128,102,.45); }
.shortcuts { color: #62776e; font: 10px var(--mono); }
.review-badge { display: inline-flex; align-items: center; color: #e3987f; font: 700 9px var(--mono); letter-spacing: .12em; padding: 5px 9px; border: 1px solid rgba(201,105,80,.35); background: rgba(201,105,80,.08); border-radius: 3px; }
.card-stage { height: 704px; perspective: 1800px; }
/* 3D 翻面命中测试守卫：被藏住的一面彻底不接点击（部分移动端浏览器 backface-visibility 不拦截 hit-test） */
.card-stage:not(.flipped) .back { pointer-events: none; }
.card-stage.flipped .front { pointer-events: none; }
.flip-inner { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; transition: transform .78s cubic-bezier(.2,.78,.2,1); }
.card-stage.flipped .flip-inner { transform: rotateY(180deg); }
.card-face { position: absolute; inset: 0; display: flex; flex-direction: column; overflow: hidden; color: var(--ink); border-radius: 4px; backface-visibility: hidden; -webkit-backface-visibility: hidden; box-shadow: 0 28px 75px rgba(0,0,0,.32), 0 3px 8px rgba(0,0,0,.14); }
.card-face::before { content: ""; position: absolute; inset: 10px; z-index: 0; border: 1px solid rgba(23,55,44,.16); pointer-events: none; }
.front { background: radial-gradient(circle at 88% 9%, rgba(204,175,92,.24), transparent 26%), linear-gradient(135deg, #f7f2e7, #efe8d9); }
.back { transform: rotateY(180deg); background: radial-gradient(circle at 7% 94%, rgba(93,154,135,.16), transparent 30%), linear-gradient(135deg, #eef1e8, #dce8de); }
.theme-amber .front { background: radial-gradient(circle at 88% 9%, rgba(190,145,48,.27), transparent 26%), linear-gradient(135deg, #fbf1db, #eee0c6); }
.theme-rust .front { background: radial-gradient(circle at 88% 9%, rgba(185,94,70,.2), transparent 26%), linear-gradient(135deg, #f7eee7, #eaded4); }
.theme-amber .back { background: linear-gradient(135deg, #f2eee2, #e9e4d3); }
.theme-rust .back { background: linear-gradient(135deg, #f5ece5, #ebddd4); }
.card-top { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; padding: 29px 37px 0; color: #5b7166; font: 600 10px var(--mono); letter-spacing: .12em; text-transform: uppercase; }
.card-id { color: var(--teal); font-size: 13px; }
.card-body { position: relative; z-index: 1; max-width: 820px; margin: auto; padding: 34px 12%; }
.glyph { position: absolute; top: 3px; right: 2%; color: rgba(41,91,75,.07); font: 700 clamp(95px, 13vw, 180px)/1 var(--display); letter-spacing: -.1em; user-select: none; }
.label { display: inline-flex; align-items: center; gap: 7px; color: var(--teal); font: 700 10px var(--mono); letter-spacing: .12em; text-transform: uppercase; }
.front h2 { position: relative; max-width: 760px; margin: 21px 0; color: #182923; font: 700 clamp(29px, 4vw, 51px)/1.12 var(--display); letter-spacing: -.065em; }
.scenario { max-width: 650px; color: #52665c; font-size: 16px; line-height: 1.85; }
.prompt { max-width: 540px; margin-top: 32px; padding: 15px 17px; display: grid; gap: 5px; border-left: 3px solid var(--amber); background: rgba(255,255,255,.38); color: #5d6b61; font-size: 12px; }
.prompt b { color: var(--amber); font: 700 10px var(--mono); letter-spacing: .12em; text-transform: uppercase; }
.prompt strong { color: #283b32; font-size: 14px; }
.card-footer { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 0 37px 29px; }
.card-time { display: flex; align-items: center; gap: 7px; color: #718177; font: 10px var(--mono); letter-spacing: .1em; }
.primary, .secondary, .review, .master, .answer-toggle, .navigation button, .reset { border: 0; cursor: pointer; }
.primary { min-height: 46px; padding: 0 19px; display: inline-flex; gap: 8px; align-items: center; justify-content: center; color: #edf4ed; background: #193a30; box-shadow: 0 8px 18px rgba(25,58,48,.17); font-size: 12px; font-weight: 700; }
.primary:hover, .master:hover, .review:hover, .secondary:hover { transform: translateY(-2px); }
.back-scroll { position: relative; z-index: 1; flex: 1; overflow-y: auto; padding: 27px 9% 12px; scrollbar-width: thin; }
.back h2 { margin: 13px 0 10px; color: #1b3028; font: 700 clamp(27px, 3.7vw, 46px)/1.1 var(--display); letter-spacing: -.06em; }
.core { max-width: 820px; color: #536a5c; font-size: 14px; line-height: 1.8; }
.formula { display: grid; gap: 7px; margin: 20px 0; padding: 15px 18px; border: 1px solid rgba(45,120,108,.22); background: rgba(255,255,255,.42); }
.formula span, .section-label { color: var(--teal); font: 700 9px var(--mono); letter-spacing: .12em; text-transform: uppercase; }
.formula strong { color: #193a30; font: 600 clamp(16px, 2.2vw, 25px)/1.45 var(--mono); letter-spacing: -.04em; word-break: break-word; }
.two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 26px; margin: 19px 0; }
.section-label { display: block; margin-bottom: 9px; color: #6d7e72; }
ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 7px; }
li { position: relative; padding-left: 12px; color: #4e6358; font-size: 12px; }
li::before { content: ""; position: absolute; left: 0; top: .65em; width: 4px; height: 4px; border-radius: 50%; background: var(--teal); }
.project, .drill p { color: #536a5c; font-size: 12px; line-height: 1.75; }
.drill { margin: 19px 0; padding: 15px 17px; border: 1px solid rgba(167,119,32,.25); background: rgba(255,255,255,.35); }
.drill-title { display: flex; align-items: center; gap: 6px; margin-bottom: 9px; color: var(--amber); font: 700 9px var(--mono); letter-spacing: .12em; }
.answer-toggle { display: inline-flex; align-items: center; gap: 7px; padding: 6px 0; color: var(--amber); background: transparent; font-size: 11px; font-weight: 700; }
.answer { display: none; margin-top: 7px; padding-top: 10px; border-top: 1px dashed rgba(167,119,32,.3); color: #536a5c; font-size: 12px; }
.answer.open { display: block; }
.answer ol { margin: 0 0 8px; padding-left: 18px; display: grid; gap: 4px; }
.answer li { padding-left: 0; }
.answer li::before { display: none; }
.trap { display: flex; gap: 10px; align-items: flex-start; padding: 14px 0 5px; border-top: 1px solid rgba(174,85,67,.18); color: var(--rust); }
.trap > div { flex: 1; }
.trap strong { display: block; margin-bottom: 4px; font: 700 9px var(--mono); letter-spacing: .12em; }
.trap p { margin: 0; color: #6e5a50; font-size: 12px; line-height: 1.65; }
.back-footer { padding-top: 13px; border-top: 1px solid rgba(45,120,108,.13); }
.secondary { display: inline-flex; gap: 7px; align-items: center; padding: 8px 0; color: #65796d; background: transparent; font-size: 11px; font-weight: 700; }
.rating { display: flex; gap: 8px; }
.review, .master { min-height: 40px; padding: 0 13px; font-size: 11px; font-weight: 700; }
.review { color: #a55442; background: rgba(174,85,67,.1); }
.master { color: #edf5ed; background: #1c5647; }
.review.marked, .master.marked { background: #12382e; color: #c9ece0; box-shadow: 0 0 0 1px rgba(124,194,174,.35); }
.below-card { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 17px 4px 3px; }
.timer { display: flex; align-items: center; gap: 9px; color: #8ba197; }
.timer-ring { width: 30px; height: 30px; display: grid; place-items: center; border: 1px solid #54796b; border-radius: 50%; color: #a5d6c5; }
.timer.running .timer-ring { animation: pulse 1.8s ease-in-out infinite; }
.timer-data { display: grid; gap: 1px; }
.timer-data span { color: #61776d; font: 8px var(--mono); letter-spacing: .1em; }
.timer-data strong { color: #d7e7db; font: 600 14px var(--mono); }
.timer button { margin-left: 4px; padding: 2px 0; border: 0; border-bottom: 1px solid rgba(229,200,91,.35); color: var(--yellow); background: transparent; cursor: pointer; font: 10px var(--mono); }
.running-text { margin-left: 5px; color: #75bea8; font: 9px var(--mono); letter-spacing: .12em; }
.quote { color: #6d8278; font: italic 12px var(--display); text-align: right; }
.navigation { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-top: 17px; padding: 16px 4px 0; border-top: 1px solid rgba(144,181,165,.14); color: #71877b; font: 10px var(--mono); }
.navigation button { display: inline-flex; align-items: center; gap: 7px; padding: 5px 0; color: #9ab0a5; background: transparent; font: inherit; }
.navigation button:hover:not(:disabled) { color: var(--yellow); }
.roadmap { position: sticky; top: 24px; border: 1px solid var(--line); background: var(--panel); box-shadow: 0 18px 50px rgba(0,0,0,.12); }
.roadmap-head { display: flex; align-items: end; justify-content: space-between; padding: 20px 17px 15px; border-bottom: 1px solid rgba(147,194,176,.14); }
.roadmap-head h2 { margin: 6px 0 0; color: #e0ede2; font: 700 20px var(--display); letter-spacing: -.05em; }
.roadmap-count { color: var(--yellow); font: 12px var(--mono); }
.roadmap-list { max-height: calc(100vh - 260px); overflow: auto; padding: 8px 10px 10px; scrollbar-width: thin; }
.phase-group { padding: 7px 0 10px; }
.phase-heading { display: flex; align-items: center; gap: 7px; padding: 6px 7px 8px; color: #93aa9e; font: 9px var(--mono); letter-spacing: .08em; text-transform: uppercase; }
.phase-heading small { margin-left: auto; color: #5f776c; }
.road-card { width: 100%; display: flex; align-items: center; gap: 9px; padding: 9px 7px; border: 1px solid transparent; color: #82988c; background: transparent; cursor: pointer; text-align: left; transition: background .2s, border-color .2s, transform .2s; }
.road-card:hover { background: rgba(139,194,174,.07); transform: translateX(2px); }
.road-card.active { border-color: rgba(229,200,95,.3); background: rgba(229,200,95,.08); color: #e9f1e9; }
.road-card.mastered strong { color: #abd8c7; }
.road-card.reviewed strong { color: #e4a08a; }
.road-num { width: 21px; flex: 0 0 auto; color: #637e71; font: 10px var(--mono); text-align: center; }
.road-card.active .road-num { color: var(--yellow); }
.road-title { min-width: 0; display: grid; gap: 2px; flex: 1; }
.road-title strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; font-weight: 600; }
.road-title small { overflow: hidden; color: #5f756a; font: 8px var(--mono); letter-spacing: .04em; text-overflow: ellipsis; white-space: nowrap; }
.status { width: 19px; height: 19px; flex: 0 0 auto; display: grid; place-items: center; border-radius: 50%; }
.status.idle { width: 6px; height: 6px; margin: 0 6px; border: 1px solid #536d61; }
.status.mastered { color: #9bd6bf; background: rgba(113,183,157,.18); }
.status.reviewed { color: #e3987f; background: rgba(201,105,80,.16); }
.roadmap-foot { display: grid; gap: 9px; padding: 12px 17px 15px; border-top: 1px solid rgba(147,194,176,.14); }
.storage { color: #658075; font: 9px var(--mono); }
.reset { display: inline-flex; align-items: center; gap: 5px; justify-self: start; padding: 0; color: #6d8177; background: transparent; font: 9px var(--mono); }
.reset:hover { color: #d78973; }
.mobile-route { display: none; }
@keyframes pulse { 0%,100% { box-shadow: 0 0 0 rgba(119,190,166,0); } 50% { box-shadow: 0 0 0 6px rgba(119,190,166,.08); } }
@media (max-width: 1030px) {
  .workspace { grid-template-columns: 1fr; }
  .roadmap { position: static; }
  .roadmap-list { max-height: 400px; }
  .mobile-route { display: flex; width: 100%; align-items: center; gap: 8px; min-height: 45px; margin: 13px 0 -12px; padding: 0 13px; border: 1px solid var(--line); color: #b8c9bd; background: var(--panel); cursor: pointer; font: 11px var(--mono); }
  .mobile-route span { margin-left: auto; color: var(--yellow); }
  .roadmap.hidden { display: none; }
}
@media (max-width: 700px) {
  .atlas-page { padding: 27px 13px 52px; }
  .atlas-header { display: block; }
  h1 { font-size: 45px; }
  .subtitle { font-size: 13px; }
  .header-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 17px; }
  .file-note { text-align: left; }
  .progress-bar { grid-template-columns: 1fr auto; gap: 10px 15px; padding: 14px; }
  .track { grid-column: 1 / -1; order: 3; }
  .progress-meta { display: grid; gap: 6px; justify-items: end; }
  .shortcuts { display: none; }
  .stage-meta { align-items: flex-start; }
  .card-stage { height: 760px; }
  .card-top { padding: 23px 22px 0; font-size: 9px; }
  .card-body { padding: 35px 24px; }
  .glyph { right: 20px; top: 17px; font-size: 115px; }
  .front h2 { font-size: 34px; }
  .scenario { font-size: 14px; line-height: 1.8; }
  .prompt { margin-top: 25px; }
  .card-footer { display: grid; gap: 13px; padding: 0 22px 22px; }
  .card-footer .primary { width: 100%; }
  .back-scroll { padding: 24px 23px 12px; }
  .back h2 { font-size: 31px; }
  .two-cols { grid-template-columns: 1fr; gap: 17px; }
  .back-footer { display: block; }
  .rating { display: grid; grid-template-columns: 1fr 1fr; margin-top: 9px; }
  .review, .master { width: 100%; }
  .below-card { flex-direction: column; align-items: flex-start; }
  .quote { text-align: left; }
}
@media (prefers-reduced-motion: reduce) {
  .flip-inner { transition: none; }
  .road-card:hover, .primary:hover, .master:hover, .review:hover, .secondary:hover { transform: none; }
  .timer.running .timer-ring { animation: none; }
}
</style>
</head>
<body>
<main class="atlas-page">
  <div class="atlas-shell">
    <header class="atlas-header">
      <div>
        <div class="eyebrow">LEARNING DECK / 18 CARDS / OFFLINE HTML</div>
        <h1>Aero <em>Atlas</em></h1>
        <p class="subtitle">人工智能 × 叶轮机械 · 一次一张卡，每张十分钟，把公式、气流和模型接成一条线。</p>
      </div>
      <div class="header-actions">
        <div class="local-badge">本地 HTML · 进度保存在此浏览器</div>
        <div class="file-note">无需 npm · 无需服务器 · 双击即可打开</div>
      </div>
    </header>

    <section class="progress-bar" aria-label="学习总进度">
      <div class="progress-copy"><span class="micro-label">ROUTE PROGRESS</span><strong id="masteredCount">0<small> / 18</small></strong><span>已掌握卡片</span></div>
      <div class="track"><span id="progressTrack"></span></div>
      <div class="progress-meta"><span id="percent">0% complete</span><button id="reviewEntry" type="button" disabled>↻ 0 待复习</button></div>
    </section>

    <button class="mobile-route" id="mobileRouteButton" type="button" aria-expanded="false">▣ 学习路线 <span id="mobileCardCount">1 / 18</span> ›</button>

    <div class="workspace">
      <section>
        <div class="stage-meta"><div class="phase-label"><i class="dot" id="phaseDot"></i><strong id="phaseTitle">公式桥</strong><small id="phaseEn">FORMULA BRIDGE</small></div><span class="review-badge" id="reviewBadge" hidden></span><div class="shortcuts">← → 导航 · Space 显示答案 · R 返回正面</div></div>
        <div class="card-stage" id="cardStage">
          <div class="flip-inner">
            <article class="card-face front" id="frontFace" aria-hidden="false"></article>
            <article class="card-face back" id="backFace" aria-hidden="true"></article>
          </div>
        </div>
        <div class="below-card">
          <div class="timer" id="timer"><span class="timer-ring">◷</span><div class="timer-data"><span>CARD TIMER</span><strong id="timerValue">10:00</strong></div><button id="timerButton" type="button">开始计时</button></div>
          <div class="quote">“先复述，再翻面；先解释，再前进。”</div>
        </div>
        <nav class="navigation" aria-label="卡片导航"><button id="previousButton" type="button">← 上一张</button><span id="cardNumber">Card 1 of 18</span><button id="nextButton" type="button">下一张 →</button></nav>
      </section>

      <aside class="roadmap" id="roadmap" aria-label="18 张卡片学习路线">
        <div class="roadmap-head"><div><span class="micro-label">THE ROUTE</span><h2>学习路线</h2></div><span class="roadmap-count" id="routeCount">0/18</span></div>
        <div class="roadmap-list" id="roadmapList"></div>
        <div class="roadmap-foot"><div class="storage">▣ 进度只保存在此浏览器</div><button class="reset" id="resetButton" type="button">↻ 清除本地进度</button></div>
      </aside>
    </div>
  </div>
</main>
<script>
const cards = __CARDS__;
const phases = __PHASES__;
const STORAGE_KEY = 'aero-atlas-standalone-progress-v1';
const CARD_SECONDS = 600;
const MARK_FEEDBACK_MS = 700;
let currentIndex = 0;
let flipped = false;
let taskOpen = false;
let progress = readProgress();
let remaining = CARD_SECONDS;
let timerRunning = false;
let timerId = null;
let routeOpen = false;
let mode = 'learn'; // 'learn' 顺路线 / 'review' 只走复习队列
let markedId = null;
let markedStatus = null;
let advanceTimer = null;

const el = id => document.getElementById(id);
const currentCard = () => cards[currentIndex];
function readProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function saveProgress() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch { /* local file storage may be blocked */ }
}
function phaseFor(card) { return phases.find(phase => phase.id === card.phase) || phases[0]; }
function phaseClass(card) { return card.color === 'amber' ? 'amber' : card.color === 'rust' ? 'rust' : ''; }
function esc(value) { return String(value).replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character])); }
function formatTime(seconds) { return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(Math.max(0, seconds % 60)).padStart(2, '0'); }
function masteredCount() { return cards.filter(card => progress[card.id]?.status === 'mastered').length; }
function reviewQueue() { return cards.filter(card => progress[card.id]?.status === 'review'); }
function reviewPos() { return mode === 'review' ? reviewQueue().findIndex(card => card.id === currentCard().id) : -1; }
// 复习模式下导航限制在队列内；学习模式走路线顺序
function navTarget(step) {
  const pos = reviewPos();
  if (mode === 'review' && pos !== -1) {
    const queue = reviewQueue();
    const nextPos = pos + step;
    if (nextPos < 0 || nextPos >= queue.length) return null;
    return queue[nextPos].order - 1;
  }
  const nextIndex = currentIndex + step;
  if (nextIndex < 0 || nextIndex >= cards.length) return null;
  return nextIndex;
}

function renderFront(card) {
  return '<div class="card-top"><span>' + esc(card.phaseLabel) + '</span><span class="card-id">C' + String(card.order).padStart(2, '0') + '</span></div>' +
    '<div class="card-body"><div class="glyph">' + esc(card.glyph) + '</div><div class="label">◉ CARD FRONT / 先思考</div><h2>' + esc(card.question) + '</h2><p class="scenario">' + esc(card.scenario) + '</p><div class="prompt"><b>先不要看答案</b><strong>用一句话说出你现在的判断。</strong></div></div>' +
    '<div class="card-footer"><div class="card-time">◷ 10 MINUTE CARD</div><button class="primary" id="revealButton" type="button">' + (timerRunning ? '显示背面' : '开始这张卡') + ' →</button></div>';
}
function renderBack(card) {
  const status = progress[card.id]?.status;
  const statusText = status === 'mastered' ? 'MASTERED' : status === 'review' ? 'REVIEW' : 'UNFILED';
  const terms = card.terms.map(term => '<li>' + esc(term) + '</li>').join('');
  const steps = card.drill.steps.map(step => '<li>' + esc(step) + '</li>').join('');
  const reviewMarked = markedId === card.id && markedStatus === 'review';
  const masterMarked = markedId === card.id && markedStatus === 'mastered';
  return '<div class="card-top"><span>' + esc(card.phaseLabel) + ' / CARD BACK</span><span class="card-id">' + statusText + '</span></div>' +
    '<div class="back-scroll"><div class="label">✦ CORE IDEA / 核心关系</div><h2>' + esc(card.title) + '</h2><p class="core">' + esc(card.core) + '</p><div class="formula"><span>RELATION / 关系</span><strong>' + esc(card.formula) + '</strong></div><div class="two-cols"><div><span class="section-label">KEY TERMS / 关键词</span><ul>' + terms + '</ul></div><div><span class="section-label">PROJECT MAPPING / 项目映射</span><p class="project">' + esc(card.project) + '</p></div></div><div class="drill"><div class="drill-title">◎ 5–8 MIN / MICRO DRILL</div><p>' + esc(card.drill.prompt) + '</p><button class="answer-toggle" id="answerButton" type="button">' + (taskOpen ? '收起参考结果' : '显示参考结果') + ' ›</button><div class="answer ' + (taskOpen ? 'open' : '') + '" id="answer"><ol>' + steps + '</ol><strong>' + esc(card.drill.answer) + '</strong></div></div><div class="trap"><span>⚠</span><div><strong>BOUNDARY / 边界</strong><p>' + esc(card.trap) + '</p></div></div></div>' +
    '<div class="card-footer back-footer"><button class="secondary" id="frontButton" type="button">↶ 返回正面</button><div class="rating"><button class="review' + (reviewMarked ? ' marked' : '') + '" id="reviewButton" type="button">' + (reviewMarked ? '✓ 已记录，进入下一张' : '↻ 需要复习') + '</button><button class="master' + (masterMarked ? ' marked' : '') + '" id="masterButton" type="button">' + (masterMarked ? '✓ 已记录，进入下一张' : '✓ 我能解释') + '</button></div></div>';
}
function renderRoute() {
  const list = el('roadmapList');
  list.innerHTML = phases.map(phase => {
    const group = cards.filter(card => card.phase === phase.id);
    const complete = group.filter(card => progress[card.id]?.status === 'mastered').length;
    return '<div class="phase-group"><div class="phase-heading"><i class="dot ' + phaseClass(phase) + '"></i><span>' + phase.index + ' · ' + esc(phase.title) + '</span><small>' + complete + '/' + group.length + '</small></div>' + group.map(card => {
      const status = progress[card.id]?.status || 'idle';
      const statusSymbol = status === 'mastered' ? '✓' : status === 'review' ? '↻' : '';
      return '<button type="button" class="road-card ' + (card.id === currentCard().id ? 'active ' : '') + (status === 'mastered' ? 'mastered' : status === 'review' ? 'reviewed' : '') + '" data-index="' + (card.order - 1) + '"><span class="road-num">' + esc(card.glyph) + '</span><span class="road-title"><strong>' + esc(card.title) + '</strong><small>' + esc(card.en) + '</small></span><span class="status ' + status + '">' + statusSymbol + '</span></button>';
    }).join('') + '</div>';
  }).join('');
  list.querySelectorAll('.road-card').forEach(button => button.addEventListener('click', () => { if (mode === 'review') mode = 'learn'; goTo(Number(button.dataset.index)); }));
}
function renderProgress() {
  const mastered = masteredCount();
  const reviewed = reviewQueue().length;
  const percent = Math.round(mastered / cards.length * 100);
  el('masteredCount').innerHTML = mastered + '<small> / ' + cards.length + '</small>';
  el('progressTrack').style.width = percent + '%';
  el('percent').textContent = percent + '% complete';
  const entry = el('reviewEntry');
  if (mode === 'review') {
    entry.textContent = '↩ 退出复习';
    entry.disabled = false;
    entry.classList.add('exit');
  } else {
    entry.textContent = '↻ ' + reviewed + ' 待复习';
    entry.disabled = reviewed === 0;
    entry.classList.remove('exit');
  }
  const pos = reviewPos();
  const badge = el('reviewBadge');
  if (mode === 'review' && pos !== -1) { badge.hidden = false; badge.textContent = 'REVIEW MODE · 第 ' + (pos + 1) + '/' + reviewed + ' 张'; }
  else badge.hidden = true;
  el('routeCount').textContent = mastered + '/' + cards.length;
}
function renderCard() {
  const card = currentCard();
  const phase = phaseFor(card);
  el('cardStage').className = 'card-stage theme-' + card.color + (flipped ? ' flipped' : '');
  el('frontFace').innerHTML = renderFront(card);
  el('backFace').innerHTML = renderBack(card);
  el('frontFace').setAttribute('aria-hidden', String(flipped));
  el('backFace').setAttribute('aria-hidden', String(!flipped));
  el('phaseTitle').textContent = phase.title;
  el('phaseEn').textContent = phase.en;
  el('phaseDot').className = 'dot ' + phaseClass(phase);
  const pos = reviewPos();
  el('cardNumber').textContent = 'Card ' + card.order + ' of ' + cards.length + (pos !== -1 ? ' · 复习 ' + (pos + 1) + '/' + reviewQueue().length : '');
  el('mobileCardCount').textContent = card.order + ' / ' + cards.length;
  el('previousButton').disabled = navTarget(-1) === null;
  el('nextButton').disabled = navTarget(1) === null;
  const frontTab = flipped ? -1 : 0;
  const backTab = flipped ? 0 : -1;
  el('revealButton').tabIndex = frontTab;
  ['answerButton', 'frontButton', 'reviewButton', 'masterButton'].forEach(id => { if (el(id)) el(id).tabIndex = backTab; });
  el('revealButton').addEventListener('click', reveal);
  el('answerButton').addEventListener('click', () => { taskOpen = !taskOpen; renderCard(); });
  el('frontButton').addEventListener('click', () => { flipped = false; taskOpen = false; renderCard(); });
  el('reviewButton').addEventListener('click', () => mark('review'));
  el('masterButton').addEventListener('click', () => mark('mastered'));
  renderRoute();
  renderProgress();
}
function beginTimer() {
  if (remaining <= 0) remaining = CARD_SECONDS;
  timerRunning = true;
  el('timer').classList.add('running');
  el('timerButton').outerHTML = '<span class="running-text">RUNNING</span>';
  if (timerId) clearInterval(timerId);
  timerId = setInterval(() => {
    remaining -= 1;
    el('timerValue').textContent = formatTime(remaining);
    if (remaining <= 0) stopTimer();
  }, 1000);
}
function stopTimer() {
  timerRunning = false;
  if (timerId) clearInterval(timerId);
  timerId = null;
  el('timer').classList.remove('running');
  if (!document.getElementById('timerButton')) {
    const span = document.querySelector('.running-text');
    if (span) span.outerHTML = '<button id="timerButton" type="button">' + (remaining === 0 ? '重新计时' : '继续计时') + '</button>';
  }
  el('timerValue').textContent = formatTime(remaining);
  const button = el('timerButton');
  if (button) button.addEventListener('click', beginTimer);
}
function reveal() { beginTimer(); flipped = true; renderCard(); }
function goTo(index) {
  if (index === null || index < 0 || index >= cards.length) return;
  if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
  markedId = null;
  markedStatus = null;
  currentIndex = index;
  flipped = false;
  taskOpen = false;
  remaining = CARD_SECONDS;
  stopTimer();
  renderCard();
}
function mark(status) {
  const card = currentCard();
  const nextProgress = {};
  for (const key in progress) nextProgress[key] = progress[key];
  nextProgress[card.id] = { status: status, attempts: (progress[card.id]?.attempts || 0) + 1, updatedAt: new Date().toISOString() };
  progress = nextProgress;
  saveProgress();
  stopTimer();
  markedId = card.id;
  markedStatus = status;
  if (advanceTimer) clearTimeout(advanceTimer);
  advanceTimer = setTimeout(() => {
    advanceTimer = null;
    markedId = null;
    markedStatus = null;
    scheduleNext(card, status, nextProgress);
  }, MARK_FEEDBACK_MS);
  renderCard();
}
function scheduleNext(target, status, nextProgress) {
  const queue = cards.filter(card => nextProgress[card.id]?.status === 'review');
  if (mode === 'review') {
    const targetPos = queue.findIndex(card => card.id === target.id);
    const next = targetPos !== -1 ? queue[targetPos + 1] : queue[targetPos];
    if (next) { goTo(next.order - 1); } else { mode = 'learn'; renderCard(); }
    return;
  }
  if (target.order < cards.length) goTo(target.order);
}
function resetProgress() {
  if (!window.confirm('确定要清除 18 张卡片的本地学习记录吗？')) return;
  progress = {};
  mode = 'learn';
  currentIndex = 0;
  flipped = false;
  taskOpen = false;
  remaining = CARD_SECONDS;
  stopTimer();
  renderCard();
}

el('previousButton').addEventListener('click', () => goTo(navTarget(-1)));
el('nextButton').addEventListener('click', () => goTo(navTarget(1)));
el('reviewEntry').addEventListener('click', () => {
  if (mode === 'review') { mode = 'learn'; renderCard(); }
  else { const queue = reviewQueue(); if (queue.length > 0) { mode = 'review'; goTo(queue[0].order - 1); } }
});
el('timerButton').addEventListener('click', beginTimer);
el('resetButton').addEventListener('click', resetProgress);
el('mobileRouteButton').addEventListener('click', () => { routeOpen = !routeOpen; el('roadmap').classList.toggle('hidden', !routeOpen); el('mobileRouteButton').setAttribute('aria-expanded', String(routeOpen)); });
window.addEventListener('keydown', event => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName)) return;
  if (event.key === 'ArrowRight' && flipped) { event.preventDefault(); const target = navTarget(1); if (target !== null) goTo(target); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); const target = navTarget(-1); if (target !== null) goTo(target); }
  if (event.key === ' ' && !flipped) { event.preventDefault(); reveal(); }
  if (event.key.toLowerCase() === 'r' && flipped) { event.preventDefault(); flipped = false; taskOpen = false; renderCard(); }
});
renderCard();
renderProgress();
el('timerValue').textContent = formatTime(remaining);
</script>
</body>
</html>
`

const output = page.replace('__CARDS__', JSON.stringify(learningCards)).replace('__PHASES__', JSON.stringify(cardPhases))
// 双输出：仓库根目录（本地单文件版）+ frontend/public（随 Cloudflare Pages 部署，线上 /aero-atlas-cards.html）
const targets = [
  new URL('../aero-atlas-cards.html', import.meta.url),
  new URL('../frontend/public/aero-atlas-cards.html', import.meta.url),
]
for (const target of targets) {
  await writeFile(target, output)
  console.log('wrote', target.pathname, 'with', learningCards.length, 'cards')
}
