import fs from "node:fs"; import path from "node:path";
import sharp from "file:///C:/Users/Vladimir/Documents/CelloCoolClub/engine/node_modules/sharp/dist/index.cjs";
const [out, dir] = process.argv.slice(2);
const files = fs.readdirSync(dir).filter(f => f.endsWith(".png")).sort();
const W = 420, H = 300, COLS = 3;
const comps = [];
for (let i = 0; i < files.length; i++) {
  const buf = await sharp(path.join(dir, files[i])).resize(W, H, { fit: "contain", background: "#222" }).png().toBuffer();
  comps.push({ input: buf, left: (i % COLS) * W, top: Math.floor(i / COLS) * H });
}
await sharp({ create: { width: COLS * W, height: Math.ceil(files.length / COLS) * H, channels: 3, background: "#222222" } })
  .composite(comps).png().toFile(out);
console.log("written", out, files.join(" "));
