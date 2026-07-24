import fs from "node:fs/promises";
import path from "node:path";
import {
  engineRoot,
  loadLocalEnv,
  readCards,
  sortCards,
  validateCards,
  writeCards
} from "./card-utils.mjs";
import { findCard, parseArgs } from "./release-utils.mjs";
import {
  buildPosterPrompt,
  formatCatalogueNumber,
  getSeasonPalette,
  posterStyleVersion
} from "./poster-prompt.mjs";

// Like export-suno, this writes a packet a human (or Codex driving the Gemini
// frontend) can act on. --confirm is the optional paid OpenAI path.
const options = parseArgs(process.argv.slice(2));
await loadLocalEnv();

const cards = await readCards();
const errors = validateCards(cards);

if (errors.length > 0) {
  console.error("Poster generation stopped because validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const card = findCard(cards, options.id || options._?.[0]);

if (!card) {
  console.error("No card found. Use npm run poster -- 007");
  process.exit(1);
}

const layout = options.layout || "record";
const prompt = buildPosterPrompt(card, { layout });
const palette = getSeasonPalette(card.season);
const platePath = path.join(engineRoot, "assets", "poster-plates", `${card.id}-${card.slug}.png`);
const packetPath = path.join(engineRoot, "exports", "posters", `${card.id}-${card.slug}.md`);

card.posterPrompt = prompt;
card.posterStyleVersion = posterStyleVersion;
await writeCards(sortCards(cards));

await fs.mkdir(path.dirname(packetPath), { recursive: true });
await fs.writeFile(packetPath, renderPacket(card, { prompt, palette, layout, platePath }), "utf8");

console.log(`Poster plate packet for ${card.id} - ${card.title}`);
console.log(`Style: ${posterStyleVersion} / layout "${layout}"`);
console.log(`Season inks: ${palette.inks.join(" + ")} (${palette.hex.join(", ")}) on ${palette.paper}`);
console.log(`Packet: ${packetPath}`);
console.log("");
console.log(prompt);
console.log("");

if (!options.confirm) {
  console.log("Next: paste the prompt into Gemini (skill gemini-image-frontend), download the plate,");
  console.log(`then save it as: ${platePath}`);
  console.log("Or rerun with --confirm to spend OpenAI credit instead.");
  process.exit(0);
}

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error("OPENAI_API_KEY is missing. Use the Gemini frontend instead, or add the key and rerun.");
  process.exit(1);
}

const model = options.model || process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
const size = options.size || "1024x1536";
const quality = options.quality || "high";

const response = await fetch("https://api.openai.com/v1/images/generations", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ model, prompt, size, quality, n: 1 })
});

const payload = await response.json().catch(() => null);

if (!response.ok) {
  console.error(`OpenAI image request failed with HTTP ${response.status}.`);
  console.error(JSON.stringify(payload, null, 2));
  process.exit(1);
}

const b64 = payload?.data?.[0]?.b64_json;

if (!b64) {
  console.error("OpenAI image response did not include data[0].b64_json.");
  console.error(JSON.stringify(payload, null, 2));
  process.exit(1);
}

await fs.mkdir(path.dirname(platePath), { recursive: true });
await fs.writeFile(platePath, Buffer.from(b64, "base64"));

// The plate is a private production asset: it never enters the public export and
// it does not touch the card's status or its `image` field.
card.posterPlate = {
  styleVersion: posterStyleVersion,
  layout,
  model,
  size,
  quality,
  generatedAt: new Date().toISOString(),
  enginePlate: path.relative(engineRoot, platePath).replaceAll("\\", "/")
};

await writeCards(sortCards(cards));

console.log(`Generated poster plate: ${platePath}`);

function renderPacket(card, { prompt, palette, layout, platePath }) {
  return `# ${formatCatalogueNumber(card)} — ${card.title}

Poster plate packet. Style \`${posterStyleVersion}\`, layout \`${layout}\`.

- Season: ${card.season}
- Inks: ${palette.inks.join(" + ")} (${palette.hex.join(", ")}) on ${palette.paper}
- Aspect: 2:3 portrait (A3 / 50x70)
- Save the downloaded plate as: \`${platePath}\`

The model draws the plate only. Title, poem, catalogue number and the QR label
are typeset by the print pipeline, so the plate must contain no letters at all.

## Prompt

\`\`\`text
${prompt}
\`\`\`

## Poem (typeset by the engine, NOT by the image model)

${(card.poemText || []).map((line) => `> ${line}`).join("\n")}
`;
}
