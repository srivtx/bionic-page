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

  /* ---- Theme: light, dark, or whatever the system says ---------------- */
  var THEME_KEY = "bionic-page-theme";
  var themePicker = q(".theme-pick");
  var themeButtons = qa(".theme-pick__btn");

  function prefersDark() {
    return typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function storedTheme() {
    var explicit = root.getAttribute("data-theme");
    if (explicit === "dark" || explicit === "light") return explicit;
    try {
      var saved = window.localStorage.getItem(THEME_KEY);
      if (saved === "dark" || saved === "light" || saved === "system") return saved;
    } catch (err) {
      void 0;
    }
    return "system";
  }
  function applyTheme(choice) {
    /* "system" means no attribute, so the media query takes over. */
    if (choice === "dark" || choice === "light") root.setAttribute("data-theme", choice);
    else root.removeAttribute("data-theme");
    each(themeButtons, function (button) {
      button.setAttribute(
        "aria-checked",
        String(button.getAttribute("data-theme-choice") === choice),
      );
    });
    /* art.js re-reads its colour tokens off this event. */
    window.dispatchEvent(new Event("themechange"));
  }
  function chooseTheme(choice) {
    if (!choice) return;
    try {
      window.localStorage.setItem(THEME_KEY, choice);
    } catch (err) {
      void 0;
    }
    applyTheme(choice);
  }
  each(themeButtons, function (button) {
    button.addEventListener("click", function () {
      chooseTheme(button.getAttribute("data-theme-choice"));
    });
  });
  if (themePicker) {
    /* A radiogroup should answer the arrow keys. */
    themePicker.addEventListener("keydown", function (event) {
      var step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[event.key];
      if (!step) return;
      event.preventDefault();
      var list = Array.prototype.slice.call(themeButtons);
      var at = list.indexOf(document.activeElement);
      var next = list[((at === -1 ? 0 : at) + step + list.length) % list.length];
      if (!next) return;
      next.focus();
      chooseTheme(next.getAttribute("data-theme-choice"));
    });
  }
  applyTheme(storedTheme());

  /* ----- Emphasis switch -------------------------------------------------
     Lives in the nav, so it is bound here with the rest of the header: that
     markup is the same on every page and is never replaced by a client-side
     navigation, so it must not be bound twice. */
  var KEY_FIX = "bionic-page-fixation";
  var fixSwitch = q("#fixation");

  function readFixation() {
    try {
      return window.localStorage.getItem(KEY_FIX) === "off" ? "off" : "on";
    } catch (err) {
      return "on";
    }
  }

  function applyFixation(state) {
    var on = state !== "off";
    /* The attribute only ever exists when the emphasis is off, so the plain
       page is the default and a missing attribute is not a special case. */
    if (on) root.removeAttribute("data-fixation");
    else root.setAttribute("data-fixation", "off");
    if (!fixSwitch) return;
    fixSwitch.setAttribute("aria-checked", on ? "true" : "false");
    fixSwitch.setAttribute(
      "aria-label",
      on ? "Bionic emphasis is on. Turn it off." : "Bionic emphasis is off. Turn it on.",
    );
  }

  if (fixSwitch) {
    fixSwitch.addEventListener("click", function () {
      var next = fixSwitch.getAttribute("aria-checked") === "true" ? "off" : "on";
      try {
        if (next === "off") window.localStorage.setItem(KEY_FIX, "off");
        else window.localStorage.removeItem(KEY_FIX);
      } catch (err) {
        void 0;
      }
      applyFixation(next);
    });
  }

  applyFixation(readFixation());



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

  function options(mode, intensity) {
    return Object.assign({}, Core.DEFAULT_SETTINGS, { mode: mode, intensity: intensity });
  }

  /* ---- Page wiring ------------------------------------------------------
     Everything below is page content, and client-side navigation replaces
     page content. It lives in a function so it can be run again against the
     new document. The header wiring above is deliberately outside it: that
     markup never changes, so it must never be bound a second time. */
  function wirePage() {
    /* Fail soft: no core, no demo. Hide the controls, keep plain text. */
    if (!Core || typeof Core.paint !== "function") {
      each(qa(".bdemo__tools"), function (el) {
        el.hidden = true;
      });
      return;
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

    /* ---- Compare slider ---------------------------------------------------
       One custom property drives the clip, the divider and the handle, so a
       drag is a single style write and nothing re-lays-out. Pointer drag, plus
       arrow keys for keyboards. */
    var compare = $("compare");
    if (compare) {
      var dragging = false;
      var split = 0.5;
      function paintSplit() {
        var pct = Math.round(split * 100);
        compare.style.setProperty("--p", pct + "%");
        compare.setAttribute("aria-valuenow", String(pct));
        /* Screen readers get the same reading the labels give the eye. */
        compare.setAttribute("aria-valuetext", pct + "% bionic, " + (100 - pct) + "% as written");
      }
      function fromClientX(clientX) {
        var rect = compare.getBoundingClientRect();
        if (rect.width <= 0) return;
        split = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
        paintSplit();
      }
      compare.addEventListener("pointerdown", function (event) {
        dragging = true;
        compare.classList.add("is-dragging");
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
      function endDrag() {
        dragging = false;
        compare.classList.remove("is-dragging");
      }
      compare.addEventListener("pointerup", endDrag);
      compare.addEventListener("pointercancel", endDrag);
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
  }

  wirePage();
  window.BionicSite = window.BionicSite || { init: [] };
  window.BionicSite.init.push(wirePage);
})();
