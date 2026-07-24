import fs from "node:fs/promises";
import path from "node:path";
import { engineRoot } from "./card-utils.mjs";
import { buildSunoPrompt } from "./card-workflow.mjs";

export async function exportSunoPacket(card) {
  if (!card?.sunoPrompt) {
    throw new Error(`Card ${card?.id || "unknown"} does not have sunoPrompt.`);
  }

  const outputDir = path.join(engineRoot, "exports", "suno");
  const baseName = `${card.id}-${card.slug}`;
  const promptPath = path.join(outputDir, `${baseName}.txt`);
  const lyricsPath = path.join(outputDir, `${baseName}-lyrics.txt`);
  const packetPath = path.join(outputDir, `${baseName}.md`);
  const jsonPath = path.join(outputDir, `${baseName}.json`);
  const packet = buildSunoPacket(card);

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(promptPath, `${packet.stylePrompt}\n`, "utf8");
  await fs.writeFile(lyricsPath, `${packet.lyrics}\n`, "utf8");
  await fs.writeFile(packetPath, renderSunoPacket(card), "utf8");
  await fs.writeFile(jsonPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");

  return {
    ...packet,
    files: {
      stylePrompt: promptPath,
      lyrics: lyricsPath,
      markdown: packetPath,
      json: jsonPath
    }
  };
}

export async function exportSunoBatch({ sourceFile, range, language, packets, errors = [] }) {
  const outputDir = path.join(engineRoot, "exports", "suno", "batches");
  const batchId = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonPath = path.join(outputDir, `${batchId}.json`);
  const batch = {
    batchId,
    sourceFile,
    range,
    language,
    targetUrl: "https://suno.com/create",
    count: packets.length,
    packets,
    errors,
    instructions: [
      "Process packets in order.",
      "For each packet, open Suno create page in the user's logged-in browser.",
      "Paste songTitle into the song title field.",
      "Paste lyrics into the lyrics field.",
      "Paste stylePrompt into the style or music description field.",
      "Press Create only after title, lyrics, and style are visibly filled.",
      "Move to the next packet only after Suno accepts the current create action."
    ]
  };

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(jsonPath, `${JSON.stringify(batch, null, 2)}\n`, "utf8");

  return {
    ...batch,
    files: {
      json: jsonPath
    }
  };
}

export function buildSunoPacket(card) {
  const lyrics = (card.poemText || []).join("\n");
  const stylePrompt = lyrics ? buildSunoPrompt(card.title, card.poemText || []) : card.sunoPrompt || "";

  return {
    cardId: card.id,
    slug: card.slug,
    title: card.title,
    songTitle: card.title,
    status: card.status,
    language: card.language,
    targetUrl: "https://suno.com/create",
    mode: "custom-song",
    stylePrompt,
    lyrics,
    instructions: [
      "Open Suno create page in the user's logged-in browser.",
      "Use custom song mode if Suno asks for a mode.",
      "Paste songTitle into the song title field.",
      "Paste lyrics into the lyrics field.",
      "Paste stylePrompt into the style or music description field.",
      "Press Create only after title, lyrics, and style are visibly filled."
    ]
  };
}

export function renderSunoPacket(card) {
  const packet = buildSunoPacket(card);

  return `# Suno Packet: ${packet.cardId} - ${packet.title}

## Style Prompt

\`\`\`text
${packet.stylePrompt}
\`\`\`

## Lyrics / Spoken Text

\`\`\`text
${packet.lyrics}
\`\`\`

## Notes

- Main language: ${packet.language}
- Current status: ${packet.status}
- After selecting final music, run:

\`\`\`text
npm run attach-audio -- ${packet.cardId} "C:\\path\\to\\selected-audio.mp3"
\`\`\`
`;
}
