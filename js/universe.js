/* =============================================================================
   universe.js — the astronomical journey (Three.js).
   -----------------------------------------------------------------------------
   A dark universe with a central sun and one orbiting planet per chapter.
   You float through space, visit planets to reveal memories, and every
   discovery brings more light. When every chapter is found, the sun unlocks
   and the whole thing resolves into one message: you were always my sun.

   Structure:
     • boot / graceful fallback        • starfield + nebula + sun + planets
     • unified camera (orbit ↔ focus)  • pointer raycasting + labels
     • chapter panel + letter modal    • evolving light with each discovery
     • finale: fly into the sun, the rose→sun lines, a wish that becomes a star
   ========================================================================== */

(function () {
  "use strict";

  const { CONFIG, PLANETS, LETTER } = window.SUNSHINE;
  const Sound = window.SUNSHINE.Sound;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const body = document.body;

  const el = {
    canvas:     $("#scene"),
    label:      $("#planetLabel"),
    soundToggle:$("#soundToggle"),
    progress:   $("#progress"),
    travelHint: $("#travelHint"),
    intro:      $("#intro"),
    introStar:  $("#introStar"),
    introTitle: $("#introTitle"),
    introHint:  $("#introHint"),
    panel:      $("#panel"),
    panelClose: $("#panelClose"),
    panelFigure:$("#panelFigure"),
    panelImg:   $("#panelImg"),
    panelName:  $("#panelName"),
    panelText:  $("#panelText"),
    panelLetterBtn: $("#panelLetterBtn"),
    letter:     $("#letter"),
    letterBody: $("#letterBody"),
    letterClose:$("#letterClose"),
    letterDone: $("#letterDone"),
    finale:     $("#finale"),
    finalePhoto:$("#finalePhoto"),
    finaleLines:$("#finaleLines"),
    wishWrap:   $("#wishWrap"),
    wishBtn:    $("#wishBtn"),
    wishForm:   $("#wishForm"),
    wishLabel:  $("#wishLabel"),
    wishInput:  $("#wishInput"),
    wishSend:   $("#wishSend"),
    birthday:   $("#birthday"),
    bTitle:     $("#bTitle"),
    bSub:       $("#bSub"),
  };

  /* ------------------------------------------------- fill the static copy */
  el.introTitle.textContent = CONFIG.introTitle;
  el.introHint.textContent  = CONFIG.introHint;
  el.travelHint.textContent = CONFIG.travelHint;
  el.wishBtn.textContent    = CONFIG.wishButton;
  el.wishLabel.textContent  = CONFIG.wishPrompt;
  el.wishInput.placeholder  = CONFIG.wishPlaceholder;
  el.wishSend.textContent   = CONFIG.wishSend;
  el.bTitle.textContent     = CONFIG.birthdayTitle;
  el.bSub.textContent       = CONFIG.birthdaySub;

  /* ============================================================ FALLBACK */
  // If WebGL / three.js is unavailable, we still show the intro and let the
  // visitor read the messages — the gift never becomes a blank screen.
  if (!window.THREE || !hasWebGL()) {
    console.info("WebGL unavailable — showing a simple fallback.");
    body.classList.remove("is-loading");
    el.introHint.textContent = "";
    el.introStar.addEventListener("click", () => { el.intro.classList.add("hide"); startFinale(true); });
    return;
  }
  function hasWebGL() {
    try { const c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl"))); }
    catch (e) { return false; }
  }

  const THREE = window.THREE;

  /* ================================================================ STATE */
  const state = {
    scene: "intro",              // intro | travel | focus | finale
    started: false,
    focused: -1,                 // index of focused planet, or -1
    discovered: new Set(),
    total: PLANETS.length,
    sunUnlocked: false,
    time: 0,
    orbitsFrozen: false,
    // unified camera targets (spherical for orbit mode)
    cam: { radius: 150, theta: 0.6, phi: 1.15,
           tRadius: 90, tTheta: 0.6, tPhi: 1.12 },
    dragging: false, lastX: 0, lastY: 0,
    lookAt: new THREE.Vector3(0, 0, 0),
    idle: 0,
  };

  /* ============================================================= RENDERER */
  const renderer = new THREE.WebGLRenderer({
    canvas: el.canvas, antialias: true, alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.55;      // rises as the universe evolves

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x03050a, 0.0016);

  const camera = new THREE.PerspectiveCamera(
    52, window.innerWidth / window.innerHeight, 0.1, 3000);
  camera.position.set(0, 20, 150);

  /* --------------------------------------------------------------- lights */
  const ambient = new THREE.AmbientLight(0x223047, 0.5);
  scene.add(ambient);
  const sunLight = new THREE.PointLight(0xffdca8, 2.2, 0, 1.4);
  scene.add(sunLight);
  const rim = new THREE.DirectionalLight(0x8fb4ff, 0.25);
  rim.position.set(-1, 0.5, 1);
  scene.add(rim);

  /* --------------------------------------------------- texture helpers */
  function radialTexture(stops, size = 128) {
    const c = document.createElement("canvas"); c.width = c.height = size;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    stops.forEach(([o, col]) => g.addColorStop(o, col));
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
  }
  const starTex  = radialTexture([[0,"rgba(255,255,255,1)"],[0.25,"rgba(255,248,224,0.9)"],[0.55,"rgba(255,235,190,0.25)"],[1,"rgba(0,0,0,0)"]]);
  const glowTex  = radialTexture([[0,"rgba(255,244,214,1)"],[0.35,"rgba(246,216,137,0.7)"],[0.7,"rgba(232,176,74,0.18)"],[1,"rgba(0,0,0,0)"]]);
  const softTex  = radialTexture([[0,"rgba(255,255,255,0.9)"],[0.5,"rgba(255,255,255,0.25)"],[1,"rgba(255,255,255,0)"]]);

  /* ------------------------------------------------------------ STARFIELD */
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  function makeStars(count, spread, size, color) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const base = new THREE.Color(color);
    for (let i = 0; i < count; i++) {
      // distribute on a big shell-ish volume
      const r = spread * (0.35 + Math.random() * 0.65);
      const th = Math.random() * Math.PI * 2, ph = Math.acos(2*Math.random()-1);
      pos[i*3]   = r * Math.sin(ph) * Math.cos(th);
      pos[i*3+1] = r * Math.cos(ph) * 0.6;
      pos[i*3+2] = r * Math.sin(ph) * Math.sin(th);
      const tint = 0.7 + Math.random() * 0.3;
      col[i*3] = base.r*tint; col[i*3+1] = base.g*tint; col[i*3+2] = base.b*tint;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size, map: starTex, vertexColors: true, transparent: true,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    });
    return new THREE.Points(geo, mat);
  }
  const starsFar  = makeStars(coarse ? 900 : 1800, 1600, 6, 0xffffff);
  const starsNear = makeStars(coarse ? 500 : 1100, 900, 4, 0xfff2cf);
  scene.add(starsFar, starsNear);
  // Extra light appears with discovery: a hidden layer that fades in.
  const starsBloom = makeStars(coarse ? 500 : 1100, 700, 7, 0xffe6b0);
  starsBloom.material.opacity = 0; scene.add(starsBloom);

  /* -------------------------------------------------------------- NEBULA */
  const nebulaTex = radialTexture([[0,"rgba(255,255,255,0.5)"],[0.5,"rgba(255,255,255,0.12)"],[1,"rgba(255,255,255,0)"]], 256);
  const nebulas = [];
  [[0x6a4fb0, -260, 60, -300, 460],
   [0xc77a86,  300, -40, -260, 420],
   [0xe8b04a,  0, -120, -420, 520],
   [0x3f6fb0, -340, -80, 120, 380]].forEach(([c, x, y, z, s]) => {
    const m = new THREE.SpriteMaterial({ map: nebulaTex, color: c, transparent: true,
      opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const sp = new THREE.Sprite(m); sp.position.set(x, y, z); sp.scale.set(s, s, 1);
    sp.userData.max = 0.5; nebulas.push(sp); scene.add(sp);
  });

  /* ----------------------------------------------------------------- SUN */
  const sunGroup = new THREE.Group(); scene.add(sunGroup);
  const sunCore = new THREE.Mesh(
    new THREE.SphereGeometry(5, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0xffdca0 }));
  sunGroup.add(sunCore);
  // layered additive glow
  const sunGlows = [];
  [[16, 0.55, 0xffdca0],[30, 0.3, 0xe8b04a],[54, 0.16, 0xe8853a]].forEach(([sc, op, c]) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: c,
      transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.scale.set(sc, sc, 1); sunGroup.add(s); sunGlows.push(s);
  });
  sunCore.userData.isSun = true;

  /* ------------------------------------------------------------- PLANETS */
  const planetMeshes = [];
  PLANETS.forEach((p, i) => {
    const pivot = new THREE.Group();
    pivot.rotation.y = p.phase || 0;
    scene.add(pivot);

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(p.size * 1.6, 40, 40),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(p.color), roughness: 0.72, metalness: 0.05,
        emissive: new THREE.Color(p.color).multiplyScalar(0.12) }));
    mesh.position.x = p.orbit;
    mesh.userData = { index: i, planet: p, baseScale: 1 };
    pivot.add(mesh);

    // soft atmosphere halo
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex,
      color: new THREE.Color(p.color), transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false }));
    const hs = p.size * 6.4; halo.scale.set(hs, hs, 1);
    mesh.add(halo);
    mesh.userData.halo = halo;

    // faint orbit ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(p.orbit - 0.06, p.orbit + 0.06, 128),
      new THREE.MeshBasicMaterial({ color: 0x2a3550, side: THREE.DoubleSide,
        transparent: true, opacity: 0.35, depthWrite: false }));
    ring.rotation.x = Math.PI / 2; scene.add(ring);

    planetMeshes.push(mesh);
    PLANETS[i]._pivot = pivot; PLANETS[i]._mesh = mesh;
  });

  /* ============================================================ TWEENS */
  const tweens = [];
  function tween(obj, to, dur, ease, onDone) {
    const from = {}; for (const k in to) from[k] = obj[k];
    tweens.push({ obj, from, to, dur, t: 0, ease: ease || easeInOut, onDone });
  }
  function easeInOut(x){ return x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x+2,3)/2; }
  function easeOut(x){ return 1 - Math.pow(1-x, 3); }
  function updateTweens(dt) {
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i]; tw.t += dt / tw.dur;
      const k = tw.t >= 1 ? 1 : tw.ease(tw.t);
      for (const key in tw.to) tw.obj[key] = tw.from[key] + (tw.to[key] - tw.from[key]) * k;
      if (tw.t >= 1) { tweens.splice(i, 1); tw.onDone && tw.onDone(); }
    }
  }

  /* ============================================== EVOLVING UNIVERSE LIGHT */
  function evolve() {
    const f = state.discovered.size / state.total;   // 0 → 1
    tween(renderer, { toneMappingExposure: 0.55 + f * 0.7 }, 2.2);
    tween(sunLight, { intensity: 2.2 + f * 2.6 }, 2.2);
    tween(starsBloom.material, { opacity: f * 0.9 }, 2.5);
    nebulas.forEach((n, i) => tween(n.material, { opacity: (0.12 + f * 0.4) }, 2.6));
    // richer starlight
    tween(starsFar.material,  { opacity: 0.8 + f * 0.2 }, 2);
  }

  /* =================================================== POINTER + PICKING */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hovered = -1;

  function setPointerFromEvent(e) {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    ndc.x = (x / window.innerWidth) * 2 - 1;
    ndc.y = -(y / window.innerHeight) * 2 + 1;
    return { x, y };
  }

  function pickPlanet() {
    raycaster.setFromCamera(ndc, camera);
    const targets = planetMeshes.slice();
    if (state.sunUnlocked) targets.push(sunCore);
    const hits = raycaster.intersectObjects(targets, false);
    return hits.length ? hits[0].object : null;
  }

  /* ----------------------------------------------------- drag / rotate */
  function onDown(e) {
    if (state.scene === "intro" || state.scene === "finale") return;
    const p = setPointerFromEvent(e);
    state.dragging = true; state.moved = false;
    state.lastX = p.x; state.lastY = p.y;
    el.canvas.classList.add("grabbing");
  }
  function onMove(e) {
    if (state.scene === "intro" || state.scene === "finale") return;
    const p = setPointerFromEvent(e);
    if (state.dragging) {
      const dx = p.x - state.lastX, dy = p.y - state.lastY;
      if (Math.abs(dx) + Math.abs(dy) > 3) state.moved = true;
      state.lastX = p.x; state.lastY = p.y;
      state.idle = 0;
      if (state.focused < 0) {
        state.cam.tTheta -= dx * 0.005;
        state.cam.tPhi = clamp(state.cam.tPhi - dy * 0.005, 0.35, Math.PI - 0.35);
      }
    } else if (state.focused < 0) {
      // hover highlight
      const hit = pickPlanet();
      const idx = hit ? (hit.userData.index != null ? hit.userData.index : "sun") : -1;
      updateHover(hit);
    }
  }
  function onUp(e) {
    if (!state.dragging) return;
    state.dragging = false; el.canvas.classList.remove("grabbing");
    if (!state.moved && state.scene === "travel" && state.focused < 0) {
      const hit = pickPlanet();
      if (hit) {
        if (hit.userData.isSun && state.sunUnlocked) beginFinale();
        else if (hit.userData.index != null) focusPlanet(hit.userData.index);
      }
    }
  }

  function updateHover(hit) {
    const idx = hit && hit.userData.index != null ? hit.userData.index : -1;
    if (idx === hovered) { if (hit) positionLabel(hit); return; }
    // reset previous
    if (hovered >= 0 && planetMeshes[hovered]) planetMeshes[hovered].userData.baseScale = 1;
    hovered = idx;
    if (hit && (hit.userData.index != null || (hit.userData.isSun && state.sunUnlocked))) {
      el.canvas.classList.add("hovering");
      if (hit.userData.index != null) {
        planetMeshes[idx].userData.baseScale = 1.18;
        el.label.textContent = PLANETS[idx].name;
      } else { el.label.textContent = CONFIG.friendName; }
      el.label.classList.add("show");
      positionLabel(hit);
    } else {
      el.canvas.classList.remove("hovering");
      el.label.classList.remove("show");
    }
  }
  const _v = new THREE.Vector3();
  function positionLabel(mesh) {
    mesh.getWorldPosition(_v); _v.project(camera);
    const x = (_v.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-_v.y * 0.5 + 0.5) * window.innerHeight;
    el.label.style.left = x + "px"; el.label.style.top = y + "px";
  }

  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

  /* ================================================= FOCUS A PLANET */
  const focusPos = new THREE.Vector3();
  const focusLook = new THREE.Vector3();
  function focusPlanet(i) {
    state.focused = i;
    state.scene = "focus";
    state.orbitsFrozen = true;
    el.label.classList.remove("show");
    el.canvas.classList.remove("hovering");
    openPanel(PLANETS[i]);
    if (!state.discovered.has(i)) {
      state.discovered.add(i);
      Sound && Sound.chime();
      updateProgress();
      evolve();
      if (state.discovered.size >= state.total) unlockSun();
    }
  }
  function unfocus() {
    state.focused = -1;
    state.scene = "travel";
    state.orbitsFrozen = false;
    closePanel();
  }

  // Desired camera each frame, driven by mode.
  function desiredCamera(outPos, outLook) {
    if (state.scene === "finale") {
      sunCore.getWorldPosition(outLook);
      outPos.set(0, 6, 26);           // close to the sun
      return;
    }
    if (state.focused >= 0) {
      const m = PLANETS[state.focused]._mesh;
      m.getWorldPosition(focusLook);
      // camera sits a bit out along the planet→sun-perpendicular, slightly above
      const dir = focusLook.clone().normalize();
      const off = PLANETS[state.focused].size * 8 + 10;
      outPos.copy(focusLook).add(new THREE.Vector3(dir.x*0+ -dir.z, 0.5, dir.x).multiplyScalar(off*0.5))
            .add(dir.clone().multiplyScalar(off));
      outPos.y += 4;
      outLook.copy(focusLook);
      return;
    }
    // orbit mode (spherical around origin)
    const c = state.cam;
    outPos.set(
      c.radius * Math.sin(c.phi) * Math.cos(c.theta),
      c.radius * Math.cos(c.phi),
      c.radius * Math.sin(c.phi) * Math.sin(c.theta));
    outLook.set(0, 0, 0);
  }

  /* ============================================= CHAPTER PANEL + LETTER */
  function openPanel(p) {
    el.panelName.textContent = p.name;
    el.panelText.textContent = p.text;
    el.panelLetterBtn.hidden = (p.kind !== "letter");
    if (p.kind === "photo" && p.photo) {
      el.panelFigure.hidden = false;
      loadPhoto(el.panelImg, p.photo, p.alt || p.name);
    } else {
      el.panelFigure.hidden = true;
      el.panelImg.removeAttribute("src");
    }
    el.panel.setAttribute("aria-hidden", "false");
    el.panel.classList.add("open");
    setTimeout(() => el.panelClose.focus(), 60);
  }
  function closePanel() {
    el.panel.classList.remove("open");
    el.panel.setAttribute("aria-hidden", "true");
  }

  function loadPhoto(img, src, alt) {
    img.alt = alt || "";
    const probe = new Image();
    probe.onload  = () => { img.src = src; };
    probe.onerror = () => { img.src = placeholder(alt || "Bir anı"); };
    probe.src = src;
  }
  function placeholder(label) {
    const safe = String(label).replace(/[<&>]/g, "");
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000'>"+
      "<defs><radialGradient id='g' cx='50%' cy='40%' r='75%'>"+
      "<stop offset='0%' stop-color='%23F6D889'/><stop offset='55%' stop-color='%23DDA7A0'/>"+
      "<stop offset='100%' stop-color='%235B3A29'/></radialGradient></defs>"+
      "<rect width='800' height='1000' fill='url(%23g)'/>"+
      "<circle cx='400' cy='360' r='120' fill='%23FFF6DE' opacity='0.5'/>"+
      "<text x='400' y='880' font-family='Georgia,serif' font-size='34' fill='%23FFF6DE' "+
      "text-anchor='middle' opacity='0.9'>"+encodeURIComponent(safe)+"</text></svg>";
    return "data:image/svg+xml;charset=utf-8," + svg;
  }

  // Letter modal (with focus trap)
  let lastFocused = null;
  function buildLetter() {
    el.letterBody.innerHTML = "";
    LETTER.forEach((line) => {
      const p = document.createElement("p");
      p.textContent = line; if (line === "") p.style.height = ".5em";
      el.letterBody.appendChild(p);
    });
  }
  function openLetter() {
    lastFocused = document.activeElement;
    el.letter.classList.add("open");
    el.letter.setAttribute("aria-hidden", "false");
    const lines = $$("p", el.letterBody);
    lines.forEach((p, i) => {
      p.style.opacity = "0"; p.style.transform = "translateY(6px)";
      p.style.transition = "opacity .5s var(--ease), transform .5s var(--ease)";
      setTimeout(() => { p.style.opacity = "1"; p.style.transform = "none"; }, prefersReduced ? 0 : 160 + i*230);
    });
    setTimeout(() => el.letterClose.focus(), 60);
    document.addEventListener("keydown", trapLetter, true);
  }
  function closeLetter() {
    el.letter.classList.remove("open");
    el.letter.setAttribute("aria-hidden", "true");
    document.removeEventListener("keydown", trapLetter, true);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }
  function trapLetter(e) {
    if (e.key === "Escape") { e.preventDefault(); closeLetter(); return; }
    if (e.key !== "Tab") return;
    const f = $$('button, [href], input, [tabindex]:not([tabindex="-1"])', el.letter)
      .filter(n => n.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length-1];
    if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  }

  /* ================================================= PROGRESS + SUN UNLOCK */
  function buildProgress() {
    for (let i = 0; i < state.total; i++) {
      const d = document.createElement("span");
      d.className = "progress__dot"; el.progress.appendChild(d);
    }
    el.progress.setAttribute("aria-valuemax", String(state.total));
  }
  function updateProgress() {
    $$(".progress__dot").forEach((d, i) => d.classList.toggle("on", state.discovered.has(indexAt(i))));
    // simpler: light the first N dots
    $$(".progress__dot").forEach((d, i) => d.classList.toggle("on", i < state.discovered.size));
    el.progress.setAttribute("aria-valuenow", String(state.discovered.size));
  }
  function indexAt(i){ return i; }

  function unlockSun() {
    state.sunUnlocked = true;
    tween(sunCore.scale, { x: 1.5, y: 1.5, z: 1.5 }, 2.4);
    sunGlows.forEach((g) => tween(g.material, { opacity: g.material.opacity * 1.5 }, 2.4));
    el.travelHint.textContent = CONFIG.friendName + "'e doğru git — güneşe dokun";
    el.travelHint.classList.add("show");
  }

  /* ==================================================== FINALE SEQUENCE */
  function beginFinale() {
    if (state.scene === "finale") return;
    state.scene = "finale";
    state.orbitsFrozen = true;
    closePanel();
    el.label.classList.remove("show");
    el.travelHint.classList.remove("show");
    el.progress.style.opacity = "0";
    body.dataset.scene = "finale";
    Sound && Sound.swell();
    // brighten everything toward dawn
    tween(renderer, { toneMappingExposure: 1.5 }, 4);
    tween(sunLight, { intensity: 6 }, 4);
    tween(sunCore.scale, { x: 3.4, y: 3.4, z: 3.4 }, 5);
    sunGlows.forEach((g) => tween(g.material, { opacity: Math.min(1, g.material.opacity * 2) }, 4));
    setTimeout(startFinale, 3600);
  }

  function startFinale(isFallback) {
    el.finale.classList.add("show");
    el.finale.setAttribute("aria-hidden", "false");
    // photo inside the sun
    el.finalePhoto.alt = CONFIG.sunPhotoAlt || "";
    const probe = new Image();
    probe.onload  = () => { el.finalePhoto.src = CONFIG.sunPhoto; el.finalePhoto.classList.add("show"); };
    probe.onerror = () => { el.finalePhoto.style.display = "none"; };
    probe.src = CONFIG.sunPhoto;

    // reveal the rose→sun lines one by one
    el.finaleLines.innerHTML = "";
    CONFIG.finaleLines.forEach((t) => {
      const p = document.createElement("p"); p.textContent = t; el.finaleLines.appendChild(p);
    });
    const paras = $$("p", el.finaleLines);
    const step = prefersReduced ? 900 : 2600;
    paras.forEach((p, i) => setTimeout(() => p.classList.add("show"), 1400 + i*step));
    // then the wish
    setTimeout(() => { el.wishWrap.hidden = false; }, 1400 + paras.length*step + 400);
  }

  // wish → becomes a star
  function openWish() {
    el.wishBtn.hidden = true;
    el.wishForm.hidden = false;
    setTimeout(() => el.wishInput.focus(), 60);
  }
  function sendWish(e) {
    e.preventDefault();
    el.wishForm.hidden = true;
    launchWishStar();
    Sound && Sound.chime();
    setTimeout(() => {
      el.birthday.hidden = false;
      requestAnimationFrame(() => el.birthday.classList.add("show"));
    }, 900);
  }
  // a little star that flies from the sun out into the sky
  function launchWishStar() {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, color: 0xfff2cf,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.scale.set(6, 6, 1); s.position.set(0, 4, 24); scene.add(s);
    const target = { x: (Math.random()*2-1)*300, y: 120 + Math.random()*120, z: -200 - Math.random()*200 };
    tween(s.position, target, 3.2, easeOut);
    tween(s.scale, { x: 2, y: 2 }, 3.2);
  }

  /* ===================================================== SOUND TOGGLE */
  function reflectSound(on) {
    el.soundToggle.setAttribute("aria-pressed", String(on));
    el.soundToggle.setAttribute("aria-label", on ? "Sesi kapat" : "Sesi aç");
  }
  el.soundToggle.addEventListener("click", () => { if (Sound) reflectSound(Sound.toggle()); });

  /* ============================================================= START */
  function start() {
    if (state.started) return;
    state.started = true;
    if (Sound) { Sound.on(); reflectSound(true); }
    el.intro.classList.add("hide");
    body.dataset.scene = "travel";
    state.scene = "travel";
    // cinematic dolly-in
    state.cam.radius = 320; state.cam.tRadius = 88;
    el.travelHint.classList.add("show");
    setTimeout(() => { if (state.scene === "travel") el.travelHint.classList.remove("show"); }, 5000);
  }

  /* ============================================================ RENDER */
  const _pos = new THREE.Vector3(), _look = new THREE.Vector3();
  let last = 0;
  function frame(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
    last = now; state.time += dt;
    updateTweens(dt);

    // camera smoothing
    const c = state.cam;
    c.radius += (c.tRadius - c.radius) * Math.min(1, dt*2.4);
    c.theta  += (c.tTheta  - c.theta)  * Math.min(1, dt*3);
    c.phi    += (c.tPhi    - c.phi)    * Math.min(1, dt*3);
    // idle auto-rotate in orbit mode
    if (state.scene === "travel" && !state.dragging) {
      state.idle += dt;
      if (state.idle > 1.5 && !prefersReduced) c.tTheta += dt * 0.03;
    }
    desiredCamera(_pos, _look);
    const camLerp = state.scene === "finale" ? dt*0.6 : dt*3.2;
    camera.position.lerp(_pos, Math.min(1, camLerp));
    state.lookAt.lerp(_look, Math.min(1, dt*3.4));
    camera.lookAt(state.lookAt);

    // orbital motion
    if (!state.orbitsFrozen) {
      PLANETS.forEach((p) => { p._pivot.rotation.y += p.speed * dt; p._mesh.rotation.y += dt*0.3; });
    }
    // planet hover scale easing
    planetMeshes.forEach((m) => {
      const t = m.userData.baseScale;
      m.scale.x += (t - m.scale.x) * Math.min(1, dt*8);
      m.scale.y = m.scale.z = m.scale.x;
    });
    // sun shimmer
    const pl = 1 + Math.sin(state.time * 1.3) * 0.03;
    sunGlows.forEach((g, i) => { const s0 = [16,30,54][i] * (state.sunUnlocked?1.5:1); g.scale.set(s0*pl, s0*pl, 1); });
    sunGroup.rotation.y += dt * 0.05;
    // starfields drift
    starsFar.rotation.y  += dt * 0.005;
    starsNear.rotation.y -= dt * 0.008;
    starsBloom.rotation.y += dt * 0.006;

    if (hovered >= 0 && state.focused < 0) positionLabel(planetMeshes[hovered]);

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  /* ============================================================ EVENTS */
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }
  window.addEventListener("resize", onResize, { passive: true });

  el.canvas.addEventListener("mousedown", onDown);
  window.addEventListener("mousemove", onMove, { passive: true });
  window.addEventListener("mouseup", onUp);
  el.canvas.addEventListener("touchstart", onDown, { passive: true });
  window.addEventListener("touchmove", onMove, { passive: true });
  window.addEventListener("touchend", onUp);
  // wheel / pinch zoom
  el.canvas.addEventListener("wheel", (e) => {
    if (state.focused >= 0 || state.scene !== "travel") return;
    e.preventDefault();
    state.cam.tRadius = clamp(state.cam.tRadius * (1 + Math.sign(e.deltaY)*0.08), 45, 260);
  }, { passive: false });

  el.introStar.addEventListener("click", start);
  el.panelClose.addEventListener("click", unfocus);
  el.panelLetterBtn.addEventListener("click", openLetter);
  el.letterDone.addEventListener("click", closeLetter);
  $$("[data-close]", el.letter).forEach((n) => n.addEventListener("click", closeLetter));
  el.wishBtn.addEventListener("click", openWish);
  el.wishForm.addEventListener("submit", sendWish);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (el.letter.classList.contains("open")) return;   // letter handles its own ESC
      if (state.focused >= 0) unfocus();
    }
  });

  // secret code: type GÜNEŞ / SUN
  let typed = "";
  document.addEventListener("keydown", (e) => {
    if (!e.key || e.key.length !== 1) return;
    typed = (typed + e.key).toLocaleUpperCase("tr").slice(-5);
    if (typed.endsWith("SUN") || typed === "GUNES" || typed === "GÜNEŞ") {
      if (Sound) Sound.chime();
      // a shooting star as a reward
      launchWishStar();
      typed = "";
    }
  });

  /* ============================================================= BOOT */
  buildLetter();
  buildProgress();
  onResize();
  body.classList.remove("is-loading");
  requestAnimationFrame(frame);

  /* Test-only hooks (active only with ?debug in the URL). */
  if (location.search.indexOf("debug") >= 0) {
    window.__u = {
      start, focusPlanet, unfocus, beginFinale, state, PLANETS,
      discoverAll() {
        PLANETS.forEach((_, i) => state.discovered.add(i));
        updateProgress(); evolve(); unlockSun();
      },
    };
  }
})();
