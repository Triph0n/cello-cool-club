import fs from "node:fs/promises";
import path from "node:path";
import {
  engineRoot,
  getSitePath,
  readCards,
  sortCards,
  validateCards,
  writeCards
} from "./card-utils.mjs";
import { findCard, parseArgs } from "./release-utils.mjs";

const allowedImageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const options = parseArgs(process.argv.slice(2));
const [idOrSlug, sourcePath] = options._ || [];

if (!idOrSlug || !sourcePath) {
  console.error('Usage: npm run attach-image -- 002 "C:\\path\\to\\image.png"');
  process.exit(1);
}

const cards = await readCards();
const errors = validateCards(cards);

if (errors.length > 0) {
  console.error("Image attach stopped because validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const card = findCard(cards, idOrSlug);

if (!card) {
  console.error(`No card found for "${idOrSlug}".`);
  process.exit(1);
}

const resolvedSource = path.resolve(sourcePath);
const extension = path.extname(resolvedSource).toLowerCase();

if (!allowedImageExtensions.has(extension)) {
  console.error(`Unsupported image extension "${extension}". Use png, jpg, jpeg, or webp.`);
  process.exit(1);
}

let sourceStat;
try {
  sourceStat = await fs.stat(resolvedSource);
} catch (error) {
  if (error.code === "ENOENT") {
    console.error(`Image source does not exist: ${resolvedSource}`);
    process.exit(1);
  }
  throw error;
}

if (!sourceStat.isFile()) {
  console.error(`Image source is not a file: ${resolvedSource}`);
  process.exit(1);
}

const normalizedExtension = extension === ".jpeg" ? ".jpg" : extension;
const fileName = `${card.id}-${card.slug}${normalizedExtension}`;
const engineImagePath = path.join(engineRoot, "assets", "generated-images", fileName);
const publicImageRelativePath = `assets/images/${fileName}`;
const publicImagePath = path.join(getSitePath(), publicImageRelativePath);

await fs.mkdir(path.dirname(engineImagePath), { recursive: true });
await fs.mkdir(path.dirname(publicImagePath), { recursive: true });
await fs.copyFile(resolvedSource, engineImagePath);
await fs.copyFile(resolvedSource, publicImagePath);

card.image = publicImageRelativePath;
card.imageAttachment = {
  attachedAt: new Date().toISOString(),
  sourceFile: resolvedSource,
  engineImage: path.relative(engineRoot, engineImagePath).replaceAll("\\", "/"),
  publicImage: publicImageRelativePath
};

if (card.status === "draft") {
  card.status = card.audio ? "ready_for_review" : "image_ready";
} else if (card.status === "music_needed") {
  card.status = "ready_for_review";
}

await writeCards(sortCards(cards));

console.log(`Attached image for ${card.id} - ${card.title}`);
console.log(engineImagePath);
console.log(publicImagePath);
console.log(`Status: ${card.status}`);
