# Cello Cool Club Social Card Automation PRD

## 1. Vize

Cello Cool Club bude fungovat jako pravidelný poeticko-hudební klub, kde se jednou za tri dny odhali nova karta. Kazda karta je maly artefakt: obraz, kratky text, hudebni nalada a odkaz do archivu.

Hlavni pocit: "Rano si odhalte novou kartu." Ne jako obycejny post, ale jako ritual zvedavosti. Publikum si zvykne, ze kazdy treti den prijde nova karta, ktera nese basen, obraz a kousek hudebniho sveta.

## 2. Cil produktu

Vytvorit polautomaticky system, ktery:

- vede databazi temat, textu, promptu a stavu karet,
- jednou za tri dny vybere dalsi schvalenou kartu,
- vygeneruje nebo priradi obrazek,
- pripravi socialni post,
- publikuje kartu do archivu na webu Cello Cool Club,
- publikuje post na doporucenou socialni platformu,
- ponecha cloveku kontrolu nad hudbou a finalnim schvalenim.

## 3. Publikum

Primarni publikum:

- lide se zajmem o hudbu, poezii, ilustraci a atmosfericke mikropribehy,
- sledujici, kteri maji radi pravidelne ritualy a sbiratelske serie,
- publikum, ktere nevyhledava dlouhy obsah, ale chce kratky impulz s hloubkou.

Sekundarni publikum:

- ucitele, studenti hudby, tvurci,
- lide, kteri objevuji AI-assisted art a hudebni experimenty,
- fanousci karet, tarotu, poetickych her a malych digitalnich sbirek.

## 4. Kreativni koncept

### Ritual odhaleni

Kazdy treti den rano se objevi nova karta. Post nema pusobit jako promo, ale jako pozvanka:

> Ranni odhaleni: karta c. 04 - The Lantern.
> Otevrete ji, poslechnete si jeji zvuk a nechte ji dnes chvili pracovat.

Mozne rubriky:

- "Ranni karta"
- "Dnesni odhaleni"
- "Karta na tri dny"
- "The 3-Day Card"
- "Cello Cool Club reveals..."

### Sberatelsky princip

Kazda karta ma cislo, nazev, motiv, jazyk, hudebni naladu a archivni stranku. Uzivatel ma pocit, ze sbira postupne se rozsirujici balicek.

Mozne formaty:

- karta c. 001: The Clock
- karta c. 002: The Lantern
- karta c. 003: Velvet Staircase
- karta c. 004: The Blue Room

### Dramaturgie

Karty nemusi byt nahodne. Lze je radit do sezon:

- Season I: Time & Rooms
- Season II: Creatures of Sound
- Season III: Night Instruments
- Season IV: Letters from the Cello

Kazda sezona muze mit 12 az 24 karet. To dava projektu jasny oblouk a publikum muze cekat na dalsi kapitolu.

## 5. Zakladni uzivatelske scenare

### Navstevnik

1. Rano vidi socialni post s novou kartou.
2. Klikne na archivni odkaz.
3. Otevre kartu na webu.
4. Prehraje hudbu.
5. Precte si basen.
6. Muze listovat starsimi kartami.

### Tvurce

1. Prida neusporadany napad do databaze.
2. Doplnuje nebo upravi text.
3. Vygeneruje obrazek pres API.
4. Pripravi Suno prompt.
5. V Suno rucne vybere hudbu.
6. Nahraje finalni audio.
7. Nastavi kartu jako `approved`.
8. Automat ji publikuje v dalsim slotu.

### Automat

1. Kazde tri dny zkontroluje databazi.
2. Najde dalsi kartu ve stavu `approved`.
3. Vygeneruje statickou stranku karty.
4. Aktualizuje archiv.
5. Vytvori socialni post.
6. Publikuje na zvolenou platformu.
7. Ulozi URL postu a zmeni stav na `posted`.

## 6. Platformy

### Doporucena prvni socialni platforma: Threads

Proc:

- dobre sedi na kratke poeticke texty, obrazky a odkazy,
- Meta ecosystem muze pozdeji propojit Instagram,
- podporuje format pravidelnych mikro-postu,
- mene narocne nez video-first TikTok v prvni fazi.

