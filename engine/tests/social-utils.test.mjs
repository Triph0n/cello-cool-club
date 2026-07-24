import test from "node:test";
import assert from "node:assert/strict";
import { buildGenericSocialPost, buildLinkFacets } from "../scripts/social-utils.mjs";

test("buildGenericSocialPost includes number, title, and archive link", () => {
  const post = buildGenericSocialPost({
    id: "001",
    number: 1,
    slug: "the-clock",
    title: "The Clock",
    shortCaption: "Morning card prepared: The Clock.",
    image: "assets/images/001-the-clock.png",
    audio: "assets/audio/001-the-clock.mp3",
    archiveUrl: "cards/001-the-clock/"
  });

  assert.ok(post.text.includes("001 - The Clock"));
  assert.ok(post.text.includes("cards/001-the-clock/"));
});

test("buildLinkFacets finds URL with correct byte offsets", () => {
  const text = "Open it here: https://example.com/cards/001/";
  const facets = buildLinkFacets(text);

  assert.equal(facets.length, 1);
  assert.equal(facets[0].features[0].uri, "https://example.com/cards/001/");
  assert.equal(facets[0].index.byteStart, 14);
  assert.equal(facets[0].index.byteEnd, text.length);
});

test("buildLinkFacets uses byte offsets, not character offsets", () => {
  // "Píseň" contains multibyte characters: byte offsets differ from char offsets.
  const text = "Píseň: https://example.com/x";
  const facets = buildLinkFacets(text);
  const expectedStart = new TextEncoder().encode("Píseň: ").byteLength;

  assert.equal(facets.length, 1);
  assert.equal(facets[0].index.byteStart, expectedStart);
});

test("buildLinkFacets returns empty array when no URL present", () => {
  assert.deepEqual(buildLinkFacets("No links here."), []);
});
