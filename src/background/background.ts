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

registerInstall();
registerCommands();
void ensureDefaults;
