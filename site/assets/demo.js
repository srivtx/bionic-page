/* bionic-page — site behaviour: the live demo, the fixation samples, the
   compare slider, and the shared theme and navigation toggles. No network.
   If assets/core.js did not load, plain text stays and the demo controls are
   hidden instead of throwing. */
(function () {
  "use strict";

  var root = document.documentElement;
  var Core = window.BionicCore;

  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function $(id) { return document.getElementById(id); }
  function q(selector, scope) { return (scope || document).querySelector(selector); }
  function qa(selector, scope) { return (scope || document).querySelectorAll(selector); }

  /* ---- Theme: store an explicit choice; otherwise follow the OS. -------- */
  var THEME_KEY = "bionic-page-theme";
  var themeToggle = $("theme-toggle");
  var themeText = $("theme-toggle-text");

  function prefersDark() {
    return typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function applyTheme(theme) {
    if (theme === "dark" || theme === "light") {
      root.setAttribute("data-theme", theme);
    } else {
      root.removeAttribute("data-theme");
    }
    if (!themeToggle) return;
    var isDark = theme === "dark" || (theme == null && prefersDark());
    themeToggle.setAttribute("aria-pressed", isDark ? "true" : "false");
    themeToggle.setAttribute(
      "aria-label",
      isDark ? "Switch to light theme" : "Switch to dark theme"
    );
    if (themeText) themeText.textContent = isDark ? "Dark" : "Light";
  }
  function currentTheme() {
    var explicit = root.getAttribute("data-theme");
    if (explicit === "dark" || explicit === "light") return explicit;
    try {
      return window.localStorage.getItem(THEME_KEY);
    } catch (err) {
      return null;
    }
  }
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var isDark = themeToggle.getAttribute("aria-pressed") === "true";
      var next = isDark ? "light" : "dark";
      try {
        window.localStorage.setItem(THEME_KEY, next);
      } catch (err) {
        void 0;
      }
      applyTheme(next);
    });
  }
  applyTheme(currentTheme());

  /* ---- Navigation ------------------------------------------------------- */
  var navToggle = $("nav-toggle");
  var nav = $("site-nav");
  function closeNav() {
    if (nav) nav.setAttribute("data-open", "false");
    if (navToggle) navToggle.setAttribute("aria-expanded", "false");
  }
  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      var open = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", open ? "false" : "true");
      navToggle.setAttribute("aria-expanded", open ? "false" : "true");
    });
    nav.addEventListener("click", function (event) {
      var target = event.target;
      if (target && target.closest && target.closest("a")) closeNav();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeNav();
    });
  }

  /* ---- Fail soft: no core, no demo. Hide the controls, keep plain text. -- */
  if (!Core || typeof Core.paint !== "function") {
    each(qa(".bdemo__tools"), function (el) {
      el.hidden = true;
    });
    return;
  }
  function options(mode, intensity) {
    return Object.assign({}, Core.DEFAULT_SETTINGS, { mode: mode, intensity: intensity });
  }

  /* ---- Fixation samples (mode tiles and the compare panel) -------------- */
  each(qa("[data-bionic-sample]"), function (el) {
    var mode = el.getAttribute("data-bionic-sample");
    Core.paint(el, el.textContent, options(mode, Core.DEFAULT_SETTINGS.intensity));
  });

  /* ---- Hero ------------------------------------------------------------- */
  var hero = $("hero-title-fix");
  if (hero) {
    /* "dim" is the mode that wraps the remainder in span.bp-tail, so the
       fixation head and the faded tail are both visible at poster size.
       The live demo below starts on the extension's real default (half). */
    Core.paint(hero, hero.textContent, options("dim", Core.DEFAULT_SETTINGS.intensity));
  }

  /* ---- Live demo -------------------------------------------------------- */
  var state = { mode: "half", intensity: Core.DEFAULT_SETTINGS.intensity };
  var src = $("demo-src");
  var out = $("demo-out");
  var chips = $("demo-modes");
  var range = $("intensity");
  var rangeOut = q('output[for="intensity"]');
  var statWords = $("stat-words");
  var statChars = $("stat-chars");
  var statMode = $("stat-mode");

  function render() {
    if (!out) return;
    var text = src ? src.value : "";
    Core.paint(out, text, options(state.mode, state.intensity));
    var chars = 0;
    each(qa("b.bp-head", out), function (head) {
      chars += head.textContent.length;
    });
    if (statWords) statWords.innerHTML = "<b>" + Core.countWords(text) + "</b> words";
    if (statChars) {
      statChars.innerHTML = "<b>" + chars + "</b> characters emphasized";
    }
    if (statMode) statMode.innerHTML = "mode: <b>" + state.mode + "</b>";
  }
  function setMode(mode) {
    state.mode = mode;
    each(qa(".mchip", chips), function (chip) {
      chip.setAttribute("aria-pressed", String(chip.getAttribute("data-mode") === mode));
    });
    render();
  }
  if (chips && Core.MODES) {
    each(Core.MODES, function (mode) {
      var li = document.createElement("li");
      var button = document.createElement("button");
      button.type = "button";
      button.className = "mchip";
      button.textContent = mode.label;
      button.setAttribute("data-mode", mode.id);
      button.setAttribute("aria-pressed", String(mode.id === state.mode));
      button.addEventListener("click", function () {
        setMode(mode.id);
      });
      li.appendChild(button);
      chips.appendChild(li);
    });
  }
  if (range) {
    range.addEventListener("input", function () {
      state.intensity = Number(range.value) / 100;
      if (rangeOut) rangeOut.textContent = state.intensity.toFixed(1);
      render();
    });
    if (rangeOut) rangeOut.textContent = state.intensity.toFixed(1);
  }
  if (src) src.addEventListener("input", render);
  render();

  /* ---- Compare slider: divider width and knob position are the only
     runtime inline styles. Pointer drag, plus arrow keys for keyboards. --- */
  var compare = $("compare");
  var compareTop = compare ? q(".compare__top", compare) : null;
  var knob = compare ? q(".compare__knob", compare) : null;
  if (compare && compareTop && knob) {
    var dragging = false;
    var split = 0.5;
    function paintSplit() {
      compareTop.style.width = split * 100 + "%";
      knob.style.left = split * 100 + "%";
      compare.setAttribute("aria-valuenow", String(Math.round(split * 100)));
    }
    function fromClientX(clientX) {
      var rect = compare.getBoundingClientRect();
      if (rect.width <= 0) return;
      split = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      paintSplit();
    }
    compare.addEventListener("pointerdown", function (event) {
      dragging = true;
      if (compare.setPointerCapture) {
        try {
          compare.setPointerCapture(event.pointerId);
        } catch (err) {
          void 0;
        }
      }
      fromClientX(event.clientX);
    });
    compare.addEventListener("pointermove", function (event) {
      if (dragging) fromClientX(event.clientX);
    });
    compare.addEventListener("pointerup", function () {
      dragging = false;
    });
    compare.addEventListener("pointercancel", function () {
      dragging = false;
    });
    compare.addEventListener("keydown", function (event) {
      var step = event.shiftKey ? 0.1 : 0.02;
      if (event.key === "ArrowLeft") split -= step;
      else if (event.key === "ArrowRight") split += step;
      else if (event.key === "Home") split = 0;
      else if (event.key === "End") split = 1;
      else return;
      event.preventDefault();
      split = Math.min(1, Math.max(0, split));
      paintSplit();
    });
    paintSplit();
  }
})();
