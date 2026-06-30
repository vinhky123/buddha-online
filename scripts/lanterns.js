/* =========================================================================
   LANTERNS — release rising sky lanterns into the scene.
   Each lantern is an <svg><use href="#ico-lantern"></svg> animated by the
   lantern-rise keyframe in lanterns.css. Honors prefers-reduced-motion.
   ========================================================================= */
window.Chua = window.Chua || {};

(function (Chua) {
  "use strict";

  const SVGNS = "http://www.w3.org/2000/svg";
  let container = null;
  let reduced = true;

  function refreshMotionPref() {
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function spawn() {
    if (!container) return;

    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("class", "rising-lantern");

    const use = document.createElementNS(SVGNS, "use");
    use.setAttribute("href", "#ico-lantern");
    svg.appendChild(use);

    const leftPct = Math.random() * 80 + 10;     // 10%–90%
    const drift = Math.random() * 80 - 40;        // -40px..+40px
    const widthPx = Math.random() * 16 + 42;      // 42–58px
    const dur = Math.random() * 4 + 9;            // 9–13s

    svg.style.left = leftPct + "%";
    svg.style.width = widthPx + "px";
    svg.style.setProperty("--drift", drift + "px");
    svg.style.animationDuration = dur + "s";

    container.appendChild(svg);

    const remove = function () {
      if (svg.parentNode) svg.parentNode.removeChild(svg);
    };
    svg.addEventListener("animationend", remove, { once: true });
    // safety net in case animationend is missed (e.g. tab backgrounded)
    window.setTimeout(remove, (dur + 1) * 1000);
  }

  function release(count) {
    if (!container) return;
    refreshMotionPref();
    const n = reduced ? 1 : Math.max(1, count || 1);
    for (let i = 0; i < n; i++) {
      window.setTimeout(spawn, i * 240);
    }
  }

  function init() {
    container = document.getElementById("lanterns-rise");
  }

  Chua.lanterns = { init: init, release: release };
})(window.Chua);
