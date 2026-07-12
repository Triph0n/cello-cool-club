---
nazev: Rafinovaný QR — kód jako součást artworku
oblast: fyzické produkty (tisk)
vlna: 2 (triky 1–2) → dál dle edic
stav: nápad
zdroj: BRAINSTORM-CLAIRE.md §12
---

# Rafinovaný QR

Zásada: QR nesmí vypadat jako fakturační kód. Buď **schovaný v ilustraci**,
nebo **přiznaný jako krásný objekt** (label desky). Nikdy nalepený v rohu.

Odstupňované triky (levné → magické):

1. **QR v labelu desky** (základ): kruhový střed karty = label, QR jako „ryté
   drážky“. Error correction H snese ~30 % zásahů → mini-ilustrace uvnitř,
   moduly v barvách sezóny, stylizované rohové terče. Knihovna `qrcode` už
   v enginu je; custom rendering = skript nad její maticí.
2. **QR ukrytý ve scéně:** kód *v obraze* — plakát na zdi, okno, dlaždice
   kavárny. Hledání je hra („najdi, kde dnes hraje Claire“).
3. **Halftone QR:** moduly nahrazeny rastrem, kterým prosvítá kresba.
   Pro speciální karty.
4. **Termochromický inkoust** (sběratelská edice): QR se objeví **zahřátím**
   — přiložíš kartu k hrnku ranní kávy ☕. Marketing se píše sám.
5. **NFC tag** (žádný viditelný kód): NTAG v kartě (~0,10–0,30 €/ks),
   přiložíš telefon → hraje. Fallback malý QR na rubu.

Mapování na žebřík: tištěný deck = 1–2 · sběratelský box = 3–4 ·
koncertní/limitka = 5 (+[3D](13-3d-tisk-limitky.md)). Rafinovanost QR =
viditelný rozdíl mezi úrovněmi.
