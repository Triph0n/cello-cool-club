# Video — The Thief of Sleep z komiksových políček (karta 055)

Prototyp druhého režimu videa Cello Cool Clubu: místo jednoho plakátu, který se
skládá po prvcích, se na arch papíru **tisknou hotová políčka komiksu** v rytmu veršů.
Zdroj obrázků: `../komiks-live-055-pages`.

- `pilot-video.mp4` — **master**, 1920×1080, 30 fps, 86,8 s, CRF 16, bez čísel políček (49 MB)
- `pilot-video-nahled.mp4` — náhledová komprese CRF 26 (17 MB)
- `nahled-tma.mp4` — pracovní náhled 1280×720 s čísly políček (23 MB)
- `varianty-07.png`, `varianty-10.png` — srovnání čtyř designových poloh
- `index-policek.png` — přehled políček pro odvolávky
- kopie masteru na ploše: `The Thief of Sleep — komiks video.mp4`

Master se renderoval z ořezaných políček, v tmavé poloze, s `working_index: false`.
Zpět na pracovní náhled: `size: [1280, 720]` + `working_index: true` v manifestu.

## Proč to jde bez Gemini

Klasická linka `poster-video` musí hotový plakát nejdřív rozebrat zpětným mazáním
(Gemini in-place retuš + diff-lock), aby bylo co odkrývat. Tady je osmnáct hotových
obrázků, takže **celá ta drahá a křehká půlka odpadá** — žádné mazání, žádný diff-lock,
žádná kontrola na cizí obrázky. Zůstává jen forced alignment a stipple render.

## Pipeline

```bash
cd <tento adresář>
python align.py         # faster-whisper + DP zarovnání veršů na MP3 → timing.json
python build-states.py  # 19 stavů 1920×1080 (arch + políčko + verš) → states/ + timeline
python index-sheet.py   # přehled políček pro odvolávky → index-policek.png
python render.py        # stipple-dissolve mezi stavy + audio → pilot-video.mp4
```

Z téhle linky se 2026-08-24 stal skill **`komiks-video`**
(`~/.claude/skills/komiks-video/`) — `states.py` a `index-sheet.py` jsou tam,
`align.py` a `render.py` se sdílejí s `poster-video`. Tenhle adresář je jeho
referenční příklad; `python states.py` z něj musí vyrobit tytéž stavy (ověřeno
kontrolním součtem `S07.png`).

## Design

Snímek je záměrně holý. Nahoře **nic** — názvy aktů, podtitul ani „kolik to má stran
a políček" berou obrazu ticho a divák je nepotřebuje. Dole jediná řádka.

```
                  ┌───────────────────┐
               06 │     políčko       │   contain, vycentrované,
                  │  (celé viditelné) │   vlasová linka kolem
                  └───────────────────┘
                     verš, jen kurzíva      žádný rámeček
                    CELLO COOL CLUB · 055
```

**Podklad je tmavý** (`#171310`), ne slonovinový. Srovnání čtyř poloh je ve
`varianty-07.png` a `varianty-10.png`:

| poloha | jak to čte |
|---|---|
| slonovina | obraz je tmavý a hustý, na světlé ploše čte jako díra a oko odchází k okrajům |
| bílá | totéž, jen ostřeji — kontrast plochy přebije kresbu |
| **tmavá + linka** | **kresba svítí, ochrová stuha drží, změny poměru stran jsou tiché** |
| tmavá bez linky | rohy tmavých políček se rozplynou do pozadí |

Praktický důvod navrch: políčka mají poměry 1:1 až 21:8. Na světlé ploše je každá
změna tvaru hlasitá, na tmavé si jí divák nevšimne. Verš a patička jsou ve slonovině,
takže paleta zůstává klubová — jen otočená.

Themy jsou v `build-states.py` v `THEMES` (`tma` · `papir` · `bila`), přepínají se
klíčem `theme` v manifestu, `frame` kreslí vlasovou linku.

Políčka mají různé poměry (1:1, 3:2, 2:3, 16:9, 21:8) a sázejí se **contain**, ne
crop — na plakátu se nic neořezává. Volný papír po stranách nese sazbu; u panoramat
(10, 18) se plocha zaplní skoro celá, u vysokého políčka (06) zůstane arch široký.
To střídání je rytmus, ne chyba.

## Náhled napřed

Po každé změně sazby se **nerenderuje master**. `size: [1280, 720]` v manifestu dá
stejný obraz o 2,25× méně pixelech (geometrie i písma se škálují) — pět minut místo
třinácti. Master 1920×1080 s `working_index: false` se pouští teprve na schválenou
podobu.

## Pracovní číslování

