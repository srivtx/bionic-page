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
import { describePattern, validatePattern } from "../shared/site";
import { emphasize, type BionicOptions } from "../core/algorithm";
import { mergeImportedSettings, type ImportResult } from "./settings-transfer";

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
const rulesListEl = el<HTMLUListElement>("rulesList");
const addRuleBtnEl = el<HTMLButtonElement>("addRule");
const siteNoticeEl = el<HTMLParagraphElement>("siteNotice");
const previewEl = el<HTMLParagraphElement>("preview");
const exportBtnEl = el<HTMLButtonElement>("exportBtn");
const resetBtnEl = el<HTMLButtonElement>("resetBtn");
const importFileEl = el<HTMLInputElement>("importFile");
const importReportEl = el<HTMLDivElement>("importReport");

let current: Settings = sanitizeSettings(DEFAULT_SETTINGS);
let saveTimer: number | undefined;
/** The live editor list; may briefly contain invalid patterns that are not saved. */
let draftRules: SiteRule[] = [];
let ruleRows: RuleRow[] = [];

interface RuleRow {
  rule: SiteRule;
  element: HTMLLIElement;
  enabled: HTMLInputElement;
  pattern: HTMLInputElement;
  mode: HTMLSelectElement;
  range: HTMLInputElement;
  rangeValue: HTMLOutputElement;
  useGlobal: HTMLInputElement;
  note: HTMLParagraphElement;
  preview: HTMLParagraphElement;
  remove: HTMLButtonElement;
}

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

function globalIntensity(): number {
  const value = Number(intensityEl.value);
  return Number.isFinite(value) ? value : current.intensity;
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
  previewEl.textContent = "";
  try {
    const options = toBionicOptions(settings);
    for (const part of SAMPLE_TEXT.split(/(\s+)/)) {
      if (part.length === 0) continue;
      const split = emphasize(part, options);
      if (split) {
        const strong = document.createElement("b");
        strong.textContent = split.head;
        previewEl.append(strong);
        if (split.tail) previewEl.append(document.createTextNode(split.tail));
      } else {
        previewEl.append(document.createTextNode(part));
      }
    }
  } catch {
    previewEl.textContent = SAMPLE_TEXT;
  }
}

// ---------------------------------------------------------------------------
// Per-site rules editor
// ---------------------------------------------------------------------------

function validRules(): SiteRule[] {
  const out: SiteRule[] = [];
  for (const rule of draftRules) {
    const check = validatePattern(rule.pattern);
    if (!check.ok) continue;
    out.push(check.pattern === rule.pattern ? rule : { ...rule, pattern: check.pattern });
  }
  return out;
}

function setRuleIntensity(rule: SiteRule, value: number | undefined): void {
  if (value === undefined) delete rule.intensity;
  else rule.intensity = value;
}

function setRuleMode(rule: SiteRule, value: ModeId | undefined): void {
  if (value === undefined) delete rule.mode;
  else rule.mode = value;
}

function renderSiteNotice(): void {
  const invalid = draftRules.filter((rule) => rule.pattern.trim() !== "" && !validatePattern(rule.pattern).ok).length;
  const empty = draftRules.filter((rule) => rule.pattern.trim() === "").length;
  const parts: string[] = [];
  if (invalid > 0) parts.push(`${invalid} ${invalid === 1 ? "rule" : "rules"} will not be saved until the pattern is valid`);
  if (empty > 0) parts.push(`${empty} ${empty === 1 ? "rule still needs" : "rules still need"} a pattern`);
  siteNoticeEl.textContent = parts.length > 0 ? `${parts.join(". ")}.` : "";
}

function syncInheritedIntensity(): void {
  const value = formatPercent(globalIntensity());
  for (const row of ruleRows) {
    if (row.useGlobal.checked) row.rangeValue.textContent = value;
  }
}

function updateRuleFeedback(row: RuleRow): void {
  const check = validatePattern(row.pattern.value);
  const hasText = row.pattern.value.trim() !== "";
  row.pattern.classList.toggle("control--invalid", hasText && !check.ok);
  row.pattern.setAttribute("aria-invalid", String(hasText && !check.ok));
  row.enabled.setAttribute("aria-label", row.rule.pattern ? `Enable rule for ${row.rule.pattern}` : "Enable this rule");
  row.remove.setAttribute("aria-label", row.rule.pattern ? `Remove rule for ${row.rule.pattern}` : "Remove this rule");

  row.note.textContent = "";
  row.note.classList.remove("rule__note--error", "rule__note--ok");
  row.preview.textContent = "";
  row.preview.hidden = true;

  if (!hasText) {
    row.note.textContent = "Enter a hostname or match pattern, for example news.ycombinator.com.";
    return;
  }
  if (!check.ok) {
    row.note.classList.add("rule__note--error");
    row.note.textContent = check.error ?? "That is not a valid match pattern.";
    return;
  }
  if (check.normalized) {
    row.note.append(document.createTextNode("Bare hostnames work as match patterns. Use "));
    const suggestion = document.createElement("button");
    suggestion.type = "button";
    suggestion.className = "rule__suggest";
    suggestion.textContent = check.pattern;
    suggestion.setAttribute("aria-label", `Use the match pattern ${check.pattern}`);
    suggestion.addEventListener("click", () => {
      row.pattern.value = check.pattern;
      row.rule.pattern = check.pattern;
      updateRuleFeedback(row);
      renderSiteNotice();
      persist();
    });
    row.note.append(suggestion, document.createTextNode("."));
  } else {
    row.note.classList.add("rule__note--ok");
    row.note.textContent = "Valid match pattern.";
  }

  const impact = describePattern(check.pattern);
  const lines: string[] = [];
  if (impact.scope) lines.push(`Scope: ${impact.scope}.`);
  if (impact.matches.length > 0) lines.push(`Matches ${impact.matches.join(", ")}.`);
  if (impact.misses.length > 0) lines.push(`Does not match ${impact.misses.join(", ")}.`);
  if (lines.length > 0) {
    row.preview.hidden = false;
    row.preview.textContent = lines.join(" ");
  }
}

