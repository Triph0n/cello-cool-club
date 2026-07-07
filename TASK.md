# Cello Cool Club — Task list (vylepšení, 2026-07-07)

> Nahrazuje předchozí TASK.md (admin panel — kompletně hotový, viz git historie).
> Každý úkol je samostatně uchopitelný jiným agentem. Kontext: `README.md`,
> `docs/ARCHITECTURE.md`, `docs/NAVOD.md`, PRD webu `..\CelloCoolClub\PRD.md`.
> Konvence: Node ESM, žádný framework, jediná npm závislost `sharp`.
> Veřejný web `..\CelloCoolClub` se NIKDY needituje ručně — vše přes `npm run export`.

## Blok A — Kritické (web musí být nasaditelný a sdílitelný)

- [x] **A1. Deploy na Cloudflare Pages** *(hotovo 2026-07-07)*:
  web žije na **https://cello-cool-club.pages.dev** (projekt `cello-cool-club`,
  účet 01a01df36067a71caa1ac8a9ec326c35, direct upload přes wrangler).
  Opakovaný deploy: `npm run deploy` (= build + `scripts/deploy-pages.mjs`,
  který nasadí jen veřejné soubory — bez PRD, zdrojů, preview).
  `.env`: `PUBLIC_SITE_URL`, `CLOUDFLARE_ACCOUNT_ID`, `CF_PAGES_PROJECT`.
  Pozn.: wrangler OAuth vyprší — když deploy hlásí CLOUDFLARE_API_TOKEN error,
  spustit `npx wrangler login` (odklikne se v prohlížeči).
  Vlastní doména: v Cloudflare Pages → Custom domains (volitelné, na Vladimírovi).
- [x] **A2. SEO minimum v exportéru** *(hotovo 2026-07-07)* (`scripts/export-public-site.mjs`, `scripts/renderers.mjs`):
  canonical `<link>`, `sitemap.xml`, `robots.txt`, favicon linky (ikona
  `assets/ccc-icon.ico` + `ccc-logo.png` už na webu jsou), JSON-LD (`CreativeWork`
  s poem textem) na kartách, vyplněný `<link>` kanálu ve `feed.xml`.
  Vše přes `PUBLIC_SITE_URL` (helper `toAbsoluteUrl` v `card-utils.mjs`);
  bez nastavené URL se absolutní tagy vynechají (degradace, ne rozbití).
  Akceptace: `npm test` zelený, výstup obsahuje sitemap/robots/canonical/JSON-LD.
- [x] **A3. Stabilní identita homepage** *(hotovo 2026-07-07)*: `<title>` a meta description homepage
  nemá být přepisována aktuální kartou. Titulek „Cello Cool Club — a new poem
  card every 3 days“, karta zůstává v og:image.
- [x] **A4. Obrázky** *(hotovo 2026-07-07 kromě volitelného WebP)*: do exportu doplnit `width`/`height` atributy (proti layout
  shiftu), `loading="lazy"` v archivu, `decoding="async"`.
  Volitelně WebP varianta přes `sharp` a `<picture>`.
  Akceptace: exportované stránky obsahují rozměry obrázků.

## Blok B — Engine (automatizace)

- [ ] **B1. Scheduler release**: Windows Task Scheduler úloha spouštějící
  `npm run run-release -- --confirm` každý den 7:30 (skript sám pozná release
  den — logika v `scripts/release-utils.mjs`, kadence 3 dny, TZ Asia/Jerusalem).
  Dodat `scripts/install-scheduler.ps1` (schtasks) + log do `exports/release/log/`.
  Pozor: spouštět jen po A1 (jinak posty s nefunkčními odkazy).
- [x] **B2. ffmpeg video teasery** *(hotovo 2026-07-07)*: `scripts/export-teaser.mjs`,
  npm skript `teaser` (`npm run teaser -- --card 007 [--duration 20] [--start 0]`).
  Výstup: 9:16 MP4 1080×1920 do `exports/teasers/` — rozmazané pozadí z artworku,
  jemný zoom, titulek + číslo karty (Georgia), wordmark, video i audio fade.
  ffmpeg se hledá: `FFMPEG_PATH` v `.env` → PATH → winget balíček Gyan.FFmpeg.
  Ověřeno na kartě 007 (2,1 MB, 20 s).
