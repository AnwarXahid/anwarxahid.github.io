/* Browser side of the site languages (served as /i18n.js; `data` comes from src/i18n/locales.ts).
 *
 * - Remembers the language a visitor picks from any language menu.
 * - On an English page, a visitor with no saved choice whose device suggests another
 *   supported language (browser languages first, then time zone) is asked once,
 *   in that language, whether to switch. Nothing is sent anywhere.
 * - Portfolio pages switch by URL (/bn/…). Apps mark <html data-i18n-mode="app"> and
 *   receive a "site:locale" event instead.
 */
(function (data) {
  "use strict";

  var root = document.documentElement;
  var KEY = data.storageKey;
  var PROMPTED = KEY + ".prompted";
  var read = function (key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  };
  var write = function (key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* private mode: not remembered */ }
  };

  document.addEventListener("click", function (event) {
    var choice = event.target.closest && event.target.closest("[data-locale-choice]");
    if (choice) write(KEY, choice.getAttribute("data-locale-choice"));
  });

  // Language menus close like other menus: outside click or Escape.
  var menus = Array.prototype.slice.call(document.querySelectorAll("details.lang-menu"));
  document.addEventListener("click", function (event) {
    menus.forEach(function (menu) {
      if (menu.open && !menu.contains(event.target)) menu.open = false;
    });
  });
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    menus.forEach(function (menu) {
      if (!menu.open) return;
      menu.open = false;
      menu.querySelector("summary").focus();
    });
  });

  function fromTimeZone() {
    var zone = "";
    try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { return null; }
    for (var code in data.zones) {
      var list = data.zones[code];
      for (var i = 0; i < list.length; i++) {
        var entry = list[i];
        if (entry === zone || (entry.slice(-1) === "/" && zone.indexOf(entry) === 0)) return code;
      }
    }
    return null;
  }

  /** The language this visitor most likely reads, or null to stay quiet. */
  function suggestion() {
    var preferred = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""];
    for (var i = 0; i < preferred.length; i++) {
      var tag = String(preferred[i]).toLowerCase();
      var base = tag.split("-")[0];
      // English ranked first: the browser says English is fine, so only location speaks.
      if (base === "en") break;
      // Traditional-script readers are not offered Simplified Chinese.
      if (base === "zh" && /-(tw|hk|mo|hant)\b/.test(tag)) continue;
      if (data.locales[base]) return base;
    }
    return fromTimeZone();
  }

  function addStyles() {
    var style = document.createElement("style");
    style.textContent =
      ".lang-prompt{position:fixed;z-index:1000;inset-inline-end:16px;bottom:16px;width:min(360px,calc(100vw - 32px));" +
      "box-sizing:border-box;padding:18px 18px 16px;border-radius:14px;border:1px solid var(--line,var(--border,#d0d5dd));" +
      "background:var(--surface,#fff);color:var(--text,#111);box-shadow:0 20px 50px -18px rgba(0,0,0,.55);" +
      "font:16px/1.5 var(--f-body,inherit);animation:lang-prompt-in .35s cubic-bezier(.2,.8,.2,1)}" +
      ".lang-prompt p{margin:0;color:inherit}" +
      ".lang-prompt .lang-prompt-title{font-weight:700;font-size:1.05rem;line-height:1.45}" +
      ".lang-prompt .lang-prompt-sub{margin-top:4px;font-size:.85rem;color:var(--muted,#555)}" +
      ".lang-prompt-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}" +
      ".lang-prompt button{min-height:40px;padding:8px 14px;border-radius:9px;font:inherit;font-size:.92rem;font-weight:600;cursor:pointer;" +
      "border:1px solid var(--line,var(--border,#d0d5dd));background:transparent;color:inherit}" +
      ".lang-prompt .lang-prompt-accept{border-color:transparent;background:var(--accent,var(--primary,#2563eb));color:var(--accent-ink,var(--bg,#fff))}" +
      ".lang-prompt button:focus-visible{outline:3px solid var(--accent,var(--primary,#2563eb));outline-offset:2px}" +
      "@keyframes lang-prompt-in{from{opacity:0;transform:translateY(12px)}}" +
      "@media (prefers-reduced-motion:reduce){.lang-prompt{animation:none}}";
    document.head.appendChild(style);
  }

  function element(tag, className, text, lang) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    if (lang) {
      node.setAttribute("lang", lang);
      node.setAttribute("dir", data.locales[lang].dir);
    }
    return node;
  }

  function switchTo(code) {
    write(KEY, code);
    var link = document.querySelector('.lang-menu [data-locale-choice="' + code + '"]');
    if (link && root.getAttribute("data-i18n-mode") !== "app") {
      location.href = link.href;
      return true;
    }
    window.dispatchEvent(new CustomEvent("site:locale", {detail: code}));
    return false;
  }

  function showPrompt(code) {
    var info = data.locales[code];
    addStyles();
    var box = element("aside", "lang-prompt", "", null);
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-labelledby", "lang-prompt-title");
    var title = element("p", "lang-prompt-title", info.prompt, code);
    title.id = "lang-prompt-title";
    var sub = element("p", "lang-prompt-sub", "This site is also available in " + info.english + ".", "en");
    var actions = element("div", "lang-prompt-actions", "", null);
    var accept = element("button", "lang-prompt-accept", info.accept, code);
    var stay = element("button", "lang-prompt-dismiss", "Stay in English", "en");
    accept.type = stay.type = "button";
    actions.appendChild(accept);
    actions.appendChild(stay);
    box.appendChild(title);
    box.appendChild(sub);
    box.appendChild(actions);

    var close = function () {
      write(PROMPTED, "1");
      document.removeEventListener("keydown", onKey);
      if (box.parentNode) box.parentNode.removeChild(box);
    };
    var onKey = function (event) { if (event.key === "Escape") close(); };
    accept.addEventListener("click", function () {
      if (!switchTo(code)) close();
      else write(PROMPTED, "1");
    });
    stay.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    document.body.appendChild(box);
  }

  var current = root.getAttribute("data-locale") || "en";
  var code = suggestion();
  if (current === "en" && code && code !== "en" && !read(KEY) && !read(PROMPTED)) {
    window.setTimeout(function () { showPrompt(code); }, 900);
  }
})(DATA);
