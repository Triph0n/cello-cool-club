import fs from "node:fs/promises";
import path from "node:path";
import { getSitePath, loadLocalEnv } from "./card-utils.mjs";

await loadLocalEnv();

const sitePath = getSitePath();
const errors = [];
const warnings = [];
const privateFields = new Set([
  "imagePrompt",
  "sunoPrompt",
  "musicNotes",
  "notes",
  "source",
  "imageGeneration",
  "imageAttachment",
  "audioAttachment",
  "releaseLog",
  "blueskyPost",
  "postedUrls",
  "approvedAt",
  "longCaption"
]);

await assertFile("index.html");
await assertFile(path.join("cards", "index.html"));
await assertFile(path.join("data", "cards.json"));

let cards = [];
try {
  const raw = await fs.readFile(path.join(sitePath, "data", "cards.json"), "utf8");
  cards = JSON.parse(raw);
  if (!Array.isArray(cards)) {
    errors.push("data/cards.json must contain an array.");
    cards = [];
  }
} catch (error) {
  errors.push(`Cannot parse public data/cards.json: ${error.message}`);
}

for (const card of cards) {
  const label = card?.id || "unknown card";

  if (!card || typeof card !== "object") {
    errors.push(`${label}: card must be an object.`);
    continue;
  }

  for (const field of privateFields) {
    if (field in card) {
      errors.push(`${label}: private field leaked to public export: ${field}`);
    }
  }

  const archiveUrl = card.archiveUrl || `cards/${card.id}-${card.slug}/`;
  await assertFile(path.join(archiveUrl, "index.html"), `${label}: missing card page`);
  await assertFile(card.image, `${label}: missing image asset`);
  await assertFile(card.audio, `${label}: missing audio asset`);

  if (!card.altText) warnings.push(`${label}: missing altText.`);
  if (!Array.isArray(card.poemText) || card.poemText.length === 0) {
    errors.push(`${label}: missing poemText.`);
  }
}

if (cards.length === 0) {
  errors.push("No public cards found.");
}

if (warnings.length > 0) {
  console.warn("Warnings:");
  warnings.forEach((warning) => console.warn(`- ${warning}`));
}

if (errors.length > 0) {
  console.error("Public site check failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Public site check passed: ${cards.length} public card(s).`);
console.log(sitePath);

async function assertFile(relativePath, message = null) {
  const fullPath = path.join(sitePath, relativePath);
  try {
    const stat = await fs.stat(fullPath);
    if (!stat.isFile()) {
      errors.push(message || `Expected file but found something else: ${relativePath}`);
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      errors.push(message || `Missing file: ${relativePath}`);
      return;
    }

    errors.push(`${relativePath}: ${error.message}`);
  }
}
