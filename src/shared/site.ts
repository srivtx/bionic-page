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
