import fs from "node:fs/promises";
import path from "node:path";
import {
  engineRoot,
  getSitePath,
  loadLocalEnv,
  readCards,
  sortCards,
  validateCards,
  writeCards
} from "./card-utils.mjs";
import { findCard, parseArgs } from "./release-utils.mjs";

const options = parseArgs(process.argv.slice(2));
await loadLocalEnv();

const cards = await readCards();
const errors = validateCards(cards);

if (errors.length > 0) {
  console.error("Image generation stopped because validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const card = chooseCard(cards, options);

if (!card) {
  console.error("No card found. Use npm run generate-image -- 002");
  process.exit(1);
}

if (!card.imagePrompt) {
  console.error(`Card ${card.id} does not have imagePrompt.`);
  process.exit(1);
}

const model = options.model || process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
const size = options.size || process.env.OPENAI_IMAGE_SIZE || "1024x1536";
const quality = options.quality || process.env.OPENAI_IMAGE_QUALITY || "low";
const outputFileName = `${card.id}-${card.slug}.png`;
const engineImagePath = path.join(engineRoot, "assets", "generated-images", outputFileName);
const publicImageRelativePath = `assets/images/${outputFileName}`;
const publicImagePath = path.join(getSitePath(), publicImageRelativePath);
const prompt = buildPrompt(card);

if (!options.confirm) {
  console.log(`Image generation dry run for ${card.id} - ${card.title}`);
  console.log(`Model: ${model}`);
  console.log(`Size: ${size}`);
  console.log(`Quality: ${quality}`);
  console.log(`Engine output: ${engineImagePath}`);
  console.log(`Public output: ${publicImagePath}`);
  console.log("");
  console.log(prompt);
  console.log("");
  console.log("Run again with --confirm to call the API and write files.");
  process.exit(0);
}

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error("OPENAI_API_KEY is missing. Add it to .env or the environment, then rerun with --confirm.");
  process.exit(1);
}

const response = await fetch("https://api.openai.com/v1/images/generations", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model,
    prompt,
    size,
    quality,
    n: 1
  })
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

const imageBuffer = Buffer.from(b64, "base64");
await fs.mkdir(path.dirname(engineImagePath), { recursive: true });
await fs.mkdir(path.dirname(publicImagePath), { recursive: true });
await fs.writeFile(engineImagePath, imageBuffer);
await fs.writeFile(publicImagePath, imageBuffer);

card.image = publicImageRelativePath;
card.status = card.status === "draft" ? "image_ready" : card.status;
card.imageGeneration = {
  model,
  size,
  quality,
  generatedAt: new Date().toISOString(),
  engineImage: path.relative(engineRoot, engineImagePath).replaceAll("\\", "/"),
  publicImage: publicImageRelativePath
};

await writeCards(sortCards(cards));

console.log(`Generated image for ${card.id} - ${card.title}`);
console.log(engineImagePath);
console.log(publicImagePath);

function chooseCard(cards, options) {
  if (options.id) return findCard(cards, options.id);
  if (options._?.length > 0) return findCard(cards, options._[0]);

  return sortCards(cards).find((candidate) => candidate.status === "draft" && candidate.imagePrompt && !candidate.image);
}

function buildPrompt(card) {
  return [
    card.imagePrompt,
    "",
    "Image requirements:",
    "- no readable text or typography inside the artwork",
    "- leave visual breathing room for a cropped social post",
    "- atmospheric, tactile, poetic, and detailed",
    "- avoid generic fantasy gloss"
  ].join("\n");
}
