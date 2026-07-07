# Podrobný návod: Cello Cool Club Engine

Tento návod popisuje kompletní cestu od básně k publikované kartě — přesně v pořadí, v jakém věci děláte. Platí pro stav enginu po revizi z 6. 7. 2026 (seznam změn je na konci).

---

## 1. Jak to celé drží pohromadě

Pracujete se dvěma složkami:

| Složka | K čemu je |
|---|---|
| `CelloCoolClubEngine` | Redakce: databáze karet (`data/cards.json`), zdrojové básně, prompty, skripty, admin panel. Nikdy není veřejná. |
| `CelloCoolClub` | Veřejný web: statické HTML, obrázky, audio. Engine ho celý generuje příkazem `npm run export`. Ručně do něj nezasahujte — export ho přepíše. |

Každá karta prochází stavy:

```
draft → image_ready / music_needed → ready_for_review → approved → posted
```

Publikovat (na web i na Bluesky) jde jen karta ve stavu `approved`. Na webu se objeví jen karty `posted`.

---

## 2. Jednorázové nastavení

### 2.1 Instalace závislostí

V složce enginu spusťte (stačí jednou, a pak po každém `git clone`):

```
npm install
```

Engine má nově jednu závislost — `sharp` — která automaticky zmenšuje obrázky pro Bluesky (limit ~1 MB).

### 2.2 Soubor .env

Zkopírujte `.env.example` na `.env` a vyplňte:

```
OPENAI_API_KEY=sk-...          # jen pokud generujete obrázky přes API
BLUESKY_IDENTIFIER=vas-ucet.bsky.social
BLUESKY_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
PUBLIC_SITE_URL=https://vase-domena.cz
```

**Bluesky app password** (ne vaše normální heslo!): na Bluesky jděte do
*Settings → Privacy and Security → App Passwords → Add App Password*. Vygenerovaný kód vložte do `.env`.

**PUBLIC_SITE_URL vyplňte hned, jak bude web nasazený.** Bez něj:
- náhledy při sdílení na sociálních sítích (`og:image`) nefungují,
- odkazy v RSS feedu jsou relativní a čtečky je neotevřou,
- odkaz v Bluesky postu vede na relativní cestu.

Export vás na chybějící `PUBLIC_SITE_URL` upozorní červeným varováním.

`.env` je v `.gitignore` — klíče nikdy neskončí v gitu.

---

## 3. Běžný pracovní cyklus: od básně ke kartě

### 3.1 Spuštění admin panelu

```
npm run admin
```

a otevřete `http://127.0.0.1:5174/`. (Nebo poklepejte na `start-engine.cmd`.)

Panel běží jen na vašem počítači a nově odmítá požadavky odjinud než z vlastní stránky (ochrana proti škodlivým webům otevřeným ve stejném prohlížeči).

### 3.2 Vytvoření karty z básně

1. V panelu vyberte zdrojový soubor (z `data/inbox/` nebo `data/clean-sources/`).
2. Vyberte báseň a jazyk → **Create Draft Card**.
3. Engine sám vygeneruje: číslo, slug, caption, image prompt a Suno prompt (podle nálady básně).

Pozn.: Engine nově pozná duplicitu i napříč zdrojovými soubory (podle francouzského titulu + čísla básně) — stejná báseň z inboxu a z clean-sources už nevytvoří dvě karty.

Alternativa z příkazové řádky:

```
npm run new-card -- --title "The Lantern"
```

### 3.3 Obrázek

Prompt pro obrázek se skládá automaticky při vytvoření karty. Generátor z básně vybere **2–3 konkrétní obrazové náměty** (např. „key, house, street" nebo „garden, venus, flamingo"), cituje řádky, ze kterých pocházejí, a postaví kolem nich úsporný výtvarný prompt: jeden ohniskový bod, velkorysý negativní prostor, malířský rukopis, paleta podle nálady básně (melancholická / hřejivá / hořkosladká).

U starších karet (nebo když se vám výběr námětů nelíbí a upravili jste báseň) jde prompt přegenerovat:

```
npm run generate-image -- 008 --rebuild-prompt
```

**Varianta A — vygenerovat přes OpenAI:**

```
npm run generate-image -- 008            # jen náhled promptu, nic nevolá
npm run generate-image -- 008 --confirm  # skutečné volání API, uloží PNG
```

**Varianta B — přiložit hotový soubor** (z panelu tlačítkem, nebo):

```
npm run attach-image -- 008 "C:\cesta\k\obrazku.png"
```

