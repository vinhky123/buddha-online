/* =========================================================================
   I18N — Vietnamese (default) + English dictionaries.
   Applies translations to [data-i18n], [data-i18n-placeholder],
   [data-i18n-title], and aria-label on role="button" controls.
   ========================================================================= */
window.Chua = window.Chua || {};

(function (Chua) {
  "use strict";

  const DICT = {
    vi: {
      brand: {
        eyebrow: "Chùa Online · Hương Tâm",
        title: "Chùa Hương Tâm",
      },
      tools: {
        ambient: "Môi trường",
        lang: "Ngôn ngữ",
      },
      greeting: "Nam mô A Di Đà Phật",
      intro:
        "Hãy thắp một nén hương, dâng lời nguyện — cầu bình an, thành tựu cho mình và người thương.",
      buddha: { alt: "Tượng Phật trên đài sen" },
      burner: { action: "Thắp hương", hint: "Nhấp để thắp hương" },
      bell: { action: "Gõ chuông", hint: "Gõ chuông" },
      nav: {
        incense: "Thắp hương",
        pray: "Cầu nguyện",
        bell: "Gõ chuông",
        lantern: "Thả đèn",
        wishes: "Tâm thư",
      },
      prayer: {
        title: "Viết tâm nguyện",
        hint: "Lời nguyện sẽ được dâng lên Đức Phật và lưu lại nơi đây.",
        label: "Tâm nguyện của bạn",
        placeholder: "Viết lời cầu bình an, thành tựu...",
        name: "Tên (tùy chọn)",
        "name-ph": "Một người thành tâm",
        cancel: "Đóng",
        submit: "Dâng lời nguyện",
      },
      intent: {
        peace: "Bình an",
        success: "Thành tựu",
        health: "Sức khỏe",
        love: "Tình duyên",
      },
      wishes: {
        title: "Bức Tâm Thư",
        sub: "Những lời nguyện được dâng lên nơi chùa Hương Tâm.",
        empty: "Chưa có tâm nguyện nào.",
        clear: "Xóa tất cả",
        anon: "Một người thành tâm",
      },
      toast: {
        incense: "Nén hương đã được thắp lên.",
        bell: "Tiếng chuông ngân vang.",
        lantern: "Đèn hoa đăng đã được thả lên trời.",
        prayer: "Lời nguyện đã được dâng lên.",
        cleared: "Đã xóa mọi tâm nguyện.",
      },
    },

    en: {
      brand: {
        eyebrow: "Chùa Online · Hương Tâm",
        title: "Hương Tâm Temple",
      },
      tools: {
        ambient: "Ambient",
        lang: "Language",
      },
      greeting: "Namo Amitabha Buddha",
      intro:
        "Light a stick of incense, offer a prayer — for peace and fulfilment, for yourself and those you love.",
      buddha: { alt: "Buddha statue upon the lotus throne" },
      burner: { action: "Light incense", hint: "Click to light incense" },
      bell: { action: "Ring the bell", hint: "Ring the bell" },
      nav: {
        incense: "Incense",
        pray: "Pray",
        bell: "Bell",
        lantern: "Lantern",
        wishes: "Wishes",
      },
      prayer: {
        title: "Offer a Prayer",
        hint: "Your prayer will be offered to the Buddha and kept here.",
        label: "Your prayer",
        placeholder: "Write a prayer for peace, for fulfilment...",
        name: "Name (optional)",
        "name-ph": "A devoted heart",
        cancel: "Close",
        submit: "Offer prayer",
      },
      intent: {
        peace: "Peace",
        success: "Success",
        health: "Health",
        love: "Love",
      },
      wishes: {
        title: "The Wish Wall",
        sub: "Prayers offered at Hương Tâm Temple.",
        empty: "No prayers yet.",
        clear: "Clear all",
        anon: "A devoted heart",
      },
      toast: {
        incense: "A stick of incense has been lit.",
        bell: "The temple bell resounds.",
        lantern: "A lantern has been released into the sky.",
        prayer: "Your prayer has been offered.",
        cleared: "All wishes have been cleared.",
      },
    },
  };

  function lookup(lang, key) {
    const dict = DICT[lang] || DICT.vi;
    const parts = key.split(".");
    let node = dict;
    for (let i = 0; i < parts.length; i++) {
      if (node == null) return null;
      node = node[parts[i]];
    }
    return node == null ? null : node;
  }

  function applyLang(lang) {
    const html = document.documentElement;
    html.lang = lang;
    html.setAttribute("data-lang", lang);

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const v = lookup(lang, el.getAttribute("data-i18n"));
      if (v != null) el.textContent = v;
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const v = lookup(lang, el.getAttribute("data-i18n-placeholder"));
      if (v != null) el.placeholder = v;
    });

    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const v = lookup(lang, el.getAttribute("data-i18n-title"));
      if (v != null) el.title = v;
      // keep aria-label in sync for interactive scene controls
      if (el.getAttribute("role") === "button") el.setAttribute("aria-label", v);
    });
  }

  Chua.i18n = {
    DICT: DICT,
    get: function (key, lang) {
      return lookup(lang || "vi", key);
    },
    applyLang: applyLang,
    has: function (lang) {
      return Object.prototype.hasOwnProperty.call(DICT, lang);
    },
  };
})(window.Chua);
