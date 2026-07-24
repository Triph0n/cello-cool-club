// Postaví dashboard/index.json ze zdrojů projektu.
//
//   node tools/build-dashboard-index.mjs            # náhled (nic nezapíše)
//   node tools/build-dashboard-index.mjs --write    # zapíše dashboard/index.json
//
// Zdroje:  assets/text/AllEnglishTexts.md (1096 textů)  = kostra
//          engine/data/cards.json                       = Suno prompt, audio, status
//          assets/posters/, assets/posters-hires/       = plakáty (párují se SLUGEM, ne číslem —
//                                                         plakáty číslují sbírku poems/, ne AllEnglishTexts)
// Ruční obohacení (poster.prompt/style/references, sunoUrl, varianta B) se ZACHOVÁVÁ
// z existujícího index.json podle názvu básně. Generátor ho nikdy nepřepíše.

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\//, "")), "..");
const OUT = path.join(ROOT, "dashboard", "index.json");
const WRITE = process.argv.includes("--write");

const norm = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
const slugify = (s) =>
  String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// --- 1. kostra: 1096 anglických textů -------------------------------------
const md = fs.readFileSync(path.join(ROOT, "assets/text/AllEnglishTexts.md"), "utf8").replace(/\r\n/g, "\n");
const marks = [...md.matchAll(/^##\s+(\d+)\.\s+(.+)$/gm)];
if (marks.length === 0) throw new Error("V AllEnglishTexts.md nejsou nadpisy '## NNN. Název'.");

const poems = marks.map((m, i) => {
  const body = md.slice(m.index + m[0].length, i + 1 < marks.length ? marks[i + 1].index : md.length);
  const lines = body.split("\n");
  while (lines.length && lines[0].trim() === "") lines.shift();
  while (lines.length && lines.at(-1).trim() === "") lines.pop();
  if (lines.at(-1)?.trim() === "---") lines.pop();
  while (lines.length && lines.at(-1).trim() === "") lines.pop();
  return { num: m[1], title: m[2].trim(), text: lines };
});

// --- 2. karty + CROSSWALK (jediný zdroj párování) ---------------------------
// Párování NIKDY podle názvu: názvy karet byly promíchané jazykově a 25 dvojic
// básní sdílí název. Crosswalk je postavený otiskem textu a zmrazený.
const cards = JSON.parse(fs.readFileSync(path.join(ROOT, "engine/data/cards.json"), "utf8"));
const cardById = new Map(cards.map((c) => [c.id, c]));
const cwPath = path.join(ROOT, "data/crosswalk.json");
if (!fs.existsSync(cwPath)) {
  throw new Error("Chybí data/crosswalk.json — postav ho: node tools/build-crosswalk.mjs --write");
}
const crosswalk = JSON.parse(fs.readFileSync(cwPath, "utf8")).entries;
const cwByNum = new Map(Object.values(crosswalk).map((e) => [String(e.masterNum), e]));

// --- 3. plakáty na disku (slug -> soubor) -----------------------------------
const listSlugs = (dir) => {
  const p = path.join(ROOT, dir);
  if (!fs.existsSync(p)) return new Map();
  const m = new Map();
  for (const f of fs.readdirSync(p).filter((x) => /\.(png|jpe?g|webp)$/i.test(x))) {
    const slug = f.replace(/^\d+[-_]/, "").replace(/\.\w+$/, "");
    if (!m.has(slug)) m.set(slug, f);
  }
  return m;
};
const posters = listSlugs("assets/posters");
const postersHi = listSlugs("assets/posters-hires");

// --- 4. ruční obohacení z existujícího indexu -------------------------------
let prevByTitle = new Map();
if (fs.existsSync(OUT)) {
  try {
    const prev = JSON.parse(fs.readFileSync(OUT, "utf8"));
    for (const p of prev.poems || []) prevByTitle.set(norm(p.title), p);
  } catch { /* poškozený index ignorujeme, postavíme znovu */ }
}

// --- 5. sestavení -----------------------------------------------------------
const stat = { total: poems.length, card: 0, suno: 0, audio: 0, poster: 0, keptManual: 0, ambiguous: 0 };

const out = poems.map((p) => {
  // veškeré napojení bere z crosswalku podle kanonického čísla
  const cw = cwByNum.get(String(p.num)) || {};
  const card = cw.cardId ? cardById.get(cw.cardId) : undefined;
  const prev = prevByTitle.get(norm(p.title));
  const title = cw.displayTitle || p.title;
  const slug = slugify(title);
  if (card) stat.card++;

  // Suno prompt: ruční má přednost, jinak z karty
  const sunoPrompt = prev?.suno?.prompt || card?.sunoPrompt || "";
  if (sunoPrompt) stat.suno++;

  // audio: zachovat ruční varianty (A/B), jinak jediné audio z karty jako varianta A
  let audio = prev?.audio;
  if (!audio?.variantA?.file && !audio?.variantB?.file) {
    const file = card?.audio ? path.basename(String(card.audio).replaceAll("\\", "/")) : "";
    audio = file ? { variantA: { file, label: "Suno A" }, variantB: { file: "", label: "Suno B" } } : null;
  }
  if (audio?.variantA?.file || audio?.variantB?.file) stat.audio++;

  // poster: soubor bere z crosswalku (číslo sbírky poems/), ruční prompt/reference se zachovají
  let poster = null;
  const pf = cw.poster;
  if (prev?.poster && (prev.poster.prompt || prev.poster.references?.length)) {
    poster = { ...prev.poster };
    stat.keptManual++;
    if (pf) poster.file = `/ccc-posters/${pf}`;
  } else if (pf) {
    poster = { file: `/ccc-posters/${pf}`, style: "", prompt: "", references: [] };
  }
  if (poster) {
    const hi = pf ? postersHi.get(pf.replace(/^\d+[-_]/, "").replace(/\.\w+$/, "")) : null;
    if (hi) poster.hiRes = `/ccc-posters-hires/${hi}`;
    stat.poster++;
  }

  return {
    canon: cw.canon || String(p.num).padStart(4, "0"),
    id: p.num,
    slug,
    title,
    language: "en",
    source: `AllEnglishTexts.md #${p.num}`,
    cardId: card?.id || "",
    ...(cw.poemFile ? { poemFile: cw.poemFile } : {}),
    poemText: p.text,
    suno: { prompt: sunoPrompt, status: sunoPrompt ? "done" : "todo" },
    audio,
    poster,
    status: {
      text: true,
      suno: Boolean(sunoPrompt),
      audio: Boolean(audio?.variantA?.file || audio?.variantB?.file),
      poster: Boolean(poster?.file)
    }
  };
});

const index = {
  meta: {
    project: "Cello Cool Club",
    title: "Cello Cool Club — Dashboard",
    generatedAt: new Date().toISOString().slice(0, 10),
    generator: "tools/build-dashboard-index.mjs (spusť s --write)",
    sourceRoot: "C:/Users/Vladimir/Documents/CelloCoolClub",
    poemSource: "assets/text/AllEnglishTexts.md",
    audioSource: "assets/audio (server je připojuje na /ccc-audio/<soubor>)",
    referenceLibrary: "assets/poster-references (39 Born litografií, server na /ccc-refs/<soubor>)",
    counts: { basni: stat.total, sKartou: stat.card, sunoPrompt: stat.suno, audio: stat.audio, poster: stat.poster },
    notes:
      "Index se GENERUJE z assets/text/AllEnglishTexts.md. Ruční obohacení (poster.prompt, " +
      "poster.style, poster.references, Suno URL, varianta B) se při přegenerování ZACHOVÁVÁ " +
      "podle názvu básně — piš je klidně přímo sem. Znovu postavit: node tools/build-dashboard-index.mjs --write"
  },
  statusLegend: {
    text: "text básně je v AllEnglishTexts.md",
    suno: "existuje Suno style prompt",
    audio: "je stažené MP3 v assets/audio",
    poster: "je plakát v assets/posters"
  },
  referenceLibrary: {
    dir: "/ccc-refs",
    note:
      "39 Bornových litografií v assets/poster-references/. born-poster z nich vybírá 2–3 na plakát; " +
      "které se použily, zapiš do poems[].poster.references (assigned:true).",
    files: fs.existsSync(path.join(ROOT, "assets/poster-references"))
      ? fs.readdirSync(path.join(ROOT, "assets/poster-references")).filter((f) => /\.(jpe?g|png)$/i.test(f))
      : []
  },
  poems: out
};

console.log(`básní: ${stat.total}`);
console.log(`  spárováno s kartou: ${stat.card}`);
console.log(`  má Suno prompt:     ${stat.suno}`);
console.log(`  má audio:           ${stat.audio}`);
console.log(`  má poster:          ${stat.poster}  (z toho ${stat.keptManual} s ručním promptem/referencemi)`);

if (WRITE) {
  if (fs.existsSync(OUT)) fs.copyFileSync(OUT, OUT + ".bak");
  fs.writeFileSync(OUT, JSON.stringify(index, null, 2) + "\n", "utf8");
  console.log(`\nzapsáno: ${OUT}  (${(fs.statSync(OUT).size / 1048576).toFixed(2)} MB)`);
} else {
  console.log("\nNÁHLED — nic nezapsáno. Spusť s --write.");
}
