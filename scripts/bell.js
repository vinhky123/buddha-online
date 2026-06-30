/* =========================================================================
   BELL — ring the temple bell: swing animation, ripple ring, sound.
   Triggered by the bell-stage click/keyboard and the dock "bell" action.
   ========================================================================= */
window.Chua = window.Chua || {};

(function (Chua) {
  "use strict";

  let stage = null;
  let svg = null;
  const RIPPLE_MS = 950;

  function ring() {
    if (!svg) return;

    // restart the swing by toggling the class with a reflow in between
    svg.classList.remove("is-ringing");
    void svg.offsetWidth;
    svg.classList.add("is-ringing");

    const ripple = document.createElement("span");
    ripple.className = "bell-ripple";
    stage.appendChild(ripple);
    window.setTimeout(function () {
      if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
    }, RIPPLE_MS);

    if (Chua.audio) Chua.audio.bell(196 + (Math.random() * 8 - 4));
  }

  function onActivate(e) {
    if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
    if (e.type === "keydown") e.preventDefault();
    ring();
  }

  function init() {
    stage = document.getElementById("bell");
    if (!stage) return;
    svg = stage.querySelector(".bell-svg");
    stage.addEventListener("click", onActivate);
    stage.addEventListener("keydown", onActivate);
  }

  Chua.bell = { init: init, ring: ring };
})(window.Chua);
