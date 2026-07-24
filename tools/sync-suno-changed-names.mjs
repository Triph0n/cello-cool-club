import { copyFile, readFile, writeFile } from "node:fs/promises";

const publicSource =
  "C:/Users/Vladimir/Documents/CelloCoolClub/assets/text/AllEnglishTexts.md";
const reportFile =
  "C:/Users/Vladimir/Documents/CelloCoolClub/assets/text/zmenena-ceska-jmena.md";
const desktopSource =
  "C:/Users/Vladimir/Documents/CelloCoolClub/poems/PrevertFableEnglish.md";
const engineSource =
  "C:/Users/Vladimir/Documents/CelloCoolClub/engine/data/clean-sources/prevert_fable_english.md";
const cardsFile =
  "C:/Users/Vladimir/Documents/CelloCoolClub/engine/data/cards.json";
const backupSuffix = ".bak-changed-names-2026-07-24";

function normalizedTitle(value) {
  return value.trim().toUpperCase();
}

function parseSections(content) {
  const matches = [
    ...content.matchAll(/^##\s+([^.]+)\.\s+(.+)$/gm),
  ];
  const sections = new Map();

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const headingStart = match.index;
    const headingEnd = headingStart + match[0].length;
    const sectionEnd =
      index + 1 < matches.length ? matches[index + 1].index : content.length;
    sections.set(normalizedTitle(match[2]), {
      number: match[1].trim(),
      heading: match[0],
      headingStart,
      headingEnd,
      sectionEnd,
      body: content.slice(headingEnd, sectionEnd),
    });
  }

  return sections;
}

function replaceSections(targetContent, sourceSections, titles) {
  const targetSections = parseSections(targetContent);
  const eol = targetContent.includes("\r\n") ? "\r\n" : "\n";
  const replacements = [];

  for (const title of titles) {
    const source = sourceSections.get(title);
    if (!source) {
      throw new Error(`Missing public source section: ${title}`);
    }

    const target = targetSections.get(title);
    if (target) {
      replacements.push({
        start: target.headingEnd,
        end: target.sectionEnd,
        text: source.body.replace(/\r?\n/g, eol),
      });
      continue;
    }

    if (title !== "THE BELL") {
      throw new Error(`Missing target section: ${title}`);
    }

    const separator = targetContent.endsWith(eol) ? "" : eol;
    replacements.push({
      start: targetContent.length,
      end: targetContent.length,
      text:
        separator +
        eol +
        "## 620. THE BELL" +
        source.body.replace(/\r?\n/g, eol),
    });
  }

  replacements.sort((left, right) => right.start - left.start);
  let result = targetContent;
  for (const replacement of replacements) {
    result =
      result.slice(0, replacement.start) +
      replacement.text +
      result.slice(replacement.end);
  }
  return result;
}

function poemLines(body) {
  const lines = body.replace(/\r/g, "").split("\n");
  while (lines.length && lines[0].trim() === "") lines.shift();
  while (lines.length && lines.at(-1).trim() === "") lines.pop();
  if (lines.at(-1)?.trim() === "---") lines.pop();
  while (lines.length && lines.at(-1).trim() === "") lines.pop();
  return lines;
}

const report = await readFile(reportFile, "utf8");
const titles = report
  .split(/\r?\n/)
  .filter((line) => /^\| \d+ /.test(line))
  .map((line) => normalizedTitle(line.split("|")[2]));

if (titles.length !== 18) {
  throw new Error(`Expected 18 report titles, found ${titles.length}`);
}

const publicText = await readFile(publicSource, "utf8");
const publicSections = parseSections(publicText);
const desktopText = await readFile(desktopSource, "utf8");
const engineText = await readFile(engineSource, "utf8");
const cardsText = await readFile(cardsFile, "utf8");

for (const path of [desktopSource, engineSource, cardsFile]) {
  await copyFile(path, path + backupSuffix);
}

const nextDesktop = replaceSections(desktopText, publicSections, titles);
const nextEngine = replaceSections(engineText, publicSections, titles);
await writeFile(desktopSource, nextDesktop, "utf8");
await writeFile(engineSource, nextEngine, "utf8");

const cards = JSON.parse(cardsText);
const updatedCards = [];
const missingCards = [];

for (const title of titles) {
  const card = cards.find(
    (candidate) => normalizedTitle(String(candidate.title)) === title,
  );
  if (!card) {
    missingCards.push(title);
    continue;
  }
  card.poemText = poemLines(publicSections.get(title).body);
  updatedCards.push(`${card.id} ${card.title}`);
}

const cardsEol = cardsText.includes("\r\n") ? "\r\n" : "\n";
const nextCards = JSON.stringify(cards, null, 2).replace(/\n/g, cardsEol) + cardsEol;
await writeFile(cardsFile, nextCards, "utf8");

console.log(`Synced desktop sections: ${titles.length}`);
console.log(`Synced engine sections: ${titles.length}`);
console.log(`Updated existing cards: ${updatedCards.length}`);
console.log(updatedCards.join("\n"));
console.log(`Missing cards to import: ${missingCards.length}`);
console.log(missingCards.join("\n"));
