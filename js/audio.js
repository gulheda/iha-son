/* =============================================================================
   audio.js — sound for Find Your Sunshine
   -----------------------------------------------------------------------------
   Everything here is optional and fail-safe: if the Web Audio API is missing or
   an audio file fails to load, the site keeps working in silence.

   Two layers:
     1) A generated ambient bed (soft pad + gentle "night wind"), so the site
        has atmosphere even with no audio files at all.
     2) An optional music track (CONFIG.musicSrc) layered on top if you add one.

   Browsers block sound until the first user gesture — so nothing starts until
   the visitor interacts, and the sound toggle (top-right) controls it after.
   ========================================================================== */

const Sound = (() => {
  const { CONFIG } = window.SUNSHINE;

  let ctx = null;             // AudioContext
  let master = null;          // master gain
  let started = false;        // ambience running?
  let enabled = false;        // user wants sound on?
  let music = null;           // main track (e.g. La Vie en Rose)
  let finaleMusic = null;     // finale track (e.g. Ebru Yaşar)
  let onFinaleTrack = false;
  const nodes = [];           // keep references so we can stop cleanly

  /* Create the context lazily (needs a user gesture on most browsers). */
  function ensureContext() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;                 // fade in later
      master.connect(ctx.destination);
      return true;
    } catch (e) {
      console.info("Audio unavailable — continuing silently.");
      return false;
    }
  }

  /* A warm, slow pad built from a few detuned sine oscillators. */
  function buildPad() {
    const padGain = ctx.createGain();
    padGain.gain.value = 0.06;
    padGain.connect(master);

    // A soft, consonant chord (low, unobtrusive).
    const freqs = [110, 164.81, 220, 277.18]; // A2, E3, A3, C#4
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      osc.detune.value = (i - 1.5) * 6;       // gentle chorus

      // Slow tremolo so the pad "breathes".
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.06 + i * 0.017;
      lfoGain.gain.value = 0.5;
      lfo.connect(lfoGain);
      const voiceGain = ctx.createGain();
      voiceGain.gain.value = 0.5;
      lfoGain.connect(voiceGain.gain);

      osc.connect(voiceGain).connect(padGain);
      osc.start(); lfo.start();
      nodes.push(osc, lfo);
    });
  }

  /* "Night wind": filtered noise that slowly swells and fades. */
  function buildWind() {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 480;
    filter.Q.value = 0.7;

    const windGain = ctx.createGain();
    windGain.gain.value = 0.015;

    // Slowly modulate the wind volume for a living feel.
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.04;
    lfoGain.gain.value = 0.012;
    lfo.connect(lfoGain).connect(windGain.gain);

    noise.connect(filter).connect(windGain).connect(master);
    noise.start(); lfo.start();
    nodes.push(noise, lfo);
  }

  /* Optional music files: a main track and a finale track. */
  function makeTrack(src) {
    if (!src) return null;
    try {
      const a = new Audio(src);
      a.loop = true; a.volume = 0;
      a.addEventListener("error", () => console.info("Music file not found: " + src));
      return a;
    } catch (e) { return null; }
  }
  function buildMusic() {
    music = makeTrack(CONFIG.musicSrc);
    finaleMusic = makeTrack(CONFIG.finaleMusicSrc);
  }
  // Fade any <audio> element's volume smoothly.
  function fadeEl(a, target, steps = 24, ms = 60) {
    if (!a) return;
    const step = (target - a.volume) / steps; let i = 0;
    const t = setInterval(() => {
      a.volume = Math.min(1, Math.max(0, a.volume + step));
      if (++i >= steps) { a.volume = target; clearInterval(t); if (target === 0) a.pause(); }
    }, ms);
  }
  // Cross-fade from the main track to the finale track (Ebru Yaşar moment).
  function toFinaleTrack() {
    if (onFinaleTrack) return;
    onFinaleTrack = true;
    if (!enabled) return;
    if (music) fadeEl(music, 0);
    if (finaleMusic) { finaleMusic.play().catch(() => {}); fadeEl(finaleMusic, 0.8); }
  }
  function activeTrack() { return onFinaleTrack ? finaleMusic : music; }

  /* Start the whole bed once (idempotent). */
  function start() {
    if (started) return;
    if (!ensureContext()) return;
    buildPad();
    buildWind();
    buildPiano();
    buildMusic();
    started = true;
  }

  /* A soft, sparse piano — slow warm notes that drift over the pad. Routed
     through the master gain, so muting silences it too. */
  function pianoNote(freq, when, dur, gain) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    o.type = "triangle"; o.frequency.value = freq;
    lp.type = "lowpass"; lp.frequency.value = 1500;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gain, when + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(lp).connect(g).connect(master);
    o.start(when); o.stop(when + dur + 0.05);
    nodes.push(o);
  }
  const pianoScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33];
  function buildPiano() {
    function scheduleNext() {
      if (!ctx) return;
      const n = pianoScale[Math.floor(Math.random() * pianoScale.length)];
      const now = ctx.currentTime + 0.05;
      pianoNote(n, now, 2.6, 0.05);
      if (Math.random() < 0.3) pianoNote(n * 1.5, now + 0.09, 2.2, 0.028);  // soft fifth
      setTimeout(scheduleNext, 1900 + Math.random() * 2400);
    }
    scheduleNext();
  }

  /* Smoothly ramp the master gain. */
  function ramp(target, time = 1.2) {
    if (!ctx || !master) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(target, now + time);
  }

  /* ------------------------------------------------------------- Public API */

  // Turn sound on (also used for the very first gesture).
  function on() {
    start();
    if (ctx && ctx.state === "suspended") ctx.resume();
    enabled = true;
    ramp(0.9, 1.4);
    const tr = activeTrack();
    if (tr) { tr.play().catch(() => {}); fadeEl(tr, onFinaleTrack ? 0.8 : 0.6); }
  }

  function off() {
    enabled = false;
    ramp(0, 0.8);
    if (music) fadeEl(music, 0);
    if (finaleMusic) fadeEl(finaleMusic, 0);
  }

  function toggle() { enabled ? off() : on(); return enabled; }
  function isOn() { return enabled; }

  /* A short warm chime when a memory is discovered. */
  function chime() {
    if (!enabled || !ensureContext()) return;
    const now = ctx.currentTime;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
    g.connect(master || ctx.destination);
    [880, 1174.66].forEach((f, i) => {           // A5 + D6 sparkle
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const og = ctx.createGain();
      og.gain.value = i ? 0.5 : 1;
      o.connect(og).connect(g);
      o.start(now + i * 0.06);
      o.stop(now + 1.2);
    });
  }

  /* A rising swell for the sunrise. */
  function swell() {
    if (!enabled || !ensureContext()) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(110, now);
    o.frequency.exponentialRampToValueAtTime(220, now + 6);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.14, now + 3);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 7);
    o.connect(g).connect(master || ctx.destination);
    o.start(now); o.stop(now + 7.2);
    const tr = activeTrack();
    if (tr && enabled) fadeEl(tr, onFinaleTrack ? 0.85 : 0.75);
  }

  return { on, off, toggle, isOn, chime, swell, start, toFinaleTrack };
})();

window.SUNSHINE.Sound = Sound;
