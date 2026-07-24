---
nazev: Na zeď — plakát s básní a hrajícím QR
oblast: fyzické produkty (vrstva B / Atelier)
vlna: 2 (po zvládnutí tisku karet)
stav: nápad — zadání Vladimira 2026-07-13
zdroj: konverzace 2026-07-13, rozvíjí NAP-12 (QR) a NAP-11 (styl)
---

# Na zeď — plakát, který hraje

Zadání: **něco, co se dá pověsit na zeď** — plakát s artworkem, textem
básně a uměleckým QR kódem, který přehraje píseň. Přesně produkt pro
vrstvu B (Atelier): objekt, ne obrazovka.

## Návrh: tři formáty na zeď

### a) Plakát „vydání" (základ, A3 / 50×70)
Kompozice francouzského koncertního plakátu 60. let (Savignac):
- **Artwork** nahoře jako dominanta, riso paleta sezóny.
- **Báseň celá** vysázená jako součást kompozice (jazzová LP typografie,
  verše volně obtékají motiv — text je grafika, ne popisek).
- **Umělecký QR** = kruhový label desky (NAP-12 trik 1: error correction H,
  mini-ilustrace uvnitř, moduly v barvách sezóny) + katalogové číslo
  CCC-xxx a „drážky" kolem — roh plakátu vypadá jako gramofonová deska
  vystupující z papíru. Naskenuješ → píseň hraje.
- Tisk: riso/giclée, číslovaná edice. Cena ~25–45 €.

### b) „Deska v rámu" (limitka, čtverec 30×30)
Obal LP jako artefakt: čtvercový rám, uvnitř artwork jako obal desky
+ vysunutý kruhový label s QR (vrstvený papír, lehký 3D efekt).
Na zdi visí „deska", která jde přehrát telefonem. Navazuje na krabici
sezóny — stejný vizuální svět. ~60–90 €.

### c) Plakát na míru (svatba/narozeniny)
Rozšíření karty na míru (NAP-16c): báseň pro konkrétního člověka jako
plakát na zeď s věnováním a hrajícím QR. Dárek, který visí v ložnici
a hraje. Cena navrch ke kartě na míru (+40–60 €).

## Proč to sedí do B
- Vyšší cena než karta, stejná výrobní pipeline (artwork + QR + tisk).
- Plakát visí = **reklama v domácnosti hosta** — každá návštěva se zeptá
  „co to je?" a naskenuje. Akvizice zabudovaná v produktu.
- Mozaika 12 plakátů sezóny = cíl kompletace pro sběratele (sleva na
  12. kus / výměna za box).

## Technické kroky (až na to dojde)
1. Rozšířit `export-print.mjs` o formát `poster` (A3, 300 DPI, spadávka).
2. QR-label generátor: custom rendering nad maticí knihovny `qrcode`
   (kruhový ořez, barvy sezóny, střední ilustrace, EC úroveň H) —
   **sdílený modul pro plakát, rub karty (F1) i web**.
3. Sazba básně: šablona s typografickou hierarchií per jazyk (FR/CZ/EN).
4. Prototyp: karta 007 (Garden Statues) — má artwork i píseň na webu.
5. Ověřit skenovatelnost QR z ~2 m (velikost modulu vs. vzdálenost!).

## Otevřené otázky
- Tiskárna pro A3 riso/giclée v CH, cena kusu a malé edice.
- QR na plakátu: v labelu přiznaný, nebo ukrytý ve scéně (NAP-12 trik 2)?
  Návrh: label — na zdi má být čitelný na první pohled.
- Prodej: web (katalog B), koncerty, nebo jen na objednávku?
