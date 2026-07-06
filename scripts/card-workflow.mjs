import fs from "node:fs/promises";
import path from "node:path";
import {
  engineRoot,
  formatCardId,
  getSitePath,
  nextCardNumber,
  readCards,
  slugify,
  sortCards,
  validateCards,
  writeCards
} from "./card-utils.mjs";
import { findCard } from "./release-utils.mjs";
import { parseSourceFile } from "./source-parser.mjs";
import { renderCardPage } from "./renderers.mjs";

const allowedImageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const allowedAudioExtensions = new Set([".mp3", ".wav", ".m4a", ".ogg", ".aac", ".flac", ".mp4"]);

export async function deleteDraftCard(idOrSlug) {
  const cards = await readCards();
  const cardIndex = cards.findIndex((c) => c.id === idOrSlug || c.slug === idOrSlug);
  if (cardIndex === -1) throw new Error(`No card found for "${idOrSlug}".`);

  const card = cards[cardIndex];
  if (card.status !== "draft") throw new Error(`Only draft cards can be deleted (status: ${card.status}).`);

  cards.splice(cardIndex, 1);
  await writeCards(sortCards(cards));
  return { deleted: true, id: card.id };
}

export async function createCardFromSource({ sourceFile, sourceNumber, language = "en" }) {
  const poems = await parseSourceFile(sourceFile);
  const poem = poems.find((candidate) => candidate.number === Number(sourceNumber));
  if (!poem) throw new Error(`Poem ${sourceNumber} not found in ${sourceFile}.`);

  const cards = await readCards();
  const sourceName = path.basename(sourceFile);
  const sourceStem = sourceName.replace(/\.(txt|md|odt)$/i, "");
  const existing = cards.find((card) => {
    if (card.source?.number !== poem.number) return false;

    const sameSourceFile = [card.source?.textExport, card.source?.file].filter(Boolean).some((sourcePath) => {
      const candidateName = path.basename(String(sourcePath).replaceAll("\\", "/"));
      const candidateStem = candidateName.replace(/\.(txt|md|odt)$/i, "");
      return candidateName === sourceName || candidateStem === sourceStem;
    });
    if (sameSourceFile) return true;

    const sameFrenchTitle = card.source?.frenchTitle && poem.titles.fr
      && slugify(card.source.frenchTitle) === slugify(poem.titles.fr);
    return Boolean(sameFrenchTitle);
  });
  if (existing) return { card: existing, created: false };

  const number = nextCardNumber(cards);
  const id = formatCardId(number);
  const title = poem.titles[language] || poem.titles.en || poem.titles.fr;
  const slug = uniqueSlug(slugify(title), cards);
  const poemText = poem.texts[language] || poem.texts.en || poem.texts.fr || [];

  const card = {
    id,
    number,
    slug,
    title,
    season: "Time & Rooms",
    language,
    poemText,
    shortCaption: `Morning card prepared: ${title}.`,
    longCaption: buildCaption(title, poemText),
    imagePrompt: buildImagePrompt(title, poemText),
    sunoPrompt: buildSunoPrompt(title, poemText),
    image: "",
    audio: "",
    altText: buildAltText(title),
    status: "draft",
    publishAt: "",
    archiveUrl: `cards/${id}-${slug}/`,
    postedUrls: {},
    source: {
      file: sourceFile.startsWith("clean/") ? `data/clean-sources/${sourceFile.split("/").at(-1)}` : `data/inbox/${sourceFile.replace(/\.txt$/i, ".odt")}`,
      textExport: sourceFile.startsWith("clean/") ? `data/clean-sources/${sourceFile.split("/").at(-1)}` : `data/inbox/${sourceFile}`,
      number: poem.number,
      frenchTitle: poem.titles.fr,
      czechTitle: poem.titles.cs,
      englishTitle: poem.titles.en
    },
    notes: `Created from admin panel. Main language: ${language}.`
  };

  const updated = sortCards([...cards, card]);
  const errors = validateCards(updated);
  if (errors.length > 0) throw new Error(errors.join("\n"));
  await writeCards(updated);
  return { card, created: true };
}

