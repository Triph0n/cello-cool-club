#!/usr/bin/env node
// Katalog už vyrobených písní — jediné místo, kde se ověřuje, jestli píseň
// existuje, než se pustí generování v Suno.
//
//   node scripts/suno-catalog.mjs                 # načte celou Suno knihovnu přes CDP a přepíše katalog
//   node scripts/suno-catalog.mjs --offline       # přepočítá katalog jen z uloženého data/suno-clips.json
//   node scripts/suno-catalog.mjs --check "Titul" # zjistí, jestli je píseň hotová (exit 0 = je)
//
// Suno klipy chodí z feed API (Clerk token z přihlášené stránky v Chromu na
// portu 9222). Titul klipu se páruje na anglický titul i na slug karty —
// část sbírky je v Suno uložená pod francouzským názvem.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COLLECTION = path.resolve(ROOT, '..');
const CLIPS_JSON = path.join(ROOT, 'data', 'suno-clips.json');
const CATALOG_JSON = path.join(ROOT, 'data', 'suno-catalog.json');
const CATALOG_MD = path.join(ROOT, 'exports', 'suno', 'produced-songs.md');
const CARDS_JSON = path.join(ROOT, 'data', 'cards.json');
const MASTER_TEXT = path.join(COLLECTION, 'assets', 'text', 'AllEnglishTexts.md');
const AUDIO_DIRS = [
  path.join(COLLECTION, 'assets', 'audio'),
  path.join(process.env.USERPROFILE || process.env.HOME || '', 'Downloads'),
];
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';

// --- normalizace názvů -------------------------------------------------------
// Bez interpunkce a diakritiky, bez číselného prefixu souboru i suffixu variant,
// takže "0024-the-child-s-question.mp3" == "The Child's Question".
export function key(s) {
  return String(s || '')
    .replace(/\.mp3$/i, '')
    .replace(/\s*\[\d{4}-\d{2}-\d{2}\]\s*(\(\d+\))?$/, '')
    .replace(/\s*\[\d{3}\]$/, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .replace(/^\d+/, '')
    .replace(/\d+$/, '');
}
const noThe = (k) => (k.startsWith('the') ? k.slice(3) : k);
const keys = (s) => [...new Set([key(s), noThe(key(s))])].filter(Boolean);

// --- minimální CDP klient ----------------------------------------------------
async function sunoEvaluate() {
  const list = await (await fetch(`${CDP}/json/list`)).json();
  let target = list.find((x) => x.type === 'page' && x.url.startsWith('https://suno.com/'));
  // Dlouho otevřené taby přestanou odpovídat na CDP — vždy si otevři čerstvý.
  const fresh = await fetch(`${CDP}/json/new?https://suno.com/me`, { method: 'PUT' });
  if (fresh.ok) target = await fresh.json();
  if (!target) throw new Error('Nenalezen tab se suno.com — je Chrome spuštěný s --remote-debugging-port=9222?');

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = () => rej(new Error('CDP WebSocket se nepodařilo otevřít'));
  });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id);
      pending.delete(m.id);
      m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
    }
  };
  const evaluate = (expression, timeoutMs = 60000) =>
    Promise.race([
      new Promise((res, rej) => {
        const myId = ++id;
        pending.set(myId, { res, rej });
        ws.send(JSON.stringify({
          id: myId,
          method: 'Runtime.evaluate',
          params: { expression, awaitPromise: true, returnByValue: true },
        }));
      }).then((r) => {
        if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'JS exception');
        return r.result.value;
      }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('CDP evaluate timeout')), timeoutMs)),
    ]);
  return { evaluate, close: () => ws.close(), targetId: target.id };
}

async function fetchAllClips() {
  const cdp = await sunoEvaluate();
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  // Clerk potřebuje chvíli po otevření tabu.
  for (let i = 0; i < 30; i++) {
    if (await cdp.evaluate('(async()=>!!(window.Clerk&&window.Clerk.session))()', 15000)) break;
    await sleep(1000);
  }
  const all = [];
  let backoff = 1500; // feed API vrací 429, když se tahá bez prodlevy
  for (let page = 0; page < 500; page++) {
    await sleep(backoff);
    const batch = await cdp.evaluate(`(async () => {
      const token = await window.Clerk.session.getToken();
      const r = await fetch('https://studio-api.prod.suno.com/api/feed/v2?page=${page}', {
        headers: { Authorization: 'Bearer ' + token } });
      if (!r.ok) return { error: r.status + '' };
      const j = await r.json();
      const clips = j.clips || j;
      return { clips: clips.map(c => ({ id: c.id, title: c.title, created_at: c.created_at,
        play_count: c.play_count, audio_url: c.audio_url })) };
    })()`);
    if (batch.error === '429') {
      backoff = Math.min(backoff * 2, 60000);
      process.stderr.write(`  429 — čekám ${backoff / 1000}s\n`);
      page--;
      continue;
    }
    if (batch.error) throw new Error(`feed API: ${batch.error}`);
    if (!batch.clips.length) break;
    backoff = Math.max(1500, Math.round(backoff * 0.9));
    all.push(...batch.clips);
    if (page % 10 === 0) process.stderr.write(`  strana ${page}: celkem ${all.length}\n`);
  }
  cdp.close();
  return all;
}

