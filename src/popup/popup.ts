import { api, call } from "../shared/browser";
import { broadcast, sendToActiveTab } from "../shared/messaging";
import { resolveSiteRule } from "../shared/site";
import { loadSettings, saveSettings } from "../shared/storage";
import {
  DEFAULT_SETTINGS,
  MODES,
  sanitizeSettings,
  type ModeId,
  type PageState,
  type Settings,
} from "../shared/types";

function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`popup: missing element #${id}`);
  return node as T;
}

const enabledEl = el<HTMLInputElement>("enabled");
const modeEl = el<HTMLSelectElement>("mode");
const modeDescriptionEl = el<HTMLParagraphElement>("modeDescription");
const intensityEl = el<HTMLInputElement>("intensity");
const intensityValueEl = el<HTMLOutputElement>("intensityValue");
const siteEnabledEl = el<HTMLInputElement>("siteEnabled");
const minWordLengthEl = el<HTMLInputElement>("minWordLength");
const statusEl = el<HTMLParagraphElement>("status");
const openOptionsEl = el<HTMLButtonElement>("openOptions");

let current: Settings = sanitizeSettings(DEFAULT_SETTINGS);
let pageUrl: string | undefined;

function formatIntensity(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function activeTabUrl(): Promise<string | undefined> {
  if (!api?.tabs?.query) return Promise.resolve(undefined);
  return call<chrome.tabs.Tab[]>(api.tabs.query, api.tabs, {
    active: true,
    currentWindow: true,
  })
    .then((tabs) => tabs?.[0]?.url)
    .catch(() => undefined);
}

/** Build the match pattern for the active page, e.g. "https://example.com/*". */
function sitePattern(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;
    return `${parsed.protocol}//${parsed.host}/*`;
  } catch {
    return undefined;
  }
}

function applySettingsToForm(settings: Settings): void {
  enabledEl.checked = settings.enabled;
  modeEl.value = settings.mode;
  intensityEl.value = String(settings.intensity);
  intensityValueEl.textContent = formatIntensity(settings.intensity);
  minWordLengthEl.value = String(settings.minWordLength);
  updateModeDescription();
}

function updateModeDescription(): void {
  const active = MODES.find((m) => m.id === (modeEl.value as ModeId));
  modeDescriptionEl.textContent = active?.description ?? "";
}

function updateIntensityOutput(): void {
  intensityValueEl.textContent = formatIntensity(Number(intensityEl.value));
}

function renderStatus(state: PageState | undefined): void {
  if (!state || state.degraded) {
    statusEl.textContent = "Not available on this page.";
    statusEl.dataset.state = "unavailable";
    return;
  }
  if (state.active) {
    const count = state.transformedNodes.toLocaleString();
    statusEl.textContent = `Applied to this page. ${count} text nodes transformed.`;
    statusEl.dataset.state = "active";
    return;
  }
  statusEl.textContent = state.enabledByRules
    ? "On, but nothing to transform on this page."
    : "Off for this site.";
  statusEl.dataset.state = "idle";
}

function currentPageState(raw: unknown): PageState | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as Record<string, unknown>;
  if (value.type === "state" && value.state && typeof value.state === "object") {
    return value.state as PageState;
  }
  if (typeof value.active === "boolean") return raw as unknown as PageState;
  return undefined;
}

function readForm(): Settings {
  return sanitizeSettings({
    ...current,
    enabled: enabledEl.checked,
    mode: modeEl.value as ModeId,
    intensity: Number(intensityEl.value),
    minWordLength: Number(minWordLengthEl.value),
    sites: current.sites,
  });
}

async function persist(): Promise<void> {
  current = readForm();
  await saveSettings(current);
  // Broadcast so every open tab updates its transform and its badge.
  await broadcast({ type: "settings-changed", settings: current });
}

enabledEl.addEventListener("change", () => {
  void persist();
});

modeEl.addEventListener("change", () => {
  updateModeDescription();
  void persist();
});

intensityEl.addEventListener("input", () => {
  updateIntensityOutput();
});

intensityEl.addEventListener("change", () => {
  updateIntensityOutput();
  void persist();
});

minWordLengthEl.addEventListener("change", () => {
  void persist();
});

siteEnabledEl.addEventListener("change", () => {
  const pattern = sitePattern(pageUrl);
  if (!pattern) return;
  const enabled = siteEnabledEl.checked;
  const sites = current.sites.slice();
  const index = sites.findIndex((site) => site.pattern === pattern);
  const existing = index >= 0 ? sites[index] : undefined;
  if (existing) {
    sites[index] = { ...existing, enabled };
  } else {
    sites.push({ pattern, enabled });
  }
  current = sanitizeSettings({ ...current, sites });
  void saveSettings(current);
  void broadcast({ type: "settings-changed", settings: current });
});

openOptionsEl.addEventListener("click", () => {
  const runtime = api?.runtime;
  if (runtime?.openOptionsPage) {
    try {
      runtime.openOptionsPage();
      return;
    } catch {
      /* fall through to window.open */
    }
  }
  window.open("options.html", "_blank");
});

async function init(): Promise<void> {
  for (const mode of MODES) {
    const option = document.createElement("option");
    option.value = mode.id;
    option.textContent = mode.label;
    option.title = mode.description;
    modeEl.append(option);
  }

  current = await loadSettings();
  applySettingsToForm(current);

  pageUrl = await activeTabUrl();
  const pattern = sitePattern(pageUrl);
  const siteRule = resolveSiteRule(pageUrl ?? "", current.sites);
  siteEnabledEl.checked = siteRule ? siteRule.enabled : current.enabled;
  siteEnabledEl.disabled = !pattern;

  const rawState = await sendToActiveTab({ type: "get-state" });
  renderStatus(currentPageState(rawState));
}

void init();
