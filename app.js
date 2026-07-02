/* =============================================================
   ETAD DELIVERY COMMAND — app.js
   Data-driven. Everything lives in one state object saved to
   localStorage, so adds / removes / edits / weights / completion /
   per-week focus all persist. The Week Rail computes the current
   ISO week live, so the focus advances on its own as time passes.
   ============================================================= */
(function () {
  "use strict";

  const STORE_KEY = "etad_state";
  const SCHEMA = 3;
  const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  /* ---------- tiny utils ---------- */
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  let _seq = 0;
  const uid = () => "k" + (Date.now().toString(36)) + (_seq++).toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

  /* ---------- ISO-week engine ---------- */
  function mondayOf(d) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const day = (x.getDay() + 6) % 7;          // Mon = 0
    x.setDate(x.getDate() - day);
    return x;
  }
  function isoWeek(d) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = (t.getUTCDay() + 6) % 7;
    t.setUTCDate(t.getUTCDate() - day + 3);     // Thursday
    const firstThu = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
    const fDay = (firstThu.getUTCDay() + 6) % 7;
    firstThu.setUTCDate(firstThu.getUTCDate() - fDay + 3);
    const wk = 1 + Math.round((t - firstThu) / (7 * 864e5));
    return { year: t.getUTCFullYear(), week: wk };
  }
  const weekKey = (d) => { const w = isoWeek(d); return `${w.year}-W${String(w.week).padStart(2, "0")}`; };
  const weekNo  = (d) => isoWeek(d).week;
  function fmtRange(monday) {
    const fri = new Date(monday); fri.setDate(monday.getDate() + 4);
    const d1 = monday.getDate(), d2 = fri.getDate(), y = fri.getFullYear();
    return monday.getMonth() === fri.getMonth()
      ? `${d1}\u2013${d2} ${MON[fri.getMonth()]} ${y}`
      : `${d1} ${MON[monday.getMonth()]}\u2013${d2} ${MON[fri.getMonth()]} ${y}`;
  }
  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  /* ---------- view state (not persisted) ---------- */
  let viewMonday = mondayOf(new Date());

  /* ---------- model ---------- */
  let state = null;

  function normTask(t) {
    if (typeof t === "string") return { id: uid(), text: t, weight: 1, done: false };
    return { id: uid(), text: t.t ?? t.text ?? "", weight: Number(t.w ?? t.weight ?? 1) || 1, done: !!t.done };
  }
  function normCard(c) {
    return {
      id: uid(),
      name: c.name, icon: c.icon || (c.name || "?").trim()[0].toUpperCase(),
      seedAccent: c.accent || "tbr", tbr: !!c.tbr, wide: !!c.wide,
      kpis: (c.kpis || []).slice(), desc: c.desc || "", deadline: c.deadline || "",
      meta: (c.meta || []).map(m => ({ label: m.label, value: m.value })),
      note: c.note || "",
      groups: (c.groups || []).map(g => ({ label: g.label, tasks: (g.tasks || []).map(normTask) }))
    };
  }
  function normalize(def) {
    return {
      schema: SCHEMA,
      meta: JSON.parse(JSON.stringify(def.meta)),
      quarterly: JSON.parse(JSON.stringify(def.quarterly)),
      weeks: {},
      sections: def.sections.map(s => ({
        eyebrow: s.eyebrow, title: s.title, layout: s.layout,
        cards: (s.cards || []).map(normCard),
        phases: (s.phases || []).map(p => ({
          title: p.title, when: p.when, accent: p.accent,
          cards: (p.cards || []).map(normCard)
        }))
      }))
    };
  }
  function seed() {
    const st = normalize(window.ETAD_DEFAULTS);
    st.weeks[weekKey(viewMonday)] = (window.ETAD_DEFAULTS.focusSeed || [])
      .map(t => ({ id: uid(), text: t, weight: 1, done: false }));
    return st;
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.schema !== SCHEMA) return null;
      return parsed;
    } catch { return null; }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
    catch { toast("Couldn't save \u2014 storage may be full or blocked"); }
  }

  /* ---------- lookups ---------- */
  function allCards() {
    const out = [];
    state.sections.forEach(s => {
      (s.cards || []).forEach(c => out.push(c));
      (s.phases || []).forEach(p => p.cards.forEach(c => out.push(c)));
    });
    return out;
  }
  const findCard = (id) => allCards().find(c => c.id === id);
  function findTask(cardId, taskId) {
    const c = findCard(cardId); if (!c) return null;
    for (const g of c.groups) { const t = g.tasks.find(t => t.id === taskId); if (t) return { card: c, group: g, task: t }; }
    return null;
  }
  function newCardObj() {
    return normCard({ name: "New initiative", icon: "\u2726", accent: "new", desc: "",
      meta: [], groups: [{ label: "Action items", tasks: [] }] });
  }
  function removeCardById(id) {
    state.sections.forEach(s => {
      if (s.cards) s.cards = s.cards.filter(c => c.id !== id);
      (s.phases || []).forEach(p => { p.cards = p.cards.filter(c => c.id !== id); });
    });
  }
  function gridFor(sec, ph) {
    let sel = `.grid[data-cardlist][data-sec="${sec}"]`;
    sel += (ph === undefined || ph === "") ? ":not([data-phase])" : `[data-phase="${ph}"]`;
    return document.querySelector(sel);
  }

  /* ---------- progress ---------- */
  function cardProgress(card) {
    let total = 0, done = 0, count = 0, dcount = 0;
    card.groups.forEach(g => g.tasks.forEach(t => {
      const w = Number(t.weight) || 0; total += w; count++;
      if (t.done) { done += w; dcount++; }
    }));
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { pct, total, done, count, dcount };
  }
  function groupProgress(group) {
    let total = 0, done = 0;
    group.tasks.forEach(t => { const w = Number(t.weight) || 0; total += w; if (t.done) done += w; });
    return total ? Math.round((done / total) * 100) : 0;
  }
  function statusFor(card) {
    if (card.tbr) return { key: "tbr", label: "TBR" };
    const { pct, count } = cardProgress(card);
    if (count === 0 || pct === 0) return { key: "new",  label: "Not started", pct };
    if (pct < 30)  return { key: "crit", label: "Critical",    pct };
    if (pct < 60)  return { key: "high", label: "Behind",      pct };
    if (pct < 80)  return { key: "prog", label: "In progress", pct };
    if (pct < 100) return { key: "done", label: "On track",    pct };
    return { key: "done", label: "Complete", pct };
  }
  const atRisk = (card) => !card.tbr && card.deadline && cardProgress(card).pct < 50;

  /* ---------- focus (per week) ---------- */
  const focusList = (key) => (state.weeks[key] || []);
  function ensureWeek(key) { if (!state.weeks[key]) state.weeks[key] = []; return state.weeks[key]; }
  function focusProgress(key) {
    const list = focusList(key);
    let total = 0, done = 0;
    list.forEach(f => { const w = Number(f.weight) || 0; total += w; if (f.done) done += w; });
    return { pct: total ? Math.round((done / total) * 100) : 0, total: list.length, done: list.filter(f => f.done).length };
  }

  /* =========================================================
     RENDER
     ========================================================= */
  const CHK = `<svg viewBox="0 0 24 24" fill="none" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 6"/></svg>`;
  const RISK = `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l1.9 4.7L15 6l-3.8 3.3L12.4 15 8 11.9 3.6 15l1.2-5.7L1 6l5.1-.3L8 1z"/></svg>`;
  const CHEV = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`;
  const GRIP = `<svg viewBox="0 0 16 16" fill="currentColor"><circle cx="5" cy="3" r="1.45"/><circle cx="11" cy="3" r="1.45"/><circle cx="5" cy="8" r="1.45"/><circle cx="11" cy="8" r="1.45"/><circle cx="5" cy="13" r="1.45"/><circle cx="11" cy="13" r="1.45"/></svg>`;
  const TRASH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>`;
  const LINKI = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 15l6-6M10.5 6.5l1-1a4 4 0 015.7 5.7l-1 1M13.5 17.5l-1 1a4 4 0 01-5.7-5.7l1-1"/></svg>`;

  function weightChip(w, kind, id) {
    return `<span class="weight" title="Weight \u2014 how much this item counts toward progress">
      <span class="wlab">w</span><input type="number" min="1" max="99" step="1" value="${esc(w)}" data-act="weight" data-kind="${kind}" data-id="${esc(id)}" aria-label="Weight"></span>`;
  }

  function renderMastTools() {
    $("#mast-tools").innerHTML = `
      <button class="tbtn" data-act="export" title="Download a backup of all your data">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"/></svg>Export</button>
      <button class="tbtn" data-act="import" title="Restore from a backup file">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21V9m0 0L8 13m4-4l4 4M5 3h14"/></svg>Import</button>
      <button class="tbtn" data-act="print" title="Print or save as PDF">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V3h12v6M6 18H4v-6h16v6h-2M8 14h8v7H8z"/></svg>Print</button>
      <button class="tbtn" data-act="reset" title="Wipe everything and start from the seed data">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 109-9 9 9 0 00-7 3.3M3 4v4h4"/></svg>Reset</button>`;
  }

  function renderKpis() {
    $("#kpi-strip").innerHTML = state.meta.kpis
      .map(k => `<div class="kpi"><span class="kn">${esc(k.n)}</span><span class="kl">${esc(k.l)}</span></div>`).join("");
  }

  /* ---- Week Rail ---- */
  function renderRail() {
    const key = weekKey(viewMonday);
    ensureWeek(key);
    const isNow = sameDay(viewMonday, mondayOf(new Date()));
    const fp = focusProgress(key);
    const list = focusList(key);

    const items = list.length
      ? list.map(f => `
        <div class="focus-item${f.done ? " is-done" : ""}" data-focus-id="${esc(f.id)}" draggable="true">
          <button class="check" data-act="focus-toggle" data-id="${esc(f.id)}" aria-label="Toggle done">${CHK}</button>
          <span class="ftext" contenteditable="true" data-act="focus-edit" data-id="${esc(f.id)}">${esc(f.text)}</span>
          ${f.cardId ? `<span class="focus-tag" title="Linked to an initiative below">${LINKI}</span>` : ""}
          ${weightChip(f.weight, "focus", f.id)}
          <button class="row-del" data-act="focus-del" data-id="${esc(f.id)}" aria-label="Delete">\u2715</button>
          <span class="drag-handle" aria-hidden="true">\u22ee\u22ee</span>
        </div>`).join("")
      : `<div class="focus-empty">
           <span>No focus set for this week yet.</span>
           ${prevHasUnfinished() ? `<button class="linkish" data-act="carry">Carry over ${prevUnfinishedCount()} unfinished from last week</button>` : ``}
         </div>`;

    $("#rail").innerHTML = `
      <div class="rail-head">
        <div class="wk-nav">
          <button class="wk-arrow" data-act="wk-prev" aria-label="Previous week">\u2039</button>
          <div class="wk-id">
            <div class="wk-no mono">WK ${weekNo(viewMonday)}</div>
            <div class="wk-range">${fmtRange(viewMonday)}</div>
          </div>
          <button class="wk-arrow" data-act="wk-next" aria-label="Next week">\u203a</button>
        </div>
        ${isNow
          ? `<span class="wk-live"><span class="dot"></span>This week</span>`
          : `<button class="wk-today" data-act="wk-today">Jump to this week</button>`}
        <div class="rail-meter">
          <span class="lab">Focus done</span>
          <span class="track"><span class="fill" style="width:${fp.pct}%"></span></span>
          <span class="pct mono">${fp.pct}%</span>
        </div>
      </div>
      <div class="rail-body">
        <div class="ftitle"><span class="spark">\u25c8</span> Focus for this week
          <span style="font-weight:500;color:var(--text-dim);text-transform:none;letter-spacing:0">\u00b7 ${fp.done}/${fp.total} complete</span>
        </div>
        <div class="focus-grid" data-droplist="focus">${items}</div>
        <button class="add-focus" data-act="focus-add">+ Add focus item</button>
      </div>`;
  }
  function prevWeekKey() { const m = new Date(viewMonday); m.setDate(m.getDate() - 7); return weekKey(m); }
  function prevHasUnfinished() { return focusList(prevWeekKey()).some(f => !f.done); }
  function prevUnfinishedCount() { return focusList(prevWeekKey()).filter(f => !f.done).length; }

  /* ---- Overview ---- */
  function renderOverview() {
    const cards = allCards();
    const counts = { crit: 0, high: 0, prog: 0, new: 0, done: 0, tbr: 0 };
    let tW = 0, dW = 0;
    cards.forEach(c => {
      const s = statusFor(c); counts[s.key]++;
      if (!c.tbr) { const p = cardProgress(c); tW += p.total; dW += p.done; }
    });
    const overall = tW ? Math.round((dW / tW) * 100) : 0;
    const active = cards.length - counts.tbr;
    const order = [["crit","Critical"],["high","Behind"],["prog","In progress"],["new","Not started"],["done","On track"],["tbr","TBR"]];
    const segs = order.filter(([k]) => counts[k] > 0)
      .map(([k]) => `<span class="ov-seg ${k}" style="flex:${counts[k]}"></span>`).join("");
    const legend = order.map(([k, lbl]) =>
      `<span class="ov-key"><span class="swatch" style="background:var(--${k})"></span>${lbl} <span class="cnt mono">${counts[k]}</span></span>`).join("");

    $("#overview").innerHTML = `
      <div class="ov-num"><span class="big mono">${overall}%</span>
        <span class="lab">Overall weighted completion \u00b7 ${active} active initiatives</span></div>
      <div class="ov-bar">${segs}</div>
      <div class="ov-legend">${legend}</div>`;
  }

  /* ---- Cards ---- */
  function taskRow(card, group, gi, t) {
    return `<li class="etask${t.done ? " is-done" : ""}" data-task-id="${esc(t.id)}" draggable="true">
      <button class="check" data-act="task-toggle" data-card="${esc(card.id)}" data-id="${esc(t.id)}" aria-label="Toggle done">${CHK}</button>
      <span class="etext" contenteditable="true" data-act="task-edit" data-card="${esc(card.id)}" data-id="${esc(t.id)}">${esc(t.text)}</span>
      ${weightChip(t.weight, "task", t.id)}
      <button class="row-del" data-act="task-del" data-card="${esc(card.id)}" data-id="${esc(t.id)}" aria-label="Delete">\u2715</button>
      <span class="drag-handle" aria-hidden="true">\u22ee\u22ee</span>
    </li>`;
  }
  function groupsHTML(card) {
    return card.groups.map((g, gi) => `
      <div class="group">
        <div class="group-label"><span>${esc(g.label)}</span><span class="group-prog mono">${groupProgress(g)}%</span></div>
        <ul class="etasks" data-droplist="task" data-card="${esc(card.id)}" data-group="${gi}">
          ${g.tasks.map(t => taskRow(card, g, gi, t)).join("")}
        </ul>
        <button class="add-task" data-act="task-add" data-card="${esc(card.id)}" data-group="${gi}">+ Add task</button>
      </div>`).join("");
  }
  function cardHTML(card) {
    const s = statusFor(card);
    const accent = card.tbr ? "tbr" : s.key;
    const p = cardProgress(card);
    const risk = atRisk(card);
    const metaHTML = card.meta.length
      ? `<div class="meta-row">${card.meta.map(m => `<div class="meta-cell"><div class="ml">${esc(m.label)}</div><div class="mv">${esc(m.value)}</div></div>`).join("")}</div>` : "";

    return `<div class="card${card.wide ? " wide" : ""}${risk ? " lag" : ""}" data-card-id="${esc(card.id)}" data-accent="${accent}">
      <div class="card-head" data-act="card-toggle">
        <span class="card-grip" draggable="true" title="Drag to reorder" aria-label="Drag to reorder">${GRIP}</span>
        <div class="card-icon" contenteditable="true" data-act="card-icon" data-card="${esc(card.id)}" title="Edit badge">${esc(card.icon)}</div>
        <div class="card-mid">
          <div class="card-name" contenteditable="true" data-act="card-name" data-card="${esc(card.id)}">${esc(card.name)}</div>
          <div class="card-tags">
            <span class="status-tag" data-s="${accent}">${esc(s.label)}</span>
            ${card.kpis.map(k => `<span class="kpi-pill">${esc(k)}</span>`).join("")}
          </div>
        </div>
        ${card.tbr ? "" : `<div class="card-pct mono">${p.pct}%</div>`}
        <span class="card-chevron">${CHEV}</span>
        <button class="card-del" data-act="card-del" data-card="${esc(card.id)}" title="Delete initiative" aria-label="Delete initiative">${TRASH}</button>
      </div>
      ${card.tbr ? "" : `<div class="card-meter"><div class="meter-track"><div class="meter-fill" data-s="${accent}" style="width:${p.pct}%"></div></div></div>`}
      <div class="card-desc" contenteditable="true" data-act="card-desc" data-card="${esc(card.id)}" data-ph="Add a description\u2026">${esc(card.desc)}</div>
      ${risk ? `<div class="lag-flag">${RISK} At risk \u2014 ${p.pct}% complete</div>` : ""}
      ${card.tbr ? "" : `<div class="card-deadline"><span class="dl-tag">Deadline</span><span class="dl-val" contenteditable="true" data-act="card-deadline" data-card="${esc(card.id)}" data-ph="Set a deadline\u2026">${esc(card.deadline)}</span></div>`}
      <div class="card-foot">
        <span class="tasks-mini">${card.tbr ? "Dormant" : `${p.dcount}/${p.count} tasks`}</span>
        <span class="foot-right">
          ${card.tbr ? "" : `<button class="focus-link" data-act="focus-link" data-card="${esc(card.id)}" title="Add or remove this initiative in the focus list of the week shown at the top">${LINKI} Focus week</button>`}
          <span class="expand-hint">Details</span>
        </span>
      </div>
      <div class="detail"><div class="detail-inner">
        ${metaHTML}
        <div class="groups-wrap">${groupsHTML(card)}</div>
        ${card.note ? `<div class="note">${esc(card.note)}</div>` : ""}
      </div></div>
    </div>`;
  }
  function sectionHTML(sec, si) {
    let inner = "";
    if (sec.layout === "cards") {
      inner = `<div class="grid" data-cardlist data-sec="${si}">${sec.cards.map(cardHTML).join("")}</div>
        <button class="add-initiative" data-act="card-add" data-sec="${si}">+ Add initiative</button>`;
    } else {
      inner = sec.phases.map((p, pi) => `
        <div class="phase">
          <div class="phase-head">
            <span class="phase-dot" style="background:var(--${p.accent})"></span>
            <span class="phase-name" contenteditable="true" data-act="phase-name" data-sec="${si}" data-phase="${pi}">${esc(p.title)}</span>
            <span class="phase-when" contenteditable="true" data-act="phase-when" data-sec="${si}" data-phase="${pi}" data-ph="Add timing\u2026">${esc(p.when)}</span>
          </div>
          <div class="grid" data-cardlist data-sec="${si}" data-phase="${pi}">${p.cards.map(cardHTML).join("")}</div>
          <button class="add-initiative" data-act="card-add" data-sec="${si}" data-phase="${pi}">+ Add initiative</button>
        </div>`).join("");
    }
    return `<section class="section">
      <div class="sec-head"><span class="sec-eyebrow">${esc(sec.eyebrow)}</span>
        <span class="sec-title">${esc(sec.title)}</span><span class="sec-rule"></span></div>
      ${inner}
    </section>`;
  }
  function renderSections() {
    $("#sections").innerHTML = state.sections.map((s, i) => sectionHTML(s, i)).join("");
  }

  /* ---- Quarterly + footer ---- */
  function renderQuarterly() {
    $("#quarterly").innerHTML = `
      <div class="q-head"><span class="phase-dot"></span><span class="phase-name">Quarterly horizon \u2014 the road to 100%</span></div>
      <div class="q-grid">${state.quarterly.map(q => `
        <div class="q-card ${q.tone}">
          <div class="q-tag">${esc(q.tag)}</div>
          <div class="q-pct mono">${esc(q.pct)}%</div>
          <div class="q-note">${esc(q.note)}</div>
        </div>`).join("")}</div>`;
  }
  function renderFoot() {
    $("#foot").innerHTML = `
      <div class="glossary">${esc(state.meta.glossary)}</div>
      <div>ETAD \u00b7 Emerging Technologies Adoption Department \u00b7 MCMC \u00b7 ${esc(state.meta.updated)}</div>
      <div style="margin-top:4px;color:var(--text-dim)">Click a card to expand \u00b7 edit any text inline \u00b7 drag \u22ee\u22ee to reorder tasks \u00b7 drag the \u2059 grip to reorder cards \u00b7 add or remove initiatives and tasks \u00b7 changes save automatically</div>`;
  }

  function renderAll() {
    renderMastTools(); renderKpis(); renderRail(); renderOverview();
    renderSections(); renderQuarterly(); renderFoot();
  }

  /* ---------- targeted refreshers (keep edit focus) ---------- */
  function refreshCard(cardEl, card) {
    const s = statusFor(card), accent = card.tbr ? "tbr" : s.key, p = cardProgress(card);
    cardEl.dataset.accent = accent;
    cardEl.classList.toggle("lag", atRisk(card));
    const tag = $(".status-tag", cardEl); if (tag) { tag.dataset.s = accent; tag.textContent = s.label; }
    const pct = $(".card-pct", cardEl); if (pct) pct.textContent = p.pct + "%";
    const fill = $(".meter-fill", cardEl); if (fill) { fill.dataset.s = accent; fill.style.width = p.pct + "%"; }
    const mini = $(".tasks-mini", cardEl); if (mini && !card.tbr) mini.textContent = `${p.dcount}/${p.count} tasks`;
    // group %s
    $$(".group", cardEl).forEach((gEl, gi) => {
      const gp = $(".group-prog", gEl); if (gp && card.groups[gi]) gp.textContent = groupProgress(card.groups[gi]) + "%";
    });
    // lag flag presence
    let flag = $(".lag-flag", cardEl);
    const wantFlag = atRisk(card);
    if (wantFlag && !flag) {
      const html = `<div class="lag-flag">${RISK} At risk \u2014 ${p.pct}% complete</div>`;
      const anchor = $(".card-desc", cardEl) || $(".card-meter", cardEl);
      anchor.insertAdjacentHTML("afterend", html);
    } else if (wantFlag && flag) {
      flag.innerHTML = `${RISK} At risk \u2014 ${p.pct}% complete`;
    } else if (!wantFlag && flag) { flag.remove(); }
  }
  function refreshGroups(cardEl, card) {
    $(".groups-wrap", cardEl).innerHTML = groupsHTML(card);
  }
  function refreshRailMeter() {
    const fp = focusProgress(weekKey(viewMonday));
    const fill = $("#rail .rail-meter .fill"); if (fill) fill.style.width = fp.pct + "%";
    const pct = $("#rail .rail-meter .pct"); if (pct) pct.textContent = fp.pct + "%";
    const cap = $("#rail .ftitle span:last-child"); if (cap) cap.textContent = `\u00b7 ${fp.done}/${fp.total} complete`;
  }

  /* =========================================================
     EVENTS
     ========================================================= */
  function onClick(e) {
    const t = e.target.closest("[data-act]");
    if (!t) return;
    const act = t.dataset.act;

    /* card expand */
    if (act === "card-toggle") {
      if (e.target.closest(".check,.weight,.row-del,.card-grip,.card-del,[contenteditable]")) return;
      t.closest(".card").classList.toggle("open"); return;
    }

    /* toolbar */
    if (act === "print")  { window.print(); return; }
    if (act === "export") { exportState(); return; }
    if (act === "import") { $("#file-import").click(); return; }
    if (act === "reset")  { resetAll(); return; }

    /* week nav */
    if (act === "wk-prev")  { viewMonday.setDate(viewMonday.getDate() - 7); renderRail(); return; }
    if (act === "wk-next")  { viewMonday.setDate(viewMonday.getDate() + 7); renderRail(); return; }
    if (act === "wk-today") { viewMonday = mondayOf(new Date()); renderRail(); return; }
    if (act === "carry")    { carryOver(); return; }

    /* focus ops */
    if (act === "focus-add") {
      const list = ensureWeek(weekKey(viewMonday));
      list.push({ id: uid(), text: "New focus item", weight: 1, done: false });
      save(); renderRail();
      const last = $("#rail .focus-grid .focus-item:last-child .ftext");
      if (last) { focusCaret(last); }
      return;
    }
    if (act === "focus-toggle") {
      const f = focusList(weekKey(viewMonday)).find(f => f.id === t.dataset.id);
      if (f) { f.done = !f.done; save();
        const row = t.closest(".focus-item"); row.classList.toggle("is-done", f.done);
        refreshRailMeter(); }
      return;
    }
    if (act === "focus-del") {
      const key = weekKey(viewMonday);
      if (!confirm("Delete this focus item?")) return;
      state.weeks[key] = focusList(key).filter(f => f.id !== t.dataset.id);
      save(); renderRail(); return;
    }

    /* task ops */
    if (act === "task-add") {
      const card = findCard(t.dataset.card); const gi = +t.dataset.group;
      card.groups[gi].tasks.push({ id: uid(), text: "New task", weight: 1, done: false });
      save();
      const cardEl = t.closest(".card"); refreshGroups(cardEl, card); refreshCard(cardEl, card);
      const last = cardEl.querySelectorAll(".group")[gi].querySelector(".etask:last-child .etext");
      if (last) focusCaret(last);
      return;
    }
    if (act === "task-toggle") {
      const r = findTask(t.dataset.card, t.dataset.id);
      if (r) { r.task.done = !r.task.done; save();
        const cardEl = t.closest(".card"); t.closest(".etask").classList.toggle("is-done", r.task.done);
        refreshCard(cardEl, r.card); }
      return;
    }
    if (act === "task-del") {
      if (!confirm("Delete this task?")) return;
      const card = findCard(t.dataset.card);
      card.groups.forEach(g => { g.tasks = g.tasks.filter(x => x.id !== t.dataset.id); });
      save();
      const cardEl = t.closest(".card"); refreshGroups(cardEl, card); refreshCard(cardEl, card);
      return;
    }

    /* link a card to the shown week's focus */
    if (act === "focus-link") {
      const card = findCard(t.dataset.card);
      const key = weekKey(viewMonday);
      const list = ensureWeek(key);
      if (list.some(f => f.cardId === card.id)) {
        state.weeks[key] = list.filter(f => f.cardId !== card.id);
        save(); renderRail();
        toast(`Removed from WK ${weekNo(viewMonday)} focus`);
      } else {
        const text = card.name + (card.deadline ? ` \u2014 due ${card.deadline}` : "");
        list.push({ id: uid(), text, weight: 1, done: false, cardId: card.id });
        save(); renderRail();
        toast(`Linked to WK ${weekNo(viewMonday)} focus`);
      }
      return;
    }

    /* card add / delete */
    if (act === "card-add") {
      const sec = +t.dataset.sec, ph = t.dataset.phase;
      const card = newCardObj();
      if (ph === undefined || ph === "") state.sections[sec].cards.push(card);
      else state.sections[sec].phases[+ph].cards.push(card);
      save();
      const grid = gridFor(sec, ph);
      grid.insertAdjacentHTML("beforeend", cardHTML(card));
      renderOverview();
      const el = grid.querySelector(`.card[data-card-id="${card.id}"]`);
      if (el) {
        el.classList.add("open");
        const nm = $(".card-name", el); if (nm) focusCaret(nm);
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      toast("Initiative added \u2014 rename it and add tasks");
      return;
    }
    if (act === "card-del") {
      if (!confirm("Delete this entire initiative and all of its tasks?")) return;
      if (!confirm("This cannot be undone. Continue?")) return;
      removeCardById(t.dataset.card);
      save();
      const el = t.closest(".card"); if (el) el.remove();
      renderOverview();
      toast("Initiative deleted");
      return;
    }
  }

  /* inline text edit (no re-render -> caret preserved) */
  function onInput(e) {
    const t = e.target.closest("[data-act]");
    if (!t) return;
    if (t.dataset.act === "focus-edit") {
      const f = focusList(weekKey(viewMonday)).find(f => f.id === t.dataset.id);
      if (f) { f.text = t.textContent; debouncedSave(); }
    } else if (t.dataset.act === "task-edit") {
      const r = findTask(t.dataset.card, t.dataset.id);
      if (r) { r.task.text = t.textContent; debouncedSave(); }
    } else if (t.dataset.act === "card-name") {
      const c = findCard(t.dataset.card); if (c) { c.name = t.textContent; debouncedSave(); }
    } else if (t.dataset.act === "card-desc") {
      const c = findCard(t.dataset.card); if (c) { c.desc = t.textContent; debouncedSave(); }
    } else if (t.dataset.act === "card-icon") {
      const c = findCard(t.dataset.card); if (c) { c.icon = [...t.textContent.trim()].slice(0, 2).join(""); debouncedSave(); }
    } else if (t.dataset.act === "card-deadline") {
      const c = findCard(t.dataset.card);
      if (c) { c.deadline = t.textContent.trim(); const cardEl = t.closest(".card"); if (cardEl) refreshCard(cardEl, c); debouncedSave(); }
    } else if (t.dataset.act === "phase-name") {
      const s = state.sections[+t.dataset.sec], p = s && s.phases[+t.dataset.phase];
      if (p) { p.title = t.textContent; debouncedSave(); }
    } else if (t.dataset.act === "phase-when") {
      const s = state.sections[+t.dataset.sec], p = s && s.phases[+t.dataset.phase];
      if (p) { p.when = t.textContent; debouncedSave(); }
    } else if (t.dataset.act === "weight") {
      handleWeight(t);
    }
  }
  function handleWeight(input) {
    let v = clamp(parseInt(input.value, 10) || 1, 1, 99);
    if (input.dataset.kind === "focus") {
      const f = focusList(weekKey(viewMonday)).find(f => f.id === input.dataset.id);
      if (f) { f.weight = v; save(); refreshRailMeter(); }
    } else {
      const cardEl = input.closest(".card"); const card = findCard(cardEl.dataset.cardId);
      let task = null; card.groups.forEach(g => { const x = g.tasks.find(x => x.id === input.dataset.id); if (x) task = x; });
      if (task) { task.weight = v; save(); refreshCard(cardEl, card); }
    }
  }
  function onChange(e) {
    if (e.target.matches('input[data-act="weight"]')) {
      e.target.value = clamp(parseInt(e.target.value, 10) || 1, 1, 99);
    }
  }

  /* Enter commits an editable line (and adds sibling for focus/task) */
  function onKeydown(e) {
    const ed = e.target.closest('[contenteditable][data-act]');
    if (!ed) return;
    if (e.key === "Enter") { e.preventDefault(); ed.blur(); }
  }

  let _saveT = null;
  function debouncedSave() { clearTimeout(_saveT); _saveT = setTimeout(save, 350); }

  function focusCaret(el) {
    el.focus();
    const r = document.createRange(); r.selectNodeContents(el); r.collapse(false);
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
  }

  /* ---------- drag & drop reorder ---------- */
  let dragEl = null, dragMode = null, dragGrid = null;
  function onDragStart(e) {
    const grip = e.target.closest(".card-grip");
    if (grip) {
      dragMode = "card"; dragEl = grip.closest(".card"); dragGrid = dragEl.closest("[data-cardlist]");
      dragEl.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      try { e.dataTransfer.setData("text/plain", ""); e.dataTransfer.setDragImage(dragEl, 24, 18); } catch {}
      return;
    }
    const row = e.target.closest(".etask,.focus-item");
    if (row) {
      dragMode = "row"; dragEl = row; row.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      try { e.dataTransfer.setData("text/plain", ""); } catch {}
    }
  }
  function onDragOver(e) {
    if (!dragEl) return;
    if (dragMode === "card") {
      if (!dragGrid || e.target.closest("[data-cardlist]") !== dragGrid) return;  // reorder within same grid
      e.preventDefault();
      const ref = gridAfter(dragGrid, e.clientX, e.clientY);
      if (ref == null) dragGrid.appendChild(dragEl);
      else if (ref !== dragEl) dragGrid.insertBefore(dragEl, ref);
      return;
    }
    const list = e.target.closest("[data-droplist]");
    if (!list || !list.contains(dragEl)) return;
    e.preventDefault();
    const after = afterElement(list, e.clientY);
    if (after == null) list.appendChild(dragEl);
    else list.insertBefore(dragEl, after);
  }
  function onDrop(e) { if (!dragEl) return; e.preventDefault(); finishDrag(); }
  function onDragEnd() { finishDrag(); }
  function finishDrag() {
    if (!dragEl) return;
    dragEl.classList.remove("dragging");
    if (dragMode === "card" && dragGrid) commitCardOrder(dragGrid);
    else { const list = dragEl.closest("[data-droplist]"); if (list) commitOrder(list); }
    dragEl = null; dragMode = null; dragGrid = null;
  }
  function afterElement(list, y) {
    const items = [...list.querySelectorAll("[draggable]:not(.dragging)")];
    return items.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      return (offset < 0 && offset > closest.offset) ? { offset, element: child } : closest;
    }, { offset: -Infinity }).element || null;
  }
  function gridAfter(grid, x, y) {
    const cards = [...grid.querySelectorAll(".card:not(.dragging)")];
    let best = null, bestD = Infinity, before = true;
    for (const c of cards) {
      const b = c.getBoundingClientRect();
      const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      const d = Math.hypot(x - cx, y - cy);
      if (d < bestD) { bestD = d; best = c; before = (y < cy - 4) || (Math.abs(y - cy) <= b.height / 2 && x < cx); }
    }
    if (!best) return null;
    return before ? best : best.nextElementSibling;
  }
  function commitCardOrder(grid) {
    const sec = +grid.dataset.sec, ph = grid.dataset.phase;
    const arr = (ph === undefined || ph === "") ? state.sections[sec].cards : state.sections[sec].phases[+ph].cards;
    const ids = [...grid.querySelectorAll(".card")].map(el => el.dataset.cardId);
    const map = new Map(arr.map(c => [c.id, c]));
    const next = ids.map(id => map.get(id)).filter(Boolean);
    if (ph === undefined || ph === "") state.sections[sec].cards = next;
    else state.sections[sec].phases[+ph].cards = next;
    save(); renderOverview();
  }
  function commitOrder(list) {
    if (list.dataset.droplist === "focus") {
      const ids = [...list.querySelectorAll(".focus-item")].map(el => el.dataset.focusId);
      const key = weekKey(viewMonday); const cur = focusList(key);
      state.weeks[key] = ids.map(id => cur.find(f => f.id === id)).filter(Boolean);
      save();
    } else {
      const card = findCard(list.dataset.card); const gi = +list.dataset.group;
      const ids = [...list.querySelectorAll(".etask")].map(el => el.dataset.taskId);
      const cur = card.groups[gi].tasks;
      card.groups[gi].tasks = ids.map(id => cur.find(x => x.id === id)).filter(Boolean);
      save();
    }
  }

  /* ---------- carry over ---------- */
  function carryOver() {
    const prev = focusList(prevWeekKey()).filter(f => !f.done);
    const key = weekKey(viewMonday); const list = ensureWeek(key);
    prev.forEach(f => list.push({ id: uid(), text: f.text, weight: f.weight, done: false, cardId: f.cardId }));
    save(); renderRail();
    toast(`Carried over ${prev.length} item${prev.length === 1 ? "" : "s"}`);
  }

  /* ---------- toolbar actions ---------- */
  function resetAll() {
    if (!confirm("Reset everything to the seed data? Your edits, added tasks and weekly focus will be erased.")) return;
    if (!confirm("This cannot be undone. Continue?")) return;
    localStorage.removeItem(STORE_KEY);
    viewMonday = mondayOf(new Date());
    state = seed(); save(); renderAll();
    toast("Reset to seed data");
  }
  function exportState() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `etad-delivery-${weekKey(new Date())}.json`;
    a.click(); URL.revokeObjectURL(a.href);
    toast("Backup downloaded");
  }
  function importState(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result);
        if (!obj || !Array.isArray(obj.sections) || typeof obj.weeks !== "object") throw new Error("bad");
        obj.schema = SCHEMA;
        state = obj; save(); renderAll();
        toast("Backup restored");
      } catch { toast("That file couldn't be read as an ETAD backup"); }
    };
    reader.readAsText(file);
  }

  /* ---------- toast ---------- */
  let _toastT = null;
  function toast(msg) {
    const el = $("#toast"); el.querySelector(".msg").textContent = msg;
    el.classList.add("show"); clearTimeout(_toastT);
    _toastT = setTimeout(() => el.classList.remove("show"), 2600);
  }

  /* ---------- init ---------- */
  function init() {
    state = load();
    if (!state) state = seed();
    save();
    renderAll();

    document.addEventListener("click", onClick);
    document.addEventListener("input", onInput);
    document.addEventListener("change", onChange);
    document.addEventListener("keydown", onKeydown);
    document.addEventListener("dragstart", onDragStart);
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("drop", onDrop);
    document.addEventListener("dragend", onDragEnd);
    $("#file-import").addEventListener("change", function () {
      if (this.files && this.files[0]) importState(this.files[0]);
      this.value = "";
    });

    // If the real-world week rolls over while the page is open, refresh the rail.
    setInterval(() => {
      if (sameDay(viewMonday, mondayOf(new Date()))) return;     // user is browsing another week
    }, 60000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