// --- vstupy ------------------------------------------------------------------
function loadCards() {
  const raw = JSON.parse(fs.readFileSync(CARDS_JSON, 'utf8'));
  return Array.isArray(raw) ? raw : raw.cards || [];
}

function loadLocalFiles() {
  const out = [];
  for (const dir of AUDIO_DIRS) {
    if (!dir || !fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.toLowerCase().endsWith('.mp3')) continue;
      out.push({ file: f, dir, mtime: fs.statSync(path.join(dir, f)).mtime.toISOString().slice(0, 10) });
    }
  }
  return out;
}

function loadMasterTitles() {
  if (!fs.existsSync(MASTER_TEXT)) return [];
  const txt = fs.readFileSync(MASTER_TEXT, 'utf8');
  return [...txt.matchAll(/^##\s+(\d+)\.\s*(.+)$/gm)].map((m) => ({ number: Number(m[1]), title: m[2].trim() }));
}

// --- sestavení katalogu ------------------------------------------------------
function buildCatalog(clips, cards, localFiles, masterTitles) {
  const entries = new Map(); // primární klíč -> záznam

  const touch = (primaryKey, seed) => {
    if (!entries.has(primaryKey)) {
      entries.set(primaryKey, {
        title: seed.title,
        canonicalNumber: seed.canonicalNumber ?? null,
        // Dvě karty mohou nést stejný anglický titul (dva překlady téže básně),
        // proto seznam, ne jedna hodnota — jinak by karta bez audia vypadala jako hotová.
        cards: [],
        aliases: [],
        sunoClips: [],
        localFiles: [],
      });
    }
    const e = entries.get(primaryKey);
    if (seed.canonicalNumber != null && e.canonicalNumber == null) e.canonicalNumber = seed.canonicalNumber;
    return e;
  };

  // Přesná shoda titulu musí mít přednost před aliasem „bez počátečního The".
  // Jinak si "THE MATCHES" přivlastní klipy samostatného titulu "MATCHES"
  // a ten pak vypadá jako nevyrobený → hrozí duplicitní generování.
  const exact = new Map();
  const alias = new Map();
  const registerExact = (k, primary) => {
    if (k && !exact.has(k)) exact.set(k, primary);
  };
  const registerAlias = (k, primary) => {
    if (k && !alias.has(k)) alias.set(k, primary);
  };
  const resolve = (title) => {
    const k = key(title);
    return exact.get(k) || alias.get(k) || exact.get(noThe(k)) || alias.get(noThe(k)) || null;
  };

  // 1) kanonické texty jsou páteří katalogu — nejdřív všechny přesné klíče
  for (const t of masterTitles) {
    const primary = key(t.title);
    touch(primary, { title: t.title, canonicalNumber: t.number });
    registerExact(primary, primary);
  }
  for (const t of masterTitles) registerAlias(noThe(key(t.title)), key(t.title));

  // 2) karty přidají anglický titul i (často francouzský) slug jako alias
  for (const c of cards) {
    const cardTitles = [c.title, c.slug, c.songTitle].filter(Boolean);
    const primary = cardTitles.map(resolve).find(Boolean) || key(c.title || c.slug);
    const e = touch(primary, { title: c.title || c.slug });
    if (!e.cards.some((x) => x.id === c.id)) {
      e.cards.push({ id: c.id, slug: c.slug, hasAudio: Boolean(c.audio || c.audioFile || c.audioPath) });
    }
    for (const a of [c.slug, c.songTitle].filter(Boolean)) {
      if (key(a) !== primary && !e.aliases.includes(a)) e.aliases.push(a);
    }
    for (const t of cardTitles) {
      registerExact(key(t), primary);
      registerAlias(noThe(key(t)), primary);
    }
  }

  // 3) Suno klipy
  for (const c of clips) {
    if (!c.title) continue;
    const primary = resolve(c.title) || key(c.title);
    const e = touch(primary, { title: c.title.trim() });
    registerExact(key(c.title), primary);
    registerAlias(noThe(key(c.title)), primary);
    if (key(c.title) !== primary && !e.aliases.includes(c.title.trim())) e.aliases.push(c.title.trim());
    e.sunoClips.push({ id: c.id, title: c.title.trim(), created_at: c.created_at || null });
  }

  // 4) lokální soubory
  for (const f of localFiles) {
    const primary = resolve(f.file);
    if (!primary || !entries.has(primary)) continue;
    entries.get(primary).localFiles.push({ file: f.file, dir: f.dir, date: f.mtime });
  }

  for (const e of entries.values()) {
    e.sunoClips.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
    e.localFiles.sort((a, b) => a.date.localeCompare(b.date));
    e.cards.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    e.versions = e.sunoClips.length;
    e.produced = e.sunoClips.length > 0 || e.localFiles.length > 0;
    e.cardsWithoutAudio = e.cards.filter((c) => !c.hasAudio).map((c) => c.id);
  }
  return [...entries.values()].sort(
    (a, b) => (a.canonicalNumber ?? 9e9) - (b.canonicalNumber ?? 9e9) || a.title.localeCompare(b.title),
  );
}

function writeMarkdown(catalog) {
  const produced = catalog.filter((e) => e.produced);
  const todo = catalog.filter((e) => !e.produced && e.canonicalNumber != null);
  const multi = produced.filter((e) => e.versions > 1);

  const cardsWithoutAudio = catalog.filter((e) => e.cardsWithoutAudio.length);
  const row = (e) => {
    const dates = [...new Set(e.sunoClips.map((c) => (c.created_at || '').slice(0, 10)).filter(Boolean))];
    const alias = e.aliases.length ? ` _(${e.aliases.join(', ')})_` : '';
    const cardIds = e.cards.map((c) => (c.hasAudio ? c.id : `${c.id}⚠`)).join(', ');
    return `| ${e.canonicalNumber ?? ''} | ${e.title}${alias} | ${cardIds} | ${e.versions} | ${e.localFiles.length} | ${dates.join(', ')} |`;
  };

  const md = [
    '# Vyrobené písně — katalog',
    '',
    '**Než pustíš generování v Suno, zkontroluj tenhle seznam.** Generuje ho',
    '`npm run suno-catalog` (plný scan Suno knihovny) nebo `npm run suno-catalog -- --offline`',
    '(přepočet z uloženého `data/suno-clips.json`). Rychlý dotaz na jeden titul:',
    '`node scripts/suno-catalog.mjs --check "The Watchmaker"`.',
    '',
    'Titul se páruje bez diakritiky a interpunkce, a to na **anglický titul i na slug karty** —',
    'část sbírky je v Suno uložená pod francouzským názvem (`La Grève des Couleurs` = The Colors\' Strike).',
    '',
    '## Souhrn',
    '',
    `- kanonických textů: **${catalog.filter((e) => e.canonicalNumber != null).length}**`,
    `- vyrobených položek (klip v Suno nebo lokální MP3): **${produced.length}**`,
    `- z toho s více verzemi: **${multi.length}**`,
    `- kanonických textů zatím bez písně: **${todo.length}**`,
    `- karet bez audia: **${cardsWithoutAudio.reduce((n, e) => n + e.cardsWithoutAudio.length, 0)}**`,
    '',
    '## Karty bez audia',
    '',
    'Pozor: dvě karty mohou sdílet anglický titul (dva překlady téže básně). Že je titul',
    'v katalogu „vyrobený" tedy neznamená, že píseň má i sesterská karta — rozhoduje se',
    'podle textu klipu (`GET /api/clip/<id>` → `metadata.prompt`), ne podle názvu.',
    '',
    ...(cardsWithoutAudio.length
      ? [
          '| karta | titul | verzí titulu v Suno |',
          '|---|---|---|',
          ...cardsWithoutAudio.flatMap((e) =>
            e.cardsWithoutAudio.map((id) => `| ${id} | ${e.title} | ${e.versions} |`),
          ),
        ]
      : ['_Žádné._']),
    '',
    '## Vyrobené',
    '',
    '⚠ u čísla karty = karta zatím nemá přiložené audio.',
    '',
    '| # | titul | karty | verzí v Suno | lokálních MP3 | data generací |',
    '|---|---|---|---|---|---|',
    ...produced.map(row),
    '',
    '## Kanonické texty bez písně — k výrobě',
    '',
    ...(todo.length
      ? ['| # | titul | karta |', '|---|---|---|', ...todo.map((e) => `| ${e.canonicalNumber} | ${e.title} | ${e.cards.map((c) => c.id).join(', ')} |`)]
      : ['_Žádné._']),
    '',
  ].join('\n');
  fs.mkdirSync(path.dirname(CATALOG_MD), { recursive: true });
  fs.writeFileSync(CATALOG_MD, md, 'utf8');
}

// --- CLI ---------------------------------------------------------------------
const args = process.argv.slice(2);
const checkIdx = args.indexOf('--check');

if (checkIdx >= 0) {
  const query = args[checkIdx + 1];
  if (!query) {
    console.error('Použití: node scripts/suno-catalog.mjs --check "Titul"');
    process.exit(2);
  }
  if (!fs.existsSync(CATALOG_JSON)) {
    console.error('Katalog ještě neexistuje — spusť `npm run suno-catalog`.');
    process.exit(2);
  }
  const catalog = JSON.parse(fs.readFileSync(CATALOG_JSON, 'utf8')).entries;
  // Nejdřív přesná shoda titulu nebo aliasu, teprve pak volnější bez „The".
  const qExact = key(query);
  const hit =
    catalog.find((e) => [e.title, ...e.aliases].some((t) => key(t) === qExact)) ||
    catalog.find((e) => [e.title, ...e.aliases].flatMap(keys).some((k) => keys(query).includes(k)));
  if (!hit || !hit.produced) {
    console.log(`NENÍ VYROBENO: "${query}" — v katalogu není žádný klip ani MP3.`);
    process.exit(1);
  }
  console.log(`UŽ VYROBENO: ${hit.title}${hit.aliases.length ? ` (${hit.aliases.join(', ')})` : ''}`);
  const cardLabel = hit.cards.length
    ? hit.cards.map((c) => `${c.id}${c.hasAudio ? '' : ' (BEZ AUDIA)'}`).join(', ')
    : '—';
  console.log(`  karty: ${cardLabel}, verzí v Suno: ${hit.versions}, lokálních MP3: ${hit.localFiles.length}`);
  if (hit.cardsWithoutAudio.length) {
    console.log(`  POZOR: karta ${hit.cardsWithoutAudio.join(', ')} audio nemá — ověř text klipu, může jít o druhý překlad.`);
  }
  for (const c of hit.sunoClips) console.log(`  klip ${(c.created_at || '').slice(0, 10)}  ${c.title}  ${c.id}`);
  for (const f of hit.localFiles) console.log(`  soubor ${f.date}  ${f.file}`);
  process.exit(0);
}

const offline = args.includes('--offline');
let clips;
if (offline) {
  if (!fs.existsSync(CLIPS_JSON)) {
    console.error(`Chybí ${CLIPS_JSON} — spusť nejdřív bez --offline.`);
    process.exit(2);
  }
  clips = JSON.parse(fs.readFileSync(CLIPS_JSON, 'utf8')).clips;
  console.log(`offline: ${clips.length} klipů z ${path.basename(CLIPS_JSON)}`);
} else {
  console.log('Načítám celou Suno knihovnu přes CDP…');
  clips = await fetchAllClips();
  fs.mkdirSync(path.dirname(CLIPS_JSON), { recursive: true });
  fs.writeFileSync(CLIPS_JSON, JSON.stringify({ scannedAt: new Date().toISOString(), clips }, null, 1));
  console.log(`staženo ${clips.length} klipů → ${path.relative(ROOT, CLIPS_JSON)}`);
}

const catalog = buildCatalog(clips, loadCards(), loadLocalFiles(), loadMasterTitles());
fs.writeFileSync(
  CATALOG_JSON,
  JSON.stringify({ generatedAt: new Date().toISOString(), clipCount: clips.length, entries: catalog }, null, 1),
);
writeMarkdown(catalog);

const produced = catalog.filter((e) => e.produced).length;
const multi = catalog.filter((e) => e.versions > 1).length;
const todo = catalog.filter((e) => !e.produced && e.canonicalNumber != null).length;
console.log(`\nkatalog: ${catalog.length} položek, vyrobeno ${produced} (${multi} s více verzemi), k výrobě ${todo}`);
console.log(`  ${path.relative(ROOT, CATALOG_JSON)}`);
console.log(`  ${path.relative(ROOT, CATALOG_MD)}`);
