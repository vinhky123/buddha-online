/* =========================================================================
   INCENSE — light the burner: ember reveal, pulse ring, smoke, sound, toast.
   Triggered by the burner click/keyboard and the dock "incense" action.
   Returns true when newly lit (so callers can avoid redundant effects).
   ========================================================================= */
window.Chua = window.Chua || {};

(function (Chua) {
  "use strict";

  let burner = null;

  function light() {
    if (!burner) return false;
    if (burner.classList.contains("is-lit")) return false;

    burner.classList.add("is-igniting");
    window.setTimeout(function () {
      burner.classList.remove("is-igniting");
    }, 720);

    burner.classList.add("is-lit");

    if (Chua.scene) Chua.scene.startSmoke();
    if (Chua.audio) Chua.audio.soft();

    if (Chua.ui && Chua.i18n) {
      Chua.ui.toast(Chua.i18n.get("toast.incense", Chua.store.get().lang));
    }
    return true;
  }

  function onActivate(e) {
    if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
    if (e.type === "keydown") e.preventDefault();
    light();
  }

  function init() {
    burner = document.getElementById("burner");
    if (!burner) return;
    burner.addEventListener("click", onActivate);
    burner.addEventListener("keydown", onActivate);
  }

  Chua.incense = {
    init: init,
    light: light,
    isLit: function () {
      return !!burner && burner.classList.contains("is-lit");
    },
  };
})(window.Chua);