- [x] **B3. Suno download flow** *(přepracováno + hotovo 2026-07-07)*:
  Suno blokuje API i agentní automatizaci — MP3 se stahují klikáním
  v přihlášeném prohlížeči (Codex skill `suno-download-mp3`), soubory padají do
  `C:\Users\Vladimir\Downloads`. Místo API integrace z PRD §6/§12 vznikl
  `scripts/match-suno-downloads.mjs` (`npm run match-audio`): spáruje MP3 podle
  názvu s kartami bez audia (normalizace + Jaccard skóre), duplicitní verze
  téže písně seskupí (nejnovější vyhrává). Dry-run vypíše HIGH/LOW shody;
  `--confirm` přiloží jen HIGH (≥0.75, jednoznačné) přes `attachAudioToCard`;
  `--card <id> --file "Song.mp3"` pro ruční pár. `SUNO_DOWNLOADS_PATH` v `.env`
  pro jinou složku. Původní stavy `suno_submitted`/`suno_ready` nejsou potřeba.
- [ ] **B4. Threads adaptér**: `scripts/publish-threads.mjs` podle vzoru
  `publish-bluesky.mjs` (Threads Graph API: create media container → publish;
  token `THREADS_ACCESS_TOKEN` už je v `.env.example`). Double-post guard,
  zápis do `postedUrls.threads`. Dry-run bez `--confirm`.
- [ ] **B5. Odlehčení dat**: drafty bez assetů přesunout do `data/backlog.json`
  (nový skript + migrace), v `data/cards.json` nechat karty od `image_ready` výš.
  Rotace záloh `.bak.1`–`.bak.5` ve `writeCards`.
- [ ] **B6. Drobnosti**: sjednotit legacy `musicNotes` (karta 002) na
  `audioAttachment`; ověřit `OPENAI_IMAGE_MODEL` proti aktuálnímu API;
  `npm test` nesmí padat na čistém checkoutu (guard na chybějící vygenerované
  soubory v `test-suno-batches.mjs` a `check-public-site.mjs`).

## Blok C — Web (generováno exportérem, měnit jen šablony v enginu)

- [ ] **C1. Stránka About** (`/about/`): kdo projekt tvoří a proč, odkaz na archiv
  a RSS. Šablona do `renderers.mjs`, obsah do `data/site.json` (nový soubor:
  title, tagline, aboutText, links) — texty dodá Vladimír.
- [ ] **C2. Subscribe** (`/subscribe/`): formulář newsletteru (Buttondown/Kit embed,
  účet založí Vladimír) + viditelný odkaz na RSS. Odkaz z homepage.
- [ ] **C3. Sezónní stránky** `/seasons/<slug>/` (PRD je specifikuje): grid karet
  sezóny + krátký úvod sezóny.
- [ ] **C4. „Táhni kartu“** (`/draw/`): deterministická karta dne (seed = datum),
  klientsky nad veřejným `data/cards.json`. Tlačítko z homepage.
- [ ] **C5. 404 stránka.**
- [ ] **C6. Jazykové varianty karty**: model podporuje `language`; karta 001 má
  hotové FR/CS audio (`aiguilles-horloge-fr.mp3`, `ruce-casu-cs.mp3`). Návrh:
  pole `variants: [{language, poemText, audio}]` + přepínač na stránce karty.
- [ ] **C7. Analytika**: Cloudflare Web Analytics snippet (po A1) + beacon event
  na přehrání audia.

## Blok D — Distribuce a reálný svět (rozhodnutí/účty = Vladimír)

- [ ] **D1. Newsletter**: Buttondown/Kit + RSS-to-email automatizace (návaznost C2).
- [ ] **D2. Publikační cyklus den 1/2/3**: rozšířit `prepare-social-post.mjs`, aby
  generoval všechny 3 texty cyklu najednou (reveal / detail+otázka / echo+teaser).
- [ ] **D3. Bandcamp album sezóny I** — po dokončení 12 karet (obal = mozaika karet).
- [~] **D4. Fyzický balíček**: exportní skript `export-print.mjs` — první verze hotová
  2026-07-07 (`npm run print` = A4 archy s QR na přehrávací stránku `p/<id>/`, viz D6).
  Zbývá varianta 70×120 mm + 3 mm spadávka pro MakePlayingCards.
- [ ] **D5. QR jednostránka pro koncerty**: `/live/` — „karta večera“ (ručně
  nastavitelná v admin panelu), velké QR do programu.
- [x] **D6. Dětský balíček pro Cello Suzuki School** (2026-07-07): pole `deck`
  (`club`/`kids`), kids karty mimo archiv/RSS/Bluesky/kadenci, přehrávací stránky
  `p/<id>/` pro všechny posted karty, `npm run print [kids|club|id…]` = A4 archy
  s QR. Návod v `docs/NAVOD.md`. Zbývá: vytvořit první kids karty + deploy.

## Stav karet (2026-07-07)
244 karet: 3 posted (001, 002, 007), 1 approved, 240 draft.
Suno pakety vygenerovány pro ~80 karet v `exports/suno/`.
Cíl: dokončit sezónu I (12 karet posted) → Bandcamp + crowdfunding balíčku.
