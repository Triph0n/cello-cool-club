---
name: gemini-image-frontend
description: Generate Cello Cool Club card artworks through Vladimir's logged-in Gemini web account (gemini.google.com) driven via PixelRag/frontend clicking — no API, no OpenAI cost. Use when the user wants card images made via Gemini, "vyrob obrázky přes gemini", to fill the image queue, or to attach downloaded Gemini images to cards.
---

# Gemini Image Frontend — obrázky karet přes Vladimirův účet

Alternativa k `npm run generate-image` (OpenAI API, stojí peníze):
obrázky se vyrábějí **ve webovém Gemini na Vladimirově přihlášeném účtu**,
ovládaném přes frontend jako člověk (PixelRag oči + klikání), stejně jako
Suno ve skillu `suno-sync`.

Pracovní adresář: `C:\Users\Vladimir\Documents\CelloCoolClubEngine`.
Prompt každé karty už existuje: pole `imagePrompt` v `data/cards.json`
(všech 240 draftů ho má). **Žádné API klíče, žádný headless browser.**

## Kdo jsi? (rozcestník prostředí)

- **Codex CLI** (PixelRag + klikání přes CDP v přihlášeném Chromu):
  kroky 1–5 celé sám.
- **Claude Code** (bez klikání; pixelshot jen na koukání): kroky 1 a 4–5.
  Krok 2–3 (browser) předej: *„Spusť v Codexu: `pokračuj podle
  exports/images/image-queue.md` (skill gemini-image-frontend)."*
  Když jsou v Downloads už stažené obrázky, začni rovnou krokem 4.

## Pipeline

**1. Fronta** — `exports/images/image-queue.md`:

```markdown
# Image queue (aktualizováno RRRR-MM-DD, generuje skill gemini-image-frontend)
| karta | title | stav |
|---|---|---|
| 004 | The Weight of a Key | čeká |
```

Kandidáti = drafty bez obrázku v pořadí id (pro sezónu I: 004, 006,
008–013). Prompt karty vypíšeš:
`node -e "const c=require('./data/cards.json');console.log((c.cards||c).find(k=>k.id==='004').imagePrompt)"`

**2. Gemini (JEN Codex, přes PixelRag)** — otevři `gemini.google.com`
v přihlášeném Chromu. Pro každou kartu z fronty:
vlož `imagePrompt` (požádej o **obrázek**, formát na výšku ~3:4 — karta
70×120; pokud Gemini formát ignoruje, nech default a pokračuj) → počkej
na vygenerování → **stáhni** (hover/⋮ → Download) → ověř nový soubor
v `C:\Users\Vladimir\Downloads`. Jedna karta = jeden obrázek; nevyhovující
výsledek zkus 1× regenerovat, pak přeskoč a zapiš do fronty.

**3. Pojmenování** — hned po stažení přejmenuj soubor na `card-<id>.png`
(např. `card-004.png`), ať se nic nepomíchá. Aktualizuj `stav` ve frontě.

**4. Přiložení do enginu** — pro každý stažený soubor:
`npm run attach-image -- 004 "C:\Users\Vladimir\Downloads\card-004.png"`
→ karta přejde na `image_ready`. Řádek vyřaď z fronty.

**5. Report + navazující krok** — kolik karet dostalo obrázek, co přeskočeno
a proč. Karty `image_ready` čekají na hudbu → pokračuje skill `suno-sync`.

## Gotchas

- Gemini má denní limity generování obrázků — když dojde, zapiš do fronty
  „limit, pokračovat zítra" a skonči s reportem.
- Zákaz měnit `imagePrompt` na kartě bez Vladimira; drobné doplnění
  („no text in image") při vkládání je OK.
- Až bude rozhodnutý styl „Atelier Claire" (TASK E7), přidá se jednotný
  styl-suffix — do té doby prompty používat tak, jak jsou.
- PixelRag toolchain: `pixelshot.exe <URL> --backend cdp --wait-network-idle`
  (screenshoty dlaždic), `pixelrag.exe` (index/serve) — detailně viz
  skill `suno-sync`.
- PowerShell polyká `--` přes npm — attach-image spouštěj z Git Bash,
  nebo poziční tvar pokud existuje.
