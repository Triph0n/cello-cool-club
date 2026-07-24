import fs from "node:fs/promises";
import path from "node:path";
import { loadLocalEnv, readCards } from "./card-utils.mjs";
import { findCard, parseArgs } from "./release-utils.mjs";
import { attachAudioToCard } from "./card-workflow.mjs";

// Suno blocks API/agent automation, so MP3s are downloaded by hand (or by a
// UI-clicking agent) from the logged-in Suno workspace into the Downloads
// folder. This script pairs those files with cards that still miss audio and
// attaches them via the regular attach-audio workflow.

await loadLocalEnv();

const args = parseArgs(process.argv.slice(2));
const downloadsDir = process.env.SUNO_DOWNLOADS_PATH
  || path.join(process.env.USERPROFILE || process.env.HOME || "", "Downloads");

const HIGH_CONFIDENCE = 0.75;
const STOP_WORDS = new Set(["the", "a", "an", "of", "and", "la", "le", "les", "un", "une", "de", "du"]);

if (args.card && args.file) {
  const filePath = path.isAbsolute(String(args.file))
    ? String(args.file)
    : path.join(downloadsDir, String(args.file));
  const card = await attachAudioToCard(String(args.card), filePath);
  console.log(`Attached ${filePath} to card ${card.id} (${card.title}), status: ${card.status}.`);
  process.exit(0);
}

const cards = await readCards();
const needsAudio = cards.filter((card) => !card.audio && card.title);

if (needsAudio.length === 0) {
  console.log("Every card already has audio. Nothing to match.");
  process.exit(0);
}

let entries;
try {
  entries = await fs.readdir(downloadsDir);
} catch {
  console.error(`Downloads folder not found: ${downloadsDir} (set SUNO_DOWNLOADS_PATH in .env).`);
  process.exit(1);
}

const mp3Files = [];
for (const name of entries) {
  if (!name.toLowerCase().endsWith(".mp3")) continue;
  const fullPath = path.join(downloadsDir, name);
  const stat = await fs.stat(fullPath);
  if (stat.isFile()) mp3Files.push({ name, fullPath, mtime: stat.mtimeMs });
}

if (mp3Files.length === 0) {
  console.log(`No .mp3 files found in ${downloadsDir}.`);
  process.exit(0);
}

const proposals = mp3Files
  .map((file) => {
    const fileTokens = tokenize(path.basename(file.name, path.extname(file.name)).replace(/\s*\(\d+\)$/, ""));
    let best = null;
    let second = null;

    for (const card of needsAudio) {
      const score = scoreMatch(fileTokens, tokenize(card.title));
      if (!best || score > best.score) {
        second = best;
        best = { card, score };
      } else if (!second || score > second.score) {
        second = { card, score };
      }
    }

    const ambiguous = Boolean(best && second && best.score - second.score < 0.1 && second.score > 0.4);
    return { ...file, best, ambiguous };
  })
  .filter((proposal) => proposal.best && proposal.best.score > 0.3)
  .sort((a, b) => b.best.score - a.best.score);

if (proposals.length === 0) {
  console.log(`No filename in ${downloadsDir} resembles a card title that still needs audio.`);
  process.exit(0);
}

// When several files point at the same card equally well (Suno renders two
// takes per prompt), keep the newest download and demote the rest.
const claimed = new Map();
for (const proposal of proposals) {
  const key = proposal.best.card.id;
  const holder = claimed.get(key);
  if (!holder) {
    claimed.set(key, proposal);
  } else if (proposal.best.score > holder.best.score
    || (proposal.best.score === holder.best.score && proposal.mtime > holder.mtime)) {
    holder.duplicateOf = key;
    claimed.set(key, proposal);
  } else {
    proposal.duplicateOf = key;
  }
}

console.log(`Cards without audio: ${needsAudio.length}. MP3 files scanned: ${mp3Files.length} in ${downloadsDir}.\n`);

const attachable = [];
for (const proposal of proposals) {
  const { name, best, ambiguous, duplicateOf } = proposal;
  const label = `${best.card.id} ${best.card.title}`;
  if (duplicateOf) {
    console.log(`  dup   ${name} -> ${label} (${best.score.toFixed(2)}) — another file matched this card better/newer`);
  } else if (ambiguous || best.score < HIGH_CONFIDENCE) {
    console.log(`  LOW   ${name} -> ${label} (${best.score.toFixed(2)})${ambiguous ? " — ambiguous" : ""}`);
  } else {
    console.log(`  HIGH  ${name} -> ${label} (${best.score.toFixed(2)})`);
    attachable.push(proposal);
  }
}

if (!args.confirm) {
  console.log(`\nDry run. ${attachable.length} high-confidence match(es).`);
  console.log("Attach them with:  npm run match-audio -- --confirm");
  console.log("Manual pairing:    npm run match-audio -- --card <id|slug> --file \"Song.mp3\"");
  process.exit(0);
}

for (const proposal of attachable) {
  const card = await attachAudioToCard(proposal.best.card.id, proposal.fullPath);
  console.log(`Attached ${proposal.name} -> card ${card.id} (${card.title}), status: ${card.status}.`);
}

console.log(`\nAttached ${attachable.length} file(s).`);

function tokenize(value) {
  return new Set(
    String(value)
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((token) => token && !STOP_WORDS.has(token))
  );
}

function scoreMatch(fileTokens, titleTokens) {
  if (fileTokens.size === 0 || titleTokens.size === 0) return 0;

  const intersection = [...fileTokens].filter((token) => titleTokens.has(token)).length;
  if (intersection === 0) return 0;

  const union = new Set([...fileTokens, ...titleTokens]).size;
  const jaccard = intersection / union;

  if (intersection === fileTokens.size && intersection === titleTokens.size) return 1;
  if (intersection === fileTokens.size || intersection === titleTokens.size) {
    return 0.6 + 0.4 * jaccard;
  }
  return jaccard;
}
