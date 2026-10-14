---
title: "The Thief of Sleep"
source: "engine card 055 / CelloCoolClubLive 1920, lyrics.txt"
art_style: "Adolf Born lithograph (born-poster technique)"
tone: "dramatic / tender"
layout: "mixed, four pages"
language: "en (verses), cs (working notes)"
page_count: 4
panel_count: 18
---

# The Thief of Sleep — vícestránkový storyboard

Prototyp vícestránkového komiksu. Rozdíl proti jednolistové verzi
(`komiks-live-055`): stránek je tolik, kolik jich báseň potřebuje, a v rámečcích je
**celý text básně slovo od slova** — žádné zkracování ani slučování veršů do jednoho
hutného rámečku. Devatenáct veršů je rozděleno na osmnáct políček; jediný verš, který
se dělí na dvě políčka, je `they do not know their rest has been stolen` (políčka 09
a 10) — dělí se přesně na hranici myšlenky.

Kontrolu úplnosti dělá skript, ne oko:

```bash
node ~/.claude/skills/born-comics/scripts/check-text.mjs <comicDir> --lyrics <lyrics.txt>
```

## Paleta (drží se karty 055)

Deep midnight blue dominant, dark plum second, warm ochres — jedna ochrová lampička,
teplý odlesk. Spánek sám = bledá ochrová stuha/pára, jediné světlé místo v tmavých
políčkách. Stuha je motiv, který drží všechny čtyři stránky pohromadě: na první se
sbírá, na druhé chybí, na třetí se vrací, na čtvrté leží na spící tváři.

## Postavy

| postava | popis |
|---|---|
| Zloděj | vysoký hubený muž, dlouhý tmavý kabát ke kotníkům, měkký klobouk se sklopenou krempou, úzká protáhlá lebka, dlouhý rovný nos v jedné linii s čelem, malé mandlové oči blízko u sebe |
| Dcera | malá bledá holčička, ~8 let, tmavé vlasy rozhozené na polštáři, tenká noční košile, stejná bornovská tvářová gramatika |
| Pytel | obrovský měkký pytel z hrubé látky, převázaný provazem, zevnitř slabě ochrově prosvítá |

Vedlejší postavy (okradení lidé) musí mít v promptu **výslovný zákaz zloděje** —
`NOT the thief, do not put the thief in this picture at all` — jinak je list postav
přebije. Viz past v `SKILL.md`.

## Strana 1 — The Night Round

Krádež. Kamera jde od celku k detailu a zpátky; poslední políčko je osamocený
portrét uprostřed řádku, aby stránka skončila tichem před přelomem.

| # | pole | verš | scéna |
|---|---|---|---|
| 01 | wide (span 2) | He does not steal money | noční ulice zdola, zloděj v průchodu, jediné rozsvícené okno |
| 02 | square | he steals sleep | detail nočního stolku: peníze, hodinky, prsten — ruka jde NAD nimi dál k polštáři |
| 03 | square | At night he slips into bedrooms | zloděj se bokem protahuje pootevřenými dveřmi, tělo absurdně tenké |
| 04 | square | making no sound at all | detail shora: rukavice odvíjí bledou ochrovou stuhu z čela spícího |
| 05 | square | and takes the sleep from people | noclehárna, dvě řady postelí, stuhy ze všech čel se sbíhají do zlodějovy pěsti |
| 06 | tall, `grid-column:2/3;grid-row:3/4` | stuffing it into a great sack | schodiště, obrovský pytel, který skoro nejde protáhnout |

## Strana 2 — The Weary City

Důsledek. Zloděj na stránce vůbec není — to je pointa téhle strany.

| # | pole | verš | scéna |
|---|---|---|---|
| 07 | square | In the morning people wake up weary | ráno, žena u kuchyňského stolu, prázdný pohled |
| 08 | square | with dark shadows under their eyes | mladý muž u holicího zrcátka si stahuje kůži pod okem |
| 09 | square | they do not know | tentýž unavený cestující v tramvaji, hlava o sklo, oči otevřené |
| 10 | full (21:8) | their rest has been stolen | panorama fronty na tramvaj, každý padá jinak; nahoře smaltové hodiny |

## Strana 3 — The Road Home

Obrat. Pytel se poprvé otevírá, ale stránka končí na bolesti, ne na úlevě.

| # | pole | verš | scéna |
|---|---|---|---|
| 11 | square | The thief goes home | zezadu, úzká chudá ulice za rozbřesku, pytel na rameni prosvítá ochrově |
| 12 | banner (span 2) | and gives the stolen sleep | chudý pokoj, zloděj klečí a rozvazuje pytel, stuhy se snášejí |
| 13 | wide (span 2) | to his little sick daughter | dcera v posteli, ŠIROCE VZHŮRU, zloděj v políčku není |
| 14 | square | who cannot rest because of the pain | detail dětské ruky zaťaté do deky; stuha visí nad prsty, ještě se jich nedotkla |

Políčko 14 vzniklo místo původního motivu se slzou na dětské tváři — ten dvakrát
spadl na `GENERATION_TIMEOUT`. Motiv se přepsal, neopakoval.

## Strana 4 — Criminal and Savior

Rozuzlení. Dvě panoramata pod sebou, obě nejtišší v celém komiksu.

| # | pole | verš | scéna |
|---|---|---|---|
| 15 | wide (span 2) | She drifts off at last | roj stuh se z pytle snáší na postel jako přikrývka ze světla |
| 16 | square | with a smile | detail spící tváře, stuha přes čelo |
| 17 | full (21:8) | And the thief watches her / his heart heavy | zloděj sedí zády na podlaze u pelesti, hlava skloněná |
| 18 | full (21:8) | with being both / a criminal and a savior | celý pokoj ze strany: dítě spí, prázdný pytel na zemi, zloděj hledí do okna, kde svítá |

## Plátek s básní

Za čtvrtou stranou je pátý list `poem` z manifestu — celá báseň vcelku. Slouží
čtenáři jako doslov a nám jako důkaz, že v rámečcích nic nechybí.

## Kompoziční pravidla

- Střídat odstupy kamery uvnitř každé strany; každá strana má vlastní rytmus a
  vlastní poslední tichý záběr.
- Reading order = pořadí veršů. Pole se sázejí tak, aby oko šlo přesně po básni —
  proto na straně 3 stojí `wide` až pod `banner`em a ne vedle něj.
- Žádný text uvnitř obrázků — verše nese sazba stránky.
