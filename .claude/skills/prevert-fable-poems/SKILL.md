---
name: prevert-fable-poems
description: Write new original poems in the style of Jacques Prévert for the Prevert Fable collection — trilingual (Czech, French, English), narrative with a pointe. Use when the user asks for new Prévert poems, "další básně", more poems for Cello Cool Club, or extending the Prevert Fable collection.
---

# Prevert Fable — psaní básní

Sbírka originálních básní ve stylu Jacquese Préverta. Každá báseň existuje ve třech jazykových mutacích (anglicky, česky, francouzsky) a vypráví malý příběh s pointou. Básně jsou zdrojem textů pro písně Cello Cool Clubu (Suno).

## ŽELEZNÁ PRAVIDLA (pokyn Vladimíra 2026-07-23/24)

1. **NEJDŘÍV ANGLICKY — týká se generování TEXTU básně.** Nová báseň vzniká primárně
   v angličtině; česká a francouzská verze jsou až přebásnění z ní, ne naopak. Anglický
   text je zdroj pro celou pipeline (karty, Suno).
2. **ŽÁDNÁ česká křestní jména ani příjmení.** Hrdinové = univerzální role/archetypy
   (the baker, the night watchman) nebo mezinárodně srozumitelná jména. Nikdy Novák,
   Souček, Krejčí, Anička apod. — a to ve VŠECH třech jazykových verzích, aby měla postava
   všude totéž jméno. Výjimka: existující **literární/pohádkové postavy**, na kterých báseň
   stojí (Švejk, Maryša, Haňťa, Mikeš, Křemílek…) — ty se nepřejmenovávají.
3. **Hrdina může být kdokoli a cokoli.** Podstatný je příběh s pointou, ne typ hrdiny —
   všední člověk, ale stejně tak věc, planeta, pojem, zvíře, znaménko, literární postava.
   NEomezovat na „všední hrdiny".

Historie: 2026-07-24 proběhl zpětný průchod celou sbírkou a 18 básní dostalo nová jména
(Novák→Smith, Souček→Barton, Krejčí→Taylor, Horáčková→Horton, Bláhová→Blake, Anička→Annie,
Bohumil→Walter, Hedvika→Edith, Řehoř→Gregory, Vrána→Crowe, Vávra→Warren, Doležalová→Dalton,
Havlíček→Halliday, Čermák→Chambers, Franta→Frank). Soupis: `CelloCoolClub\assets\text\zmenena-ceska-jmena.md`.

## Kde co je

- **Sbírka (jednotlivé básně):** `C:\Users\Vladimir\Desktop\Projects\Prevert\NNN-slug.md` — číslovaná řada od 001 (aktuálně do 403, 337 básní). Před psaním VŽDY zjisti nejvyšší existující číslo (`ls` složky) a navazuj.
- **Anglický agregát (Desktop):** `C:\Users\Vladimir\Desktop\Projects\Prevert\PrevertFableEnglish.md`
- **Anglický agregát pro engine:** `C:\Users\Vladimir\Documents\CelloCoolClubEngine\data\clean-sources\prevert_fable_english.md` — z něj admin panel enginu vytváří karty. Formát: `## NNN. TITLE IN CAPS` + text básně.
- **JEDEN celkový anglický soubor (všech 1096 textů):** `C:\Users\Vladimir\Documents\CelloCoolClub\assets\text\AllEnglishTexts.md` — master všech anglických textů klubu.
- **JEDEN sloučený trojjazyčný soubor (337 básní):** `...\CelloCoolClub\assets\text\AllPoems.md` — všechny básně CZ/FR/EN v jednom souboru (nadpisy `## NNN. Název`, sekce `### Česky/Français/English`).
- **Starší sbírka (259 básní FR/CZ/EN):** `...\data\clean-sources\prevert_komplet.md` — jiný, starší formát; needituj, jen zdroj inspirace formátu překladů.

## Styl (závazně)

- Volný verš, téměř bez interpunkce — žádné čárky/tečky na koncích veršů; otazníky uvnitř dialogů ano; nápisy a cedule VELKÝMI PÍSMENY.
- Konkrétní všední obrazy, výčty (inventáře à la Prévertův „Inventaire"), opakování, něha + jemná ironie, tichý humanismus, mrknutí proti autoritě a byrokracii.
- **Příběhovost:** každá báseň je malý příběh s pointou — závěr převrátí perspektivu nebo odhalí hlubší pravdu. Žádný sentimentální kýč, žádná vyslovená morálka; pointa dopadne v obrazu nebo v replice.
- Dialog vpletený do veršů bez uvozovek („Mistře, a tyhle vám nejdou? / Jdou, říká hodinář").
- 30–55 veršů na jazykovou verzi, sloky oddělené prázdným řádkem.
- Tři verze = tatáž báseň, věrné a idiomatické přebásnění, ne doslovný překlad.
- Střídej tvary: dialogová / inventářová / čistě vyprávěná. Hrdinové: lidé (řemesla, obyčejní lidé), zvířata, věci, místa, počasí, čas.
- Zlatý standard: báseň `005-hodinar.md` — přečti si ji před psaním.

## Formát souboru básně

```
# Název básně

*ve stylu Jacquese Préverta*

---

## Česky — NÁZEV VELKÝMI

(báseň)

---

## Français — TITRE EN MAJUSCULES

(poème)

---

## English — TITLE IN CAPITALS

(poem)
```

Název souboru: `NNN-slug.md` — třímístné číslo + český název malými písmeny, ASCII bez diakritiky, pomlčky.

**Pozor na pořadí:** v souboru zůstává sekce Česky nahoře (historický formát), ale **psát se
začíná anglickou verzí** (pravidlo 1) — CZ a FR jsou přebásnění z ní.

## Postup

1. Zjisti nejvyšší existující číslo a seznam všech existujících slugů (= témata, která se NESMÍ opakovat).
2. Navrhni témata nových básní — rozdělená do domén (řemesla, zvířata, věci, místa, příroda, rodina, hudba, cesty, noc/čas, moderní absurdity), každé téma zkontroluj proti existujícím slugům.
3. Pro větší dávky (20+) použij paralelní subagenty: každý dostane brief (styl + formát + ukázka 005 + seznam existujících slugů + přidělený rozsah čísel a témat) a píše soubory přímo. 10 básní na agenta je ověřená porce.
4. Po dopsání ověř: počet souborů, všechny tři sekce (`## Česky`, `## Français`, `## English`) v každém souboru, správné číslování.
5. **Doplň anglické verze do agregátů** (Desktop, engine clean-sources i `AllEnglishTexts.md`) ve formátu `## NNN. TITLE` — extrakcí English sekcí ze souborů (skriptem, ne ručně). Bez toho básně nejdou do karet.
6. **Doplň celou báseň do `AllPoems.md`** (sloučený trojjazyčný soubor) — nadpis `## NNN. Název`, pak sekce `### Česky / ### Français / ### English`.

## Navazující krok

Z básní se dělají karty a písně skillem `cello-club-engine` (stejná složka skillů).
