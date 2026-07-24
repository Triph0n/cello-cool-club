// Generate an image in gemini.google.com via CDP and save it.
// Usage: node gemini-gen.mjs <promptFile> <outPng>
import fs from "node:fs/promises";
import { CDP } from "file:///C:/Users/Vladimir/.claude/skills/suno-generator/scripts/cdp.mjs";

const [promptFile, outPng] = process.argv.slice(2);
const prompt = await fs.readFile(promptFile, "utf8");

const cdp = await CDP.attach("gemini.google.com");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const countBig = () => cdp.eval(
  `Array.from(document.querySelectorAll('img')).filter(i => i.naturalWidth > 300).length`
);
const before = await countBig();

// focus the editor with a real click
const rect = await cdp.eval(`(() => {
  const el = document.querySelector('div[contenteditable="true"]');
  if (!el) return null;
  el.scrollIntoView({block:'center'});
  const r = el.getBoundingClientRect();
  return { x: r.x + r.width/2, y: r.y + r.height/2 };
})()`);
if (!rect) { console.error("NO_EDITOR"); process.exit(1); }
await cdp.click(rect.x, rect.y);
await sleep(300);

await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", windowsVirtualKeyCode: 65, code: "KeyA", key: "a", modifiers: 2 });
await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", windowsVirtualKeyCode: 65, code: "KeyA", key: "a", modifiers: 2 });
await cdp.key(46, "Delete", "Delete");
await cdp.send("Input.insertText", { text: prompt.trim() });
await sleep(500);

const typed = await cdp.eval(`document.querySelector('div[contenteditable="true"]').textContent.length`);
console.log("typed chars:", typed);
if (!typed || typed < 50) { console.error("TYPE_FAIL"); process.exit(1); }

await cdp.key(13, "Enter", "Enter");
console.log("submitted, waiting for image (before=" + before + ")...");

// poll up to 6 minutes; page can be busy, so tolerate eval failures
let ok = false;
for (let i = 0; i < 120; i++) {
  await sleep(3000);
  try {
    const n = await countBig();
    if (typeof n === "number" && n > before) { ok = true; break; }
  } catch { /* page busy */ }
}
if (!ok) { console.error("NO_IMAGE_AFTER_TIMEOUT"); process.exit(2); }
await sleep(3000); // let it finish rendering

const len = await cdp.eval(`(() => {
  const imgs = Array.from(document.querySelectorAll('img')).filter(i => i.naturalWidth > 300);
  const i = imgs[imgs.length - 1];
  const c = document.createElement('canvas');
  c.width = i.naturalWidth; c.height = i.naturalHeight;
  c.getContext('2d').drawImage(i, 0, 0);
  window.__b64 = c.toDataURL('image/png').split(',')[1];
  return window.__b64.length;
})()`);
if (!len || typeof len !== "number") { console.error("ENCODE_FAIL"); process.exit(3); }
let b64 = "";
const CHUNK = 500000;
for (let off = 0; off < len; off += CHUNK) {
  b64 += await cdp.eval(`window.__b64.slice(${off}, ${off + CHUNK})`);
}
await fs.writeFile(outPng, Buffer.from(b64, "base64"));
console.log("SAVED:", outPng, Math.round(len * 0.75 / 1024) + " KB");
cdp.close();
