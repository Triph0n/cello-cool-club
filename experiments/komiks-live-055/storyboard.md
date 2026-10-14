---
title: "The Thief of Sleep"
source: "engine card 055 / CelloCoolClubLive 1920, poem-poster #083"
art_style: "Adolf Born lithograph (born-poster technique)"
tone: "dramatic / tender"
layout: "mixed (7 panels, one page)"
language: "en (verses), cs (working notes)"
page_count: 1
---

# The Thief of Sleep — storyboard

Metodika převzatá ze staženého skillu `baoyu-comic` (analýza → storyboard → prompty
→ sekvenční generování → sazba stránky). Výtvarná složka NENÍ z toho skillu: zůstává
bornovská litografie z `born-poster`, ve variantě **příběhová scéna** (ne emblém),
protože stránka má vyprávět děj, ne nést jeden znak.

**Zásadní odchylka od skillu `komiks-basen`**: každé políčko je vlastní vygenerovaný
obrázek, žádné CSS výřezy z jednoho plakátu.

**Konzistence postav**: nejdřív se vygeneruje list postav (`characters/characters.png`),
který se pak přikládá jako reference ke KAŽDÉMU políčku (Strategy A z `baoyu-comic`
— naše `born-generate.mjs` reference umí).

## Paleta (drží se karty 055)

Deep midnight blue dominant, dark plum second, warm ochres — jedna ochrová lampička,
teplý odlesk na spící tváři. Spánek sám = bledá ochrová stuha/pára, jediné světlé
místo v tmavých políčkách.

## Postavy

| postava | popis |
|---|---|
| Zloděj | vysoký hubený muž, dlouhý tmavý kabát ke kotníkům, měkký klobouk se sklopenou krempou, úzká protáhlá lebka, dlouhý rovný nos v jedné linii s čelem, malé mandlové oči blízko u sebe |
| Dcera | malá bledá holčička, ~8 let, tmavé vlasy rozhozené na polštáři, tenká noční košile, stejná bornovská tvářová gramatika |
| Sák | obrovský měkký pytel z hrubé látky, převázaný provazem, zevnitř slabě ochrově prosvítá |

## Políčka

| # | mřížka | verše (vypravěčský rámeček) | scéna |
|---|---|---|---|
| 1 | span 2 (široké) | He does not steal money / he steals sleep | noční ulice zdola, zloděj v průchodu, jediné rozsvícené okno |
| 2 | 1 (čtverec) | At night he slips into bedrooms / making no sound at all | detail: ruka v rukavici odvíjí bledou ochrovou stuhu z čela spícího muže |
| 3 | 1 (vysoké, span 2 řádky) | and takes the sleep from people / stuffing it into a great sack | zloděj na schodišti s obrovským pytlem, který skoro nejde protáhnout |
| 4 | 1 (čtverec) | In the morning people wake up weary / with dark shadows under their eyes | ráno, žena u kuchyňského stolu, prázdný pohled, kruhy pod očima |
| 5 | 1 (čtverec) | they do not know their rest has been stolen | tentýž muž z políčka 2 v tramvaji, hlava opřená o sklo, oči otevřené |
| 6 | span 2 (široké) | The thief goes home / and gives the stolen sleep / to his little sick daughter | chudý pokoj, zloděj klečí u postele a rozvazuje pytel, stuhy se snášejí na dítě |
| 7 | celá šířka (finále) | She drifts off at last with a smile / And the thief watches her / his heart heavy / with being both a criminal and a savior | dcera spí s úsměvem, zloděj sedí zády na podlaze u pelesti, hlava skloněná |

## Kompoziční pravidla (z `baoyu-comic` layouts/mixed + analysis-framework)

- Střídat odstupy kamery: celek (1) → detail (2) → celek se siluetou (3) → polodetail
  (4, 5) → střední záběr (6) → široký klidný finální záběr (7).
- Žádný text uvnitř obrázků (litografie textu neumí a bornovská technika ho nechce) —
  verše nese sazba stránky.
- Poslední pás je vždy nejtišší: pointa se čte v obraze, ne v akci.
