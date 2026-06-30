/* =========================================================================
   MAIN — orchestrator.
   Provides shared UI helpers (toast, overlay open/close), wires the dock
   actions, header tools (ambient sound, language), overlay behaviours
   (close buttons, backdrop click, Esc, focus trap), and runs the boot
   sequence once the DOM is ready.
   ========================================================================= */
window.Chua = window.Chua || {};

(function (Chua) {
  "use strict";

  const els = {};
  let toastTimer = null;
  let lastFocused = null;
  let ambientOn = false;

  function t(key) {
    return Chua.i18n.get(key, Chua.store.get().lang);
  }

  /* ============== shared UI helpers ============== */
  const ui = (Chua.ui = Chua.ui || {});

  ui.toast = function (message) {
    const node = document.getElementById("toast");
    if (!node) return;
    node.textContent = message;
    node.hidden = false;
    requestAnimationFrame(function () {
      node.classList.add("is-show");
    });
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      node.classList.remove("is-show");
      window.setTimeout(function () {
        node.hidden = true;
      }, 480);
    }, 2600);
  };

  ui.openOverlay = function (id) {
    const overlay = document.getElementById(id);
    if (!overlay || !overlay.hidden) return;
    lastFocused = document.activeElement;
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    const focusable = overlay.querySelector(
      "textarea, input, button:not(.panel-close)"
    );
    if (focusable) {
      const target = focusable.tagName === "INPUT" || focusable.tagName === "TEXTAREA"
        ? focusable
        : overlay.querySelector(".panel-close");
      window.setTimeout(function () {
        (target || focusable).focus();
      }, 60);
    }
  };

  ui.closeOverlay = function (id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.hidden = true;
    // release body scroll only when no overlay remains open
    const anyOpen = document.querySelector(".overlay:not([hidden])");
    if (!anyOpen) document.body.style.overflow = "";
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
      lastFocused = null;
    }
  };

  /* ============== dock actions ============== */
  function onDock(action) {
    switch (action) {
      case "incense":
        Chua.incense.light();
        break;
      case "bell":
        Chua.bell.ring();
        break;
      case "lantern":
        Chua.lanterns.release(1);
        if (Chua.audio) Chua.audio.soft();
        ui.toast(t("toast.lantern"));
        break;
      case "pray":
        ui.openOverlay("prayer-overlay");
        break;
      case "wishes":
        Chua.prayer.render();
        ui.openOverlay("wishes-overlay");
        break;
      default:
        break;
    }
  }

  /* ============== header tools ============== */
  function setAmbient(on) {
    ambientOn = on;
    els.ambientBtn.setAttribute("aria-pressed", String(on));
    const icon = els.ambientBtn.querySelector("use");
    if (icon) icon.setAttribute("href", on ? "#ico-sound" : "#ico-mute");
    if (on) Chua.audio.startAmbient();
    else Chua.audio.stopAmbient();
  }

  function setLang(lang) {
    Chua.store.set({ lang: lang });
    Chua.i18n.applyLang(lang);
    els.langLabel.textContent = lang === "vi" ? "EN" : "VI";
  }

  /* ============== overlay behaviour ============== */
  function focusableElements(root) {
    const nodes = root.querySelectorAll(
      'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    return Array.prototype.filter.call(nodes, function (el) {
      return !el.disabled && el.offsetParent !== null;
    });
  }

  function openOverlay() {
    return document.querySelector(".overlay:not([hidden])");
  }

  function closeAllOverlays() {
    const list = document.querySelectorAll(".overlay:not([hidden])");
    list.forEach(function (overlay) {
      ui.closeOverlay(overlay.id);
    });
  }

  function onKeydown(e) {
    if (e.key === "Escape") {
      closeAllOverlays();
      return;
    }
    if (e.key !== "Tab") return;
    const overlay = openOverlay();
    if (!overlay) return;
    const items = focusableElements(overlay);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function wireOverlays() {
    document.querySelectorAll("[data-close]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const overlay = btn.closest(".overlay");
        if (overlay) ui.closeOverlay(overlay.id);
      });
    });

    document.querySelectorAll(".overlay").forEach(function (overlay) {
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) ui.closeOverlay(overlay.id);
      });
    });

    document.addEventListener("keydown", onKeydown);
  }

  function wireDock() {
    const dock = document.querySelector(".dock");
    if (!dock) return;
    dock.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      onDock(btn.getAttribute("data-action"));
    });
  }

  function wireTools() {
    els.ambientBtn.addEventListener("click", function () {
      setAmbient(!ambientOn);
    });

    els.langBtn.addEventListener("click", function () {
      const current = Chua.store.get().lang;
      setLang(current === "vi" ? "en" : "vi");
    });
  }

  /* ============== Buddha photo (optional) ==============
     If a transparent assets/buddha.png exists, swap the drawn figure
     for the photo. No-op (drawn Buddha stays) if the file is missing. */
  function applyBuddhaPhoto() {
    const svg = document.querySelector(".buddha");
    if (!svg) return;
    const probe = new Image();
    probe.onload = function () {
      svg.classList.add("has-photo");
    };
    probe.src = "assets/buddha.png";
  }

  /* ============== boot ============== */
  function boot() {
    els.ambientBtn = document.getElementById("ambient-toggle");
    els.langBtn = document.getElementById("lang-toggle");
    els.langLabel = document.getElementById("lang-label");

    // language first so every label renders before paint
    const lang = Chua.store.get().lang;
    Chua.i18n.applyLang(lang);
    els.langLabel.textContent = lang === "vi" ? "EN" : "VI";
    els.ambientBtn.setAttribute("aria-pressed", "false");

    Chua.scene.init();
    Chua.bell.init();
    Chua.incense.init();
    Chua.lanterns.init();
    Chua.prayer.init();

    wireDock();
    wireTools();
    wireOverlays();

    applyBuddhaPhoto();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window.Chua);
