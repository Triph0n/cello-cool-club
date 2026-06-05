import fs from "node:fs/promises";
import path from "node:path";
import {
  engineRoot,
  readCards,
  sortCards,
  validateCards
} from "./card-utils.mjs";
import { findCard, parseArgs, releaseReadinessProblems, selectNextRelease } from "./release-utils.mjs";
import { buildGenericSocialPost } from "./social-utils.mjs";

const options = parseArgs(process.argv.slice(2));
const cards = await readCards();
const errors = validateCards(cards);

if (errors.length > 0) {
  console.error("Social post preparation stopped because validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const card = chooseCard(cards, options);

if (!card) {
  console.error("No card found. Use --id 001, --id the-clock, or --next.");
  process.exit(1);
}

const problems = releaseReadinessProblems(card).filter((problem) => problem !== "card is already posted");

if (problems.length > 0) {
  console.error(`Card ${card.id} is not ready for social post preparation:`);
  problems.forEach((problem) => console.error(`- ${problem}`));
  process.exit(1);
}

const post = buildGenericSocialPost(card);
const outputDir = path.join(engineRoot, "exports", "social");
const baseName = `${card.id}-${card.slug}`;

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(path.join(outputDir, `${baseName}.txt`), `${post.text}\n`, "utf8");
await fs.writeFile(path.join(outputDir, `${baseName}.json`), `${JSON.stringify(post, null, 2)}\n`, "utf8");

console.log(`Prepared social post for ${card.id} - ${card.title}`);
console.log(path.join(outputDir, `${baseName}.txt`));
console.log(path.join(outputDir, `${baseName}.json`));

function chooseCard(cards, options) {
  if (options.id) return findCard(cards, options.id);
  if (options._?.length > 0) return findCard(cards, options._[0]);
  if (options.next) return selectNextRelease(cards);

  return sortCards(cards)
    .filter((card) => card.status === "posted")
    .at(-1);
}
