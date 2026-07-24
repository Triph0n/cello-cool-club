import fs from "node:fs/promises";
import path from "node:path";
import { engineRoot, getArchivePath, readCards, sortCards, validateCards } from "./card-utils.mjs";
import { findCard, parseArgs } from "./release-utils.mjs";

const options = parseArgs(process.argv.slice(2));
const cards = await readCards();
const errors = validateCards(cards);

if (errors.length > 0) {
  console.error("Review packet stopped because validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const card = chooseCard(cards, options);

if (!card) {
  console.error("No card found. Use npm run review-packet -- 002");
  process.exit(1);
}

const outputDir = path.join(engineRoot, "exports", "review");
const outputPath = path.join(outputDir, `${card.id}-${card.slug}.md`);

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(outputPath, renderPacket(card), "utf8");

console.log(`Review packet created for ${card.id} - ${card.title}`);
console.log(outputPath);

function chooseCard(cards, options) {
  if (options.id) return findCard(cards, options.id);
  if (options._?.length > 0) return findCard(cards, options._[0]);

  return sortCards(cards).find((card) => card.status !== "posted");
}

function renderPacket(card) {
  const missing = getMissingItems(card);
  const poem = Array.isArray(card.poemText) ? card.poemText.join("\n") : "";
  const source = card.source
    ? [
        `- Source file: ${card.source.file || ""}`,
        `- Source number: ${card.source.number || ""}`,
        `- French title: ${card.source.frenchTitle || ""}`,
        `- Czech title: ${card.source.czechTitle || ""}`,
        `- English title: ${card.source.englishTitle || ""}`
      ].join("\n")
    : "- No source metadata.";

  return `# Review Packet: ${card.id} - ${card.title}

## Status

- Current status: ${card.status}
- Archive path: ${getArchivePath(card)}
- Missing before review: ${missing.length === 0 ? "Nothing obvious." : missing.join(", ")}

## Source

${source}

## Main Card Text

\`\`\`text
${poem}
\`\`\`

## Caption Draft

${card.longCaption || card.shortCaption || ""}

## Image Prompt

\`\`\`text
${card.imagePrompt || ""}
\`\`\`

## Suno Prompt

\`\`\`text
${card.sunoPrompt || ""}
\`\`\`

## Alt Text

${card.altText || ""}

## Next Actions

1. Generate or choose image.
2. Save final image path into \`image\`.
3. Prepare Suno track from prompt.
4. Save selected audio path into \`audio\`.
5. Move status to \`ready_for_review\`, then \`approved\`.
`;
}

function getMissingItems(card) {
  const requiredForReview = ["image", "audio"];
  return requiredForReview.filter((field) => !card[field]);
}
