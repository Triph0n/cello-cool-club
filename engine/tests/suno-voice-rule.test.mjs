import test from "node:test";
import assert from "node:assert/strict";

import {
  CELLO_SINGLE_VOICE_RULE,
  buildSunoPrompt,
  ensureCelloSingleVoice
} from "../scripts/card-workflow.mjs";

const requiredPhrases = [
  "one warm female lead singer",
  "solo vocal only",
  "monophonic vocal line",
  "no choir",
  "no backing vocals",
  "no vocal harmonies",
  "no vocal layering or doubling",
  "no duet",
  "no call-and-response vocals"
];

test("Cello Cool Club Suno prompts always enforce one female solo voice", () => {
  const prompt = buildSunoPrompt("A Small Song", ["One quiet line"]);
  for (const phrase of requiredPhrases) assert.match(prompt.toLowerCase(), new RegExp(phrase));
});

test("legacy style prompts receive the complete project voice rule", () => {
  const prompt = ensureCelloSingleVoice("Style prompt: intimate jazz trio");
  assert.ok(prompt.endsWith(`${CELLO_SINGLE_VOICE_RULE}.`));
  for (const phrase of requiredPhrases) assert.match(prompt.toLowerCase(), new RegExp(phrase));
});

test("voice-rule normalization is idempotent", () => {
  const once = ensureCelloSingleVoice("Style prompt: intimate jazz trio");
  assert.equal(ensureCelloSingleVoice(once), once);
});
