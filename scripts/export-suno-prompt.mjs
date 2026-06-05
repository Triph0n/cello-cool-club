import fs from "node:fs/promises";
import path from "node:path";
import { engineRoot, readCards, sortCards, validateCards } from "./card-utils.mjs";
import { findCard, parseArgs } from "./release-utils.mjs";

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

const outputDir = path.join(engineRoot, "exports", "suno");
const baseName = `${card.id}-${card.slug}`;
const promptPath = path.join(outputDir, `${baseName}.txt`);
const lyricsPath = path.join(outputDir, `${baseName}-lyrics.txt`);
const packetPath = path.join(outputDir, `${baseName}.md`);

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(promptPath, `${card.sunoPrompt}\n`, "utf8");
await fs.writeFile(lyricsPath, `${card.poemText.join("\n")}\n`, "utf8");
await fs.writeFile(packetPath, renderPacket(card), "utf8");

console.log(`Suno packet exported for ${card.id} - ${card.title}`);
console.log(promptPath);
console.log(lyricsPath);
console.log(packetPath);

function chooseCard(cards, options) {
  if (options.id) return findCard(cards, options.id);
  if (options._?.length > 0) return findCard(cards, options._[0]);

  return sortCards(cards).find((candidate) => candidate.sunoPrompt && !candidate.audio);
}

function renderPacket(card) {
  return `# Suno Packet: ${card.id} - ${card.title}

## Style Prompt

\`\`\`text
${card.sunoPrompt}
\`\`\`

## Lyrics / Spoken Text

\`\`\`text
${card.poemText.join("\n")}
\`\`\`

## Notes

- Main language: ${card.language}
- Current status: ${card.status}
- After selecting final music, run:

\`\`\`text
npm run attach-audio -- ${card.id} "C:\\path\\to\\selected-audio.mp3"
\`\`\`
`;
}
