# Cello Cool Club — Brainstorm: Claire & sběratelský LP systém

> Živý brainstormový dokument, založeno 2026-07-11. Navazuje na TASK.md (blok D),
> PRD a ROADMAP. Sem se přidávají a rozvíjejí nápady; co dozraje, přejde do TASK.md.
> **Přehledný rozpad na jednotlivé nápady: [docs/napady/](napady/README.md)**
> (jeden nápad = jeden MD soubor + dashboard). Tento dokument zůstává zdrojem.

---

## 1. Jádro konceptu — jedna věta

**Cello Cool Club je klub, kde AI zpěvačka Claire vydává písně jako sběratelská
LP-čka: každé ráno jedno zahraje zdarma, členové si je přidávají do své sbírky
a sbírku poslouchají kdekoli — doma, v autě, na koncertě.**

Tři pilíře, které se navzájem posilují:

1. **Claire** — stálá tvář a hlas (identita, vztah, důvod se vracet)
2. **LP metafora** — karta = deska; zmáčkneš, točí se, hraje (radost z objektu)
3. **Sbírka** — touha kompletovat sady (důvod platit a zůstat)

---

## 2. Claire — persona

### Kdo je Claire
- Stálá zpěvačka klubu. Vždy stejný hlas, vždy stejná vizuální identita.
- **Přiznaně AI** — žádné předstírání. Naopak: „Claire žije uvnitř klubu.“
  Tajemství není v tom *jestli* je skutečná, ale *jaká* je. To je její kouzlo
  (srov. Gorillaz — kreslená kapela, nikdo se necítí podveden, všichni ji milují).
- Ilustrovaná, ne fotorealistická. Konzistentní výtvarný styl napříč kartami,
  videi i webem. Fotorealismus = uncanny valley + etické tření; ilustrace = šarm.

### Hlas
- Suno **Personas** — umožňuje držet konzistentní hlas napříč písněmi.
  Vybrat jednu nejlepší existující nahrávku (z ~240 MP3 v Downloads už možná
  kandidátka je) a z ní udělat kanonický hlas Claire. Všechny nové karty
  generovat přes tuto personu.
- Rozhodnutí: co se staršími kartami s jiným hlasem? Návrh: staré = „hosté
  klubu“, od sezóny II zpívá všechno Claire. Nebo postupně přenahrát.

### Charakter (návrh, k doladění)
- Prévertovská duše: melancholická, hravá, něžně ironická. Pije ranní kávu.
  Miluje cello, déšť za oknem a staré desky.
- Mluví krátce — na kartách a v popiscích 1–2 věty jejím hlasem
  („Dnes jsem vám zahrála o hodinách. Zítra o rukou, které je natahují.“).
- Jméno **Claire** funguje ve FR/CZ/EN (světlo, jasnost — hezky ladí s
  „ranní“ tématikou). Alternativy zvažované: žádné lepší; Claire drží.

### Claire v enginu
- `data/site.json`: sekce `persona` (jméno, bio, kanonický portrét, hlasová
  persona ID pro Suno workflow).
- Karty dostanou volitelné pole `claireNote` — jedna věta jejím hlasem,
  zobrazí se na stránce karty a v newsletteru.

---

## 3. LP metafora — karta jako deska

### Digitální LP (web)
- Stránka karty: uprostřed **vinylová deska**, na středovém labelu **unikátní
  mini-ilustrace** (výřez/derivát artworku karty). Zmáčkneš play → deska se
  roztočí, hraje píseň. Tonearm se položí na desku (CSS animace, žádný framework
  — sedí ke konvencím enginu).
- Už dnes máme play button na `p/<id>/` — tohle je jeho evoluce. Stejná
  komponenta na stránce karty i na QR přehrávací stránce.
- Detail, který prodává: deska se dotáčí po pauze, label se čte i v klidu.

### „Moje sada LP" — police
- Pohled `/collection/` (nebo `/shelf/`): mřížka desek, které si člověk přidal.
  Vypadá jako police s vinyly — hřbety/labely, sezóny jako řady police.
- **Fáze 1 (bez účtů!):** sbírka v `localStorage` — tlačítko „Přidat do sbírky“
  na každé kartě, zdarma. Nula backendů, okamžitě to funguje, lidi si zvyknou
  na gesto sbírání. (Deterministicky nad veřejným `data/cards.json`, stejný
  princip jako plánované `/draw/` C4.)
- **Fáze 2 (členství):** sbírka vázaná na e-mail/token, synchronizace,
  a hlavně → poslech sbírky mimo web (viz §6 auto).

### Fyzické LP-karty
- Stávající karty (D4: 70×120 mm MakePlayingCards) dostanou **rub jako vinyl**:
  kruhová deska s unikátním středovým labelem, QR uprostřed labelu nebo pod ním.
  Naskenuješ → deska na telefonu se roztočí a hraje. Fyzický objekt a digitální
  přehrávač jsou jedna věc.
- Sada sezóny = **box jako krabice na desky** (mini "record crate"). Silný
  crowdfunding vizuál.

---

## 4. Rituál — „Ranní káva s Claire"

