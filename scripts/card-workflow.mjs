import fs from "node:fs/promises";
import path from "node:path";
import {
  engineRoot,
  formatCardId,
  getSitePath,
  nextCardNumber,
  readCards,
  slugify,
  sortCards,
  validateCards,
  writeCards
} from "./card-utils.mjs";
import { findCard } from "./release-utils.mjs";
import { parseSourceFile } from "./source-parser.mjs";
import { renderCardPage } from "./renderers.mjs";

const allowedImageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const allowedAudioExtensions = new Set([".mp3", ".wav", ".m4a", ".ogg"]);

export async function createCardFromSource({ sourceFile, sourceNumber, language = "en" }) {
  const poems = await parseSourceFile(sourceFile);
  const poem = poems.find((candidate) => candidate.number === Number(sourceNumber));
  if (!poem) throw new Error(`Poem ${sourceNumber} not found in ${sourceFile}.`);

  const cards = await readCards();
  const sourceBase = sourceFile.replace(/\.(txt|md)$/i, "");
  const existing = cards.find((card) => {
    if (card.source?.number !== poem.number) return false;
    return card.source?.textExport?.includes(sourceBase) || card.source?.file?.includes(sourceBase);
  });
  if (existing) return { card: existing, created: false };

  const number = nextCardNumber(cards);
  const id = formatCardId(number);
  const title = poem.titles[language] || poem.titles.en || poem.titles.fr;
  const slug = uniqueSlug(slugify(title), cards);
  const poemText = poem.texts[language] || poem.texts.en || poem.texts.fr || [];

  const card = {
    id,
    number,
    slug,
    title,
    season: "Time & Rooms",
    language,
    poemText,
    shortCaption: `Morning card prepared: ${title}.`,
    longCaption: buildCaption(title, poemText),
    imagePrompt: buildImagePrompt(title, poemText),
    sunoPrompt: buildSunoPrompt(title),
    image: "",
    audio: "",
    altText: buildAltText(title),
    status: "draft",
    publishAt: "",
    archiveUrl: `cards/${id}-${slug}/`,
    postedUrls: {},
    source: {
      file: sourceFile.startsWith("clean/") ? `data/clean-sources/${sourceFile.split("/").at(-1)}` : `data/inbox/${sourceFile.replace(/\.txt$/i, ".odt")}`,
      textExport: sourceFile.startsWith("clean/") ? `data/clean-sources/${sourceFile.split("/").at(-1)}` : `data/inbox/${sourceFile}`,
      number: poem.number,
      frenchTitle: poem.titles.fr,
      czechTitle: poem.titles.cs,
      englishTitle: poem.titles.en
    },
    notes: `Created from admin panel. Main language: ${language}.`
  };

  const updated = sortCards([...cards, card]);
  const errors = validateCards(updated);
  if (errors.length > 0) throw new Error(errors.join("\n"));
  await writeCards(updated);
  return { card, created: true };
}

export async function attachImageToCard(idOrSlug, sourcePath) {
  return attachAssetToCard({
    idOrSlug,
    sourcePath,
    allowedExtensions: allowedImageExtensions,
    engineFolder: path.join(engineRoot, "assets", "generated-images"),
    publicFolder: path.join(getSitePath(), "assets", "images"),
    publicPrefix: "assets/images",
    field: "image",
    metaField: "imageAttachment"
  });
}

export async function attachAudioToCard(idOrSlug, sourcePath) {
  return attachAssetToCard({
    idOrSlug,
    sourcePath,
    allowedExtensions: allowedAudioExtensions,
    engineFolder: path.join(engineRoot, "assets", "audio"),
    publicFolder: path.join(getSitePath(), "assets", "audio"),
    publicPrefix: "assets/audio",
    field: "audio",
    metaField: "musicNotes"
  });
}

