import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { engineRoot, getSitePath, loadLocalEnv, readCards } from "./card-utils.mjs";
import { findCard, parseArgs } from "./release-utils.mjs";
import { formatCardNumber } from "./renderers.mjs";

await loadLocalEnv();

const args = parseArgs(process.argv.slice(2));
const idOrSlug = typeof args.card === "string" ? args.card : args._[0];

if (!idOrSlug) {
  console.error("Usage: npm run teaser -- --card <id|slug> [--duration 20] [--start 0]");
  process.exit(1);
}

const duration = Number(args.duration ?? 20);
const start = Number(args.start ?? 0);

if (!Number.isFinite(duration) || duration < 5 || duration > 60) {
  console.error("--duration must be a number of seconds between 5 and 60.");
  process.exit(1);
}
if (!Number.isFinite(start) || start < 0) {
  console.error("--start must be a non-negative number of seconds.");
  process.exit(1);
}

const cards = await readCards();
const card = findCard(cards, idOrSlug);

if (!card) {
  console.error(`Card not found: ${idOrSlug}`);
  process.exit(1);
}
if (!card.image || !card.audio) {
  console.error(`Card ${card.id} needs both image and audio before a teaser can be rendered.`);
  process.exit(1);
}

const sitePath = getSitePath();
const imagePath = path.join(sitePath, card.image);
const audioPath = path.join(sitePath, card.audio);

for (const [label, filePath] of [["image", imagePath], ["audio", audioPath]]) {
  try {
    await fs.access(filePath);
  } catch {
    console.error(`Card ${card.id}: ${label} file not found at ${filePath}`);
    process.exit(1);
  }
}

const ffmpeg = await resolveFfmpeg();
const outDir = path.join(engineRoot, "exports", "teasers");
await fs.mkdir(outDir, { recursive: true });
const outPath = path.join(outDir, `${card.id}-${card.slug}.mp4`);

const fontFile = await resolveFont();
const filterComplex = buildFilterComplex();

const ffmpegArgs = [
  "-y",
  "-loop", "1",
  "-i", imagePath,
  "-ss", String(start),
  "-i", audioPath,
  "-filter_complex", filterComplex,
  "-map", "[v]",
  "-map", "1:a",
  "-t", String(duration),
  "-af", `afade=t=in:d=0.8,afade=t=out:st=${Math.max(duration - 2, 0)}:d=2`,
  "-c:v", "libx264",
  "-preset", "medium",
  "-crf", "20",
  "-r", "25",
  "-c:a", "aac",
  "-b:a", "192k",
  "-movflags", "+faststart",
  outPath
];

console.log(`Rendering teaser for card ${card.id} (${card.title}), ${duration}s...`);

const exitCode = await runFfmpeg(ffmpeg, ffmpegArgs);
if (exitCode !== 0) {
  process.exit(exitCode);
}

const stat = await fs.stat(outPath);
console.log(`Teaser ready: ${outPath} (${(stat.size / 1024 / 1024).toFixed(1)} MB, 1080x1920, ${duration}s).`);

function buildFilterComplex() {
  const titleText = drawtextEscape(`${formatCardNumber(card)} — ${card.title}`);
  const drawTitle = fontFile
    ? `,drawtext=fontfile='${fontPathEscape(fontFile)}':text='${titleText}':fontcolor=0xF5E8CC:fontsize=46:x=(w-text_w)/2:y=h-300:shadowcolor=0x120904:shadowx=2:shadowy=2` +
      `,drawtext=fontfile='${fontPathEscape(fontFile)}':text='Cello Cool Club':fontcolor=0xC5A059:fontsize=32:x=(w-text_w)/2:y=h-220:shadowcolor=0x120904:shadowx=2:shadowy=2`
    : "";

  return (
    `[0:v]scale=1440:2560:force_original_aspect_ratio=increase,crop=1440:2560,gblur=sigma=28,eq=brightness=-0.18[bg];` +
    `[0:v]scale=1240:-2[art];` +
    `[bg][art]overlay=(W-w)/2:(H-h)/2-120,` +
    `zoompan=z='min(zoom+0.0003,1.10)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=25,` +
    `fade=t=in:d=0.8,fade=t=out:st=${Math.max(duration - 1, 0)}:d=1,` +
    `format=yuv420p${drawTitle}[v]`
  );
}

function drawtextEscape(value) {
  return String(value)
    .replaceAll("\\", "")
    .replaceAll("'", "’")
    .replaceAll(":", "\\:")
    .replaceAll("%", "\\%")
    .replaceAll(";", "\\;")
    .replaceAll("[", "(")
    .replaceAll("]", ")");
}

function fontPathEscape(value) {
  return value.replaceAll("\\", "/").replaceAll(":", "\\:");
}

async function resolveFont() {
  const fontsDir = path.join(process.env.WINDIR || "C:\\Windows", "Fonts");
  for (const candidate of ["georgia.ttf", "times.ttf", "arial.ttf"]) {
    const fontPath = path.join(fontsDir, candidate);
    try {
      await fs.access(fontPath);
      return fontPath;
    } catch {
      // try next candidate
    }
  }
  console.warn("No usable system font found; rendering teaser without text overlay.");
  return null;
}

async function resolveFfmpeg() {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;

  if (spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status === 0) {
    return "ffmpeg";
  }

  const packagesDir = path.join(process.env.LOCALAPPDATA || "", "Microsoft", "WinGet", "Packages");
  try {
    for (const entry of await fs.readdir(packagesDir)) {
      if (!entry.startsWith("Gyan.FFmpeg")) continue;
      for (const sub of await fs.readdir(path.join(packagesDir, entry))) {
        const candidate = path.join(packagesDir, entry, sub, "bin", "ffmpeg.exe");
        try {
          await fs.access(candidate);
          return candidate;
        } catch {
          // not this subfolder
        }
      }
    }
  } catch {
    // WinGet packages dir missing entirely
  }

  throw new Error("ffmpeg not found. Install it (winget install Gyan.FFmpeg) or set FFMPEG_PATH in .env.");
}

function runFfmpeg(command, commandArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, { stdio: ["ignore", "ignore", "pipe"] });
    let stderrTail = "";

    child.stderr.on("data", (chunk) => {
      stderrTail = `${stderrTail}${chunk}`.slice(-4000);
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        console.error("ffmpeg failed:");
        console.error(stderrTail);
      }
      resolve(code ?? 1);
    });
  });
}