Denní/třídenní rituál je páteř retence. Kadence 3 dny už běží; rituál ji obalí.

- **Formát:** každé ráno v 7:30 je „v éteru“ jedna píseň. V den vydání nová
  karta, mezidny reprízy z archivu („Claire dnes vytáhla z police…“) —
  deterministicky podle data, stejná logika jako `/draw/`.
- **Kde:** homepage hero („Dnešní ranní káva“), newsletter (D1), YouTube
  (viz §5), případně WhatsApp/Telegram kanál (nízké tření, vysoká otevíranost).
- **Trik zdarma vs. členství:** ranní píseň si **poslechne každý zdarma** —
  ale jen dnes. Zítra hraje jiná. **Přidat si ji do sbírky natrvalo** může jen
  člen. → FOMO funguje pro nás, ne proti nám: nic ti nebereme, jen ti
  připomínáme, že hudba teče a sbírka zůstává.
- Nedělní speciál: „Nedělní káva“ — delší formát, Claire uvádí 3 písně
  (mini-pořad, budoucí radio show).

---

## 5. YouTube strategie

Tři formáty, tři funkce ve funnelu:

### a) Rádio (discovery, běží pořád)
- **24/7 stream „Cello Cool Club Radio“** ve stylu lofi-girl: smyčka ilustrace
  (Claire u okna s kávou, točící se deska v rohu, název aktuální písně).
  Playlist = posted karty. ffmpeg pipeline už existuje (B2 teasery) —
  rozšíření na dlouhou smyčku je stejná technologie.
- Realistická varianta pro start: ne live-stream, ale **dlouhá videa
  „1 hodina s Claire“** (kompilace 12–20 písní, kapitoly v popisku).
  Live 24/7 až když je >30 posted karet, jinak se smyčka oposlouchá.

### b) Album jako Laufey (událost, prestiž)
- Po dokončení sezóny (12 karet): **celé album jako jedno video** — tracklist
  s kapitolami, obal = mozaika karet (přesně jak plánuje D3 pro Bandcamp).
  Vizuál: deska se točí, mezi skladbami se vymění label. Premiéra (YouTube
  Premiere) = koncertní moment online, chat běží, Claire „odpovídá“ v komentech.
- Souběžně na Bandcamp (prodej) a do členského feedu.

### c) Shorts (akvizice)
- Teasery z B2 pipeline (9:16, 20 s) — už hotové, jen publikovat pravidelně.
  Každá ranní káva = jeden short s odkazem „celá píseň v klubu“.

### YouTube vs. paywall
- YouTube = výloha. Vždy zdarma: rádio, ranní short, sezónní album (s odstupem).
- Klub = vlastnictví: sbírka, poslech v autě, karty, bonusy.
- Nikdy neschovávat za paywall *poslech jako takový* — schovává se **pohodlí
  a vlastnictví** (moje sbírka, moje police, můj feed v autě, moje karty).

---

## 6. Poslech v autě — zabijácká funkce členství

Nejjednodušší robustní řešení: **soukromý podcastový feed**.

- Engine už generuje `feed.xml` (RSS). Členská verze: RSS s enclosures =
  **podcast feed s tokenem v URL** (`/feed/<token>.xml`), který si člen přidá
  do libovolné podcast aplikace → CarPlay, Android Auto, offline, rychlost
  přehrávání — všechno zadarmo vyřešené ekosystémem podcastů.
- Úrovně: (a) feed „celý archiv“, (b) později feed „jen moje sbírka“
  (generovaný per-member — to už chce malý Worker/KV, fáze 2+).
- Alternativy zváženy: vlastní PWA přehrávač (hezké, ale drahé na údržbu),
  Spotify/Apple Music (distribuce přes DistroKid — dobré pro dosah, ale
  nebuduje klub; udělat *později* jako výlohu, ne jako produkt).

---

## 7. Sběratelský systém — sady, vzácnost, kompletace

Využít psychologii kompletování, ale féricky (žádné loot boxy pro děti).

- **Sezóna = sada 12 desek.** Police vizuálně ukazuje díry („chybí ti 3 do
  kompletní sezóny I“). Kompletní sezóna → odměna: bonusová píseň
  („B-strana“), tisknutelný plakát mozaiky, sleva na fyzický box.
- **Koncertní edice:** karty rozdávané/prodávané jen na koncertech, s QR
  claim kódem — jediná cesta, jak je získat do digitální sbírky. Fyzická
  událost obohacuje digitální sbírku → lidi nosí na koncerty telefony s policí.
- **Karta večera** (D5 `/live/`): publikum na koncertě hlasuje/vybírá kartu,
  kterou „Claire pouští“ — QR v programu. Interakce naživo.
- **Číslované první výtisky:** prvních N fyzických karet každého vydání
  číslovaných (ručně razítko/číslo). Nula nákladů, sběratelská hodnota.
- Zásada: **žádná umělá vzácnost digitálu** (žádné NFT vibes). Digitál je
  hojný, fyzično a zážitky jsou vzácné. Vzácnost = koncert, tisk, číslo.

---

## 8. Monetizace — žebřík