Rizika:

- vyzaduje Meta developer nastaveni,
- API a permissions se mohou menit,
- bude potreba sprava tokenu a schvaleni aplikace.

### Zalozni technicky nejjednodussi platforma: Bluesky

Proc:

- otevrenejsi API,
- jednodussi publikovani textu a obrazku,
- dobre pro experiment, komunitu a verejny archiv.

Rizika:

- mensi mainstream dosah nez Instagram/TikTok,
- limit kratkych postu vyzaduje disciplinu.

### Druha faze: Instagram

Proc:

- vizualne nejsilnejsi misto pro karty,
- dobre pro carousel, Reels a esteticky brand,
- publikum je zvykle objevovat obrazovy obsah.

Rizika:

- Meta publishing API je narocnejsi na nastaveni,
- vyzaduje profesionalni ucet a spravu opravnemi,
- automaticke publikovani muze mit vice schvalovacich kroku.

### Treti faze: TikTok

Proc:

- nejsilnejsi potencial pro hudebni teaser,
- karta se muze zmenit na kratke video: odhaleni obrazu, text, hudebni ukazka.

Rizika:

- Content Posting API vyzaduje schvaleni a audit,
- video produkce je narocnejsi nez image post,
- samotna karta jako staticky obraz nebude na TikToku stacit.

## 7. Web a archiv

Soucasny web je staticka jedna karta. Cilem je rozsirit ho na archiv:

- homepage s posledni odhalenou kartou,
- grid vsech karet,
- detail kazde karty,
- prehravac hudby,
- text basne,
- metadata: cislo karty, sezona, datum publikace, jazyk,
- sdileci URL pro kazdou kartu.

Navrzeny format URL:

```text
/
/cards/
/cards/001-the-clock/
/cards/002-the-lantern/
/seasons/time-and-rooms/
```

## 8. Datovy model

Minimalni tabulka `cards`:

```text
id
number
slug
title
season
language
poem_text
short_caption
long_caption
image_prompt
suno_prompt
image_asset_url
audio_asset_url
alt_text
status
publish_at
archive_url
threads_post_url
bluesky_post_url
instagram_post_url
tiktok_post_url
notes
created_at
updated_at
```

Stavy:

```text
idea
draft
image_ready
music_needed
ready_for_review
approved
scheduled
posted
archived
```

## 9. Automatizace tvorby karty

### Text

Zdroj bude databaze. Neusporadana data se postupne prevedou do struktury:

- tema,
- obrazovy motiv,
- basen,
- hudebni emoce,
- socialni caption,
- prompt pro obrazek,
- prompt pro Suno.

AI muze pomahat:

- cistit preklepy,
- delat varianty captionu,
- zkratit text pro socialni sit,
- vygenerovat alt text,
- navrhnout Suno prompt,
- navrhnout obrazovy prompt.

AI by nemela bez schvaleni prepisovat jadro basne. Cello Cool Club ma mit lidsky hlas.

### Obrazek

Obrazek se generuje pres image API podle promptu z databaze.

Doporuceny vystup:

- hlavni karta: 4:5 nebo 3:4,
- socialni image: 4:5,
- archivni detail: vyssi rozliseni,
- thumbnail: ctverec.

Styl:

- dreamlike, slightly theatrical, handmade card feeling,
- ne prilis genericky fantasy,
- ne prilis dokonale hladke AI,
- vice "stara klubova karta" nez "moderni poster".

### Hudba

Suno bude v prvni verzi polorucni:

1. System vygeneruje Suno prompt.
2. Tvurce prompt vlozi nebo otevreny prompt pouzije v Suno.
3. Tvurce vybere finalni hudbu.
4. Audio se ulozi ke karte.

Duvod: verejne dostupna, stabilni a oficialni Suno API cesta neni dost jasna pro spolehlivou produkcni automatizaci. Neoficialni wrappery mohou byt krehke a pravne/produktove riskantni.

## 10. Technicka architektura

### Varianta A: rychle MVP

Nejrychlejsi varianta:

