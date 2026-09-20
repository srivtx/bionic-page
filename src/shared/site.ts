import type { SiteRule, Settings } from "./types";

/**
 * Match-pattern matching for content-script / popup agreement.
 * Supported forms:
 *   "<all_urls>"
 *   "*://host/path"
 *   "https://host/path"        (http/https explicit)
 *   "https://*.example.com/*"  (subdomain wildcard)
 * Path supports a trailing/embedded "*". Missing path means "/*".
 */
export function matchPattern(url: string, pattern: string): boolean {
  if (!pattern) return false;
  if (pattern === "<all_urls>") return true;
  if (!url) return false;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  const schemeMatch = /^(\*|https?|file|ftp):\/\//.exec(pattern);
  if (!schemeMatch) return false;
  const scheme = schemeMatch[1] ?? "*";
  const rest = pattern.slice(schemeMatch[0].length);
  const slash = rest.indexOf("/");
  const host = slash === -1 ? rest : rest.slice(0, slash);
  const rawPath = slash === -1 ? "/*" : rest.slice(slash);

  if (scheme !== "*" && scheme !== parsed.protocol.replace(":", "")) return false;
  if (scheme === "*" && parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;

  if (host !== "*") {
    const hostname = parsed.hostname.toLowerCase();
    const wanted = host.toLowerCase();
    if (wanted.startsWith("*.")) {
      const base = wanted.slice(2);
      if (hostname !== base && !hostname.endsWith("." + base)) return false;
    } else if (hostname !== wanted) {
      return false;
    }
  }

  return globPath(rawPath, parsed.pathname + parsed.search);
}

function globPath(pattern: string, value: string): boolean {
  if (pattern === "/*" || pattern === "*") return true;
  const escaped = pattern
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp("^" + escaped + "$").test(value);
}

/** Last matching site rule wins; undefined when none match. */
export function resolveSiteRule(url: string, sites: readonly SiteRule[]): SiteRule | undefined {
  let found: SiteRule | undefined;
  for (const rule of sites) {
    if (matchPattern(url, rule.pattern)) found = rule;
  }
  return found;
}

/** Whether the extension should transform a given URL before a session override. */
export function isEnabledForUrl(settings: Settings, url: string): boolean {
  if (!settings.enabled) return false;
  const rule = resolveSiteRule(url, settings.sites);
  return rule ? rule.enabled : true;
}

/** Global settings merged with the matching per-site rule. */
export function effectiveSettings(settings: Settings, url: string): Settings {
  const rule = resolveSiteRule(url, settings.sites);
  if (!rule) return settings;
  return {
    ...settings,
    mode: rule.mode ?? settings.mode,
    intensity: typeof rule.intensity === "number" ? rule.intensity : settings.intensity,
  };
}

/**
 * Normalisation, validation, and preview for the per-site rules editor.
 *
 * These are pure and DOM-free so the popup and the options page share exactly
 * one notion of "what is a usable match pattern". `matchPattern` above remains
 * the single matcher; `describePattern` reports its verdict on sample URLs.
 */

export interface PatternParts {
  scheme: "*" | "http" | "https" | "file" | "ftp";
  host: string;
  path: string;
}

const PATTERN_SCHEME = /^(\*|https?|file|ftp):\/\//i;

/** Split a match pattern into scheme, host, and path, or null when shaped wrong. */
export function parsePattern(pattern: string): PatternParts | null {
  if (!pattern || pattern === "<all_urls>") return null;
  const match = PATTERN_SCHEME.exec(pattern);
  if (!match) return null;
  const scheme = match[1]!.toLowerCase() as PatternParts["scheme"];
  const rest = pattern.slice(match[0].length);
  const slash = rest.indexOf("/");
  const host = (slash === -1 ? rest : rest.slice(0, slash)).toLowerCase();
  const path = slash === -1 ? "/*" : rest.slice(slash);
  return { scheme, host, path };
}

/**
 * Turn a bare hostname into a match pattern and normalise case.
 *   "news.ycombinator.com"        -> "*://news.ycombinator.com/*"
 *   "https://Example.com"         -> "https://example.com/*"
 *   "*://*.example.com/*"         -> unchanged
 * Unrecognised input is returned trimmed, so callers can still validate it.
 */
export function normalizePattern(input: string): string {
  const raw = (input ?? "").trim();
  if (!raw || raw === "<all_urls>") return raw;
  let work = raw.replace(/^\/\//, "");
  if (!PATTERN_SCHEME.test(work)) work = `*://${work}`;
  const match = PATTERN_SCHEME.exec(work);
  if (!match) return raw;
  const scheme = match[1]!.toLowerCase();
  const rest = work.slice(match[0].length);
  const slash = rest.indexOf("/");
  const host = (slash === -1 ? rest : rest.slice(0, slash)).toLowerCase();
  let path = slash === -1 ? "/*" : rest.slice(slash);
  if (path === "/") path = "/*";
  return `${scheme}://${host}${path}`;
}

export interface PatternCheck {
  /** True when the (possibly normalised) pattern is a usable match pattern. */
  ok: boolean;
  /** The normalised pattern when ok; the trimmed input when not. */
  pattern: string;
  /** True when normalising changed the input (a bare host, or case). */
  normalized: boolean;
  /** A specific, human message when ok is false. */
  error?: string;
}

function rejectPattern(raw: string, normalized: boolean, error: string): PatternCheck {
  return { ok: false, pattern: raw, normalized, error };
}

const HOSTNAME = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/;
const WILDCARD_HOSTNAME = /^\*\.[a-z0-9-]+(\.[a-z0-9-]+)*$/;

/**
 * Validate a pattern and normalise it. Never silently accepts garbage: every
 * rejection carries a message that names the problem.
 */
export function validatePattern(input: string): PatternCheck {
  const raw = (input ?? "").trim();
  if (!raw) return rejectPattern(raw, false, "Enter a hostname or match pattern, for example news.ycombinator.com.");
  if (raw === "<all_urls>") return { ok: true, pattern: raw, normalized: false };

  const pattern = normalizePattern(raw);
  const normalized = pattern !== raw;
  const parts = parsePattern(pattern);
  if (!parts) return rejectPattern(raw, normalized, "Use a scheme like https, or just a hostname such as example.com.");

  const { scheme, host, path } = parts;
  if (!host) {
    return rejectPattern(raw, normalized, "Add a hostname, for example news.ycombinator.com.");
  }
  if (/:\d+$/.test(host)) {
    return rejectPattern(raw, normalized, "Match patterns cannot include a port; use the bare host, for example localhost.");
  }
  if (host !== "*" && host.includes("*")) {
    if (!WILDCARD_HOSTNAME.test(host)) {
      return rejectPattern(raw, normalized, "Use * only as the whole host or as a leading *. label, for example *.example.com.");
    }
  } else if (host !== "*" && !HOSTNAME.test(host)) {
    return rejectPattern(raw, normalized, "That hostname has characters match patterns cannot use.");
  }
  if (!path.startsWith("/")) {
    return rejectPattern(raw, normalized, "The path must start with /.");
  }
  if (scheme === "file") {
    return rejectPattern(raw, normalized, "File patterns use the file scheme and are not editable here.");
  }
  return { ok: true, pattern, normalized };
}

export interface PatternImpact {
  /** One-line description of what the pattern covers. */
  scope: string;
  /** Sample URLs that the pattern matches. */
  matches: string[];
  /** Sample URLs that the pattern does not match. */
  misses: string[];
}

/**
 * Show what a pattern will and will not match. Sample URLs are generated from
 * the pattern and then judged by `matchPattern`, so the preview can never
 * disagree with the matcher the content script uses.
 */
export function describePattern(pattern: string): PatternImpact {
  const parts = parsePattern(pattern);
  if (!parts) return { scope: "", matches: [], misses: [] };

  const { scheme, host } = parts;
  const sampleHost = host === "*" ? "example.com" : host.startsWith("*.") ? `www.${host.slice(2)}` : host;
  const wildcardBase = host.startsWith("*.") ? host.slice(2) : undefined;
  const samplePath = parts.path === "/*" || parts.path === "*" ? "/" : parts.path.replace(/\*/g, "1");
  const schemes = scheme === "*" ? ["https", "http"] : [scheme];
  const first = schemes[0]!;

  const candidates: string[] = [];
  for (const s of schemes) candidates.push(`${s}://${sampleHost}${samplePath}`);
  if (wildcardBase) for (const s of schemes) candidates.push(`${s}://${wildcardBase}${samplePath}`);
  candidates.push(`${first}://${sampleHost}/a/deeper/page?ok=1`);
  if (scheme !== "*") {
    const other = scheme === "https" ? "http" : "https";
    candidates.push(`${other}://${sampleHost}${samplePath}`);
  }
  if (host !== "*") candidates.push(`${first}://${sampleHost}.invalid${samplePath}`);
  if (parts.path !== "/*" && parts.path !== "*") candidates.push(`${first}://${sampleHost}/somewhere-else`);

  const matches: string[] = [];
  const misses: string[] = [];
  for (const url of candidates) {
    if (matchPattern(url, pattern)) {
      if (!matches.includes(url)) matches.push(url);
    } else if (!misses.includes(url)) {
      misses.push(url);
    }
  }
  return { scope: scopeText(parts), matches: matches.slice(0, 3), misses: misses.slice(0, 3) };
}

function scopeText(parts: PatternParts): string {
  const host = parts.host === "*" ? "every host" : parts.host.startsWith("*.") ? `any subdomain of ${parts.host.slice(2)}` : parts.host;
  const scheme = parts.scheme === "*" ? "http and https" : parts.scheme;
  return `${scheme} pages on ${host}`;
}

/** The hostname of a page URL, or undefined for non-web or unparsable URLs. */
export function hostForUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return parsed.hostname || undefined;
  } catch {
    return undefined;
  }
}

/**
 * The match pattern for "this site": the exact host, both http and https, with
 * no port (match patterns reject ports). Undefined outside http/https.
 */
export function patternForUrl(url: string | undefined): string | undefined {
  const host = hostForUrl(url);
  if (!host || host.includes(":")) return undefined;
  try {
    const parsed = new URL(url!);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;
  } catch {
    return undefined;
  }
  return normalizePattern(`${host}/*`);
}

/**
 * Create or update the rule for an exact pattern and move it last, so it wins
 * under "last match wins". Pure and idempotent.
 */
export function upsertSiteRule(sites: readonly SiteRule[], pattern: string, enabled: boolean): SiteRule[] {
  const existing = sites.find((rule) => rule.pattern === pattern);
  const next = sites.filter((rule) => rule.pattern !== pattern).map((rule) => ({ ...rule }));
  next.push(existing ? { ...existing, enabled } : { pattern, enabled });
  return next;
}
