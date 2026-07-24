---
nazev: Hitparáda — žebříček jako pořad
oblast: obsah a retence
vlna: 1 (redakční) → 3 (Worker+KV počítadlo)
stav: nápad
zdroj: BRAINSTORM-CLAIRE.md §15
---

# Hitparáda — žebříček jako pořad, ne tabulka

Žebříček je **rituál a divadlo** — jako nedělní rozhlasová hitparáda
(Houpačka). Claire je moderátorka; čísla jsou záminka k vyprávění.

## Formát
- **„Nedělní hitparáda s Claire“** — Top 10, vyhlašuje se v neděli (spojeno
  s [Nedělní kávou](06-ranni-kava.md)). Claire komentuje: „Hodiny spadly
  o tři místa. Čas je zrádný, říkala jsem to.“
- Billboardová dramaturgie: šipky ↑↓, nováček týdne, týdny v žebříčku,
  návrat. Katalogová čísla CCC-xxx jako z hudebního časopisu 60. let.
- **Zlatá deska** 🏆: vítěz N týdnů / sezóny → zlatý label na webu, zlatá
  fyzická limitka (foil/zlatý filament). Vzácnost si píseň *vyslouží*.
- **Výroční hitparáda sezóny** určuje pořadí tracklistu alba, 3D limitku,
  koncertní repertoár — hlasování má skutečné důsledky.

## Odkud se berou body
- **Fáze 1 — bez backendu: redakční žebříček.** Sestavuje „Claire“
  (kurátorsky), `data/charts.json`, exportér vydá `/hitparada/`.
  Přiznaně subjektivní — „Claire má své nálady“.
- **Fáze 2 — první malý backend: Cloudflare Worker + KV.** Endpoint počítá
  přehrání (ping z vinyl přehrávače) + hlasy. Rolling okno 14 dní.
- **Hlasování = členská výhoda:** 1 hlas týdně — vzácný hlas má váhu,
  důvod se v neděli vracet. [Věnování](16-venovani-a-na-prani.md) = bod
  navíc → „nejvěnovanější píseň týdne“.
- Kids deck: oddělená „Suzuki hitparáda“ — nálepky na lekcích, fyzická
  nástěnka, foto na webu.
