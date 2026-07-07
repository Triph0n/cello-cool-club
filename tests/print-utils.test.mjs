import test from "node:test";
import assert from "node:assert/strict";
import { chunk, renderPrintSheet, selectPrintCards } from "../scripts/print-utils.mjs";
import { renderPlayerPage } from "../scripts/renderers.mjs";

const cards = [
  { id: "001", number: 1, slug: "the-clock", title: "The Clock", status: "posted" },
  { id: "010", number: 10, slug: "twinkle", title: "Twinkle", deck: "kids", status: "posted" },
  { id: "011", number: 11, slug: "lightly-row", title: "Lightly Row", deck: "kids", status: "draft" }
];

test("selectPrintCards picks posted cards of the requested deck", () => {
  const kids = selectPrintCards(cards, { deck: "kids" });
  assert.deepEqual(kids.selected.map((card) => card.id), ["010"]);
  assert.deepEqual(kids.skipped, []);

  const club = selectPrintCards(cards, { deck: "club" });
  assert.deepEqual(club.selected.map((card) => card.id), ["001"]);
});

test("selectPrintCards with explicit ids reports missing and unposted cards", () => {
  const { selected, skipped } = selectPrintCards(cards, { ids: ["twinkle", "011", "999"] });
  assert.deepEqual(selected.map((card) => card.id), ["010"]);
  assert.equal(skipped.length, 2);
  assert.ok(skipped.some((reason) => reason.includes("011")));
  assert.ok(skipped.some((reason) => reason.includes("999")));
});

test("chunk splits items into pages", () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 4), [[1, 2, 3, 4], [5]]);
  assert.deepEqual(chunk([], 4), []);
});

test("renderPrintSheet embeds QR codes, titles, and page breaks", () => {
  const entries = Array.from({ length: 5 }, (_, index) => ({
    card: { id: `00${index + 1}`, number: index + 1, slug: `card-${index + 1}`, title: `Card ${index + 1}`, season: "Suzuki" },
    qrSvg: `<svg data-qr="${index + 1}"></svg>`,
    imageSrc: "",
    playerUrl: `https://example.com/p/00${index + 1}/`
  }));
  const html = renderPrintSheet(entries, { title: "Kids sheet" });

  assert.ok(html.includes("Kids sheet"));
  assert.ok(html.includes('data-qr="5"'));
  assert.ok(html.includes("Card 3"));
  // 5 cards at 4 per page = 2 sheets
  assert.equal(html.match(/class="sheet"/g).length, 2);
});

test("renderPlayerPage is a self-contained noindex page with audio", () => {
  const html = renderPlayerPage({
    id: "010",
    number: 10,
    slug: "twinkle",
    title: "Twinkle",
    deck: "kids",
    language: "cs",
    image: "assets/images/twinkle.png",
    audio: "assets/audio/twinkle.mp3",
    altText: "Twinkle artwork"
  });

  assert.ok(html.includes('name="robots" content="noindex'));
  assert.ok(html.includes("../../assets/audio/twinkle.mp3"));
  assert.ok(html.includes("../../assets/images/twinkle.png"));
  assert.ok(html.includes("Cello Cool Club — Kids"));
  assert.ok(html.includes('lang="cs"'));
  assert.ok(!html.includes("script.js"));
});
