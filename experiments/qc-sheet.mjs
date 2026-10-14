// Kontaktní list plakátů: mřížka 5 karet × 3 sloty (A/B/C) do jednoho PNG.
// Usage: node qc-sheet.mjs <out.png> <cardDir1> ... (max 5 karet na list)
import fs from "node:fs";
import path from "node:path";
import sharp from "file:///C:/Users/Vladimir/Documents/CelloCoolClub/engine/node_modules/sharp/dist/index.cjs";

const [out, ...dirs] = process.argv.slice(2);
const W = 300, H = 440;
const comps = [];
for (let i = 0; i < dirs.length; i++) {
  for (let j = 0; j < 3; j++) {
    const p = path.join(dirs[i], `poster-${"ABC"[j]}.png`);
    if (!fs.existsSync(p)) continue;
    const buf = await sharp(p).resize(W, H, { fit: "contain", background: "#fff" }).png().toBuffer();
    comps.push({ input: buf, left: j * W, top: i * H });
  }
}
await sharp({ create: { width: 3 * W, height: dirs.length * H, channels: 3, background: "#ffffff" } })
  .composite(comps).png().toFile(out);
console.log("written", out, dirs.map((d) => path.basename(d).slice(0, 3)).join(","));
