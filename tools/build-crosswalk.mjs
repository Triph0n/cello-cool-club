// Postaví data/crosswalk.json — JEDNO kanonické číslo pro celý projekt.
//
//   node tools/build-crosswalk.mjs            # náhled + report
//   node tools/build-crosswalk.mjs --write    # zapíše data/crosswalk.json
//
// Kanonické číslo = pořadí v assets/text/AllEnglishTexts.md (0001–1096).
// Páruje se OTISKEM TEXTU, ne názvem: názvy karet jsou promíchané jazykově
// (216 karet má FR/CZ titulek) a 25 dvojic básní sdílí název při různém textu.
//
// Crosswalk se staví jednou a pak se ZMRAZÍ — existující záznamy se nikdy
// nepřepisují, jen se doplňují nové. Tím párování nemůže ujet.

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\//, "")), "..");
const OUT = path.join(ROOT, "data", "crosswalk.json");
const WRITE = process.argv.includes("--write");

const words = (s) =>
  String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ").split(/\s+/).filter(Boolean);
const fingerprint = (lines) => words(Array.isArray(lines) ? lines.join(" ") : lines).join("").slice(0, 400);
const dice = (a, b) => {
  const A = new Set(a), B = new Set(b);
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return (2 * inter) / (A.size + B.size || 1);
};