| Úroveň | Co dostane | Cena (návrh) |
|---|---|---|
| **Posluchač** (zdarma) | ranní káva, rádio, aktuální karta, lokální sbírka (fáze 1) | 0 |
| **Člen klubu** | trvalá sbírka, celý archiv, podcast feed do auta, B-strany, jmenovka v klubu | ~5 €/měs nebo 50 €/rok |
| **Sběratel** | členství + fyzický box sezóny, číslované karty, hlasování o repertoáru | ~15 €/měs nebo per-box |
| Jednorázově | Bandcamp album sezóny, fyzické boxy, koncertní karty | 10–35 € |

- Platební infrastruktura: začít co nejjednodušeji — **Memberful nebo Ghost**
  (obojí umí členské RSS feedy a magic-link přístup, žádné vlastní účty),
  případně Patreon (známější, ale horší integrace s feedem). Rozhodne Vladimír.
- Crowdfunding boxu sezóny I (už v plánu) = zároveň test cenové hladiny
  a první nábor Sběratelů.

---

## 9. Smyčka celého systému (proč to drží pohromadě)

```
YouTube rádio/Shorts  →  objevení Claire
        ↓
Ranní káva (zdarma, ale jen dnes)  →  návyk + FOMO
        ↓
„Přidat do sbírky" (fáze 1 zdarma → fáze 2 členství)
        ↓
Police roste → touha kompletovat sezónu → členství/box
        ↓
Podcast feed v autě → hudba v každodennosti → retence
        ↓
Koncert: karta večera + koncertní edice → zpět do sbírky
        ↓
Sezóna hotová → album (YouTube premiéra + Bandcamp + box)  →  zpět nahoru
```

Každý prvek krmí další; nic není slepá ulička. Claire je lepidlo všeho.

---

## 10. Co postavit v jakém pořadí (návrh MVP cesty)

**Vlna 1 — bez peněz, bez účtů (týdny):**
1. Vinylový přehrávač na stránce karty + `p/<id>/` (točící se deska, label
   s mini-ilustrací). Čistě šablony v `renderers.mjs` + CSS.
2. „Přidat do sbírky“ + `/collection/` police přes localStorage.
3. Rituál „Ranní káva s Claire“ na homepage (deterministická píseň dne,
   logika jako C4 `/draw/`) + branding.
4. Claire: vybrat kanonický hlas (Suno persona) a portrét; `claireNote` na kartách.
5. YouTube kanál: pravidelné Shorts (B2 pipeline už existuje) + první
   „1 hodina s Claire“ kompilace.

**Vlna 2 — sezóna I hotová (12 posted):**
6. Album video (YouTube Premiere) + Bandcamp (D3) + crowdfunding boxu (D4).
7. Newsletter (C2/D1) s ranní kávou.

**Vlna 3 — členství:**
8. Memberful/Ghost + členský podcast feed (rozšíření `feed.xml` o enclosures
   a token).
9. Trvalé sbírky (claim kódy z fyzických karet, koncertní edice, D5 `/live/`).

**Vlna 4 — škála:**
10. 24/7 rádio stream, per-member feed „jen moje sbírka“, Spotify výloha.

---

## 11. Grafický styl — jaký vizuál se hodí k té hudbě

Hudba = chanson, cello, Prévert: melancholie s hravostí, Paříž, káva, déšť.
Styl musí unést tři role najednou: **obal desky** (LP metafora), **sběratelská
karta** (tisk) a **svět Claire** (postava, scény). Prozkoumané směry:

| Směr | Proč ano | Proč ne |
|---|---|---|
| **Mid-century francouzská ilustrace** (André François — mimochodem skutečný Prévertův ilustrátor!, Sempé, Savignac) | přesně ta duše: lehká linka, vtip, melancholie; historicky autentické spojení s Prévertem | samo o sobě moc „knižní“, chce to tiskovou strukturu |
| **Vintage jazz LP obaly** (Blue Note / Reid Miles, David Stone Martin — inkoustová linka Verve) | přímo jazyk desek: odvážná typografie, duotóny, výřezy; sedí k LP metafoře | bez změkčení může působit chladně „newyorsky“, ne pařížsky |
| **Risograph estetika** (2–3 přímé barvy, zrno, lehká soutisková nepřesnost) | dnešní jazyk sběratelských tisků; levná konzistence; každá sezóna = vlastní paleta | je to technika, ne duše — potřebuje obsah z prvních dvou řádků |
| Art Nouveau / Art Deco | elegance | moc ornament / moc glamour, ne Prévert |
| Swiss / čistý minimal | disciplína mřížky | sterilní, bez šarmu |

### Doporučení: „Atelier Claire" — syntéza tří vrstev
1. **Kresba:** francouzská mid-century linka (François/Sempé) — tuš, živá ruka,
   figury a pařížské scény. Claire z tohohle světa přirozeně vyroste.
2. **Barva a tisk:** risograph logika — **každá sezóna má vlastní paletu
   2–3 přímých barev** + papírová bílá. Na polici pak řada sezóny vypadá jako
   sada (stejné barvy), karty uvnitř se liší motivem. Kompletace sad dostane
   vizuální oporu: „modrá sezóna“, „terakotová sezóna“…
