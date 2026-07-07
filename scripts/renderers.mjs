import { escapeHtml, getArchivePath, getDeck, getPublicSiteUrl, isNoIndex, toAbsoluteUrl } from "./card-utils.mjs";

export function robotsMetaTag() {
  return isNoIndex() ? `\n    <meta name="robots" content="noindex, nofollow">` : "";
}

export function assetPathFromDepth(asset, depth) {
  return `${"../".repeat(depth)}${asset}`;
}

export function formatCardNumber(card) {
  return String(card.number).padStart(3, "0");
}

export function renderPoemLines(card) {
  return card.poemText.map((line) => `            <p>${escapeHtml(line)}</p>`).join("\n");
}

export function renderCardPage(card, cards, options = {}) {
  const depth = options.depth ?? 2;
  const archiveHref = options.archiveHref || "../";
  const preview = Boolean(options.preview);
  const index = cards.findIndex((candidate) => candidate.id === card.id);
  const previous = cards[index - 1];
  const next = cards[index + 1];
  const assetPath = (asset) => assetPathFromDepth(asset, depth);
  const prevLink = previous && !preview
    ? `<a href="../${previous.id}-${previous.slug}/">Previous</a>`
    : `<span>Previous</span>`;
  const nextLink = next && !preview ? `<a href="../${next.id}-${next.slug}/">Next</a>` : `<span>Next</span>`;
  const statusBadge = preview ? `<span class="preview-badge">Preview / ${escapeHtml(card.status)}</span>` : "";
  const safeImage = card.image || "assets/images/clock-card.png";
  const safeAudio = card.audio || "";
  const safeAlt = card.altText || `${card.title} artwork preview.`;
  const hasPublicUrl = Boolean(getPublicSiteUrl());
  const ogImage = hasPublicUrl ? toAbsoluteUrl(safeImage) : assetPath(safeImage);
  const ogUrlTag = hasPublicUrl
    ? `\n    <meta property="og:url" content="${escapeHtml(toAbsoluteUrl(getArchivePath(card)))}">`
    : "";
  const canonicalTag = hasPublicUrl && !preview
    ? `\n    <link rel="canonical" href="${escapeHtml(toAbsoluteUrl(getArchivePath(card)))}">`
    : "";
  const jsonLdTag = hasPublicUrl && !preview
    ? `\n    ${renderJsonLd(buildCardJsonLd(card))}`
    : "";
  const sizeAttrs = imageSizeAttrs(card);

  return `<!doctype html>
<html lang="${escapeHtml(card.language || "en")}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">${robotsMetaTag()}
    <title>${escapeHtml(card.title)} | Cello Cool Club${preview ? " Preview" : ""}</title>
    <meta name="description" content="${escapeHtml(card.shortCaption || card.title)}">
    <meta property="og:title" content="${escapeHtml(card.title)} | Cello Cool Club">
    <meta property="og:description" content="${escapeHtml(card.shortCaption || card.title)}">
    <meta property="og:type" content="article">
    <meta property="og:image" content="${escapeHtml(ogImage)}">${ogUrlTag}
    <meta name="twitter:card" content="summary_large_image">${canonicalTag}
    <link rel="icon" href="${assetPath("assets/ccc-icon.ico")}">
    <link rel="apple-touch-icon" href="${assetPath("assets/ccc-logo.png")}">
    <link rel="stylesheet" href="${assetPath("styles.css")}">
    <style>
      .card-nav {
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

      .card-nav a {
        color: var(--gold-bright);
        text-decoration: none;
      }

      .card-nav span {
        opacity: 0.64;
      }

      .card-meta {
        margin: 0 0 4px;
        color: var(--gold-dark);
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }

      .preview-badge {
        position: fixed;
        left: 16px;
        bottom: 14px;
        z-index: 20;
        padding: 8px 10px;
        border: 1px solid rgba(255, 217, 120, 0.64);
        border-radius: 8px;
        color: var(--gold-bright);
        background: rgba(18, 9, 4, 0.78);
        font-size: 13px;
        font-weight: 800;
      }
    </style>${jsonLdTag}
  </head>
  <body>
    ${statusBadge}
    <main class="card-stage" aria-label="${escapeHtml(card.title)} poem card">
      <header class="club-sign" aria-label="Cello Cool Club">
        <span class="sign-dot" aria-hidden="true"></span>
        <span>Cello Cool Club</span>
        <span class="sign-dot" aria-hidden="true"></span>
      </header>

      <article class="playing-card">
        <button class="art-button" type="button" data-open-image aria-label="Enlarge artwork">
          <img src="${escapeHtml(assetPath(safeImage))}" alt="${escapeHtml(safeAlt)}"${sizeAttrs} decoding="async">
        </button>

        <div class="play-medallion" data-player="${escapeHtml(card.language || "en")}">
          <button class="gramophone-button" type="button" aria-label="Play ${escapeHtml(card.title)}" data-action="play" data-target="audio-${escapeHtml(card.id)}"${safeAudio ? "" : " disabled"}>
            <span class="gramophone-icon" aria-hidden="true">
              <img src="${assetPath("assets/images/gramo.png")}" alt="">
            </span>
          </button>
          <audio id="audio-${escapeHtml(card.id)}" preload="metadata" src="${escapeHtml(safeAudio ? assetPath(safeAudio) : "")}"></audio>
        </div>

        <section class="poem-card-body" aria-labelledby="poem-title">
          <p class="card-meta">${escapeHtml(formatCardNumber(card))} / ${escapeHtml(card.season || "Unsorted")}</p>
          <h1 id="poem-title">${escapeHtml(card.title)}</h1>
          <div class="poem-lines">
${renderPoemLines(card)}
          </div>
        </section>
      </article>
    </main>

    <nav class="card-nav" aria-label="Card navigation">
      <a href="${archiveHref}">Archive</a>
      ${prevLink}
      ${nextLink}
    </nav>

    <dialog class="image-dialog" data-image-dialog aria-label="Enlarged artwork">
      <button class="close-dialog" type="button" data-close-image aria-label="Close artwork">x</button>
      <img src="${escapeHtml(assetPath(safeImage))}" alt="Enlarged ${escapeHtml(safeAlt)}" decoding="async">
    </dialog>

    <script src="${assetPath("script.js")}"></script>
  </body>
</html>
`;
}