export async function attachImageToCard(idOrSlug, sourcePath) {
  return attachAssetToCard({
    idOrSlug,
    sourcePath,
    allowedExtensions: allowedImageExtensions,
    engineFolder: path.join(engineRoot, "assets", "generated-images"),
    publicFolder: path.join(getSitePath(), "assets", "images"),
    publicPrefix: "assets/images",
    field: "image",
    metaField: "imageAttachment"
  });
}

export async function attachAudioToCard(idOrSlug, sourcePath) {
  return attachAssetToCard({
    idOrSlug,
    sourcePath,
    allowedExtensions: allowedAudioExtensions,
    engineFolder: path.join(engineRoot, "assets", "audio"),
    publicFolder: path.join(getSitePath(), "assets", "audio"),
    publicPrefix: "assets/audio",
    field: "audio",
    metaField: "audioAttachment"
  });
}

export async function previewCard(idOrSlug) {
  const cards = sortCards(await readCards());
  const card = findCard(cards, idOrSlug);
  if (!card) throw new Error(`No card found for "${idOrSlug}".`);

  const previewCards = cards.filter((candidate) => candidate.status === "posted" || candidate.id === card.id);
  const previewDir = path.join(getSitePath(), "preview", `${card.id}-${card.slug}`);
  await fs.mkdir(previewDir, { recursive: true });
  await fs.writeFile(
    path.join(previewDir, "index.html"),
    renderCardPage(card, previewCards, {
      preview: true,
      depth: 2,
      archiveHref: "../../cards/"
    }),
    "utf8"
  );

  return {
    card,
    url: `http://127.0.0.1:5173/preview/${card.id}-${card.slug}/`
  };
}

export async function approveCard(idOrSlug) {
  const cards = await readCards();
  const card = findCard(cards, idOrSlug);
  if (!card) throw new Error(`No card found for "${idOrSlug}".`);
  if (card.status === "posted") throw new Error(`Card ${card.id} is already posted.`);

  const missing = ["poemText", "shortCaption", "image", "audio", "altText"].filter((field) => {
    const value = card[field];
    return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
  });
  if (missing.length > 0) throw new Error(`Missing before approval: ${missing.join(", ")}`);

  card.status = "approved";
  card.approvedAt = new Date().toISOString();
  await writeCards(sortCards(cards));
  return card;
}

async function attachAssetToCard({ idOrSlug, sourcePath, allowedExtensions, engineFolder, publicFolder, publicPrefix, field, metaField }) {
  const cards = await readCards();
  const card = findCard(cards, idOrSlug);
  if (!card) throw new Error(`No card found for "${idOrSlug}".`);

  const resolvedSource = path.resolve(normalizeSourcePath(sourcePath));
  const extension = path.extname(resolvedSource).toLowerCase();
  if (!allowedExtensions.has(extension)) throw new Error(`Unsupported file extension: ${extension}`);

  const stat = await fs.stat(resolvedSource);
  if (!stat.isFile()) throw new Error(`Source is not a file: ${resolvedSource}`);

  const normalizedExtension = extension === ".jpeg" ? ".jpg" : extension;
  const fileName = `${card.id}-${card.slug}${normalizedExtension}`;
  const enginePath = path.join(engineFolder, fileName);
  const publicPath = path.join(publicFolder, fileName);
  const publicAsset = `${publicPrefix}/${fileName}`;

  await fs.mkdir(path.dirname(enginePath), { recursive: true });
  await fs.mkdir(path.dirname(publicPath), { recursive: true });
  await fs.copyFile(resolvedSource, enginePath);
  await fs.copyFile(resolvedSource, publicPath);

  card[field] = publicAsset;
  card[metaField] = {
    attachedAt: new Date().toISOString(),
    sourceFile: resolvedSource,
    engineAsset: path.relative(engineRoot, enginePath).replaceAll("\\", "/"),
    publicAsset
  };
  updateStatusAfterAssets(card);
  await writeCards(sortCards(cards));
  return card;
}