- databaze: Google Sheets,
- automatizace: n8n nebo Make,
- web: staticky web na Cloudflare Pages, Netlify nebo Vercel,
- obrazky: OpenAI Images API,
- soubory: Cloudflare R2 nebo Google Drive,
- socialni posting: Threads API nebo Bluesky API.

Vyhody:

- rychle spusteni,
- dobre pro experiment,
- malo vlastniho backendu.

Nevyhody:

- cast logiky bude ve vizualnim automatizacnim nastroji,
- horsi dlouhodoba udrzba, pokud projekt poroste.

### Varianta B: doporucena produkcni varianta

Doporucena varianta pro Cello Cool Club:

- frontend: staticky web generovany z dat,
- hosting: Cloudflare Pages,
- backend automatizace: Cloudflare Workers Cron,
- databaze: Supabase nebo Cloudflare D1,
- obrazky/audio: Cloudflare R2,
- image generation: OpenAI Images API,
- socialni posting: Threads jako primarni, Bluesky jako zaloha,
- admin rozhrani: jednoducha interni stranka pro schvalovani karet.

Vyhody:

- levne, robustni, automatizovatelne,
- dobry archiv,
- jasna kontrola nad daty,
- lze snadno pridat dalsi platformy.

Nevyhody:

- pomalejsi start nez Make/n8n,
- vyzaduje trochu backendove prace.

### Varianta C: editorial-first

Pro maximalni pohodli:

- databaze a admin: Airtable,
- automatizace: Airtable Automations + Make/n8n,
- web: staticky export,
- asset storage: Cloudinary nebo R2.

Vyhody:

- prijemna prace s obsahem,
- dobre pro neusporadana data,
- snadne schvalovani.

Nevyhody:

- zavislost na placenych SaaS,
- mene elegantni technicky zaklad.

## 11. Doporuceni

Zacit kombinaci:

- Google Sheets nebo Airtable pro prvni redakcni databazi,
- staticky archiv v tomto projektu,
- OpenAI Images API pro obrazky,
- rucni Suno vyber hudby,
- Bluesky pro prvni plne automaticky test,
- Threads jako hlavni cil po Meta nastaveni.

Prakticky duvod: Bluesky umozni rychle overit, ze pipeline funguje. Threads je lepsi hlavni kanal pro znaceni a dosah, ale muze trvat dele ho pripravit.

## 12. Publikacni rytmus

Frekvence:

- nova karta kazdy treti den,
- publikace rano v 7:30 lokalniho casu,
- kazda karta zustava "aktivni" tri dny.

Socialni struktura:

Den 1:

- odhaleni nove karty,
- obrazek,
- kratky text,
- odkaz do archivu.

Den 2:

- detail z karty nebo citat,
- otazka publiku,
- pripomenuti hudby.

Den 3:

- kratky dozvuk,
- "zitra rano se otevre dalsi karta" nebo "za jeden spanek dalsi odhaleni".

Tim se z jedne karty stane maly tri-denni cyklus, ne jednorazovy post.

## 13. Ton komunikace

Cello Cool Club by mel znit jako:

- tajemny, ale ne tezky,
- hudebni, ale ne akademicky,
- poeticky, ale ne pateticky,
- hravy, ale ne detinsky,
- klubovy, ne korporatni.

Priklady tonu:

```text
Ranni karta je otevrena.
The Clock meri cas jinak: ne po hodinach, ale po tom, co v nas zustava.
Poslechnete si ji v archivu Cello Cool Club.
```

```text
Nova karta na tri dny: The Lantern.
Maly obraz, kratka basen, kousek hudby.
Otevrete ji, nez den zacne mluvit prilis nahlas.
```

```text
Karta c. 007 je venku.
Neni odpoved. Je to mala nalada, kterou muzete nosit v kapse.
```

## 14. Funkcni pozadavky

### MVP

- Sprava karet v tabulce/databazi.
- Import existujicich neusporadanych dat.
- Generovani archivni stranky pro kazdou kartu.
- Generovani indexu vsech karet.
- Ulozeni obrazku a audia jako assetu.
- Priprava socialniho captionu.
- Manualni schvaleni pred publikovanim.
- Automaticke publikovani kazde tri dny.
- Ulozeni URL publikovaneho postu.

