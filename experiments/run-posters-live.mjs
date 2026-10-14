// Dávkové generování plakátů A/B/C ve stylu Borna pro kolekci karet.
// Usage: node run-posters-live.mjs <cardsRoot> [<cardsRoot2> ...]
// Přeskočí sloty, které už mají poster-X.png. Po 3 chybách po sobě končí
// (typicky denní limit obrázků v Gemini).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const SKILL = "C:/Users/Vladimir/.claude/skills/born-poster/scripts";
const REF = "C:/Users/Vladimir/Documents/CelloCoolClub/assets/poster-references";
const FACE = "C:/Users/Vladimir/Documents/CelloCoolClub/assets/poster-face-references";
const COMPO = [
  `${REF}/Born - Pohlednice z Taiwanu.jpg`,
  `${REF}/Born - Vecery na Loire.jpg`,
  `${REF}/Born - Vlivy osmanske benatske a recke na Peloponesu (2012).jpg`,
];

const roots = process.argv.slice(2);
if (!roots.length) { console.error("Usage: node run-posters-live.mjs <cardsRoot> [...]"); process.exit(2); }

const run = (args) => spawnSync("node", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

let fails = 0, done = 0;
outer:
for (const root of roots) {
  const dirs = fs.readdirSync(root).filter((d) => fs.statSync(path.join(root, d)).isDirectory()).sort();
  for (const d of dirs) {
    const cd = path.join(root, d);
    const faces = fs.existsSync(path.join(cd, "faces.txt"))
      ? fs.readFileSync(path.join(cd, "faces.txt"), "utf8").trim().split(/\r?\n/).map((f) => `${FACE}/${f}.png`)
      : [];
    for (const slot of ["A", "B", "C"]) {
      const out = path.join(cd, `poster-${slot}.png`);
      if (fs.existsSync(out)) continue;
      const prompt = path.join(cd, `prompt-${slot}.txt`);
      if (!fs.existsSync(prompt)) { console.log(`SKIP ${d} ${slot} (no prompt)`); continue; }

      run([`${SKILL}/newchat.mjs`]);
      const r = run([`${SKILL}/born-generate.mjs`, prompt, out, ...COMPO, ...faces]);
      const tail = (r.stdout + r.stderr).trim().split(/\r?\n/).slice(-2).join(" / ");
      if (r.status === 0 && fs.existsSync(out)) {
        run([`${SKILL}/clean-margin.mjs`, out]);
        const kb = Math.round(fs.statSync(out).size / 1024);
        console.log(`OK   ${d} ${slot}  ${kb} KB`);
        fails = 0; done++;
      } else {
        console.log(`FAIL ${d} ${slot}  :: ${tail}`);
        fails++;
        if (fails >= 3) { console.log("STOP — 3 chyby po sobe (nejspis denni limit obrazku)"); break outer; }
      }
    }
  }
}
console.log(`hotovo: ${done} plakatu`);
