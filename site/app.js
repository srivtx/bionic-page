/* Bionic Page — landing site demo.
   A small, self-contained copy of the extension's core algorithm. It renders
   the demo paragraph in place and restores it exactly when turned off. Every
   query is guarded, so the script is a no-op on pages without the demo. */
(function () {
  "use strict";

  var DEFAULT_MODE = "half";
  var DEFAULT_INTENSITY = 0.5;
  var RULE = "0 1 1 2 0.4";
  var VOWELS = "aeiouy";

  /* ---------- helpers ---------- */

  function isWordChar(ch) {
    return /[\p{L}\p{N}'-]/u.test(ch);
  }

  function isVowel(ch) {
    return VOWELS.indexOf(ch.toLowerCase()) !== -1;
  }

  /* Split a whitespace-delimited chunk into leading punctuation, the word
     core, and trailing punctuation. Punctuation is preserved untouched. */
  function splitChunk(chunk) {
    var start = 0;
    while (start < chunk.length && !isWordChar(chunk.charAt(start))) start++;
    var end = chunk.length;
    while (end > start && !isWordChar(chunk.charAt(end - 1))) end--;
    return {
      lead: chunk.slice(0, start),
      core: chunk.slice(start, end),
      trail: chunk.slice(end)
    };
  }

  function parseRule(text) {
    var parts = String(text).trim().split(/\s+/);
    if (parts[0] && /^[-+]/.test(parts[0])) parts.shift();
    var counts = [];
    for (var i = 0; i < 4; i++) {
      var n = parseInt(parts[i], 10);
      counts.push(isNaN(n) || n < 0 ? 0 : n);
    }
    var frac = parseFloat(parts[4]);
    if (isNaN(frac)) frac = 0.4;
    return { counts: counts, frac: frac };
  }

  var RULES = parseRule(RULE);

  function clampHead(length, head) {
    if (head < 0) return 0;
    if (head > length) return length;
    return head;
  }

  function vowelHeadLength(core) {
    var n = core.length;
    if (n === 0) return 0;
    var i = 0;
    while (i < n && !isVowel(core.charAt(i))) i++;
    if (i === n) return 1;
    while (i < n && isVowel(core.charAt(i))) i++;
    return i;
  }

  /* How many leading characters of the word core to emphasize. */
  function headLength(core, mode, intensity) {
    var n = core.length;
    if (n === 0) return 0;

    switch (mode) {
      case "classic":
      case "dim":
        return clampHead(n, Math.max(1, Math.ceil(n * intensity)));
      case "half":
        return clampHead(n, Math.ceil(n / 2));
      case "vowel":
        return clampHead(n, vowelHeadLength(core));
      case "rules":
        if (n <= 4) return clampHead(n, RULES.counts[n - 1] || 0);
        return clampHead(n, Math.ceil(n * RULES.frac));
      default:
        return clampHead(n, Math.ceil(n / 2));
    }
  }

  /* ---------- rendering ---------- */

  function render(text, mode, intensity) {
    var frag = document.createDocumentFragment();
    var pieces = text.split(/(\s+)/);

    for (var i = 0; i < pieces.length; i++) {
      var piece = pieces[i];
      if (!piece) continue;
      if (/^\s+$/.test(piece)) {
        frag.appendChild(document.createTextNode(piece));
        continue;
      }

      var parts = splitChunk(piece);
      if (!parts.core) {
        frag.appendChild(document.createTextNode(piece));
        continue;
      }

      if (parts.lead) frag.appendChild(document.createTextNode(parts.lead));

      var head = headLength(parts.core, mode, intensity);
      if (head > 0) {
        var headEl = document.createElement("b");
        headEl.className = "bp-head";
        headEl.textContent = parts.core.slice(0, head);
        frag.appendChild(headEl);

        var tailText = parts.core.slice(head);
        if (tailText) {
          if (mode === "dim") {
            var tailEl = document.createElement("span");
            tailEl.className = "bp-tail";
            tailEl.textContent = tailText;
            frag.appendChild(tailEl);
          } else {
            frag.appendChild(document.createTextNode(tailText));
          }
        }
      } else {
        frag.appendChild(document.createTextNode(parts.core));
      }

      if (parts.trail) frag.appendChild(document.createTextNode(parts.trail));
    }

    return frag;
  }

  /* ---------- wiring (all guarded) ---------- */

  var demoText = document.getElementById("demo-text");
  if (!demoText) return;

  var originalText = demoText.textContent || "";
  var modeButtons = document.querySelectorAll(".mode-btn[data-mode]");
  var toggle = document.getElementById("demo-toggle");
  var range = document.getElementById("demo-intensity");
  var rangeValue = document.getElementById("demo-intensity-value");

  var state = {
    mode: DEFAULT_MODE,
    intensity: DEFAULT_INTENSITY,
    off: false
  };

  function apply() {
    if (state.off) {
      demoText.textContent = originalText;
      return;
    }
    demoText.textContent = "";
    demoText.appendChild(render(originalText, state.mode, state.intensity));
  }

  function syncControls() {
    for (var i = 0; i < modeButtons.length; i++) {
      var btn = modeButtons[i];
      var active = !state.off && btn.getAttribute("data-mode") === state.mode;
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    }

    if (toggle) {
      toggle.setAttribute("aria-pressed", state.off ? "true" : "false");
      toggle.textContent = state.off ? "Turn it on" : "Turn it off";
    }

    if (range) range.disabled = state.off;
    if (rangeValue) rangeValue.value = state.intensity.toFixed(2);
  }

  for (var i = 0; i < modeButtons.length; i++) {
    (function (btn) {
      btn.addEventListener("click", function () {
        state.mode = btn.getAttribute("data-mode") || DEFAULT_MODE;
        state.off = false;
        apply();
        syncControls();
      });
    })(modeButtons[i]);
  }

  if (range) {
    range.addEventListener("input", function () {
      var value = parseFloat(range.value);
      state.intensity = isNaN(value) ? DEFAULT_INTENSITY : value;
      if (!state.off) apply();
      syncControls();
    });
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      state.off = !state.off;
      apply();
      syncControls();
    });
  }

  apply();
  syncControls();
})();
