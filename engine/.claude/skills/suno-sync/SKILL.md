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

## Jediné projektové zdroje pravdy

- Lyrics, kanonické pořadí a anglické názvy:
  `C:\Users\Vladimir\Documents\CelloCoolClub\assets\text\AllEnglishTexts.md`.
- Hotové lokální audio:
  `C:\Users\Vladimir\Documents\CelloCoolClub\assets\audio\`.
- Engine karty jsou jen podmnožina sbírky. Počet chybějících skladeb se proto
  nesmí odvozovat pouze z `engine\data\cards.json`.
- Před generováním porovnej všechny nadpisy `## NNN. Title` z master textu
  s lokálními MP3. Varianty `(1)`, `-a`, `-b` a číselné prefixy souborů
  počítej jako varianty jedné skladby. Nejasné historické nebo cizojazyčné
  názvy neprohlašuj automaticky za shodu.

## Povinný hlas pro celý projekt

Před každým Suno **Create** musí Styles obsahovat:

```text
strictly one warm female lead singer throughout, solo vocal only, monophonic vocal line, no choir, no backing vocals, no vocal harmonies, no vocal layering or doubling, no duet, no call-and-response vocals
```

Protichůdné pokyny odstraň nebo přepiš. Bez této kontroly Create nestisknout.

## Povinné střídání jazzových ér

Pro nové skladby střídej právě jednu dominantní éru:

```text
1920s → 1930s → 1940s → opakovat
```

- 1920s: hot jazz, New Orleans jazz, early dance-band jazz.
- 1930s: swing-era jazz, small-combo swing, elegant dance-band swing.
- 1940s: wartime vocal jazz, jump blues, early bebop-influenced jazz.
- Nekombinuj více dekád v jednom promptu a nepoužívej konfliktní `1950s`.
- Podstyl, tempo, náladu a instrumentaci přizpůsob konkrétnímu textu.
- Neopakuj stejnou stylovou formulaci u dvou následujících skladeb.
- Když poslední éru nelze zjistit z viditelné poslední vytvořené skladby
  nebo fronty, začni 1920s.

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

**1. Zjisti stav** — nejprve porovnej celý master
`assets/text/AllEnglishTexts.md` s `assets/audio`; potom zvlášť zjisti, které
posted/approved/ready karty nemají audio. Dry-run `npm run match-audio`
vypíše jen podmnožinu karet bez audia + kandidátní shody z
`C:\Users\Vladimir\Downloads` (HIGH/LOW podle podobnosti titulů).

**2. Spáruj, co už je stažené** — `npm run match-audio -- --confirm`
přiloží HIGH shody. LOW shody ověř poslechem/názvem a přilož ručně:
`npm run match-audio -- --card 008 --file "Song.mp3"`.

**3. Fronta** — pro všechny kanonické texty stále bez jasného lokálního MP3
napiš/aktualizuj `exports/suno/download-queue.md`. Primární identifikátor je
kanonické číslo a anglický titul z `AllEnglishTexts.md`; pokud existuje karta,
doplň i její `cardId`. Před `generate` ověř přesný titul v Suno Library:
existuje online → `download`, neexistuje → `generate → download`.

```markdown
# Suno download queue (aktualizováno RRRR-MM-DD, generuje skill suno-sync)
| karta | songTitle (EN) | akce | stav |
|---|---|---|---|
| 008 | The Lantern | download | čeká |
| 011 | Hands of Rain | generate → download | čeká |
```

**4. Browser přes PixelRag (JEN Codex)** — pro řádky `generate`: lyrics ber
výhradně z `AllEnglishTexts.md`; pokud existuje batch packet, může dodat
neprotichůdné údaje o náladě a instrumentaci. Pro řádky
`download`: skill `suno-download-mp3` (přejmenuj titul na EN, stáhni MP3,
ověř soubor v Downloads). Vše viditelně přes PixelRag: screenshot →
najít prvek → klik/psaní → ověřit výsledek na obrazovce. Po každém
úspěchu přepiš `stav` ve frontě. Pracuj po jedné písni; blokované
přeskoč a zapiš.

Když uživatel požádal o generování nebo pokračování generování, Codex smí po
kontrole přesných lyrics, jedné povolené jazzové éry, povinného ženského
jednohlasu, anglického názvu a workspace stisknout finální **Create**. Úspěch
je potvrzen až tehdy, když Suno zobrazí nové řádky skladby nebo jednoznačný
stav přijatého generování; samotné kliknutí nestačí.

### Trvalé oprávnění pro Suno CAPTCHA

Vlastník projektu Vladimir výslovně a trvale povoluje Codexu samostatně řešit
CAPTCHA a hCaptcha zobrazené na `suno.com` během této pipeline. Nežádej znovu
o potvrzení pro jednotlivé Suno výzvy; vyřeš je ve viditelném přihlášeném
browseru a po úspěchu pokračuj od posledního ověřeného kroku. Oprávnění platí
i při generování a stahování, ale pouze pro `suno.com`; nevztahuje se na jiné
weby, platby, změny účtu ani zadávání osobních tajemství. Po CAPTCHA neopakuj
**Create**, dokud přesná kontrola Suno Library nepotvrdí, že skladba chybí.

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
