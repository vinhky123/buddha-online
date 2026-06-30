/* =========================================================================
   AUDIO — WebAudio synth (no external assets).
   Temple bell, bright chime, soft tone, ambient drone pad.
   Context is created lazily and resumed on the first user gesture
   (browsers block autoplay otherwise). Every method no-ops gracefully
   if WebAudio is unavailable.
   ========================================================================= */
window.Chua = window.Chua || {};

(function (Chua) {
  "use strict";

  const AC = window.AudioContext || window.webkitAudioContext;

  let ctx = null;
  let master = null;
  let ambientNodes = null;
  let ambientOn = false;

  function ensure() {
    if (ctx) return ctx;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.85;
    master.connect(ctx.destination);
    return ctx;
  }

  function resume() {
    const c = ensure();
    if (c && c.state === "suspended") c.resume();
    return c;
  }

  /* A single decaying partial. */
  function partial(freq, start, dur, peak, type) {
    const t0 = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    osc.connect(g);
    g.connect(master);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  /* Short filtered noise burst for the strike transient. */
  function noiseBurst(dur, peak) {
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = "bandpass";
    filt.frequency.value = 1700;
    filt.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.value = peak;
    src.connect(filt);
    filt.connect(g);
    g.connect(master);
    const t0 = ctx.currentTime;
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  /* Warm bronze temple bell built from inharmonic partials. */
  function bell(centerFreq) {
    const c = resume();
    if (!c) return;
    const f = centerFreq || 196;
    const partials = [
      { m: 1.0,  g: 0.50, d: 3.4 },
      { m: 2.01, g: 0.26, d: 2.5 },
      { m: 2.76, g: 0.18, d: 1.9 },
      { m: 4.07, g: 0.12, d: 1.3 },
      { m: 5.43, g: 0.06, d: 0.9 },
    ];
    for (const p of partials) partial(f * p.m, 0, p.d, p.g * 0.5);
    noiseBurst(0.18, 0.1);
  }

  /* Bright ascending two-note chime (prayer offered). */
  function chime() {
    const c = resume();
    if (!c) return;
    [523.25, 783.99].forEach((freq, i) => {
      const t0 = c.currentTime + i * 0.12;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(g);
      g.connect(master);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.16, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.6);
      osc.start(t0);
      osc.stop(t0 + 1.7);
    });
  }

  /* Gentle single swell (incense lit, lantern released). */
  function soft() {
    const c = resume();
    if (!c) return;
    partial(392, 0, 1.8, 0.14, "sine");
    partial(587.33, 0.04, 1.4, 0.07, "sine");
  }

  /* Soft ambient drone pad — a low root and fifth with a slow swell. */
  function startAmbient() {
    const c = resume();
    if (!c || ambientOn) return;
    ambientOn = true;

    const pad = c.createGain();
    pad.gain.value = 0.0001;
    const filt = c.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = 420;
    filt.Q.value = 0.4;
    pad.connect(filt);
    filt.connect(master);

    const freqs = [110, 110.6, 164.81]; // A2 (detuned pair) + E3 fifth
    const oscs = freqs.map((freq, i) => {
      const osc = c.createOscillator();
      osc.type = i === 2 ? "triangle" : "sine";
      osc.frequency.value = freq;
      const og = c.createGain();
      og.gain.value = i === 2 ? 0.22 : 0.5;
      osc.connect(og);
      og.connect(pad);
      osc.start();
      return osc;
    });

    const lfo = c.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 0.045;
    lfo.connect(lfoGain);
    lfoGain.connect(pad.gain);
    lfo.start();

    pad.gain.exponentialRampToValueAtTime(0.1, c.currentTime + 2.5);
    ambientNodes = { pad: pad, oscs: oscs, lfo: lfo };
  }

  function stopAmbient() {
    if (!ctx || !ambientOn || !ambientNodes) return;
    ambientOn = false;
    const t = ctx.currentTime;
    const pad = ambientNodes.pad;
    pad.gain.cancelScheduledValues(t);
    pad.gain.setValueAtTime(0.0001, t);
    pad.gain.linearRampToValueAtTime(0.0001, t + 1.2);
    ambientNodes.oscs.forEach((osc) => osc.stop(t + 1.3));
    ambientNodes.lfo.stop(t + 1.3);
    ambientNodes = null;
  }

  Chua.audio = {
    bell: bell,
    chime: chime,
    soft: soft,
    startAmbient: startAmbient,
    stopAmbient: stopAmbient,
    get isAmbient() {
      return ambientOn;
    },
  };
})(window.Chua);