Obrázek se zkopíruje do enginu i do webu a karta se posune do `image_ready`.

### 3.4 Hudba (Suno)

1. Vyexportujte prompt packet:
   ```
   npm run export-suno -- 008
   ```
   Packet (styl + text) najdete v `exports\suno\`. Z panelu jde exportovat i dávkově (max 25 básní najednou).
2. V Sunu ručně vygenerujte a vyberte finální skladbu.
3. Přiložte ji:
   ```
   npm run attach-audio -- 008 "C:\cesta\k\vybrane-skladbe.mp3"
   ```

Jakmile má karta obrázek i audio, stav se změní na `ready_for_review`.

### 3.5 Náhled a schválení

```
npm run preview-card -- 008    # vytvoří lokální náhledovou stránku
npm run approve-card -- 008    # kontrola povinných polí + stav approved
```

Obojí jde i z panelu. Náhled nemění stav karty ani veřejný archiv.

---

## 4. Vydání karty (release rituál)

Engine vydává jednu kartu každé 3 dny v 7:30 (Asia/Jerusalem). Kadence i čas se dají změnit v `.env` (`RELEASE_CADENCE_DAYS`, `RELEASE_HOUR`, `RELEASE_MINUTE`, `RELEASE_TIME_ZONE`).

```
npm run run-release              # zkontroluje, jestli je vydání na řadě (nic nemění)
npm run run-release -- --confirm # skutečně vydá: posted + export webu
```

Co `--confirm` udělá:
1. vezme nejnižší schválenou (`approved`) kartu,
2. označí ji `posted` a zapíše `publishAt`,
3. uloží social draft do `exports\release\`,
4. vyexportuje celý veřejný web.

**Nově:** když export webu selže, karta se automaticky vrátí do `approved` — nemůže nastat stav „označeno jako vydané, ale nikde nevyšlo".

Simulace konkrétního času (na zkoušku):

```
npm run run-release -- 2026-07-09T05:00:00Z
```

### 4.1 Nahrání webu

Export zapisuje přímo do `C:\Users\Vladimir\Documents\CelloCoolClub`. Před nasazením ověřte:

```
npm run check-site
```

a pak obsah složky nahrajte na hosting (doporučeně Cloudflare Pages). Export nově generuje i **RSS feed** (`feed.xml`) — odkaz na něj je v hlavičce homepage; čtenáři si ho mohou přidat do čtečky.

---

## 5. Publikace na Bluesky

```
npm run publish-bluesky -- 008            # dry run: ukáže text, obrázek, cíl
npm run publish-bluesky -- 008 --confirm  # skutečně publikuje
```

Co se děje při `--confirm`:
- obrázek se **automaticky zmenší pod 1MB limit Bluesky** (velké PNG se převedou na JPEG; vypíše se výsledný rozměr a velikost),
- poměr stran se odešle podle skutečných rozměrů obrázku,
- odkaz na archiv je v postu **klikatelný** (link facets),
- URL postu se zapíše zpět do karty (`postedUrls.bluesky`).

**Ochrana proti dvojímu postu:** kartu, která už na Bluesky je, engine odmítne publikovat znovu. Pokud to opravdu chcete (např. po smazání postu), použijte:

```
npm run publish-bluesky -- 008 --confirm --force
```

---

## 6. Zálohy a obnova dat

`data/cards.json` je srdce celého enginu. Nově platí:

- Každý zápis je **atomický** (zápis do dočasného souboru + přejmenování) — pád aplikace uprostřed zápisu už nemůže soubor zničit.
- Před každým zápisem se předchozí verze uloží do `data/cards.json.bak`.

**Obnova po chybě:** zkopírujte `data\cards.json.bak` přes `data\cards.json`. Starší historie je v gitu (`git log -- data/cards.json`).

---

## 7. Testy a kontrola

```
npm test          # vše: validace dat + unit testy + suno batch + kontrola webu
npm run test:unit # jen unit testy (parser, plánovač, facets, validace)
npm run validate  # jen validace cards.json
```

Unit testy (složka `tests/`) pokrývají plánování vydání včetně časových zón, parsování zdrojových básní, generování Bluesky facets a validaci karet. Spouštějte `npm test` před každým vydáním — trvá pár sekund.

---

## 8. Řešení problémů

**„PUBLIC_SITE_URL is not set" při exportu** — vyplňte v `.env` adresu nasazeného webu (kap. 2.2).

**Bluesky: „was already posted"** — karta už post má; viz `--force` v kap. 5.

**Bluesky: „Image is ... KB, over the Bluesky blob limit"** — chybí `sharp`; spusťte `npm install`.

**Admin panel vrací 403 Forbidden** — požadavek nepřišel z `http://127.0.0.1:5174`. Otevírejte panel přesně na této adrese (ne přes jiný hostname).

