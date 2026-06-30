/* =========================================================================
   PRAYER — the prayer form and the wish wall.
   - intent chip selection (persisted)
   - live character counter
   - submit -> store wish, render, chime, toast, close panel
   - render wish wall (XSS-escaped), empty state, clear-all, dock badge
   ========================================================================= */
window.Chua = window.Chua || {};

(function (Chua) {
  "use strict";

  const els = {};
  const MAX = 280;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c];
    });
  }

  function intentLabel(intent, lang) {
    return Chua.i18n.get("intent." + intent, lang) || intent;
  }

  function formatTime(ts, lang) {
    const d = new Date(ts);
    const locale = lang === "vi" ? "vi-VN" : "en-US";
    try {
      return d.toLocaleDateString(locale, { day: "2-digit", month: "short" });
    } catch (err) {
      return "";
    }
  }

  /* ---- dock badge ---- */
  function syncBadge() {
    if (!els.badge) return;
    const n = Chua.store.get().wishes.length;
    els.badge.textContent = String(n);
    els.badge.hidden = n === 0;
  }

  /* ---- intent chips ---- */
  function setActiveIntent(intent) {
    if (!els.intentRow) return;
    const chips = els.intentRow.querySelectorAll(".chip");
    chips.forEach(function (chip) {
      chip.classList.toggle("is-active", chip.getAttribute("data-intent") === intent);
    });
  }

  /* ---- render the wall ---- */
  function render() {
    const lang = Chua.store.get().lang;
    const wishes = Chua.store.get().wishes;

    if (!els.list) return;
    els.list.innerHTML = "";

    if (wishes.length === 0) {
      els.empty.hidden = false;
    } else {
      els.empty.hidden = true;
      const frag = document.createDocumentFragment();
      for (let i = 0; i < wishes.length; i++) {
        frag.appendChild(buildItem(wishes[i], lang));
      }
      els.list.appendChild(frag);
    }

    syncBadge();
  }

  function buildItem(wish, lang) {
    const node = document.createElement("article");
    node.className = "wish-item intent-" + wish.intent;

    const anon = Chua.i18n.get("wishes.anon", lang) || "";
    const name = wish.name ? escapeHtml(wish.name) : escapeHtml(anon);
    const text = escapeHtml(wish.text);
    const intent = escapeHtml(intentLabel(wish.intent, lang));
    const time = escapeHtml(formatTime(wish.ts, lang));

    node.innerHTML =
      '<div class="wish-lotus"><svg class="lotus-mini"><use href="#ico-lotus"/></svg></div>' +
      '<div class="wish-body">' +
      '<p class="wish-text">' + text + "</p>" +
      '<p class="wish-meta">' +
      '<span class="wish-intent">' + intent + "</span>" +
      '<span class="wish-name">' + name + "</span>" +
      '<span class="wish-time">' + time + "</span>" +
      "</p>" +
      "</div>";

    return node;
  }

  /* ---- submit ---- */
  function onSubmit(e) {
    e.preventDefault();
    const text = els.text.value.trim();
    if (!text) return;

    const name = els.name.value.trim();
    Chua.store.addWish({ text: text, name: name });

    els.form.reset();
    els.count.textContent = "0";
    setActiveIntent(Chua.store.get().intent);

    render();

    if (Chua.audio) Chua.audio.chime();
    if (Chua.ui) {
      Chua.ui.toast(Chua.i18n.get("toast.prayer", Chua.store.get().lang));
      Chua.ui.closeOverlay("prayer-overlay");
    }
  }

  /* ---- clear all ---- */
  function onClear() {
    if (Chua.store.get().wishes.length === 0) return;
    Chua.store.clearWishes();
    render();
    if (Chua.ui) {
      Chua.ui.toast(Chua.i18n.get("toast.cleared", Chua.store.get().lang));
    }
  }

  function init() {
    els.form = document.getElementById("prayer-form");
    els.text = document.getElementById("prayer-text");
    els.name = document.getElementById("prayer-name");
    els.count = document.getElementById("prayer-count");
    els.intentRow = document.getElementById("intent-row");
    els.list = document.getElementById("wish-list");
    els.empty = document.getElementById("wish-empty");
    els.clear = document.getElementById("wishes-clear");
    els.badge = document.getElementById("wish-count");

    if (els.text) {
      els.text.setAttribute("maxlength", String(MAX));
      els.text.addEventListener("input", function () {
        els.count.textContent = String(els.text.value.length);
      });
    }

    if (els.form) els.form.addEventListener("submit", onSubmit);
    if (els.clear) els.clear.addEventListener("click", onClear);

    if (els.intentRow) {
      els.intentRow.addEventListener("click", function (e) {
        const chip = e.target.closest(".chip");
        if (!chip) return;
        Chua.store.set({ intent: chip.getAttribute("data-intent") });
        setActiveIntent(Chua.store.get().intent);
      });
    }

    setActiveIntent(Chua.store.get().intent);
    syncBadge();
  }

  Chua.prayer = { init: init, render: render, syncBadge: syncBadge };
})(window.Chua);
