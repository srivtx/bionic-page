import { describe, expect, test } from "bun:test";
import { manifestFor } from "../scripts/manifest.mjs";

describe("generated manifests", () => {
  const version = "9.9.9";

  test("both targets are MV3 with the same identity", () => {
    for (const target of ["chrome", "firefox"] as const) {
      const m = manifestFor(target, version);
      expect(m.manifest_version).toBe(3);
      expect(m.name).toBe("Bionic Page");
      expect(m.version).toBe(version);
    }
  });

  test("permissions are minimal and explicit", () => {
    const m = manifestFor("chrome", version);
    expect(m.permissions).toEqual(["storage", "activeTab"]);
    expect(m.host_permissions).toEqual(["<all_urls>"]);
  });

  test("content script covers all frames", () => {
    const m = manifestFor("chrome", version);
    expect(m.content_scripts).toHaveLength(1);
    expect(m.content_scripts[0].matches).toEqual(["<all_urls>"]);
    expect(m.content_scripts[0].all_frames).toBe(true);
    expect(m.content_scripts[0].js).toEqual(["content.js"]);
  });

  test("chrome uses a service worker and no gecko block", () => {
    const m = manifestFor("chrome", version);
    expect(m.background.service_worker).toBe("background.js");
    expect(m.background.scripts).toBeUndefined();
    expect(m.browser_specific_settings).toBeUndefined();
    expect(m.minimum_chrome_version).toBeDefined();
  });

  test("firefox uses background scripts, a gecko id, and no chrome floor", () => {
    const m = manifestFor("firefox", version);
    expect(Array.isArray(m.background.scripts)).toBe(true);
    expect(m.background.service_worker).toBeUndefined();
    expect(m.minimum_chrome_version).toBeUndefined();
    expect(m.browser_specific_settings.gecko.id).toContain("@");
    expect(m.browser_specific_settings.gecko.data_collection_permissions.required).toEqual(["none"]);
  });

  test("action, options, icons, and the toggle command are present", () => {
    for (const target of ["chrome", "firefox"] as const) {
      const m = manifestFor(target, version);
      expect(m.action.default_popup).toBe("popup.html");
      expect(m.options_ui.page).toBe("options.html");
      expect(Object.keys(m.icons).sort()).toEqual(["128", "16", "32", "48"]);
      expect(m.commands["toggle-bionic"]).toBeDefined();
    }
  });

  test("unknown targets are rejected", () => {
    expect(() => manifestFor("safari" as never, version)).toThrow();
  });
});
