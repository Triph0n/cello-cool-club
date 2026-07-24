import { readCards, sortCards, validateCards, writeCards } from "./card-utils.mjs";
import { findCard, parseArgs } from "./release-utils.mjs";

const options = parseArgs(process.argv.slice(2));
const idOrSlug = options.id || options._?.[0];

if (!idOrSlug) {
  console.error("Usage: npm run approve-card -- 002");
  process.exit(1);
}

const cards = await readCards();
const errors = validateCards(cards);

if (errors.length > 0) {
  console.error("Approval stopped because validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const card = findCard(cards, idOrSlug);

if (!card) {
  console.error(`No card found for "${idOrSlug}".`);
  process.exit(1);
}

if (card.status === "posted") {
  console.error(`Card ${card.id} is already posted.`);
  process.exit(1);
}

const missing = ["poemText", "shortCaption", "image", "audio", "altText"].filter((field) => {
  const value = card[field];
  return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
});

if (missing.length > 0) {
  console.error(`Card ${card.id} cannot be approved yet. Missing: ${missing.join(", ")}`);
  process.exit(1);
}

card.status = "approved";
card.approvedAt = new Date().toISOString();

await writeCards(sortCards(cards));

console.log(`Approved card ${card.id} - ${card.title}`);
