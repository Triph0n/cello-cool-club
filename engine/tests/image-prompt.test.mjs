import test from "node:test";
import assert from "node:assert/strict";
import { buildImagePrompt, extractMotifs } from "../scripts/card-workflow.mjs";

const clockPoem = [
  "The clock on the kitchen wall",
  "ticks without asking anyone",
  "arrows chasing arrows in a small circle",
  "and somewhere inside the mechanism",
  "the universe folds itself into a pendulum"
];

test("extractMotifs picks at most three concrete motifs", () => {
  const motifs = extractMotifs("The Clock", clockPoem);

  assert.ok(motifs.length >= 2 && motifs.length <= 3);
  const words = motifs.map((motif) => motif.word);
  assert.ok(words.includes("clock"));
  for (const motif of motifs) {
    assert.equal(typeof motif.line, "string");
    assert.ok(motif.line.length > 0);
  }
});

test("extractMotifs prefers title and imagery words over filler", () => {
  const motifs = extractMotifs("The Clock", clockPoem);
  const words = motifs.map((motif) => motif.word);

  assert.ok(!words.includes("without"));
  assert.ok(!words.includes("anyone"));
  assert.ok(!words.includes("somewhere"));
});

test("extractMotifs avoids near-duplicate stems and spreads across lines", () => {
  const motifs = extractMotifs("Arrows", [
    "arrows and more arrows",
    "the arrow flies past the window",
    "a pendulum answers"
  ]);
  const words = motifs.map((motif) => motif.word);
  const arrowLike = words.filter((word) => word.startsWith("arrow"));

  assert.ok(arrowLike.length <= 1);
});

test("extractMotifs handles empty poems gracefully", () => {
  assert.deepEqual(extractMotifs("Untitled", []), []);
});

test("buildImagePrompt is motif-focused and artistic, not object-dense", () => {
  const prompt = buildImagePrompt("The Clock", clockPoem);

  assert.ok(prompt.includes('poem "The Clock"'));
  assert.ok(prompt.includes("clock"));
  assert.ok(prompt.includes("negative space"));
  assert.ok(prompt.includes("No text"));
  assert.ok(!prompt.includes("full of objects"));
  assert.ok(!prompt.includes("Dense composition"));
  // The whole poem must no longer be dumped into the prompt verbatim.
  assert.ok(!prompt.includes(clockPoem.join(" ")));
});

test("buildImagePrompt picks a melancholic palette for a sad poem", () => {
  const prompt = buildImagePrompt("The Weight of a Key", [
    "the key is cold in the empty room",
    "absence sits in the old chair",
    "night comes without her"
  ]);

  assert.ok(prompt.includes("melancholy"));
});

test("buildImagePrompt picks a warm palette for a joyful poem", () => {
  const prompt = buildImagePrompt("The Garden Waltz", [
    "the garden laughs in the bright sun",
    "flowers dance a free and playful waltz",
    "spring smiles at everyone alive"
  ]);

  assert.ok(prompt.includes("Warm amber"));
});
