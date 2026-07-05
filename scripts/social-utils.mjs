import { getArchiveUrl } from "./card-utils.mjs";

export function buildGenericSocialPost(card) {
  const archiveUrl = getArchiveUrl(card);
  const number = String(card.number).padStart(3, "0");
  const text = [
    card.shortCaption || "Morning card revealed.",
    "",
    `${number} - ${card.title}`,
    "",
    "A small image, a short poem, a piece of music.",
    `Open it in the Cello Cool Club archive: ${archiveUrl}`
  ].join("\n");

  return {
    cardId: card.id,
    slug: card.slug,
    title: card.title,
    platform: "generic",
    image: card.image,
    audio: card.audio,
    archiveUrl,
    text
  };
}

const urlPattern = /https?:\/\/[^\s<>"')\]]+/g;

export function buildLinkFacets(text) {
  const encoder = new TextEncoder();
  const facets = [];

  for (const match of text.matchAll(urlPattern)) {
    const byteStart = encoder.encode(text.slice(0, match.index)).byteLength;
    const byteEnd = byteStart + encoder.encode(match[0]).byteLength;

    facets.push({
      index: { byteStart, byteEnd },
      features: [
        {
          "$type": "app.bsky.richtext.facet#link",
          uri: match[0]
        }
      ]
    });
  }

  return facets;
}
