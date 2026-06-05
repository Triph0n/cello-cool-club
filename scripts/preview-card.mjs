import fs from "node:fs/promises";
import path from "node:path";
import { getSitePath, readCards, sortCards, validateCards } from "./card-utils.mjs";
import { findCard, parseArgs } from "./release-utils.mjs";
import { renderCardPage } from "./renderers.mjs";

const options = parseArgs(process.argv.slice(2));
const cards = sortCards(await readCards());
const errors = validateCards(cards);

if (errors.length > 0) {
  console.error("Preview stopped because validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const idOrSlug = options.id || options._?.[0];

if (!idOrSlug) {
  console.error("Usage: npm run preview-card -- 002");
  process.exit(1);
}

const card = findCard(cards, idOrSlug);

if (!card) {
  console.error(`No card found for "${idOrSlug}".`);
  process.exit(1);
}

const previewCards = cards.filter((candidate) => candidate.status === "posted" || candidate.id === card.id);
const sitePath = getSitePath();
const previewDir = path.join(sitePath, "preview", `${card.id}-${card.slug}`);
const previewPath = path.join(previewDir, "index.html");

await fs.mkdir(previewDir, { recursive: true });
await fs.writeFile(
  previewPath,
  renderCardPage(card, previewCards, {
    preview: true,
    depth: 2,
    archiveHref: "../../cards/"
  }),
  "utf8"
);

console.log(`Preview generated for ${card.id} - ${card.title}`);
console.log(previewPath);
console.log(`http://127.0.0.1:5173/preview/${card.id}-${card.slug}/`);
