import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { engineRoot, readCards, sortCards, validateCards } from "./card-utils.mjs";
import {
  approveCard,
  attachAudioToCard,
  attachImageToCard,
  createCardFromSource,
  previewCard
} from "./card-workflow.mjs";
import { listSourceFiles, parseSourceFile } from "./source-parser.mjs";

const port = Number(process.env.ADMIN_PORT || 5174);
const adminPath = path.join(engineRoot, "admin");

const server = http.createServer(async (req, res) => {
  try {
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

  const cardActionMatch = url.pathname.match(/^\/api\/cards\/([^/]+)\/(attach-image|attach-audio|preview|approve)$/);
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

  if (!fullPath.startsWith(adminPath)) {
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
