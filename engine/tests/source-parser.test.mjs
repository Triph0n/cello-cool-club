import test from "node:test";
import assert from "node:assert/strict";
import { parseCleanMarkdownPoems, parsePoems } from "../scripts/source-parser.mjs";

const inboxSample = `1. L'Horloge (Hodiny / The Clock)

Francais
Le temps passe.

Česky
Čas plyne.

English
Time passes.
It always does.

2. Le Mur (Zeď / The Wall)

English
The wall remembers.
`;

test("parsePoems splits numbered poems and sections", () => {
  const poems = parsePoems(inboxSample, "inbox/sample.txt");

  assert.equal(poems.length, 2);
  assert.equal(poems[0].number, 1);
  assert.equal(poems[0].titles.fr, "L'Horloge");
  assert.equal(poems[0].titles.cs, "Hodiny");
  assert.equal(poems[0].titles.en, "The Clock");
  assert.deepEqual(poems[0].texts.en, ["Time passes.", "It always does."]);
  assert.deepEqual(poems[0].texts.cs, ["Čas plyne."]);
  assert.equal(poems[1].titles.en, "The Wall");
});

const cleanSample = `## 1. L'Horloge (Hodiny)

### English

Time passes.
It always does.

---

## 2. Le Mur

Some english line.
`;

test("parseCleanMarkdownPoems parses headings and english sections", () => {
  const poems = parseCleanMarkdownPoems(cleanSample, "clean/sample.md");

  assert.equal(poems.length, 2);
  assert.equal(poems[0].number, 1);
  assert.equal(poems[0].titles.fr, "L'Horloge");
  assert.equal(poems[0].titles.cs, "Hodiny");
  assert.deepEqual(poems[0].texts.en, ["Time passes.", "It always does."]);
  assert.deepEqual(poems[1].texts.en, ["Some english line."]);
});
