---
nazev: Písničky na přání a věnování
oblast: produkt + monetizace (dárky)
vlna: 1 (URL věnování) → 3 (do éteru) → produkt (na míru)
stav: nápad
zdroj: BRAINSTORM-CLAIRE.md §16
---

# Písničky na přání a věnování

Rozhlasová tradice „písniček na přání“. Tři úrovně:

## a) Věnování (zdarma, bez backendu — fáze 1)
- Tlačítko **„Věnovat tuhle desku“** → formulář (komu, od koho, vzkaz) →
  URL `p/007/?pro=Jana&od=Petr&v=k+narozeninam`. Přehrávací stránka vykreslí
  **obal s věnováním**: deska v papírovém sleeve, rukopisem „Pro Janu ♥
  od Petra“. Play → deska se roztočí.
- **Věnování žije v URL — nula backendů.** (Limit: OG náhled zůstává obecný;
  personalizovaný OG = Worker, fáze 2.)
- Psychologie: neposíláš odkaz, posíláš **desku se vzkazem**. Nejpřirozenější
  akviziční kanál — „…a zítra ráno hraje Claire další.“
- Ošetřit: délkový limit + escapování volného textu z URL parametru.

## b) Přání do éteru (členské)
- Člen pošle věnování do **Nedělní kávy** — Claire ho přečte v pořadu
  (newsletter, YouTube community post). Kurátoruje Vladimír (fronta
  v admin panelu), Claire formuluje. Vzácné → cenné → členské.

## c) Karta na míru (prémiový produkt, dárkový trh)
- **„Claire napíše píseň pro vašeho člověka“:** báseň na míru (jméno,
  příběh, FR/CZ/EN) → Suno persona → privátní karta s artworkem a QR,
  vytištěná a poslaná. Deck `custom`, mimo veřejný export.
- Svatby, narozeniny, výročí, narození dítěte. **100–200 €** — konkurence
  (personalizované písně) prodává, ale nikdo nemá kartu-desku jako artefakt.
- Stretch: objednatel může kartu později „odemknout do klubu“ → veřejná
  karta s kreditem („na přání Petra pro Janu“), rodina má „svoji“ desku
  v hitparádě.
- Pilot: 3 kusy pro známé (ověřit cenu, lhůtu, udržitelný objem).
