import { broadcast } from "../shared/messaging";
import { loadSettings, saveSettings } from "../shared/storage";
import {
  DEFAULT_SETTINGS,
  MODES,
  sanitizeSettings,
  type ModeId,
  type Settings,
  type SiteRule,
} from "../shared/types";
import { bionicText, type BionicOptions } from "../core/algorithm";

const SAMPLE_TEXT =
  "Bionic reading emphasizes the leading letters of each word. Your eyes still read every letter; the emphasis simply gives them a place to land.";

function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`options: missing element #${id}`);
  return node as T;
}

const formEl = el<HTMLFormElement>("settingsForm");
const statusEl = el<HTMLParagraphElement>("formStatus");
const enabledEl = el<HTMLInputElement>("enabled");
const modeEl = el<HTMLSelectElement>("mode");
const modeDescriptionEl = el<HTMLParagraphElement>("modeDescription");
const intensityEl = el<HTMLInputElement>("intensity");
const intensityValueEl = el<HTMLOutputElement>("intensityValue");
const minWordLengthEl = el<HTMLInputElement>("minWordLength");
const skipCommonWordsEl = el<HTMLInputElement>("skipCommonWords");
const respectExistingBoldEl = el<HTMLInputElement>("respectExistingBold");
const boldWeightEl = el<HTMLInputElement>("boldWeight");
const boldWeightValueEl = el<HTMLOutputElement>("boldWeightValue");
const restOpacityEl = el<HTMLInputElement>("restOpacity");
const restOpacityValueEl = el<HTMLOutputElement>("restOpacityValue");
const letterSpacingEl = el<HTMLInputElement>("letterSpacing");
const ruleEl = el<HTMLInputElement>("rule");
const customVowelsEl = el<HTMLInputElement>("customVowels");
const processDynamicEl = el<HTMLInputElement>("processDynamic");
const processIframesEl = el<HTMLInputElement>("processIframes");
const showFloatingControlEl = el<HTMLInputElement>("showFloatingControl");
const sitePatternEl = el<HTMLInputElement>("sitePattern");
const siteListEl = el<HTMLUListElement>("siteList");
const previewEl = el<HTMLParagraphElement>("preview");
const exportBtnEl = el<HTMLButtonElement>("exportBtn");
const resetBtnEl = el<HTMLButtonElement>("resetBtn");
const importFileEl = el<HTMLInputElement>("importFile");

let current: Settings = sanitizeSettings(DEFAULT_SETTINGS);
let saveTimer: number | undefined;

