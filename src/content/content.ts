import { api, degraded } from "../shared/browser";
import { onMessage } from "../shared/messaging";
import { effectiveSettings, isEnabledForUrl } from "../shared/site";
import { loadSettings, onSettingsChanged } from "../shared/storage";
import { DEFAULT_SETTINGS, sanitizeSettings, type Message, type PageState, type Settings } from "../shared/types";
import type { BionicOptions } from "../core/algorithm";
import { transformRoot, type TransformHandle } from "./domWalker";
import { observeDynamic } from "./observer";
import { decorateTails, ensureStyles, removeStyles, undecorateTails } from "./styles";

let settings: Settings = sanitizeSettings(DEFAULT_SETTINGS);
let handles: TransformHandle[] = [];
/** Above this many incremental handles, a tab is compacted with a full re-apply. */
const MAX_HANDLES = 64;
let disconnect: (() => void) | null = null;
/** Per-page override for this session; null follows the global + site rules. */
let sessionOverride: boolean | null = null;
let controlHost: HTMLElement | null = null;
let controlButton: HTMLButtonElement | null = null;
let controlLabel: HTMLSpanElement | null = null;

const CONTROL_HOST_ID = "bionic-page-control";

function currentUrl(): string {
  try {
    return location.href;
  } catch {
    return "";
  }
}

function resolve(): Settings {
  return effectiveSettings(settings, currentUrl());
}

function enabledByRules(): boolean {
  return isEnabledForUrl(settings, currentUrl());
}

function isActive(): boolean {
  if (sessionOverride === false) return false;
  if (sessionOverride === true) return settings.enabled;
  return enabledByRules();
}

function inFrame(): boolean {
  try {
    return window.top !== window.self;
  } catch {
    return false;
  }
}

function toOptions(s: Settings): BionicOptions {
  return {
    mode: s.mode,
    intensity: s.intensity,
    minWordLength: s.minWordLength,
    skipCommonWords: s.skipCommonWords,
    rule: s.rule,
    customVowels: s.customVowels,
  };
}

function applyFull(): void {
  if (!document.body) return;
  try {
    const effective = resolve();
    // Revert first so a mode or setting change actually takes effect.
    revertAll();
    ensureStyles(document, effective);
    handles = [transformRoot(document.body, toOptions(effective))];
    if (effective.mode === "dim") decorateTails(document);
    connectObserver();
  } catch {
    /* never throw into the page */
  }
  updateControl();
}

/** Process only content added since the last pass (SPAs, infinite scroll). */
function applyIncremental(): void {
  if (!document.body) return;
  try {
    const effective = resolve();
    const next = transformRoot(document.body, toOptions(effective));
    if (next.stats.textNodes > 0) handles.push(next);
    if (effective.mode === "dim") decorateTails(document);
    connectObserver();
    // Compact after many bursts so a long-lived tab cannot accumulate handles.
    if (handles.length > MAX_HANDLES) {
      applyFull();
      return;
    }
  } catch {
    /* ignore */
  }
  updateControl();
}

function connectObserver(): void {
  if (disconnect || !settings.processDynamic || !document.body) return;
  try {
    disconnect = observeDynamic(document.body, () => {
      if (isActive()) applyIncremental();
    });
  } catch {
    /* ignore */
  }
}

function revertAll(): void {
  try {
    undecorateTails(document);
    for (let i = handles.length - 1; i >= 0; i -= 1) handles[i]?.revert();
    handles = [];
    disconnect?.();
    disconnect = null;
  } catch {
    /* ignore */
  }
}

function remove(): void {
  revertAll();
  try {
    removeStyles(document);
  } catch {
    /* ignore */
  }
  updateControl();
}

function refresh(): void {
  if (isActive()) applyFull();
  else remove();
  updateControl();
}

