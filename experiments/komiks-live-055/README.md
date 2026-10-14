# Komiks — The Thief of Sleep (karta 055)

Jednolistový komiks ze živé verze CelloCoolClubLive 1920. Artifact:
https://claude.ai/code/artifact/7ed6316f-cf48-4862-bd88-bc36f0bc3e73

## Odkud metodika

Ze staženého skillu **`baoyu-comic`** (GitHub `Aston1690/baoyu-comic`, nainstalováno do
`~/.claude/skills/baoyu-comic`) je převzatý postup: analýza → storyboard s rozpisem
políček (úhel kamery, postavy, prostředí, světlo, barevný tón) → list postav pro
konzistenci → prompty po políčkách → sekvenční generování → sazba stránky. Použitý
layout `mixed` (3–7 políček, nepravidelný rytmus, doporučený pro emoční oblouk).

**Nepoužité z toho skillu:** jeho vlastní generátor obrázků (potřebuje `bun`/`npx`
a cizí obrazové API) a jeho výtvarné styly. Obrázky dělá naše linka `born-poster`
přes Gemini CDP, výtvarná poloha je bornovská litografie ve variantě *příběhová
scéna*.

**Odchylka od skillu `komiks-basen`:** tam se políčka vyřezávají CSS výřezy z jedné
ilustrace; tady je každé políčko samostatně vygenerovaný obrázek.

## Konzistence postav

`characters/characters.png` (zloděj + dcera + pytel na jednotném tmavém poli) se
generuje jako první a přikládá se jako POSLEDNÍ reference ke každému políčku;
v promptu je věta „the LAST attached image is the character sheet". Bez toho si
Gemini postavu pokaždé překreslí.

## Soubory

```
storyboard.md            rozpis 7 políček + verše + mřížka
prompts/00-characters.txt list postav
prompts/01..07-*.txt      prompty políček
characters/characters.png list postav
panels/0N-*.png|jpg       políčka (png originál, jpg pro sazbu)
archiv/                   zahozené verze
komiks.json               manifest sazby (políčka, typy polí, verše, audio)
komiks.html               verze pro Artifact
komiks-standalone.html    verze pro plochu (má <meta viewport>)
```

Skripty už tady nejsou — 2026-08-23 se z téhle linky stal skill **`born-comics`**
(`~/.claude/skills/born-comics`). Generování, ořez, kontaktní list, jpg kopie i sazba
se pouštějí odtamtud, tenhle adresář je jeho referenční příklad:

```bash
node ~/.claude/skills/born-comics/scripts/build-komiks.mjs <tento adresář>
```

## Pasti

- Prompt musí explicitně zakázat okraj: „the picture must FILL THE WHOLE FRAME edge to
  edge — no white paper margin, no border, no rounded corners". I tak to Gemini občas
  udělá (políčko 01) — proto `trim-panels.mjs`.
- Reference postav přebije popis role: políčko 05 mělo být unavený cestující, Gemini
  tam posadilo zloděje. Řešení: do promptu napsat výslovně „NOT the thief, do not put
  the thief in this picture at all" + popsat, čím se ten člověk liší.
- `komiks.html` je verze pro artifact (bez `<html>`/`<head>`, hlavičku doplní
  publikace). `komiks-standalone.html` má `<meta viewport>` a je určená pro plochu a
  lokální prohlížení — bez toho mobil sází stránku na 980 px a ořízne ji.
