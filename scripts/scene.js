/* =========================================================================
   SCENE — atmospheric particles.
   1. Drifting motes (dust/embers) in the background.
   2. Canvas smoke rising from the incense burner when lit.

   Performance: smoke uses a single pre-rendered puff sprite drawn via
   drawImage with varying alpha/scale (cheap). The rAF loop self-pauses
   when there is nothing to render. Respects prefers-reduced-motion.
   ========================================================================= */
window.Chua = window.Chua || {};

(function (Chua) {
  "use strict";

  let motesEl = null;
  let moteTimer = null;
  let reduced = true;

  /* ---- smoke ---- */
  let canvas = null;
  let ctx = null;
  let dpr = 1;
  let puff = null;
  let particles = [];
  let smoking = false;
  let raf = null;
  let originCache = null;

  function refreshMotionPref() {
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* ---- motes ---- */
  function spawnMote() {
    if (!motesEl || reduced) return;
    if (motesEl.childElementCount > 22) return;

    const mote = document.createElement("span");
    mote.className = "mote";
    mote.style.left = Math.random() * 100 + "%";
    mote.style.setProperty("--mx", Math.random() * 40 - 20 + "px");
    const dur = Math.random() * 6 + 6;
    mote.style.animationDuration = dur + "s";
    motesEl.appendChild(mote);

    const remove = function () {
      if (mote.parentNode) mote.parentNode.removeChild(mote);
    };
    mote.addEventListener("animationend", remove, { once: true });
    window.setTimeout(remove, (dur + 1) * 1000);
  }

  function startMotes() {
    if (!motesEl || reduced) return;
    // seed a few immediately so the scene isn't empty on load
    for (let i = 0; i < 6; i++) window.setTimeout(spawnMote, i * 250);
    moteTimer = window.setInterval(function () {
      spawnMote();
      if (Math.random() > 0.5) spawnMote();
    }, 800);
  }

  /* ---- smoke canvas ---- */
  function makePuff() {
    const size = 64;
    const off = document.createElement("canvas");
    off.width = size;
    off.height = size;
    const c = off.getContext("2d");
    const g = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(236, 230, 216, 0.55)");
    g.addColorStop(0.5, "rgba(236, 230, 216, 0.18)");
    g.addColorStop(1, "rgba(236, 230, 216, 0)");
    c.fillStyle = g;
    c.beginPath();
    c.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    c.fill();
    return off;
  }

  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    originCache = null; // burner position may have shifted
  }

  function getOrigin() {
    if (originCache) return originCache;
    const burner = document.getElementById("burner");
    const cb = canvas.getBoundingClientRect();
    if (burner) {
      const bb = burner.getBoundingClientRect();
      originCache = {
        x: (bb.left + bb.width / 2 - cb.left) * dpr,
        y: (bb.top + bb.height * 0.05 - cb.top) * dpr,
      };
    } else {
      originCache = { x: cb.width / 2, y: cb.height * 0.72 };
    }
    return originCache;
  }

  function spawnSmoke() {
    const o = getOrigin();
    const spread = 7 * dpr;
    particles.push({
      x: o.x + (Math.random() - 0.5) * spread,
      y: o.y,
      vx: (Math.random() - 0.5) * 0.3 * dpr,
      vy: -(0.5 + Math.random() * 0.6) * dpr,
      r: (Math.random() * 6 + 5) * dpr,
      life: 0,
      max: 140 + Math.random() * 90,
      wob: Math.random() * Math.PI * 2,
      wobSpeed: (Math.random() - 0.5) * 0.05,
    });
  }

  function step() {
    raf = null;
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (smoking && !reduced) {
      const spawns = particles.length < 60 ? 2 : 1;
      for (let i = 0; i < spawns; i++) spawnSmoke();
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += 1;
      p.wob += p.wobSpeed;
      p.x += p.vx + Math.sin(p.wob) * 0.4 * dpr;
      p.y += p.vy;
      p.vy *= 0.995;
      p.r += 0.16 * dpr;

      const t = p.life / p.max;
      if (t >= 1 || p.y < -p.r) {
        particles.splice(i, 1);
        continue;
      }

      const alpha = Math.sin(Math.min(t, 1) * Math.PI) * 0.16;
      ctx.globalAlpha = alpha;
      const size = p.r * 2;
      ctx.drawImage(puff, p.x - p.r, p.y - p.r, size, size);
    }
    ctx.globalAlpha = 1;

    // keep the loop alive only while there is something to animate
    if (smoking || particles.length > 0) {
      raf = window.requestAnimationFrame(step);
    }
  }

  function ensureLoop() {
    if (raf) return;
    if (!ctx) {
      ctx = canvas.getContext("2d");
      if (!ctx) return;
    }
    if (!puff) puff = makePuff();
    resize();
    raf = window.requestAnimationFrame(step);
  }

  function startSmoke() {
    if (!canvas) return;
    smoking = true;
    ensureLoop();
  }

  function stopSmoke() {
    // let existing particles drift away, then the loop self-pauses
    smoking = false;
  }

  function init() {
    motesEl = document.getElementById("motes");
    canvas = document.getElementById("smoke");
    refreshMotionPref();

    if (canvas) {
      window.addEventListener("resize", resize);
      // re-measure once layout/fonts have settled
      window.addEventListener("load", resize);
    }

    startMotes();
  }

  Chua.scene = {
    init: init,
    startSmoke: startSmoke,
    stopSmoke: stopSmoke,
  };
})(window.Chua);
