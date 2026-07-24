---
name: suno-sync
description: One entry point for the whole Suno music flow of Cello Cool Club — find cards missing audio, pair MP3s from Downloads, build a download/generation queue, drive Suno in the browser (Codex) or hand off (Claude), then attach, approve and release. Use when the user says "doplň hudbu", "stáhni ze Suno", "spáruj MP3", "suno sync", or wants cards to get their songs end-to-end.
---

# Suno Sync — jeden tok: karty bez hudby → hotové karty

Zastřešuje tři existující skilly do jedné pipeline:
- `cello-club-engine` (engine příkazy) — Claude i Codex
- `suno-assisted-clipboard` (generování v Sunu) — **jen Codex** (přihlášený Chrome)
- `suno-download-mp3` (přejmenování + stažení MP3) — **jen Codex**

Pracovní adresář: `C:\Users\Vladimir\Documents\CelloCoolClub\engine`.
**Suno nemá API a blokuje agenty — nikdy nenavrhuj API integraci.**

## Jak se ovládá Suno: PixelRag (oči pro agenta)

Suno se obsluhuje **přes PixelRag** — agent vidí stránku jako pixely
a kliká/píše do frontendových formulářů **jako člověk**, v přihlášeném
Chromu Vladimira. Žádný headless browser, žádné API volání — jediný
způsob, který na Suno funguje.

Nainstalovaná toolchain (`C:\Users\Vladimir\.local\bin\`):
- **`pixelshot.exe <URL>`** — vyfotí stránku do dlaždic JPEG
  (`--backend cdp` = připojí se k běžícímu Chromu s přihlášením;
  `--wait-network-idle` pro SPA jako Suno; výstup `./tiles`).
- **`pixelrag.exe`** — chunk/embed/index/serve nad těmi screenshoty
  (vyhledávání v tom, co agent vidí).
- Klikání/psaní: řídí Codex přes CDP v témže Chromu.

Skilly `suno-assisted-clipboard` a `suno-download-mp3` popisují CO klikat;
PixelRag/pixelshot je JAK VIDĚT (screenshot → najít prvek → klik → ověřit
znovu screenshotem). Claude Code může pixelshot také spustit (podívat se,
co na stránce je), ale klikání nechává Codexu. Když ovládání obrazovky
není k dispozici, nech stránku otevřenou a řekni Vladimirovi přesný další
klik krátce česky.

## Kdo jsi? (rozcestník prostředí)

- **Codex CLI** (má PixelRag — vidí obrazovku a kliká v přihlášeném
  Chromu): projdi kroky 1–6 celé sám.
- **Claude Code** (bez PixelRag/ovládání Chromu): udělej kroky 1–3 a 5–6;
  krok 4 (browser) NEDĚLEJ — místo toho vytvoř/aktualizuj frontu (krok 3) a řekni
  Vladimirovi: *„Spusť v Codexu: `pokračuj podle
  exports/suno/download-queue.md` (skill suno-sync)"*. Po návratu (nové MP3
  v Downloads) pokračuj krokem 5.

## Pipeline

**1. Zjisti stav** — které posted/approved/ready karty nemají audio:
dry-run `npm run match-audio` vypíše karty bez audia + kandidátní shody
z `C:\Users\Vladimir\Downloads` (HIGH/LOW podle podobnosti titulů).

**2. Spáruj, co už je stažené** — `npm run match-audio -- --confirm`
přiloží HIGH shody. LOW shody ověř poslechem/názvem a přilož ručně:
`npm run match-audio -- --card 008 --file "Song.mp3"`.

**3. Fronta** — pro karty stále bez audia napiš/aktualizuj
`exports/suno/download-queue.md` (formát níže). Anglické tituly ber
z batch JSONů v `exports/suno/batches/` (pole `songTitle`); karta bez
batch záznamu = ještě nemá ani prompt → označ `generate`.

```markdown
# Suno download queue (aktualizováno RRRR-MM-DD, generuje skill suno-sync)
| karta | songTitle (EN) | akce | stav |
|---|---|---|---|
| 008 | The Lantern | download | čeká |
| 011 | Hands of Rain | generate → download | čeká |
```

**4. Browser přes PixelRag (JEN Codex)** — pro řádky `generate`: skill
`suno-assisted-clipboard` (prompt z `exports/suno/batches/`). Pro řádky
`download`: skill `suno-download-mp3` (přejmenuj titul na EN, stáhni MP3,
ověř soubor v Downloads). Vše viditelně přes PixelRag: screenshot →
najít prvek → klik/psaní → ověřit výsledek na obrazovce. Po každém
úspěchu přepiš `stav` ve frontě. Pracuj po jedné písni; blokované
přeskoč a zapiš.

**5. Znovu spáruj a uklid** — `npm run match-audio -- --confirm`;
karty, které dostaly audio, vyřaď z fronty (smaž řádek; prázdnou frontu
smaž celou). `npm test` musí zůstat zelený.

**6. Dokonči karty** — nabídni: `npm run preview-card -- <id>` →
`npm run approve-card -- <id>` → v release den `npm run run-release -- --confirm`
→ **vždy hned** `npm run deploy`.

## Závěrečný report (vždy)

- kolik karet dostalo audio (id + titul), co zbývá ve frontě a proč,
- nejasné shody čekající na Vladimira,
- zda proběhl approve/release/deploy nebo co je další krok.

## Gotchas

- PowerShell polyká `--` přes npm — poziční argumenty, nebo Git Bash.
- Duplicitní verze téže písně: match-audio bere nejnovější; nemaž MP3.
- Wrangler OAuth expiruje: `npx wrangler login` při CLOUDFLARE_API_TOKEN chybě.
- Fronta je jediný sdílený stav mezi Claude a Codex — po každé změně ji ulož.
