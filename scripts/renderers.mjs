import { escapeHtml } from "./card-utils.mjs";

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

  return `<!doctype html>
<html lang="${escapeHtml(card.language || "en")}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(card.title)} | Cello Cool Club${preview ? " Preview" : ""}</title>
    <meta name="description" content="${escapeHtml(card.shortCaption || card.title)}">
    <meta property="og:title" content="${escapeHtml(card.title)} | Cello Cool Club">
    <meta property="og:description" content="${escapeHtml(card.shortCaption || card.title)}">
    <meta property="og:image" content="${escapeHtml(assetPath(safeImage))}">
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
    </style>
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
          <img src="${escapeHtml(assetPath(safeImage))}" alt="${escapeHtml(safeAlt)}">
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
      <img src="${escapeHtml(assetPath(safeImage))}" alt="Enlarged ${escapeHtml(safeAlt)}">
    </dialog>

    <script src="${assetPath("script.js")}"></script>
  </body>
</html>
`;
}
