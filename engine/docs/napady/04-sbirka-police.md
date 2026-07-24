---
nazev: „Moje sada LP" — sbírka a police
oblast: produkt (web)
vlna: 1 (localStorage) → 3 (členská)
stav: nápad
zdroj: BRAINSTORM-CLAIRE.md §3
---

# „Moje sada LP" — police

- Pohled `/collection/` (nebo `/shelf/`): mřížka desek, které si člověk přidal.
  Vypadá jako police s vinyly — hřbety/labely, sezóny jako řady police.
- **Fáze 1 (bez účtů!):** sbírka v `localStorage` — tlačítko „Přidat do
  sbírky“ na každé kartě, zdarma. Nula backendů; lidi si zvyknou na gesto
  sbírání. Deterministicky nad veřejným `data/cards.json` (princip `/draw/` C4).
- **Fáze 2 (členství):** sbírka vázaná na e-mail/token, synchronizace,
  a hlavně poslech mimo web → [podcast feed](08-podcast-feed-do-auta.md).
- Police vizuálně ukazuje díry v sezóně → motor kompletace,
  viz [sběratelský systém](09-sberatelsky-system.md).
