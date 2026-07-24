import fs from "node:fs";
import path from "node:path";
import { engineRoot, readCards } from "./card-utils.mjs";

const batchesDir = path.join(engineRoot, "exports", "suno", "batches");
const batchFiles = fs.existsSync(batchesDir)
  ? fs.readdirSync(batchesDir).filter((file) => file.endsWith(".json"))
  : [];

const cards = await readCards();
const cardsById = new Map(cards.map((card) => [card.id, card]));
const failures = [];

if (batchFiles.length === 0) {
  failures.push("No Suno batch files found.");
}

for (const file of batchFiles) {
  const batchPath = path.join(batchesDir, file);
  const batch = JSON.parse(fs.readFileSync(batchPath, "utf8"));

  if (batch.errors?.length) {
    failures.push(`${file}: batch has ${batch.errors.length} error(s): ${JSON.stringify(batch.errors)}`);
  }

  if (batch.count !== batch.packets?.length) {
    failures.push(`${file}: count=${batch.count} but packets.length=${batch.packets?.length}`);
  }

  const tempoFamilies = new Set();
  let slowPromptCount = 0;

  for (const packet of batch.packets || []) {
    const label = `${file} ${packet.cardId || "unknown"}`;
    const card = cardsById.get(packet.cardId);
    const tempoFamily = classifyTempoFamily(packet.stylePrompt || "");
    tempoFamilies.add(tempoFamily);
    if (tempoFamily === "slow") slowPromptCount += 1;

    if (!card) failures.push(`${label}: missing card in data/cards.json`);
    if (card && card.title !== packet.title) {
      failures.push(`${label}: card title "${card.title}" does not match packet title "${packet.title}"`);
    }
    if (!packet.songTitle) failures.push(`${label}: missing songTitle`);
    if (!packet.lyrics?.trim()) failures.push(`${label}: missing lyrics`);
    if (!packet.stylePrompt?.trim()) failures.push(`${label}: missing stylePrompt`);
    if ((packet.lyrics || "").length > 5000) failures.push(`${label}: lyrics too long (${packet.lyrics.length})`);
    if ((packet.stylePrompt || "").length > 1000) failures.push(`${label}: stylePrompt too long (${packet.stylePrompt.length})`);
    if (/\badapt harmony, dynamics, and arrangement\b/i.test(packet.stylePrompt || "")) {
      failures.push(`${label}: generic fallback style prompt is still present`);
    }

    for (const [kind, filePath] of Object.entries(packet.files || {})) {
      if (!fs.existsSync(filePath)) failures.push(`${label}: missing ${kind} file: ${filePath}`);
    }
  }

  if ((batch.packets || []).length >= 6 && tempoFamilies.size < 3) {
    failures.push(`${file}: tempo variety too narrow (${[...tempoFamilies].join(", ")})`);
  }

  if ((batch.packets || []).length >= 6 && slowPromptCount > Math.ceil(batch.packets.length / 2)) {
    failures.push(`${file}: too many slow prompts (${slowPromptCount}/${batch.packets.length})`);
  }
}

if (failures.length > 0) {
  console.error("Suno batch test failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Suno batch test passed: ${batchFiles.length} batch file(s), ${cards.length} card(s).`);

function classifyTempoFamily(stylePrompt) {
  const text = stylePrompt.toLowerCase();
  if (/\b(tempo|swing|foxtrot|waltz|bolero|shuffle|pulse|groove|ballad)\b/.test(text) === false) return "unspecified";
  if (/\b(uptempo|upbeat|brisk|medium-fast)\b/.test(text)) return "fast";
  if (/\b(3\/4|waltz)\b/.test(text)) return "waltz";
  if (/\bbolero\b/.test(text)) return "bolero";
  if (/\b(jump-blues|gospel-blues|shuffle)\b/.test(text)) return "blues";
  if (/\bnoir\b/.test(text)) return "noir";
  if (/\brolling|travel\b/.test(text)) return "travel";
  if (/\b(slow torch|slow ballad)\b/.test(text)) return "slow";
  if (/\bluminous swing\b/.test(text)) return "luminous";
  if (/\bmedium\b/.test(text)) return "medium";
  return "other";
}
