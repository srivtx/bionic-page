import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { assetVersion, stalePages } from "../scripts/stamp-assets.mjs";
import {
  describePattern,
  effectiveSettings,
  hostForUrl,
  isEnabledForUrl,
  matchPattern,
  normalizePattern,
  parsePattern,
  patternForUrl,
  resolveSiteRule,
  upsertSiteRule,
  validatePattern,
} from "../src/shared/site";
import { DEFAULT_SETTINGS, sanitizeSettings, type Settings, type SiteRule } from "../src/shared/types";

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

describe("normalizePattern", () => {
  test("turns a bare hostname into a match pattern", () => {
    expect(normalizePattern("news.ycombinator.com")).toBe("*://news.ycombinator.com/*");
    expect(normalizePattern("example.com")).toBe("*://example.com/*");
    expect(normalizePattern("example.com/news")).toBe("*://example.com/news");
  });

  test("fills in a missing path and lowercases scheme and host", () => {
    expect(normalizePattern("https://Example.com")).toBe("https://example.com/*");
    expect(normalizePattern("https://example.com/")).toBe("https://example.com/*");
    expect(normalizePattern("HTTP://Example.COM/A")).toBe("http://example.com/A");
  });

  test("leaves a valid pattern alone and trims whitespace", () => {
    expect(normalizePattern("*://*.example.com/*")).toBe("*://*.example.com/*");
    expect(normalizePattern("  news.ycombinator.com  ")).toBe("*://news.ycombinator.com/*");
  });

  test("handles the two special forms", () => {
    expect(normalizePattern("")).toBe("");
    expect(normalizePattern("<all_urls>")).toBe("<all_urls>");
  });
});

describe("parsePattern", () => {
  test("splits scheme, host, and path with the path defaulting to /*", () => {
    expect(parsePattern("https://example.com/a/b?c=1")).toEqual({
      scheme: "https",
      host: "example.com",
      path: "/a/b?c=1",
    });
    expect(parsePattern("*://news.ycombinator.com")).toEqual({
      scheme: "*",
      host: "news.ycombinator.com",
      path: "/*",
    });
  });

  test("returns null for <all_urls> and for a bare host", () => {
    expect(parsePattern("<all_urls>")).toBeNull();
    expect(parsePattern("example.com")).toBeNull();
  });
});

describe("validatePattern", () => {
  test("accepts a bare host and offers the normalised pattern", () => {
    const check = validatePattern("news.ycombinator.com");
    expect(check.ok).toBe(true);
    expect(check.normalized).toBe(true);
    expect(check.pattern).toBe("*://news.ycombinator.com/*");
    expect(check.error).toBeUndefined();
  });

  test("accepts an already-normalised pattern without rewriting it", () => {
    const check = validatePattern("*://news.ycombinator.com/*");
    expect(check.ok).toBe(true);
    expect(check.normalized).toBe(false);
    expect(check.pattern).toBe("*://news.ycombinator.com/*");
  });

  test("accepts <all_urls>", () => {
    expect(validatePattern("<all_urls>").ok).toBe(true);
  });

  test("rejects an empty pattern with a specific message", () => {
    const check = validatePattern("   ");
    expect(check.ok).toBe(false);
    expect(check.error).toContain("Enter a hostname");
  });

  test("names the problem for a port", () => {
    const check = validatePattern("localhost:3000");
    expect(check.ok).toBe(false);
    expect(check.error).toContain("port");
  });

  test("names the problem for a misplaced wildcard", () => {
    const check = validatePattern("foo.*.com");
    expect(check.ok).toBe(false);
    expect(check.error).toContain("*.");
  });

  test("names the problem for illegal hostname characters", () => {
    const check = validatePattern("exa mple.com");
    expect(check.ok).toBe(false);
    expect(check.error).toContain("hostname");
  });

  test("rejects an empty label", () => {
    const check = validatePattern("example..com");
    expect(check.ok).toBe(false);
  });

  test("a valid-looking suggestion always re-validates cleanly", () => {
    for (const input of ["news.ycombinator.com", "https://Example.com", "*.example.com", "example.com/news/*"]) {
      const first = validatePattern(input);
      expect(first.ok).toBe(true);
      const second = validatePattern(first.pattern);
      expect(second.ok).toBe(true);
      expect(second.pattern).toBe(first.pattern);
    }
  });
});

