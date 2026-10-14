// Sequential poster run for the CelloCoolClubLive deska set: for every card dir and every
// poster slot, open a fresh Gemini chat, generate, then wipe the paper margin (signature /
// edition number / watermark star). Logs one line per attempt so progress is greppable.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const CARDS_DIR = "C:/Users/Vladimir/Documents/CelloCoolClub/experiments/cards";
const REF = "C:/Users/Vladimir/Documents/CelloCoolClub/assets/poster-references";
const FACE = "C:/Users/Vladimir/Documents/CelloCoolClub/assets/poster-face-references";
const SKILL = "C:/Users/Vladimir/.claude/skills/born-poster/scripts";
const LOG = process.argv[2] || "run-posters.log";

const REFS = fs.readdirSync(REF).filter((f) => /\.(jpg|png)$/i.test(f)).map((f) => path.join(REF, f));

const ORDER = [
  "007-the-revolt-of-the-garden-statues",
  "009-the-revolt-of-the-punctuation-marks",
  "012-the-ministry-of-normality",
  "014-the-thief-of-voices",
  "018-the-dialogue-of-hand-and-glove",
  "019-the-revolt-of-the-musical-notes",
  "025-the-song-of-the-chewing-gum",
  "026-the-prostitute-s-last-customer",
  "029-the-revolt-of-the-fairy-tales",
  "035-the-song-of-the-chipped-cup",
];

const log = (s) => {
  const line = `[${new Date().toISOString().slice(11, 19)}] ${s}`;
  fs.appendFileSync(LOG, line + "\n");
  console.log(line);
};

const run = (args, timeout) =>
  execFileSync("node", args, { encoding: "utf8", timeout, stdio: ["ignore", "pipe", "pipe"] });

let done = 0, failed = [];
for (const dir of ORDER) {
  const d = path.join(CARDS_DIR, dir);
  const faces = fs.readFileSync(path.join(d, "faces.txt"), "utf8").trim().split(/\r?\n/)
    .map((f) => path.join(FACE, f + ".png"));

  for (const slot of ["A", "B", "C"]) {
    const out = path.join(d, `poster-${slot}.png`);
    if (fs.existsSync(out)) { log(`skip ${dir} ${slot} (exists)`); continue; }

    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      try {
        run([path.join(SKILL, "newchat.mjs")], 120000);
      } catch (e) {
        log(`  newchat failed (${dir} ${slot} try ${attempt}): ${String(e.stderr || e.message).trim().slice(0, 120)}`);
        continue;
      }
      try {
        // poster A carries humans / faces grammar; B and C are object-only seals, but the
        // face crops are attached to every generation anyway (born-poster iron rule).
        const o = run(
          [path.join(SKILL, "born-generate.mjs"), path.join(d, `prompt-${slot}.txt`), out, ...REFS, ...faces],
          600000
        );
        ok = /SAVED:/.test(o) && fs.existsSync(out);
        if (!ok) log(`  gen returned no SAVED (${dir} ${slot} try ${attempt}): ${o.trim().split("\n").pop()}`);
      } catch (e) {
        const msg = String(e.stdout || "") + String(e.stderr || e.message || "");
        log(`  gen failed (${dir} ${slot} try ${attempt}): ${msg.trim().split("\n").pop().slice(0, 140)}`);
      }
    }

    if (!ok) { failed.push(`${dir}/${slot}`); log(`FAIL ${dir} ${slot}`); continue; }

    try {
      const c = run([path.join(SKILL, "clean-margin.mjs"), out], 120000);
      log(`OK ${dir} ${slot} — ${c.trim()}`);
    } catch (e) {
      log(`OK ${dir} ${slot} — margin clean FAILED: ${String(e.stderr || e.message).trim().slice(0, 120)}`);
    }
    done++;
  }
}
log(`DONE generated=${done} failed=${failed.length} ${failed.join(" ")}`);
