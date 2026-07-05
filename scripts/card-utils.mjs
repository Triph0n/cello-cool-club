import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const engineRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const defaultSitePath = path.resolve(engineRoot, "..", "CelloCoolClub");
export const cardsPath = path.join(engineRoot, "data", "cards.json");

export const allowedStatuses = new Set([
  "idea",
  "draft",
  "image_ready",
  "music_needed",
  "ready_for_review",
  "approved",
  "scheduled",
  "posted"
]);
export const publicStatuses = new Set(["posted"]);
export const baseRequiredFields = [
  "id",
  "number",
  "slug",
  "title",
  "status"
];
export const reviewRequiredFields = ["season", "language", "poemText", "shortCaption", "image", "audio", "altText"];
export const reviewStatuses = new Set(["ready_for_review", "approved", "scheduled", "posted"]);

export async function readCards() {
  const raw = await fs.readFile(cardsPath, "utf8");
  return JSON.parse(raw);
}

export async function writeCards(cards) {
  const payload = `${JSON.stringify(sortCards(cards), null, 2)}\n`;
  const tempPath = `${cardsPath}.tmp`;

  try {
    await fs.copyFile(cardsPath, `${cardsPath}.bak`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  await fs.writeFile(tempPath, payload, "utf8");
  await fs.rename(tempPath, cardsPath);
}

export async function loadLocalEnv() {
  const envPath = path.join(engineRoot, ".env");

  try {
    const raw = await fs.readFile(envPath, "utf8");
    raw.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) return;

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^"|"$/g, "");
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

export function getSitePath() {
  return process.env.PUBLIC_SITE_PATH || defaultSitePath;
}

export function getPublicSiteUrl() {
  return process.env.PUBLIC_SITE_URL || "";
}

export function getArchivePath(card) {
  return card.archiveUrl || `cards/${card.id}-${card.slug}/`;
}

export function getArchiveUrl(card) {
  return toAbsoluteUrl(getArchivePath(card));
}

export function toAbsoluteUrl(relativePath) {
  const publicSiteUrl = getPublicSiteUrl();

  if (!publicSiteUrl) return relativePath;

  return new URL(relativePath, publicSiteUrl.endsWith("/") ? publicSiteUrl : `${publicSiteUrl}/`).toString();
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function toPublicCard(card) {
  return {
    id: card.id,
    number: card.number,
    slug: card.slug,
    title: card.title,
    season: card.season,
    language: card.language,
    poemText: card.poemText,
    shortCaption: card.shortCaption,
    image: card.image,
    audio: card.audio,
    altText: card.altText,
    publishAt: card.publishAt,
    archiveUrl: getArchivePath(card)
  };
}

export function sortCards(cards) {
  return [...cards].sort((a, b) => Number(a.number) - Number(b.number));
}

export function slugify(value) {
  const slug = String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || "untitled-card";
}

export function nextCardNumber(cards) {
  return cards.reduce((max, card) => Math.max(max, Number(card.number) || 0), 0) + 1;
}

export function formatCardId(number) {
  return String(number).padStart(3, "0");
}

export function validateCards(cards) {
  const errors = [];
  const ids = new Set();
  const slugs = new Set();

  if (!Array.isArray(cards)) {
    return ["cards.json must contain an array."];
  }

  cards.forEach((card, index) => {
    const label = card?.id || `row ${index + 1}`;

    if (!card || typeof card !== "object") {
      errors.push(`${label}: card must be an object.`);
      return;
    }

    baseRequiredFields.forEach((field) => {
      const value = card[field];
      if (value === undefined || value === null || value === "") {
        errors.push(`${label}: missing required field "${field}".`);
      }
    });

    if (card.id) {
      if (ids.has(card.id)) errors.push(`${label}: duplicate id "${card.id}".`);
      ids.add(card.id);
    }
    if (card.slug) {
      if (slugs.has(card.slug)) errors.push(`${label}: duplicate slug "${card.slug}".`);
      slugs.add(card.slug);
    }

    if (!Number.isInteger(card.number) || card.number < 1) {
      errors.push(`${label}: number must be a positive integer.`);
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(card.slug || "")) {
      errors.push(`${label}: slug must use lowercase letters, numbers, and hyphens.`);
    }

    if (!allowedStatuses.has(card.status)) {
      errors.push(`${label}: unknown status "${card.status}".`);
    }

    if (card.poemText !== undefined && !Array.isArray(card.poemText)) {
      errors.push(`${label}: poemText must be an array.`);
    }

    if (reviewStatuses.has(card.status)) {
      reviewRequiredFields.forEach((field) => {
        const value = card[field];
        const missingArray = Array.isArray(value) && value.length === 0;
        if (value === undefined || value === null || value === "" || missingArray) {
          errors.push(`${label}: ${card.status} cards require "${field}".`);
        }
      });
    }

    if (card.status === "posted" && !card.publishAt) {
      errors.push(`${label}: posted cards should have publishAt.`);
    }
  });

  return errors;
}
