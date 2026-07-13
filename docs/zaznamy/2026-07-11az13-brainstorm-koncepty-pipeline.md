# Záznam konverzace 11.–13. 7. 2026 — brainstorm, koncepty, pipeline

> Kompletní záznam třídenní pracovní konverzace (Claude Code), ať se k ní
> dá vrátit. Chronologicky, s rozhodnutími a odkazy na soubory/commity.
> Syrový přepis session: `~/.claude/projects/c--Users-Vladimir-Documents-Codex-2026-07-11-p/0de04c68-….jsonl`
> (kopie do repa zablokována, exportovat lze ručně přes /export).

## 1. Brainstorm pokračování (11. 7. večer)

Zadání: žebříčky/hitparády, písničky na přání, posílání karet (WhatsApp,
Telegram, fyzicky, QR, 3D tisk). Výstup → BRAINSTORM-CLAIRE.md:

- **§15 Hitparáda** — žebříček jako nedělní pořad (à la Houpačka), Claire
  moderuje; fáze 1 redakčně bez backendu, fáze 2 Worker+KV; zlatá deska;
  výroční žebříček určuje tracklist alba.
- **§16 Věnování a na přání** — třístupňově: (a) věnování v URL parametrech
  zdarma bez backendu, (b) přání do éteru čtená v Nedělní kávě (členské),
  (c) karta na míru 100–200 € (dárkový trh).
- **§17 Poslat desku** — zásada „neposílá se odkaz, posílá se objekt":
  WhatsApp/Telegram teaser MP4, pohlednice od Claire ve sleeve obálce
  45s singlu, dárková lithophane. „Věnování je akvizice maskovaná jako něha."

## 2. MD soubory + dashboard (11. 7.)

Pokyn Vladimira: **„ze všeho dělej MD soubory + přehledný dashboard"**
(trvalý pokyn pro další práci).

- `docs/napady/` — jeden nápad = jeden soubor (NAP-01…18), frontmatter
  nazev/oblast/vlna/stav, README.md = tabulkový dashboard.
- Vizuální dashboard artifact (riso/LP styl, filtry):
  https://claude.ai/code/artifact/80b3aeeb-6b18-453e-904d-cf40e3965b81

## 3. TASK.md bloky E a F (12. 7.)

- **Blok E (vlna 1, bez peněz/účtů):** E1 vinylový přehrávač, E2 sbírka
  localStorage, E3 ranní káva, E4 kanonizace Claire, E5 věnování v URL,
  E6 redakční hitparáda, E7 test stylu Atelier Claire, E8 LRC nástroj +
  titulkované teasery, E9 YouTube start. Pořadí: E1 → E2 → E3.
- **Blok F (vlna 2+, gating 12 posted):** F1 rub-vinyl + QR v labelu,
  F2 sleeve/pohlednice, F3 lithophane prototyp, F4 album video, F5 členství
  + podcast feed, F6 počítadla hitparády, F7 karta na míru pilot, F8 přání
  do éteru.
- Commity: e5544f8 (brainstorm + napady + TASK E/F), 47027f8 (skilly +
  anglické zdroje básní).

## 4. Paralelní tab přidal §18–21 (12. 7.)

Druhá session rozšířila brainstorm; doplněno do NAP-19…22:

- **NAP-19 Skutečné cello + Claire** — kandidát na HLAVNÍ pozici:
  „klub, kde skutečný cellista hraje s AI zpěvačkou"; live verze =
  B-strany; koncertní most; záštita pro Suzuki rodiče.
- **NAP-20 Kalendář klubu** — ⭐ adventní kalendář (24 karet, QR odemyká
  píseň až v ten den; prodej od října, **hudba hotová do září**);
  svátky; „deska poštou" předplatné.
- **NAP-21 Ambientní formáty** — „déšť v kavárně s Claire", watch-time
  motor YouTube kanálu.
- **NAP-22 Komunita** — členská čísla (prvních 100 zakládajících),
  repertoárová rada (volba ze 3 kandidátů z backlogu 240 draftů),
  darování členství.

## 5. Tři koncepty A/B/C (12. 7.) → ROZHODNUTÍ (13. 7.)

`docs/napady/KONCEPTY.md` — protože „nemůžeme zrealizovat vše a rozdrobit to":

- **A Ranní rádio 📻** — Claire jako pořad; rituál + členský feed; škrtá fyzično.
- **B Atelier 🖨️** — vydavatelství krásných objektů; peníze od prvního kusu
  bez backendu; adventní kalendář jako produkt roku. Doporučení Clauda.
- **C Klub sběratelů 🃏** — hra o kompletaci; police + členství; nejvíc software.

Společný základ všech: Claire + vinylový přehrávač + styl Atelier Claire +
pozice skutečného cella.

**Rozhodnutí Vladimira (13. 7.): „asi bych do budoucna stavěl vše."**
→ Koncepty nejsou škrty, ale **pořadí: B teď → C po sezóně I → A jako
korunovace.** Nic z brainstormu se nezahazuje.

## 6. Skilly a pipeline (12.–13. 7.)

- **suno-sync** (commit 88938d3 + 017e7df): jeden tok karty-bez-audia →
  match-audio → fronta `exports/suno/download-queue.md` (sdílený stav
  Claude↔Codex) → browser kroky Codex → re-match → release+deploy.
- **PixelRag zdokumentován**: `~/.local/bin/pixelrag.exe` + `pixelshot.exe`
  (uv tool `pixelrag`), CDP backend; „oči pro agenta" — viditelné
  screenshoty + klikání do frontendu jako člověk v přihlášeném Chromu.
  Žádné API. Claude může pixelshotem vidět, klikání dělá Codex.
- **gemini-image-frontend** (commit b7f90ff): obrázky karet **zdarma přes
  Vladimirův přihlášený Gemini účet** (rozhodnutí Vladimira: „obrázky si
  vyrob přes můj účet gemini a pixelrag, prostě přes frontend");
  fronta `exports/images/image-queue.md` naplněna 8 kandidáty sezóny I:
  004, 006, 008–013 (výběr = návrh, lze vyměnit).

## 7. Stav webu + oprava deploye (13. 7.)

- Zjištěno pixelshotem: QR stránky `p/<id>/` byly od 7. 7. jen lokálně,
  web vracel homepage jako SPA fallback (HTTP 200 klame!). Spuštěn
  `npm run deploy` → **p/001, 002, 007 žijí**. Archiv je na `/cards/`.
- Stav sezóny I: posted 001, 002, 007 + approved 005 → **chybí 8 karet**
  (fronta výše). 240 draftů má hotové imagePrompty.
- Stav-artifact se screenshoty:
  https://claude.ai/code/artifact/8a6cef98-53e3-4169-8429-f55a934ed9c3
- Nález: working copy webu obsahuje ~25 debug screenshotů ze Suno seancí
  + cizí soubory (110-120.pdf, „Hands of Time") — úklid čeká na rozhodnutí.

## 8. Co visí (k datu záznamu)

1. ~~Rozhodnutí A/B/C~~ → rozhodnuto: **vše, v pořadí B → C → A**.
2. **Hlas Claire** — vybrat z ~240 MP3 + Suno Persona; portrét (E4/E7).
3. **Obrázky 8 karet** — Codex: „pokračuj podle exports/images/image-queue.md".
4. **Hudba** — pak suno-sync fronta.
5. Adventní kalendář: rozhodnout do srpna, hudba do září (NAP-20).
6. Suno komerční licence ověřit před prvními penězi.
7. YouTube kanál, newsletter účet, tiskárna (jen Vladimír).
8. Úklid cizích souborů ve složce webu.
