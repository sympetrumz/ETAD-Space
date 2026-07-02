/* =============================================================
   ETAD DELIVERY COMMAND — background.js
   An ambient "network mesh": drifting nodes linked by proximity,
   reacting to the cursor. Sits behind all content (pointer-events
   are off, so it never blocks clicks). Honours reduced-motion,
   pauses when the tab is hidden, and recolours for light/dark.
   ============================================================= */
(function () {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let W = 0, H = 0, DPR = 1, nodes = [], raf = null;
  const mouse = { x: -9999, y: -9999, active: false };
  const LINK = 138, MLINK = 180;     // link distances (px)
  const TAU = Math.PI * 2;

  const isDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
  function palette() {
    return isDark()
      ? { dot: "120,205,194", line: "120,190,205", cue: "230,176,60" }   // teal nodes, gold cursor
      : { dot: "18,120,110",  line: "44,110,135",  cue: "200,148,30" };
  }
  let C = palette();

  function build() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    const count = Math.round(Math.min(96, Math.max(26, (W * H) / 15000)));
    nodes = [];
    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.26,
        vy: (Math.random() - 0.5) * 0.26,
        r: Math.random() * 1.5 + 0.7
      });
    }
  }

  function draw(animate) {
    C = palette();
    ctx.clearRect(0, 0, W, H);

    if (animate) {
      for (const p of nodes) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -25) p.x = W + 25; else if (p.x > W + 25) p.x = -25;
        if (p.y < -25) p.y = H + 25; else if (p.y > H + 25) p.y = -25;
        if (mouse.active) {                       // gentle pull toward the cursor
          const dx = mouse.x - p.x, dy = mouse.y - p.y, d = Math.hypot(dx, dy);
          if (d > 0.1 && d < MLINK) { p.vx += (dx / d) * 0.006; p.vy += (dy / d) * 0.006; }
        }
        p.vx = Math.max(-0.6, Math.min(0.6, p.vx * 0.994));
        p.vy = Math.max(-0.6, Math.min(0.6, p.vy * 0.994));
      }
    }

    // proximity links
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < LINK) {
          ctx.strokeStyle = `rgba(${C.line},${(1 - d / LINK) * 0.18})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      if (mouse.active) {                          // links to the cursor
        const dx = a.x - mouse.x, dy = a.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < MLINK) {
          ctx.strokeStyle = `rgba(${C.cue},${(1 - d / MLINK) * 0.55})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
      ctx.fillStyle = `rgba(${C.dot},0.55)`;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, TAU); ctx.fill();
    }

    if (mouse.active) {                            // the cursor node
      ctx.fillStyle = `rgba(${C.cue},0.95)`;
      ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 2.6, 0, TAU); ctx.fill();
    }

    if (animate) raf = requestAnimationFrame(() => draw(true));
  }

  function start() {
    if (raf) cancelAnimationFrame(raf);
    if (reduce) { draw(false); return; }
    raf = requestAnimationFrame(() => draw(true));
  }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = null; }

  let rt = null;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => { build(); if (reduce) draw(false); }, 150);
  });
  window.addEventListener("mousemove", e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; });
  window.addEventListener("mouseout",  () => { mouse.active = false; mouse.x = mouse.y = -9999; });
  window.addEventListener("blur",      () => { mouse.active = false; });
  window.addEventListener("touchmove", e => {
    if (e.touches[0]) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; mouse.active = true; }
  }, { passive: true });
  window.addEventListener("touchend", () => { mouse.active = false; });
  document.addEventListener("visibilitychange", () => { document.hidden ? stop() : start(); });

  build();
  start();
})();
