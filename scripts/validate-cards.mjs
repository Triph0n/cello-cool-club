import { readCards, validateCards } from "./card-utils.mjs";

const cards = await readCards();
const errors = validateCards(cards);

if (errors.length > 0) {
  console.error("Card validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Card validation passed: ${cards.length} card(s).`);
