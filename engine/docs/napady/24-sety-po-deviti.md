---
nazev: Sety po devíti — postupné odemykání sbírky
oblast: produkt (mechaniky + web)
vlna: 1 (localStorage) → 3 (členství)
stav: nápad
zdroj: zadání 22. 7. + prototyp deska-mlecny-zub.html
---

# Sety po devíti

Sbírka se nevydává po jedné kartě do nekonečna, ale po **setech 9 desek**.
Lidé si desky v setu **postupně odemykají** — police plná zamčených obalů
je motor návratů.

## Proč zrovna devět

- **3×3 police** — vizuálně úplný čtverec; funguje na mobilu, na webu
  i jako fyzický box.
- Při kadenci 1 karta / 3 dny je set = **27 dní ≈ měsíc**. „Měsíční deska"
  je srozumitelný rytmus (vs. abstraktní sezóna).
- **9 labelů = mozaika 3×3.** Středové labely (kulaté výřezy z plakátů,
  viz prototyp gramodesky) můžou po kompletaci složit jeden velký obraz —
  deváté políčko je pointa.
- Vztah k dnešní „sezóně 12" ([09](09-sberatelsky-system.md)): buď devítka
  dvanáctku **nahradí** jako základní jednotka, nebo set = „kapitola"
  napříč sezónami. Devítka má lepší geometrii i rytmus — doporučuju nahradit.

## Police setu (3×3)

- **Zamčená pozice** = slepý obal: jen papír, riso ornament a ražba
  (případně „duch" plakátu — šedý rozostřený stín jako teaser).
  Žádný název, žádné číslo — jen tvar toho, co přijde.
- **Odemčená pozice** = plná karta s Bornovým plakátem → klik → LP flow
  z prototypu (deska vyjede z obalu, točí se, hraje; dál plakát a báseň).
- Pod policí počítadlo **6/9** a jméno setu; díry táhnou
  ([04 police](04-sbirka-police.md), [09 kompletace](09-sberatelsky-system.md)).

## Jak se odemyká — rituál, ne grind

- **Klíč = poslech.** Další deska se odemkne, až doposloucháš tu předchozí
  (event `ended`). Sbírka se nedá proklikat, jen prožít.
- **+ nový den.** Maximálně jedna nová deska denně → přesně
  [ranní káva s Claire](06-ranni-kava.md); set vydrží 9 dní pozornosti
  a nedá se zbinge-ovat.
- **První deska setu je odemčená vždy** (výloha, sdílitelný vstup).
- **Členové** dostanou celý set hned + [podcast feed](08-podcast-feed-do-auta.md);
  zdarma se odemyká jen aktuální set. Drží zásadu z [07](07-youtube-strategie.md):
  paywall neschovává poslech, jen zkracuje čekání a přidává pohodlí.
- **Koncertní claim kód** odemkne konkrétní desku okamžitě — fyzická
  událost sype do digitální police ([09](09-sberatelsky-system.md)).
- Poctivě: odemykání je client-side, jde obejít. Nevadí — není to DRM,
  je to rituál (zásada: žádná umělá vzácnost digitálu).

## Odměna za 9/9

- Police se „slije": labely se otočí a složí **mozaiku setu** / hřbet
  zezlátne (zlatá deska).
- Bonus: **B-strana** (živé cello — [19](19-skutecne-cello.md)),
  tisknutelný plakát setu, sleva na fyzický box.

## Fyzická ozvěna

- **Box „Devítka"**: krabička 3×3 karet, deváté okénko průhledné.
  Menší a levnější MVP než sezónní box 12 ([05](05-fyzicke-lp-karty.md)).
- [Advent](20-kalendar-klubu.md) = speciální set 24 se stejnou mechanikou,
  jen klíčem je datum místo poslechu.

## Technika (fáze 1 bez backendu)

- `cards.json`: `set: "S01"`, `poradiVSetu: 1–9`; sety definuje redakce.
- `localStorage`: `{ set, odemceno: [...], doposlechnuto: [...] }` —
  odemykací pravidlo je čistý JS nad veřejným exportem, nula backendu.
- Sdílení police jen ke čtení přes URL parametry (pochlubit se progresem).
- Riziko: localStorage je křehké (vyčištění prohlížeče = pryč) →
  argument pro členskou synchronizaci ve vlně 3.
