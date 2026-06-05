import fs from "node:fs/promises";
import path from "node:path";
import { engineRoot, slugify } from "./card-utils.mjs";

export const inboxPath = path.join(engineRoot, "data", "inbox");
export const cleanSourcesPath = path.join(engineRoot, "data", "clean-sources");

export async function listSourceFiles() {
  const inboxEntries = await listFiles(inboxPath, ".txt", "inbox");
  const cleanEntries = await listFiles(cleanSourcesPath, ".md", "clean");
  return [...cleanEntries, ...inboxEntries].sort((a, b) => a.name.localeCompare(b.name));
}

export async function parseSourceFile(fileName) {
  const source = resolveSource(fileName);
  const fullPath = path.join(source.root, source.fileName);
  const raw = await fs.readFile(fullPath, "utf8");
  return source.kind === "clean"
    ? parseCleanMarkdownPoems(raw, source.id)
    : parsePoems(raw, source.id);
}

export function parsePoems(raw, sourceFile = "unknown") {
  const normalized = raw.replace(/\r/g, "").replace(/\u2019/g, "'");
  const lines = normalized.split("\n");
  const starts = [];

  lines.forEach((line, index) => {
    if (/^\d+\.\s+/.test(line.trim())) {
      starts.push(index);
    }
  });

  return starts.map((startIndex, index) => {
    const endIndex = starts[index + 1] ?? lines.length;
    const block = lines.slice(startIndex, endIndex);
    return parsePoemBlock(block, sourceFile);
  }).filter(Boolean);
}

function parsePoemBlock(block, sourceFile) {
  const header = block[0]?.trim();
  const headerMatch = header?.match(/^(\d+)\.\s+(.+?)(?:\s+\((.+)\))?$/);
  if (!headerMatch) return null;

  const number = Number(headerMatch[1]);
  const frenchTitle = headerMatch[2].trim();
  const titleParts = (headerMatch[3] || "").split("/").map((part) => part.trim()).filter(Boolean);
  const czechTitle = titleParts[0] || "";
  const englishTitle = titleParts[1] || frenchTitle;
  const sections = extractSections(block.slice(1));

  return {
    sourceFile,
    number,
    slug: slugify(englishTitle || frenchTitle),
    titles: {
      fr: frenchTitle,
      cs: czechTitle,
      en: englishTitle
    },
    texts: {
      fr: sections.Francais || sections["Français"] || [],
      cs: sections["Česky"] || [],
      en: sections.English || []
    }
  };
}

function extractSections(lines) {
  const labels = new Set(["Français", "Francais", "Česky", "English"]);
  const sections = {};
  let current = null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (labels.has(trimmed)) {
      current = trimmed;
      sections[current] = [];
      return;
    }

    if (current) {
      sections[current].push(trimmed);
    }
  });

  return sections;
}

export function parseCleanMarkdownPoems(raw, sourceFile = "unknown") {
  const normalized = raw.replace(/\r/g, "").replace(/\u2019/g, "'");
  const lines = normalized.split("\n");
  const starts = [];

  lines.forEach((line, index) => {
    if (/^#{1,6}\s+\d+\.\s+/.test(line.trim())) {
      starts.push(index);
    }
  });

  return starts.map((startIndex, index) => {
    const endIndex = starts[index + 1] ?? lines.length;
    const block = lines.slice(startIndex, endIndex);
    return parseCleanMarkdownBlock(block, sourceFile);
  }).filter(Boolean);
}

function parseCleanMarkdownBlock(block, sourceFile) {
  const header = block[0]?.trim();
  const headerMatch = header?.match(/^#{1,6}\s+(\d+)\.\s+(.+)$/);
  if (!headerMatch) return null;

  const number = Number(headerMatch[1]);
  const title = headerMatch[2].trim();
  const text = block.slice(1).map((line) => line.trim()).filter(Boolean);

  return {
    sourceFile,
    number,
    slug: slugify(title),
    titles: {
      fr: "",
      cs: "",
      en: title
    },
    texts: {
      fr: [],
      cs: [],
      en: text
    }
  };
}

async function listFiles(root, extension, kind) {
  try {
    const entries = await fs.readdir(root, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(extension) && !entry.name.toLowerCase().startsWith("readme."))
      .map((entry) => ({
        kind,
        name: `${kind}/${entry.name}`,
        fileName: entry.name,
        path: path.join(root, entry.name)
      }));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

function resolveSource(fileName) {
  const normalized = fileName.replaceAll("\\", "/");
  const kind = normalized.startsWith("clean/") ? "clean" : "inbox";
  const root = kind === "clean" ? cleanSourcesPath : inboxPath;
  const sourceName = normalized.includes("/") ? normalized.split("/").at(-1) : normalized;

  return {
    id: `${kind}/${path.basename(sourceName)}`,
    kind,
    root,
    fileName: path.basename(sourceName)
  };
}
