// Nasadí kartám ANGLICKÉ názvy podle crosswalku (master = AllEnglishTexts.md).
//
//   node tools/apply-english-titles.mjs           # náhled
//   node tools/apply-english-titles.mjs --write   # zapíše cards.json + crosswalk.displayTitle
//
// Mění POUZE card.title. Slug, cesty k audiu a obrázkům zůstávají — soubory se
// nepřejmenovávají (to je celý smysl crosswalku). Původní název jde do card.titleLegacy.

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\//, "")), "..");
const CW = path.join(ROOT, "data/crosswalk.json");
const CARDS = path.join(ROOT, "engine/data/cards.json");
const WRITE = process.argv.includes("--write");

// master má 837 z 1096 názvů VERZÁLKAMI — pro zobrazení je vysázíme jako titulek
const SMALL = new Set(["a","an","and","as","at","but","by","for","from","in","into","nor","of","on",
  "or","over","the","to","up","with","without","that","than","upon","per","via"]);
function titleCase(s) {
  if (s !== s.toUpperCase()) return s;           // už je smíšený -> nechat být
  const parts = s.toLowerCase().split(/(\s+|-|—|\/)/);
  let wordIdx = 0;
  const words = parts.filter((p) => /\S/.test(p) && !/^(\s+|-|—|\/)$/.test(p));
  const last = words.length - 1;
  return parts.map((p) => {
    if (!/\S/.test(p) || /^(-|—|\/)$/.test(p)) return p;
    const i = wordIdx++;
    const bare = p.replace(/[^a-z']/g, "");
    if (i !== 0 && i !== last && SMALL.has(bare)) return p;
    return p.replace(/^([a-z])/, (m) => m.toUpperCase())
            .replace(/^'([a-z])/, (m, c) => "'" + c);
  }).join("");
}

const cw = JSON.parse(fs.readFileSync(CW, "utf8"));
const cards = JSON.parse(fs.readFileSync(CARDS, "utf8"));
const byId = new Map(cards.map((c) => [c.id, c]));

const changes = [];
const linked = new Set();
for (const e of Object.values(cw.entries)) {
  e.displayTitle = titleCase(e.title);
  if (!e.cardId) continue;
  linked.add(e.cardId);
  const card = byId.get(e.cardId);
  if (!card) continue;
  if (String(card.title).trim() === e.displayTitle) continue;
  changes.push({ id: card.id, from: card.title, to: e.displayTitle, card });
}

// Karty mimo crosswalk: druhé karty k téže básni (jiný jazyk titulku, slot už zabraný).
// Dostanou taky anglický název a označí se jako duplicita — ať platí „vše anglicky".
const words = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9\s]+/g, " ").split(/\s+/).filter(Boolean);
const fpOf = (l) => words(Array.isArray(l) ? l.join(" ") : l).join("").slice(0, 400);
const dice = (a, b) => {
  const A = new Set(a), B = new Set(b);
  let i = 0; for (const w of A) if (B.has(w)) i++;
  return (2 * i) / (A.size + B.size || 1);
};
// stejná logika jako build-crosswalk: přesný otisk masteru, jinak podobnost
const md = fs.readFileSync(path.join(ROOT, "assets/text/AllEnglishTexts.md"), "utf8").replace(/\r\n/g, "\n");
const marks = [...md.matchAll(/^##\s+(\d+)\.\s+(.+)$/gm)];
const master = marks.map((m, i) => {
  const body = md.slice(m.index + m[0].length, i + 1 < marks.length ? marks[i + 1].index : md.length);
  const lines = body.split("\n").filter((l) => l.trim() !== "" && l.trim() !== "---");
  return { canon: String(m[1]).padStart(4, "0"), fp: fpOf(lines), words: words(lines.join(" ")) };
});
const masterByFp = new Map(); master.forEach((p) => { if (!masterByFp.has(p.fp)) masterByFp.set(p.fp, p); });

const dupes = [];
for (const c of cards) {
  if (linked.has(c.id)) continue;
  const fp = fpOf(c.poemText);
  if (!fp) continue;
  let m = masterByFp.get(fp);
  if (!m) {
    const w = words((c.poemText || []).join(" "));
    if (w.length < 8) continue;
    let best = null, bs = 0;
    for (const p of master) { const s = dice(w, p.words); if (s > bs) { bs = s; best = p; } }
    if (bs < 0.82) continue;
    m = best;
  }
  const hit = cw.entries[m.canon];
  if (!hit || !hit.cardId || hit.cardId === c.id) continue;
  dupes.push({ id: c.id, from: c.title, to: hit.displayTitle, canon: hit.canon, of: hit.cardId, card: c });
  if (String(c.title).trim() !== hit.displayTitle) changes.push({ id: c.id, from: c.title, to: hit.displayTitle, card: c, dup: hit });
}

// rozdělit na skutečné přejmenování vs. jen velikost písmen
const key = (s) => String(s).toUpperCase().replace(/[^A-Z0-9]/g, "");
const real = changes.filter((c) => key(c.from) !== key(c.to));
const caseOnly = changes.filter((c) => key(c.from) === key(c.to));

console.log(`karet ke změně názvu: ${changes.length}`);
console.log(`  skutečně jiný název (FR/CZ -> EN): ${real.length}`);
console.log(`  jen sjednocení velikosti písmen:   ${caseOnly.length}`);
console.log(`\nukázka skutečných přejmenování:`);
real.slice(0, 10).forEach((c) => console.log(`  ${c.id}  "${c.from}"  ->  "${c.to}"`));

console.log(`\nduplicitní karty k téže básni (${dupes.length}) — druhá karta, slot už zabraný:`);
dupes.slice(0, 10).forEach((d) =>
  console.log(`  ${d.id} "${d.from}" = duplicita karty ${d.of} (kanon ${d.canon})` +
    `${d.card.audio ? "  [POZOR: má audio]" : "  [draft, bez audia]"}`));

if (WRITE) {
  for (const c of changes) {
    if (!c.card.titleLegacy && key(c.from) !== key(c.to)) c.card.titleLegacy = c.from;
    c.card.title = c.to;
    if (c.dup) c.card.duplicateOfCard = c.dup.cardId;
  }
  fs.copyFileSync(CARDS, CARDS + ".bak-english-titles");
  fs.writeFileSync(CARDS, JSON.stringify(cards, null, 2) + "\n", "utf8");
  fs.writeFileSync(CW, JSON.stringify(cw, null, 2) + "\n", "utf8");
  console.log(`\nzapsáno: cards.json (${changes.length} názvů) + crosswalk.displayTitle`);
} else {
  console.log("\nNÁHLED — nic nezapsáno. Spusť s --write.");
}