function buildRuleRow(rule: SiteRule): RuleRow {
  const element = document.createElement("li");
  element.className = "rule";
  element.classList.toggle("rule--off", !rule.enabled);

  const switchLabel = document.createElement("label");
  switchLabel.className = "switch switch--sm";
  const enabled = document.createElement("input");
  enabled.type = "checkbox";
  enabled.setAttribute("role", "switch");
  enabled.checked = rule.enabled;
  const track = document.createElement("span");
  track.className = "switch__track";
  track.setAttribute("aria-hidden", "true");
  const thumb = document.createElement("span");
  thumb.className = "switch__thumb";
  track.append(thumb);
  switchLabel.append(enabled, track);

  const pattern = document.createElement("input");
  pattern.type = "text";
  pattern.className = "control rule__pattern";
  pattern.spellcheck = false;
  pattern.autocomplete = "off";
  pattern.placeholder = "news.ycombinator.com";
  pattern.value = rule.pattern;
  pattern.setAttribute("aria-label", "Match pattern");

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "rule__remove";
  remove.textContent = "Remove";

  const top = document.createElement("div");
  top.className = "rule__top";
  top.append(switchLabel, pattern, remove);

  const mode = document.createElement("select");
  mode.className = "control rule__mode";
  mode.setAttribute("aria-label", "Mode for this rule");
  const inheritMode = document.createElement("option");
  inheritMode.value = "";
  inheritMode.textContent = "Use global mode";
  mode.append(inheritMode);
  for (const entry of MODES) {
    const option = document.createElement("option");
    option.value = entry.id;
    option.textContent = entry.label;
    mode.append(option);
  }
  mode.value = rule.mode ?? "";

  const modeField = document.createElement("label");
  modeField.className = "rule__field";
  const modeLabel = document.createElement("span");
  modeLabel.className = "rule__label";
  modeLabel.textContent = "Mode";
  modeField.append(modeLabel, mode);

  const range = document.createElement("input");
  range.type = "range";
  range.className = "control control--range rule__intensity";
  range.min = "0.2";
  range.max = "0.9";
  range.step = "0.05";
  range.setAttribute("aria-label", "Intensity for this rule");

  const useGlobal = document.createElement("input");
  useGlobal.type = "checkbox";
  useGlobal.className = "rule__use-global";
  useGlobal.checked = rule.intensity === undefined;
  if (rule.intensity !== undefined) range.value = String(rule.intensity);
  range.disabled = useGlobal.checked;

  const rangeValue = document.createElement("output");
  rangeValue.className = "rule__intensity-value";
  rangeValue.textContent = useGlobal.checked ? formatPercent(globalIntensity()) : formatPercent(Number(range.value));

  const useGlobalLabel = document.createElement("label");
  useGlobalLabel.className = "rule__inherit";
  useGlobalLabel.append(useGlobal, document.createTextNode("Use global"));

  const intensityField = document.createElement("div");
  intensityField.className = "rule__field";
  const intensityLabel = document.createElement("span");
  intensityLabel.className = "rule__label";
  intensityLabel.textContent = "Intensity";
  const intensityRow = document.createElement("div");
  intensityRow.className = "rule__intensity-row";
  intensityRow.append(range, rangeValue, useGlobalLabel);
  intensityField.append(intensityLabel, intensityRow);

  const controls = document.createElement("div");
  controls.className = "rule__controls";
  controls.append(modeField, intensityField);

  const note = document.createElement("p");
  note.className = "rule__note";
  const preview = document.createElement("p");
  preview.className = "rule__preview";
  preview.hidden = true;

  element.append(top, controls, note, preview);

  const row: RuleRow = { rule, element, enabled, pattern, mode, range, rangeValue, useGlobal, note, preview, remove };

  enabled.addEventListener("change", () => {
    rule.enabled = enabled.checked;
    element.classList.toggle("rule--off", !rule.enabled);
  });
  pattern.addEventListener("input", () => {
    rule.pattern = pattern.value;
    updateRuleFeedback(row);
    renderSiteNotice();
  });
  mode.addEventListener("change", () => {
    setRuleMode(rule, mode.value ? (mode.value as ModeId) : undefined);
  });
  range.addEventListener("input", () => {
    setRuleIntensity(rule, Number(range.value));
    rangeValue.textContent = formatPercent(Number(range.value));
  });
  useGlobal.addEventListener("change", () => {
    range.disabled = useGlobal.checked;
    if (useGlobal.checked) {
      setRuleIntensity(rule, undefined);
      rangeValue.textContent = formatPercent(globalIntensity());
    } else {
      range.value = String(globalIntensity());
      setRuleIntensity(rule, Number(range.value));
      rangeValue.textContent = formatPercent(Number(range.value));
    }
  });
  remove.addEventListener("click", () => {
    draftRules = draftRules.filter((candidate) => candidate !== rule);
    renderRules();
    persist();
  });

  return row;
}