// QR-code landing page: one artwork, one huge play button, nothing to get lost in.
// Self-contained (inline CSS/JS, no script.js) and always noindex — it is a
// utility page reached from printed cards, not part of the browsable site.
export function renderPlayerPage(card) {
  const signText = getDeck(card) === "kids" ? "Cello Cool Club — Kids" : "Cello Cool Club";
  const safeImage = card.image || "assets/images/clock-card.png";
  const assetPath = (asset) => assetPathFromDepth(asset, 2);

  return `<!doctype html>
<html lang="${escapeHtml(card.language || "en")}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>${escapeHtml(card.title)} | ${escapeHtml(signText)}</title>
    <meta name="description" content="${escapeHtml(card.shortCaption || card.title)}">
    <link rel="icon" href="${assetPath("assets/ccc-icon.ico")}">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { min-height: 100%; }
      body {
        display: grid;
        place-items: center;
        min-height: 100dvh;
        padding: 20px 16px 32px;
        background: radial-gradient(circle at 50% 20%, #2a160a 0%, #120904 68%);
        color: #f3e4c2;
        font-family: Georgia, "Times New Roman", serif;
        text-align: center;
      }
      main { display: grid; gap: 18px; justify-items: center; width: min(420px, 100%); }
      .sign { font-size: 13px; letter-spacing: 0.22em; text-transform: uppercase; color: #c5a059; }
      img.art {
        width: min(320px, 78vw);
        aspect-ratio: 4 / 5;
        object-fit: cover;
        border-radius: 10px;
        border: 1px solid rgba(197, 160, 89, 0.6);
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
      }
      h1 { font-size: clamp(24px, 6vw, 34px); color: #ffd978; font-weight: 600; }
      .play {
        display: grid;
        place-items: center;
        width: 108px;
        height: 108px;
        border-radius: 50%;
        border: 2px solid #c5a059;
        background: rgba(18, 9, 4, 0.85);
        color: #ffd978;
        cursor: pointer;
        transition: transform 0.15s ease;
      }
      .play:active { transform: scale(0.94); }
      .play svg { width: 44px; height: 44px; fill: currentColor; }
      .play .pause-icon { display: none; }
      .play.playing .pause-icon { display: block; }
      .play.playing .play-icon { display: none; }
      .hint { font-size: 14px; opacity: 0.75; }
    </style>
  </head>
  <body>
    <main>
      <p class="sign">${escapeHtml(signText)}</p>
      <img class="art" src="${escapeHtml(assetPath(safeImage))}" alt="${escapeHtml(card.altText || card.title)}" decoding="async">
      <h1>${escapeHtml(card.title)}</h1>
      <button class="play" type="button" id="play" aria-label="Play ${escapeHtml(card.title)}">
        <svg class="play-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
        <svg class="pause-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>
      </button>
      <audio id="audio" preload="auto" src="${escapeHtml(assetPath(card.audio || ""))}"></audio>
      <p class="hint">&#9834;</p>
    </main>
    <script>
      const audio = document.getElementById("audio");
      const button = document.getElementById("play");
      const syncState = () => button.classList.toggle("playing", !audio.paused && !audio.ended);
      button.addEventListener("click", () => { audio.paused ? audio.play() : audio.pause(); });
      ["play", "pause", "ended"].forEach((name) => audio.addEventListener(name, syncState));
      audio.play().catch(() => {});
    </script>
  </body>
</html>
`;
}

export function imageSizeAttrs(card) {
  return Number.isInteger(card.imageWidth) && Number.isInteger(card.imageHeight)
    ? ` width="${card.imageWidth}" height="${card.imageHeight}"`
    : "";
}

export function renderJsonLd(data) {
  return `<script type="application/ld+json">${JSON.stringify(data).replaceAll("<", "\\u003c")}</script>`;
}

function buildCardJsonLd(card) {
  const publishDate = card.publishAt ? new Date(card.publishAt) : null;

  return {
    "@context": "https://schema.org",
    "@type": "Poem",
    name: card.title,
    url: toAbsoluteUrl(getArchivePath(card)),
    image: card.image ? toAbsoluteUrl(card.image) : undefined,
    text: (card.poemText || []).join("\n"),
    inLanguage: card.language || "en",
    datePublished: publishDate && !Number.isNaN(publishDate.getTime())
      ? publishDate.toISOString()
      : undefined,
    isPartOf: {
      "@type": "CreativeWorkSeries",
      name: `Cello Cool Club — ${card.season || "Unsorted"}`
    }
  };
}