3. **Typografie a label:** disciplína jazzových LP — výrazný titul, číslo karty
   jako katalogové číslo desky (CCC-001), kruhový label se sazbou do oblouku.

Efekt: karty vypadají jako nalezené francouzské desky z 60. let, které nikdy
neexistovaly. Zrno a nedokonalost soutisku navíc krásně maskuje AI původ
artworků — všechno projde stejným „tiskovým“ filtrem a sjednotí se.

Praktický krok: definovat v enginu **stylový pipeline** — image prompty karet
dostanou jednotný styl-suffix + postprocess (zrno, omezená paleta per sezóna,
soutiskový posun přes sharp). Jeden skript, všechny karty konzistentní.

---

## 12. Rafinovaný QR — kód jako součást artworku

Zásada: QR nesmí vypadat jako fakturační kód na kartě. Buď je **schovaný
v ilustraci**, nebo je **přiznaný jako krásný objekt** (label desky). Nikdy
nalepený v rohu.

Odstupňované triky (od levných po magické):

1. **QR v labelu desky** (základ, deck sezóny): kruhový střed karty = label,
   QR sedí v něm jako „ryté drážky“. Error correction úroveň H snese ~30 %
   zásahů → do středu QR lze vložit mini-ilustraci labelu, moduly obarvit
   barvami sezóny, rohové terče stylizovat (kolečka místo čtverců). Pořád
   spolehlivě skenuje. Knihovna `qrcode` už v enginu je; custom rendering
   modulů = jeden skript nad její maticí.
2. **QR ukrytý ve scéně**: kód je *v obraze* — plakát na zdi pařížské ulice,
   okno domu, dlaždice kavárny, etiketa na láhvi. Ilustrace se kreslí kolem
   něj. Hráč ho musí najít → hledání je součást hry s kartou („najdi, kde
   dnes hraje Claire“).
3. **Halftone QR**: moduly nahrazeny rastrem, kterým prosvítá kresba —
   kód a obrázek jsou jedna plocha. Technicky náročnější, ale existují
   ověřené postupy; kandidát na speciální karty.
4. **Termochromický inkoust** (sběratelská edice): QR je neviditelný, objeví
   se **zahřátím** — přiložíš kartu k hrnku ranní kávy. ☕ Dokonalé spojení
   s rituálem „Ranní káva s Claire“ — marketing se píše sám. (Ověřit
   spolehlivost tisku a životnost inkoustu; existují tiskárny na zakázku.)
5. **NFC tag** (nejrafinovanější, žádný viditelný kód): NTAG štítek v kartě
   (~0,10–0,30 €/ks), přiložíš telefon → hraje. Karta je čistá ilustrace bez
   jakéhokoli kódu. Pro kolektorskou/koncertní edici. Fallback: malý QR na
   rubu vždy (ne každý má NFC zapnuté).

Mapování na žebřík (§8): tištěný deck = trik 1–2 · sběratelský box = 3–4 ·
koncertní/limitka = 5 (+3D, viz §13). Rafinovanost QR = viditelný rozdíl
mezi úrovněmi, který zákazník okamžitě pochopí.

---

## 13. 3D tištěné karty — hmatatelná limitka

3D tisk se nehodí na masový deck (minuty tisku/ks), ale je **dokonalý pro
vrstvu vzácnosti** (§7: digitál hojný, fyzično vzácné):

- **Plastický QR**: dvoubarevný tisk (AMS) — moduly vystouplé v kontrastní
  barvě. Jednobarevný reliéf skenuje špatně (závisí na světle) → vždy dvě
  barvy, reliéf jen jako hmatový bonus. QR je tu přiznaný ornament: vystouplá
  „razítková“ plocha, kterou chceš hladit palcem.
- **Lithophane karta** — favorit: podržíš kartu proti světlu a **objeví se
  Claire** (lithophane reliéf funguje jen prosvícený). Poeticky přesné:
  „Claire žije ve světle.“ Na rubu dvoubarevný QR. Koncertní artefakt —
  publikum si posvítí telefonem, celý sál zvedne karty proti pódiu. 🔦
- **Print-in-place mini deska**: kartička s vestavěnou deskou, která se
  skutečně **roztočí prstem** (tištěné ložisko). Fidget + fetish objekt;
  na labelu QR. Stretch goal crowdfundingu.
- Ekonomika: limitka 50–100 ks/sezóna, číslované (razí se do tisku přímo),
  cena 15–25 €/ks se obhájí. Tisk vlastní/lokální službou; STL generovat
  skriptem z artworku (heightmapa přes sharp → OpenSCAD/přímý STL export —
  reálné rozšíření enginu).

Vrstvy fyzična tedy: **papír s riso tiskem** (deck) → **letterpress/termo
inkoust** (box) → **3D lithophane/NFC** (limitka, koncerty). Tři cenové
hladiny, tři úrovně magie, jeden vizuální styl.

---

## 14. Vizuální novela — text písně, který běží

