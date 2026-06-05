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

const allowedAudioExtensions = new Set([".mp3", ".wav", ".m4a", ".ogg"]);
const options = parseArgs(process.argv.slice(2));
const [idOrSlug, sourcePath] = options._ || [];

if (!idOrSlug || !sourcePath) {
  console.error('Usage: npm run attach-audio -- 002 "C:\\path\\to\\selected-audio.mp3"');
  process.exit(1);
}

const cards = await readCards();
const errors = validateCards(cards);

if (errors.length > 0) {
  console.error("Audio attach stopped because validation failed:");
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

if (!allowedAudioExtensions.has(extension)) {
  console.error(`Unsupported audio extension "${extension}". Use mp3, wav, m4a, or ogg.`);
  process.exit(1);
}

let sourceStat;
try {
  sourceStat = await fs.stat(resolvedSource);
} catch (error) {
  if (error.code === "ENOENT") {
    console.error(`Audio source does not exist: ${resolvedSource}`);
    process.exit(1);
  }
  throw error;
}

if (!sourceStat.isFile()) {
  console.error(`Audio source is not a file: ${resolvedSource}`);
  process.exit(1);
}

const fileName = `${card.id}-${card.slug}${extension}`;
const engineAudioPath = path.join(engineRoot, "assets", "audio", fileName);
const publicAudioRelativePath = `assets/audio/${fileName}`;
const publicAudioPath = path.join(getSitePath(), publicAudioRelativePath);

await fs.mkdir(path.dirname(engineAudioPath), { recursive: true });
await fs.mkdir(path.dirname(publicAudioPath), { recursive: true });
await fs.copyFile(resolvedSource, engineAudioPath);
await fs.copyFile(resolvedSource, publicAudioPath);

card.audio = publicAudioRelativePath;
card.musicNotes = {
  attachedAt: new Date().toISOString(),
  sourceFile: resolvedSource,
  engineAudio: path.relative(engineRoot, engineAudioPath).replaceAll("\\", "/"),
  publicAudio: publicAudioRelativePath
};

if (card.status === "draft") {
  card.status = card.image ? "ready_for_review" : "music_needed";
} else if (card.status === "image_ready") {
  card.status = "ready_for_review";
}

await writeCards(sortCards(cards));

console.log(`Attached audio for ${card.id} - ${card.title}`);
console.log(engineAudioPath);
console.log(publicAudioPath);
console.log(`Status: ${card.status}`);