### V1

- Admin nahled karty pred publikaci.
- Tlacitko "generate image".
- Tlacitko "prepare Suno prompt".
- Tlacitko "approve".
- Automaticke postovani na Threads.
- Automaticke postovani na Bluesky jako zaloha.
- RSS feed nebo newsletter-friendly export.

### V2

- Video teaser z karty a hudby.
- Instagram Reels / TikTok priprava.
- Vlastni generovani socialnich variant.
- Sezony, tagy a kolekce.
- Verejne listovani balickem karet.
- Moznost "random card".

## 15. Nefunkcni pozadavky

- Kazda karta musi mit vlastni permanentni URL.
- Vsechny obrazky musi mit alt text.
- Web musi fungovat rychle na mobilu.
- Archiv nesmi byt zavisly na socialnich sitich.
- Automat nesmi publikovat obsah bez stavu `approved`.
- Tokeny a API klice nesmi byt ulozene v repozitari.
- Kazda automaticka akce musi byt zalogovana.
- Pri chybe se nesmi ztratit data ani preskocit karta.

## 16. Schvalovaci pravidla

Karta muze byt publikovana pouze kdyz:

- ma nazev,
- ma slug,
- ma text,
- ma obrazek,
- ma alt text,
- ma schvaleny caption,
- ma audio nebo je oznacena jako "silent card",
- ma stav `approved`,
- ma nastavene datum publikace nebo muze byt vybrana jako dalsi ve fronte.

## 17. Metriky uspechu

Produktove metriky:

- pocet publikovanych karet,
- pravidelnost publikovani,
- prokliky ze socialni site do archivu,
- prehrani hudby,
- navraty do archivu,
- ulozeni/sdileni postu,
- komentare typu "cekam na dalsi kartu".

Kreativni metriky:

- zda karta pusobi jako soucast jedneho sveta,
- zda ritual "kazde tri dny" zacina byt rozpoznatelny,
- zda archiv roste jako sbirka, ne jako blog.

## 18. Rizika

- Socialni API se meni a muze vyzadovat nove schvaleni.
- Suno automatizace pres neoficialni API muze byt nestabilni.
- Generovane obrazky mohou pusobit prilis genericky.
- Prilis caste AI prepisovani muze oslabit autorsky hlas.
- Bez dobreho redakcniho workflow vznikne nova forma chaosu.

Mitigace:

- drzet archiv jako hlavni zdroj pravdy,
- socialni site brat jako distribuci,
- nechavat lidske schvaleni pred publikaci,
- uchovavat puvodni texty i AI upravy,
- mit zalozni kanal Bluesky pro testy.

## 19. Otevrene otazky

- Ma byt primarni jazyk anglictina, cestina, nebo vicejazycne karty?
- Ma kazda karta mit hudbu, nebo mohou existovat tiche karty?
- Ma byt archiv verejne listovatelny od zacatku, nebo se maji starsi karty odemykat postupne?
- Ma karta pusobit vic jako tarot, hudebni single, nebo klubovy artefakt?
- Chceme schvalovani jen pres tabulku, nebo pozdeji pres male admin UI?

## 20. Navrzeny prvni milestone

Milestone: "First 12 Cards Engine"

Cil:

- pripravit prvnich 12 karet jako Season I,
- vytvorit redakcni databazi,
- predelat web na archiv,
- zautomatizovat generovani stranek,
- otestovat publikaci na Bluesky,
- pripravit Threads integraci.

Vystup:

- verejny archiv Cello Cool Club,
- 12 karet v databazi,
- 3 publikovane testovaci karty,
- jeden stabilni publikačni cyklus kazde tri dny.

## 21. Reference k platformam

- TikTok Content Posting API: https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
- Bluesky post API: https://docs.bsky.app/docs/tutorials/creating-a-post
- Threads API overview: https://developers.facebook.com/docs/threads
- Instagram Platform publishing: https://developers.facebook.com/docs/instagram-platform/content-publishing
- OpenAI image generation: https://platform.openai.com/docs/guides/image-generation
