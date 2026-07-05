import fs from "node:fs/promises";
import path from "node:path";
import {
  getSitePath,
  loadLocalEnv,
  readCards,
  sortCards,
  validateCards,
  writeCards
} from "./card-utils.mjs";
import { findCard, parseArgs, releaseReadinessProblems, selectNextRelease } from "./release-utils.mjs";
import { buildGenericSocialPost, buildLinkFacets } from "./social-utils.mjs";

const MAX_BLOB_BYTES = 950_000;

const options = parseArgs(process.argv.slice(2));
await loadLocalEnv();

const cards = await readCards();
const errors = validateCards(cards);

if (errors.length > 0) {
  console.error("Bluesky publish stopped because validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const card = chooseCard(cards, options);

if (!card) {
  console.error("No card found. Use npm run publish-bluesky -- 001, or --next.");
  process.exit(1);
}

const problems = releaseReadinessProblems(card).filter((problem) => problem !== "card is already posted");

if (problems.length > 0) {
  console.error(`Card ${card.id} is not ready for Bluesky publishing:`);
  problems.forEach((problem) => console.error(`- ${problem}`));
  process.exit(1);
}

const socialPost = buildGenericSocialPost(card);
const pds = (process.env.BLUESKY_PDS || "https://bsky.social").replace(/\/$/, "");
const imagePath = path.join(getSitePath(), card.image);
const facets = buildLinkFacets(socialPost.text);
const postRecord = {
  "$type": "app.bsky.feed.post",
  text: socialPost.text,
  langs: [card.language || "en"],
  createdAt: new Date().toISOString()
};

if (facets.length > 0) postRecord.facets = facets;

if (!options.confirm) {
  console.log(`Bluesky dry run for ${card.id} - ${card.title}`);
  console.log(`PDS: ${pds}`);
  console.log(`Image: ${imagePath} (resized automatically if over ~1 MB)`);
  if (card.postedUrls?.bluesky) {
    console.log(`Already posted: ${card.postedUrls.bluesky} (use --force to post again)`);
  }
  console.log("");
  console.log(socialPost.text);
  console.log("");
  console.log("Run again with --confirm to create a real Bluesky post.");
  process.exit(0);
}

if (card.postedUrls?.bluesky && !options.force) {
  console.error(`Card ${card.id} was already posted to Bluesky: ${card.postedUrls.bluesky}`);
  console.error("Use --confirm --force to post it again on purpose.");
  process.exit(1);
}

const identifier = process.env.BLUESKY_IDENTIFIER;
const password = process.env.BLUESKY_APP_PASSWORD;

if (!identifier || !password) {
  console.error("BLUESKY_IDENTIFIER and BLUESKY_APP_PASSWORD are required in .env or environment.");
  process.exit(1);
}

const session = await createSession({ pds, identifier, password });
const preparedImage = await prepareBlueskyImage(imagePath);
const blob = await uploadImage({ pds, accessJwt: session.accessJwt, preparedImage });
const embedImage = {
  alt: card.altText,
  image: blob
};

if (preparedImage.width && preparedImage.height) {
  embedImage.aspectRatio = {
    width: preparedImage.width,
    height: preparedImage.height
  };
}

postRecord.embed = {
  "$type": "app.bsky.embed.images",
  images: [embedImage]
};

const result = await createRecord({
  pds,
  accessJwt: session.accessJwt,
  repo: session.did || session.handle || identifier,
  record: postRecord
});

card.postedUrls = card.postedUrls || {};
card.postedUrls.bluesky = atUriToBlueskyUrl(result.uri, session.handle || identifier);
card.blueskyPost = {
  uri: result.uri,
  cid: result.cid,
  postedAt: postRecord.createdAt
};

await writeCards(sortCards(cards));

console.log(`Posted to Bluesky for ${card.id} - ${card.title}`);
console.log(card.postedUrls.bluesky);

function chooseCard(cards, options) {
  if (options.id) return findCard(cards, options.id);
  if (options._?.length > 0) return findCard(cards, options._[0]);
  if (options.next) return selectNextRelease(cards);

  return sortCards(cards)
    .filter((candidate) => candidate.status === "posted")
    .at(-1);
}

async function createSession({ pds, identifier, password }) {
  const response = await fetch(`${pds}/xrpc/com.atproto.server.createSession`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password })
  });

  return readJsonResponse(response, "createSession");
}

async function uploadImage({ pds, accessJwt, preparedImage }) {
  const response = await fetch(`${pds}/xrpc/com.atproto.repo.uploadBlob`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessJwt}`,
      "Content-Type": preparedImage.mimeType
    },
    body: preparedImage.buffer
  });

  const payload = await readJsonResponse(response, "uploadBlob");
  return payload.blob;
}

async function prepareBlueskyImage(imagePath) {
  const original = await fs.readFile(imagePath);
  let sharp = null;

  try {
    sharp = (await import("sharp")).default;
  } catch {
    sharp = null;
  }

  if (!sharp) {
    if (original.byteLength > MAX_BLOB_BYTES) {
      throw new Error(
        `Image is ${Math.round(original.byteLength / 1024)} KB, over the Bluesky blob limit. Run "npm install" so sharp can resize it automatically.`
      );
    }
    return { buffer: original, mimeType: getImageMimeType(imagePath), width: null, height: null };
  }

  if (original.byteLength <= MAX_BLOB_BYTES) {
    const metadata = await sharp(original).metadata();
    return {
      buffer: original,
      mimeType: getImageMimeType(imagePath),
      width: metadata.width || null,
      height: metadata.height || null
    };
  }

  const attempts = [
    { size: 2000, quality: 85 },
    { size: 2000, quality: 75 },
    { size: 1600, quality: 75 },
    { size: 1600, quality: 65 },
    { size: 1200, quality: 65 },
    { size: 1000, quality: 60 }
  ];

  for (const attempt of attempts) {
    const candidate = await sharp(original)
      .rotate()
      .resize({ width: attempt.size, height: attempt.size, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: attempt.quality, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });

    if (candidate.data.byteLength <= MAX_BLOB_BYTES) {
      console.log(
        `Image resized for Bluesky: ${candidate.info.width}x${candidate.info.height}, ${Math.round(candidate.data.byteLength / 1024)} KB.`
      );
      return {
        buffer: candidate.data,
        mimeType: "image/jpeg",
        width: candidate.info.width,
        height: candidate.info.height
      };
    }
  }

  throw new Error("Could not compress the image under the Bluesky blob limit. Use a smaller source image.");
}

async function createRecord({ pds, accessJwt, repo, record }) {
  const response = await fetch(`${pds}/xrpc/com.atproto.repo.createRecord`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessJwt}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      repo,
      collection: "app.bsky.feed.post",
      record
    })
  });

  return readJsonResponse(response, "createRecord");
}

async function readJsonResponse(response, label) {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`${label} failed with HTTP ${response.status}: ${JSON.stringify(payload)}`);
  }

  return payload;
}

function getImageMimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  return "image/png";
}

function atUriToBlueskyUrl(uri, handle) {
  const rkey = uri.split("/").at(-1);
  return `https://bsky.app/profile/${handle}/post/${rkey}`;
}
