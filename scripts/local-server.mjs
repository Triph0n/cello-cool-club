import { createServer } from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || "127.0.0.1";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".png": "image/png",
};

const json = (response, status, body) => {
  response.writeHead(status, {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(body, null, 2));
};

const readBody = async (request) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
};

const decodeHtml = (value = "") =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const localAssetPath = (assetPath) => decodeHtml(assetPath).replace(/^(\.\.\/)+/, "");

const getMatch = (html, pattern, fallback = "") => {
  const match = html.match(pattern);
  return match ? decodeHtml(match[1].trim()) : fallback;
};

const getPreviewCard = async (slug) => {
  if (!/^\d{3}-[a-z0-9-]+$/.test(slug)) {
    throw new Error("Preview slug is not valid.");
  }

  const previewPath = path.join(root, "preview", slug, "index.html");
  const html = await fs.readFile(previewPath, "utf8");
  const title = getMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/);
  const description = getMatch(html, /<meta name="description" content="([^"]*)"/, `Morning card prepared: ${title}.`);
  const image = localAssetPath(getMatch(html, /<meta property="og:image" content="([^"]*)"/));
  const audio = localAssetPath(getMatch(html, /<audio[^>]*src="([^"]*)"/));
  const artAlt = getMatch(html, /<button class="art-button"[\s\S]*?<img[^>]*alt="([^"]*)"/, `Poetic card artwork for ${title}.`);
  const cardMeta = getMatch(html, /<p class="card-meta">([\s\S]*?)<\/p>/);
  const poemText = Array.from(html.matchAll(/<div class="poem-lines">([\s\S]*?)<\/div>/g))
    .at(0)?.[1]
    ?.match(/<p>([\s\S]*?)<\/p>/g)
    ?.map((line) => decodeHtml(line.replace(/<\/?p>/g, "").trim())) || [];

  const [rawNumber, rawSeason] = cardMeta.split("/").map((item) => item?.trim());
  const number = Number(rawNumber);

  if (!title || !number || !poemText.length || !image) {
    throw new Error("Preview card is missing title, number, poem text, or image.");
  }

  return {
    id: String(number).padStart(3, "0"),
    number,
    slug: slug.replace(/^\d{3}-/, ""),
    title,
    season: rawSeason || "Time & Rooms",
    language: "en",
    poemText,
    shortCaption: description,
    image,
    audio,
    altText: artAlt.replace(/^Poetic card artwork for /, "").replace(/\.$/, "."),
    publishAt: new Date().toISOString(),
    archiveUrl: `cards/${slug}/`,
  };
};

const readCards = async () => {
  const cardsPath = path.join(root, "data", "cards.json");
  return JSON.parse(await fs.readFile(cardsPath, "utf8"));
};

const writeCards = async (cards) => {
  await fs.writeFile(path.join(root, "data", "cards.json"), `${JSON.stringify(cards, null, 2)}\n`, "utf8");
};

