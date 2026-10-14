---
name: story-audio-review
description: Kde najít seznam příběhů (karet) Cello Cool Clubu k poslechu/výběru — stránka "Poslech příběhů" a zkratka na ploše. Použij, když Vladimír odkazuje na "seznam příběhů", svou plochovou zkratku "Cello Cool Club - Poslech pribehu", nebo chce vybrat "prvních N" karet podle tohoto seznamu.
---

# Poslech příběhů — kde to je

Zkratka na ploše `C:\Users\Vladimir\Desktop\Cello Cool Club - Poslech pribehu.lnk`
míří na:

```
C:\Users\Vladimir\Documents\CelloCoolClub\experiments\story-audio-review\index.html
```

Je to samostatná experimentální HTML stránka (ne součást enginu) — jednoduchý
přehled karet s možností poslechu audia a tlačítkem „Vybrat". Otevírá se přímo
v prohlížeči (žádný dev server potřeba).

## Struktura

Každý řádek je `<li class="row" data-id="NNN" data-title="...">` s `data-id`
odpovídajícím **přesně** `id` karty v `engine/data/cards.json` (třímístné,
zero-padded, např. `"007"`). Řádky jdou v pořadí podle vzestupného `data-id`
— „prvních N podle seznamu" = prvních N `<li>` v souborovém pořadí (== N karet
s nejnižším číselným id v tomhle konkrétním seznamu, ne nutně nejnižší id
z celé sbírky — seznam obsahuje jen vybranou podmnožinu karet).

Soubor je velký (>250 kB) — při čtení skrz nástroje, co mají limit velikosti,
místo čtení celého souboru rovnou grepni `data-id=` a `data-title=`.

## Vztah ke cards.json

`data-id` je jediný potřebný klíč k dohledání karty:

```bash
cd /c/Users/Vladimir/Documents/CelloCoolClub/engine && node -e "
const c = require('./data/cards.json');
const card = c.find(x => x.id === '007');
console.log(card.title, card.status, !!card.sunoPrompt, !!card.audio);
"
```

Karty v tomto seznamu už typicky mají `status: posted` nebo `music_needed`
s vyplněným `sunoPrompt` a existujícím `audio` (mp3 leží ve
`CelloCoolClub/assets/audio/`, ne v `engine/public` — cesta v `cards.json`
je relativní ke kořeni `CelloCoolClub`, ne ke `engine`).

## Historie

Zjištěno 2026-08-20 při zadání „vezmi prvních deset dle seznamu příběhů" pro
projekt `cello-cool-club-live` (viz ten skill pro dekádové živé verze).