Když se deska točí, karta může **vyprávět**. Režim „novela“ na stránce karty:

- **Synchronizované verše**: během přehrávání naskakují řádky básně v rytmu
  písně (kinetická typografie v paletě sezóny). Claire scéna v pozadí
  (její pokoj, kavárna, ulice) s jemným pohybem — parallax/Ken Burns nad
  artworkem, žádné video, jen CSS/JS nad existujícími assety.
- **Jazyky**: přepínač FR/CZ/EN přepíná běžící text — přímá synergie
  s plánovanými jazykovými variantami karet (C6). Učíš se francouzsky
  s Claire = vedlejší produkt zdarma (a důvod pro Suzuki rodiče!).
- **Technika časování**: standardní **LRC formát** (`[mm:ss.xx] řádek`).
  Suno časování nedává → mini nástroj v admin panelu: pustíš píseň a ťukáš
  Enter na každém řádku → engine uloží `.lrc` ke kartě. Otagovat jednu
  píseň = 3 minuty práce. Pole `lyricsTimed` na kartě, exportér vydá LRC
  jako veřejný asset.
- **Řetězová hodnota časování** — jeden LRC soubor pohání:
  1. novelu na stránce karty (delší návštěvy, sdílení),
  2. **titulkované teasery/Shorts** (B2 pipeline + drawtext = slova ve videu,
     výrazně vyšší engagement — lidé koukají shorts bez zvuku),
  3. karaoke mód pro kids deck (Suzuki děti zpívají s Claire),
  4. budoucí „lyrics video“ formát pro YouTube album.
- Novela = také **odpověď na „co dostane člen navíc“**: plná novela všech
  karet členská, u volné ranní kávy jen první sloka. (Alternativa: novela
  celá zdarma, členská jsou jen sbírka+feed — rozhodnout podle toho, co má
  větší sdílecí potenciál.)

---

## 15. Hitparáda — žebříček jako pořad, ne tabulka

Žebříček není statistika, je to **rituál a divadlo** — jako nedělní rozhlasová
hitparáda (Houpačka!). Claire je moderátorka; čísla jsou jen záminka k vyprávění.

### Formát
- **„Nedělní hitparáda s Claire“** — týdenní žebříček Top 10, vyhlašuje se
  v neděli (spojí se s „Nedělní kávou“ §4 do jednoho pořadu). Claire komentuje
  pohyby jejím hlasem: „Hodiny spadly o tři místa. Čas je zrádný, říkala jsem to.“
- **Billboardová dramaturgie**: šipky ↑↓, „nováček týdne“, „počet týdnů
  v žebříčku“, „návrat“ — vše, co dělá žebříček čitelným příběhem. Katalogová
  čísla CCC-xxx v tabulce vypadají jako z hudebního časopisu 60. let.
- **Zlatá deska** 🏆: píseň, která vyhraje N týdnů / vyhraje sezónu, dostane
  na webu zlatý label (varianta vinylu) a ve fyzičnu zlatou limitku (foil tisk
  nebo zlatý filament §13). Metafora zlaté desky sedí do LP světa dokonale —
  vzácnost si píseň *vyslouží*, nekupuje se (v souladu se zásadou §7).
- **Výroční hitparáda sezóny** → určuje pořadí tracklistu na albu (§5b),
  která karta dostane 3D limitku, co se hraje na koncertě. Žebříček tak má
  skutečné důsledky — hlasování není do prázdna.

### Odkud se berou body
- **Fáze 1 — bez backendu: redakční žebříček.** Claire „sestavuje“ pořadí sama
  (Vladimír kurátorsky, pole `chart` v cards.json nebo samostatný
  `data/charts.json`, exportér vydá `/hitparada/`). Zero infrastruktura,
  plná dramaturgie. Přiznaně subjektivní — „Claire má své nálady“.
- **Fáze 2 — první malý backend klubu: Cloudflare Worker + KV.** Jeden endpoint
  počítá přehrání (ping z vinyl přehrávače) a hlasy. Site už je na CF Pages,
  Worker je přirozený soused. Rolling okno 14 dní, aby nové karty měly šanci
  proti archivu.
- **Hlasování = členská výhoda** (žebřík §8 už zmiňuje hlasování o repertoáru):
  člen má 1 hlas týdně — vzácný hlas má váhu a je to důvod se v neděli vrátit.
  Věnování (§16) se počítá jako bod navíc → „nejvěnovanější píseň týdne“.
- Kids deck: vlastní oddělená „Suzuki hitparáda“, hlasuje se nálepkami na
  lekcích, ne online — fyzická nástěnka u učitele, foto na webu. (Mimo
  klubovou kadenci, jako vždy.)

---

## 16. Písničky na přání a věnování

Druhá velká rozhlasová tradice: **písničky na přání**. Tři úrovně, od zdarma
po prémiový produkt:

### a) Věnování (zdarma, bez backendu — fáze 1)
- Na kartě tlačítko **„Věnovat tuhle desku“** → formulář (komu, od koho,
  vzkaz) → vygeneruje URL typu `p/007/?pro=Jana&od=Petr&v=k+narozeninam`.
  Přehrávací stránka si parametry přečte a vykreslí **obal s věnováním**:
  deska v papírovém sleeve, na něm rukopisným písmem „Pro Janu ♥ od Petra“,
  pod tím vzkaz. Zmáčkne play → deska se roztočí.
