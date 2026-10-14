// Builds celloclublive/<cardId>-<slug>/style-<decade>.txt + lyrics.txt from an existing
// engine card — the "correct base" per Vladimir's 2026-08-11 correction: start from the
// card's own literal sunoPrompt (not a hand-rewritten decade prompt), swap the decade
// wording, remove the real brass/sax mention (cello takes that role instead), add the
// cello-as-saxophone dialogue line, and reinforce the solo-vocal rule.
// Usage: node build-live-style.mjs <cardId> [1920,1930,1940]
import fs from "node:fs";
import path from "node:path";

const ROOT = "C:/Users/Vladimir/Documents/CelloCoolClub";
const [, , cardId, decadesArg] = process.argv;
if (!cardId) {
  console.error("Usage: node build-live-style.mjs <cardId> [1920,1930,1940]");
  process.exit(2);
}
const decades = (decadesArg || "1920,1930,1940").split(",").map((d) => d.trim());

const cards = JSON.parse(fs.readFileSync(path.join(ROOT, "engine/data/cards.json"), "utf8"));
const card = cards.find((c) => c.id === cardId);
if (!card) { console.error("CARD_NOT_FOUND " + cardId); process.exit(2); }
if (!card.sunoPrompt) { console.error("Card has no sunoPrompt: " + cardId); process.exit(2); }

const DECADE_FLAVOR = {
  1920: "hot jazz stride piano, plucked two-beat upright bass",
  1930: "swing-era small-combo swing, walking upright bass",
  1940: "supper-club vocal jazz, richer close-voiced chords",
};

const CELLO_SAX_ROLE =
  "no real saxophone or brass, solo cello alone plays the sax-style answering lines in dialogue with the vocal, never harmonizing or doubling it";

const VOCAL_REINFORCE = "no double-tracked or octave-doubled vocal, no vocal splitting";

const slug = card.slug || card.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const outDir = path.join(ROOT, "celloclublive", `${cardId}-${slug}`);
fs.mkdirSync(outDir, { recursive: true });

const lyrics = card.poemText.join("\n");
fs.writeFileSync(path.join(outDir, "lyrics.txt"), lyrics + "\n");
console.log("wrote lyrics.txt");

for (const decade of decades) {
  const flavor = DECADE_FLAVOR[decade];
  if (!flavor) { console.error(`Unknown decade ${decade} — add it to DECADE_FLAVOR`); continue; }

  // Karta s dlouhym vlastnim sunoPromptem se do limitu 1000 znaku nemusi vejit ani po
  // odstraneni sax/brass frazi. Escape hatch: <cardDir>/base-override.txt — zkraceny
  // sunoPrompt PRO TUHLE JEDNU KARTU. Sablona ani cards.json se kvuli tomu nemeni.
  const overridePath = path.join(outDir, "base-override.txt");
  const zdroj = fs.existsSync(overridePath)
    ? fs.readFileSync(overridePath, "utf8")
    : card.sunoPrompt;
  if (fs.existsSync(overridePath) && decade === decades[0]) console.log("pouzivam base-override.txt");
  let base = zdroj.replace(/^Style prompt:\s*/i, "").trim();
  base = base.replace(/elegant \d{4}s vocal jazz/i, `elegant ${decade}s vocal jazz`);
  // Strip any comma-segment mentioning real sax/brass/horns anywhere in the base —
  // the cello takes that role instead, and leaving these in produces a contradictory
  // prompt ("no real saxophone" right next to "mournful saxophone replies").
  base = base
    .split(/,\s*/)
    .filter((seg) => !/\b(sax(ophone)?|brass|horns?)\b/i.test(seg))
    .join(", ")
    .replace(/\.\s*$/, "");

  const stylePrompt = `${base}, ${CELLO_SAX_ROLE}, ${flavor}, ${VOCAL_REINFORCE}`;
  if (stylePrompt.length > 1000) {
    console.error(`STYLE_TOO_LONG decade=${decade} ${stylePrompt.length}/1000 — trim DECADE_FLAVOR or base`);
    continue;
  }
  fs.writeFileSync(path.join(outDir, `style-${decade}.txt`), `Style prompt: ${stylePrompt}\n`);
  console.log(`wrote style-${decade}.txt (${stylePrompt.length}/1000)`);
}

console.log("\nNext: for each decade, run");
console.log(`  node custom-generate.mjs "${card.title} — <decade>" "${outDir}/style-<decade>.txt" "${outDir}/lyrics.txt" --no-create`);
console.log("check gen-filled.png, then rerun without --no-create.");
