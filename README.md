# Cello Cool Club — jeden projekt, jeden zdroj pravdy

Všechno žije tady: `C:\Users\Vladimir\Documents\CelloCoolClub`.
Žádné složky na Desktopu, žádný druhý repozitář. Codex i Claude sahají jen sem.

## Kde co je

| Složka | Co v ní je |
|---|---|
| `dashboard/` | **Rozhraní.** `index.json` = jediný zdroj pravdy, `index.html` ho jen vykresluje. |
| `poems/` | 337 zdrojových básní `NNN-slug.md`, trojjazyčně (Česky / Français / English). |
| `poems/collections/` | České „stovky" (2.–6.) jako souvislé sbírky. |
| `assets/text/` | `AllEnglishTexts.md` (1096 anglických textů) + `AllPoems.md` (337 básní CZ/FR/EN). |
| `assets/audio/` | MP3 ze Suno. |
| `assets/posters/` | Hotové plakáty. `assets/posters-hires/` = velké verze. |
| `assets/poster-references/` | **39 Bornových litografií** — vstup pro generování plakátů. |
| `engine/` | Redakční engine: karty (`data/cards.json`), export webu, skripty, admin panel. |
| `experiments/` | Prototypy: komiksové stránky, desky, generátorové skripty. |
| `tools/` | Pomocné skripty (Suno sync, stahování, CDP ovladač). |
| kořen + `cards/`, `p/` | Vygenerovaný statický web (dělá `engine`, needitovat ručně). |

## Dashboard

```bash
cd dashboard
node serve.mjs        # -> http://localhost:8790
```

Neotvírej `index.html` přes `file://` — prohlížeč by nenačetl `index.json`.

Server nic nekopíruje; složky projektu jen připojuje:

| URL | Složka |
|---|---|
| `/ccc-audio/<soubor>` | `assets/audio/` |
| `/ccc-posters/<soubor>` | `assets/posters/` |
| `/ccc-posters-hires/<soubor>` | `assets/posters-hires/` |
| `/ccc-refs/<soubor>` | `assets/poster-references/` |
| `/ccc-poems/<soubor>` | `poems/` |

**Chceš něco změnit → uprav `dashboard/index.json`** (ručně nebo přes Codex) a obnov stránku.

## Pravidla, která platí

- **Média jsou mimo git** (`assets/audio`, `assets/posters`, `assets/posters-hires`,
  `assets/images`, `engine/assets/audio`) — 3+ GB je pro GitHub nevhodných, zdroj pravdy
  je lokální disk. `assets/poster-references/` se naopak verzuje: je to vstup, ne výstup.
- **Texty se píšou nejdřív anglicky**, česká a francouzská verze jsou přebásnění.
- **Žádná česká jména ani příjmení** v básních. Výjimka: literární postavy, na kterých
  báseň stojí (Švejk, Maryša, Mikeš…).
- **Písně: jeden sólový hlas, nikdy sbor** — je to zapečené v `buildSunoPrompt`.

## Skilly, které projekt obsluhují

- `engine/.claude/skills/prevert-fable-poems` — psaní básní (autoritativní pravidla).
- `engine/.claude/skills/cello-club-engine` — ovládání enginu, karty, export.
- `suno-generator` (globální) — generování písní v Suno přes Chrome CDP.
- `born-poster` (globální) — plakáty v technice Adolfa Borna z `assets/poster-references/`.
