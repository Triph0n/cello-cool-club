// Cello Cool Club — Dashboard: maly staticky server bez zavislosti.
// Spusteni:  node serve.mjs   ->  http://localhost:8790
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8790;
// Dashboard zije uvnitr projektu (CelloCoolClub/dashboard), takze projekt je o uroven vys.
// Nic se do dashboardu nekopiruje — vse se servíruje primo z jedne slozky projektu.
const PROJECT = process.env.CCC_ROOT || join(ROOT, '..');
const MOUNTS = {
  '/ccc-audio/': process.env.CCC_AUDIO || join(PROJECT, 'assets', 'audio'),
  '/ccc-posters-hires/': join(PROJECT, 'assets', 'posters-hires'),
  '/ccc-posters/': join(PROJECT, 'assets', 'posters'),
  '/ccc-refs/': join(PROJECT, 'assets', 'poster-references'),
  '/ccc-poems/': join(PROJECT, 'poems')
};
const TYPES = {
  '.html':'text/html; charset=utf-8', '.json':'application/json; charset=utf-8',
  '.js':'text/javascript', '.css':'text/css', '.mjs':'text/javascript',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.mp3':'audio/mpeg', '.svg':'image/svg+xml', '.ico':'image/x-icon',
  '.md':'text/plain; charset=utf-8'
};

const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/' || p === '') p = '/index.html';

    // Pripojene slozky projektu: /ccc-audio/, /ccc-posters/, /ccc-refs/, /ccc-poems/
    const mount = Object.keys(MOUNTS).find((m) => p.startsWith(m));
    if (mount) {
      const base = normalize(MOUNTS[mount]);
      const target = normalize(join(base, p.slice(mount.length)));
      if (!target.startsWith(base)) { res.writeHead(403).end('forbidden'); return; }
      const ts = await stat(target).catch(() => null);
      if (!ts || !ts.isFile()) { res.writeHead(404).end('not found'); return; }
      res.writeHead(200, {
        'content-type': TYPES[extname(target).toLowerCase()] || 'application/octet-stream',
        'cache-control': 'no-store'
      }).end(await readFile(target));
      return;
    }

    const file = normalize(join(ROOT, p));
    if (!file.startsWith(ROOT)) { res.writeHead(403).end('forbidden'); return; }
    const s = await stat(file).catch(() => null);
    if (!s || !s.isFile()) { res.writeHead(404).end('not found'); return; }
    const buf = await readFile(file);
    res.writeHead(200, {
      'content-type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store'
    }).end(buf);
  } catch (e) {
    res.writeHead(500).end(String(e));
  }
});

server.listen(PORT, () => {
  console.log(`Cello Cool Club dashboard -> http://localhost:${PORT}`);
});
