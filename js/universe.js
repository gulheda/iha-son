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
  const SECRETS = window.SUNSHINE.SECRETS || [];
  const Sound = window.SUNSHINE.Sound;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const body = document.body;

  const el = {
    canvas:     $("#scene"),
    label:      $("#planetLabel"),
    soundToggle:$("#soundToggle"),
    camBtn:     $("#camBtn"),
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
    finaleCamBtn:$("#finaleCamBtn"),
    secretToast:$("#secretToast"),
    starmap:    $("#starmap"),
    telescope:      $("#telescope"),
    telescopeVideo: $("#telescopeVideo"),
    telescopeCanvas:$("#telescopeCanvas"),
    telescopeCount: $("#telescopeCount"),
    telescopeFlash: $("#telescopeFlash"),
    telescopeAsk:   $("#telescopeAsk"),
    telescopeActions:$("#telescopeActions"),
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
  const ambient = new THREE.AmbientLight(0x2a3a55, 0.32);
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

  /* ---------------------------------------------- procedural planet worlds */
  function css255(col, a){ return "rgba("+((col.r*255)|0)+","+((col.g*255)|0)+","+((col.b*255)|0)+","+a+")"; }
  // A surface texture so planets look like worlds, not flat toy balls.
  function planetTexture(hex, style) {
    const w = 512, h = 256;
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    const base  = new THREE.Color(hex);
    const light = base.clone().lerp(new THREE.Color(0xffffff), 0.4);
    const dark  = base.clone().multiplyScalar(0.45);
    ctx.fillStyle = css255(base.clone().multiplyScalar(0.82), 1); ctx.fillRect(0, 0, w, h);
    if (style === "gas") {
      // soft horizontal bands, like a gas giant
      for (let i = 0; i < 30; i++) {
        const y = Math.random()*h, bh = 3 + Math.random()*14;
        ctx.fillStyle = css255(Math.random() < 0.5 ? light : dark, 0.1 + Math.random()*0.16);
        ctx.beginPath();
        for (let x = 0; x <= w; x += 8) { const yy = y + Math.sin(x/w*Math.PI*4 + i)*2.5; x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); }
        ctx.lineTo(w, y+bh); ctx.lineTo(0, y+bh); ctx.closePath(); ctx.fill();
      }
    } else {
      // marbled continents, like a rocky world
      for (let i = 0; i < 200; i++) {
        const x = Math.random()*w, y = Math.random()*h, r = 5 + Math.random()*38;
        const col = Math.random() < 0.5 ? light : dark;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, css255(col, 0.14 + Math.random()*0.12)); g.addColorStop(1, css255(col, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
      }
    }
    const pg = ctx.createLinearGradient(0, 0, 0, h);   // darken the poles
    pg.addColorStop(0,"rgba(0,0,0,0.28)"); pg.addColorStop(0.5,"rgba(0,0,0,0)"); pg.addColorStop(1,"rgba(0,0,0,0.28)");
    ctx.fillStyle = pg; ctx.fillRect(0, 0, w, h);
    const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
  }
  // A thin banded ring for the ringed planets.
  function ringTexture(hex) {
    const w = 256, h = 8;
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    const base = new THREE.Color(hex).lerp(new THREE.Color(0xffffff), 0.35);
    for (let x = 0; x < w; x++) {
      const edge = (x/w > 0.06 && x/w < 0.98) ? 1 : 0.15;
      const a = (0.12 + 0.5*Math.abs(Math.sin(x*0.4))) * edge;
      ctx.fillStyle = css255(base, a*0.7); ctx.fillRect(x, 0, 1, h);
    }
    const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
  }
  // A view-space fresnel shell → a realistic atmospheric rim glow.
  function atmosphere(hex, radius) {
    const mat = new THREE.ShaderMaterial({
      uniforms: { glowColor: { value: new THREE.Color(hex) }, p: { value: 3.4 }, cc: { value: 0.55 } },
      vertexShader:
        "varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal);" +
        " gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader:
        "uniform vec3 glowColor; uniform float p; uniform float cc; varying vec3 vN;" +
        " void main(){ float i = pow(cc - dot(vN, vec3(0.0,0.0,1.0)), p);" +
        " i = clamp(i, 0.0, 1.0); gl_FragColor = vec4(glowColor, i); }",
      side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
    });
    return new THREE.Mesh(new THREE.SphereGeometry(radius*1.22, 32, 32), mat);
  }

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
  // A generous invisible hit-sphere so the sun is easy to tap (raycastable
  // but never drawn). Checked AFTER planets, so inner planets stay clickable.
  const sunHit = new THREE.Mesh(
    new THREE.SphereGeometry(13, 16, 16),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  sunHit.userData.isSun = true;
  sunGroup.add(sunHit);

  /* ------------------------------------------------------------- PLANETS */
  const planetMeshes = [];
  PLANETS.forEach((p, i) => {
    const pivot = new THREE.Group();
    pivot.rotation.y = p.phase || 0;
    scene.add(pivot);

    // orbit position + a gentle axial tilt for character
    const tilt = new THREE.Group();
    tilt.position.x = p.orbit;
    tilt.rotation.z = (i % 2 ? 1 : -1) * (0.12 + (i * 0.05));
    pivot.add(tilt);

    const R = p.size * 1.7;
    const tex = planetTexture(p.color, p.style || "rocky");
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(R, 48, 48),
      new THREE.MeshStandardMaterial({
        map: tex, bumpMap: tex, bumpScale: 0.12,
        roughness: 0.94, metalness: 0.0,
        emissive: new THREE.Color(p.color).multiplyScalar(0.03) }));
    mesh.userData = { index: i, planet: p, baseScale: 1 };
    tilt.add(mesh);
    mesh.add(atmosphere(p.color, R));               // realistic rim glow

    if (p.ring) {                                    // an elegant planetary ring
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(R * 1.5, R * 2.4, 96),
        new THREE.MeshBasicMaterial({ map: ringTexture(p.color), side: THREE.DoubleSide,
          transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
      ring.rotation.x = Math.PI * 0.5 - 0.35;
      mesh.add(ring);
    }

    // faint orbit path on the ecliptic
    const path = new THREE.Mesh(
      new THREE.RingGeometry(p.orbit - 0.05, p.orbit + 0.05, 160),
      new THREE.MeshBasicMaterial({ color: 0x2a3550, side: THREE.DoubleSide,
        transparent: true, opacity: 0.26, depthWrite: false }));
    path.rotation.x = Math.PI / 2; scene.add(path);

    planetMeshes.push(mesh);
    PLANETS[i]._pivot = pivot; PLANETS[i]._mesh = mesh;
  });

  /* --------------------------------------------------------- ASTEROID BELT */
  function makeBelt(inner, outer, count) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = inner + Math.random() * (outer - inner);
      const a = Math.random() * Math.PI * 2;
      pos[i*3]   = Math.cos(a) * r;
      pos[i*3+1] = (Math.random() - 0.5) * 1.6;
      pos[i*3+2] = Math.sin(a) * r;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ size: 0.45, color: 0x8c7a60,
      transparent: true, opacity: 0.75, depthWrite: false, sizeAttenuation: true });
    return new THREE.Points(geo, mat);
  }
  const belt = makeBelt(40, 43.6, coarse ? 400 : 850);
  scene.add(belt);

  /* ----------------------------------------------------- HIDDEN SECRET STARS */
  // Hidden easter-egg worlds: small planets that reveal a message when tapped.
  const secretMeshes = [];
  SECRETS.forEach((s, i) => {
    const col = s.color || "#c98b84";
    const R = 2.3;
    const tex = planetTexture(col, i % 2 ? "gas" : "rocky");
    const m = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 32),
      new THREE.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 0.08,
        roughness: 0.9, metalness: 0, emissive: new THREE.Color(col).multiplyScalar(0.06) }));
    m.position.set(s.pos[0], s.pos[1], s.pos[2]);
    m.add(atmosphere(col, R));
    m.userData = { secret: i, found: false, spin: 0.2 + Math.random()*0.3 };
    scene.add(m); secretMeshes.push(m);
  });

  /* ------------------------------------------------- HIDDEN TELESCOPE STAR */
  // A distinct cool-white star hides the telescope (the "one more memory").
  const scopeMesh = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, color: 0x9fd4ff,
    transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
  scopeMesh.position.set(-34, 22, 42);
  scopeMesh.scale.set(7, 7, 1);
  scopeMesh.userData = { scope: true };
  scene.add(scopeMesh);

  /* -------------------------------------------------------- SHOOTING STARS */
  const shooters = [];
  let nextShooter = 3;
  function spawnShooter() {
    const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, color: 0xffffff,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    head.scale.set(4, 4, 1);
    const trail = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xfff2cf,
      transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
    trail.scale.set(34, 3.4, 1);
    const side = Math.random() < 0.5 ? -1 : 1;
    head.position.set((Math.random()*2-1)*260, 60 + Math.random()*120, -180 - Math.random()*220);
    trail.position.copy(head.position);
    const vel = new THREE.Vector3((-side)*(60 + Math.random()*50), -(20 + Math.random()*30), 20 + Math.random()*30);
    scene.add(head, trail);
    shooters.push({ head, trail, vel, life: 0, ttl: 2.2 + Math.random()*1.2 });
  }
  const _sa = new THREE.Vector3(), _sb = new THREE.Vector3();
  function updateShooters(dt) {
    if ((state.scene === "travel" || state.scene === "focus") && !prefersReduced) {
      nextShooter -= dt;
      if (nextShooter <= 0) { spawnShooter(); nextShooter = 5 + Math.random()*8; }
    }
    for (let i = shooters.length - 1; i >= 0; i--) {
      const s = shooters[i]; s.life += dt;
      s.head.position.addScaledVector(s.vel, dt);
      s.trail.position.copy(s.head.position);
      _sa.copy(s.head.position).project(camera);
      _sb.copy(s.head.position).addScaledVector(s.vel, -0.1).project(camera);
      s.trail.material.rotation = Math.atan2((_sa.y-_sb.y)*window.innerHeight, (_sa.x-_sb.x)*window.innerWidth);
      const k = s.life / s.ttl, fade = k < 0.2 ? k/0.2 : 1 - (k-0.2)/0.8;
      s.head.material.opacity = Math.max(0, fade);
      s.trail.material.opacity = Math.max(0, fade*0.7);
      if (s.life >= s.ttl) { scene.remove(s.head, s.trail); shooters.splice(i, 1); }
    }
  }

  /* ---------------------------------------------------- secret reveal + petals */
  let secretTimer = null;
  function toast(text) {
    el.secretToast.textContent = text;
    el.secretToast.classList.add("show");
    el.secretToast.setAttribute("aria-hidden", "false");
    clearTimeout(secretTimer);
    secretTimer = setTimeout(() => {
      el.secretToast.classList.remove("show");
      el.secretToast.setAttribute("aria-hidden", "true");
    }, 4500);
  }
  function revealSecret(i, obj) {
    if (!obj.userData.found) {
      obj.userData.found = true;
      if (obj.material && obj.material.emissive) obj.material.emissive.setScalar(0.22);
      tween(obj.scale, { x: 1.4, y: 1.4, z: 1.4 }, 0.6, easeOut);
      Sound && Sound.chime();
    }
    toast(SECRETS[i].text);
  }
  // Golden confetti burst (used at the birthday reveal and after a photo).
  function confettiBurst() {
    if (prefersReduced) return;
    const colors = ["#E8B04A", "#F6D889", "#FFF3D0", "#DDA7A0", "#FFFFFF"];
    for (let i = 0; i < 80; i++) {
      const d = document.createElement("div");
      d.className = "confetti";
      d.style.background = colors[i % colors.length];
      const ang = Math.random() * Math.PI * 2, dist = 100 + Math.random() * 300;
      d.style.setProperty("--tx", Math.cos(ang) * dist + "px");
      d.style.setProperty("--ty", (Math.sin(ang) * dist - 60) + "px");
      d.style.setProperty("--rot", (Math.random() * 720 - 360) + "deg");
      d.style.animationDelay = (Math.random() * 0.18) + "s";
      const sz = 6 + Math.random() * 7;
      d.style.width = d.style.height = sz + "px";
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 2700);
    }
  }
  function spawnPetals() {
    if (prefersReduced) return;
    for (let i = 0; i < 16; i++) {
      const petal = document.createElement("div");
      petal.className = "petal";
      petal.style.left = (Math.random()*100) + "vw";
      petal.style.setProperty("--drift", (Math.random()*160 - 80) + "px");
      const dur = 5 + Math.random()*4;
      petal.style.animationDuration = dur + "s";
      petal.style.animationDelay = (Math.random()*2) + "s";
      const sz = (10 + Math.random()*10);
      petal.style.width = petal.style.height = sz + "px";
      document.body.appendChild(petal);
      setTimeout(() => petal.remove(), (dur + 2.5) * 1000);
    }
  }

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
    const hits = raycaster.intersectObjects(planetMeshes, false);
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
      // hover highlight (planets, then hidden stars)
      const hit = pickPlanet();
      updateHover(hit);
      if (!hit) {
        raycaster.setFromCamera(ndc, camera);
        const onScope = raycaster.intersectObject(scopeMesh, false)[0];
        const onSecret = secretMeshes.length && raycaster.intersectObjects(secretMeshes, false)[0];
        const onSun = raycaster.intersectObject(sunHit, false)[0];
        el.canvas.classList.toggle("hovering", !!(onScope || onSecret || onSun));
        if (onScope) { el.label.textContent = "Teleskop"; el.label.classList.add("show"); positionLabel(scopeMesh); }
        else if (onSun) {
          el.label.textContent = state.sunUnlocked ? CONFIG.friendName : "Güneş — kilitli";
          el.label.classList.add("show"); positionLabel(sunCore);
        } else el.label.classList.remove("show");
      }
    }
  }
  function onUp(e) {
    if (!state.dragging) return;
    state.dragging = false; el.canvas.classList.remove("grabbing");
    if (state.moved) return;                       // a drag, not a tap
    if (state.focused >= 0) { unfocus(); return; } // tap anywhere outside the panel → back to orbit
    if (state.scene === "travel") {
      raycaster.setFromCamera(ndc, camera);
      // telescope star, then hidden stars, then planets, then the sun
      if (raycaster.intersectObject(scopeMesh, false)[0]) { openTelescope(); return; }
      if (secretMeshes.length) {
        const sHit = raycaster.intersectObjects(secretMeshes, false)[0];
        if (sHit) { revealSecret(sHit.object.userData.secret, sHit.object); return; }
      }
      const hit = pickPlanet();
      if (hit && hit.userData.index != null) { focusPlanet(hit.userData.index); return; }
      if (raycaster.intersectObject(sunHit, false)[0]) {
        if (state.sunUnlocked) beginFinale();
        else {
          const left = state.total - state.discovered.size;
          toast(CONFIG.sunLocked + " (" + left + " kaldı)");
        }
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
    if (p.petals) spawnPetals();
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
    tween(renderer, { toneMappingExposure: 1.7 }, 4);
    tween(sunLight, { intensity: 6 }, 4);
    tween(sunCore.scale, { x: 3.4, y: 3.4, z: 3.4 }, 5);
    sunGlows.forEach((g) => tween(g.material, { opacity: Math.min(1, g.material.opacity * 2) }, 4));
    // clear the sky so the screen becomes pure light
    [starsFar, starsNear, starsBloom, belt].forEach((o) => tween(o.material, { opacity: 0 }, 3));
    nebulas.forEach((n) => tween(n.material, { opacity: 0 }, 3));
    if (scopeMesh) tween(scopeMesh.material, { opacity: 0 }, 2);
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
      confettiBurst();
    }, 900);
    setTimeout(showStarmap, 8000);   // calm astronomical closer
  }

  /* ==================================================== STAR MAP (closer) */
  const smLines = [], smStars = [];
  function buildStarmap() {
    $("#starmapEyebrow").textContent = CONFIG.starmapEyebrow;
    $("#starmapTitle").textContent   = CONFIG.friendName + " Takımyıldızı";
    $("#starmapCaption").textContent = CONFIG.starmapCaption;
    $("#starmapClose").textContent   = CONFIG.starmapClose;
    const svg = $("#starmapSvg");
    const NS = "http://www.w3.org/2000/svg";
    // an elegant constellation (viewBox 600 x 340)
    const pts = [[92,150],[172,88],[262,128],[330,78],[420,116],[500,86],
                 [540,168],[452,198],[360,176],[268,228],[178,206],[122,268]];
    const links = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[2,8],[4,7]];
    const sun = [330, 158], sunLinks = [3, 8, 2];
    const segs = links.map(([a, b]) => [pts[a], pts[b]]).concat(sunLinks.map((i) => [sun, pts[i]]));
    segs.forEach(([a, b], i) => {
      const l = document.createElementNS(NS, "line");
      l.setAttribute("x1", a[0]); l.setAttribute("y1", a[1]);
      l.setAttribute("x2", b[0]); l.setAttribute("y2", b[1]);
      l.setAttribute("class", "sm-line");
      const len = Math.hypot(a[0]-b[0], a[1]-b[1]);
      l.style.strokeDasharray = len; l.style.strokeDashoffset = len;
      l.style.transition = "stroke-dashoffset 1.1s var(--ease) " + (0.4 + i*0.09) + "s";
      svg.appendChild(l); smLines.push(l);
    });
    pts.forEach((p, i) => {
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", p[0]); c.setAttribute("cy", p[1]); c.setAttribute("r", 2.8);
      c.setAttribute("class", "sm-star");
      c.style.opacity = "0"; c.style.transition = "opacity .7s var(--ease) " + (0.2 + i*0.09) + "s";
      svg.appendChild(c); smStars.push(c);
    });
    const cs = document.createElementNS(NS, "circle");
    cs.setAttribute("cx", sun[0]); cs.setAttribute("cy", sun[1]); cs.setAttribute("r", 6);
    cs.setAttribute("class", "sm-star sun");
    cs.style.opacity = "0"; cs.style.transition = "opacity 1s var(--ease) 1.7s";
    svg.appendChild(cs); smStars.push(cs);
    const label = document.createElementNS(NS, "text");
    label.setAttribute("x", sun[0]); label.setAttribute("y", sun[1] - 14);
    label.setAttribute("text-anchor", "middle"); label.setAttribute("class", "sm-label");
    label.textContent = CONFIG.friendName;
    label.style.opacity = "0"; label.style.transition = "opacity 1.1s var(--ease) 2.1s";
    svg.appendChild(label); smStars.push(label);
  }
  function showStarmap() {
    if (state.scene === "starmap") return;
    // don't interrupt the camera moment — wait until it's closed
    if (el.telescope.classList.contains("open")) { setTimeout(showStarmap, 4000); return; }
    state.scene = "starmap";
    el.finale.classList.remove("show");
    el.starmap.setAttribute("aria-hidden", "false");
    el.starmap.classList.add("show");
    body.dataset.scene = "starmap";
    requestAnimationFrame(() => {
      smLines.forEach((l) => l.style.strokeDashoffset = "0");
      smStars.forEach((s) => s.style.opacity = "1");
    });
  }

  /* ==================================================== TELESCOPE / CAMERA */
  let scopeStream = null;
  function openTelescope() {
    el.telescope.classList.add("open");
    el.telescope.classList.remove("captured");
    el.telescope.setAttribute("aria-hidden", "false");
    el.telescopeAsk.textContent = CONFIG.telescopeAsk;
    scopeActions([[CONFIG.telescopeOpen, startCamera, true]]);
  }
  function closeTelescope() {
    if (scopeStream) { scopeStream.getTracks().forEach((t) => t.stop()); scopeStream = null; }
    el.telescope.classList.remove("open", "captured");
    el.telescope.setAttribute("aria-hidden", "true");
    el.telescopeActions.innerHTML = "";
  }
  function scopeActions(list) {
    el.telescopeActions.innerHTML = "";
    list.forEach(([label, fn, gold]) => {
      const b = document.createElement("button");
      b.className = "btn" + (gold ? " btn--gold" : "");
      b.type = "button"; b.textContent = label;
      b.addEventListener("click", fn);
      el.telescopeActions.appendChild(b);
    });
  }
  async function startCamera() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error("no api");
      scopeStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      el.telescopeVideo.srcObject = scopeStream;
      await el.telescopeVideo.play();
      el.telescopeAsk.textContent = "";
      scopeActions([[CONFIG.telescopeShoot, shootPhoto, true]]);
    } catch (err) {
      el.telescopeAsk.textContent = CONFIG.telescopeNoCam;
      scopeActions([]);
    }
  }
  function shootPhoto() {
    el.telescopeActions.innerHTML = "";
    let n = 3;
    el.telescopeCount.textContent = n;
    el.telescopeCount.classList.add("show");
    const iv = setInterval(() => {
      n--;
      if (n > 0) { el.telescopeCount.textContent = n; }
      else {
        clearInterval(iv);
        el.telescopeCount.classList.remove("show");
        el.telescopeFlash.classList.add("go");
        setTimeout(() => el.telescopeFlash.classList.remove("go"), 600);
        Sound && Sound.chime();
        captureShot();
      }
    }, 850);
  }
  function captureShot() {
    const v = el.telescopeVideo, c = el.telescopeCanvas, size = 720;
    c.width = size; c.height = size;
    const ctx = c.getContext("2d");
    const vw = v.videoWidth || 640, vh = v.videoHeight || 480;
    const s = Math.max(size/vw, size/vh), dw = vw*s, dh = vh*s;
    ctx.save(); ctx.translate(size, 0); ctx.scale(-1, 1);          // mirror to match preview
    ctx.drawImage(v, (size-dw)/2, (size-dh)/2, dw, dh);
    ctx.restore();
    drawFrameArt(ctx, size);
    el.telescope.classList.add("captured");
    scopeActions([[CONFIG.telescopeSave, savePhoto, true], [CONFIG.telescopeAgain, retryShot, false]]);
    confettiBurst();          // golden confetti after the shot
  }
  function drawFrameArt(ctx, size) {
    const g = ctx.createRadialGradient(size/2, size/2, size*0.28, size/2, size/2, size*0.55);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(10,6,2,0.6)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "rgba(232,176,74,0.85)"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(size/2, size/2, size/2 - 14, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = "rgba(246,216,137,0.9)";
    for (let i = 0; i < 46; i++) {
      const a = Math.random()*Math.PI*2, r = size/2 - 26 - Math.random()*46;
      ctx.beginPath(); ctx.arc(size/2 + Math.cos(a)*r, size/2 + Math.sin(a)*r, Math.random()*1.6 + 0.4, 0, Math.PI*2); ctx.fill();
    }
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,246,222,0.96)"; ctx.font = "600 30px Georgia, serif";
    ctx.fillText(CONFIG.fromName + " & " + CONFIG.friendName, size/2, size - 58);
    ctx.fillStyle = "rgba(246,216,137,0.9)"; ctx.font = "300 17px system-ui, sans-serif";
    let ds = ""; try { ds = new Date().toLocaleDateString("tr-TR"); } catch (e) {}
    ctx.fillText("FIND YOUR SUNSHINE" + (ds ? "  ·  " + ds : ""), size/2, size - 32);
  }
  function savePhoto() {
    try {
      const a = document.createElement("a");
      a.download = "find-your-sunshine.png";
      a.href = el.telescopeCanvas.toDataURL("image/png");
      a.click();
    } catch (e) {}
  }
  function retryShot() {
    el.telescope.classList.remove("captured");
    scopeActions([[CONFIG.telescopeShoot, shootPhoto, true]]);
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
    // asteroid belt + shooting stars
    belt.rotation.y += dt * 0.02;
    updateShooters(dt);
    // hidden worlds gently spin + pulse
    for (const m of secretMeshes) {
      m.rotation.y += dt * (m.userData.spin || 0.3);
      if (!m.userData.found) { const s = 1 + Math.sin(state.time * 2 + m.position.x) * 0.06; m.scale.set(s, s, s); }
    }
    // telescope star pulse
    if (scopeMesh.material.opacity > 0.01) {
      const ss = 7 * (1 + Math.sin(state.time * 1.6) * 0.18);
      scopeMesh.scale.set(ss, ss, 1);
    }

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
  el.finaleCamBtn.addEventListener("click", openTelescope);
  el.camBtn.addEventListener("click", openTelescope);
  $$("[data-tclose]", el.telescope).forEach((n) => n.addEventListener("click", closeTelescope));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (el.letter.classList.contains("open")) return;   // letter handles its own ESC
      if (el.telescope.classList.contains("open")) { closeTelescope(); return; }
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
  buildStarmap();
  onResize();
  body.classList.remove("is-loading");
  requestAnimationFrame(frame);

  /* Test-only hooks (active only with ?debug in the URL). */
  if (location.search.indexOf("debug") >= 0) {
    window.__u = {
      start, focusPlanet, unfocus, beginFinale, state, PLANETS,
      spawnShooter, revealSecret, secretMeshes, shooters,
      openTelescope, showStarmap, scopeMesh,
      discoverAll() {
        PLANETS.forEach((_, i) => state.discovered.add(i));
        updateProgress(); evolve(); unlockSun();
      },
    };
  }
})();
