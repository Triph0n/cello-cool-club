import { extractMotifs, scoreMood } from "./card-workflow.mjs";

// Bump when the fixed style slots change: a plate is only reproducible against
// the style version it was generated with.
export const posterStyleVersion = "atelier-claire-1";

// The image model draws a PLATE, never a poster. Title, poem, catalogue number
// and the QR label are typeset by the print pipeline, so the plate must leave
// them room and must not contain a single letter.

// A season owns its inks. The palette is NOT derived from the poem's mood the
// way the card palette is: twelve posters of one season have to hang together
// as a set, so hue is fixed per season and mood only moves ink coverage.
export const seasonPalettes = {
  "Time & Rooms": {
    inks: ["deep ink blue", "burnt amber"],
    hex: ["#1f3a5f", "#c2662a"],
    paper: "warm off-white paper"
  }
};

export const fallbackPalette = {
  inks: ["deep ink blue", "burnt amber"],
  hex: ["#1f3a5f", "#c2662a"],
  paper: "warm off-white paper"
};

export function getSeasonPalette(season) {
  return seasonPalettes[season] || fallbackPalette;
}

// Where the type goes, stated as a contract the model has to honour. This is the
// one slot the model must hit exactly, so it is spelled out rather than implied.
export const posterLayouts = {
  record: {
    aspect: "2:3",
    composition: [
      "Vertical poster plate, 2:3.",
      "All subject matter lives in the upper two thirds of the frame.",
      "The bottom third is an empty flat field of untouched paper: no objects, no shading, no gradient, no vignette, no drifting specks.",
      "The bottom-right corner stays quiet and low-contrast.",
      "One focal object, an off-centre axis, generous negative space; resist the urge to fill the frame."
    ].join(" ")
  }
};

// Mood does not pick the colours. It picks how much ink hits the paper.
const inkTreatments = {
  warm: "Light ink coverage: wide areas of bare paper, the darker ink used only for the line, the second ink as a bright accent.",
  melancholic: "Heavy ink coverage: a large field of the darker ink, the paper white kept only as a thin breathing edge around the focal object.",
  bittersweet: "Balanced ink coverage: a solid field of the darker ink meeting bare paper along one clean edge, the second ink warming the focal object."
};

export function buildPosterPrompt(card, { layout = "record" } = {}) {
  const title = card.title || "Untitled";
  const poemText = card.poemText || [];
  const palette = getSeasonPalette(card.season);
  const plan = posterLayouts[layout];
  if (!plan) throw new Error(`Unknown poster layout: ${layout}`);

  const motifs = extractMotifs(title, poemText, 3);
  const mood = scoreMood(`${title} ${poemText.join(" ")}`.toLowerCase());
  const [darkInk, accentInk] = palette.inks;

  const subject = motifs.length > 0
    ? `Build the scene around ${motifs.length === 1 ? "this single motif" : motifs.length === 2 ? "these two motifs" : "these three motifs"} and nothing else: ${motifs.map((motif) => motif.word).join(", ")}. They come from the lines ${motifs.map((motif) => `"${motif.line}"`).join(" / ")}.`
    : "Build the scene around one strong central image suggested by the title.";

  return [
    `Poster plate artwork for the poem "${title}" — Cello Cool Club, season "${card.season || "Time & Rooms"}", catalogue ${formatCatalogueNumber(card)}.`,
    "",
    `SUBJECT — ${subject}`,
    "",
    `COMPOSITION — ${plan.composition}`,
    "",
    "DRAWING — French mid-century poster illustration in the hand of André François and Raymond Savignac: brush-and-ink line with visible pressure and wobble, drawn by a human, deliberately a little clumsy, wit before beauty. Flat shapes, no rendering, no airbrush.",
    "",
    `PRINT — two-colour risograph on ${palette.paper}: flat spot inks, coarse halftone in the midtones, one millimetre of misregistration between the two inks, paper grain and faint roller streaks. The ink sits on the paper. ${darkInk} and ${accentInk} only, plus the paper white. ${inkTreatments[mood]}`,
    "",
    "FORBIDDEN — no text, no letters, no numbers, no typography, no watermark, no signature, no border, no frame, no photorealism, no 3D render, no digital gloss, no gradient mesh, no fantasy kitsch."
  ].join("\n");
}

export function formatCatalogueNumber(card) {
  return `CCC-${String(card.id || card.number || "000").padStart(3, "0")}`;
}