- **Nula backendů** — věnování žije v URL. Kdokoli může poslat komukoli,
  okamžitě to funguje. (Limit: OG náhled zůstává obecný pro kartu;
  personalizovaný OG obrázek = Worker, fáze 2.)
- Psychologie: neposíláš *odkaz*, posíláš *desku se vzkazem*. Příjemce dostane
  dárek, ne marketing. A zároveň je to nejpřirozenější akviziční kanál —
  věnování končí větou „…a zítra ráno hraje Claire další.“

### b) Přání do éteru (členské)
- Člen pošle věnování **do Nedělní kávy** — Claire ho přečte v pořadu
  („Pro Janu k narozeninám od Petra hraju Hodiny.“) — v newsletteru,
  na YouTube community postu, jednou třeba hlasem. Přesná kopie rozhlasové
  tradice, kterou české publikum zná a miluje.
- Kuráto­ruje Vladimír (fronta v admin panelu), Claire formuluje. Vzácné →
  cenné → členské.

### c) Karta na míru (prémiový produkt, dárkový trh)
- **„Claire napíše píseň pro vašeho člověka“**: objednávka → báseň na míru
  (jméno, příběh, jazyk FR/CZ/EN) → Suno persona → privátní karta
  s vlastním artworkem a QR, vytištěná a poslaná (§17). Nevstupuje do
  veřejného archivu (deck `custom`, mimo export).
- Svatby, narozeniny, výročí, narození dítěte. Cena 100–200 € se na dárkovém
  trhu obhájí snadno — konkurence (personalizované písně) existuje a prodává,
  ale nikdo nemá kartu-desku jako artefakt.
- Stretch: objednatel může kartu později „odemknout do klubu“ — věnovaná
  píseň se stane veřejnou kartou s kreditem („na přání Petra pro Janu“).
  Z dárku se stane kus katalogu; rodina má „svoji“ desku v hitparádě.

---

## 17. Poslat desku — formy doručení

Zásada: **neposílá se odkaz, posílá se objekt.** Každý kanál má dostat formu,
která v něm vypadá jako dárek.

| Kanál | Forma | Náklad |
|---|---|---|
| **WhatsApp/Telegram** | share intent s věnovací URL (§16a) + hezký OG; ještě lépe: **20s teaser MP4** (B2 pipeline!) — video se v chatu přehraje inline, deska se točí, na konci QR/odkaz | zero, pipeline existuje |
| **E-mail** | věnovací URL v hezké šabloně (návaznost na newsletter D1) | zero |
| **Pohlednice od Claire** | fyzická karta poštou: mini **sleeve na singl** (obálka jako obal 45s desky, karta se vysouvá), věnování „rukopisem Claire“, poštovní známka, voskové razítko CCC | tisk+poštovné, prodejní produkt ~8–12 € |
| **Dárková limitka** | lithophane karta (§13) se jménem vyraženým do rámečku — věnování zapečené přímo v objektu | ~25–35 € |

- **Teaser s věnováním**: drawtext overlay „Pro Janu“ do B2 teaseru je jeden
  ffmpeg filtr navíc — ale generování per-věnování chce server. Fáze 1: ruční
  služba pro členy (Vladimír vygeneruje na požádání, stejně jako přání do
  éteru §16b). Fáze 2: Worker fronta.
- **Obálka = sleeve**: i běžný tištěný deck (D4) může mít k dokoupení papírové
  sleeve obálky — najednou je každá karta poslatelná poštou jako singl.
  Levný doplněk, velký efekt; crowdfunding add-on.
- **Telegram/WhatsApp kanál klubu** (§4) dostane v neděli hitparádu (§15)
  a jednou týdně výzvu „komu dnes pošleš desku?“ — sdílení jako rituál,
  ne jako prosba o marketing.

### Smyčka navíc (rozšíření §9)
```
Věnování (zdarma, URL)  →  příjemce slyší Claire poprvé
        ↓
zítra ranní káva → návyk → sbírka → člen
        ↓
člen věnuje do éteru / kupuje pohlednici od Claire / kartu na míru
        ↓
věnování = body do hitparády → Nedělní pořad → další sdílení
```
Věnování je akvizice maskovaná jako něha. Nikdo neposílá reklamu — posílá dárek.

---

## 18. Skutečné cello + Claire — možná HLAVNÍ pozice projektu

Vladimír je profesionální cellista (kvarteto, Suzuki škola). To není detail —
to je **odpověď na jedinou nebezpečnou otázku celého projektu**: „proč platit
za AI hudbu?“

- **Pozice:** *„Klub, kde skutečný cellista hraje s AI zpěvačkou.“* Nikdo jiný
  tohle nedělá. AI generuje píseň, ale živé cello ji **posvěcuje**. Claire je
  přiznaná fikce, cello je přiznaná realita — a to napětí je celý příběh klubu.
