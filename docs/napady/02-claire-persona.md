---
nazev: Claire — AI zpěvačka klubu
oblast: identita
vlna: 1
stav: nápad (klíčové rozhodnutí — kanonický hlas + portrét)
zdroj: BRAINSTORM-CLAIRE.md §2
---

# Claire — persona

- Stálá zpěvačka klubu: vždy stejný hlas, vždy stejná vizuální identita.
- **Přiznaně AI** — žádné předstírání („Claire žije uvnitř klubu“).
  Srov. Gorillaz: kreslená kapela, nikdo se necítí podveden.
- **Ilustrovaná, ne fotorealistická** — fotorealismus = uncanny valley;
  ilustrace = šarm. Styl viz [Atelier Claire](11-atelier-claire-styl.md).

## Hlas
- **Suno Personas** — konzistentní hlas napříč písněmi. Vybrat jednu nejlepší
  existující nahrávku (~240 MP3 v Downloads) a udělat z ní kanonický hlas.
- Staré karty s jiným hlasem: návrh „hosté klubu“, od sezóny II zpívá vše
  Claire (nebo postupně přenahrát) — **nerozhodnuto**.

## Charakter
- Prévertovská duše: melancholická, hravá, něžně ironická. Pije ranní kávu,
  miluje cello, déšť za oknem a staré desky.
- Mluví krátce — 1–2 věty jejím hlasem na kartách a v popiscích.
- Jméno funguje ve FR/CZ/EN (světlo, jasnost).

## V enginu
- `data/site.json`: sekce `persona` (jméno, bio, kanonický portrét, Suno
  persona ID).
- Karty: volitelné pole `claireNote` — věta jejím hlasem na stránce karty
  a v newsletteru.
