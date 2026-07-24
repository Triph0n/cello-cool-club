// Save the last/largest generated image currently in the Gemini conversation.
// Usage: node grab-last.mjs <outPng>
import fs from "node:fs/promises";
import { CDP } from "file:///C:/Users/Vladimir/.claude/skills/suno-generator/scripts/cdp.mjs";

const outPng = process.argv[2];
const cdp = await CDP.attach("gemini.google.com");

const info = await cdp.eval(`(() => {
  const imgs = Array.from(document.querySelectorAll('img'))
    .map(i => ({ src: i.src, w: i.naturalWidth, h: i.naturalHeight }))
    .filter(i => i.w > 300);
  return imgs;
})()`);
console.log("candidates:", JSON.stringify(info?.map(i => ({ w: i.w, h: i.h, src: i.src.slice(0, 60) })), null, 1));
if (!info || !info.length) { console.error("NO_IMG"); process.exit(1); }
const pick = info[info.length - 1];

const len = await cdp.eval(`(() => {
  const imgs = Array.from(document.querySelectorAll('img')).filter(i => i.naturalWidth > 300);
  const i = imgs[imgs.length - 1];
  const c = document.createElement('canvas');
  c.width = i.naturalWidth; c.height = i.naturalHeight;
  c.getContext('2d').drawImage(i, 0, 0);
  window.__b64 = c.toDataURL('image/png').split(',')[1];
  return window.__b64.length;
})()`);
console.log("b64 length:", len);
let b64 = "";
const CHUNK = 500000;
for (let off = 0; off < len; off += CHUNK) {
  b64 += await cdp.eval(`window.__b64.slice(${off}, ${off + CHUNK})`);
}
if (!b64 || b64.length < 10000) { console.error("FETCH_FAIL len=" + (b64 ? b64.length : 0)); process.exit(2); }
await fs.writeFile(outPng, Buffer.from(b64, "base64"));
console.log("SAVED:", outPng, pick.w + "x" + pick.h, Math.round(b64.length * 0.75 / 1024) + " KB");
cdp.close();
