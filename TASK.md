# Cello Cool Club — Task list (vylepšení 2026-07-07, klub Claire 2026-07-12)

> Nahrazuje předchozí TASK.md (admin panel — kompletně hotový, viz git historie).
> Každý úkol je samostatně uchopitelný jiným agentem. Kontext: `README.md`,
> `docs/ARCHITECTURE.md`, `docs/NAVOD.md`, PRD webu `..\CelloCoolClub\PRD.md`.
> Nápady a jejich plné znění: `docs/napady/` (dashboard v README.md, NAP-01…18)
> + `docs/BRAINSTORM-CLAIRE.md`. Bloky E–F vznikly 2026-07-12 z tohoto brainstormu.
> Konvence: Node ESM, žádný framework, npm závislosti jen `sharp` a `qrcode`.
> Veřejný web `..\CelloCoolClub` se NIKDY needituje ručně — vše přes `npm run export`.
> Zásady klubu (neporušovat): neposílá se odkaz, posílá se objekt · paywall
> neschovává poslech, jen pohodlí a vlastnictví · žádná umělá vzácnost digitálu ·
> QR nikdy nalepený v rohu · Claire je přiznaně AI.

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

## Blok E — Klub Claire, vlna 1 (bez peněz, bez účtů; zdroj docs/napady/)

Pořadí doporučené: E1 → E2 → E3 (jádro zážitku), pak E4–E9 dle chuti.

- [ ] **E1. Vinylový přehrávač** (NAP-03): stránka karty + `p/<id>/` dostanou
  místo play buttonu vinylovou desku — play → roztočí se, tonearm se položí,
  po pauze se dotáčí. Středový label = kruhový výřez artworku (sharp, generuje
  exportér do assets karty) + titul do oblouku + katalogové číslo CCC-`<id>`.
  Jedna sdílená šablona/CSS v `renderers.mjs`, čisté CSS animace, žádný
  framework, respektovat `prefers-reduced-motion`. Akceptace: funguje na
  kartě 007 na webu i na QR stránce, `npm test` + `check-site` zelené.
- [ ] **E2. Sbírka „Moje sada LP“** (NAP-04, fáze 1 bez účtů): tlačítko
  „Přidat do sbírky“ na stránce karty (localStorage, klientský JS), pohled
  `/collection/` — police s vinyly, sezóny jako řady, prázdné sloty ukazují
  díry v sezóně („chybí ti 3 do kompletní sezóny I“). Deterministicky nad
  veřejným `data/cards.json`. Bez backendů.
- [ ] **E3. Ranní káva s Claire** (NAP-06): homepage hero „Dnešní ranní káva“
  — píseň dne deterministicky podle data (seed = datum, jen posted club
  karty; v release den nová karta, jinak repríza „Claire dnes vytáhla
  z police…“). Sdílet logiku s C4 `/draw/` (implementovat spolu). Text
  „zdarma jen dnes — do sbírky natrvalo jako člen“ zatím jen jako copy,
  bez paywallu.
- [ ] **E4. Kanonizace Claire** (NAP-02): `data/site.json` sekce `persona`
  (jméno, bio, portrét, Suno persona ID), volitelné pole `claireNote` na
  kartě + render na stránce karty. **Vladimír:** vybrat kanonický hlas
  z ~240 MP3 v Downloads a založit Suno Personu; vybrat/vygenerovat portrét
  (styl viz E7). Staré karty = „hosté klubu“ (rozhodnuto neřešit přenahrávání
  ve vlně 1).
- [ ] **E5. Věnování v URL** (NAP-16a + NAP-17): `p/<id>/?pro=…&od=…&v=…` →
  stránka vykreslí sleeve s věnováním („Pro Janu ♥ od Petra“ + vzkaz)
  kolem vinylu z E1. Klientsky, escapovat + délkový limit (např. 120 znaků),
  žádný backend. Na stránce karty tlačítko „Věnovat tuhle desku“ (formulář
  komu/od koho/vzkaz → sestaví URL) + share intenty WhatsApp/Telegram/kopie.
- [ ] **E6. Redakční hitparáda** (NAP-15, fáze 1): `data/charts.json`
  (týden, pořadí id, poznámky Claire) + stránka `/hitparada/` — Top 10,
  šipky ↑↓ proti minulému týdnu, nováček, týdny v žebříčku, katalogová
  čísla. Sestavuje Vladimír v admin panelu (jednoduchý editor pořadí),
  kadence neděle. Bez počítadel — přiznaně „Claire má své nálady“.
- [ ] **E7. Stylový pipeline „Atelier Claire“ — test** (NAP-11): skript
  s jednotným styl-suffixem image promptů + riso postprocess přes sharp
  (zrno, redukce na paletu sezóny 2–3 barev, soutiskový posun). Vygenerovat
  vedle sebe porovnání pro 3 existující karty do `exports/preview/` —
  rozhodnutí o nasazení na všechny karty udělá Vladimír.
