# Komiks — The Thief of Sleep, vícestránkový prototyp (karta 055)

Prototyp vícestránkové polohy skillu `born-comics`. Čtyři strany, osmnáct políček,
**celý text básně** v rámečcích, plus závěrečný plátek s básní vcelku.

Artifact: https://claude.ai/code/artifact/344004bd-c309-4060-8f5a-31047bb73dd0
Kopie na ploše: `The Thief of Sleep — komiks 4 strany.html`

Předchůdce: `../komiks-live-055` — táž karta na jednom listu v sedmi políčkách,
verše slučované po dvojicích. Tenhle adresář ho nenahrazuje, oba jsou referenční
příklady dvou poloh téhož skillu.

## Co je na tom nové

| | jednolist `komiks-live-055` | tenhle |
|---|---|---|
| stran | 1 | 4 + plátek s básní |
| políček | 7 | 18 |
| verš na rámeček | 2 verše na rámeček | 1 verš na políčko |
| dělení příběhu | jedna mřížka | akty s nadpisem, číslo strany, `page-break` v tisku |
| kontrola textu | okem | `check-text.mjs` proti `lyrics.txt` |

Devatenáct veršů karty 055 vyšlo na 18 políček. Jediný verš dělený mezi dvě políčka
je `they do not know their rest has been stolen` (09 a 10) — dělí se na hranici
myšlenky, ne uprostřed.

## Strany

1. **The Night Round** — krádež (6 políček, končí osamoceným portrétem uprostřed řádku)
2. **The Weary City** — důsledek (4 políčka, zloděj v žádném z nich; to je pointa strany)
3. **The Road Home** — obrat (4 políčka, končí na bolesti, ne na úlevě)
4. **Criminal and Savior** — rozuzlení (4 políčka, dvě panoramata pod sebou)

Rozpis políček, veršů a scén je ve `storyboard.md`.

## Políčka převzatá z jednolistu

Sedm obrázků se přečíslovalo a použilo znovu beze změny — stejná paleta, stejný list
postav, tak proč je generovat podruhé:

| tady | původně v `komiks-live-055` |
|---|---|
| `01-night-street` | `01-night-street` |
| `04-taking-the-sleep` | `02-taking-the-sleep` |
| `06-the-sack-on-the-stairs` | `03-the-sack-on-the-stairs` |
| `07-weary-morning` | `04-weary-morning` |
| `09-the-tram` | `05-the-tram` |
| `12-giving-it-back` | `06-giving-it-back` |
| `17-criminal-and-savior` | `07-criminal-and-savior` |

Zbylých jedenáct je nových (02, 03, 05, 08, 10, 11, 13, 14, 15, 16, 18). `characters.png`
je tentýž list postav — bez toho by se postavy mezi starými a novými políčky rozešly.

## Přestavba sazby

`build-komiks.mjs` ve skillu umí nově `pages[]` a `poem`. Jednolistové manifesty se
sázejí přesně jako dřív (ověřeno diffem proti staré `komiks.html` v `komiks-live-055`) —
papírová karta, tmavší podložka a čísla stran se zapínají teprve klíčem `pages`.

Navíc přibyl `check-text.mjs`: porovná rámečky s básní a vypíše, co chybí a co je
navíc. Na tomhle komiksu hlásí `19 veršů · 18 rámečků · OK`.

## Pasti, které tady vylezly

- **Reading order musí sedět na pořadí veršů.** Na straně 3 stojí `wide` až pod
  `banner`em právě proto — vedle sebe by se verše četly přeházeně. Mřížka se
  přizpůsobuje básni, ne naopak.
- **`tall` v posledním řádku** potřebuje ruční `place` (`grid-column:2/3;grid-row:3/4`),
  jinak se pole snaží zabrat dva řádky a stránka se protáhne. Builder teď z `place`
  spočítá skutečný počet řádků a poměr stran dá jen poli přes jeden řádek.
- **Přečíslování převzatých políček dělej naráz** (`x-` prefix a zpátky), jinak si
  soubory při přejmenování přepíšou jména navzájem.
- **Číslo v názvu promptu určuje pořadí generování i název PNG** — když se dvě políčka
  trefí do stejného čísla, jedno přepíše druhé. Převzatá políčka přečísluj dřív, než
  napíšeš prompty.
- **Tři stejné čtverce v řádku vypadají jako dlaždice.** Původní sazba měla mřížku
  o třech sloupcích, takže každý řádek vycházel 4+4+4. Mřížka je nově
  dvanáctisloupcová a šířky se zadávají klíčem `span` ve dvanáctinách: strana 1 má
  řádek 4+3+5, strana 2 řádek 5+4+3, strana 3 řádky 4+8 a 7+5. `build-komiks.mjs`
  na pás tří stejných polí sám upozorní hláškou `POZOR`.
- **Roztřepený spodek řádku.** Čtverec vedle `wide`/`banner` je nižší než ten řádek
  a pod ním zůstane pruh papíru. Builder umí nově `"ratio": "auto"` — pole se natáhne
  na výšku řádku a ořízne se přes `object-fit: cover`. Použito na políčkách 02, 11,
  14 a 16.

## Přegenerovaná políčka

Z osmnácti muselo jít třikrát znovu, originály jsou v `archiv/`:

| políčko | co bylo špatně |
|---|---|
| `14-hand-on-the-blanket` | místo detailu ruky na dece přišlo náměstí s katedrálou, davem a nápisem „Fishmongers" |
| `15-ribbons-settle` | bílý pasparta, ručně psaný francouzský popisek „Joie, la petite âme…" a falešný podpis „aBorn"; navíc příliš světlá kresba |
| `16-the-smile` | z osmileté dcery vyšla dospělá žena, paleta vybledlá |

Opravené prompty mají zesílený závěr (jmenovitý zákaz paspart, popisků, podpisů a
„nevymýšlej si náměstí ani katedrálu") a u dítěte výslovné „a CHILD of about eight,
absolutely not a grown woman". Zákazy se přenesly do `SKILL.md`.

## Co zůstalo vědomě tak, jak to je

- **Políčko 12 ukazuje dceru už spící, políčko 13 ji ukazuje vzhůru.** Není to chyba
  sazby — takhle jde báseň (`and gives the stolen sleep` je dřív než `to his little
  sick daughter`). Políčko 13 se čte jako „kdo to je", ne jako další okamžik děje.
  Kdyby to vadilo, řeší se to přegenerováním políčka 12 tak, aby v něm dcera ještě
  nespala.
- **Světlé okraje jsou ořezané po stranách zvlášť** (2026-08-24). Gemini je nedává
  rovnoměrně: 01 mělo pruh ze všech čtyř stran (2–3 px), 10 jen zleva a zprava (6 px),
  11 jedinou bílou řádku dole (13 px), 02 tenký lem dokola. V komiksu to schoval
  `object-fit: cover`, ve videu se políčko sází *contain*, takže tam každý pruh svítí.
  Neoříznuté originály jsou v `archiv/*-neorezany.png`.
