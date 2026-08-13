/* Local study player — no build step. PAGE_DATA is inlined on each page. */
(function () {
  const DATA = window.PAGE_DATA || {};
  const STORAGE = "tb-learn-" + (DATA.id || "page");
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  function loadMastered() {
    try { return new Set(JSON.parse(localStorage.getItem(STORAGE) || "[]")); }
    catch { return new Set(); }
  }
  function saveMastered(set) {
    localStorage.setItem(STORAGE, JSON.stringify([...set]));
  }

  function esc(s) {
    return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  }

  /* Collapse leftover JSON/object-literal backslashes so \( \) \[ \] are real delimiters. */
  function normalizeDelimiters(s) {
    let prev;
    do {
      prev = s;
      s = s.replace(/\\{2,}\(/g, "\\(")
           .replace(/\\{2,}\)/g, "\\)")
           .replace(/\\{2,}\[/g, "\\[")
           .replace(/\\{2,}\]/g, "\\]");
    } while (s !== prev);
    return s;
  }

  const GREEK = {
    alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", zeta: "ζ",
    eta: "η", theta: "θ", iota: "ι", kappa: "κ", lambda: "λ", mu: "μ",
    nu: "ν", xi: "ξ", pi: "π", rho: "ρ", sigma: "σ", tau: "τ",
    upsilon: "υ", phi: "φ", chi: "χ", psi: "ψ", omega: "ω",
    Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Xi: "Ξ",
    Pi: "Π", Sigma: "Σ", Phi: "Φ", Psi: "Ψ", Omega: "Ω",
  };

  function fallbackTex(src, display) {
    let s = String(src || "").trim();
    s = s.replace(/\\(?:left|right|big|Big|bigg|Bigg)\s*/g, "");
    s = s.replace(/\\(?:quad|qquad|,|;|!)/g, " ");
    s = s.replace(/\\dot\s*\{\s*m\s*\}/g, "ṁ");
    s = s.replace(/\\dot\s+m\b/g, "ṁ");
    s = s.replace(/\\hat\s*\{\s*C\s*\}/g, "Ĉ");
    s = s.replace(/\\hat\s*C\b/g, "Ĉ");
    s = s.replace(/\\hat\s*\{\s*y\s*\}/g, "ŷ");
    s = s.replace(/\\hat\s*\{\s*\\mu\s*\}/g, "μ̂");
    s = s.replace(/\\hat\s*\{\s*\\sigma\s*\}/g, "σ̂");
    s = s.replace(/\\bar\s*\{\s*y\s*\}/g, "ȳ");
    s = s.replace(/\\bar\s*\{\s*\\sigma\s*\}/g, "σ̄");
    s = s.replace(/\\langle/g, "⟨").replace(/\\rangle/g, "⟩");
    s = s.replace(/\\(?:mathrm|mathbf|boldsymbol|textit|textrm|text|operatorname)\s*\{([^{}]*)\}/g, "$1");
    s = s.replace(/\\mathbb\s*\{R\}/g, "ℝ");
    s = s.replace(/\\mathcal\s*\{N\}/g, "𝒩");
    s = s.replace(/\\infty/g, "∞");
    s = s.replace(/\\pm/g, "±");
    s = s.replace(/\\times/g, "×");
    s = s.replace(/\\cdot/g, "·");
    s = s.replace(/\\approx/g, "≈");
    s = s.replace(/\\leq|\\le\b/g, "≤");
    s = s.replace(/\\geq|\\ge\b/g, "≥");
    s = s.replace(/\\neq|\\ne\b/g, "≠");
    s = s.replace(/\\mapsto/g, "↦");
    s = s.replace(/\\to\b/g, "→");
    s = s.replace(/\\in\b/g, "∈");
    s = s.replace(/\\cap/g, "∩");
    s = s.replace(/\\sum/g, "∑");
    s = s.replace(/\\int/g, "∫");
    s = s.replace(/\\partial/g, "∂");
    s = s.replace(/\\odot/g, "⊙");
    s = s.replace(/\\sqrt\s*\{([^{}]*)\}/g, "√($1)");
    s = s.replace(/\\log(?:_\{?10\}?)?/g, "log");
    s = s.replace(/\\tanh/g, "tanh");
    s = s.replace(/\\max/g, "max");
    s = s.replace(/\\min/g, "min");
    Object.keys(GREEK).forEach((k) => {
      s = s.replace(new RegExp("\\\\" + k + "\\b", "g"), GREEK[k]);
    });
    s = s.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, "($1)/($2)");
    s = s.replace(/\^\{([^{}]+)\}/g, "<sup>$1</sup>");
    s = s.replace(/_\{([^{}]+)\}/g, "<sub>$1</sub>");
    s = s.replace(/\^([A-Za-z0-9])/g, "<sup>$1</sup>");
    s = s.replace(/_([A-Za-z0-9])/g, "<sub>$1</sub>");
    s = s.replace(/\\([A-Za-z]+)/g, "$1");
    s = s.replace(/[{}]/g, "");
    s = s.replace(/\s{2,}/g, " ").trim();
    const cls = display ? "tex-fallback tex-display" : "tex-fallback";
    const tag = display ? "div" : "span";
    return "<" + tag + " class=\"" + cls + "\">" + s + "</" + tag + ">";
  }

  function preprocessTex(src) {
    return String(src || "")
      .replace(/_\\max\b/g, "_{\\max}")
      .replace(/_\\min\b/g, "_{\\min}")
      .replace(/\\dot\s+m\b/g, "\\dot{m}");
  }

  function texToHtml(math, display) {
    const src = preprocessTex(String(math || "").trim());
    if (!src) return "";
    if (window.katex) {
      try {
        const html = katex.renderToString(src, {
          displayMode: !!display,
          throwOnError: false,
          strict: "ignore",
          output: "html",
        });
        if (html && html.indexOf("katex-error") === -1) return html;
      } catch (_) { /* fallback */ }
    }
    return fallbackTex(src, display);
  }

  function extractAndRenderTex(text) {
    const slots = [];
    const put = (html) => {
      const tok = "\uE000" + slots.length + "\uE001";
      slots.push(html);
      return tok;
    };
    let s = normalizeDelimiters(String(text || ""));
    s = s.replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => put(texToHtml(m, true)));
    s = s.replace(/\$\$([\s\S]*?)\$\$/g, (_, m) => put(texToHtml(m, true)));
    s = s.replace(/\\\(([\s\S]*?)\\\)/g, (_, m) => put(texToHtml(m, false)));
    s = s.replace(/\$([^$\n]+?)\$/g, (_, m) => put(texToHtml(m, false)));
    return { text: s, slots };
  }

  function restoreSlots(text, slots) {
    let s = text;
    slots.forEach((html, i) => {
      s = s.split("\uE000" + i + "\uE001").join(html);
    });
    return s;
  }

  function renderMath(text) {
    if (!text) return "<div></div>";
    const fences = [];
    const keep = (html) => {
      const tok = "\uE010" + fences.length + "\uE011";
      fences.push(html);
      return tok;
    };
    let result = String(text);
    result = result.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) =>
      keep("<pre><code>" + esc(code.trim()) + "</code></pre>"));
    result = result.replace(/`([^`\n]+?)`/g, (_, code) =>
      keep("<code>" + esc(code) + "</code>"));

    const extracted = extractAndRenderTex(result);
    result = extracted.text;

    const tableRe = /\n\|(.+)\|\n\|[-|\s:]+\|\n((?:\|.+\|\n?)+)/g;
    result = result.replace(tableRe, (_, headerRow, bodyRows) => {
      const headers = headerRow.split("|").map((h) => h.trim()).filter(Boolean);
      const rows = bodyRows.trim().split("\n").map((row) =>
        row.split("|").map((c) => c.trim()).filter(Boolean));
      let t = "<table><thead><tr>";
      headers.forEach((h) => { t += "<th>" + h + "</th>"; });
      t += "</tr></thead><tbody>";
      rows.forEach((row) => {
        t += "<tr>";
        row.forEach((c) => { t += "<td>" + c + "</td>"; });
        t += "</tr>";
      });
      return t + "</tbody></table>";
    });
    result = result.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    result = result.replace(/\n---\n/g, "<hr/>");
    result = result.replace(/^(\d+)\.\s+(.+)$/gm, "<li>$2</li>");
    result = result.replace(/(<li>.*<\/li>\n?)+/g, "<ol>$&</ol>");
    result = result.replace(/^[-•]\s+(.+)$/gm, "<li>$1</li>");
    result = result.replace(/\n\n/g, "</p><p>");
    result = result.replace(/\n/g, "<br/>");
    result = restoreSlots(result, extracted.slots);
    fences.forEach((html, i) => {
      result = result.split("\uE010" + i + "\uE011").join(html);
    });
    return "<div>" + result + "</div>";
  }

  function renderInline(text) {
    if (!text) return "";
    const extracted = extractAndRenderTex(String(text));
    let s = extracted.text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    return restoreSlots(s, extracted.slots);
  }

  function leftoverTex(root) {
    if (!root) return;
    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(root, {
          delimiters: [
            { left: "\\[", right: "\\]", display: true },
            { left: "$$", right: "$$", display: true },
            { left: "\\(", right: "\\)", display: false },
          ],
          throwOnError: false,
          strict: "ignore",
        });
      } catch (_) { /* ignore */ }
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const v = node.nodeValue;
      if (!v || !/\\[(\[]/.test(v)) return;
      const span = document.createElement("span");
      span.innerHTML = renderInline(v);
      if (node.parentNode) node.parentNode.replaceChild(span, node);
    });
  }

  function toast(msg) {
    let el = $(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      el.id = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.display = "block";
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.style.display = "none"; }, 1400);
  }

  const typeMeta = {
    choice: { label: "选择", color: "#6A9BCC" },
    fill: { label: "填空", color: "#C9973B" },
    short: { label: "简答", color: "#6A8C5F" },
  };
  const diffMeta = {
    easy: { label: "易", color: "#6A8C5F", bg: "#6A8C5F18" },
    medium: { label: "中", color: "#C9973B", bg: "#C9973B18" },
    hard: { label: "难", color: "#B84A3A", bg: "#B84A3A18" },
  };

  const state = {
    mode: DATA.kind === "exam" ? "questions" : "questions",
    section: (DATA.sections && DATA.sections[0] && DATA.sections[0].id) || "all",
    index: 0,
    show: new Set(),
    mastered: loadMastered(),
    hide: false,
    filterType: "all",
  };

  function allQuestions() {
    return DATA.questions || [];
  }
  function sectionQuestions() {
    let qs = allQuestions();
    if (DATA.kind !== "exam" && state.section !== "all") {
      qs = qs.filter((q) => q.section === state.section);
    }
    if (state.filterType !== "all") qs = qs.filter((q) => q.type === state.filterType);
    if (state.hide) qs = qs.filter((q) => !state.mastered.has(q.id));
    return qs;
  }

  function renderSidebar() {
    const masteredN = [...state.mastered].filter((id) => allQuestions().some((q) => q.id === id)).length;
    const total = allQuestions().length;
    const pct = total ? (masteredN / total) * 100 : 0;
    const secs = DATA.sections || [];
    let secHtml = "";
    if (DATA.kind !== "exam") {
      secHtml = `<div class="sec-tabs">` +
        secs.map((s, i) =>
          `<button class="${state.section === s.id ? "on" : ""}" data-sec="${s.id}"><kbd>${i + 1}</kbd> ${s.title}</button>`
        ).join("") + `</div>`;
    } else {
      secHtml = `<div class="sec-tabs">
        <button class="${state.filterType === "all" ? "on" : ""}" data-ft="all">全部</button>
        <button class="${state.filterType === "choice" ? "on" : ""}" data-ft="choice">选择</button>
        <button class="${state.filterType === "fill" ? "on" : ""}" data-ft="fill">填空</button>
        <button class="${state.filterType === "short" ? "on" : ""}" data-ft="short">简答</button>
      </div>`;
    }
    const qs = sectionQuestions();
    const qnav = qs.map((q, i) =>
      `<button class="${i === state.index ? "on" : ""}" data-qi="${i}">
        <span>${q.number || q.id}</span>
        ${state.mastered.has(q.id) ? '<span style="color:var(--color-success)">●</span>' : ""}
      </button>`
    ).join("");

    const cnav = (DATA.contentSections || []).map((s) =>
      `<a href="#${s.id}">${s.number} ${renderInline(s.title)}</a>`
    ).join("");

    $("#sidebar").innerHTML = `
      <div class="sidebar-head">
        <a href="index.html" style="font-size:12px;color:var(--color-text-faint);text-decoration:none">← 目录</a>
        <h1>${renderInline(DATA.title || "")}</h1>
        <p>${DATA.subtitle || "本地学习"}</p>
        <div class="progress-row"><span>掌握进度</span><span>${masteredN}/${total}</span></div>
        <div class="progress-bar"><span style="width:${pct}%"></span></div>
      </div>
      ${DATA.kind === "exam" ? "" : `
      <div class="mode-tabs">
        <button class="${state.mode === "content" ? "on" : ""}" data-mode="content">教材</button>
        <button class="${state.mode === "questions" ? "on" : ""}" data-mode="questions">练习</button>
      </div>`}
      ${state.mode === "questions" ? secHtml : ""}
      ${state.mode === "questions" ? `<div class="qnav">${qnav}</div>` : `<div class="cnav">${cnav}</div>`}
      <div class="side-foot">空格显示答案 · M 掌握 · A 全开 · H 未掌握 · ? 帮助</div>
    `;
  }

  function renderContent() {
    const secs = DATA.contentSections || [];
    let html = `<div id="section-intro">
      <h1 style="font-size:30px;margin:0 0 14px">${renderInline(DATA.title || "")}</h1>
      <div class="intro">${renderMath(DATA.intro || "")}</div>
    </div>`;
    secs.forEach((s) => {
      html += `<section id="${s.id}" style="margin-bottom:48px;scroll-margin-top:20px">
        <h2 class="sec-h"><span class="sec-num">${s.number}</span>${renderInline(s.title)}</h2>
        <div class="content-section">${renderMath(s.content)}</div>
      </section>`;
    });
    $("#main").innerHTML = html;
    leftoverTex($("#main"));
  }

  function renderQuestions() {
    const qs = sectionQuestions();
    if (state.index >= qs.length) state.index = Math.max(0, qs.length - 1);
    const head = `
      <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:22px">
        <div>
          <h2 style="margin:0;font-size:26px">${renderInline(sectionTitle())}</h2>
          <p style="margin:4px 0 0;color:var(--color-text-muted);font-size:14px">共 ${qs.length} 题${state.hide ? " · 仅未掌握" : ""}</p>
          ${DATA.info ? `<p style="margin:6px 0 0;color:var(--color-text-muted);font-size:13px">${renderInline(DATA.info)}</p>` : ""}
        </div>
        <div class="toolbar">
          <button class="toolbtn" id="btnHide">${state.hide ? "显示全部" : "只看未掌握"}</button>
          <button class="toolbtn" id="btnAll">展开答案</button>
          <button class="toolbtn" id="btnHelp">快捷键</button>
        </div>
      </div>`;
    if (!qs.length) {
      $("#main").innerHTML = head + `<p style="color:var(--color-text-muted);padding:48px 0;text-align:center">本节没有待做题。按 H 显示全部。</p>`;
      return;
    }
    const cards = qs.map((q, i) => cardHtml(q, i, i === state.index)).join("");
    $("#main").innerHTML = head + cards + `
      <div class="float-nav">
        <button id="prevQ">↑</button>
        <div class="float-idx">${state.index + 1}</div>
        <button id="nextQ">↓</button>
      </div>`;
    leftoverTex($("#main"));
  }

  function sectionTitle() {
    if (DATA.kind === "exam") return DATA.title || "试卷";
    const s = (DATA.sections || []).find((x) => x.id === state.section);
    return s ? s.title : "练习";
  }

  function cardHtml(q, i, active) {
    const tm = typeMeta[q.type] || typeMeta.short;
    const dm = diffMeta[q.difficulty] || diffMeta.medium;
    const shown = state.show.has(q.id);
    const mastered = state.mastered.has(q.id);
    let opts = "";
    if (q.options && q.options.length) {
      opts = q.options.map((opt) => {
        const letter = String(opt).trim().charAt(0);
        const ok = shown && letter === q.answer;
        return `<div class="opt${ok ? " ok" : ""}">${renderMath(opt)}</div>`;
      }).join("");
    }
    let ans = "";
    if (shown) {
      ans = `<div class="ansbox">
        <div class="ans-label">答案
          ${q.type === "choice" ? `<span class="ans-pill">${esc(q.answer)}</span>` : ""}
          ${q.type === "fill" ? `<span style="color:var(--color-success);margin-left:8px">${renderMath(q.answer)}</span>` : ""}
        </div>
        ${q.type === "short" ? `<div style="padding:10px 14px;background:var(--color-surface-1);border:1px solid var(--color-border-faint);border-radius:8px;margin-bottom:8px">${renderMath(q.answer)}</div>` : ""}
        ${q.explanation ? `<div style="color:var(--color-text-muted);font-size:14px;line-height:1.8">${renderMath(q.explanation)}</div>` : ""}
      </div>`;
    }
    return `<div class="card${active ? " active" : ""}" id="question-${q.id}">
      <div class="tags">
        <span class="qid">${q.id}</span>
        <span class="tag" style="background:${tm.color}18;color:${tm.color}">${tm.label}</span>
        <span class="tag" style="background:${dm.bg};color:${dm.color}">${dm.label}</span>
        <span style="margin-left:auto;color:var(--color-text-faint);font-size:13px">#${i + 1}${mastered ? " · 已掌握" : ""}</span>
      </div>
      <div>${renderMath(q.stem)}</div>
      ${opts}
      <div class="toolbar">
        <button class="toolbtn ${shown ? "on" : ""}" data-toggle="${q.id}">${shown ? "收起答案" : "显示答案"} <kbd>Space</kbd></button>
        <button class="toolbtn ${mastered ? "on" : ""}" data-master="${q.id}">${mastered ? "已掌握" : "标记掌握"} <kbd>M</kbd></button>
      </div>
      ${ans}
    </div>`;
  }

  function paint() {
    renderSidebar();
    leftoverTex($("#sidebar"));
    if (state.mode === "content" && DATA.kind !== "exam") renderContent();
    else renderQuestions();
    bind();
  }

  function bind() {
    $$("[data-mode]").forEach((b) => b.onclick = () => { state.mode = b.dataset.mode; paint(); });
    $$("[data-sec]").forEach((b) => b.onclick = () => { state.section = b.dataset.sec; state.index = 0; state.show = new Set(); paint(); toast(b.textContent.trim()); });
    $$("[data-ft]").forEach((b) => b.onclick = () => { state.filterType = b.dataset.ft; state.index = 0; paint(); });
    $$("[data-qi]").forEach((b) => b.onclick = () => {
      state.index = +b.dataset.qi;
      paint();
      const qs = sectionQuestions();
      const el = document.getElementById("question-" + qs[state.index].id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    $$("[data-toggle]").forEach((b) => b.onclick = () => {
      const id = b.dataset.toggle;
      if (state.show.has(id)) state.show.delete(id); else state.show.add(id);
      paint();
    });
    $$("[data-master]").forEach((b) => b.onclick = () => {
      const id = b.dataset.master;
      if (state.mastered.has(id)) { state.mastered.delete(id); toast("取消掌握"); }
      else { state.mastered.add(id); toast("已标记掌握"); }
      saveMastered(state.mastered);
      paint();
    });
    const hide = $("#btnHide");
    if (hide) hide.onclick = () => { state.hide = !state.hide; state.index = 0; paint(); };
    const all = $("#btnAll");
    if (all) all.onclick = () => {
      const qs = sectionQuestions();
      if (state.show.size < qs.length) { qs.forEach((q) => state.show.add(q.id)); toast("展开所有答案"); }
      else { state.show = new Set(); toast("收起所有答案"); }
      paint();
    };
    const help = $("#btnHelp");
    if (help) help.onclick = () => $("#help").classList.add("show");
    const prev = $("#prevQ");
    const next = $("#nextQ");
    if (prev) prev.onclick = () => move(-1);
    if (next) next.onclick = () => move(1);
  }

  function move(d) {
    const qs = sectionQuestions();
    state.index = Math.max(0, Math.min(qs.length - 1, state.index + d));
    paint();
    const q = qs[state.index];
    if (q) {
      const el = document.getElementById("question-" + q.id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input,textarea")) return;
    const k = e.key.toLowerCase();
    if (k === "?") { e.preventDefault(); $("#help").classList.toggle("show"); return; }
    if (k === "escape") { $("#help").classList.remove("show"); return; }
    if (k === "tab" && DATA.kind !== "exam") {
      e.preventDefault();
      state.mode = state.mode === "content" ? "questions" : "content";
      paint();
      return;
    }
    if (state.mode !== "questions") return;
    if (DATA.kind !== "exam" && "1234".includes(k) && DATA.sections && DATA.sections[+k - 1]) {
      e.preventDefault();
      state.section = DATA.sections[+k - 1].id;
      state.index = 0;
      paint();
      return;
    }
    if (DATA.kind === "exam" && "0123".includes(k)) {
      e.preventDefault();
      state.filterType = { 0: "all", 1: "choice", 2: "fill", 3: "short" }[k];
      state.index = 0;
      paint();
      return;
    }
    if (k === "arrowup" || k === "k") { e.preventDefault(); move(-1); }
    if (k === "arrowdown" || k === "j") { e.preventDefault(); move(1); }
    if (k === " ") {
      e.preventDefault();
      const q = sectionQuestions()[state.index];
      if (!q) return;
      if (state.show.has(q.id)) state.show.delete(q.id); else state.show.add(q.id);
      paint();
    }
    if (k === "m") {
      e.preventDefault();
      const q = sectionQuestions()[state.index];
      if (!q) return;
      if (state.mastered.has(q.id)) state.mastered.delete(q.id); else state.mastered.add(q.id);
      saveMastered(state.mastered);
      paint();
    }
    if (k === "a") {
      e.preventDefault();
      const qs = sectionQuestions();
      if (state.show.size < qs.length) qs.forEach((q) => state.show.add(q.id));
      else state.show = new Set();
      paint();
    }
    if (k === "h") { e.preventDefault(); state.hide = !state.hide; state.index = 0; paint(); }
    if (k === "r" && !e.ctrlKey) {
      e.preventDefault();
      if (confirm("重置本页掌握进度？")) { state.mastered = new Set(); saveMastered(state.mastered); paint(); }
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    if (DATA.kind !== "exam") state.mode = "content";
    paint();
  });
})();