// --- master: 1096 anglických textů = kanonická řada ------------------------
const md = fs.readFileSync(path.join(ROOT, "assets/text/AllEnglishTexts.md"), "utf8").replace(/\r\n/g, "\n");
const marks = [...md.matchAll(/^##\s+(\d+)\.\s+(.+)$/gm)];
const master = marks.map((m, i) => {
  const body = md.slice(m.index + m[0].length, i + 1 < marks.length ? marks[i + 1].index : md.length);
  const lines = body.split("\n").filter((l) => l.trim() !== "" && l.trim() !== "---");
  return {
    canon: String(m[1]).padStart(4, "0"),
    masterNum: m[1],
    title: m[2].trim(),
    fp: fingerprint(lines),
    words: words(lines.join(" ")),
  };
});
const byFp = new Map();
for (const p of master) if (!byFp.has(p.fp)) byFp.set(p.fp, p);

// najdi kanonickou položku pro daný text: přesný otisk -> jinak nejpodobnější
function findCanon(textLines, minScore = 0.82) {
  const fp = fingerprint(textLines);
  if (!fp) return null;
  const exact = byFp.get(fp);
  if (exact) return { hit: exact, score: 1, how: "text" };
  const w = words(Array.isArray(textLines) ? textLines.join(" ") : textLines);
  if (w.length < 8) return null;
  let best = null, bestScore = 0;
  for (const p of master) {
    const s = dice(w, p.words);
    if (s > bestScore) { bestScore = s; best = p; }
  }
  return bestScore >= minScore ? { hit: best, score: bestScore, how: "podobnost" } : null;
}

// --- zdroje ----------------------------------------------------------------
const cards = JSON.parse(fs.readFileSync(path.join(ROOT, "engine/data/cards.json"), "utf8"));

const poemsDir = path.join(ROOT, "poems");
const poemFiles = fs.readdirSync(poemsDir).filter((f) => /^\d{3}-.*\.md$/.test(f));

const posterDir = path.join(ROOT, "assets/posters");
const postersByNum = new Map();
if (fs.existsSync(posterDir)) {
  for (const f of fs.readdirSync(posterDir).filter((x) => /\.(png|jpe?g|webp)$/i.test(x))) {
    const n = f.match(/^(\d+)-/);
    if (n && !postersByNum.has(n[1])) postersByNum.set(n[1], f);
  }
}

// --- sestavení -------------------------------------------------------------
const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { entries: {} };
const entries = {};
for (const p of master) {
  entries[p.canon] = { canon: p.canon, title: p.title, masterNum: p.masterNum, ...(prev.entries?.[p.canon] || {}) };
  entries[p.canon].title = p.title;   // název vždy z masteru (anglicky)
}

const report = { poemsOk: 0, poemsMiss: [], cardsText: 0, cardsFuzzy: [], cardsMiss: [], posters: 0 };

// poems/NNN-slug.md  -> kanonické (přes anglickou sekci); poster NNN sdílí totéž číslo
for (const f of poemFiles) {
  const raw = fs.readFileSync(path.join(poemsDir, f), "utf8").replace(/\r\n/g, "\n");
  const sec = raw.match(/##\s+English\s+—\s+.+\n([\s\S]*?)(?=\n---|\n##\s|$)/);
  const num = f.slice(0, 3);
  const found = sec ? findCanon(sec[1].split("\n").filter((l) => l.trim() !== "")) : null;
  if (!found) { report.poemsMiss.push(f); continue; }
  report.poemsOk++;
  const e = entries[found.hit.canon];
  if (!e.poemFile) e.poemFile = f;
  if (!e.poemNumber) e.poemNumber = num;
  if (!e.poster && postersByNum.has(num)) { e.poster = postersByNum.get(num); report.posters++; }
}

// karty -> kanonické (přes poemText)
for (const c of cards) {
  const found = findCanon(c.poemText);
  if (!found) { report.cardsMiss.push(`${c.id} ${c.title}`); continue; }
  if (found.how === "text") report.cardsText++;
  else report.cardsFuzzy.push(`${c.id} ${c.title} -> ${found.hit.canon} ${found.hit.title} (${found.score.toFixed(2)})`);
  const e = entries[found.hit.canon];
  if (!e.cardId) {
    e.cardId = c.id;
    if (c.audio) e.audio = path.basename(String(c.audio).replaceAll("\\", "/"));
    if (String(c.title).trim() !== found.hit.title) e.cardTitleLegacy = c.title;
  }
}

const filled = Object.values(entries).filter((e) => e.cardId || e.poemFile || e.poster);
console.log(`kanonických položek: ${master.length}`);
console.log(`  s vazbou na něco:  ${filled.length}`);
console.log(`  s kartou:          ${Object.values(entries).filter((e) => e.cardId).length}`);
console.log(`  s audiem:          ${Object.values(entries).filter((e) => e.audio).length}`);
console.log(`  s plakátem:        ${Object.values(entries).filter((e) => e.poster).length}`);
console.log(`  se souborem básně: ${Object.values(entries).filter((e) => e.poemFile).length}`);
console.log(`\nkarty spárované přesným textem: ${report.cardsText}`);
console.log(`karty spárované podobností (${report.cardsFuzzy.length}) — starší revize překladu:`);
report.cardsFuzzy.slice(0, 10).forEach((r) => console.log("  " + r));
console.log(`\nkarty BEZ protějšku v masteru (${report.cardsMiss.length}):`);
report.cardsMiss.slice(0, 12).forEach((r) => console.log("  " + r));
console.log(`\nsoubory poems/ bez protějšku (${report.poemsMiss.length}): ${report.poemsMiss.join(", ") || "—"}`);

if (WRITE) {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  if (fs.existsSync(OUT)) fs.copyFileSync(OUT, OUT + ".bak");
  fs.writeFileSync(OUT, JSON.stringify({
    meta: {
      note: "Kanonické číslo = pořadí v assets/text/AllEnglishTexts.md. Páruje se OTISKEM TEXTU, " +
            "nikdy názvem. Existující záznamy se při přestavbě NEPŘEPISUJÍ — crosswalk je zmrazený. " +
            "Soubory se nepřejmenovávají; tady je jen zapsáno, co k čemu patří.",
      generatedAt: new Date().toISOString().slice(0, 10),
      counts: {
        kanonickych: master.length,
        sKartou: Object.values(entries).filter((e) => e.cardId).length,
        sAudiem: Object.values(entries).filter((e) => e.audio).length,
        sPlakatem: Object.values(entries).filter((e) => e.poster).length
      }
    },
    entries
  }, null, 2) + "\n", "utf8");
  console.log(`\nzapsáno: ${OUT}`);
} else {
  console.log("\nNÁHLED — nic nezapsáno. Spusť s --write.");
}
