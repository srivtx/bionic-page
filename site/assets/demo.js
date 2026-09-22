/* ============================================================================
   Bionic Page — site runtime
   Wires the Broadsheet page to the extension's own compiled algorithm
   (assets/core.js). No framework, no dependencies, no network.
   ========================================================================== */
(function () {
  "use strict";

  var Core = window.BionicCore;
  var doc = document;
  var root = doc.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(sel, base) { return (base || doc).querySelector(sel); }
  function $$(sel, base) { return Array.prototype.slice.call((base || doc).querySelectorAll(sel)); }
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  /* ------------------------------------------------------------ theme --- */
  var THEME_KEY = "bionic-page-theme";
  var themeToggle = $("#theme-toggle");
  var themeLabel = $("#theme-toggle-text");

  function applyTheme(theme, persist) {
    root.setAttribute("data-theme", theme);
    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    }
    if (themeLabel) themeLabel.textContent = theme === "dark" ? "Light" : "Dark";
    if (persist) {
      try { window.localStorage.setItem(THEME_KEY, theme); } catch (e) { /* private mode */ }
    }
  }

  if (themeToggle) {
    applyTheme(root.getAttribute("data-theme") === "dark" ? "dark" : "light", false);
    themeToggle.addEventListener("click", function () {
      applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark", true);
    });
  }

  /* -------------------------------------------------------- mobile nav --- */
  var navToggle = $("#nav-toggle");
  var mobileNav = $("#mobile-nav");
  if (navToggle && mobileNav) {
    var setNav = function (open) {
      mobileNav.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    };
    navToggle.addEventListener("click", function () {
      setNav(!mobileNav.classList.contains("is-open"));
    });
    $$("a", mobileNav).forEach(function (a) {
      a.addEventListener("click", function () { setNav(false); });
    });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setNav(false);
    });
  }

  /* ------------------------------------------------------- paint helpers --- */
  function opts(mode, intensity) {
    return {
      mode: mode || "half",
      intensity: typeof intensity === "number" ? intensity : 0.5,
      minWordLength: 3,
      skipCommonWords: false,
      customVowels: "",
      rule: "0 1 1 2 0.4"
    };
  }

  function paintSample(el, intensityOverride) {
    var mode = el.getAttribute("data-bionic-sample") || "half";
    var attr = parseFloat(el.getAttribute("data-bionic-intensity") || "");
    var intensity = typeof intensityOverride === "number"
      ? intensityOverride
      : (isNaN(attr) ? 0.5 : attr);
    Core.paint(el, el.textContent, opts(mode, intensity));
  }

  /* Every element marked [data-bionic-sample] is painted once at load. The
     hero headline is one of them: it is the product demonstrating itself. */
  $$("[data-bionic-sample]").forEach(function (el) { paintSample(el); });

  var heroTitle = $(".hero__title");
  if (heroTitle) heroTitle.classList.add("is-read");

  /* -------------------------------------------------------------- galley --- */
  var galleyBody = $("#galley-body");
  var galleySlider = $("#galley-intensity");
  var galleyOut = $("#galley-intensity-out");
  var galleyWords = $("#galley-words");
  var galleyHeads = $("#galley-heads");

  function headCharCount(scope) {
    return $$("b.bp-head", scope).reduce(function (n, b) { return n + b.textContent.length; }, 0);
  }

  function renderGalley(intensity) {
    $$("[data-bionic-sample]", galleyBody).forEach(function (p) { paintSample(p, intensity); });
    if (galleyOut) galleyOut.textContent = intensity.toFixed(2);
    if (galleyWords) galleyWords.textContent = String(Core.countWords(galleyBody.textContent));
    if (galleyHeads) galleyHeads.textContent = String(headCharCount(galleyBody));
  }

  if (galleyBody && galleySlider) {
    renderGalley(galleySlider.value / 100);
    galleySlider.addEventListener("input", function () {
      renderGalley(galleySlider.value / 100);
    });
  }

  /* ----------------------------------------------------------------- lab --- */
  var demoSrc = $("#demo-src");
  var demoOut = $("#demo-out");
  var demoModes = $("#demo-modes");
  var intensity = $("#intensity");
  var intensityOut = $("#intensity-out");
  var statWords = $("#stat-words");
  var statChars = $("#stat-chars");
  var statMode = $("#stat-mode");
  var shuffle = $("#demo-shuffle");

  var lab = { mode: "half", intensity: 0.5 };

  function renderLab() {
    if (!demoOut || !demoSrc) return;
    Core.paint(demoOut, demoSrc.value, opts(lab.mode, lab.intensity));
    if (statWords) statWords.textContent = String(Core.countWords(demoSrc.value));
    if (statChars) statChars.textContent = String(headCharCount(demoOut));
    if (statMode) statMode.textContent = lab.mode;
    if (intensityOut) intensityOut.textContent = lab.intensity.toFixed(2);
    if (demoModes) {
      $$("button", demoModes).forEach(function (b) {
        var on = b.getAttribute("data-mode") === lab.mode;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }
  }

  if (demoModes) {
    Core.MODES.forEach(function (m) {
      var b = doc.createElement("button");
      b.type = "button";
      b.setAttribute("data-mode", m.id);
      b.setAttribute("aria-pressed", "false");
      b.title = m.description;
      b.textContent = m.label;
      b.addEventListener("click", function () {
        lab.mode = m.id;
        renderLab();
      });
      demoModes.appendChild(b);
    });
  }

  if (intensity) {
    intensity.addEventListener("input", function () {
      lab.intensity = clamp(intensity.value / 100, 0.2, 0.9);
      renderLab();
    });
  }
  if (demoSrc) demoSrc.addEventListener("input", renderLab);

  var SHUFFLE_TEXTS = [
    "Reading is a sequence of small jumps. The eye lands on a word, takes in enough to recognise it, then moves on. A fixation point at the start of a word gives that landing a predictable place. When the leading letters carry more weight, the rest of the word is easier to infer, and the line keeps its rhythm.",
    "The extension walks the visible text nodes of the page and leaves everything else alone. Scripts, styles, form fields and code blocks are skipped, and anything marked off-limits stays exactly as the author wrote it.",
    "Five modes anchor a different part of the word. Half bolds the opening half, vowel anchor stops at the first vowel group, and low distraction fades the remainder instead of asking for attention."
  ];
  var shuffleIndex = 0;
  if (shuffle && demoSrc) {
    shuffle.addEventListener("click", function () {
      shuffleIndex = (shuffleIndex + 1) % SHUFFLE_TEXTS.length;
      demoSrc.value = SHUFFLE_TEXTS[shuffleIndex];
      renderLab();
    });
  }
  renderLab();

  /* ------------------------------------------------------------- compare --- */
  var compare = $("#compare");
  if (compare) {
    var compareTop = $("#compare-top");
    var compareRule = $("#compare-rule");
    var compareHandle = $("#compare-handle");
    var comparePct = $("#compare-pct");
    var split = 50;

    function setSplit(p) {
      split = clamp(p, 0, 100);
      if (compareTop) compareTop.style.clipPath = "inset(0 " + (100 - split) + "% 0 0)";
      if (compareRule) compareRule.style.left = split + "%";
      if (compareHandle) compareHandle.style.left = split + "%";
      if (comparePct) comparePct.textContent = Math.round(split) + "%";
      compare.setAttribute("aria-valuenow", String(Math.round(split)));
      compare.setAttribute(
        "aria-valuetext",
        Math.round(split) + "% bionic, " + Math.round(100 - split) + "% as written"
      );
    }

    function splitFromEvent(e) {
      var rect = compare.getBoundingClientRect();
      return ((e.clientX - rect.left) / rect.width) * 100;
    }

    var dragging = false;
    compare.addEventListener("pointerdown", function (e) {
      dragging = true;
      compare.setPointerCapture(e.pointerId);
      setSplit(splitFromEvent(e));
      e.preventDefault();
    });
    compare.addEventListener("pointermove", function (e) {
      if (dragging) setSplit(splitFromEvent(e));
    });
    compare.addEventListener("pointerup", function () { dragging = false; });
    compare.addEventListener("pointercancel", function () { dragging = false; });
    compare.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") { setSplit(split - 4); e.preventDefault(); }
      else if (e.key === "ArrowRight" || e.key === "ArrowUp") { setSplit(split + 4); e.preventDefault(); }
      else if (e.key === "Home") { setSplit(0); e.preventDefault(); }
      else if (e.key === "End") { setSplit(100); e.preventDefault(); }
    });
    setSplit(50);
  }

  /* -------------------------------------------------------------- reveal --- */
  var revealEls = $$("[data-reveal]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (en) { return en.isIntersecting; });
      batch.forEach(function (en, i) {
        en.target.style.transitionDelay = (i * 70) + "ms";
        en.target.classList.add("is-in");
        revealObserver.unobserve(en.target);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ------------------------------------------------------------- metrics --- */
  var counters = $$("[data-count]");
  function finishCounter(el) {
    el.textContent = el.getAttribute("data-count") + (el.getAttribute("data-suffix") || "");
  }
  if (counters.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      counters.forEach(finishCounter);
    } else {
      var countObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target;
          countObserver.unobserve(el);
          var target = parseInt(el.getAttribute("data-count"), 10) || 0;
          var suffix = el.getAttribute("data-suffix") || "";
          var start = null;
          var DURATION = 1100;
          function tick(now) {
            if (start === null) start = now;
            var t = clamp((now - start) / DURATION, 0, 1);
            var eased = 1 - Math.pow(1 - t, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (t < 1) window.requestAnimationFrame(tick);
          }
          window.requestAnimationFrame(tick);
        });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { countObserver.observe(el); });
    }
  }

  /* ------------------------------------------------------------------ qa --- */
  $$(".qa__item").forEach(function (item) {
    var q = $(".qa__q", item);
    var a = $(".qa__a", item);
    if (!q || !a) return;
    q.addEventListener("click", function () {
      var open = item.classList.contains("is-open");
      if (open) {
        a.style.height = a.scrollHeight + "px";
        void a.offsetHeight; /* reflow so the transition has a start value */
        a.style.height = "0px";
        item.classList.remove("is-open");
        q.setAttribute("aria-expanded", "false");
      } else {
        item.classList.add("is-open");
        q.setAttribute("aria-expanded", "true");
        a.style.height = a.scrollHeight + "px";
      }
    });
    a.addEventListener("transitionend", function () {
      if (item.classList.contains("is-open")) a.style.height = "auto";
    });
  });

  /* -------------------------------------------------------- terminal copy --- */
  var termCopy = $("#term-copy");
  if (termCopy) {
    termCopy.addEventListener("click", function () {
      var body = termCopy.closest(".term");
      var lines = $$(".term__line", body).map(function (line) {
        return $$("span", line).map(function (s) { return s.textContent; }).join(" ").replace(/^\$\s+/, "$ ").replace(/^#\s+/, "# ");
      });
      var text = lines.join("\n");
      function done() {
        termCopy.textContent = "Copied";
        termCopy.classList.add("is-copied");
        window.setTimeout(function () {
          termCopy.textContent = "Copy all";
          termCopy.classList.remove("is-copied");
        }, 1400);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else {
        var ta = doc.createElement("textarea");
        ta.value = text;
        doc.body.appendChild(ta);
        ta.select();
        try { doc.execCommand("copy"); } catch (e) { /* clipboard unavailable */ }
        doc.body.removeChild(ta);
        done();
      }
    });
  }
})();
