---
name: cello-club-engine
description: Operate the Cello Cool Club Engine — create poem cards, generate images, export Suno prompts, pair downloaded MP3s, approve, release and deploy the public site. Use when the user wants to make cards from poems, generate/download songs, run a release, deploy the site, or automate the poem→song→card pipeline (with Codex handling Suno in the browser).
---

# Cello Cool Club Engine — ovládání

Editorial engine pro karty (báseň + AI obrázek + Suno píseň). Všechny příkazy se pouští v:
`C:\Users\Vladimir\Documents\CelloCoolClubEngine` (Node ESM, žádný framework).

Veřejný web `C:\Users\Vladimir\Documents\CelloCoolClub` se **nikdy needituje ručně** — celý ho regeneruje `npm run export`. Živě: https://cello-cool-club.pages.dev

Podrobný návod: `docs/NAVOD.md`. Stav karet: `data/cards.json` (atomické zápisy + `.bak`).

## Stavový automat karty

`draft → image_ready / music_needed → ready_for_review → approved → posted`
Veřejně se exportují jen `posted` karty. Karty publikované mimo engine další export smaže (nutno backfillnout do `posted`).

## Klíčové příkazy

| Krok | Příkaz |
|---|---|
| Admin panel (výběr básně → draft karta) | `npm run admin` → http://127.0.0.1:5174/ |
| Karta z CLI | `npm run new-card -- --title "The Lantern"` |
| Obrázek — náhled promptu / generování / přiložení | `npm run generate-image -- 008` / `-- 008 --confirm` / `npm run attach-image -- 008 "cesta.png"` |
| Suno prompt packet (i dávkově z panelu, max 25) | `npm run export-suno -- 008` → `exports\suno\` |
| Přiložení MP3 | `npm run attach-audio -- 008 "cesta.mp3"` |
| **Párování stažených MP3 z Downloads** | `npm run match-audio` (návrh) / `-- --confirm` (přiloží HIGH shody) / `-- --card 008 --file "..."` (ručně) |
| Náhled / schválení | `npm run preview-card -- 008` / `npm run approve-card -- 008` |
| Vydání (každé 3 dny 7:30) | `npm run run-release` (kontrola) / `-- --confirm` (vydá + export) |
| Nasazení na Cloudflare Pages | `npm run deploy` — **spouštět po každém run-release** |
| Tisk karet s QR (A4) | `npm run print kids` / `npm run print club` / `npm run print 008` (poziční argumenty, ne `--` flagy) |
| Video teaser 9:16 | `npm run teaser -- --card 008` → `exports/teasers/` |
| Testy + kontrola webu | `npm test` |

Pozn.: PowerShell polyká `--` flagy přes npm — kde to jde, používej poziční argumenty; jinak `npm run x -- --flag` funguje z Git Bash spolehlivěji.

## Suno — realita a automatizace

**Suno nemá použitelné API a blokuje agenty na svém webu z čistého prohlížeče.** Nenavrhuj API integrace. Funkční pipeline je hybridní — hudbu obstarává **Codex CLI přes PixelRag** (oči pro agenta: viditelné screenshoty → klikání a psaní do frontendu jako člověk, v přihlášeném Chromu Vladimira) pomocí skillů:

- `C:\Users\Vladimir\.codex\skills\suno-assisted-clipboard\` — vkládání promptů/textů do Suno (generování písní)
- `C:\Users\Vladimir\.codex\skills\suno-download-mp3\` — přejmenování titulů na angličtinu + stažení MP3 do `C:\Users\Vladimir\Downloads`

➡️ **Celý hudební tok end-to-end řídí skill `suno-sync`** (v `.claude/skills/` enginu i `~/.codex/skills/`): zjistí karty bez audia → spáruje Downloads → sestaví frontu `exports/suno/download-queue.md` → browser kroky (Codex/PixelRag) → znovu spáruje → approve/release/deploy. Fronta je sdílený stav mezi Claude a Codex.

## Plná pipeline: báseň → píseň → karta → web

1. **Básně**: skill `prevert-fable-poems` → anglický agregát `data/clean-sources/prevert_fable_english.md`.
2. **Karty**: admin panel → vybrat zdroj `prevert_fable_english.md` → báseň → **Create Draft Card** (engine vygeneruje slug, caption, image prompt i Suno prompt; duplicity hlídá).
3. **Obrázky**: `generate-image --confirm` (OpenAI) nebo `attach-image`.
4. **Suno prompty**: dávkový export z panelu (max 25) → `exports\suno\batches\`.
5. **Generování v Sunu**: řídí Codex (suno-assisted-clipboard) v uživatelově Chromu.
6. **Stažení MP3**: Codex (suno-download-mp3) → soubory v Downloads.
7. **Spárování**: `npm run match-audio -- --confirm` — normalizovaná podobnost titulů, HIGH shody přiloží automaticky.
8. **Review + schválení**: `preview-card`, `approve-card` (nebo panel).
9. **Vydání + deploy**: `run-release -- --confirm` a hned `npm run deploy`.

Kroky 5–6 dělá Codex, všechno ostatní zvládne Claude Code sám. Když má uživatel v Downloads čerstvé MP3, stačí začít krokem 7.

## Gotchas

- Wrangler OAuth expiruje: při chybě CLOUDFLARE_API_TOKEN spusť `npx wrangler login` (uživatel klikne Allow). Config v `%APPDATA%\xdg.config\.wrangler`.
- Kids deck (`deck: "kids"`): mimo archiv/RSS/sitemap/kadenci; QR přehrávací stránky `p/<id>/` má každá posted karta.
- Export webu při selhání vrací kartu do `approved` — nikdy neopravuj stav ručně bez důvodu.
- Před commitem spusť `npm test` (validate + unit + suno batches + check-site).
