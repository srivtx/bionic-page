/**
 * Pure import/merge logic for the options page.
 *
 * Importing is the risky half of settings I/O: a file can be truncated, hand
 * edited, or from another version. Everything here takes untrusted input and
 * returns a fully sanitized `Settings`, a list of messages, and counts for a
 * summary. Nothing touches the DOM or storage, so it is all unit-testable.
 */
import { MODES, sanitizeSettings, type ModeId, type Settings, type SiteRule } from "../shared/types";
import { validatePattern } from "../shared/site";

export interface ImportCounts {
  rulesAdded: number;
  rulesRemoved: number;
  rulesChanged: number;
  rulesSkipped: number;
  fieldsChanged: number;
}

export interface ImportResult {
  /** Always a complete, sanitized settings object; never partial. */
  settings: Settings;
  /** False when the file was not a settings object at all. */
  valid: boolean;
  /** One line, e.g. "Imported settings: 3 rules added, 1 setting changed." */
  headline: string;
  /** What changed, in plain language. */
  changes: string[];
  /** Things that could not be used as written. */
  warnings: string[];
  counts: ImportCounts;
}

const INTENSITY = [0.2, 0.9] as const;
const MIN_WORD_LENGTH = [2, 8] as const;
const BOLD_WEIGHT = [500, 900] as const;
const REST_OPACITY = [0.4, 1] as const;

const BOOLEAN_FIELDS: ReadonlyArray<readonly [keyof Settings, string]> = [
  ["skipCommonWords", "Skip common words"],
  ["respectExistingBold", "Leave existing bold text alone"],
  ["letterSpacing", "Letter spacing after the emphasis"],
  ["processDynamic", "Process new content as it loads"],
  ["processIframes", "Run inside iframes"],
  ["showFloatingControl", "Floating control"],
];

