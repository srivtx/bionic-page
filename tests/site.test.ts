import { describe, expect, test } from "bun:test";
import {
  effectiveSettings,
  isEnabledForUrl,
  matchPattern,
  resolveSiteRule,
} from "../src/shared/site";
import { DEFAULT_SETTINGS, sanitizeSettings, type Settings } from "../src/shared/types";

describe("matchPattern", () => {
  test("matches all urls", () => {
    expect(matchPattern("https://example.com/a", "<all_urls>")).toBe(true);
  });
  test("scheme wildcard matches http and https but not chrome", () => {
    expect(matchPattern("https://example.com/", "*://example.com/*")).toBe(true);
    expect(matchPattern("http://example.com/x", "*://example.com/*")).toBe(true);
    expect(matchPattern("chrome://extensions", "*://example.com/*")).toBe(false);
  });
  test("host must match exactly", () => {
    expect(matchPattern("https://example.com/", "*://example.com/*")).toBe(true);
    expect(matchPattern("https://www.example.com/", "*://example.com/*")).toBe(false);
  });
  test("subdomain wildcard", () => {
    expect(matchPattern("https://a.example.com/", "https://*.example.com/*")).toBe(true);
    expect(matchPattern("https://example.com/", "https://*.example.com/*")).toBe(true);
    expect(matchPattern("https://example.org/", "https://*.example.com/*")).toBe(false);
  });
  test("path globbing", () => {
    expect(matchPattern("https://example.com/news/1", "https://example.com/news/*")).toBe(true);
    expect(matchPattern("https://example.com/docs/1", "https://example.com/news/*")).toBe(false);
    expect(matchPattern("https://example.com/anything", "https://example.com")).toBe(true);
  });
  test("rejects malformed urls and patterns", () => {
    expect(matchPattern("not a url", "*://example.com/*")).toBe(false);
    expect(matchPattern("https://example.com/", "example.com")).toBe(false);
    expect(matchPattern("https://example.com/", "")).toBe(false);
  });
});

describe("resolveSiteRule", () => {
  const sites = [
    { pattern: "*://example.com/*", enabled: false },
    { pattern: "*://example.com/news/*", enabled: true, mode: "dim" as const },
  ];
  test("last match wins", () => {
    const rule = resolveSiteRule("https://example.com/news/1", sites);
    expect(rule?.mode).toBe("dim");
  });
  test("undefined when nothing matches", () => {
    expect(resolveSiteRule("https://other.com/", sites)).toBeUndefined();
  });
});

describe("isEnabledForUrl", () => {
  test("global off beats any site rule", () => {
    const s: Settings = sanitizeSettings({ ...DEFAULT_SETTINGS, enabled: false, sites: [{ pattern: "*://example.com/*", enabled: true }] });
    expect(isEnabledForUrl(s, "https://example.com/")).toBe(false);
  });
  test("site rule can disable", () => {
    const s = sanitizeSettings({ ...DEFAULT_SETTINGS, sites: [{ pattern: "*://example.com/*", enabled: false }] });
    expect(isEnabledForUrl(s, "https://example.com/")).toBe(false);
    expect(isEnabledForUrl(s, "https://other.com/")).toBe(true);
  });
});

describe("effectiveSettings", () => {
  test("site mode and intensity override the global values", () => {
    const s = sanitizeSettings({
      ...DEFAULT_SETTINGS,
      mode: "classic",
      intensity: 0.5,
      sites: [{ pattern: "*://example.com/*", enabled: true, mode: "dim", intensity: 0.8 }],
    });
    const eff = effectiveSettings(s, "https://example.com/");
    expect(eff.mode).toBe("dim");
    expect(eff.intensity).toBe(0.8);
    expect(eff.minWordLength).toBe(s.minWordLength);
  });
});