- **„Live verze“ jako B-strany:** k vybraným kartám Vladimír nahraje skutečné
  cello přes/místo Suno stopy. Live verze = členská B-strana — §8 tím konečně
  dostává konkrétní obsah. Ekonomika: jedna nahrávka za sezónu stačí,
  vzácnost je záměr, ne kompromis.
- **Koncertní most:** na skutečném koncertě zazní „píseň Claire“ na cello —
  publikum ji zná z ranní kávy, teď ji slyší živě, na stole leží karty s QR.
  Digitál → fyzický zážitek → zpět do digitálu; uzavírá smyčku §9 silněji
  než samotné kartičky. Vítěz výroční hitparády (§15) = co se hraje živě.
- **Důvěryhodnost pro rodiče Suzuki školy:** „AI projekt učitele cella“ zní
  úplně jinak než „AI hudba z internetu“. Kids deck tím dostává záštitu.
- Vedlejší formát: **„Claire & host“** — občas skutečný hostující nástroj
  (housle…?), série duetových speciálních karet.

---

## 19. Kalendář klubu — edice, které se prodávají samy

Rytmus 3 dnů je páteř; kalendářní špičky jsou svaly:

- **Adventní kalendář Claire** ⭐: box s 24 kartami, každý den jedna
  (1.–24. 12.), QR odemyká píseň **až v ten den** (release-podle-data logika
  v enginu de facto existuje). Fyzický adventní kalendář s hudbou = ověřená
  vánoční kategorie; dárek, který se kupuje bez přemýšlení. Prodej od října,
  výroba = existující print pipeline + sleeve obálky (§17). Kandidát na
  **nejsilnější fyzický produkt roku** — možná silnější než sezónní box.
- **Svátky:** Valentýn („Claire zpívá o lásce“ — věnování §16 se ten týden
  ponesou samy), první jarní den, výročí klubu = „den otevřených dveří“
  (celý archiv na 24 h zdarma — FOMO naruby, jednou za rok).
- **Deska poštou (předplatné):** měsíční tier navazující na Pohlednici od
  Claire (§17) — jednou měsíčně obálka-sleeve: karta, voskové razítko,
  krátký tištěný dopis od Claire. Pomalá pošta je přesně prévertovská
  estetika; ~8 €/měs, malý objem, vysoká marže, vrchol fanouškovského žebříku.

---

## 20. Ambientní formáty — růstový motor na YouTube

Kategorie „rain + cello / study with me / café ambience“ má obrovské stálé
publikum a přesně naši náladu:

- **„Déšť v kavárně s Claire“**: 1–3h smyčky — instrumentální/ztišené verze
  písní + déšť a zvuk kavárny, statická ilustrovaná scéna (Claire u okna,
  točící se deska v rohu). Výroba: ffmpeg pipeline (B2) + ambientní podklad,
  minimální práce navíc, hudba se recykluje z archivu.
- Varianty scén: „Nedělní ráno“, „Pozdní noc v klubu“, „Studovna“ — jedna
  ilustrace na scénu, playlisty se obměňují.
- Business logika: shorts vidí divák 20 sekund, ambient mu **běží hodiny
  na pozadí** → watch-time zvedá celý kanál a ranní káva dostane publikum.
  Odkaz v popisku: „každá píseň v tomhle mixu je karta — začni sbírat.“
- Ambient verze písní (bez zpěvu / ztišené) = zároveň další druh B-stran (§8).

---

## 21. Komunita — členská čísla a repertoárová rada

- **Členské číslo:** každý člen dostane trvalé číslo („člen č. 042“) —
  na jmenovce v klubu i na věnováních (§16b: „…přeje člen č. 042“). Prvních
  100 = **zakládající členové**, navždy zvláštní označení. Stojí nula,
  buduje hrdost, urgency i důvod vstoupit dřív než později.
- **Repertoárová rada:** v backlogu čeká **240 draftů**. Členové jednou za
  cyklus hlasují, která báseň se stane příští kartou — výběr ze 3 kandidátů
  (kurátoruje Vladimír), ne z 240. Řeší dvě věci najednou: engagement
  („moje karta vyhrála, jsem u jejího zrodu“) a rozhodovací paralýzu nad
  backlogem. Doplňuje hitparádu (§15): hitparáda soudí minulost, rada volí
  budoucnost. Sběratelský tier = hlas s dvojnásobnou vahou (konkrétní
  benefit §8). Technicky: stejný Worker+KV jako hitparáda fáze 2; do té doby
  hlasování v newsletteru (reply/odkaz) — zero infrastruktura.
- **Darovat členství:** dárkový poukaz s fyzickou kartou „Vítej v klubu“
  (sleeve obálka §17) — řeší „co koupit kamarádce“ a přivádí členy, kteří
  by sami nepřišli.

---

## 22. Otevřené otázky (na příští brainstorming)

- Claire vizuál: jaký ilustrační styl? (Souvisí s existujícím stylem artworků
  karet — Claire by z nich měla vypadat, že tam patří.)
