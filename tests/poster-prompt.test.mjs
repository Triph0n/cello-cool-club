import test from "node:test";
import assert from "node:assert/strict";
import { buildPosterPrompt, formatCatalogueNumber, getSeasonPalette } from "../scripts/poster-prompt.mjs";

const gardenCard = {
  id: "007",
  slug: "the-revolt-of-the-garden-statues",
  title: "The Revolt of the Garden Statues",
  season: "Time & Rooms",
  poemText: [
    "The garden gnome said",
    "I am tired of smiling like an idiot with my wheelbarrow",
    "the plaster Venus said",
    "I am cold and I would like a coat",
    "the pink plastic flamingo said",
    "I would like to see the ocean for real"
  ]
};

const sadCard = {
  id: "004",
  slug: "the-weight-of-a-key",
  title: "The Weight of a Key",
  season: "Time & Rooms",
  poemText: [
    "the key is cold in the empty room",
    "absence sits in the old chair",
    "night comes without her"
  ]
};

test("the plate leaves room for the type and forbids letters", () => {
  const prompt = buildPosterPrompt(gardenCard);

  assert.ok(prompt.includes("upper two thirds"));
  assert.ok(prompt.includes("bottom third is an empty flat field"));
  assert.ok(prompt.includes("bottom-right corner stays quiet"));
  assert.ok(prompt.includes("no letters"));
  assert.ok(prompt.includes("no typography"));
});

test("the plate is built from the poem's own motifs", () => {
  const prompt = buildPosterPrompt(gardenCard);

  assert.ok(prompt.includes("SUBJECT"));
  assert.ok(/gnome|venus|flamingo|garden|wheelbarrow/.test(prompt));
  // The whole poem must not be dumped into the prompt verbatim.
  assert.ok(!prompt.includes(gardenCard.poemText.join(" ")));
});

test("season inks are fixed, so a season hangs together as a set", () => {
  const happy = buildPosterPrompt(gardenCard);
  const sad = buildPosterPrompt(sadCard);
  const { inks } = getSeasonPalette("Time & Rooms");

  for (const ink of inks) {
    assert.ok(happy.includes(ink), `happy poem is missing the season ink "${ink}"`);
    assert.ok(sad.includes(ink), `sad poem is missing the season ink "${ink}"`);
  }
});

test("mood moves ink coverage, not hue", () => {
  const warm = buildPosterPrompt({
    ...gardenCard,
    title: "The Garden Waltz",
    poemText: ["the garden laughs in the bright sun", "flowers dance a free and playful waltz", "spring smiles at everyone alive"]
  });
  const melancholic = buildPosterPrompt(sadCard);
  // Statues that revolt but end up cold and replaced: warmth and sorrow in one poem.
  const bittersweet = buildPosterPrompt(gardenCard);

  assert.ok(warm.includes("Light ink coverage"));
  assert.ok(melancholic.includes("Heavy ink coverage"));
  assert.ok(bittersweet.includes("Balanced ink coverage"));
});

test("an unknown season still gets a usable palette", () => {
  const prompt = buildPosterPrompt({ ...gardenCard, season: "Rain & Radios" });

  assert.ok(prompt.includes("deep ink blue"));
  assert.ok(prompt.includes("risograph"));
});

test("an unknown layout is a loud error, not a silent default", () => {
  assert.throws(() => buildPosterPrompt(gardenCard, { layout: "billboard" }), /Unknown poster layout/);
});

test("the catalogue number is padded", () => {
  assert.equal(formatCatalogueNumber(gardenCard), "CCC-007");
  assert.equal(formatCatalogueNumber({ number: 12 }), "CCC-012");
});