function zeroCounts(): ImportCounts {
  return { rulesAdded: 0, rulesRemoved: 0, rulesChanged: 0, rulesSkipped: 0, fieldsChanged: 0 };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function modeLabel(mode: ModeId): string {
  return MODES.find((entry) => entry.id === mode)?.label ?? mode;
}

/** Short number formatting: 0.9, 1.2, 700. */
function num(value: number): string {
  return String(Number(value.toFixed(2)));
}

function quote(value: string): string {
  return `"${value}"`;
}

function plural(count: number, singular: string, pluralWord = `${singular}s`): string {
  return count === 1 ? singular : pluralWord;
}

function listOf(values: string[], limit = 4): string {
  if (values.length <= limit) return values.join(", ");
  return `${values.slice(0, limit).join(", ")} and ${values.length - limit} more`;
}

function sameRule(a: SiteRule, b: SiteRule): boolean {
  return (
    a.enabled === b.enabled &&
    (a.mode ?? "") === (b.mode ?? "") &&
    (a.intensity ?? -1) === (b.intensity ?? -1) &&
    (a.label ?? "") === (b.label ?? "")
  );
}

function compareNumber(
  label: string,
  before: number,
  after: number,
  rawValue: unknown,
  min: number,
  max: number,
  push: (message: string, isFieldChange: boolean) => void,
): void {
  const hasRaw = rawValue !== undefined && rawValue !== null;
  const rawNumber = Number(rawValue);
  const clamped = hasRaw && Number.isFinite(rawNumber) && (rawNumber < min || rawNumber > max);
  if (before === after && !clamped) return;
  if (clamped) push(`${label} ${num(rawNumber)} clamped to ${num(after)}.`, true);
  else push(`${label} set to ${num(after)}.`, true);
}

function diffRules(before: Settings, after: Settings, raw: Partial<Settings> | undefined, changes: string[], warnings: string[], counts: ImportCounts): void {
  const beforeByPattern = new Map(before.sites.map((rule) => [rule.pattern, rule]));
  const afterByPattern = new Map(after.sites.map((rule) => [rule.pattern, rule]));

  const added = after.sites.filter((rule) => !beforeByPattern.has(rule.pattern));
  const removed = before.sites.filter((rule) => !afterByPattern.has(rule.pattern));
  const changed = after.sites.filter((rule) => {
    const previous = beforeByPattern.get(rule.pattern);
    return previous !== undefined && !sameRule(previous, rule);
  });

  if (added.length > 0) {
    counts.rulesAdded += added.length;
    changes.push(`Added ${added.length} site ${plural(added.length, "rule")}: ${listOf(added.map((rule) => quote(rule.pattern)))}.`);
  }
  if (removed.length > 0) {
    counts.rulesRemoved += removed.length;
    changes.push(`Removed ${removed.length} site ${plural(removed.length, "rule")}: ${listOf(removed.map((rule) => quote(rule.pattern)))}.`);
  }
  if (changed.length > 0) {
    counts.rulesChanged += changed.length;
    changes.push(`Updated ${changed.length} site ${plural(changed.length, "rule")}: ${listOf(changed.map((rule) => quote(rule.pattern)))}.`);
  }

  const rawSites = Array.isArray(raw?.sites) ? (raw!.sites as unknown[]) : [];
  const usableRaw = rawSites.filter((entry): entry is Record<string, unknown> => isRecord(entry) && typeof entry.pattern === "string");
  if (rawSites.length > 0 && usableRaw.length < rawSites.length) {
    const skipped = rawSites.length - usableRaw.length;
    counts.rulesSkipped += skipped;
    warnings.push(`${skipped} site ${plural(skipped, "rule")} in the file had no pattern and ${skipped === 1 ? "was" : "were"} skipped.`);
  }

  for (const rule of after.sites) {
    const check = validatePattern(rule.pattern);
    if (!check.ok) {
      warnings.push(`The site rule ${quote(rule.pattern)} is not a valid match pattern and will never match.`);
      continue;
    }
    if (check.pattern !== rule.pattern) {
      warnings.push(`The site rule ${quote(rule.pattern)} will never match as written; use ${quote(check.pattern)}.`);
    }
    const rawRule = usableRaw.find((entry) => entry.pattern === rule.pattern);
    if (rawRule && typeof rawRule.intensity === "number" && rule.intensity !== undefined) {
      const rawIntensity = rawRule.intensity;
      if (Number.isFinite(rawIntensity) && (rawIntensity < INTENSITY[0] || rawIntensity > INTENSITY[1])) {
        changes.push(`Site rule ${quote(rule.pattern)} intensity ${num(rawIntensity)} clamped to ${num(rule.intensity)}.`);
      }
    }
  }
}

export function diffSettings(
  before: Settings,
  after: Settings,
  raw?: Partial<Settings>,
): { changes: string[]; warnings: string[]; counts: ImportCounts } {
  const changes: string[] = [];
  const warnings: string[] = [];
  const counts = zeroCounts();

  const pushField = (message: string): void => {
    counts.fieldsChanged += 1;
    changes.push(message);
  };

  diffRules(before, after, raw, changes, warnings, counts);

  if (before.enabled !== after.enabled) {
    pushField(after.enabled ? "Bionic Page turned on." : "Bionic Page turned off.");
  }
  if (before.mode !== after.mode) {
    pushField(`Mode set to ${modeLabel(after.mode)}.`);
  }
  compareNumber("Intensity", before.intensity, after.intensity, raw?.intensity, INTENSITY[0], INTENSITY[1], pushField);
  compareNumber("Minimum word length", before.minWordLength, after.minWordLength, raw?.minWordLength, MIN_WORD_LENGTH[0], MIN_WORD_LENGTH[1], pushField);
  compareNumber("Emphasis weight", before.boldWeight, after.boldWeight, raw?.boldWeight, BOLD_WEIGHT[0], BOLD_WEIGHT[1], pushField);
  compareNumber("Faded remainder opacity", before.restOpacity, after.restOpacity, raw?.restOpacity, REST_OPACITY[0], REST_OPACITY[1], pushField);

  for (const [key, label] of BOOLEAN_FIELDS) {
    if (before[key] !== after[key]) {
      pushField(`${label} ${after[key] ? "on" : "off"}.`);
    }
  }

  if (before.rule !== after.rule) pushField(`Custom rule set to ${quote(after.rule)}.`);
  if (before.customVowels !== after.customVowels) {
    pushField(after.customVowels ? `Custom vowels set to ${quote(after.customVowels)}.` : "Custom vowels cleared.");
  }

  return { changes, warnings, counts };
}

function buildHeadline(counts: ImportCounts): string {
  const parts: string[] = [];
  if (counts.rulesAdded > 0) parts.push(`${counts.rulesAdded} ${plural(counts.rulesAdded, "rule")} added`);
  if (counts.rulesRemoved > 0) parts.push(`${counts.rulesRemoved} ${plural(counts.rulesRemoved, "rule")} removed`);
  if (counts.rulesChanged > 0) parts.push(`${counts.rulesChanged} ${plural(counts.rulesChanged, "rule")} updated`);
  if (counts.fieldsChanged > 0) parts.push(`${counts.fieldsChanged} ${plural(counts.fieldsChanged, "setting")} changed`);
  if (counts.rulesSkipped > 0) parts.push(`${counts.rulesSkipped} ${plural(counts.rulesSkipped, "rule")} skipped`);
  if (parts.length === 0) return "Imported settings match your current settings.";
  return `Imported settings: ${parts.join(", ")}.`;
}

function invalidResult(current: Settings, message: string): ImportResult {
  return {
    settings: current,
    valid: false,
    headline: "Nothing imported.",
    changes: [message],
    warnings: [],
    counts: zeroCounts(),
  };
}

/**
 * Merge a parsed JSON value into the current settings.
 *
 * Unknown keys are ignored by `sanitizeSettings`; every known field is clamped
 * to its valid range. When the file is not an object, the current settings are
 * returned untouched, so a bad import can never leave broken state.
 */
export function mergeImportedSettings(current: Settings, parsed: unknown): ImportResult {
  if (!isRecord(parsed)) {
    return invalidResult(current, "That file is not a Bionic Page settings export.");
  }
  const raw = parsed as Partial<Settings>;
  const settings = sanitizeSettings(raw);
  const { changes, warnings, counts } = diffSettings(current, settings, raw);
  return {
    settings,
    valid: true,
    headline: buildHeadline(counts),
    changes,
    warnings,
    counts,
  };
}
