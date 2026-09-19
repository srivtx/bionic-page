import { api, degraded } from "../shared/browser";
import { sendToTab } from "../shared/messaging";
import { loadSettings, saveSettings } from "../shared/storage";
import { DEFAULT_SETTINGS, sanitizeSettings } from "../shared/types";

const COMMAND = "toggle-bionic";

async function ensureDefaults(): Promise<void> {
  try {
    const current = await loadSettings();
    await saveSettings(sanitizeSettings({ ...DEFAULT_SETTINGS, ...current }));
  } catch {
    /* ignore */
  }
}

async function toggleActiveTab(): Promise<void> {
  if (degraded || !api?.tabs?.query) return;
  try {
    const tabs = await new Promise<any[]>((resolve) => {
      const result = api!.tabs.query({ active: true, currentWindow: true }, (t: any[]) => resolve(t ?? []));
      if (result && typeof result.then === "function") result.then(resolve, () => resolve([]));
    });
    const tab = tabs[0];
    if (tab?.id) await sendToTab(tab.id, { type: "toggle" });
  } catch {
    /* ignore */
  }
}

function registerCommands(): void {
  const commands = api?.commands;
  if (!commands?.onCommand?.addListener) return;
  commands.onCommand.addListener((command: string) => {
    if (command === COMMAND) void toggleActiveTab();
  });
}

function registerInstall(): void {
  const runtime = api?.runtime;
  if (!runtime?.onInstalled?.addListener) return;
  runtime.onInstalled.addListener((details: { reason?: string }) => {
    if (details?.reason === "install") void ensureDefaults();
  });
}

/** Reflect the per-tab on/off state on the toolbar icon. */
function registerBadge(): void {
  const runtime = api?.runtime;
  if (!runtime?.onMessage?.addListener) return;
  runtime.onMessage.addListener((message: { type?: string; active?: boolean }, sender: { tab?: { id?: number } }) => {
    if (message?.type !== "badge" || sender?.tab?.id === undefined) return false;
    const tabId = sender.tab.id;
    const action = api?.action;
    try {
      action?.setBadgeBackgroundColor?.({ tabId, color: "#4f46e5" });
      action?.setBadgeTextColor?.({ tabId, color: "#ffffff" });
      action?.setBadgeText?.({ tabId, text: message.active ? "on" : "" });
    } catch {
      /* ignore */
    }
    return false;
  });
}

registerInstall();
registerCommands();
registerBadge();
