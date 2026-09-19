/**
 * Single source of truth for the generated manifests. Imported by build.mjs and
 * asserted by tests/manifest.test.ts so the two engines cannot drift.
 */

export const NAME = "Bionic Page";
export const DESCRIPTION =
  "Turn any web page into a bionic reading page: configurable fixation emphasis, five modes, per-site control, fully reversible.";

export const ICONS = {
  16: "icons/icon16.png",
  32: "icons/icon32.png",
  48: "icons/icon48.png",
  128: "icons/icon128.png",
};

export function baseManifest(version) {
  return {
    manifest_version: 3,
    name: NAME,
    version,
    description: DESCRIPTION,
    permissions: ["storage", "activeTab"],
    host_permissions: ["<all_urls>"],
    action: {
      default_title: NAME,
      default_popup: "popup.html",
      default_icon: ICONS,
    },
    options_ui: { page: "options.html", open_in_tab: true },
    icons: ICONS,
    content_scripts: [
      {
        matches: ["<all_urls>"],
        js: ["content.js"],
        run_at: "document_idle",
        all_frames: true,
      },
    ],
    commands: {
      "toggle-bionic": {
        suggested_key: { default: "Ctrl+Shift+Y", mac: "Command+Shift+Y" },
        description: "Toggle bionic reading on this page",
      },
    },
  };
}

export function manifestFor(target, version) {
  const base = baseManifest(version);
  if (target === "chrome") {
    return {
      ...base,
      minimum_chrome_version: "116",
      background: { service_worker: "background.js" },
    };
  }
  if (target === "firefox") {
    return {
      ...base,
      background: { scripts: ["background.js"] },
      browser_specific_settings: {
        gecko: {
          id: "bionic-page@example.com",
          strict_min_version: "140.0",
          data_collection_permissions: { required: ["none"] },
        },
        gecko_android: {
          strict_min_version: "142.0",
        },
      },
    };
  }
  throw new Error(`unknown target: ${target}`);
}