function renderRules(): void {
  rulesListEl.textContent = "";
  ruleRows = [];
  if (draftRules.length === 0) {
    const empty = document.createElement("li");
    empty.className = "rules__empty";
    empty.textContent = "No per-site rules yet. Bionic Page follows the global settings everywhere.";
    rulesListEl.append(empty);
    renderSiteNotice();
    return;
  }
  for (const rule of draftRules) {
    const row = buildRuleRow(rule);
    ruleRows.push(row);
    rulesListEl.append(row.element);
    updateRuleFeedback(row);
  }
  renderSiteNotice();
  syncInheritedIntensity();
}

function addRule(): void {
  draftRules.push({ pattern: "", enabled: true });
  renderRules();
  const last = ruleRows[ruleRows.length - 1];
  last?.pattern.focus();
  setStatus("Enter a hostname or match pattern for the new rule.");
}

// ---------------------------------------------------------------------------
// Form read/write
// ---------------------------------------------------------------------------

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
    sites: validRules(),
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
  draftRules = settings.sites.map((rule) => ({ ...rule }));
  renderRules();
  renderPreview(settings);
}

function persist(): void {
  if (saveTimer !== undefined) {
    window.clearTimeout(saveTimer);
    saveTimer = undefined;
  }
  current = readForm();
  updateOutputs();
  syncInheritedIntensity();
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
  syncInheritedIntensity();
  renderPreview(readForm());
  scheduleSave();
});

formEl.addEventListener("change", () => {
  updateModeDescription();
  updateOutputs();
  syncInheritedIntensity();
  persist();
});

formEl.addEventListener("submit", (event) => {
  // Enter in any text field commits the form; adding a rule is explicit.
  event.preventDefault();
  persist();
});

addRuleBtnEl.addEventListener("click", () => {
  addRule();
});

// ---------------------------------------------------------------------------
// Import / export
// ---------------------------------------------------------------------------

function renderImportReport(result: ImportResult): void {
  importReportEl.textContent = "";
  importReportEl.hidden = false;
  importReportEl.classList.toggle("report--error", !result.valid);

  const headline = document.createElement("p");
  headline.className = "report__headline";
  headline.textContent = result.valid ? result.headline : "Import failed. Your settings are unchanged.";
  importReportEl.append(headline);

  const items = [...result.changes, ...result.warnings];
  if (items.length === 0) return;
  const list = document.createElement("ul");
  list.className = "report__list";
  for (const item of items) {
    const entry = document.createElement("li");
    entry.textContent = item;
    list.append(entry);
  }
  importReportEl.append(list);
}

exportBtnEl.addEventListener("click", () => {
  current = readForm();
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
  importReportEl.hidden = true;
  importReportEl.textContent = "";
  persist();
  setStatus("Reset to defaults.");
});

importFileEl.addEventListener("change", () => {
  const file = importFileEl.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    let result: ImportResult | undefined;
    try {
      const parsed: unknown = JSON.parse(String(reader.result ?? ""));
      result = mergeImportedSettings(current, parsed);
    } catch {
      result = undefined;
    }
    importFileEl.value = "";
    if (!result) {
      renderImportReport({
        settings: current,
        valid: false,
        headline: "Nothing imported.",
        changes: ["That file is not valid JSON."],
        warnings: [],
        counts: { rulesAdded: 0, rulesRemoved: 0, rulesChanged: 0, rulesSkipped: 0, fieldsChanged: 0 },
      });
      setStatus("Could not read that file as JSON. Your settings are unchanged.");
      return;
    }
    if (!result.valid) {
      renderImportReport(result);
      setStatus("Import failed. Your settings are unchanged.");
      return;
    }
    current = result.settings;
    applySettingsToForm(current);
    renderImportReport(result);
    persist();
    setStatus(result.changes.length > 0 ? "Settings imported." : "Imported settings match the current settings.");
  });
  reader.addEventListener("error", () => {
    setStatus("Could not read that file. Your settings are unchanged.");
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
