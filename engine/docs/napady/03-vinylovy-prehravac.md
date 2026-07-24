---
nazev: Vinylový přehrávač na webu
oblast: produkt (web)
vlna: 1
stav: nápad — kandidát č. 1 na stavbu
zdroj: BRAINSTORM-CLAIRE.md §3
---

# Vinylový přehrávač — karta jako deska

- Stránka karty: uprostřed **vinylová deska**, na středovém labelu unikátní
  mini-ilustrace (výřez artworku karty). Play → deska se roztočí, tonearm se
  položí, hraje píseň. Čisté CSS animace, žádný framework.
- Evoluce dnešního play buttonu na `p/<id>/` — **stejná komponenta** na stránce
  karty i na QR přehrávací stránce.
- Detail, který prodává: deska se dotáčí po pauze; label se čte i v klidu.

## Implementace
- Šablony v `renderers.mjs` + CSS; label generovat ze stávajícího artworku
  (sharp výřez do kruhu).
- Sleeve s věnováním z URL parametrů viz [věnování](16-venovani-a-na-prani.md).
