---
nazev: Podcast feed do auta (zabijácká členská funkce)
oblast: produkt (členství)
vlna: 3
stav: nápad
zdroj: BRAINSTORM-CLAIRE.md §6
---

# Poslech v autě — soukromý podcastový feed

- Engine už generuje `feed.xml`. Členská verze: **RSS s enclosures = podcast
  feed s tokenem v URL** (`/feed/<token>.xml`) → člen si přidá do libovolné
  podcast aplikace → CarPlay, Android Auto, offline, rychlost přehrávání —
  vše zdarma vyřešené ekosystémem podcastů.
- Úrovně: (a) feed „celý archiv“, (b) později „jen moje sbírka“
  (per-member — chce Worker/KV, fáze 2+).
- Zavržené alternativy: vlastní PWA přehrávač (drahá údržba),
  Spotify/DistroKid (nebuduje klub — udělat *později* jako výlohu).
