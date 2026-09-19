import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");

function idsIn(html: string): Set<string> {
  const ids = new Set<string>();
  for (const match of html.matchAll(/\bid="([^"]+)"/g)) ids.add(match[1]!);
  return ids;
}

/** Ids the script fetches through `el<T>("id")` or `getElementById("id")`. */
function referencedIds(ts: string): Set<string> {
  const ids = new Set<string>();
  for (const match of ts.matchAll(/\bel<[^>]*>\(\s*"([^"]+)"\s*\)/g)) ids.add(match[1]!);
  for (const match of ts.matchAll(/getElementById\(\s*"([^"]+)"\s*\)/g)) ids.add(match[1]!);
  return ids;
}

describe("popup and options wiring", () => {
  for (const page of ["popup", "options"]) {
    test(`${page}: every referenced element id exists in ${page}.html`, () => {
      const ts = readFileSync(join(ROOT, "src", page, `${page}.ts`), "utf8");
      const html = readFileSync(join(ROOT, "src", page, `${page}.html`), "utf8");
      const present = idsIn(html);
      const referenced = referencedIds(ts);
      const missing = [...referenced].filter((id) => !present.has(id));
      expect(missing).toEqual([]);
      expect(referenced.size).toBeGreaterThan(0);
    });

    test(`${page}.html loads the script and stylesheet the build will emit`, () => {
      const html = readFileSync(join(ROOT, "src", page, `${page}.html`), "utf8");
      expect(html).toContain(`src="${page}.js"`);
      expect(html).toContain(`href="${page}.css"`);
    });
  }

  test("the manifest entry points match the files each build copies", () => {
    const html = readFileSync(join(ROOT, "src", "popup", "popup.html"), "utf8");
    expect(html).toContain('src="popup.js"');
    const options = readFileSync(join(ROOT, "src", "options", "options.html"), "utf8");
    expect(options).toContain('src="options.js"');
  });
});
