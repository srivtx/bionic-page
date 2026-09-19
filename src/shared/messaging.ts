import { api, call, degraded } from "./browser";
import type { Message } from "./types";

/** Send a message to a specific tab's content script. Never throws. */
export async function sendToTab(tabId: number, message: Message): Promise<unknown> {
  if (degraded || !api?.tabs?.sendMessage) return undefined;
  try {
    return await call(api.tabs.sendMessage, api.tabs, tabId, message);
  } catch {
    return undefined; // content script not present (chrome://, store pages, PDF viewer)
  }
}

/** Send a message to the active tab in the current window. */
export async function sendToActiveTab(message: Message): Promise<unknown> {
  if (degraded || !api?.tabs?.query) return undefined;
  try {
    const tabs = await call<any[]>(api.tabs.query, api.tabs, { active: true, currentWindow: true });
    const tab = tabs?.[0];
    if (!tab?.id) return undefined;
    return await sendToTab(tab.id, message);
  } catch {
    return undefined;
  }
}

/** Broadcast a message to every tab. Returns the number of tabs contacted. */
export async function broadcast(message: Message): Promise<number> {
  if (degraded || !api?.tabs?.query) return 0;
  try {
    const tabs = (await call<any[]>(api.tabs.query, api.tabs, {})) ?? [];
    let n = 0;
    for (const tab of tabs) {
      if (!tab?.id) continue;
      const result = await sendToTab(tab.id, message);
      if (result !== undefined) n += 1;
    }
    return n;
  } catch {
    return 0;
  }
}

/**
 * Register a message handler. Handlers return a value (or a promise) that is
 * sent back to the caller. Returning `undefined` means "not handled".
 */
export function onMessage(handler: (message: Message) => unknown): void {
  if (degraded || !api?.runtime?.onMessage) return;
  api.runtime.onMessage.addListener((message: Message, _sender: unknown, sendResponse: (r?: unknown) => void) => {
    const result = handler(message);
    if (result === undefined) return false;
    Promise.resolve(result).then(sendResponse, () => sendResponse(undefined));
    return true; // keep the channel open for the async response
  });
}
