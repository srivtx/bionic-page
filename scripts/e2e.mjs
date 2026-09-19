#!/usr/bin/env node
/**
 * Browser end-to-end check, driven over the DevTools Protocol.
 *
 * Branded Google Chrome (127+) refuses `--load-extension`, so instead of
 * letting Chrome inject the content script, this injects the *built*
 * `dist/<target>/content.js` into a real page and asserts the DOM result.
 * That exercises core + guards + walker + styles + content in a real engine.
 *
 *   node scripts/e2e.mjs [chrome|firefox]
 *
 * Requires a local Chrome and a served test page; see site/README.md.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const target = process.argv[2] === "firefox" ? "firefox" : "chrome";
const CHROME =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9666;
const PAGE = process.env.E2E_URL ?? "http://localhost:4567/";

const contentJs = readFileSync(join(ROOT, "dist", target, "content.js"), "utf8");
const PAGE_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<style>body{font-family:Georgia,serif;max-width:640px;margin:40px auto;line-height:1.7;color:#14161a}</style>
</head><body>
<h1>Bionic reading end to end</h1>
<p id="p1">Bionic reading emphasizes the leading letters of every word so the eye has a stable place to land before it moves on to the next one. This paragraph proves the built content script runs in a real browser engine.</p>
<p id="p2">A second paragraph gives the walker more than one text node and checks that punctuation, commas, and the final period survive the transform exactly as written.</p>
<pre id="code"><code>const keep = "code must stay untouched";</code></pre>
<div id="edit" contenteditable="true">this editable region must stay untouched</div>
</body></html>`;

writeFileSync("/tmp/bp-e2e-page.html", PAGE_HTML);

let server;
let navUrl = "file:///tmp/bp-e2e-page.html";
if (typeof Bun !== "undefined") {
  server = Bun.serve({
    port: Number(new URL(PAGE).port || 4567),
    fetch() {
      return new Response(PAGE_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
    },
  });
  navUrl = PAGE;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const proc = spawn(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${PORT}`,
    "--user-data-dir=/tmp/bp-e2e-profile",
    "about:blank",
  ],
  { stdio: "ignore" },
);

async function pageWs() {
  for (let i = 0; i < 40; i += 1) {
    await sleep(250);
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      /* not up yet */
    }
  }
  return null;
}

let messageId = 0;
function rpc(sock, method, params = {}) {
  const id = ++messageId;
  return new Promise((resolve) => {
    const onMessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id === id) {
        sock.removeEventListener("message", onMessage);
        resolve(m);
      }
    };
    sock.addEventListener("message", onMessage);
    sock.send(JSON.stringify({ id, method, params }));
    setTimeout(() => resolve({ timeout: true }), 8000);
  });
}

async function main() {
  const ws = await pageWs();
  if (!ws) throw new Error("no page target from Chrome");
  const sock = new WebSocket(ws);
  await new Promise((res, rej) => {
    sock.addEventListener("open", res, { once: true });
    sock.addEventListener("error", rej, { once: true });
  });
  await rpc(sock, "Page.enable");
  await rpc(sock, "Runtime.enable");
  await rpc(sock, "Page.navigate", { url: navUrl });
  await sleep(1200);
  // Inject the built content script exactly as the browser would.
  await rpc(sock, "Runtime.evaluate", { expression: contentJs });
  await sleep(1500);

  const expression = `JSON.stringify({
    heads: document.querySelectorAll('b.bp-head').length,
    p1heads: document.querySelectorAll('#p1 b.bp-head').length,
    codeHeads: document.querySelectorAll('#code b.bp-head').length,
    editHeads: document.querySelectorAll('#edit b.bp-head').length,
    styleInjected: !!document.getElementById('bionic-page-style'),
    p1: document.getElementById('p1').textContent.slice(0, 46),
    p1html: document.getElementById('p1').innerHTML.slice(0, 110)
  })`;
  const res = await rpc(sock, "Runtime.evaluate", { expression, returnByValue: true });
  const value = res?.result?.result?.value;
  let parsed = {};
  try {
    parsed = typeof value === "string" ? JSON.parse(value) : value ?? {};
  } catch {
    parsed = { raw: value };
  }

  const shot = await rpc(sock, "Page.captureScreenshot", { format: "png" });
  const data = shot?.result?.data;
  if (data) {
    writeFileSync("/tmp/bp-e2e-result.png", Buffer.from(data, "base64"));
    console.log("screenshot -> /tmp/bp-e2e-result.png");
  }

  // Drive the toggle through the debug handle and verify a full restore.
  await rpc(sock, "Runtime.evaluate", { expression: "window.__bionic && window.__bionic.remove()" });
  await sleep(600);
  const afterRemove = await rpc(sock, "Runtime.evaluate", {
    expression: `JSON.stringify({
      heads: document.querySelectorAll('b.bp-head').length,
      tails: document.querySelectorAll('span.bp-tail').length,
      style: !!document.getElementById('bionic-page-style'),
      p1: document.getElementById('p1').textContent.slice(0, 80)
    })`,
    returnByValue: true,
  });
  let restored = {};
  try {
    restored = JSON.parse(afterRemove?.result?.result?.value ?? "{}");
  } catch {
    restored = {};
  }

  // Re-apply to prove it is not one-shot.
  await rpc(sock, "Runtime.evaluate", { expression: "window.__bionic && window.__bionic.apply()" });
  await sleep(600);
  const reApplied = await rpc(sock, "Runtime.evaluate", {
    expression: "document.querySelectorAll('b.bp-head').length",
    returnByValue: true,
  });

  const checks = [
    ["style injected", parsed.styleInjected === true],
    ["paragraphs transformed", parsed.heads > 0],
    ["p1 has heads", parsed.p1heads > 0],
    ["code untouched", parsed.codeHeads === 0],
    ["contenteditable untouched", parsed.editHeads === 0],
    ["text content preserved", typeof parsed.p1 === "string" && parsed.p1.startsWith("Bionic reading emphasizes")],
    ["toggle off removes every wrapper", restored.heads === 0 && restored.tails === 0],
    ["toggle off removes the stylesheet", restored.style === false],
    ["toggle off restores the original text", typeof restored.p1 === "string" && restored.p1.startsWith("Bionic reading emphasizes the leading")],
    ["toggle on re-applies", Number(reApplied?.result?.result?.value) > 0],
  ];
  let failed = 0;
  for (const [name, ok] of checks) {
    console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
    if (!ok) failed += 1;
  }
  console.log(JSON.stringify(parsed));
  sock.close();
  proc.kill();
  server?.stop?.(true);
  process.exitCode = failed > 0 ? 1 : 0;
}

main().catch((err) => {
  console.error("e2e error:", err?.message ?? err);
  proc.kill();
  process.exitCode = 1;
});
