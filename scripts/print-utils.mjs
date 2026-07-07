import { escapeHtml, getDeck, publicStatuses, sortCards } from "./card-utils.mjs";
import { formatCardNumber } from "./renderers.mjs";

// Only posted cards may be printed: the QR code points at the public player
// page, which exists only after the card is exported as posted.
export function selectPrintCards(cards, { deck = "kids", ids = [] } = {}) {
  const skipped = [];

  if (ids.length > 0) {
    const selected = [];
    for (const idOrSlug of ids) {
      const card = cards.find(
        (candidate) => candidate.id === idOrSlug || candidate.slug === idOrSlug || `${candidate.id}-${candidate.slug}` === idOrSlug
      );
      if (!card) {
        skipped.push(`${idOrSlug}: card not found`);
        continue;
      }
      if (!publicStatuses.has(card.status)) {
        skipped.push(`${card.id}: status is "${card.status}", only posted cards have a public player page`);
        continue;
      }
      selected.push(card);
    }
    return { selected: sortCards(selected), skipped };
  }

  const selected = cards.filter((card) => getDeck(card) === deck && publicStatuses.has(card.status));
  return { selected: sortCards(selected), skipped };
}

export function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

// entries: [{ card, qrSvg, imageSrc, playerUrl }]
export function renderPrintSheet(entries, { title = "Cello Cool Club — print sheet", scanHint = "Naskenuj a poslouchej" } = {}) {
  const pages = chunk(entries, 4)
    .map((pageEntries) => `    <section class="sheet">
${pageEntries.map((entry) => renderPrintCard(entry, scanHint)).join("\n")}
    </section>`)
    .join("\n");

  return `<!doctype html>
<html lang="cs">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      @page { size: A4 portrait; margin: 8mm; }
      body { background: #e9e4da; font-family: Georgia, "Times New Roman", serif; color: #2a1a0c; }
      .no-print {
        max-width: 194mm;
        margin: 16px auto 0;
        padding: 12px 16px;
        border: 1px solid #b9a988;
        border-radius: 8px;
        background: #fffdf7;
        font-size: 14px;
        line-height: 1.5;
      }
      .sheet {
        width: 194mm;
        margin: 16px auto;
        padding: 2mm;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 4mm;
        background: #ffffff;
        break-after: page;
      }
      .print-card {
        display: grid;
        grid-template-rows: auto 1fr auto;
        gap: 3mm;
        height: 132mm;
        padding: 5mm;
        border: 1px dashed #a08c65;
        border-radius: 3mm;
        background: #fffdf7;
        break-inside: avoid;
        text-align: center;
      }
      .print-card img.art {
        width: 100%;
        aspect-ratio: 4 / 3;
        object-fit: cover;
        border-radius: 2mm;
        border: 0.4mm solid #c5a059;
      }
      .print-card .card-title { display: grid; gap: 1mm; align-content: center; }
      .print-card .number {
        font-size: 8pt;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: #8a6d3b;
      }
      .print-card h2 { font-size: 14pt; font-weight: 600; }
      .print-card .qr-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4mm;
      }
      .print-card .qr { width: 26mm; height: 26mm; }
      .print-card .qr svg { width: 100%; height: 100%; display: block; }
      .print-card .hint { font-size: 9pt; color: #5c4326; max-width: 34mm; text-align: left; line-height: 1.35; }
      @media print {
        body { background: #ffffff; }
        .no-print { display: none; }
        .sheet { margin: 0 auto; }
      }
    </style>
  </head>
  <body>
    <div class="no-print">
      <strong>${escapeHtml(title)}</strong> — ${entries.length} karet.
      Tisk: Ctrl+P, A4, meritko 100 %, zapnout "Background graphics". Karty vystrihnete podle carkovane linky.
    </div>
${pages}
  </body>
</html>
`;
}

function renderPrintCard(entry, scanHint) {
  const { card, qrSvg, imageSrc } = entry;
  const artwork = imageSrc
    ? `<img class="art" src="${escapeHtml(imageSrc)}" alt="${escapeHtml(card.altText || card.title)}">`
    : `<div class="art"></div>`;

  return `      <article class="print-card">
        ${artwork}
        <div class="card-title">
          <p class="number">${escapeHtml(formatCardNumber(card))} / ${escapeHtml(card.season || "")}</p>
          <h2>${escapeHtml(card.title)}</h2>
        </div>
        <div class="qr-row">
          <div class="qr">${qrSvg}</div>
          <p class="hint">${escapeHtml(scanHint)} &#9834;</p>
        </div>
      </article>`;
}