function setStatus(message: string): void {
  statusEl.textContent = message;
  if (message) {
    window.setTimeout(() => {
      if (statusEl.textContent === message) statusEl.textContent = "";
    }, 2500);
  }
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function updateModeDescription(): void {
  const active = MODES.find((m) => m.id === (modeEl.value as ModeId));
  modeDescriptionEl.textContent = active?.description ?? "";
}

function updateOutputs(): void {
  intensityValueEl.textContent = formatPercent(Number(intensityEl.value));
  boldWeightValueEl.textContent = String(Math.round(Number(boldWeightEl.value)));
  restOpacityValueEl.textContent = formatPercent(Number(restOpacityEl.value));
}

function toBionicOptions(settings: Settings): BionicOptions {
  return {
    mode: settings.mode,
    intensity: settings.intensity,
    minWordLength: settings.minWordLength,
    skipCommonWords: settings.skipCommonWords,
    rule: settings.rule,
    customVowels: settings.customVowels,
  };
}

function renderPreview(settings: Settings): void {
  previewEl.style.setProperty("--bp-bold-weight", String(settings.boldWeight));
  try {
    const html =
      typeof bionicText === "function" ? bionicText(SAMPLE_TEXT, toBionicOptions(settings)) : SAMPLE_TEXT;
    previewEl.innerHTML = html;
  } catch {
    previewEl.textContent = SAMPLE_TEXT;
  }
}

function renderSiteList(sites: SiteRule[]): void {
  siteListEl.textContent = "";
  if (sites.length === 0) {
    const empty = document.createElement("li");
    empty.className = "site-list__empty";
    empty.textContent = "No per-site rules yet. Bionic Page follows the global settings everywhere.";
    siteListEl.append(empty);
    return;
  }

  sites.forEach((site, index) => {
    const item = document.createElement("li");
    item.className = "site-item";

    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.className = "checkbox";
    toggle.checked = site.enabled;
    toggle.setAttribute("aria-label", `Enable on ${site.pattern}`);
    toggle.addEventListener("change", () => {
      const next = current.sites.slice();
      const target = next[index];
      if (!target) return;
      next[index] = { ...target, enabled: toggle.checked };
      current = sanitizeSettings({ ...current, sites: next });
      renderSiteList(current.sites);
      scheduleSave();
    });

    const pattern = document.createElement("span");
    pattern.className = "site-item__pattern";
    pattern.textContent = site.pattern;
    pattern.title = site.pattern;

    const state = document.createElement("span");
    state.className = "site-item__state";
    state.textContent = site.enabled ? "On" : "Off";

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "site-item__remove";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove ${site.pattern}`);
    remove.addEventListener("click", () => {
      const next = current.sites.filter((_, i) => i !== index);
      current = sanitizeSettings({ ...current, sites: next });
      renderSiteList(current.sites);
      scheduleSave();
    });

    item.append(toggle, pattern, state, remove);
    siteListEl.append(item);
  });
}

function readForm(): Settings {
  return sanitizeSettings({
    ...current,
    enabled: enabledEl.checked,
    mode: modeEl.value as ModeId,
    intensity: Number(intensityEl.value),
    minWordLength: Number(minWordLengthEl.value),
    skipCommonWords: skipCommonWordsEl.checked,
    respectExistingBold: respectExistingBoldEl.checked,
    boldWeight: Number(boldWeightEl.value),
    restOpacity: Number(restOpacityEl.value),
    letterSpacing: letterSpacingEl.checked,
    rule: ruleEl.value,
    customVowels: customVowelsEl.value,
    processDynamic: processDynamicEl.checked,
    processIframes: processIframesEl.checked,
    showFloatingControl: showFloatingControlEl.checked,
    sites: current.sites,
  });
}

function applySettingsToForm(settings: Settings): void {
  enabledEl.checked = settings.enabled;
  modeEl.value = settings.mode;
  intensityEl.value = String(settings.intensity);
  minWordLengthEl.value = String(settings.minWordLength);
  skipCommonWordsEl.checked = settings.skipCommonWords;
  respectExistingBoldEl.checked = settings.respectExistingBold;
  boldWeightEl.value = String(settings.boldWeight);
  restOpacityEl.value = String(settings.restOpacity);
  letterSpacingEl.checked = settings.letterSpacing;
  ruleEl.value = settings.rule;
  customVowelsEl.value = settings.customVowels;
  processDynamicEl.checked = settings.processDynamic;
  processIframesEl.checked = settings.processIframes;
  showFloatingControlEl.checked = settings.showFloatingControl;
  updateModeDescription();
  updateOutputs();
  renderSiteList(settings.sites);
  renderPreview(settings);
}

function persist(): void {
  if (saveTimer !== undefined) {
    window.clearTimeout(saveTimer);
    saveTimer = undefined;
  }
  current = readForm();
  updateOutputs();
  renderPreview(current);
  void saveSettings(current);
  void broadcast({ type: "settings-changed", settings: current });
}

function scheduleSave(): void {
  if (saveTimer !== undefined) clearTimeout(saveTimer);
  saveTimer = window.setTimeout(persist, 200);
}

formEl.addEventListener("input", () => {
  updateOutputs();
  renderPreview(readForm());
  scheduleSave();
});

formEl.addEventListener("change", () => {
  updateModeDescription();
  updateOutputs();
  persist();
});

formEl.addEventListener("submit", (event) => {
  event.preventDefault();
  const pattern = sitePatternEl.value.trim();
  if (!pattern) {
    setStatus("Enter a match pattern such as https://example.com/*.");
    return;
  }
  if (current.sites.some((site) => site.pattern === pattern)) {
    setStatus("That site pattern is already in the list.");
    return;
  }
  current = sanitizeSettings({
    ...current,
    sites: [...current.sites, { pattern, enabled: true }],
  });
  sitePatternEl.value = "";
  renderSiteList(current.sites);
  persist();
});

exportBtnEl.addEventListener("click", () => {
  const data = JSON.stringify(current, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "bionic-page-settings.json";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
});

resetBtnEl.addEventListener("click", () => {
  current = sanitizeSettings(DEFAULT_SETTINGS);
  applySettingsToForm(current);
  persist();
  setStatus("Reset to defaults.");
});

importFileEl.addEventListener("change", () => {
  const file = importFileEl.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(String(reader.result ?? "")) as Partial<Settings>;
      current = sanitizeSettings(parsed);
      applySettingsToForm(current);
      persist();
      setStatus("Settings imported.");
    } catch {
      setStatus("Could not read that file. Choose a JSON export from Bionic Page.");
    } finally {
      importFileEl.value = "";
    }
  });
  reader.addEventListener("error", () => {
    setStatus("Could not read that file.");
    importFileEl.value = "";
  });
  reader.readAsText(file);
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
}

void init();
