/*
 * bionic-page — art and interaction.
 *
 * Two canvas pieces and one real control, all offline and all cheap:
 *
 *   .art--hero    a dense field of split dashes (a page of words) with an
 *                 emphasis wave travelling through it.
 *   .art--mark    (styled in identity.css) the wordmark split at a travelling
 *                 fixation boundary, over the accent glow.
 *   .bpfloat      the extension's floating control, made real. Drag it, press
 *                 it, and fixation turns off across the whole page.
 *
 * Everything is colour-read from the design tokens, so light and dark both
 * work, and every animation is disabled under prefers-reduced-motion.
 */
(function () {
  "use strict";

  var reduce = false;
  try {
    reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (err) {
    /* matchMedia is always present in supported browsers; ignore if not. */
  }

  /* ---- colour ---------------------------------------------------------- */

  function parseColor(value) {
    var v = String(value || "").trim();
    var hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hex) {
      var h = hex[1];
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      return [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
      ];
    }
    var rgb = v.match(/^rgba?\(([^)]+)\)$/i);
    if (rgb) {
      var parts = rgb[1].split(/[,\s/]+/).filter(Boolean);
      return [Number(parts[0]) || 0, Number(parts[1]) || 0, Number(parts[2]) || 0];
    }
    return null;
  }

  function rgba(value, alpha) {
    var c = parseColor(value);
    if (!c) return "rgba(0,0,0," + alpha + ")";
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + alpha + ")";
  }

  function tokens() {
    var cs = getComputedStyle(document.documentElement);
    function read(name, fallback) {
      var v = cs.getPropertyValue(name).trim();
      return v || fallback;
    }
    return {
      accent: read("--accent", "#4f46e5"),
      swash: read("--swash", "#c026d3"),
      ink: read("--ink", "#0a0a0a"),
      mute: read("--mute", "#71717a"),
    };
  }

  /* ---- deterministic noise --------------------------------------------
     A tiny integer hash, so every reload draws the same field instead of
     flickering into a different one. */

  function hash(n) {
    var x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
    x ^= x >>> 13;
    x = Math.imul(x, 0xc2b2ae35);
    x ^= x >>> 16;
    return (x >>> 0) / 4294967296;
  }

  /* ---- canvas harness --------------------------------------------------- */

  function mint(canvas, paint) {
    var ctx = canvas.getContext("2d");
    if (!ctx) return function () {};
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0;
    var h = 0;
    var palette = tokens();
    var t = 0;
    var raf = 0;
    var last = 0;
    var visible = true;
    var alive = true;
    var observer = null;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      palette = tokens();
      if (reduce) paint(ctx, w, h, 6, palette);
    }

    function step(now) {
      if (!alive) return;
      if (visible && !document.hidden) {
        /* ~30fps is plenty for a slow wave and leaves the main thread free. */
        if (now - last >= 32) {
          last = now;
          t += 1 / 30;
          paint(ctx, w, h, t, palette);
        }
      }
      raf = window.requestAnimationFrame(step);
    }

    /* Returns its own teardown. Client-side navigation swaps the page under
       the canvas, so the loop has to be stoppable or it keeps drawing into a
       detached element forever. */
    function stop() {
      alive = false;
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      if (observer) observer.disconnect();
    }

    resize();

    if (reduce) {
      window.addEventListener("resize", resize, { passive: true });
      return stop;
    }

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        function (entries) {
          visible = entries[0] ? entries[0].isIntersecting : true;
        },
        { rootMargin: "120px" },
      );
      observer.observe(canvas);
    }

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener(
      "themechange",
      function () {
        palette = tokens();
      },
      { passive: true },
    );
    raf = window.requestAnimationFrame(step);

    return stop;
  }

  /* ---- hero: a page of words, under an emphasis wave -------------------- */

  function field(ctx, w, h, t, p) {
    ctx.clearRect(0, 0, w, h);

    var cellW = 30;
    var cellH = 18;
    var cols = Math.ceil(w / cellW) + 1;
    var rows = Math.ceil(h / cellH) + 1;
    var cx = w * 0.3;
    var cy = h * 0.42;
    var cx2 = w * 0.86 - Math.cos(t * 0.32) * w * 0.1;
    var cy2 = h * 0.7 + Math.sin(t * 0.27) * h * 0.14;

    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < cols; col++) {
        var i = row * cols + col;
        var r1 = hash(i * 2 + 1);
        var r2 = hash(i * 2 + 977);
        var x = col * cellW + 6;
        var y = row * cellH + 6;
        var full = cellW - 12;
        var len = full * (0.45 + r1 * 0.55);
        var head = len * (0.3 + r2 * 0.34);

        /* Two wave sources, so the field never repeats in an obvious way. */
        var d1 = Math.hypot(x - cx, y - cy);
        var d2 = Math.hypot(x - cx2, y - cy2);
        var pulse =
          0.5 +
          0.5 * Math.sin(d1 / 46 - t * 1.15) * (0.62 + 0.38 * Math.sin(d2 / 61 - t * 0.7));

        /* Deliberately quiet: this sits behind a headline, so it reads as
           paper texture with a pulse in it, never as content to look at. */
        var accent = pulse > 0.9 && r2 > 0.7;
        var headAlpha = 0.09 + 0.31 * Math.max(0, pulse);
        var tailAlpha = 0.035 + 0.075 * (1 - pulse);

        ctx.fillStyle = rgba(accent ? p.swash : p.ink, tailAlpha);
        ctx.fillRect(x + head, y, Math.max(1, len - head), 2);

        ctx.fillStyle = rgba(accent ? p.swash : p.ink, headAlpha);
        ctx.fillRect(x, y, Math.max(1, head), 2);
      }
    }
  }


  /* ---- the floating control -------------------------------------------- */

  var KEY_FIX = "bionic-page-fixation";
  var KEY_POS = "bionic-page-float";

  function store(key, value) {
    try {
      if (value === undefined) return window.localStorage.getItem(key);
      if (value === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, value);
    } catch (err) {
      /* private mode: the control still works, it just will not remember. */
    }
    return null;
  }

  function setFixation(on) {
    document.documentElement.setAttribute("data-fixation", on ? "on" : "off");
    store(KEY_FIX, on ? null : "off");
    var btn = document.querySelector(".bpfloat");
    if (btn) {
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.setAttribute(
        "aria-label",
        on ? "Turn bionic emphasis off on this page" : "Turn bionic emphasis on",
      );
    }
  }

  function floatingControl() {
    if (document.querySelector(".bpfloat")) return;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "bpfloat";
    btn.setAttribute("aria-pressed", "true");
    btn.setAttribute("aria-label", "Turn bionic emphasis off on this page");

    var dot = document.createElement("span");
    dot.className = "bpfloat__dot";
    dot.setAttribute("aria-hidden", "true");

    var label = document.createElement("span");
    label.className = "bpfloat__label";
    label.textContent = "Bp";

    btn.appendChild(dot);
    btn.appendChild(label);
    document.body.appendChild(btn);

    var saved = store(KEY_POS);
    if (saved) {
      try {
        var pos = JSON.parse(saved);
        if (typeof pos.x === "number" && typeof pos.y === "number") {
          btn.classList.add("bpfloat--placed");
          btn.style.left = pos.x + "px";
          btn.style.top = pos.y + "px";
        }
      } catch (err) {
        /* a corrupt entry is not worth anything but a reset. */
      }
    }

    var down = null;
    var moved = false;

    function clamp() {
      var r = btn.getBoundingClientRect();
      return {
        maxX: Math.max(8, window.innerWidth - r.width - 8),
        maxY: Math.max(8, window.innerHeight - r.height - 8),
      };
    }

    btn.addEventListener("pointerdown", function (event) {
      var rect = btn.getBoundingClientRect();
      down = { dx: event.clientX - rect.left, dy: event.clientY - rect.top, x: event.clientX, y: event.clientY };
      moved = false;
      btn.setPointerCapture(event.pointerId);
    });

    btn.addEventListener("pointermove", function (event) {
      if (!down) return;
      if (Math.abs(event.clientX - down.x) + Math.abs(event.clientY - down.y) > 4) moved = true;
      if (!moved) return;
      var limit = clamp();
      var x = Math.min(limit.maxX, Math.max(8, event.clientX - down.dx));
      var y = Math.min(limit.maxY, Math.max(8, event.clientY - down.dy));
      btn.classList.add("bpfloat--placed");
      btn.style.left = x + "px";
      btn.style.top = y + "px";
    });

    function release(event) {
      if (!down) return;
      down = null;
      try {
        btn.releasePointerCapture(event.pointerId);
      } catch (err) {
        /* pointer already released */
      }
      if (moved) {
        var rect = btn.getBoundingClientRect();
        store(KEY_POS, JSON.stringify({ x: Math.round(rect.left), y: Math.round(rect.top) }));
      }
    }

    btn.addEventListener("pointerup", release);
    btn.addEventListener("pointercancel", release);

    btn.addEventListener("click", function (event) {
      if (moved) {
        event.preventDefault();
        return;
      }
      setFixation(document.documentElement.getAttribute("data-fixation") === "off");
    });

    if (store(KEY_FIX) === "off") setFixation(false);
  }

  /* ---- boot ------------------------------------------------------------- */

  function headline() {
    var title = document.querySelector(".hero__title");
    if (!title) return;
    var fix = title.querySelector(".hero__title-fix");
    if (!fix) return;

    function measure() {
      title.style.setProperty("--caret-w", title.clientWidth + "px");
    }
    if (window.__bionicHeadlineResize) {
      window.removeEventListener("resize", window.__bionicHeadlineResize);
    }
    window.__bionicHeadlineResize = measure;
    measure();
    window.addEventListener("resize", measure, { passive: true });

    if (window.__bionicHeadlineTimer) {
      clearTimeout(window.__bionicHeadlineTimer);
      window.__bionicHeadlineTimer = 0;
    }
    title.classList.remove("is-writing", "is-written");

    var heads = fix.querySelectorAll("b.bp-head");
    if (reduce || heads.length === 0) {
      title.classList.add("is-written");
      return;
    }

    /* The wave: the heads thicken in reading order, so the emphasis is a real
       weight change you can watch arrive rather than a static reveal. The
       heads are already at the heavy weight here, so the headline is measured
       in its finished state and that height is reserved — the finished state
       is the wider one, and without the reservation the page below would jump
       a line as the emphasis lands. */
    var span = 420;
    var step = 55;
    var total = span + step * Math.max(0, heads.length - 1);
    var finished = title.getBoundingClientRect().height;
    if (finished > 0) title.style.minHeight = finished + "px";

    for (var i = 0; i < heads.length; i++) {
      heads[i].style.setProperty("--i", String(i));
    }
    title.style.setProperty("--write", total + "ms");
    title.classList.add("is-writing");
    window.__bionicHeadlineTimer = setTimeout(function () {
      title.classList.remove("is-writing");
      title.classList.add("is-written");
      window.__bionicHeadlineTimer = 0;
    }, total + 120);
  }

  function boot() {
    /* Anything still running from the previous page is stopped first: with
       client-side navigation the old canvas is detached, and its loop would
       otherwise keep drawing into it forever. */
    var stops = window.__bionicArt || [];
    for (var i = 0; i < stops.length; i++) stops[i]();
    window.__bionicArt = [];

    var hero = document.querySelector(".art--hero");
    if (hero) window.__bionicArt.push(mint(hero, field));

    headline();
    floatingControl();
  }

  /* Registered so the router can re-initialise the page after a swap. */
  window.BionicSite = window.BionicSite || { init: [] };
  window.BionicSite.init.push(boot);

  /* The theme toggle is a plain attribute flip, so mirror it as an event the
     canvases can listen for instead of polling the computed style. */
  /* demo.js dispatches "themechange" when the picker changes; the canvases
     listen for it, so they no longer need to know about the control. */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
