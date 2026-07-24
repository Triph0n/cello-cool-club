import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  escapeHtml,
  getArchivePath,
  getPlayerPath,
  getPublicSiteUrl,
  getSitePath,
  isClubCard,
  isNoIndex,
  loadLocalEnv,
  publicStatuses,
  readCards,
  sortCards,
  toAbsoluteUrl,
  toPublicCard,
  validateCards
} from "./card-utils.mjs";
import {
  formatCardNumber,
  imageSizeAttrs,
  renderCardPage,
  renderJsonLd,
  renderPlayerPage,
  renderPoemLines,
  robotsMetaTag
} from "./renderers.mjs";

await loadLocalEnv();

const sitePath = getSitePath();
const cards = sortCards(await readCards());
const errors = validateCards(cards);

if (errors.length > 0) {
  console.error("Export stopped because card validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

// The club deck fills the browsable site (homepage, archive, RSS, sitemap).
// Kids deck cards only get QR player pages under p/<id>/ — no public listing.
const publicCards = cards.filter((card) => publicStatuses.has(card.status)).map(toPublicCard);
const clubCards = publicCards.filter(isClubCard);
const kidsCards = publicCards.filter((card) => !isClubCard(card));

if (clubCards.length === 0) {
  console.error("No public club cards found. Mark at least one club card as posted before exporting.");
  process.exit(1);
}

await attachImageDimensions(publicCards);

await fs.mkdir(path.join(sitePath, "data"), { recursive: true });
await fs.mkdir(path.join(sitePath, "cards"), { recursive: true });
await fs.writeFile(
  path.join(sitePath, "data", "cards.json"),
  `${JSON.stringify(publicCards, null, 2)}\n`,
  "utf8"
);

await fs.writeFile(path.join(sitePath, "index.html"), renderHomepage(clubCards.at(-1), clubCards), "utf8");
await fs.writeFile(path.join(sitePath, "cards", "index.html"), renderArchive(clubCards), "utf8");
await fs.writeFile(path.join(sitePath, "feed.xml"), renderRssFeed(clubCards), "utf8");
await fs.writeFile(path.join(sitePath, "robots.txt"), renderRobots(), "utf8");

if (getPublicSiteUrl() && !isNoIndex()) {
  await fs.writeFile(path.join(sitePath, "sitemap.xml"), renderSitemap(clubCards), "utf8");
} else {
  await fs.rm(path.join(sitePath, "sitemap.xml"), { force: true });
}

if (isNoIndex()) {
  console.warn("SITE_NOINDEX is on: robots.txt disallows crawling, pages carry noindex, no sitemap. Remove SITE_NOINDEX from .env before the official launch.");
} else if (!getPublicSiteUrl()) {
  console.warn("PUBLIC_SITE_URL is not set: og:image and RSS links stay relative, sitemap.xml and canonical/JSON-LD tags are skipped.");
}

for (const card of clubCards) {
  const cardDir = path.join(sitePath, "cards", `${card.id}-${card.slug}`);
  await fs.mkdir(cardDir, { recursive: true });
  await fs.writeFile(path.join(cardDir, "index.html"), renderCardPage(card, clubCards), "utf8");
}

for (const card of publicCards) {
  const playerDir = path.join(sitePath, ...getPlayerPath(card).split("/").filter(Boolean));
  await fs.mkdir(playerDir, { recursive: true });
  await fs.writeFile(path.join(playerDir, "index.html"), renderPlayerPage(card), "utf8");
}

console.log(`Exported ${clubCards.length} club card(s), ${kidsCards.length} kids card(s), ${publicCards.length} player page(s) to ${sitePath}.`);

function assetPathFromArchive(asset) {
  return `../${asset}`;
}

async function attachImageDimensions(cards) {
  for (const card of cards) {
    if (!card.image) continue;
    try {
      const { width, height } = await sharp(path.join(sitePath, card.image)).metadata();
      if (width && height) {
        card.imageWidth = width;
        card.imageHeight = height;
      }
    } catch {
      // Missing or unreadable image is reported by check-site; export keeps going.
    }
  }
}

function renderRobots() {
  if (isNoIndex()) {
    return "User-agent: *\nDisallow: /\n";
  }
  const lines = ["User-agent: *", "Allow: /"];
  if (getPublicSiteUrl()) {
    lines.push("", `Sitemap: ${toAbsoluteUrl("sitemap.xml")}`);
  }
  return `${lines.join("\n")}\n`;
}

function renderSitemap(cards) {
  const entries = [
    { loc: toAbsoluteUrl(""), lastmod: null },
    { loc: toAbsoluteUrl("cards/"), lastmod: null },
    ...cards.map((card) => {
      const publishDate = card.publishAt ? new Date(card.publishAt) : null;
      return {
        loc: toAbsoluteUrl(getArchivePath(card)),
        lastmod: publishDate && !Number.isNaN(publishDate.getTime())
          ? publishDate.toISOString().slice(0, 10)
          : null
      };
    })
  ]
    .map(({ loc, lastmod }) => `  <url>
    <loc>${escapeHtml(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}
  </url>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

function formatNumber(card) {
  return formatCardNumber(card);
}

function renderHomepage(card, cards) {
  const latestPath = `cards/${card.id}-${card.slug}/`;
  const siteDescription = "A small image, a short poem, a piece of music. Cello Cool Club reveals a new poem card every three days.";
  const hasPublicUrl = Boolean(getPublicSiteUrl());
  const canonicalTag = hasPublicUrl
    ? `\n    <link rel="canonical" href="${escapeHtml(toAbsoluteUrl(""))}">`
    : "";
  const homeJsonLd = hasPublicUrl
    ? `\n    ${renderJsonLd({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Cello Cool Club",
        url: toAbsoluteUrl(""),
        description: siteDescription
      })}`
    : "";
  return `<!doctype html>
<html lang="${escapeHtml(card.language)}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">${robotsMetaTag()}
    <title>Cello Cool Club — a new poem card every 3 days</title>
    <meta name="description" content="${escapeHtml(siteDescription)}">
    <meta property="og:title" content="Cello Cool Club">
    <meta property="og:description" content="${escapeHtml(siteDescription)}">
    <meta property="og:type" content="website">
    <meta property="og:image" content="${escapeHtml(toAbsoluteUrl(card.image))}">
    ${getPublicSiteUrl() ? `<meta property="og:url" content="${escapeHtml(toAbsoluteUrl(""))}">` : ""}
    <meta name="twitter:card" content="summary_large_image">${canonicalTag}
    <link rel="icon" href="assets/ccc-icon.ico">
    <link rel="apple-touch-icon" href="assets/ccc-logo.png">
    <link rel="alternate" type="application/rss+xml" title="Cello Cool Club" href="feed.xml">
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
    </style>${homeJsonLd}
  </head>
  <body>
    <main class="card-stage" aria-label="${escapeHtml(card.title)} poem card">
      <header class="club-sign" aria-label="Cello Cool Club">
        <span class="sign-dot" aria-hidden="true"></span>
        <span>Cello Cool Club</span>
        <span class="sign-dot" aria-hidden="true"></span>
      </header>

      <article class="playing-card${(card.poemText||[]).length>24?" playing-card--long":""}">
        <button class="art-button" type="button" data-open-image aria-label="Enlarge artwork">
          <img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.altText)}"${imageSizeAttrs(card)} decoding="async">
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
      <img src="${escapeHtml(card.image)}" alt="Enlarged ${escapeHtml(card.altText)}" decoding="async">
    </dialog>

    <script src="script.js"></script>
  </body>
</html>
`;
}

function renderRssFeed(cards) {
  const siteUrl = toAbsoluteUrl("");
  const items = [...cards]
    .reverse()
    .map((card) => {
      const link = toAbsoluteUrl(card.archiveUrl);
      const publishDate = card.publishAt ? new Date(card.publishAt) : null;
      const pubDate = publishDate && !Number.isNaN(publishDate.getTime())
        ? `\n      <pubDate>${publishDate.toUTCString()}</pubDate>`
        : "";
      const description = [card.shortCaption, "", ...(card.poemText || [])].join("\n").trim();

      return `    <item>
      <title>${escapeHtml(`${formatCardNumber(card)} - ${card.title}`)}</title>
      <link>${escapeHtml(link)}</link>
      <guid isPermaLink="false">cello-cool-club-${escapeHtml(card.id)}</guid>${pubDate}
      <description>${escapeHtml(description)}</description>
    </item>`;
    })
    .join("\n");

  const selfLink = getPublicSiteUrl()
    ? `\n    <atom:link href="${escapeHtml(toAbsoluteUrl("feed.xml"))}" rel="self" type="application/rss+xml"/>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Cello Cool Club</title>
    <link>${escapeHtml(siteUrl)}</link>
    <description>A small image, a short poem, a piece of music. A new card every few days.</description>
    <language>en</language>${selfLink}
${items}
  </channel>
</rss>
`;
}

function renderArchive(cards) {
  const cardLinks = cards
    .map((card) => {
      const href = `${card.id}-${card.slug}/`;
      return `        <a class="archive-card" href="${href}">
          <img src="${escapeHtml(assetPathFromArchive(card.image))}" alt="${escapeHtml(card.altText)}"${imageSizeAttrs(card)} loading="lazy" decoding="async">
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
    <meta name="viewport" content="width=device-width, initial-scale=1">${robotsMetaTag()}
    <title>Cards | Cello Cool Club</title>
    <meta name="description" content="The Cello Cool Club card archive.">
    ${getPublicSiteUrl() ? `<link rel="canonical" href="${escapeHtml(toAbsoluteUrl("cards/"))}">` : ""}
    <link rel="icon" href="../assets/ccc-icon.ico">
    <link rel="apple-touch-icon" href="../assets/ccc-logo.png">
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
