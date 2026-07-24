import { formatCardId, nextCardNumber, readCards, slugify, validateCards, writeCards } from "./card-utils.mjs";

const args = process.argv.slice(2);
const options = parseArgs(args);
const cards = await readCards();
const number = nextCardNumber(cards);
const id = formatCardId(number);
const title = options.title || `Untitled Card ${id}`;
const slug = uniqueSlug(slugify(options.slug || title), cards, id);

const card = {
  id,
  number,
  slug,
  title,
  deck: options.deck || "club",
  season: options.season || (options.deck === "kids" ? "Suzuki" : "Time & Rooms"),
  language: options.language || (options.deck === "kids" ? "cs" : "en"),
  poemText: [],
  shortCaption: "",
  longCaption: "",
  imagePrompt: "",
  sunoPrompt: "",
  image: "",
  audio: "",
  altText: "",
  status: options.status || "draft",
  publishAt: "",
  archiveUrl: `cards/${id}-${slug}/`,
  postedUrls: {},
  notes: ""
};

const updatedCards = [...cards, card];
const errors = validateCards(updatedCards);

if (errors.length > 0) {
  console.error("New card was not created because validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

await writeCards(updatedCards);
console.log(`Created card ${id}: ${title}`);
console.log(`Slug: ${slug}`);

function parseArgs(values) {
  const parsed = {};
  const positionals = [];

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) {
      positionals.push(value);
      continue;
    }

    const key = value.slice(2);
    const next = values[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
      continue;
    }

    parsed[key] = next;
    index += 1;
  }

  if (!parsed.title && positionals.length > 0) {
    parsed.title = positionals.join(" ");
  }

  return parsed;
}

function uniqueSlug(baseSlug, cards, id) {
  const existing = new Set(cards.map((card) => card.slug));
  if (!existing.has(baseSlug)) return baseSlug;

  const withId = `${baseSlug}-${id.toLowerCase()}`;
  if (!existing.has(withId)) return withId;

  let suffix = 2;
  while (existing.has(`${withId}-${suffix}`)) {
    suffix += 1;
  }

  return `${withId}-${suffix}`;
}
