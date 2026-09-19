import { api } from "../shared/browser";

function el<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

el<HTMLButtonElement>("openOptions")?.addEventListener("click", () => {
  try {
    if (api?.runtime?.openOptionsPage) {
      api.runtime.openOptionsPage();
      return;
    }
  } catch {
    /* fall through */
  }
  window.open("options.html", "_blank");
});

el<HTMLButtonElement>("openShortcuts")?.addEventListener("click", () => {
  const url =
    typeof navigator !== "undefined" && /Firefox/i.test(navigator.userAgent)
      ? "about:addons"
      : "chrome://extensions/shortcuts";
  try {
    if (api?.tabs?.create) {
      api.tabs.create({ url });
      return;
    }
  } catch {
    /* fall through */
  }
  window.open(url, "_blank");
});

el<HTMLButtonElement>("close")?.addEventListener("click", () => {
  window.close();
});