- [ ] **E8. LRC nástroj + titulkované teasery** (NAP-14): v admin panelu
  mini nástroj „časovat text“ (pustíš audio, Enter na každém řádku →
  uloží `.lrc`, pole `lyricsTimed`). Exportér vydá LRC jako veřejný asset.
  `export-teaser.mjs` doplnit drawtext titulky z LRC (Shorts se koukají
  bez zvuku). Novela na stránce karty (běžící verše) = navazující krok,
  může být samostatné pokračování.
- [ ] **E9. YouTube start** (NAP-07): **Vladimír:** založit kanál. Engine:
  skript „1 hodina s Claire“ — ffmpeg kompilace 12–20 posted písní do
  jednoho videa (statická ilustrace + názvy, kapitoly do popisku
  vygenerovat do .txt). Shorts = B2 teasery, publikovat ručně s každou
  ranní kávou. 24/7 stream až od >30 posted karet (vlna 4).

## Blok F — Klub Claire, vlna 2+ (fyzično, členství; gating: 12 posted karet)

- [ ] **F1. Rub karty jako vinyl + QR v labelu** (NAP-05 + NAP-12 trik 1):
  rozšířit `export-print.mjs` o rub — kruhová deska, středový label,
  QR jako součást labelu: error correction H, mini-ilustrace uvnitř,
  moduly v barvách sezóny, stylizované terče (custom rendering nad maticí
  z knihovny `qrcode`). Ověřit skenovatelnost na vytištěném vzorku.
  Navazuje na D4 (70×120 mm + spadávka).
- [ ] **F2. Sleeve obálky + „Pohlednice od Claire“** (NAP-17): tisková šablona
  obálky jako obal 45s singlu (karta se vysouvá) do `export-print.mjs`.
  **Vladimír:** tiskárna, voskové razítko CCC, poštovné CH/CZ/EU →
  z toho cena produktu (~8–12 €).
- [ ] **F3. Lithophane prototyp** (NAP-13): skript artwork → heightmapa
  (sharp) → STL (přímý export nebo OpenSCAD). Vytisknout prototyp z karty
  001: čitelnost Claire proti světlu + dvoubarevný QR na rubu. Až po
  ověření: limitka 50–100 ks/sezóna, číslování v tisku.
- [ ] **F4. Album sezóny I jako video** (NAP-07b, po 12 posted): ffmpeg —
  celé album jedno video, kapitoly, obal = mozaika karet (sdílet s D3
  Bandcamp), mezi skladbami se mění label na točící se desce. Premiéra
  přes YouTube Premiere. Souběžně D3.
- [ ] **F5. Členství** (NAP-10 + NAP-08): **Vladimír rozhodne platformu**
  (Memberful vs. Ghost — obě umí členské RSS a magic-link). Engine:
  členský podcast feed `/feed/<token>.xml` (RSS s enclosures = MP3),
  celý archiv; per-member „jen moje sbírka“ až vlna 4 (chce Worker/KV).
  Před spuštěním **ověřit Suno licenci pro komerční užití**.
- [ ] **F6. Hitparáda fáze 2 — počítadla** (NAP-15): Cloudflare Worker + KV,
  endpoint na ping z přehrávače (přehrání) + členské hlasy (1/týden),
  rolling okno 14 dní; věnování = bod navíc. Redakční vrstva z E6 zůstává
  (Claire komentuje čísla). Zlatá deska: vítěz sezóny → zlatá varianta labelu na webu.
- [ ] **F7. Karta na míru — pilot** (NAP-16c): deck `custom` (mimo veřejný
  export, mimo kadenci), interní workflow báseň → Suno persona → artwork →
  tisk. **Pilot: 3 kusy pro známé** → ověřit cenu (100–200 €), lhůtu, objem.
- [ ] **F8. Přání do éteru** (NAP-16b, po F5): fronta věnování v admin panelu
  (schválení Vladimír), vybraná se čtou v „Nedělní kávě“ (newsletter D1 +
  YouTube community post). Členská výhoda.
- [ ] **F9. Plakát na zeď s hrajícím QR** (NAP-23, zadání 2026-07-13):
  formát `poster` v `export-print.mjs` (A3/50×70, 300 DPI) — artwork +
  celá báseň jako grafika + umělecký QR-label desky (sdílený QR-label
  modul s F1: matice z `qrcode`, EC úroveň H, kruhový ořez, barvy sezóny,
  mini-ilustrace uprostřed). Prototyp na kartě 007; ověřit skenovatelnost
  ze 2 m. Varianty: „deska v rámu“ 30×30, plakát na míru (k F7).

## Stav karet (2026-07-07)
244 karet: 3 posted (001, 002, 007), 1 approved, 240 draft.
Suno pakety vygenerovány pro ~80 karet v `exports/suno/`.
Cíl: dokončit sezónu I (12 karet posted) → Bandcamp + crowdfunding balíčku.
