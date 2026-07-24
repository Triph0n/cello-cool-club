import test from "node:test";
import assert from "node:assert/strict";
import {
  formatCardId,
  nextCardNumber,
  slugify,
  sortCards,
  toAbsoluteUrl,
  toPublicCard,
  validateCards
} from "../scripts/card-utils.mjs";

test("slugify normalizes accents and symbols", () => {
  assert.equal(slugify("The Clock"), "the-clock");
  assert.equal(slugify("Píseň o Praze!"), "pisen-o-praze");
  assert.equal(slugify("  --  "), "untitled-card");
});

test("formatCardId pads to three digits", () => {
  assert.equal(formatCardId(2), "002");
  assert.equal(formatCardId(123), "123");
});

test("nextCardNumber returns max + 1", () => {
  assert.equal(nextCardNumber([]), 1);
  assert.equal(nextCardNumber([{ number: 3 }, { number: 7 }]), 8);
});

test("sortCards orders by number", () => {
  const sorted = sortCards([{ number: 5 }, { number: 1 }, { number: 3 }]);
  assert.deepEqual(sorted.map((card) => card.number), [1, 3, 5]);
});

test("validateCards flags duplicates and missing fields", () => {
  const base = { id: "001", number: 1, slug: "one", title: "One", status: "draft" };
  const errors = validateCards([base, { ...base }]);
  assert.ok(errors.some((error) => error.includes('duplicate id "001"')));
  assert.ok(errors.some((error) => error.includes('duplicate slug "one"')));
});

test("validateCards does not report duplicates for two cards missing slug", () => {
  const errors = validateCards([
    { id: "001", number: 1, title: "A", status: "draft" },
    { id: "002", number: 2, title: "B", status: "draft" }
  ]);
  assert.ok(!errors.some((error) => error.includes("duplicate slug")));
});

test("validateCards requires review fields for approved cards", () => {
  const errors = validateCards([
    { id: "001", number: 1, slug: "one", title: "One", status: "approved" }
  ]);
  assert.ok(errors.some((error) => error.includes('approved cards require "image"')));
});

test("validateCards accepts known decks and flags unknown ones", () => {
  const base = { id: "001", number: 1, slug: "one", title: "One", status: "draft" };
  assert.deepEqual(validateCards([{ ...base, deck: "kids" }]), []);
  assert.deepEqual(validateCards([base]), []);
  const errors = validateCards([{ ...base, deck: "grownups" }]);
  assert.ok(errors.some((error) => error.includes('unknown deck "grownups"')));
});

test("toAbsoluteUrl uses PUBLIC_SITE_URL when set", () => {
  const previous = process.env.PUBLIC_SITE_URL;
  process.env.PUBLIC_SITE_URL = "https://example.com";
  assert.equal(toAbsoluteUrl("cards/001-the-clock/"), "https://example.com/cards/001-the-clock/");
  process.env.PUBLIC_SITE_URL = "";
  assert.equal(toAbsoluteUrl("cards/001-the-clock/"), "cards/001-the-clock/");
  if (previous === undefined) {
    delete process.env.PUBLIC_SITE_URL;
  } else {
    process.env.PUBLIC_SITE_URL = previous;
  }
});

test("toPublicCard keeps only public fields", () => {
  const publicCard = toPublicCard({
    id: "001",
    number: 1,
    slug: "one",
    title: "One",
    season: "S",
    language: "en",
    poemText: ["line"],
    shortCaption: "cap",
    image: "assets/images/x.png",
    audio: "assets/audio/x.mp3",
    altText: "alt",
    publishAt: "2026-01-01T00:00:00Z",
    imagePrompt: "SECRET",
    sunoPrompt: "SECRET",
    notes: "SECRET"
  });

  assert.equal(publicCard.imagePrompt, undefined);
  assert.equal(publicCard.sunoPrompt, undefined);
  assert.equal(publicCard.notes, undefined);
  assert.equal(publicCard.title, "One");
  assert.equal(publicCard.deck, "club");
});

test("toPublicCard keeps the kids deck", () => {
  const publicCard = toPublicCard({ id: "010", number: 10, slug: "ten", title: "Ten", deck: "kids" });
  assert.equal(publicCard.deck, "kids");
});