**Rozbité cards.json** — obnova ze zálohy, kap. 6.

**Release: „export failed ... rolled back"** — vydání se nepovedlo a bylo bezpečně vráceno; opravte příčinu (výpis chyby výše) a spusťte `run-release -- --confirm` znovu.

**Flag jako `--rebuild-prompt` nebo `--confirm` se „ztratí"** — PowerShell někdy spolkne samostatné `--`. Buď příkaz spusťte v cmd, nebo v PowerShellu napište `npm run generate-image '--' 008 --rebuild-prompt` (uvozovky kolem `--`).

**Web ukazuje jinou sadu karet než engine** — spusťte `npm run build`; web je vždy jen otiskem engine dat. Pokud jste kartu publikovali „ručně" mimo engine, doplňte jí v `data/cards.json` stav `posted` a `publishAt`, jinak ji příští export z webu odebere.

---

## 9. Co se změnilo v revizi 6. 7. 2026

Opravy chyb:
1. **Bluesky obrázky** — automatické zmenšení pod 1MB limit (`sharp`), skutečný poměr stran místo napevno 4:5.
2. **Klikatelné odkazy v Bluesky postech** (link facets s korektními bajtovými offsety).
3. **Ochrana proti dvojímu publikování** téže karty (`--force` pro vědomé opakování).
4. **Sociální náhledy webu** — `og:image` je absolutní URL (vyžaduje `PUBLIC_SITE_URL`), doplněno `og:url`, `og:type`, `twitter:card`.
5. **Atomický zápis + záloha** `data/cards.json` (`.bak`).
6. **Zabezpečení admin panelu** — kontrola Origin/Host hlaviček (CSRF/DNS rebinding), oprava path traversal kontroly, dialog pro výběr souboru už neblokuje server.
7. **Rollback vydání** — když selže export webu, karta se vrátí do `approved`.
8. **Duplicitní básně napříč zdroji** se už nezakládají dvakrát.
9. **`attach-audio` už nepřepisuje pole `musicNotes`** (metadata přílohy jdou do `audioAttachment`).
10. **Karta 007 zpětně srovnána** — na webu byla publikovaná, ale engine ji vedl jako `approved`; nyní je `posted` s původním datem.

Novinky:
- **RSS feed** (`feed.xml`) generovaný při každém exportu.
- **Unit testy** (`npm run test:unit`) zapojené do `npm test`.
- `check-site` kontroluje únik více privátních polí (`postedUrls`, `imageAttachment`, `audioAttachment`, …).
- **Nový umělecký generátor image promptů** — místo „hustě zaplněné tapety" vybere z básně 2–3 konkrétní náměty, cituje jejich řádky a určí paletu podle nálady básně; `--rebuild-prompt` ho aplikuje na starší karty (kap. 3.3).

---

## Revize 2026-07-07

### SEO a export webu
- Export nově generuje `robots.txt` a (s nastavenou `PUBLIC_SITE_URL`) `sitemap.xml`, canonical odkazy a JSON-LD (`Poem` na kartách, `WebSite` na homepage). Bez `PUBLIC_SITE_URL` se absolutní tagy vynechají a případná stará `sitemap.xml` se smaže.
- Homepage má stabilní titulek a popis („Cello Cool Club — a new poem card every 3 days“) — nepřepisuje se už podle aktuální karty. Karta zůstává v `og:image`.
- Všechny stránky odkazují favicon (`assets/ccc-icon.ico`).
- Obrázky mají `width`/`height` (žádné poskakování layoutu, rozměry čte `sharp` při exportu), v archivu `loading="lazy"`.
- RSS má `atom:link rel="self"`.

### Video teasery (`npm run teaser`)
- `npm run teaser -- --card 007` vytvoří 20s svislé video (1080×1920) do `exports/teasers/` — pro Instagram Reels, TikTok, YouTube Shorts.
- Volby: `--duration 20` (5–60 s), `--start 0` (odkud v MP3 začít).
- Vzhled: artwork karty na rozmazaném pozadí, jemný nájezd kamery, dole číslo + titul karty a nápis Cello Cool Club, hudba s fade in/out.
- ffmpeg se hledá v tomto pořadí: `FFMPEG_PATH` v `.env` → systémový PATH → winget balíček Gyan.FFmpeg. Instalace: `winget install Gyan.FFmpeg`.

