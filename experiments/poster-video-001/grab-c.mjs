import fs from "node:fs/promises";
import { CDP } from "file:///C:/Users/Vladimir/.claude/skills/suno-generator/scripts/cdp.mjs";
const outPng = process.argv[2];
const cdp = await CDP.attach("gemini.google.com");
const len = await cdp.eval(`(() => {
  let imgs = Array.from(document.querySelectorAll('model-response img, generated-image img')).filter(i => i.naturalWidth > 300);
  const i = imgs[imgs.length - 1];
  if (!i) return null;
  const c = document.createElement('canvas');
  c.width = i.naturalWidth; c.height = i.naturalHeight;
  c.getContext('2d').drawImage(i, 0, 0);
  window.__b64 = c.toDataURL('image/png').split(',')[1];
  return window.__b64.length;
})()`);
if (!len) { console.error("NO_IMAGE"); process.exit(1); }
let b64 = "";
for (let off = 0; off < len; off += 500000) {
  b64 += await cdp.eval(`window.__b64.slice(${off}, ${off + 500000})`);
}
await fs.writeFile(outPng, Buffer.from(b64, "base64"));
console.log("SAVED:", outPng, Math.round(len * 0.75 / 1024) + " KB");
cdp.close();
