import { copyFile, readFile, writeFile } from "node:fs/promises";

const reportFile =
  "C:/Users/Vladimir/Documents/CelloCoolClub/assets/text/zmenena-ceska-jmena.md";
const cardsFile =
  "C:/Users/Vladimir/Documents/CelloCoolClub/engine/data/cards.json";
const backupFile =
  "C:/Users/Vladimir/Documents/CelloCoolClub/engine/data/cards.json.bak-single-voice-2026-07-24";
const requiredRule = "single lead voice, no choir, no backing vocals";

const report = await readFile(reportFile, "utf8");
const titles = report
  .split(/\r?\n/)
  .filter((line) => /^\| \d+ /.test(line))
  .map((line) => line.split("|")[2].trim().toLowerCase());

const cardsText = await readFile(cardsFile, "utf8");
const cards = JSON.parse(cardsText);
const updated = [];

for (const title of titles) {
  const card = cards.find(
    (candidate) => String(candidate.title).toLowerCase() === title,
  );
  if (!card) throw new Error(`Missing card: ${title}`);
  if (card.sunoPrompt.toLowerCase().includes("single lead voice")) continue;
  card.sunoPrompt = `${card.sunoPrompt.replace(/[.\s]+$/, "")}, ${requiredRule}.`;
  updated.push(`${card.id} ${card.title}`);
}

await copyFile(cardsFile, backupFile);
const eol = cardsText.includes("\r\n") ? "\r\n" : "\n";
await writeFile(
  cardsFile,
  JSON.stringify(cards, null, 2).replace(/\n/g, eol) + eol,
  "utf8",
);

console.log(`Updated prompts: ${updated.length}`);
console.log(updated.join("\n"));
