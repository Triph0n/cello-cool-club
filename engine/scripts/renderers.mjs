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

      <article class="playing-card${(card.poemText||[]).length>24?" playing-card--long":""}">
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

// QR-code landing page: the card as a vinyl record (TASK E1). Tap the disc —
// it spins up and plays; pause — it coasts to a stop. The center label is the
// card artwork. Self-contained (inline CSS/JS, no script.js) and always
// noindex — a utility page reached from printed cards, not the browsable site.
export function renderPlayerPage(card) {
  const signText = getDeck(card) === "kids" ? "Cello Cool Club — Kids" : "Cello Cool Club";
  const safeImage = card.image || "assets/images/clock-card.png";
  const assetPath = (asset) => assetPathFromDepth(asset, 2);
  const catalogNumber = Number.isInteger(card.number) ? `CCC-${formatCardNumber(card)}` : `CCC-${card.id}`;

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
      main { display: grid; gap: 16px; justify-items: center; width: min(420px, 100%); }
      .sign { font-size: 13px; letter-spacing: 0.22em; text-transform: uppercase; color: #c5a059; }
      .stage { position: relative; width: min(320px, 82vw); aspect-ratio: 1; }
      .deck {
        display: block;
        width: 100%;
        height: 100%;
        border: 0;
        padding: 0;
        border-radius: 50%;
        background: transparent;
        cursor: pointer;
      }
      .deck:focus-visible { outline: 3px solid #ffd978; outline-offset: 6px; }
      .rotor {
        position: relative;
        display: block;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background:
          repeating-radial-gradient(circle at 50% 50%,
            #16110d 0 2.1px, #221a13 2.1px 4.2px);
        border: 1px solid rgba(197, 160, 89, 0.35);
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6), inset 0 0 40px rgba(0, 0, 0, 0.55);
        will-change: transform;
      }
      .rotor::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: conic-gradient(from 210deg,
          rgba(255, 233, 178, 0.10) 0 24deg, transparent 40deg 158deg,
          rgba(255, 233, 178, 0.07) 178deg 202deg, transparent 218deg);
        pointer-events: none;
      }
      .label {
        position: absolute;
        inset: 28.5%;
        display: block;
        border-radius: 50%;
        overflow: hidden;
        border: 2px solid rgba(197, 160, 89, 0.85);
        background: #120904;
      }
      .label img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .hole {
        position: absolute;
        inset: 0;
        margin: auto;
        width: 11px;
        height: 11px;
        border-radius: 50%;
        background: #120904;
        border: 1px solid rgba(243, 228, 194, 0.35);
        z-index: 3;
      }
      .tonearm {
        position: absolute;
        top: -3%;
        right: 2%;
        width: 30%;
        height: 56%;
        transform-origin: 82% 9%;
        transform: rotate(-34deg);
        transition: transform 0.9s cubic-bezier(0.33, 0.9, 0.4, 1);
        pointer-events: none;
        z-index: 4;
        filter: drop-shadow(0 6px 8px rgba(0, 0, 0, 0.5));
      }
      .playing .tonearm { transform: rotate(3deg); }
      .tonearm .pivot {
        position: absolute;
        top: 2%;
        right: 8%;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: radial-gradient(circle at 35% 30%, #e8cf9a, #8a6a33 70%);
        border: 1px solid rgba(0, 0, 0, 0.4);
      }
      .tonearm .arm {
        position: absolute;
        top: 8%;
        right: calc(8% + 8px);
        width: 5px;
        height: 78%;
        border-radius: 3px;
        background: linear-gradient(90deg, #d9c08a, #9d7c42);
        transform: rotate(9deg);
        transform-origin: top center;
      }
      .tonearm .head {
        position: absolute;
        bottom: 4%;
        left: 34%;
        width: 12px;
        height: 26px;
        border-radius: 3px;
        background: #c5a059;
        transform: rotate(9deg);
      }
      h1 { font-size: clamp(22px, 6vw, 32px); color: #ffd978; font-weight: 600; }
      .catalog { font-size: 12px; letter-spacing: 0.2em; color: #c5a059; }
      .hint { font-size: 14px; opacity: 0.75; }
      @media (prefers-reduced-motion: reduce) {
        .tonearm { transition: none; }
      }
    </style>
  </head>
  <body>
    <main>
      <p class="sign">${escapeHtml(signText)}</p>
      <div class="stage" id="stage">
        <button class="deck" type="button" id="play" aria-pressed="false" aria-label="Play ${escapeHtml(card.title)}">
          <span class="rotor" id="rotor">
            <span class="label">
              <img src="${escapeHtml(assetPath(safeImage))}" alt="${escapeHtml(card.altText || card.title)}" decoding="async">
            </span>
            <span class="hole" aria-hidden="true"></span>
          </span>
        </button>
        <div class="tonearm" aria-hidden="true">
          <div class="arm"></div>
          <div class="head"></div>
          <div class="pivot"></div>
        </div>
      </div>
      <h1>${escapeHtml(card.title)}</h1>
      <p class="catalog">${escapeHtml(catalogNumber)}</p>
      <audio id="audio" preload="auto" src="${escapeHtml(assetPath(card.audio || ""))}"></audio>
      <p class="hint">&#9834;</p>
    </main>
    <script>
      const audio = document.getElementById("audio");
      const button = document.getElementById("play");
      const stage = document.getElementById("stage");
      const rotor = document.getElementById("rotor");
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isPlaying = () => !audio.paused && !audio.ended;
      const syncState = () => {
        stage.classList.toggle("playing", isPlaying());
        button.setAttribute("aria-pressed", String(isPlaying()));
      };
      button.addEventListener("click", () => { audio.paused ? audio.play() : audio.pause(); });
      ["play", "pause", "ended"].forEach((name) => audio.addEventListener(name, syncState));

      // Vinyl physics: spin up while playing, coast to a stop on pause
      // (rAF with eased velocity) — unless the user prefers reduced motion.
      if (!reducedMotion) {
        let angle = 0;
        let velocity = 0;
        let last = performance.now();
        const CRUISE = 66; // degrees per second — a lazy 33 rpm feel
        const tick = (now) => {
          const dt = Math.min((now - last) / 1000, 0.1);
          last = now;
          const target = isPlaying() ? CRUISE : 0;
          velocity += (target - velocity) * Math.min(1, dt * 1.6);
          if (velocity > 0.05) {
            angle = (angle + velocity * dt) % 360;
            rotor.style.transform = "rotate(" + angle + "deg)";
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
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
