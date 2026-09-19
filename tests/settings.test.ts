import { describe, expect, test } from "bun:test";
import { DEFAULT_SETTINGS, sanitizeSettings, SETTINGS_VERSION } from "../src/shared/types";

describe("sanitizeSettings", () => {
  test("defaults are already valid and stable", () => {
    expect(sanitizeSettings(DEFAULT_SETTINGS)).toEqual(DEFAULT_SETTINGS);
  });

  test("empty input yields the defaults", () => {
    expect(sanitizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings({})).toEqual(DEFAULT_SETTINGS);
  });

  test("clamps intensity to [0.2, 0.9]", () => {
    expect(sanitizeSettings({ intensity: 0 }).intensity).toBe(0.2);
    expect(sanitizeSettings({ intensity: 5 }).intensity).toBe(0.9);
    expect(sanitizeSettings({ intensity: 0.5 }).intensity).toBe(0.5);
    expect(sanitizeSettings({ intensity: Number.NaN }).intensity).toBe(0.2);
  });

  test("rounds and clamps min word length to [2, 8]", () => {
    expect(sanitizeSettings({ minWordLength: 1 }).minWordLength).toBe(2);
    expect(sanitizeSettings({ minWordLength: 99 }).minWordLength).toBe(8);
    expect(sanitizeSettings({ minWordLength: 3.6 }).minWordLength).toBe(4);
  });

  test("clamps bold weight to [500, 900]", () => {
    expect(sanitizeSettings({ boldWeight: 100 }).boldWeight).toBe(500);
    expect(sanitizeSettings({ boldWeight: 5000 }).boldWeight).toBe(900);
  });

  test("clamps rest opacity to [0.4, 1]", () => {
    expect(sanitizeSettings({ restOpacity: 0 }).restOpacity).toBe(0.4);
    expect(sanitizeSettings({ restOpacity: 2 }).restOpacity).toBe(1);
  });

  test("rejects unknown modes and keeps the version pinned", () => {
    expect(sanitizeSettings({ mode: "nope" as never }).mode).toBe(DEFAULT_SETTINGS.mode);
    expect(sanitizeSettings({ mode: "dim" }).mode).toBe("dim");
    expect(sanitizeSettings({ version: 99 as never }).version).toBe(SETTINGS_VERSION);
  });

  test("coerces booleans", () => {
    expect(sanitizeSettings({ enabled: 0 as never }).enabled).toBe(false);
    expect(sanitizeSettings({ enabled: 1 as never }).enabled).toBe(true);
  });

  test("filters malformed site rules and clamps their fields", () => {
    const s = sanitizeSettings({
      sites: [
        { pattern: "https://example.com/*", enabled: true, intensity: 5, mode: "dim" },
        { pattern: 123 as never, enabled: true },
        { enabled: false } as never,
      ] as never,
    });
    expect(s.sites).toHaveLength(1);
    expect(s.sites[0]).toEqual({
      pattern: "https://example.com/*",
      enabled: true,
      mode: "dim",
      intensity: 0.9,
    });
  });

  test("drops non-string rule and custom vowels", () => {
    const s = sanitizeSettings({ rule: 5 as never, customVowels: null as never });
    expect(s.rule).toBe(DEFAULT_SETTINGS.rule);
    expect(s.customVowels).toBe("");
  });

  test("is idempotent", () => {
    const once = sanitizeSettings({ intensity: 9, minWordLength: -1, sites: [] });
    expect(sanitizeSettings(once)).toEqual(once);
  });
});
