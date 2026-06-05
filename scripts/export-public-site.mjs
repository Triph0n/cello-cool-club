import fs from "node:fs/promises";
import path from "node:path";
import {
  escapeHtml,
  getSitePath,
  publicStatuses,
  readCards,
  sortCards,
  toPublicCard,
  validateCards
} from "./card-utils.mjs";
import { formatCardNumber, renderCardPage, renderPoemLines } from "./renderers.mjs";

const sitePath = getSitePath();
const cards = sortCards(await readCards());
const errors = validateCards(cards);

if (errors.length > 0) {
  console.error("Export stopped because card validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const publicCards = cards.filter((card) => publicStatuses.has(card.status)).map(toPublicCard);

if (publicCards.length === 0) {
  console.error("No public cards found. Mark at least one card as posted before exporting.");
  process.exit(1);
}

await fs.mkdir(path.join(sitePath, "data"), { recursive: true });
await fs.mkdir(path.join(sitePath, "cards"), { recursive: true });
await fs.writeFile(
  path.join(sitePath, "data", "cards.json"),
  `${JSON.stringify(publicCards, null, 2)}\n`,
  "utf8"
);

await fs.writeFile(path.join(sitePath, "index.html"), renderHomepage(publicCards.at(-1), publicCards), "utf8");
await fs.writeFile(path.join(sitePath, "cards", "index.html"), renderArchive(publicCards), "utf8");

for (const card of publicCards) {
  const cardDir = path.join(sitePath, "cards", `${card.id}-${card.slug}`);
  await fs.mkdir(cardDir, { recursive: true });
  await fs.writeFile(path.join(cardDir, "index.html"), renderCardPage(card, publicCards), "utf8");
}

console.log(`Exported ${publicCards.length} public card(s) to ${sitePath}.`);

function assetPathFromArchive(asset) {
  return `../${asset}`;
}

function formatNumber(card) {
  return formatCardNumber(card);
}

function renderHomepage(card, cards) {
  const latestPath = `cards/${card.id}-${card.slug}/`;
  return `<!doctype html>
<html lang="${escapeHtml(card.language)}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Cello Cool Club | ${escapeHtml(card.title)}</title>
    <meta name="description" content="${escapeHtml(card.shortCaption)}">
    <meta property="og:title" content="Cello Cool Club | ${escapeHtml(card.title)}">
    <meta property="og:description" content="${escapeHtml(card.shortCaption)}">
    <meta property="og:image" content="${escapeHtml(card.image)}">
    <link rel="stylesheet" href="styles.css">
    <style>
      .home-links {
        position: fixed;
        right: 16px;
        bottom: 14px;
        z-index: 20;
        display: flex;
        gap: 10px;
        align-items: center;
        padding: 8px 10px;
        border: 1px solid rgba(197, 160, 89, 0.55);
        border-radius: 8px;
        background: rgba(18, 9, 4, 0.78);
        color: var(--paper);
        font-size: 13px;
      }

      .home-links a {
        color: var(--gold-bright);
        text-decoration: none;
      }

      .card-meta {
        margin: 0 0 4px;
        color: var(--gold-dark);
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }
    </style>
  </head>
  <body>
    <main class="card-stage" aria-label="${escapeHtml(card.title)} poem card">
      <header class="club-sign" aria-label="Cello Cool Club">
        <span class="sign-dot" aria-hidden="true"></span>
        <span>Cello Cool Club</span>
        <span class="sign-dot" aria-hidden="true"></span>
      </header>

      <article class="playing-card">
        <button class="art-button" type="button" data-open-image aria-label="Enlarge artwork">
          <img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.altText)}">
        </button>

        <div class="play-medallion" data-player="${escapeHtml(card.language)}">
          <button class="gramophone-button" type="button" aria-label="Play ${escapeHtml(card.title)}" data-action="play" data-target="audio-${escapeHtml(card.id)}">
            <span class="gramophone-icon" aria-hidden="true">
              <img src="assets/images/gramo.png" alt="">
            </span>
          </button>
          <audio id="audio-${escapeHtml(card.id)}" preload="metadata" src="${escapeHtml(card.audio)}"></audio>
        </div>

        <section class="poem-card-body" aria-labelledby="poem-title">
          <p class="card-meta">${escapeHtml(formatNumber(card))} / ${escapeHtml(card.season)}</p>
          <h1 id="poem-title">${escapeHtml(card.title)}</h1>
          <div class="poem-lines">
${renderPoemLines(card)}
          </div>
        </section>
      </article>
    </main>

    <nav class="home-links" aria-label="Cello Cool Club links">
      <a href="${latestPath}">Latest card</a>
      <a href="cards/">Archive (${cards.length})</a>
    </nav>

    <dialog class="image-dialog" data-image-dialog aria-label="Enlarged artwork">
      <button class="close-dialog" type="button" data-close-image aria-label="Close artwork">x</button>
      <img src="${escapeHtml(card.image)}" alt="Enlarged ${escapeHtml(card.altText)}">
    </dialog>

    <script src="script.js"></script>
  </body>
</html>
`;
}

function renderArchive(cards) {
  const cardLinks = cards
    .map((card) => {
      const href = `${card.id}-${card.slug}/`;
      return `        <a class="archive-card" href="${href}">
          <img src="${escapeHtml(assetPathFromArchive(card.image))}" alt="${escapeHtml(card.altText)}">
          <span class="archive-number">${escapeHtml(formatNumber(card))}</span>
          <strong>${escapeHtml(card.title)}</strong>
          <span>${escapeHtml(card.season)}</span>
        </a>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Cards | Cello Cool Club</title>
    <meta name="description" content="The Cello Cool Club card archive.">
    <link rel="stylesheet" href="../styles.css">
    <style>
      html,
      body {
        min-height: 100%;
        height: auto;
        overflow: auto;
      }

      .archive-page {
        width: min(1040px, calc(100% - 32px));
        min-height: 100dvh;
        margin: 0 auto;
        padding: 28px 0 44px;
      }

      .archive-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
      }

      .archive-top a {
        color: var(--paper-light);
        text-decoration: none;
      }

      .archive-title {
        margin: 0;
        color: var(--paper-light);
        font-family: var(--font-header);
        font-size: clamp(34px, 7vw, 74px);
        line-height: 0.95;
      }

      .archive-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
        gap: 18px;
      }

      .archive-card {
        display: grid;
        gap: 8px;
        padding: 12px;
        border: 1px solid rgba(197, 160, 89, 0.62);
        border-radius: 8px;
        color: var(--paper-light);
        background: rgba(18, 9, 4, 0.62);
        text-decoration: none;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
      }

      .archive-card img {
        width: 100%;
        aspect-ratio: 4 / 5;
        display: block;
        object-fit: cover;
        border-radius: 5px;
      }

      .archive-card strong {
        color: var(--gold-bright);
        font-family: var(--font-header);
        font-size: 24px;
      }

      .archive-number {
        color: var(--gold);
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.16em;
      }
    </style>
  </head>
  <body>
    <main class="archive-page">
      <header class="archive-top">
        <h1 class="archive-title">Cards</h1>
        <a href="../">Cello Cool Club</a>
      </header>
      <section class="archive-grid" aria-label="Card archive">
${cardLinks}
      </section>
    </main>
  </body>
</html>
`;
}
