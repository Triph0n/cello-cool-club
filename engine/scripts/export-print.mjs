import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import QRCode from "qrcode";
import {
  allowedDecks,
  engineRoot,
  getPlayerPath,
  getPublicSiteUrl,
  getSitePath,
  loadLocalEnv,
  readCards,
  toAbsoluteUrl,
  validateCards
} from "./card-utils.mjs";
import { parseArgs } from "./release-utils.mjs";
import { renderPrintSheet, selectPrintCards } from "./print-utils.mjs";

await loadLocalEnv();

// Positionals work around shells eating "--" flags: `npm run print club`
// prints a whole deck, `npm run print 001 007` prints specific cards.
const options = parseArgs(process.argv.slice(2));
const positionals = options._ || [];
const positionalDeck = positionals.find((value) => allowedDecks.has(value));
const deck = options.deck || positionalDeck || "kids";
const ids = [
  ...(options.card ? String(options.card).split(",").map((value) => value.trim()) : []),
  ...positionals.filter((value) => !allowedDecks.has(value))
].filter(Boolean);

if (!allowedDecks.has(deck)) {
  console.error(`Unknown deck "${deck}". Use one of: ${[...allowedDecks].join(", ")}.`);
  process.exit(1);
}

if (!getPublicSiteUrl()) {
  console.error("PUBLIC_SITE_URL is not set in .env — QR codes need an absolute URL to the live site.");
  process.exit(1);
}

const cards = await readCards();
const errors = validateCards(cards);
if (errors.length > 0) {
  console.error("Print export stopped because card validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const { selected, skipped } = selectPrintCards(cards, { deck, ids });
skipped.forEach((reason) => console.warn(`Skipped ${reason}`));

if (selected.length === 0) {
  console.error(ids.length > 0
    ? "None of the requested cards can be printed."
    : `No posted "${deck}" cards found. Mark kids cards as posted and run npm run export first.`);
  process.exit(1);
}

const sitePath = getSitePath();
const entries = [];
for (const card of selected) {
  const playerUrl = toAbsoluteUrl(getPlayerPath(card));
  const qrSvg = await QRCode.toString(playerUrl, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: "#1a1208ff", light: "#ffffffff" }
  });

  let imageSrc = "";
  if (card.image) {
    const imagePath = path.join(sitePath, card.image);
    try {
      await fs.access(imagePath);
      imageSrc = pathToFileURL(imagePath).href;
    } catch {
      console.warn(`Card ${card.id}: image not found in public site (${card.image}) — printing without artwork. Run npm run export first.`);
    }
  }

  entries.push({ card, qrSvg, imageSrc, playerUrl });
}

const label = ids.length > 0 ? "selection" : deck;
const outPath = options.out
  ? path.resolve(options.out)
  : path.join(engineRoot, "exports", "print", `${label}-cards.html`);

await fs.mkdir(path.dirname(outPath), { recursive: true });
await fs.writeFile(outPath, renderPrintSheet(entries, { title: `Cello Cool Club — ${label} print sheet` }), "utf8");

console.log(`Print sheet with ${entries.length} card(s) written to ${outPath}.`);
entries.forEach((entry) => console.log(`- ${entry.card.id} ${entry.card.title} -> ${entry.playerUrl}`));
console.log("Open the file in a browser and print with Ctrl+P (A4, 100 %, background graphics on).");
