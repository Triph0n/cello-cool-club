import { getArchiveUrl, readCards, validateCards } from "./card-utils.mjs";
import { parseArgs, parseNow, selectNextRelease } from "./release-utils.mjs";

const options = parseArgs(process.argv.slice(2));
const now = parseNow(options.now);
const cards = await readCards();
const errors = validateCards(cards);

if (errors.length > 0) {
  console.error("Release check stopped because validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const card = selectNextRelease(cards, now);

if (!card) {
  console.log(`No releasable card found for ${now.toISOString()}.`);
  process.exit(0);
}

console.log(`Next releasable card: ${card.id} - ${card.title}`);
console.log(`Status: ${card.status}`);
console.log(`Publish at: ${card.publishAt || "next available slot"}`);
console.log(`Archive: ${getArchiveUrl(card)}`);
