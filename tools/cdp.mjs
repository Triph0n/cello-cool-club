// Zero-dependency Chrome DevTools Protocol driver (Node 22+ built-in WebSocket).
// Oči = pixelshot/Page.captureScreenshot; ruce = Input.* + Runtime.evaluate.
import fs from "node:fs/promises";

const PORT = process.env.CDP_PORT || 9222;
const BASE = `http://127.0.0.1:${PORT}`;

async function listTargets() {
  const r = await fetch(`${BASE}/json`);
  return r.json();
}

// Pick a page target (optionally matching a URL substring), else first page.
async function pickTarget(match) {
  const targets = (await listTargets()).filter((t) => t.type === "page");
  if (!targets.length) throw new Error("Žádný page target — běží Chrome s --remote-debugging-port?");
  if (match) {
    const hit = targets.find((t) => (t.url || "").includes(match));
    if (hit) return hit;
  }
  return targets[0];
}

export class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.events = []; }

  static async attach(match) {
    const target = await pickTarget(match);
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    const cdp = new CDP(ws);
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && cdp.pending.has(msg.id)) {
        const { resolve, reject } = cdp.pending.get(msg.id);
        cdp.pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      } else if (msg.method) {
        cdp.events.push(msg);
      }
    };
    cdp.target = target;
    return cdp;
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); reject(new Error(`timeout ${method}`)); } }, 30000);
    });
  }

  async navigate(url) {
    await this.send("Page.enable");
    await this.send("Page.navigate", { url });
    await this.waitLoad();
  }

  async waitLoad(ms = 2500) { await new Promise((r) => setTimeout(r, ms)); }

  eval(expression) {
    return this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })
      .then((r) => r.result?.value);
  }

  async click(x, y) {
    await this.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
    await this.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
  }

  async type(text) {
    for (const ch of text) {
      await this.send("Input.dispatchKeyEvent", { type: "keyDown", text: ch });
      await this.send("Input.dispatchKeyEvent", { type: "keyUp", text: ch });
    }
  }

  async key(keyCode, code, key) {
    await this.send("Input.dispatchKeyEvent", { type: "keyDown", windowsVirtualKeyCode: keyCode, code, key });
    await this.send("Input.dispatchKeyEvent", { type: "keyUp", windowsVirtualKeyCode: keyCode, code, key });
  }

  async screenshot(pathOut) {
    const { data } = await this.send("Page.captureScreenshot", { format: "png" });
    await fs.writeFile(pathOut, Buffer.from(data, "base64"));
    return pathOut;
  }

  close() { this.ws.close(); }
}

// --- CLI proof ---
const invoked = (process.argv[1] || "").replaceAll("\\", "/").toLowerCase();
if (invoked.endsWith("cdp.mjs")) {
  try {
    const cmd = process.argv[2];
    const cdp = await CDP.attach(process.env.CDP_MATCH);
    if (cmd === "title") { await cdp.navigate(process.argv[3] || "https://example.com"); console.log("TITLE:", await cdp.eval("document.title")); }
    else if (cmd === "shot") { console.log("SAVED:", await cdp.screenshot(process.argv[3])); }
    else if (cmd === "eval") { console.log(JSON.stringify(await cdp.eval(process.argv[3]))); }
    else console.log("Attached to:", cdp.target.url);
    cdp.close();
  } catch (e) {
    console.error("CDP ERROR:", e.message);
    process.exit(1);
  }
}