function normalizeSourcePath(sourcePath) {
  return String(sourcePath || "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

function updateStatusAfterAssets(card) {
  if (card.status === "posted" || card.status === "approved") return;
  if (card.image && card.audio) {
    card.status = "ready_for_review";
  } else if (card.image) {
    card.status = "image_ready";
  } else if (card.audio) {
    card.status = "music_needed";
  }
}

function uniqueSlug(baseSlug, cards) {
  const existing = new Set(cards.map((card) => card.slug));
  if (!existing.has(baseSlug)) return baseSlug;
  let suffix = 2;
  while (existing.has(`${baseSlug}-${suffix}`)) suffix += 1;
  return `${baseSlug}-${suffix}`;
}

function buildCaption(title, poemText) {
  const firstLine = poemText[0] || title;
  return `${title} opens with a quiet image: ${firstLine.toLowerCase()}.`;
}

export function buildImagePrompt(title, poemText) {
  const motifs = extractMotifs(title, poemText, 3);
  const palette = getMoodPalette(`${title || ""} ${poemText.join(" ")}`.toLowerCase());

  const motifNames = motifs.map((motif) => motif.word).join(", ");
  const motifLines = motifs.map((motif) => `"${motif.line}"`).join(" / ");
  const motifCount = motifs.length === 1 ? "this single motif" : motifs.length === 2 ? "these two motifs" : "these three motifs";
  const subject = motifs.length > 0
    ? `Build the whole scene around ${motifCount} and nothing else: ${motifNames}. They come from the lines ${motifLines}.`
    : `Build the whole scene around one strong central image suggested by the title.`;

  return [
    `Fine-art illustration for the poem "${title}".`,
    subject,
    "One clear focal point, generous negative space, quiet symbolism; resist the urge to fill the frame.",
    palette,
    "Painterly poetic surrealism with mid-century jazz-poster elegance, visible textured brushwork, soft film grain, cinematic light and deep honest shadow.",
    "No text, no typography, no watermark."
  ].join(" ");
}

const motifStopWords = new Set([
  "the", "and", "but", "for", "nor", "not", "with", "without", "into", "onto", "from", "over", "under",
  "about", "after", "before", "between", "through", "against", "during", "while", "when", "where",
  "that", "this", "these", "those", "there", "here", "then", "than", "them", "they", "their", "theirs",
  "she", "her", "hers", "him", "his", "its", "our", "ours", "your", "yours", "who", "whom", "whose",
  "what", "which", "why", "how", "all", "any", "each", "every", "some", "none", "one", "two", "three",
  "was", "were", "been", "being", "are", "is", "am", "be", "has", "have", "had", "having", "does", "did",
  "will", "would", "shall", "should", "can", "could", "may", "might", "must", "said", "says", "say",
  "like", "just", "very", "only", "still", "even", "also", "too", "more", "most", "less", "least",
  "you", "yourself", "himself", "herself", "itself", "themselves", "someone", "something", "nothing",
  "anything", "everything", "nobody", "everybody", "thing", "things", "way", "ways", "day", "days",
  "longer", "always", "never", "sometimes", "once", "again", "away", "back", "down", "out", "off",
  "because", "though", "although", "however", "perhaps", "maybe", "really", "quite", "rather",
  "goes", "going", "gone", "went", "come", "comes", "came", "coming", "get", "gets", "got", "getting",
  "make", "makes", "made", "making", "take", "takes", "took", "taken", "know", "knows", "knew", "known",
  "want", "wants", "wanted", "tired", "little", "small", "big", "large", "great", "good", "bad",
  "new", "old", "first", "last", "next", "other", "another", "same", "own", "such", "many", "much",
  "heavier", "lighter", "bigger", "smaller", "older", "younger", "better", "worse", "colder",
  "warmer", "darker", "brighter", "deeper", "higher", "lower", "shorter", "stronger", "weaker",
  "nearer", "farther", "further", "earlier", "later", "faster", "slower", "heaviest", "lightest"
]);

const imageryLexicon = new Set([
  "clock", "clocks", "wall", "walls", "star", "stars", "key", "keys", "door", "doors", "window", "windows",
  "statue", "statues", "gnome", "venus", "flamingo", "garden", "gardens", "mirror", "mirrors", "lamp", "lamps",
  "bus", "train", "station", "terminal", "street", "streets", "sidewalk", "pavement", "city", "town",
  "rain", "snow", "wind", "storm", "cloud", "clouds", "moon", "sun", "sky", "sea", "ocean", "river",
  "tree", "trees", "leaf", "leaves", "flower", "flowers", "grass", "bird", "birds", "cat", "dog", "horse",
  "piano", "violin", "cello", "trumpet", "gramophone", "song", "music", "letter", "letters", "book", "books",
  "photograph", "photographs", "picture", "candle", "candles", "fire", "smoke", "cigarette", "coffee",
  "cup", "cups", "table", "chair", "bed", "room", "rooms", "house", "houses", "roof", "stairs", "bridge",
  "shadow", "shadows", "light", "lights", "night", "morning", "evening", "dusk", "dawn", "winter",
  "spring", "summer", "autumn", "coat", "hat", "shoes", "umbrella", "suitcase", "ticket", "coin", "coins",
  "watch", "hands", "hand", "eyes", "eye", "heart", "hearts", "face", "faces", "hair", "voice", "voices",
  "poster", "posters", "chalk", "paint", "paper", "ink", "pen", "wheelbarrow", "coal", "mine", "plane",
  "wheel", "wheels", "gears", "pendulum", "bell", "bells", "church", "tower", "clockwork", "dust",
  "kiosk", "bar", "cafe", "wine", "glass", "bottle", "bread", "apple", "orange", "kitchen", "stove",
  "telephone", "radio", "newspaper", "clothesline", "laundry", "curtain", "curtains", "carpet", "floor",
  "ceiling", "attic", "cellar", "chimney", "gate", "fence", "path", "road", "railway", "harbor", "boat",
  "ship", "lighthouse", "island", "mountain", "valley", "field", "fields", "stone", "stones", "brick",
  "cracks", "crack", "ruins", "graveyard", "grave", "cross", "angel", "ghost", "puppet", "puppets",
  "mask", "masks", "circus", "carousel", "balloon", "kite", "toy", "toys", "doll", "chess", "cards",
  "dancer", "dancers", "waltz", "ballerina", "sailor", "soldier", "traveler", "merchant", "thief",
  "child", "children", "lovers", "woman", "man", "girl", "boy", "stranger", "strangers", "crowd",
  "pedestrians", "prayer", "snowflakes", "footsteps", "echo", "silence", "secrets",
  "pocket", "pockets", "water", "weight", "sand", "salt", "ash", "ashes", "feather", "feathers",
  "thread", "needle", "scissors", "ladder", "rope", "anchor", "compass", "map", "maps", "globe"
]);

export function extractMotifs(title, poemText, limit = 3) {
  const lines = (poemText || []).map((line) => String(line).trim()).filter(Boolean);
  const titleWords = new Set(tokenizeWords(title || ""));
  const entries = new Map();

  lines.forEach((line, lineIndex) => {
    for (const word of tokenizeWords(line)) {
      if (word.length < 3 || motifStopWords.has(word)) continue;

      const existing = entries.get(word) || { word, line, lineIndex, score: 0 };
      existing.score += 1;
      if (titleWords.has(word)) existing.score += 3;
      if (imageryLexicon.has(word)) existing.score += 2;
      if (lineIndex <= 1) existing.score += 1;
      if (lineIndex >= lines.length - 2) existing.score += 1;
      entries.set(word, existing);
    }
  });

  const ranked = [...entries.values()].sort((a, b) => b.score - a.score || a.lineIndex - b.lineIndex);
  const concrete = ranked.filter((entry) => imageryLexicon.has(entry.word) || titleWords.has(entry.word));
  const chosen = [];

  // Pass 1: concrete imagery words, spread across different lines.
  for (const entry of concrete) {
    if (chosen.length >= limit) break;
    if (chosen.some((picked) => sharesStem(picked.word, entry.word))) continue;
    if (chosen.some((picked) => picked.lineIndex === entry.lineIndex)) continue;
    chosen.push(entry);
  }

  // Pass 2: concrete words even when they share a line.
  for (const entry of concrete) {
    if (chosen.length >= limit) break;
    if (chosen.includes(entry)) continue;
    if (chosen.some((picked) => sharesStem(picked.word, entry.word))) continue;
    chosen.push(entry);
  }

  // Pass 3: only when the poem offers too few concrete words, fall back to anything ranked.
  if (chosen.length < Math.min(2, ranked.length)) {
    for (const entry of ranked) {
      if (chosen.length >= limit) break;
      if (chosen.includes(entry)) continue;
      if (chosen.some((picked) => sharesStem(picked.word, entry.word))) continue;
      chosen.push(entry);
    }
  }

  return chosen.sort((a, b) => a.lineIndex - b.lineIndex);
}

function tokenizeWords(text) {
  return String(text)
    .toLowerCase()
    .replace(/[''`]/g, "")
    .split(/[^a-z]+/)
    .filter(Boolean);
}

function sharesStem(a, b) {
  return a.startsWith(b) || b.startsWith(a) || (a.length >= 5 && b.length >= 5 && a.slice(0, 5) === b.slice(0, 5));
}

function getMoodPalette(text) {
  const happyScore = scoreWords(text, happyWords);
  const sadScore = scoreWords(text, sadWords);

  if (happyScore > sadScore + 1) {
    return "Warm amber, cream, and soft vermilion palette, late-morning light, an undertone of gentle wit.";
  }
  if (sadScore > happyScore + 1) {
    return "Smoky blue-grey, faded gold, and deep umber palette, dusk light through a window, tender melancholy.";
  }
  return "Muted gold, slate, and warm sepia palette, lamplight against gathering dark, bittersweet stillness.";
}

export function buildSunoPrompt(title, poemText) {
  const moodPrompt = getSunoMoodPrompt(title, poemText);

  return `Style prompt: ${moodPrompt}`;
}

function getSunoMoodPrompt(title, poemText) {
  const text = `${title || ""} ${poemText.join(" ")}`.toLowerCase();
  const titleKey = String(title || "").toLowerCase();
  const base = "inspired by the style of Jazz., Traditional Pop, elegant 1950s vocal jazz with warm female vocal, effortless phrasing, soft brass and sax sections, upright bass, brushed drums, swinging piano, rich analog sound, sophisticated great american songbook feeling";
  const poemDirection = getPoemMusicDirection(text);
  const titleProfiles = {
    "the clock": `${base}, ${poemDirection}, precise tick-tock piano rhythm, muted brass pulses like clock hands, graceful circular melody, playful but aware of time passing, no humming at the beginning.`,
    "the memory of a wall": `${base}, ${poemDirection}, quiet city-at-night atmosphere, restrained brushed drums, tender saxophone responses, soft brass like faded streetlight, resilient dignity, intimate storytelling vocal, no humming at the beginning.`,
    "the weight of a key": `${base}, ${poemDirection}, sparse piano opening, heavy pauses, hushed upright bass, minimal brushed drums, mournful saxophone, cold empty-room atmosphere, the vocal should feel fragile and burdened by absence, no humming at the beginning.`,
    "the testament of a star": `${base}, ${poemDirection}, spacious arrangement, soft cymbal shimmer, gentle piano voicings, tender sax lines, fragile light in darkness, elegant emotional rise near the end, no humming at the beginning.`,
    "the last traveler": `${base}, ${poemDirection}, rolling bus-wheel brush pattern, distant muted trumpet, reflective piano, weary warm vocal, urban solitude, cinematic terminal-at-midnight atmosphere, no humming at the beginning.`,
    "the revolt of the garden statues": `${base}, ${poemDirection}, comic big band accents, cheeky brass stabs, walking bass, witty syncopation, theatrical vocal delivery, rebellious ending, no humming at the beginning.`
  };

  if (titleProfiles[titleKey]) return titleProfiles[titleKey];

  const rules = [
    {
      words: ["absence", "no longer", "sorrow", "dead", "death", "grief", "cold", "empty"],
      prompt: `${base}, ${poemDirection}, blue-note harmony, expressive pauses, low upright bass, mournful saxophone replies, fragile but forward-moving vocal phrasing, no humming at the beginning.`
    },
    {
      words: ["wall", "memory", "war", "secrets", "cracked", "standing", "echo", "hearts"],
      prompt: `${base}, ${poemDirection}, quiet city-at-night atmosphere, tender saxophone responses, resilient dignity, no humming at the beginning.`
    },
    {
      words: ["clock", "time", "tick", "moment", "circle", "universe"],
      prompt: `${base}, ${poemDirection}, precise piano rhythm, muted brass pulses, graceful circular melody, romantic awareness of passing time, no humming at the beginning.`
    },
    {
      words: ["star", "light", "dark", "night", "hope", "shine"],
      prompt: `${base}, ${poemDirection}, spacious arrangement, gentle piano, soft cymbal shimmer, cosmic emotion turning into hope, no humming at the beginning.`
    },
    {
      words: ["bus", "traveler", "terminal", "journey", "line", "solitude"],
      prompt: `${base}, ${poemDirection}, rolling travel rhythm, distant muted trumpet, reflective piano, weary warm vocal, urban solitude, no humming at the beginning.`
    },
    {
      words: ["revolt", "garden", "statues", "gnome", "venus", "flamingo", "property"],
      prompt: `${base}, ${poemDirection}, comic big band accents, cheeky brass stabs, witty syncopation, theatrical vocal delivery, no humming at the beginning.`
    },
    {
      words: ["sidewalk", "concrete", "pedestrians", "street", "rain", "cracks", "cigarette"],
      prompt: `${base}, ${poemDirection}, walking-street groove, brushed snare like footsteps, muted trumpet prayer responses, damp pavement atmosphere, wry sacred-comic vocal delivery, tender urban melancholy, no humming at the beginning.`
    },
    {
      words: ["normality", "same", "manual", "conformity", "difference", "disease", "mirror"],
      prompt: `${base}, ${poemDirection}, satirical bureaucratic swing, clipped brass answers, orderly walking bass that loosens into blue-sky lift, dry theatrical phrasing, mirror-bright piano accents, no humming at the beginning.`
    },
    {
      words: ["ending", "endings", "unfinished", "suspended", "continued", "stories", "questions"],
      prompt: `${base}, ${poemDirection}, unresolved noir swing, suspended piano cadences, brushed drums that keep moving, questioning saxophone phrases, open-ended harmonic turns, intimate storyteller vocal, no humming at the beginning.`
    }
  ];
  const match = rules.find((rule) => rule.words.some((word) => text.includes(word)));
  return match?.prompt || `${base}, ${poemDirection}, intimate small-combo arrangement, clear melodic vocal line, conversational phrasing, restrained saxophone replies, warm piano voicings, no humming at the beginning.`;
}

const happyWords = [
  "laugh", "joy", "spring", "dance", "dancing", "play", "playful", "bright", "sun", "flower",
  "garden", "hope", "smile", "waltz", "revolt", "comic", "funny", "love", "alive", "free", "wild"
];
const sadWords = [
  "absence", "alone", "lonely", "sorrow", "sad", "death", "dead", "grief", "cold", "empty",
  "night", "dark", "lost", "war", "tears", "memory", "old", "last", "silence", "no longer"
];

function getPoemMusicDirection(text) {
  const tempoProfile = chooseTempoProfile(text);
  const happyScore = scoreWords(text, happyWords);
  const sadScore = scoreWords(text, sadWords);
  const mood = happyScore > sadScore + 1 ? "warm, hopeful, lightly cheerful mood" : sadScore > happyScore + 1 ? "melancholic, tender, emotionally sad mood" : "bittersweet mood, balanced between warmth and sadness";
  const arrangement = happyScore > sadScore + 1
    ? "brighter brass colors, smiling piano fills, buoyant brushed drums"
    : sadScore > happyScore + 1
      ? "soft minor-key harmony, restrained brushed drums, mournful saxophone replies"
      : "warm major-minor harmony, elegant restraint, subtle emotional lift";

  return `${tempoProfile}, ${mood}, ${arrangement}`;
}

function chooseTempoProfile(text) {
  const profiles = [
    {
      words: ["revolt", "free", "wild", "notes", "punctuation", "fairy tales", "garden statues"],
      tempo: "uptempo swing with playful stop-time breaks"
    },
    {
      words: ["ministry", "normality", "obvious", "manual", "bureaucratic", "official"],
      tempo: "brisk satirical foxtrot, clipped two-beat swing"
    },
    {
      words: ["dance", "dancing", "waltz", "snowflakes", "strangers", "shadow puppets"],
      tempo: "moderate 3/4 jazz waltz with graceful lift"
    },
    {
      words: ["merchant", "love", "regrets", "if only", "heart", "reason"],
      tempo: "mid-tempo bolero-jazz sway with a romantic pulse"
    },
    {
      words: ["song", "chewing gum", "dust", "chipped cup"],
      tempo: "medium jump-blues shuffle with elastic groove"
    },
    {
      words: ["prayer", "sidewalk", "cigarette", "book", "grass"],
      tempo: "medium gospel-blues swing with a steady walking pulse"
    },
    {
      words: ["thief", "endings", "voices", "time"],
      tempo: "medium noir swing with a stealthy pulse"
    },
    {
      words: ["bus", "traveler", "journey", "terminal", "kiosk", "bar", "piano"],
      tempo: "medium rolling travel swing, not a ballad"
    },
    {
      words: ["absence", "death", "dead", "grief", "last customer", "key"],
      tempo: "slow torch-song ballad with spacious pauses"
    },
    {
      words: ["star", "cloud", "light", "hope", "shine"],
      tempo: "medium-slow luminous swing that opens into a gentle lift"
    }
  ];
  const match = profiles.find((profile) => profile.words.some((word) => text.includes(word)));
  if (match) return match.tempo;

  const energyWords = ["running", "revolt", "dance", "dancing", "wind", "journey", "arrows", "tick", "play", "free", "wild", "fly", "flew"];
  const quietWords = ["sleep", "silence", "slow", "old", "empty", "absence", "night", "alone", "memory"];
  const energyScore = scoreWords(text, energyWords);
  const quietScore = scoreWords(text, quietWords);

  if (energyScore >= quietScore + 2) return "upbeat medium-fast swing with forward motion";
  if (quietScore >= energyScore + 3) return "slow ballad tempo with spacious pauses";
  if (energyScore > quietScore) return "medium swing tempo with lively push";
  return "medium-tempo brushed swing with gentle rubato";
}

function scoreWords(text, words) {
  return words.reduce((score, word) => score + (text.includes(word) ? 1 : 0), 0);
}

function buildAltText(title) {
  return `Poetic card artwork for ${title}.`;
}