export async function previewCard(idOrSlug) {
  const cards = sortCards(await readCards());
  const card = findCard(cards, idOrSlug);
  if (!card) throw new Error(`No card found for "${idOrSlug}".`);

  const previewCards = cards.filter((candidate) => candidate.status === "posted" || candidate.id === card.id);
  const previewDir = path.join(getSitePath(), "preview", `${card.id}-${card.slug}`);
  await fs.mkdir(previewDir, { recursive: true });
  await fs.writeFile(
    path.join(previewDir, "index.html"),
    renderCardPage(card, previewCards, {
      preview: true,
      depth: 2,
      archiveHref: "../../cards/"
    }),
    "utf8"
  );

  return {
    card,
    url: `http://127.0.0.1:5173/preview/${card.id}-${card.slug}/`
  };
}

export async function approveCard(idOrSlug) {
  const cards = await readCards();
  const card = findCard(cards, idOrSlug);
  if (!card) throw new Error(`No card found for "${idOrSlug}".`);
  if (card.status === "posted") throw new Error(`Card ${card.id} is already posted.`);

  const missing = ["poemText", "shortCaption", "image", "audio", "altText"].filter((field) => {
    const value = card[field];
    return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
  });
  if (missing.length > 0) throw new Error(`Missing before approval: ${missing.join(", ")}`);

  card.status = "approved";
  card.approvedAt = new Date().toISOString();
  await writeCards(sortCards(cards));
  return card;
}

async function attachAssetToCard({ idOrSlug, sourcePath, allowedExtensions, engineFolder, publicFolder, publicPrefix, field, metaField }) {
  const cards = await readCards();
  const card = findCard(cards, idOrSlug);
  if (!card) throw new Error(`No card found for "${idOrSlug}".`);

  const resolvedSource = path.resolve(sourcePath);
  const extension = path.extname(resolvedSource).toLowerCase();
  if (!allowedExtensions.has(extension)) throw new Error(`Unsupported file extension: ${extension}`);

  const stat = await fs.stat(resolvedSource);
  if (!stat.isFile()) throw new Error(`Source is not a file: ${resolvedSource}`);

  const normalizedExtension = extension === ".jpeg" ? ".jpg" : extension;
  const fileName = `${card.id}-${card.slug}${normalizedExtension}`;
  const enginePath = path.join(engineFolder, fileName);
  const publicPath = path.join(publicFolder, fileName);
  const publicAsset = `${publicPrefix}/${fileName}`;

  await fs.mkdir(path.dirname(enginePath), { recursive: true });
  await fs.mkdir(path.dirname(publicPath), { recursive: true });
  await fs.copyFile(resolvedSource, enginePath);
  await fs.copyFile(resolvedSource, publicPath);

  card[field] = publicAsset;
  card[metaField] = {
    attachedAt: new Date().toISOString(),
    sourceFile: resolvedSource,
    engineAsset: path.relative(engineRoot, enginePath).replaceAll("\\", "/"),
    publicAsset
  };
  updateStatusAfterAssets(card);
  await writeCards(sortCards(cards));
  return card;
}

function updateStatusAfterAssets(card) {
  if (card.status === "posted" || card.status === "approved") return;
  if (card.image && card.audio) {
    card.status = "ready_for_review";
  } else if (card.image) {
    card.status = "image_ready";
  } else if (card.audio) {
    card.status = "music_needed";
  }
}

function uniqueSlug(baseSlug, cards) {
  const existing = new Set(cards.map((card) => card.slug));
  if (!existing.has(baseSlug)) return baseSlug;
  let suffix = 2;
  while (existing.has(`${baseSlug}-${suffix}`)) suffix += 1;
  return `${baseSlug}-${suffix}`;
}

function buildCaption(title, poemText) {
  const firstLine = poemText[0] || title;
  return `${title} opens with a quiet image: ${firstLine.toLowerCase()}.`;
}

function buildImagePrompt(title, poemText) {
  const motifs = poemText.slice(0, 6).join("; ");
  return `A poetic vintage Cello Cool Club card for "${title}", inspired by these motifs: ${motifs}. Portrait playing-card composition, tactile old paper, theatrical golden light, intimate symbolic scene, no readable text, no typography, collectible handmade card feeling.`;
}

function buildSunoPrompt(title) {
  return `Intimate chamber chanson for "${title}" with expressive cello, soft piano, brushed percussion, warm spoken-sung vocal, poetic European mood, slow tempo, cinematic but human.`;
}

function buildAltText(title) {
  return `Poetic card artwork for ${title}.`;
}
