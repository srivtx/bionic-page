/* bionic-page — site behaviour.
 *
 * One page, one script. It paints the fixation samples with the extension's own
 * compiled algorithm, runs the live demo and the compare divider, and wires the
 * chrome around them: theme, navigation, the emphasis switch, the reading card,
 * the rails, the FAQ, and the small pieces of scroll behaviour.
 *
 * No network. If assets/core.js did not load, plain text stays and the demo
 * controls are hidden instead of throwing.
 */
(function () {
  "use strict";

  var root = document.documentElement;
  var Core = window.BionicCore;
  var reduceMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function $(id) { return document.getElementById(id); }
  function q(selector, scope) { return (scope || document).querySelector(selector); }
  function qa(selector, scope) { return (scope || document).querySelectorAll(selector); }
  function options(mode, intensity) {
    return Object.assign({}, Core.DEFAULT_SETTINGS, { mode: mode, intensity: intensity });
  }

  /* ---- Theme: dark, light ------------------------------------------------
     The attribute is always present, light by default, so the toggle is the
     only thing that decides. The stored value is applied before first paint by
     the inline script in the head. */
  var THEME_KEY = "bionic-page-theme";
  var themeToggle = $("theme-toggle");
  var themeToggleText = $("theme-toggle-text");

  function currentTheme() {
    var attribute = root.getAttribute("data-theme");
    if (attribute) return attribute;
    return typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  function syncThemeButton() {
    if (!themeToggle) return;
    var dark = currentTheme() === "dark";
    themeToggle.setAttribute("aria-pressed", String(dark));
    if (themeToggleText) themeToggleText.textContent = dark ? "Light" : "Dark";
  }
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try {
        window.localStorage.setItem(THEME_KEY, next);
      } catch (err) {
        void 0;
      }
      syncThemeButton();
    });
  }
  syncThemeButton();

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

  /* ---- Page wiring ------------------------------------------------------
     The samples are painted with the real algorithm, so what the page shows is
     what the extension injects. */
  function paintSample(el, mode, intensity) {
    Core.paint(el, el.textContent, options(mode, intensity || Core.DEFAULT_SETTINGS.intensity));
  }

  /* Fail soft: no core, no demo. Hide the controls, keep plain text. */
  if (!Core || typeof Core.paint !== "function") {
    each(qa(".bdemo__tools, .readcard__ctrl"), function (el) {
      el.hidden = true;
    });
    return;
  }

  each(qa("[data-bionic-sample]"), function (el) {
    paintSample(el, el.getAttribute("data-bionic-sample"));
  });

  /* ---- The headline, written into place ---------------------------------
     Each head carries its index so the wave can be staggered in CSS. The tail
     is not dimmed here: the hero shows full-strength text with heavy anchors,
     which is the point of the effect. */
  var heroTitle = $("hero-title");
  if (heroTitle) {
    /* Painting the run replaces the element's children, which is what the
       design does too — its caret span in the markup does not survive the
       render, so there is no cursor next to the headline. */
    Core.paint(heroTitle, heroTitle.textContent, options("half", Core.DEFAULT_SETTINGS.intensity));
    /* The entrance that reveals it is set up below, once the card is painted. */
    heroTitle.classList.add("is-written");
  }

  /* ---- The reading card -------------------------------------------------
     The slider repaints the card so the effect is visible while you drag. */
  var readcardBody = $("readcard-body");
  var heroRange = $("hero-intensity");
  var heroRangeOut = $("hero-intensity-out");
  if (readcardBody && heroRange) {
    var cardIntensity = Core.DEFAULT_SETTINGS.intensity;
    Core.paint(readcardBody, readcardBody.textContent, options("half", cardIntensity));
    if (heroRangeOut) heroRangeOut.textContent = cardIntensity.toFixed(2) + " · half";
    heroRange.addEventListener("input", function () {
      cardIntensity = Number(heroRange.value) / 100;
      if (heroRangeOut) heroRangeOut.textContent = cardIntensity.toFixed(2) + " · live";
      if (!animDone) return;
      Core.paint(readcardBody, readcardBody.textContent, options("classic", cardIntensity));
      each(qa(".bp-head, .bp-tail, span", readcardBody), function (node) {
        node.classList.add("pre-word", "on");
        node.style.transition = "none";
        node.style.filter = "none";
        node.style.opacity = "1";
      });
    });
  }

  /* ---- Hero word chips -------------------------------------------------- */
  var heroWords = $("hero-words");
  if (heroWords) {
    ["anchoring", "fixation", "reversible", "offline", "rhythm", "predictable"].forEach(
      function (word, i) {
        var chip = document.createElement("span");
        chip.className = "wchip";
        chip.textContent = word;
        chip.style.animationDelay = 4.6 + i * 0.08 + "s";
        Core.paint(chip, word, options("dim", 0.5));
        heroWords.appendChild(chip);
      },
    );
  }

  /* ---- the entrance -----------------------------------------------------
     Copied from the design. A dot travels the headline word by word, leaving a
     trail and a ring, and each word brightens as the beam reaches it; then the
     beam sweeps into the reading card and the rest of the card cascades. A
     preloader is held until the page has actually loaded, and never longer
     than 2.6s. */
  var animCore = window.BionicCore;
  var heroEl = q(".hero");
  var titleEl = q(".hero__title");
  var readcard = $("readcard");
  var beamBody = $("readcard-body");
  var fadeEls = qa("[data-hero-fade]");
  var animDone = false;
  var beamDot = null;
  var extras = [];
  var pairs = [];
  var cardWords = [];
  var cardExtras = [];

  function beamRect(el) {
    var r = el.getBoundingClientRect();
    var h = heroEl.getBoundingClientRect();
    return { x: r.left - h.left, y: r.top - h.top, w: r.width, h: r.height };
  }
  function beamTrail(x0, y0, x1, y1) {
    if (reduceMotion) return;
    var dx = x1 - x0;
    var dy = y1 - y0;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 16) return;
    var t = document.createElement("span");
    t.className = "fx-trail";
    t.style.left = x0 + "px";
    t.style.top = y0 - 1 + "px";
    t.style.width = len + "px";
    t.style.transform = "rotate(" + Math.atan2(dy, dx) + "rad)";
    t.style.transformOrigin = "0 50%";
    heroEl.appendChild(t);
    t.addEventListener("animationend", function () {
      t.remove();
    });
  }
  function beamRing(x, y) {
    if (reduceMotion) return;
    var r = document.createElement("span");
    r.className = "fx-ring";
    r.style.left = x - 5 + "px";
    r.style.top = y - 5 + "px";
    heroEl.appendChild(r);
    r.addEventListener("animationend", function () {
      r.remove();
    });
  }
  function wait(ms) {
    return new Promise(function (res) {
      setTimeout(res, ms);
    });
  }
  function beamMove(x, y, dur) {
    return new Promise(function (res) {
      if (reduceMotion) {
        res();
        return;
      }
      beamDot.style.transition =
        "left " + dur + "ms cubic-bezier(.5,0,.15,1), top " + dur + "ms cubic-bezier(.5,0,.15,1), opacity .4s ease";
      void beamDot.offsetWidth;
      beamDot.style.left = x - 5 + "px";
      beamDot.style.top = y - 5 + "px";
      setTimeout(res, dur);
    });
  }
  function beamIgnite(el) {
    el.classList.add("on");
    if (el.classList.contains("bp-head")) el.classList.add("lit");
  }

  /* Wrap the bare text nodes of the headline in spans, so a run that the
     algorithm left as plain text can be dimmed and lit with the rest. */
  function beamTargets() {
    if (reduceMotion || !heroEl || !heroTitle) return;
    var cur = null;
    each(Array.prototype.slice.call(heroTitle.childNodes), function (node) {
      if (node.nodeType === 1 && node.classList.contains("bp-head")) {
        cur = [node];
        pairs.push(cur);
      } else if (cur && node.nodeType === 3 && node.textContent.trim()) {
        cur.push(node);
      } else if (cur && node.nodeType === 1 && node.classList.contains("bp-tail")) {
        cur.push(node);
      } else if (node.nodeType === 3 && node.textContent.trim()) {
        extras.push(node);
      }
    });
    /* A text node cannot carry a class or a transition, so it becomes a span
       in place. */
    function wrap(node) {
      var span = document.createElement("span");
      span.textContent = node.textContent;
      node.parentNode.replaceChild(span, node);
      return span;
    }
    extras = extras.map(wrap);
    pairs = pairs.map(function (nodes) {
      return nodes.map(function (node) {
        return node.nodeType === 3 ? wrap(node) : node;
      });
    });
    each(Array.prototype.slice.call(heroTitle.childNodes), function (node) {
      if (node.nodeType !== 1) return;
      if (node.classList.contains("hero__caret")) return;
      if (node.classList.contains("hero__highlight")) return;
      node.classList.add("pre-word");
    });
    if (beamBody) {
      cardWords = Array.prototype.slice.call(beamBody.querySelectorAll(".bp-head"));
      each(cardWords, function (word) {
        word.classList.add("pre-word");
      });
      each(qa("p", beamBody), function (para) {
        each(Array.prototype.slice.call(para.childNodes), function (node) {
          if (node.nodeType === 3 && node.textContent.trim()) {
            cardExtras.push(wrap(node));
          }
        });
      });
    }
    each(fadeEls, function (el) {
      el.classList.add("pre");
    });
  }

  async function opening() {
    if (reduceMotion || !heroEl) {
      fadeEls.concat([readcard]).forEach(function (el) {
        if (el) el.classList.add("pre", "on");
      });
      animDone = true;
      return;
    }
    beamDot = document.createElement("span");
    beamDot.className = "fx-dot";
    heroEl.appendChild(beamDot);

    await wait(120);
    if (fadeEls[0]) fadeEls[0].classList.add("on"); /* metabar */
    await wait(340);

    /* the beam reads the title, word by word */
    beamDot.style.opacity = "1";
    var prev = null;
    for (var i = 0; i < pairs.length; i++) {
      var rc = beamRect(pairs[i][0]);
      var x = rc.x + rc.w * 0.45;
      var y = rc.y + rc.h * 0.62;
      if (prev) {
        beamTrail(prev.x, prev.y, x, y);
        var d = Math.sqrt((x - prev.x) * (x - prev.x) + (y - prev.y) * (y - prev.y));
        await beamMove(x, y, Math.min(60 + d * 0.55, 320));
      } else {
        await beamMove(x, y, 260);
      }
      beamRing(x, y);
      pairs[i].forEach(beamIgnite);
      prev = { x: x, y: y };
      if (i === 1 && fadeEls[1]) fadeEls[1].classList.add("on"); /* lede */
      if (i === 3 && fadeEls[2]) fadeEls[2].classList.add("on"); /* buttons */
      if (i === 5 && fadeEls[3]) fadeEls[3].classList.add("on"); /* chips */
      await wait(170);
    }
    extras.forEach(beamIgnite);
    await wait(200);

    /* sweep into the reading card */
    if (fadeEls[4]) fadeEls[4].classList.add("on");
    await wait(260);
    if (cardWords.length && prev) {
      var rc0 = beamRect(cardWords[0]);
      var fx = rc0.x + rc0.w * 0.45;
      var fy = rc0.y + rc0.h * 0.6;
      beamTrail(prev.x, prev.y, fx, fy);
      await beamMove(fx, fy, 520);
      var stopAt = Math.min(cardWords.length, 18);
      var prev2 = { x: fx, y: fy };
      for (var j = 0; j < stopAt; j++) {
        var w = cardWords[j];
        var r3 = beamRect(w);
        var wx = r3.x + r3.w * 0.45;
        var wy = r3.y + r3.h * 0.6;
        if (j > 0) {
          beamTrail(prev2.x, prev2.y, wx, wy);
          var dd = Math.sqrt((wx - prev2.x) * (wx - prev2.x) + (wy - prev2.y) * (wy - prev2.y));
          await beamMove(wx, wy, Math.min(40 + dd * 0.6, 150));
        }
        if (j % 3 === 0) beamRing(wx, wy);
        beamIgnite(w);
        prev2 = { x: wx, y: wy };
        await wait(78);
      }
      beamDot.style.opacity = "0";

      /* cascade the rest of the card from left to right */
      var br = beamRect(beamBody);
      cardWords.forEach(function (w2, k) {
        if (k < stopAt) return;
        var r4 = beamRect(w2);
        var frac = Math.max(0, Math.min(1, (r4.x - br.x) / br.width));
        w2.style.transitionDelay = frac * 460 + "ms";
        beamIgnite(w2);
      });
      cardExtras.forEach(function (el, k) {
        el.style.transitionDelay = 150 + (k % 6) * 60 + "ms";
        beamIgnite(el);
      });
    }

    /* one pulse on the intensity slider, like a heartbeat */
    var rng = $("hero-intensity");
    if (rng) {
      await wait(500);
      rng.classList.add("pulse");
      setTimeout(function () {
        rng.classList.remove("pulse");
      }, 1100);
    }
    animDone = true;
  }

  beamTargets();

  /* ---- preloader -------------------------------------------------------- */
  var loader = $("loader");
  function dismissLoader() {
    if (!loader) {
      opening();
      return;
    }
    loader.classList.add("done");
    setTimeout(function () {
      if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
      loader = null;
    }, 650);
    setTimeout(opening, 240);
  }
  if (reduceMotion) {
    if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
    loader = null;
    opening();
  } else {
    var minShown = wait(1250);
    var loaded = new Promise(function (res) {
      if (document.readyState === "complete") res();
      else window.addEventListener("load", res);
      setTimeout(res, 2600); /* never trap the user */
    });
    Promise.all([minShown, loaded]).then(dismissLoader);
  }

  /* ---- magnetic buttons, a card that tilts, a rail that skews ------------ */
  var coarsePointer =
    typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;

  if (!reduceMotion && !coarsePointer) {
    each(qa("[data-magnet], .nav__gh, .totop"), function (el) {
      var magnetRaf = null;
      el.addEventListener("mousemove", function (event) {
        var r = el.getBoundingClientRect();
        var dx = (event.clientX - (r.left + r.width / 2)) / r.width;
        var dy = (event.clientY - (r.top + r.height / 2)) / r.height;
        if (magnetRaf) window.cancelAnimationFrame(magnetRaf);
        magnetRaf = window.requestAnimationFrame(function () {
          el.style.transform = "translate(" + dx * 5 + "px," + dy * 4 + "px)";
        });
      });
      el.addEventListener("mouseleave", function () {
        if (magnetRaf) window.cancelAnimationFrame(magnetRaf);
        el.style.transform = "";
      });
    });

    if (readcard) {
      var tiltRaf = null;
      readcard.addEventListener("mousemove", function (event) {
        var r = readcard.getBoundingClientRect();
        var dx = (event.clientX - (r.left + r.width / 2)) / r.width;
        var dy = (event.clientY - (r.top + r.height / 2)) / r.height;
        if (tiltRaf) window.cancelAnimationFrame(tiltRaf);
        tiltRaf = window.requestAnimationFrame(function () {
          readcard.style.transition = "transform 90ms ease-out";
          readcard.style.transform =
            "rotateY(" + dx * 4 + "deg) rotateX(" + -dy * 3.4 + "deg) translateY(-2px)";
        });
      });
      readcard.addEventListener("mouseleave", function () {
        if (tiltRaf) window.cancelAnimationFrame(tiltRaf);
        readcard.style.transition = "transform 500ms cubic-bezier(.22,.9,.24,1)";
        readcard.style.transform = "";
      });
    }

    /* the rails lean into the scroll, then settle */
    var tilt = $("railband-tilt");
    if (tilt) {
      var lastY = window.scrollY || 0;
      var skew = 0;
      var target = 0;
      var skewRaf = null;
      function skewLoop() {
        skew += (target - skew) * 0.12;
        target *= 0.8;
        tilt.style.transform = Math.abs(skew) > 0.04 ? "skewX(" + skew.toFixed(2) + "deg)" : "";
        if (Math.abs(skew) > 0.04 || Math.abs(target) > 0.04) {
          skewRaf = window.requestAnimationFrame(skewLoop);
        } else {
          skewRaf = null;
          tilt.style.transform = "";
        }
      }
      window.addEventListener(
        "scroll",
        function () {
          var y = window.scrollY || 0;
          target = Math.max(-3.2, Math.min(3.2, (y - lastY) * 0.09));
          lastY = y;
          if (!skewRaf) skewRaf = window.requestAnimationFrame(skewLoop);
        },
        { passive: true },
      );
    }
  }

  /* ---- the numbers count up when they arrive ---------------------------- */
  var numbers = qa(".metric__n");
  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var suffix = el.getAttribute("data-suffix") || "";
    if (isNaN(target)) return;
    if (reduceMotion) {
      el.textContent = target + suffix;
      return;
    }
    var started = null;
    var duration = 1100;
    function countStep(t) {
      if (!started) started = t;
      var k = Math.min(1, (t - started) / duration);
      k = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(target * k) + suffix;
      if (k < 1) window.requestAnimationFrame(countStep);
    }
    window.requestAnimationFrame(countStep);
  }
  if ("IntersectionObserver" in window && !reduceMotion) {
    var countObserver = new IntersectionObserver(
      function (entries) {
        each(entries, function (entry) {
          if (!entry.isIntersecting) return;
          countUp(entry.target);
          countObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.5 },
    );
    each(numbers, function (n) {
      countObserver.observe(n);
    });
  } else {
    each(numbers, countUp);
  }

  /* ---- Rails: duplicate each track so the loop has no seam -------------- */
  each(qa(".rail__track"), function (track) {
    each(Array.prototype.slice.call(track.children), function (child) {
      var copy = child.cloneNode(true);
      copy.setAttribute("aria-hidden", "true");
      /* The browser logos are referenced by id from the originals; a duplicate
         id would be two elements claiming the same name. */
      each(qa("[id]", copy), function (node) {
        node.removeAttribute("id");
      });
      track.appendChild(copy);
    });
  });

  /* ---- Live demo -------------------------------------------------------- */
  var state = { mode: "half", intensity: Core.DEFAULT_SETTINGS.intensity };
  var src = $("demo-src");
  var out = $("demo-out");
  var chips = $("demo-modes");
  var range = $("intensity");
  var rangeOut = $("intensity-out");
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
    /* The labels around these numbers are markup now, so only the value is
       written here. */
    if (statWords) statWords.textContent = String(Core.countWords(text));
    if (statChars) statChars.textContent = String(chars);
    if (statMode) statMode.textContent = state.mode;
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
      if (rangeOut) rangeOut.textContent = state.intensity.toFixed(2);
      render();
    });
    if (rangeOut) rangeOut.textContent = state.intensity.toFixed(2);
  }
  if (src) src.addEventListener("input", render);
  render();

  var shuffle = $("demo-shuffle");
  if (shuffle && src) {
    var PASSAGES = [
      "Reading is a sequence of small jumps. The eye lands on a word, takes in enough to recognise it, then moves on. A fixation point at the start of a word gives that landing a predictable place.",
      "Most reading advice is about speed. The more useful question is where your eye comes to rest. A consistent anchor at the start of each word removes one decision from every single word.",
      "Long documents are where the effect shows up. A short paragraph can be read in one glance regardless; the tenth screen of an article is where an anchor per word either helps you or does not.",
      "Typography has always done this. A bold or small-caps opening, a coloured initial, a heavier stem on the left of a letter — the eye is given somewhere to land, and the rest follows.",
      "Nothing is decided for the reader. Intensity, mode, minimum word length and the fade are all yours, per site if you want, and the original text nodes come back untouched the moment you switch it off.",
    ];
    var next = 0;
    shuffle.addEventListener("click", function () {
      src.value = PASSAGES[next % PASSAGES.length];
      next++;
      render();
    });
  }

  /* ---- Mode tiles: hover sweeps the intensity --------------------------- */
  if (Core.MODES) {
    each(qa(".tile"), function (tile) {
      var sample = q(".tile__sample", tile);
      if (!sample) return;
      var mode = sample.getAttribute("data-bionic-sample") || "half";
      var raf = 0;
      var t0 = 0;
      function sweep(now) {
        if (!t0) t0 = now;
        var phase = ((now - t0) % 2200) / 2200;
        /* Up and back, so the card breathes rather than jumping. */
        var wave = Math.sin(phase * Math.PI * 2);
        var intensity = Math.max(0.2, Math.min(0.9, 0.5 + wave * 0.22));
        Core.paint(sample, sample.textContent, options(mode, intensity));
        raf = window.requestAnimationFrame(sweep);
      }
      function stop() {
        if (raf) window.cancelAnimationFrame(raf);
        raf = 0;
        t0 = 0;
        Core.paint(sample, sample.textContent, options(mode, Core.DEFAULT_SETTINGS.intensity));
      }
      if (!reduceMotion) {
        tile.addEventListener("pointerenter", function () {
          if (!raf) raf = window.requestAnimationFrame(sweep);
        });
        tile.addEventListener("pointerleave", stop);
        tile.addEventListener("focusin", function () {
          if (!raf) raf = window.requestAnimationFrame(sweep);
        });
        tile.addEventListener("focusout", stop);
      }
    });
  }

  /* ---- Compare divider --------------------------------------------------
     One custom property drives the clip, the divider and the handle, so a drag
     is a single style write and nothing re-lays-out. Pointer drag, arrow keys
     for keyboards, and one slow sweep to show what it is for. */
  var compare = $("compare");
  if (compare) {
    var dragging = false;
    var touched = false;
    var split = 0.5;
    var pct = $("compare-pct");
    function paintSplit() {
      var value = Math.round(split * 100);
      compare.style.setProperty("--p", value + "%");
      compare.setAttribute("aria-valuenow", String(value));
      compare.setAttribute("aria-valuetext", value + "% bionic, " + (100 - value) + "% as written");
      if (pct) pct.textContent = value + "%";
    }
    function fromClientX(clientX) {
      var rect = compare.getBoundingClientRect();
      if (rect.width <= 0) return;
      split = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      paintSplit();
    }
    compare.addEventListener("pointerdown", function (event) {
      dragging = true;
      touched = true;
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
      touched = true;
      split = Math.min(1, Math.max(0, split));
      paintSplit();
    });
    paintSplit();

    if (!reduceMotion && "IntersectionObserver" in window) {
      var seen = new IntersectionObserver(function (entries) {
        each(entries, function (entry) {
          if (!entry.isIntersecting) return;
          seen.disconnect();
          if (touched) return;
          var started = 0;
          function step(now) {
            if (touched) return;
            if (!started) started = now;
            var t = Math.min(1, (now - started) / 1700);
            /* Out and back, easing both ends. */
            split = 0.5 + Math.sin(t * Math.PI) * 0.2;
            paintSplit();
            if (t < 1) window.requestAnimationFrame(step);
          }
          window.requestAnimationFrame(step);
        });
      }, { threshold: 0.4 });
      seen.observe(compare);
    }
  }

  /* ---- FAQ -------------------------------------------------------------- */
  each(qa(".faq__item"), function (item) {
    var button = q(".faq__q", item);
    var panel = q(".faq__a", item);
    if (!button || !panel) return;
    button.addEventListener("click", function () {
      var open = item.classList.toggle("open");
      button.setAttribute("aria-expanded", open ? "true" : "false");
      panel.style.maxHeight = open ? panel.scrollHeight + "px" : "";
    });
  });

  /* ---- Copy the install commands ---------------------------------------- */
  var copy = $("term-copy");
  var termBody = $("term-body");
  if (copy && termBody && navigator.clipboard) {
    copy.addEventListener("click", function () {
      var lines = [];
      each(qa(".term__line", termBody), function (line) {
        lines.push(line.textContent.replace(/\s+/g, " ").trim());
      });
      navigator.clipboard.writeText(lines.join("\n")).then(
        function () {
          copy.textContent = "Copied";
          window.setTimeout(function () {
            copy.textContent = "Copy all";
          }, 1600);
        },
        function () {
          void 0;
        },
      );
    });
  }

  /* ---- Scroll behaviour: progress, nav, reveals, spy, back to top ------- */
  var progress = $("progress");
  var header = $("nav");
  var totop = $("totop");

  function onScroll() {
    var y = window.pageYOffset || root.scrollTop || 0;
    var max = root.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    if (header) header.classList.toggle("scrolled", y > 8);
    if (totop) totop.classList.toggle("show", y > 640);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (totop) {
    totop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* Reveals are added here rather than in the markup, so a visitor without
     JavaScript sees the whole page instead of a blank one. */
  if (!reduceMotion && "IntersectionObserver" in window) {
    var rvEls = qa(
      ".section__head, .bdemo, .compare, .tiles .tile, .steps .step, .controls .panel, .grid--2 .card, .metrics .metric, .prose, .term, .faq__item, .railband__caption",
    );
    var groups = {};
    each(rvEls, function (el) {
      var parent = el.parentNode;
      if (!groups[parent]) groups[parent] = 0;
      var i = groups[parent];
      groups[parent] = i + 1;
      el.classList.add("rv");
      el.style.setProperty("--rd", Math.min(i * 0.08, 0.4) + "s");
    });
    var revealObserver = new IntersectionObserver(
      function (entries) {
        each(entries, function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    each(rvEls, function (el) {
      revealObserver.observe(el);
    });
  }

  /* Which section you are reading. */
  if ("IntersectionObserver" in window && nav) {
    var links = qa("a[href^='#']", nav);
    var spy = new IntersectionObserver(
      function (entries) {
        each(entries, function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.getAttribute("id");
          each(links, function (link) {
            if (link.getAttribute("href") === "#" + id) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    each(qa("section[id]"), function (section) {
      spy.observe(section);
    });
  }
})();