function getState(): PageState {
  return {
    active: handles.length > 0 && isActive(),
    enabledByRules: enabledByRules(),
    transformedNodes: handles.reduce((total, h) => total + h.stats.textNodes, 0),
    settings: resolve(),
    degraded,
  };
}

function toggle(): void {
  sessionOverride = !isActive();
  refresh();
}

function handleMessage(message: Message): unknown {
  switch (message?.type) {
    case "get-state":
      return getState();
    case "apply":
      sessionOverride = true;
      refresh();
      return getState();
    case "remove":
      sessionOverride = false;
      refresh();
      return getState();
    case "toggle":
      toggle();
      return getState();
    case "settings-changed":
      settings = sanitizeSettings(message.settings);
      refresh();
      return getState();
    case "refresh":
      refresh();
      return getState();
    default:
      return undefined;
  }
}

function ensureControl(): void {
  if (degraded || inFrame()) return;
  try {
    if (controlHost) return;
    const host = document.createElement("div");
    host.id = CONTROL_HOST_ID;
    host.style.cssText =
      "all:initial;position:fixed;right:14px;bottom:14px;z-index:2147483647;";
    const root = host.attachShadow ? host.attachShadow({ mode: "open" }) : null;
    if (!root) return;
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", "Toggle bionic reading");
    button.setAttribute("part", "button");
    button.style.cssText = [
      "all:unset",
      "display:flex",
      "align-items:center",
      "gap:6px",
      "box-sizing:border-box",
      "height:34px",
      "padding:0 10px",
      "border:1px solid #e6e6e0",
      "border-radius:999px",
      "background:#14161a",
      "color:#fff",
      "font:600 12px/1 ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif",
      "cursor:pointer",
      "box-shadow:0 1px 2px rgb(20 22 26 / 18%)",
      "user-select:none",
    ].join(";");
    button.style.setProperty("opacity", "0.92");
    const label = document.createElement("span");
    label.textContent = "Bp";
    button.appendChild(label);
    const dot = document.createElement("span");
    dot.style.cssText = "width:7px;height:7px;border-radius:999px;background:#8b8cf7;display:inline-block";
    button.appendChild(dot);
    button.addEventListener("click", () => toggle());
    root.appendChild(button);
    (document.body ?? document.documentElement).appendChild(host);
    controlHost = host;
    controlButton = button;
    controlLabel = label;
    updateControl();
  } catch {
    /* ignore */
  }
}

/** Reflect the current state on the toolbar badge (best effort). */
function notifyBadge(): void {
  try {
    const result = api?.runtime?.sendMessage?.({ type: "badge", active: isActive() });
    if (result && typeof result.catch === "function") result.catch(() => {});
  } catch {
    /* ignore */
  }
}

function updateControl(): void {
  if (!controlHost) {
    notifyBadge();
    return;
  }
  try {
    const show = settings.showFloatingControl && !inFrame();
    controlHost.style.display = show ? "" : "none";
    if (controlButton && controlLabel) {
      const on = isActive();
      controlButton.setAttribute("aria-pressed", String(on));
      controlButton.style.setProperty("opacity", on ? "0.95" : "0.55");
      controlLabel.textContent = on ? "Bp on" : "Bp off";
      controlButton.title = on ? "Bionic reading is on (click to turn off)" : "Bionic reading is off (click to turn on)";
    }
    notifyBadge();
  } catch {
    /* ignore */
  }
}

async function init(): Promise<void> {
  try {
    settings = await loadSettings();
    if (inFrame() && !settings.processIframes) return;
    ensureControl();
    if (isActive()) applyFull();
    else updateControl();
  } catch {
    /* ignore */
  }
}

onMessage(handleMessage);
onSettingsChanged((next) => {
  settings = next;
  refresh();
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => void init(), { once: true });
} else {
  void init();
}

// Expose a tiny handle for debugging in the page console (development only).
try {
  (globalThis as Record<string, unknown>).__bionicPage = () => getState();
} catch {
  /* ignore */
}
