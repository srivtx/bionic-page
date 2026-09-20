import { describe, expect, test } from "bun:test";
import { diffSettings, mergeImportedSettings } from "../src/options/settings-transfer";
import { DEFAULT_SETTINGS, sanitizeSettings, type Settings } from "../src/shared/types";

function base(overrides: Partial<Settings> = {}): Settings {
  return sanitizeSettings({ ...DEFAULT_SETTINGS, ...overrides });
}

describe("mergeImportedSettings", () => {
  test("rejects values that are not a settings object", () => {
    const current = base({ intensity: 0.6 });
    for (const parsed of [null, undefined, 42, "text", [], true]) {
      const result = mergeImportedSettings(current, parsed);
      expect(result.valid).toBe(false);
      expect(result.settings).toEqual(current);
      expect(result.changes[0]).toContain("not a Bionic Page settings export");
    }
  });

  test("ignores unknown keys", () => {
    const result = mergeImportedSettings(base(), { intensity: 0.6, nonsense: true, "$schema": 1 });
    expect(result.valid).toBe(true);
    expect(result.settings.intensity).toBe(0.6);
    expect(Object.keys(result.settings)).not.toContain("nonsense");
  });

  test("clamps every field through sanitizeSettings", () => {
    const result = mergeImportedSettings(base(), {
      intensity: 1.2,
      minWordLength: 99,
      boldWeight: 100,
      restOpacity: -3,
      enabled: 0,
    });
    expect(result.settings.intensity).toBe(0.9);
    expect(result.settings.minWordLength).toBe(8);
    expect(result.settings.boldWeight).toBe(500);
    expect(result.settings.restOpacity).toBe(0.4);
    expect(result.settings.enabled).toBe(false);
    expect(result.settings.version).toBe(1);
  });

  test("reports a clamped intensity with both numbers", () => {
    const result = mergeImportedSettings(base({ intensity: 0.5 }), { intensity: 1.2 });
    expect(result.changes).toContain("Intensity 1.2 clamped to 0.9.");
  });

  test("reports added, removed, and updated rules", () => {
    const current = base({
      sites: [
        { pattern: "*://keep.example/*", enabled: true },
        { pattern: "*://gone.example/*", enabled: true },
      ],
    });
    const result = mergeImportedSettings(current, {
      sites: [
        { pattern: "*://keep.example/*", enabled: false },
        { pattern: "*://new.example/*", enabled: true },
      ],
    });
    expect(result.counts.rulesAdded).toBe(1);
    expect(result.counts.rulesRemoved).toBe(1);
    expect(result.counts.rulesChanged).toBe(1);
    expect(result.settings.sites.map((rule) => rule.pattern)).toEqual([
      "*://keep.example/*",
      "*://new.example/*",
    ]);
    expect(result.headline).toContain("1 rule added");
  });

  test("warns about a bare host that would never match as written", () => {
    const result = mergeImportedSettings(base(), { sites: [{ pattern: "example.com", enabled: true }] });
    expect(result.warnings.some((warning) => warning.includes("will never match as written"))).toBe(true);
    expect(result.warnings.some((warning) => warning.includes("*://example.com/*"))).toBe(true);
  });

  test("warns about a pattern that is not a match pattern at all", () => {
    const result = mergeImportedSettings(base(), { sites: [{ pattern: "not a url", enabled: true }] });
    expect(result.warnings.some((warning) => warning.includes("not a valid match pattern"))).toBe(true);
  });

  test("counts entries with no pattern as skipped", () => {
    const result = mergeImportedSettings(base(), { sites: [{ enabled: true }, { pattern: 5 }, { pattern: "*://ok.example/*", enabled: true }] });
    expect(result.counts.rulesSkipped).toBe(2);
    expect(result.settings.sites).toHaveLength(1);
  });

  test("the merged settings always equal a direct sanitize", () => {
    const parsed = {
      mode: "nope",
      intensity: 4,
      sites: [{ pattern: "*://a.example/*", enabled: 1, intensity: 9 }],
    };
    const result = mergeImportedSettings(base(), parsed);
    expect(result.settings).toEqual(sanitizeSettings(parsed as unknown as Partial<Settings>));
  });

  test("importing the same file twice is stable", () => {
    const parsed = { intensity: 0.4, sites: [{ pattern: "*://a.example/*", enabled: true }] };
    const once = mergeImportedSettings(base(), parsed);
    const twice = mergeImportedSettings(once.settings, parsed);
    expect(twice.settings).toEqual(once.settings);
    expect(twice.changes).toEqual([]);
    expect(twice.headline).toContain("match your current settings");
  });

  test("unknown booleans are coerced, not trusted", () => {
    const result = mergeImportedSettings(base(), { skipCommonWords: "yes", letterSpacing: 0 });
    expect(result.settings.skipCommonWords).toBe(true);
    expect(result.settings.letterSpacing).toBe(false);
  });
});

describe("diffSettings", () => {
  test("returns nothing for identical settings", () => {
    const settings = base();
    const diff = diffSettings(settings, settings);
    expect(diff.changes).toEqual([]);
    expect(diff.warnings).toEqual([]);
    expect(diff.counts.fieldsChanged).toBe(0);
  });

  test("describes a mode change by its label", () => {
    const diff = diffSettings(base({ mode: "half" }), base({ mode: "dim" }));
    expect(diff.changes).toContain("Mode set to Low distraction.");
    expect(diff.counts.fieldsChanged).toBe(1);
  });

  test("describes booleans as on and off", () => {
    const diff = diffSettings(base({ processIframes: true }), base({ processIframes: false }));
    expect(diff.changes).toContain("Run inside iframes off.");
  });
});
