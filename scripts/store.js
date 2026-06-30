/* =========================================================================
   STORE — persistence layer (localStorage).
   Holds wishes, the currently selected prayer intent, and language.
   All mutations return new state objects (immutable updates).
   ========================================================================= */
window.Chua = window.Chua || {};

(function (Chua) {
  "use strict";

  const KEY = "chua-huong-tam:v1";

  const DEFAULTS = Object.freeze({
    wishes: [],          // [{ id, text, name, intent, ts }]
    intent: "peace",     // peace | success | health | love
    lang: "vi",          // vi | en
  });

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return clone(DEFAULTS);
      const parsed = JSON.parse(raw);
      return Object.assign(clone(DEFAULTS), parsed, {
        wishes: Array.isArray(parsed.wishes) ? parsed.wishes.slice() : [],
      });
    } catch (err) {
      return clone(DEFAULTS);
    }
  }

  function write(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (err) {
      /* storage full or blocked — keep working in-memory */
    }
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function uid() {
    return "w_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  let state = read();

  Chua.store = {
    get: function () {
      return state;
    },

    set: function (patch) {
      state = Object.assign({}, state, patch);
      write(state);
      return state;
    },

    /* ---- wishes ---- */
    addWish: function (data) {
      const wish = {
        id: uid(),
        ts: Date.now(),
        text: String(data.text || "").slice(0, 280),
        name: String(data.name || "").slice(0, 32),
        intent: data.intent || state.intent,
      };
      state = Object.assign({}, state, {
        wishes: [wish].concat(state.wishes),
      });
      write(state);
      return wish;
    },

    clearWishes: function () {
      state = Object.assign({}, state, { wishes: [] });
      write(state);
      return state;
    },
  };
})(window.Chua);