const cardHref = (card) => card.archiveUrl.replace(/^cards\//, "../");

const navHtml = (cards, index) => {
  const previous = cards[index - 1];
  const next = cards[index + 1];
  return `    <nav class="card-nav" aria-label="Card navigation">
      ${previous ? `<a href="${cardHref(previous)}">Previous</a>` : "<span>Previous</span>"}
      <a href="../../cards/">Archive</a>
      ${next ? `<a href="${cardHref(next)}">Next</a>` : "<span>Next</span>"}
    </nav>`;
};

const updateCardNavs = async (cards) => {
  await Promise.all(cards.map(async (card, index) => {
    const filePath = path.join(root, card.archiveUrl, "index.html");
    let html = await fs.readFile(filePath, "utf8");
    html = html.replace(/    <nav class="card-nav"[\s\S]*?<\/nav>/, navHtml(cards, index));
    await fs.writeFile(filePath, html, "utf8");
  }));
};

const archiveHtml = (cards) => `<!doctype html>
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
        padding: 20px 0 28px;
      }

      .archive-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
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
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 14px;
      }

      .archive-card {
        display: grid;
        gap: 6px;
        padding: 10px;
        border: 1px solid rgba(197, 160, 89, 0.62);
        border-radius: 8px;
        color: var(--paper-light);
        background: rgba(18, 9, 4, 0.62);
        text-decoration: none;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
      }

      .archive-card img {
        width: 100%;
        aspect-ratio: 4 / 4.55;
        display: block;
        object-fit: cover;
        border-radius: 5px;
      }

      .archive-card strong {
        color: var(--gold-bright);
        font-family: var(--font-header);
        font-size: 21px;
        line-height: 0.98;
      }

      .archive-number {
        color: var(--gold);
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.16em;
      }

      .archive-card span:last-child {
        font-size: 14px;
      }

      @media (max-height: 680px) {
        .archive-page {
          padding-top: 14px;
          padding-bottom: 18px;
        }

        .archive-title {
          font-size: clamp(30px, 6vw, 58px);
        }

        .archive-grid {
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
        }

        .archive-card img {
          aspect-ratio: 4 / 4.25;
        }
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
${cards.map((card) => `        <a class="archive-card" href="${escapeHtml(card.archiveUrl.replace(/^cards\//, ""))}">
          <img src="../${escapeHtml(card.image)}" alt="${escapeHtml(card.altText)}">
          <span class="archive-number">${escapeHtml(card.id)}</span>
          <strong>${escapeHtml(card.title)}</strong>
          <span>${escapeHtml(card.season)}</span>
        </a>`).join("\n")}
      </section>
    </main>
  </body>
</html>
`;

const publishPreview = async (slug, dryRun = false) => {
  const card = await getPreviewCard(slug);
  const cards = await readCards();
  const nextCards = cards.filter((item) => item.id !== card.id);
  nextCards.push(card);
  nextCards.sort((a, b) => a.number - b.number);

  if (dryRun) {
    return { card, cards: nextCards };
  }

  const previewPath = path.join(root, "preview", slug, "index.html");
  const cardDir = path.join(root, "cards", slug);
  const cardPath = path.join(cardDir, "index.html");
  const cardIndex = nextCards.findIndex((item) => item.id === card.id);
  let html = await fs.readFile(previewPath, "utf8");
  html = html
    .replace(`${escapeHtml(card.title)} | Cello Cool Club Preview`, `${escapeHtml(card.title)} | Cello Cool Club`)
    .replace(/\n    <span class="preview-badge">[\s\S]*?<\/span>/, "")
    .replace(/    <nav class="card-nav"[\s\S]*?<\/nav>/, navHtml(nextCards, cardIndex));

  await fs.mkdir(cardDir, { recursive: true });
  await fs.writeFile(cardPath, html, "utf8");
  await writeCards(nextCards);
  await updateCardNavs(nextCards);
  await fs.writeFile(path.join(root, "cards", "index.html"), archiveHtml(nextCards), "utf8");

  return { card, cards: nextCards };
};

const serveFile = async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || `${host}:${port}`}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith("/")) pathname += "index.html";

  const filePath = path.resolve(root, pathname.replace(/^\/+/, ""));
  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const file = await fs.readFile(filePath);
    response.writeHead(200, {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream",
    });
    response.end(file);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
};

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    json(response, 204, {});
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host || `${host}:${port}`}`);

  if (request.method === "POST" && url.pathname === "/api/post-card") {
    try {
      const body = await readBody(request);
      const result = await publishPreview(String(body.slug || ""), Boolean(body.dryRun));
      json(response, 200, {
        ok: true,
        dryRun: Boolean(body.dryRun),
        card: result.card,
        archiveUrl: `/${result.card.archiveUrl}`,
      });
    } catch (error) {
      json(response, 400, { ok: false, error: error.message });
    }
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/cards") {
    json(response, 200, { cards: await readCards() });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/health") {
    json(response, 200, { ok: true, app: "Cello Cool Club local server" });
    return;
  }

  if (request.method === "GET") {
    await serveFile(request, response);
    return;
  }

  response.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Method not allowed");
});

server.listen(port, host, () => {
  console.log(`Cello Cool Club local server: http://${host}:${port}/`);
});