Políčka jsou očíslovaná **v pořadí čtení, 01–18** — stejné číslo má soubor
(`07-weary-morning.jpg`), stav (`S07`) i ochrové číslo v levém horním rohu na archu.
Podle nich se ukazuje při opravách: „přepiš sedmičku" = `07`, ta žena u stolu.

Přehledový list `index-policek.png` (číslo · čas · akt · verš · soubor) vyrobí
`index-sheet.py`. Ve finální verzi se čísla z archu vypnou `"working_index": false`
v manifestu.

| | | | |
|---|---|---|---|
| 01 noční ulice | 02 nedotčené mince | 03 dveře ložnice | 04 odvíjení spánku |
| 05 noclehárna | 06 pytel na schodech | 07 unavené ráno | 08 zrcátko |
| 09 tramvaj | 10 fronta na tramvaj | 11 cesta domů | 12 rozvazuje pytel |
| 13 dcera vzhůru | 14 ruka na dece | 15 stuhy se snášejí | 16 úsměv |
| 17 zloděj hledí | 18 svítání v okně | | |

## Časování

`align.py` zarovnal **19/19 veršů**, délka 86,8 s. Devatenáct veršů, osmnáct políček:
verš 9 (`they do not know their rest has been stolen`) nese dvě políčka, druhé se
pouští v půlce mezery do dalšího verše (36,30 s). Verše 17 a 19 nemají vlastní
políčko — jsou to druhé řádky v deskách políček 17 a 18, přesně jako v komiksu.

Řádky se na verše párují **podle textu, ne podle počtu** — jinak se pár „jeden verš
ve dvou políčkách" rozjede a celý zbytek videa se posune (u 055 by poslední políčko
naskočilo o 3,2 s pozdě). Když dvě políčka padnou na týž verš, druhé se posune do
půlky mezery k dalšímu času.

Reveal začíná **na slově**, ne před ním: obrázek se dotiskne až během zpívaného verše.
Délka revealu `min(2,2 s, max(0,9 s, mezera × 0,45))`.

Na konci **fadeout 3,5 s** (`fade_out` v manifestu). Stmívá se do barvy podkladu, ne
do černé — na světlém themu by jinak na konci problikl tón.

## QC

| kontrola | výsledek |
|---|---|
| zarovnání veršů | 19/19 |
| stabilita statického úseku (55,0 s vs. 56,5 s) | `mean|diff| = 0,00043` (limit 0,01) |
| rozdíl uprostřed přechodu (32,6 s vs. 33,5 s) | `8,3` — přechod opravdu běží |
| délka / kodek | 86,83 s · h264 1920×1080 30 fps · aac |
| poslední snímek (fadeout doběhl) | průměrný jas 18,6 při podkladu ~20 |
| světlý okraj políčka | 0 z 18 (kontrola po ořezu) |

Snímky v `qc/`, kontaktní list `qc/kontakt.png`, detail přechodů `qc/prechody.png`.

## Vydřené poznatky

- **Zrno papíru musí být pro všechny stavy stejné** (jeden `default_rng(7)`), jinak
  mezi snímky šumí celá plocha archu, i když se nic nemění.
- **`ffmpeg -ss` PŘED `-i` seekuje na klíčový snímek** a při QC ukáže o vteřinu starší
  obraz — vypadá to, že přechod chybí. Při kontrole dávej `-ss` až za `-i`.
- **Stipple stopa přetéká za políčko.** Když se velké panorama přetiskuje malým
  čtvercem, zrno mizí i v okolním papíru — to je footprint předchozího stavu.
  Vypadá to jako tisk, nechává se.
- `render.py` drží všech 19 stavů v RAM (~470 MB) — na tomhle stroji projde,
  ale při delší písni s víc políčky se to musí streamovat po dvojicích.
- **Rámeček kolem verše na arch nepatří.** V komiksu je správně (vypravěčská deska
  mezi políčky), tady políčko stojí samo a druhý orámovaný obdélník pod ním ho
  opticky uzavírá. Verš je jen kurzíva na papíře.
- Píseň začíná zpívat hned v nule, na intro není místo. Titul proto žije jen ve
  stavu S00 (prvních 0,15 s) a dál ho zastupuje marginálie v horním okraji.

## Co by šlo dál

- **Předěl strany** — mezi akty na 2 s ukázat celou stranu komiksu, pak se zase
  vnořit. Vyžaduje čtyři stavy navíc (render celé strany do 16:9) a mezery v písni
  na to jsou (největší je 31,7 → 40,9 s).
- **9:16 varianta** pro shorts — políčko fullframe, verš do dolní marginálie.
- **Symbolové plakáty B/C** z koncepce `tiskarsky-arch` — tady se nepoužily vůbec.