### Plán dalších kroků
- Aktuální seznam úkolů je v `TASK.md` (bloky A–D: deploy, scheduler, Suno download flow, Threads, nové stránky webu, tisk karet).

### Párování stažených Suno MP3 (`npm run match-audio`)
- Suno blokuje API i agenty, takže se skladby stahují klikáním v přihlášeném prohlížeči — soubory končí ve složce `Downloads`.
- `npm run match-audio` (bez parametrů) porovná názvy MP3 s tituly karet bez audia a vypíše návrhy: **HIGH** = jednoznačná shoda, **LOW** = podobné, ale nejisté, **dup** = další verze téže písně (vyhrává nejnovější).
- `npm run match-audio -- --confirm` přiloží jen HIGH shody (kopíruje do assets a posune stav karty jako `attach-audio`).
- Ruční pár: `npm run match-audio -- --card 017 --file "The Cloud Factory.mp3"`.
- Jinou složku stažených souborů nastavíte přes `SUNO_DOWNLOADS_PATH` v `.env`.

### Nasazení webu (`npm run deploy`)
- Web běží na **https://cello-cool-club.pages.dev** (Cloudflare Pages, projekt `cello-cool-club`).
- `npm run deploy` = validace + export + nahrání na Cloudflare. Nahrává se jen veřejná část webu (index, styly, karty, assets, feed, sitemap, robots) — PRD, zdrojové složky ani preview na internet nikdy nejdou.
- Po každém `run-release` je potřeba spustit i `npm run deploy`, jinak nová karta zůstane jen lokálně.
- Když deploy skončí chybou „set a CLOUDFLARE_API_TOKEN", vypršelo přihlášení: spusťte `npx wrangler login` a v prohlížeči klikněte Allow.

### Testovací režim (`SITE_NOINDEX`)
- Kdybyste chtěl web před ostrým startem schovat i před vyhledávači: do `.env` přidejte `SITE_NOINDEX=1` a spusťte `npm run deploy` — stránky dostanou `noindex`, robots.txt zakáže crawlery a sitemap se negeneruje. Před oficiálním startem řádek smažte a znovu nasaďte.

## Revize 2026-07-07 večer — dětské karty a tisk s QR

### Dětský balíček (`deck: "kids"`)
- Každá karta má nově pole `deck`: `"club"` (výchozí, stávající poetické karty) nebo `"kids"` (karty pro Cello Suzuki School). Novou dětskou kartu založíte `npm run new-card -- --deck kids --title "Twinkle"` (výchozí jazyk `cs`, sezóna `Suzuki`) nebo pole `deck` doplníte ručně v `data/cards.json`.
- Dětské karty procházejí stejným kolotočem jako klubové (obrázek, Suno hudba, schválení), ale **nikdy nejdou do archivu, RSS, sitemap ani na Bluesky** a nenarušují třídenní kadenci klubu. Zveřejní se prostě tím, že dostanou status `posted` + `publishAt` a spustí se `npm run export` (a `npm run deploy`).
- Do `poemText` u dětské karty patří říkanka nebo krátký úkol („Zahraj 3× celou variaci A…“) — pole je povinné stejně jako u klubových karet.

### Přehrávací stránky pro QR (`p/<id>/`)
- Export nově pro **každou** posted kartu (klubovou i dětskou) generuje minimalistickou stránku `p/<id>/` — obrázek, název a jedno velké tlačítko Play. Přesně na ni míří QR kód z tištěné karty.
- Stránka se pokusí hrát hned po načtení; mobily autoplay se zvukem blokují, takže dítě jednou ťukne na velké tlačítko. Stránky mají `noindex` — nejsou v archivu ani ve vyhledávačích, fungují jen přes QR/odkaz.

### Tisk karet s QR (`npm run print`)
- `npm run print` — A4 arch se všemi posted dětskými kartami (4 karty na stránku, ořez podle čárkované linky).
- `npm run print club` — celý klubový balíček; `npm run print 001 007` — konkrétní karty (id nebo slug).
- Výstup je HTML v `exports/print/` — otevřete v prohlížeči a Ctrl+P (A4, měřítko 100 %, zapnout „Background graphics“). Na kartě je obrázek, číslo, název a QR s textem „Naskenuj a poslouchej“.
- Tisknout jde jen posted karty (QR musí mít kam vést) a QR míří na živý web — **po exportu nezapomeňte `npm run deploy`**, jinak QR skončí na 404.