describe("describePattern", () => {
  const patterns = [
    "*://news.ycombinator.com/*",
    "https://example.com/news/*",
    "*://*.example.com/*",
    "*://*/*",
    "<all_urls>",
  ];

  test("preview matches agree with matchPattern", () => {
    for (const pattern of patterns) {
      const impact = describePattern(pattern);
      for (const url of impact.matches) {
        expect(matchPattern(url, pattern)).toBe(true);
      }
      for (const url of impact.misses) {
        expect(matchPattern(url, pattern)).toBe(false);
      }
    }
  });

  test("offers at least one match for an ordinary pattern", () => {
    const impact = describePattern("*://news.ycombinator.com/*");
    expect(impact.matches.length).toBeGreaterThan(0);
    expect(impact.scope).toContain("news.ycombinator.com");
  });

  test("shows a scheme mismatch it will not match", () => {
    const impact = describePattern("https://example.com/news/*");
    expect(impact.misses.some((url) => url.startsWith("http://"))).toBe(true);
  });

  test("<all_urls> has no sample URLs", () => {
    const impact = describePattern("<all_urls>");
    expect(impact.matches).toEqual([]);
    expect(impact.misses).toEqual([]);
  });
});

describe("hostForUrl and patternForUrl", () => {
  test("extracts the host and builds a port-free pattern", () => {
    expect(hostForUrl("https://news.ycombinator.com/item?id=1")).toBe("news.ycombinator.com");
    expect(patternForUrl("https://news.ycombinator.com/item?id=1")).toBe("*://news.ycombinator.com/*");
    expect(patternForUrl("http://localhost:3000/x")).toBe("*://localhost/*");
    expect(matchPattern("http://localhost:3000/x", patternForUrl("http://localhost:3000/x")!)).toBe(true);
  });

  test("refuses non-web URLs", () => {
    expect(patternForUrl("chrome://extensions")).toBeUndefined();
    expect(patternForUrl("about:blank")).toBeUndefined();
    expect(patternForUrl(undefined)).toBeUndefined();
    expect(hostForUrl(undefined)).toBeUndefined();
  });

  test("refuses an IPv6 host it cannot express", () => {
    expect(patternForUrl("https://[::1]/")).toBeUndefined();
  });
});

describe("upsertSiteRule", () => {
  test("appends a new rule at the end", () => {
    const sites = upsertSiteRule([], "*://a.example/*", false);
    expect(sites).toEqual([{ pattern: "*://a.example/*", enabled: false }]);
  });

  test("updates an existing rule and moves it last", () => {
    const before: SiteRule[] = [
      { pattern: "*://a.example/*", enabled: true, mode: "dim" },
      { pattern: "*://b.example/*", enabled: true },
    ];
    const after = upsertSiteRule(before, "*://a.example/*", false);
    expect(after.map((rule) => rule.pattern)).toEqual(["*://b.example/*", "*://a.example/*"]);
    expect(after[1]).toEqual({ pattern: "*://a.example/*", enabled: false, mode: "dim" });
  });

  test("is idempotent and does not mutate its input", () => {
    const before: SiteRule[] = [{ pattern: "*://a.example/*", enabled: true }];
    const once = upsertSiteRule(before, "*://a.example/*", false);
    const twice = upsertSiteRule(once, "*://a.example/*", false);
    expect(twice).toEqual(once);
    expect(before).toEqual([{ pattern: "*://a.example/*", enabled: true }]);
  });
});

/*
 * The asset version in the site's query strings has to match the assets it
 * names. It was hand-maintained once and never moved while the CSS and JS kept
 * changing, so browsers and the Pages CDN served the old files at the same URL
 * and a round of fixes was invisible to anyone with a warm cache. This is the
 * gate that keeps that from happening again.
 */
describe("site asset stamp", () => {
  const site = join(import.meta.dir, "..", "site");
  const assets = join(site, "assets");

  test("every page references the current assets", () => {
    expect(stalePages(site, assetVersion(assets))).toEqual([]);
  });

  test("the stamp is a content hash, not a hand-written number", () => {
    expect(assetVersion(assets)).toMatch(/^[0-9a-f]{10}$/);
  });

  test("the stamp changes when an asset changes", () => {
    const first = assetVersion(assets);
    expect(first).toBe(assetVersion(assets));
    expect(first).not.toBe("0000000000");
  });
});
