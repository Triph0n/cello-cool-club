import { readCards, sortCards, validateCards } from "./card-utils.mjs";
import { findCard, parseArgs } from "./release-utils.mjs";
import { exportSunoPacket } from "./suno-packet.mjs";

const options = parseArgs(process.argv.slice(2));
const cards = await readCards();
const errors = validateCards(cards);

if (errors.length > 0) {
  console.error("Suno export stopped because validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const card = chooseCard(cards, options);

if (!card) {
  console.error("No card found. Use npm run export-suno -- 002");
  process.exit(1);
}

if (!card.sunoPrompt) {
  console.error(`Card ${card.id} does not have sunoPrompt.`);
  process.exit(1);
}

const packet = await exportSunoPacket(card);

console.log(`Suno packet exported for ${card.id} - ${card.title}`);
console.log(packet.files.stylePrompt);
console.log(packet.files.lyrics);
console.log(packet.files.markdown);
console.log(packet.files.json);

function chooseCard(cards, options) {
  if (options.id) return findCard(cards, options.id);
  if (options._?.length > 0) return findCard(cards, options._[0]);

  return sortCards(cards).find((candidate) => candidate.sunoPrompt && !candidate.audio);
}