- Přenahrát staré karty hlasem Claire, nebo „hosté klubu“?
- Jazyk klubu: karty jsou FR/CZ/EN — mluví Claire všemi třemi? (Návrh: ano,
  je to její šarm; ranní káva v jazyce karty.)
- Cena členství a co přesně je „B-strana“ (instrumentálka? demo? mluvené slovo?).
- Kids deck a Claire: má Suzuki balíček vlastní postavu, nebo Claire dětem
  „vypráví“? (Pozor na oddělení — kids karty jsou mimo klubovou kadenci.)
- Právní: Suno licence pro komerční užití — ověřit aktuální podmínky plánu
  před spuštěním placeného členství.
- Stylový pipeline (§11): otestovat na 3 existujících kartách — jednotný
  styl-suffix promptu + riso postprocess, vedle sebe porovnat se současnými.
- Termochromický tisk (§12): najít tiskárnu/cenu, ověřit životnost inkoustu.
- Lithophane (§13): vytisknout prototyp z artworku karty 001 — čitelnost
  Claire proti světlu, čitelnost dvoubarevného QR.
- Novela (§14): zdarma celá, nebo jen první sloka? (sdílení vs. konverze)
- Hitparáda (§15): startovat redakčně (fáze 1), nebo rovnou s Worker+KV
  počítadlem? A jak vážit přehrání vs. hlasy vs. věnování?
- Věnování (§16a): ošetřit zneužití textu ve vzkazu (URL parametr = volný
  text) — délkový limit + escapování stačí? Moderace až při „přání do éteru“.
- Karta na míru (§16c): cena, dodací lhůta, kolik kusů měsíčně je udržitelné
  (báseň je ruční práce). Pilot: 3 kusy pro známé.
- Pohlednice od Claire (§17): najít tisk sleeve obálek (obal na 45s singl),
  spočítat poštovné CH/CZ/EU.
- Live verze (§18): nahrát pilotní cello verzi jedné karty — technika
  (nahrávání přes Suno stopu? vlastní aranžmá?), kolik času to reálně stojí.
- Adventní kalendář (§19): stihne se do letošních Vánoc? Potřeba: 24 karet
  s hudbou do ~září (backlog draftů je, hudba je úzké hrdlo), návrh boxu,
  time-lock QR stránek (datová logika v exportéru).
- Ambient (§20): odkud ambientní podklad (déšť/kavárna) s čistou licencí;
  instrumentálky — umí Suno persona vydat verzi bez zpěvu?
- Repertoárová rada (§21): jak často (každý cyklus = moc?; 1× měsíčně?)
  a jak prezentovat kandidáty (jen název + první verš, ať se nespoiluje?).

---

## 23. Tři koncepty — jak to celé pojmout (2026-07-12)

Všechno z §1–21 zrealizovat nejde — hrozí rozdrobení. Vznikly **tři soudržné
koncepty** (plné znění: `docs/napady/KONCEPTY.md`), společný základ všech =
Claire + vinylový přehrávač + styl Atelier Claire + pozice „skutečný cellista
hraje s AI zpěvačkou“ (§18):

- **A — Ranní rádio 📻:** Claire jako pořad; produkt = rituál + členský feed;
  růstový motor = ambientní formáty (§20); škrtá se sbírka a fyzično.
  Nejlevnější start, nejpomalejší peníze, největší závislost na kadenci.
- **B — Atelier 🖨️ (doporučení):** miniaturní vydavatelství krásných objektů;
  produkt = fyzické edice (deck, box, pohlednice, karta na míru, limitky,
  **adventní kalendář §19 jako produkt roku**); web = katalog, koncert =
  prodejna (živé cello §18 naplno); škrtá se členství a gamifikace. Peníze
  od prvního kusu, bez backendu; navazuje na koncerty, print pipeline
  a plánovaný crowdfunding.
- **C — Klub sběratelů 🃏:** hra o kompletaci; produkt = digitální sbírka +
  členství (čísla členů a repertoárová rada §21 jsou jádro); škrtá se
  fyzično kromě odměn. Potřebuje největší publikum a nejvíc software.

Přirozená sekvence: **B teď → C po sezóně I → A jako korunovace.**
Rozhodnout: který koncept → co škrtáme z bloků E/F na nejbližší měsíce.

---

*Změny v tomto dokumentu: 2026-07-11 založeno (brainstorm Claire, LP systém,
YouTube rádio, ranní káva, sbírky, monetizační žebřík, MVP vlny). 2026-07-11
odpoledne: grafický styl „Atelier Claire" (§11), rafinované QR (§12),
3D tištěné karty (§13), vizuální novela s textem písně (§14). 2026-07-11
večer: hitparáda jako pořad (§15), písničky na přání a věnování (§16),
poslat desku — formy doručení (§17). 2026-07-11 pokračování: skutečné cello
+ Claire jako hlavní pozice (§18), kalendář klubu s adventním kalendářem
(§19), ambientní YouTube formáty (§20), členská čísla a repertoárová rada
(§21). 2026-07-12: tři koncepty pojetí A/B/C (§23, plné znění a srovnání
v docs/napady/KONCEPTY.md, doporučení B Atelier).*
