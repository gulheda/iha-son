/* =============================================================================
   main.js — the engine behind Find Your Sunshine
   -----------------------------------------------------------------------------
   Responsibilities:
     • Move the torch (light) with the pointer / finger
     • Light up whispers & memory orbs when the light passes over them
     • Open memories, track discovery progress, lift the ambient light
     • Nudge the visitor with a hint after inactivity
     • Run the finale sequence: sunrise → rose → letter → birthday
     • Handle the letter modal (focus trap, ESC, backdrop close)
     • Easter eggs, replay, reduced-motion fallbacks
   Everything degrades gracefully — missing photos, no audio, reduced motion.
   ========================================================================== */

(function () {
  "use strict";

  const { CONFIG, memories, whispers, LETTER, Sound } = window.SUNSHINE;

  const prefersReduced =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------- Shortcuts */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const body = document.body;

  const el = {
    torch:        $("#torch"),
    soundToggle:  $("#soundToggle"),
    introLine:    $("#introLine"),
    introHint:    $("#introHint"),
    field:        $("#field"),
    whispers:     $("#whispers"),
    memoriesLayer:$("#memoriesLayer"),
    nudge:        $("#nudge"),
    progress:     $("#progress"),
    memoryView:   $("#memoryView"),
    memoryImg:    $("#memoryImg"),
    memoryCaption:$("#memoryCaption"),
    sceneIntro:   $("#scene-intro"),
    sceneSunrise: $("#scene-sunrise"),
    sunriseLines: $("#sunriseLines"),
    sceneRose:    $("#scene-rose"),
    rose:         $("#rose"),
    roseWords:    $("#roseWords"),
    roseTR:       $("#roseTR"),
    toLetter:     $("#toLetter"),
    letterModal:  $("#letterModal"),
    letterBody:   $("#letterBody"),
    letterClose:  $("#letterClose"),
    letterDone:   $("#letterDone"),
    sceneFinale:  $("#scene-finale"),
    finalePhoto:  $("#finalePhoto"),
    finaleTitle:  $("#finaleTitle"),
    finaleSub:    $("#finaleSubtitle"),
    finaleTR:     $("#finaleTR"),
    replayBtn:    $("#replayBtn"),
    surpriseBtn:  $("#surpriseBtn"),
    surpriseLine: $("#surpriseLine"),
    starCanvas:   $("#starCanvas"),
    eggZzz:       $("#eggZzz"),
    eggToast:     $("#eggToast"),
  };

  /* ---------------------------------------------------------------- State */
  const state = {
    scene: "intro",           // intro | field | sunrise | rose | letter | finale
    found: 0,
    total: memories.length,
    px: window.innerWidth / 2,
    py: window.innerHeight / 2,
    tx: window.innerWidth / 2, // torch position (lerped toward pointer)
    ty: window.innerHeight / 2,
    interacted: false,
    lastFind: 0,
    hintShown: false,
    sunClicks: 0,
    typedKeys: "",
    orbs: [],                 // {node, data, found}
    whisperNodes: [],
  };

  /* ================================================================ TEXT */
  function fillStaticText() {
    el.introLine.textContent = CONFIG.introLine;
    el.introHint.textContent = CONFIG.introHint;
    el.toLetter.textContent  = CONFIG.letterButton;
    el.finaleTitle.textContent = CONFIG.finaleTitle;
    el.finaleSub.textContent   = CONFIG.finaleSubtitle;
    el.finaleTR.textContent    = CONFIG.finaleTR;
    el.surpriseLine.textContent = CONFIG.surpriseLine;
    el.roseTR.textContent      = CONFIG.roseLineTR;
  }

  /* ============================================================ BUILD FIELD */
  function buildWhispers() {
    whispers.forEach((w) => {
      const p = document.createElement("p");
      p.className = "whisper";
      p.textContent = w.text;
      p.style.left = w.x + "%";
      p.style.top  = w.y + "%";
      el.whispers.appendChild(p);
      state.whisperNodes.push({ node: p, x: w.x, y: w.y });
    });
  }

  function buildMemories() {
    memories.forEach((m, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "orb";
      btn.style.left = m.x + "%";
      btn.style.top  = m.y + "%";
      btn.setAttribute("aria-label", "A hidden memory — open it");
      btn.addEventListener("click", () => openMemory(i));
      // Keyboard users: focusing an orb counts as reaching it.
      btn.addEventListener("focus", () => markNear(i, true));
      el.memoriesLayer.appendChild(btn);
      state.orbs.push({ node: btn, data: m, found: false, x: m.x, y: m.y });
    });
  }

  function buildProgress() {
    for (let i = 0; i < state.total; i++) {
      const dot = document.createElement("span");
      dot.className = "progress__dot";
      el.progress.appendChild(dot);
    }
    el.progress.setAttribute("aria-valuemax", String(state.total));
  }

  /* =============================================================== TORCH */
  // Smoothly follow the pointer for a natural "lantern" trail.
  function animateTorch() {
    const lerp = prefersReduced ? 1 : 0.18;
    state.tx += (state.px - state.tx) * lerp;
    state.ty += (state.py - state.ty) * lerp;
    document.documentElement.style.setProperty("--lx", state.tx + "px");
    document.documentElement.style.setProperty("--ly", state.ty + "px");
    if (state.scene === "field") illuminate();
    requestAnimationFrame(animateTorch);
  }

  // Reveal whispers & orbs within the light radius.
  function illuminate() {
    const r = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--torch-r")
    ) || 200;
    const w = window.innerWidth, h = window.innerHeight;

    state.whisperNodes.forEach((wp) => {
      const dx = wp.x / 100 * w - state.tx;
      const dy = wp.y / 100 * h - state.ty;
      const lit = Math.hypot(dx, dy) < r * 1.1;
      wp.node.classList.toggle("is-lit", lit);
    });

    state.orbs.forEach((o, i) => {
      if (o.found) return;
      const dx = o.x / 100 * w - state.tx;
      const dy = o.y / 100 * h - state.ty;
      const near = Math.hypot(dx, dy) < r * 0.55;
      o.node.classList.toggle("is-near", near);
      // Auto-open when the light rests on an orb (feels like discovery).
      if (near) markNear(i, false);
    });
  }

  function markNear(i, focus) {
    const o = state.orbs[i];
    if (!o || o.found) return;
    o.node.classList.add("is-near");
    // Small dwell so a quick sweep doesn't trigger everything at once.
    if (focus) { openMemory(i); return; }
    if (o._timer) return;
    o._timer = setTimeout(() => { if (o.node.classList.contains("is-near")) openMemory(i); }, 260);
  }

  /* ============================================================ POINTER */
  function setPointer(x, y) {
    state.px = x; state.py = y;
    if (!state.interacted) firstInteraction();
    resetHintTimer();
  }

  function onMouseMove(e) { setPointer(e.clientX, e.clientY); }
  function onTouchMove(e) {
    if (!e.touches[0]) return;
    setPointer(e.touches[0].clientX, e.touches[0].clientY);
  }
  function onTouchStart(e) {
    if (!e.touches[0]) return;
    // Snap the torch instantly to the first touch so it appears under the finger.
    state.tx = e.touches[0].clientX; state.ty = e.touches[0].clientY;
    setPointer(e.touches[0].clientX, e.touches[0].clientY);
  }

  /* ================================================== FIRST INTERACTION */
  // Browsers only allow audio after a gesture — and this also opens the field.
  function firstInteraction() {
    if (state.interacted) return;
    state.interacted = true;
    body.classList.add("torch-on");
    // Auto-enable sound on the first gesture (visitor can mute anytime).
    Sound.on();
    reflectSound(true);
    // Move from intro into the dark field.
    setTimeout(enterField, 900);
  }

  function enterField() {
    if (state.scene !== "intro") return;
    setScene("field");
    el.sceneIntro.classList.remove("is-active");
    resetHintTimer();
  }

  /* ================================================ MEMORY DISCOVERY */
  function openMemory(i) {
    const o = state.orbs[i];
    if (!o) return;

    // Prepare the photo (with graceful fallback if the file is missing).
    loadPhoto(el.memoryImg, o.data.image, o.data.alt || o.data.title, () => {
      // Only count + show once the image (or its fallback) is ready.
      el.memoryCaption.textContent = o.data.text;
      el.memoryView.classList.add("is-open");
      el.memoryView.dataset.index = i;
    });

    if (!o.found) {
      o.found = true;
      o.node.classList.add("is-found");
      o.node.classList.remove("is-near");
      o.node.setAttribute("aria-label", "Memory found: " + o.data.title);
      state.found++;
      state.lastFind = Date.now();
      Sound.chime();
      updateProgress();
      if (state.found >= state.total) setTimeout(beginSunrise, 1400);
    }
  }

  // Close the open memory when the visitor moves on (click / tap / key).
  function closeMemory() {
    el.memoryView.classList.remove("is-open");
  }

  function updateProgress() {
    const dots = $$(".progress__dot");
    dots.forEach((d, i) => d.classList.toggle("is-on", i < state.found));
    el.progress.setAttribute("aria-valuenow", String(state.found));
    // Lift the ambient light: 0 → 1 across all memories.
    const ambient = state.found / state.total;
    document.documentElement.style.setProperty("--ambient", ambient.toFixed(3));
  }

  /* ------------------------------------------------ Photo loading + fallback */
  // Photos are only cropped / graded by CSS — never regenerated. If a file is
  // missing we draw a warm labelled placeholder so nothing is ever an empty box.
  function loadPhoto(imgEl, src, alt, onReady) {
    imgEl.alt = alt || "";
    const probe = new Image();
    probe.onload = () => { imgEl.src = src; onReady && onReady(); };
    probe.onerror = () => { imgEl.src = placeholder(alt || "A memory"); onReady && onReady(); };
    probe.src = src;
  }

  // A soft gold gradient placeholder as a data-URI (clearly replaceable).
  function placeholder(label) {
    const safe = String(label).replace(/[<&>]/g, "");
    const svg =
      `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000'>` +
      `<defs><radialGradient id='g' cx='50%' cy='40%' r='75%'>` +
      `<stop offset='0%' stop-color='%23F6D889'/>` +
      `<stop offset='55%' stop-color='%23DDA7A0'/>` +
      `<stop offset='100%' stop-color='%235B3A29'/></radialGradient></defs>` +
      `<rect width='800' height='1000' fill='url(%23g)'/>` +
      `<circle cx='400' cy='360' r='120' fill='%23FFF6DE' opacity='0.55'/>` +
      `<text x='400' y='860' font-family='Georgia,serif' font-size='34' ` +
      `fill='%23FFF6DE' text-anchor='middle' opacity='0.9'>${encodeURIComponent(safe)}</text>` +
      `<text x='400' y='910' font-family='sans-serif' font-size='20' ` +
      `fill='%23FFF6DE' text-anchor='middle' opacity='0.6'>replace with your photo</text>` +
      `</svg>`;
    return "data:image/svg+xml;charset=utf-8," + svg;
  }

  /* ==================================================== HINT / NUDGE */
  let hintTimer = null;
  function resetHintTimer() {
    if (state.scene !== "field" || state.found >= state.total) return;
    clearTimeout(hintTimer);
    el.nudge.classList.remove("show");
    el.nudge.textContent = "";
    hintTimer = setTimeout(showHint, CONFIG.hintDelayMs);
  }
  function showHint() {
    if (state.scene !== "field") return;
    // Point roughly toward the nearest undiscovered orb.
    const next = state.orbs.find((o) => !o.found);
    if (!next) return;
    const side = next.x < 40 ? "on the left" : next.x > 60 ? "on the right" : "nearby";
    el.nudge.textContent = `A little light is waiting ${side}.`;
    el.nudge.classList.add("show");
    // Fade the hint out after a while.
    setTimeout(() => el.nudge.classList.remove("show"), 5000);
  }

  /* ==================================================== SCENE 4 — SUNRISE */
  function beginSunrise() {
    if (state.scene === "sunrise") return;
    closeMemory();
    setScene("sunrise");
    el.sceneSunrise.setAttribute("aria-hidden", "false");
    el.sceneSunrise.classList.add("is-active");
    body.classList.remove("torch-on");
    Sound.swell();

    // Build the reveal lines.
    el.sunriseLines.innerHTML = "";
    const lines = [...CONFIG.sunriseLines];
    lines.forEach((t) => {
      const p = document.createElement("p");
      p.textContent = t;
      el.sunriseLines.appendChild(p);
    });
    const finalP = document.createElement("p");
    finalP.className = "final";
    // Accent the last word ("light").
    finalP.innerHTML = accentLastWord(CONFIG.sunriseFinal);
    el.sunriseLines.appendChild(finalP);

    // Kick off the dawn animation shortly after mount.
    const dawnDelay = prefersReduced ? 100 : 900;
    setTimeout(() => el.sceneSunrise.classList.add("dawn"), dawnDelay);

    // Reveal lines in sequence.
    const paras = $$("p", el.sunriseLines);
    const step = prefersReduced ? 700 : 2200;
    paras.forEach((p, i) => setTimeout(() => p.classList.add("show"), 1600 + i * step));

    // Move to the rose after the sequence.
    const total = 1600 + paras.length * step + 2200;
    setTimeout(beginRose, total);
  }

  function accentLastWord(text) {
    const parts = text.trim().split(" ");
    const last = parts.pop().replace(/[<&>]/g, "");
    return parts.join(" ") + ' <span class="accent">' + last + "</span>";
  }

  /* ==================================================== SCENE 5 — ROSE */
  function beginRose() {
    if (state.scene === "rose") return;
    el.sceneSunrise.classList.remove("is-active");
    el.sceneSunrise.setAttribute("aria-hidden", "true");
    setScene("rose");
    el.sceneRose.setAttribute("aria-hidden", "false");
    el.sceneRose.classList.add("is-active");

    // Bloom the rose.
    setTimeout(() => el.sceneRose.classList.add("bloom"), prefersReduced ? 50 : 400);

    // Words appear one by one.
    el.roseWords.innerHTML = "";
    CONFIG.roseLines.forEach((t) => {
      const p = document.createElement("p");
      p.textContent = t;
      el.roseWords.appendChild(p);
    });
    const paras = $$("p", el.roseWords);
    const step = prefersReduced ? 600 : 1800;
    paras.forEach((p, i) => setTimeout(() => p.classList.add("show"), 2400 + i * step));

    const afterWords = 2400 + paras.length * step;
    setTimeout(() => el.roseTR.classList.add("show"), afterWords);
    setTimeout(() => el.toLetter.classList.add("show"), afterWords + 900);
  }

  /* ==================================================== SCENE 6 — LETTER */
  let lastFocused = null;
  function buildLetter() {
    el.letterBody.innerHTML = "";
    LETTER.forEach((line) => {
      const p = document.createElement("p");
      p.textContent = line;
      if (line === "") p.style.height = ".5em";
      el.letterBody.appendChild(p);
    });
  }

  function openLetter() {
    lastFocused = document.activeElement;
    setScene("letter");
    el.letterModal.setAttribute("aria-hidden", "false");
    el.letterModal.classList.add("is-open");
    // Gentle line-by-line reveal (not a slow typewriter).
    const lines = $$("p", el.letterBody);
    lines.forEach((p, i) => {
      p.style.opacity = "0";
      p.style.transform = "translateY(6px)";
      p.style.transition = "opacity .5s var(--ease), transform .5s var(--ease)";
      setTimeout(() => { p.style.opacity = "1"; p.style.transform = "none"; },
                 prefersReduced ? 0 : 180 + i * 260);
    });
    // Focus the close button and trap focus inside.
    setTimeout(() => el.letterClose.focus(), 60);
    document.addEventListener("keydown", trapFocus, true);
  }

  function closeLetter() {
    el.letterModal.classList.remove("is-open");
    el.letterModal.setAttribute("aria-hidden", "true");
    document.removeEventListener("keydown", trapFocus, true);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
    // The letter leads into the birthday finale.
    setTimeout(beginFinale, 500);
  }

  function trapFocus(e) {
    if (e.key === "Escape") { e.preventDefault(); closeLetter(); return; }
    if (e.key !== "Tab") return;
    const focusables = $$(
      'button, [href], [tabindex]:not([tabindex="-1"])',
      el.letterModal
    ).filter((n) => n.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ==================================================== SCENE 7 — FINALE */
  function beginFinale() {
    if (state.scene === "finale") return;
    el.sceneRose.classList.remove("is-active");
    el.sceneRose.setAttribute("aria-hidden", "true");
    setScene("finale");
    el.sceneFinale.setAttribute("aria-hidden", "false");
    el.sceneFinale.classList.add("is-active");

    // Use the most special photo (last memory) as the backdrop, if it loads.
    const hero = memories[memories.length - 1];
    if (hero && hero.image) {
      const probe = new Image();
      probe.onload = () => { el.finalePhoto.style.backgroundImage = `url("${hero.image}")`; };
      probe.src = hero.image;   // silently ignored if missing
    }
    sizeCanvas();
  }

  /* -------------------------------------------------- The "one last surprise" */
  let starAnim = null;
  function playSurprise() {
    el.surpriseLine.classList.add("show");
    if (prefersReduced) return;      // respect reduced motion — no particles
    startStars();
    flashPhotos();
  }

  function sizeCanvas() {
    const c = el.starCanvas;
    c.width = window.innerWidth; c.height = window.innerHeight;
  }

  function startStars() {
    const c = el.starCanvas, ctx = c.getContext("2d");
    if (!ctx) return;
    const stars = Array.from({ length: 90 }, () => ({
      x: Math.random() * c.width,
      y: Math.random() * c.height,
      r: Math.random() * 2 + 0.4,
      a: Math.random(),
      s: Math.random() * 0.02 + 0.004,
    }));
    let rays = 0;
    cancelAnimationFrame(starAnim);
    function frame() {
      ctx.clearRect(0, 0, c.width, c.height);
      // Twinkling stars.
      stars.forEach((st) => {
        st.a += st.s;
        const tw = 0.5 + 0.5 * Math.sin(st.a);
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(246,216,137,${tw * 0.9})`;
        ctx.fill();
      });
      // Sun rays sweeping out from the centre.
      rays += 0.01;
      const cx = c.width / 2, cy = c.height * 0.42;
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2 + rays;
        const len = 80 + 60 * Math.sin(rays * 2 + i);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(ang) * (140 + len), cy + Math.sin(ang) * (140 + len));
        ctx.strokeStyle = "rgba(232,176,74,0.06)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      starAnim = requestAnimationFrame(frame);
    }
    frame();
  }

  // Briefly flash a few discovered photos across the screen.
  function flashPhotos() {
    memories.slice(0, 5).forEach((m, i) => {
      setTimeout(() => {
        const img = document.createElement("img");
        img.src = m.image;
        img.alt = "";
        img.onerror = () => img.remove();
        Object.assign(img.style, {
          position: "fixed", zIndex: 2, width: "120px", height: "150px",
          objectFit: "cover", borderRadius: "8px", pointerEvents: "none",
          left: (10 + Math.random() * 70) + "vw",
          top:  (15 + Math.random() * 55) + "vh",
          opacity: "0", transform: "scale(.8) rotate(" + (Math.random()*16-8) + "deg)",
          transition: "opacity .8s ease, transform .8s ease",
          boxShadow: "0 10px 40px rgba(0,0,0,.5)",
        });
        el.sceneFinale.appendChild(img);
        requestAnimationFrame(() => { img.style.opacity = ".9"; img.style.transform = "scale(1)"; });
        setTimeout(() => { img.style.opacity = "0"; setTimeout(() => img.remove(), 800); }, 2600);
      }, i * 500);
    });
  }

  /* ==================================================== REPLAY */
  function replay() {
    // Reset all state and return to the dark field.
    cancelAnimationFrame(starAnim);
    el.surpriseLine.classList.remove("show");
    [el.sceneFinale, el.sceneRose, el.sceneSunrise].forEach((s) => {
      s.classList.remove("is-active", "dawn", "bloom");
      s.setAttribute("aria-hidden", "true");
    });
    state.found = 0;
    state.orbs.forEach((o) => {
      o.found = false;
      o.node.classList.remove("is-found", "is-near");
      o.node.setAttribute("aria-label", "A hidden memory — open it");
    });
    updateProgress();
    document.documentElement.style.setProperty("--ambient", "0");
    body.classList.add("torch-on");
    setScene("field");
    resetHintTimer();
    window.scrollTo(0, 0);
  }

  /* ==================================================== EASTER EGGS */
  function toast(msg) {
    el.eggToast.textContent = msg;
    el.eggToast.classList.add("show");
    el.eggToast.setAttribute("aria-hidden", "false");
    clearTimeout(el.eggToast._t);
    el.eggToast._t = setTimeout(() => {
      el.eggToast.classList.remove("show");
      el.eggToast.setAttribute("aria-hidden", "true");
    }, 3200);
  }

  // Type "SUN" anywhere → secret light.
  function onKeyType(e) {
    if (e.key && e.key.length === 1) {
      state.typedKeys = (state.typedKeys + e.key).toUpperCase().slice(-3);
      if (state.typedKeys === "SUN") {
        toast("You found the secret light.");
        Sound.chime();
      }
    }
    // Let ESC close an open memory too.
    if (e.key === "Escape" && el.memoryView.classList.contains("is-open")) closeMemory();
  }

  // Click the sunrise sun 5× → the silly bus photo.
  function onSunClick() {
    state.sunClicks++;
    if (state.sunClicks === 5) {
      toast("Yes, she is probably sleeping again. 😴");
      Sound.chime();
      state.sunClicks = 0;
    }
  }

  // Sleepy corner.
  function onZzz() { toast("Yes, she is probably sleeping again."); Sound.chime(); }

  // Double-click / double-tap any opened photo → floating heart.
  function heartPop(x, y) {
    const h = document.createElement("div");
    h.className = "heart-pop";
    h.textContent = "♥";
    h.style.left = x + "px";
    h.style.top  = y + "px";
    h.style.transform = "translate(-50%,-50%)";
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 1100);
  }

  /* ==================================================== SOUND TOGGLE */
  function reflectSound(on) {
    el.soundToggle.setAttribute("aria-pressed", String(on));
    el.soundToggle.setAttribute("aria-label", on ? "Turn sound off" : "Turn sound on");
  }
  function onToggleSound() {
    const on = Sound.toggle();
    reflectSound(on);
  }

  /* ==================================================== HELPERS */
  function setScene(name) {
    state.scene = name;
    body.dataset.scene = name;
  }

  /* ==================================================== INIT / BINDINGS */
  function init() {
    fillStaticText();
    buildWhispers();
    buildMemories();
    buildProgress();
    buildLetter();
    updateProgress();

    // Pointer + touch.
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    // Any first gesture (incl. click / key) starts things too.
    window.addEventListener("pointerdown", firstInteraction, { once: false });
    window.addEventListener("keydown", (e) => {
      if (!state.interacted && (e.key === "Enter" || e.key === " " || e.key === "Tab")) firstInteraction();
    });

    // Close an open memory on the next tap/click in the field.
    el.memoryView.addEventListener("click", closeMemory);
    // Double-tap the open photo → heart.
    el.memoryImg.addEventListener("dblclick", (e) => { e.stopPropagation(); heartPop(e.clientX, e.clientY); });

    // Sound toggle.
    el.soundToggle.addEventListener("click", onToggleSound);

    // Sunrise sun easter egg.
    $(".sunrise__sun", el.sceneSunrise).addEventListener("click", onSunClick);

    // Letter.
    el.toLetter.addEventListener("click", openLetter);
    el.letterDone.addEventListener("click", closeLetter);
    $$("[data-close]", el.letterModal).forEach((n) => n.addEventListener("click", closeLetter));

    // Finale buttons.
    el.replayBtn.addEventListener("click", replay);
    el.surpriseBtn.addEventListener("click", playSurprise);

    // Easter eggs.
    el.eggZzz.addEventListener("click", onZzz);
    document.addEventListener("keydown", onKeyType);

    window.addEventListener("resize", sizeCanvas, { passive: true });

    // Reduced motion: don't auto-open from a resting light (that relies on dwell),
    // orbs still work via click/tap/keyboard just fine.

    // Start the render loop and drop the loading guard.
    requestAnimationFrame(() => {
      body.classList.remove("is-loading");
      animateTorch();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
