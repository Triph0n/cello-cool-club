import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { engineRoot, readCards, sortCards, validateCards } from "./card-utils.mjs";
import {
  approveCard,
  attachAudioToCard,
  attachImageToCard,
  createCardFromSource,
  deleteDraftCard,
  previewCard
} from "./card-workflow.mjs";
import { findCard } from "./release-utils.mjs";
import { listSourceFiles, parseSourceFile } from "./source-parser.mjs";
import { exportSunoBatch, exportSunoPacket } from "./suno-packet.mjs";

const port = Number(process.env.ADMIN_PORT || 5174);
const adminPath = path.join(engineRoot, "admin");

const server = http.createServer(async (req, res) => {
  try {
    if (!isTrustedRequest(req)) {
      sendJson(res, 403, { error: "Forbidden: request must come from the local admin panel." });
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }

    await serveStatic(req, res, url);
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Cello Cool Club Engine admin: http://127.0.0.1:${port}/`);
});

const trustedHosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
const trustedOrigins = new Set([`http://127.0.0.1:${port}`, `http://localhost:${port}`]);

function isTrustedRequest(req) {
  if (!trustedHosts.has(req.headers.host || "")) return false;

  const origin = req.headers.origin;
  if (origin && !trustedOrigins.has(origin)) return false;

  return true;
}

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/status") {
    const cards = sortCards(await readCards());
    const errors = validateCards(cards);
    sendJson(res, 200, { ok: errors.length === 0, errors, cardsCount: cards.length });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/cards") {
    sendJson(res, 200, { cards: sortCards(await readCards()) });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/sources") {
    const sources = [];
    for (const file of await listSourceFiles()) {
      const poems = await parseSourceFile(file.name);
      sources.push({ name: file.name, poems });
    }
    sendJson(res, 200, { sources });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/cards/from-source") {
    const body = await readJsonBody(req);
    const result = await createCardFromSource(body);
    sendJson(res, 200, result);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/open-file-dialog") {
    try {
      const { execFile } = await import("node:child_process");
      const { promisify } = await import("node:util");
      const psh = `Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.OpenFileDialog; $f.Filter = 'All Files (*.*)|*.*'; $f.ShowHelp = $true; $f.ShowDialog() > $null; $f.FileName`;
      const { stdout } = await promisify(execFile)("powershell", ["-NoProfile", "-STA", "-Command", psh], { encoding: "utf8" });
      sendJson(res, 200, { path: stdout.trim() });
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/suno/batch-create") {
    const body = await readJsonBody(req);
    const numbers = parseNumberRange(body.range);
    const sourceFile = String(body.sourceFile || "").trim();
    const language = body.language || "en";

    if (!sourceFile) {
      sendJson(res, 400, { error: "Choose a source file first." });
      return;
    }

    if (numbers.length === 0) {
      sendJson(res, 400, { error: "Enter at least one poem number." });
      return;
    }

    if (numbers.length > 25) {
      sendJson(res, 400, { error: "Batch limit is 25 poems at once." });
      return;
    }

    const packets = [];
    const errors = [];

    for (const number of numbers) {
      try {
        const result = await createCardFromSource({
          sourceFile,
          sourceNumber: number,
          language
        });
        const packet = await exportSunoPacket(result.card);
        packets.push({
          ...packet,
          sourceNumber: number,
          createdCard: result.created
        });
      } catch (error) {
        errors.push({ sourceNumber: number, error: error.message });
      }
    }

    const batch = await exportSunoBatch({
      sourceFile,
      range: body.range,
      language,
      packets,
      errors
    });
    sendJson(res, 200, { batch });
    return;
  }

  const sunoExportMatch = url.pathname.match(/^\/api\/cards\/([^/]+)\/export-suno$/);
  if (req.method === "POST" && sunoExportMatch) {
    const [, idOrSlug] = sunoExportMatch;
    const card = findCard(await readCards(), idOrSlug);

    if (!card) {
      sendJson(res, 404, { error: `Card not found: ${idOrSlug}` });
      return;
    }

    const packet = await exportSunoPacket(card);
    sendJson(res, 200, { card, packet });
    return;
  }

  const cardActionMatch = url.pathname.match(/^\/api\/cards\/([^/]+)\/(attach-image|attach-audio|preview|approve|delete)$/);
  if (req.method === "POST" && cardActionMatch) {
    const [, idOrSlug, action] = cardActionMatch;
    const body = await readJsonBody(req);
    let result;

    if (action === "attach-image") {
      result = await attachImageToCard(idOrSlug, body.path);
    } else if (action === "attach-audio") {
      result = await attachAudioToCard(idOrSlug, body.path);
    } else if (action === "preview") {
      result = await previewCard(idOrSlug);
    } else if (action === "approve") {
      result = await approveCard(idOrSlug);
    } else if (action === "delete") {
      result = await deleteDraftCard(idOrSlug);
    }

    sendJson(res, 200, result);
    return;
  }

  sendJson(res, 404, { error: "API route not found." });
}

async function serveStatic(req, res, url) {
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const relativePath = decodeURIComponent(pathname.replace(/^\/+/, ""));
  const fullPath = path.resolve(adminPath, relativePath);
  const relativeToAdmin = path.relative(adminPath, fullPath);

  if (relativeToAdmin.startsWith("..") || path.isAbsolute(relativeToAdmin)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  try {
    const stat = await fs.stat(fullPath);
    if (!stat.isFile()) {
      sendText(res, 404, "Not found");
      return;
    }

    const content = await fs.readFile(fullPath);
    res.writeHead(200, { "Content-Type": getContentType(fullPath) });
    res.end(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      sendText(res, 404, "Not found");
      return;
    }
    throw error;
  }
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload, null, 2));
}

function sendText(res, status, text) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".html") return "text/html; charset=utf-8";
  if (extension === ".css") return "text/css; charset=utf-8";
  if (extension === ".js") return "text/javascript; charset=utf-8";
  if (extension === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

function parseNumberRange(value) {
  const numbers = new Set();
  const text = String(value || "").trim();
  if (!text) return [];

  for (const part of text.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const rangeMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < 1) {
        throw new Error(`Invalid range: ${trimmed}`);
      }

      const step = start <= end ? 1 : -1;
      for (let current = start; current !== end + step; current += step) {
        numbers.add(current);
      }
      continue;
    }

    const number = Number(trimmed);
    if (!Number.isInteger(number) || number < 1) {
      throw new Error(`Invalid poem number: ${trimmed}`);
    }
    numbers.add(number);
  }

  return [...numbers];
}
