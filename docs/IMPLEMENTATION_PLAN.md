# Cello Cool Club Implementation Plan

## Cil

Postavit prvni funkcni verzi systemu, ve kterem lze spravovat karty, generovat archiv webu, pripravovat obrazky a publikovat jednu novou kartu kazde tri dny.

Plan navazuje na `PRD.md`. PRD popisuje produkt a atmosferu, tento dokument popisuje poradi implementace.

## Doporučeny smer

Zacit jednoduse:

- data karet ulozit lokalne v `data/cards.json`,
- web generovat ze strukturovanych dat,
- obrazky a audio drzet v `assets/`,
- Suno nechat v prvni verzi jako rucni krok s predpripravenym promptem,
- prvni plne automaticke socialni postovani testovat na Bluesky,
- Threads pripravit jako hlavni cil po nastaveni Meta aplikace.

Tahle cesta je dost mala na rychly start, ale neblokuje pozdejsi prechod na Supabase, Cloudflare Workers a R2.

## Faze 0: Uklid projektu

Vystup:

- `PRD.md`
- `docs/IMPLEMENTATION_PLAN.md`
- jasne slozky pro data, assety a generovane stranky

Navrzena struktura:

```text
/
  index.html
  styles.css
  script.js
  PRD.md
  docs/
    IMPLEMENTATION_PLAN.md
  data/
    cards.json
  assets/
    images/
    audio/
  cards/
    001-the-clock/
      index.html
```

Ukoly:

- zachovat soucasnou kartu `The Clock` jako prvni polozku archivu,
- vytvorit `data/cards.json`,
- presunout text, metadata, obrazky a audio do datoveho zaznamu,
- nechat soucasny vizualni styl jako zaklad klubove identity.

## Faze 1: Datovy zaklad

Vystup:

- lokalni databaze karet v JSON,
- prvni zaznam `The Clock`,
- validacni pravidla pro kartu.

Minimalni zaznam:

```json
{
  "id": "001",
  "number": 1,
  "slug": "the-clock",
  "title": "The Clock",
  "season": "Time & Rooms",
  "language": "en",
  "poemText": [],
  "shortCaption": "",
  "imagePrompt": "",
  "sunoPrompt": "",
  "image": "assets/images/clock-card.png",
  "audio": "assets/audio/hands-of-time-en.mp3",
  "altText": "",
  "status": "posted",
  "publishAt": "",
  "postedUrls": {}
}
```

Ukoly:

- definovat schema karty,
- vytvorit prvni datovy soubor,
- vytvorit jednoduchou kontrolu povinnych poli,
- pripravit pole pro budoucich 12 karet Season I.

## Faze 2: Archiv webu

Vystup:

- homepage s posledni kartou,
- archiv vsech karet,
- detail kazde karty.

Ukoly:

- predelat `index.html`, aby cetl/renderoval kartu z dat nebo ze staticky vygenerovaneho obsahu,
- homepage se generuje z posledni publikovane karty,
- vytvorit `/cards/` jako prehled,
- vytvorit `/cards/001-the-clock/`,
- pridat navigaci mezi kartami,
- pridat sdilitelne odkazy,
- pridat metadata pro socialni preview.

Rozhodnuti:

- Pro zacatek pouzit staticky generovany HTML vystup.
- Pozdeji lze prejit na Astro, Eleventy nebo Next.js, pokud archiv poroste.

## Faze 3: Generator stranek

Vystup:

- jeden prikaz vygeneruje archiv z `data/cards.json`.

Ukoly:

- vytvorit generator, ktery:
  - nacte `data/cards.json`,
  - vytvori homepage,
  - vytvori archivni index,
  - vytvori detail kazde karty,
  - doplni title, description a socialni preview metadata.

Doporucena technologie:

- Node.js skript pro rychly start,
- sablony jako obycejne HTML stringy nebo pozdeji Eleventy.

Proc:

- projekt je zatim staticky a maly,
- neni potreba tezky frontend framework,
- archiv pujde nasadit levne a spolehlive.

## Faze 4: Redakcni workflow

Vystup:

- jasny proces od napadu ke karte.

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
```

Ukoly:

- pridat skript `new-card`, ktery vytvori kostru nove karty,
- pridat skript `validate-cards`, ktery najde chybejici pole,
- pridat skript `next-card`, ktery vybere dalsi `approved` kartu,
- ulozit pripravene captiony pro socialni site.

Pravidlo:

- Automat nikdy nepublikuje kartu, ktera neni `approved`.

## Faze 5: Generovani obrazku

Vystup:

- karta umi mit predpripraveny prompt,
- obrazek lze vygenerovat pres API a ulozit k zaznamu.

Ukoly:

- pridat pole `imagePrompt`,
- pridat skript `generate-image`,
- ulozit vystup do `assets/images/`,
- zapsat cestu k obrazku do `cards.json`,
- pridat alt text.

Doporucena platforma:

- OpenAI Images API.

Poznamka:

- V prvni verzi nespoustet generovani automaticky bez potvrzeni. Obraz je soucast identity a potrebuje vyber.

## Faze 6: Suno workflow

Vystup:

- system generuje nebo drzi Suno prompt,
- hudba zustava rucne vybrana.

Ukoly:

- pridat pole `sunoPrompt`,
- pridat pole `musicNotes`,
- pridat pole `audio`,
- vytvorit textovy export promptu pro Suno,
- po vyberu hudby nahrat audio do `assets/audio/`.

Implementacni stav:

- `export-suno` vytvari prompt, text a markdown packet,
- `attach-audio` pripoji vybrany audio soubor ke karte a zkopiruje ho do assetu.

Pravidlo:

- Nepouzit neoficialni Suno API pro produkcni automatizaci, dokud nebude jasna stabilni oficialni cesta.

## Faze 7: Socialni postovani

Vystup:

- pripraveny post pro socialni sit,
- prvni test automaticke publikace.

Poradi:

1. Bluesky test
2. Threads integrace
3. Instagram/TikTok az ve video fazi

Ukoly pro Bluesky:

- vytvorit app password,
- pridat tajne promenne mimo repo,
- publikovat text + obrazek + odkaz,
- ulozit URL postu do dat.

Implementacni stav:

- `publish-bluesky` ma dry run bez publikovani,
- ostre publikovani vyzaduje `--confirm` a credentials v `.env`.

Ukoly pro Threads:

- zalozit/pripravit Meta developer app,
- overit permissions,
- pripravit publish flow,
- ulozit URL postu do dat.

Format postu:

```text
Ranni karta je otevrena.

001 - The Clock

Maly obraz, kratka basen, kousek hudby.
Otevrete ji v archivu Cello Cool Club:
{url}
```

## Faze 8: Planovac

Vystup:

- kazde tri dny se publikuje dalsi schvalena karta.

MVP reseni:

- lokalni nebo GitHub Actions planovac,
- spusti generator,
- publikuje post,
- zapise stav.

Produkci reseni:

- Cloudflare Workers Cron,
- databaze Supabase nebo Cloudflare D1,
- assety v Cloudflare R2,
- deploy na Cloudflare Pages.

Pravidla:

- publikovat rano v 7:30 Asia/Jerusalem,
- pokud neni karta `approved`, nepublikovat nic,
- poslat upozorneni/log chyby,
- nikdy nepreskocit kartu potichu.

Implementacni stav:

- `run-release` pocita dalsi slot podle posledni publikovane karty,
- bez `--confirm` jen ukazuje dry run,
- pokud je release due a neni `approved` karta, skonci chybou,
- potvrzeny release zapise `posted`, `publishAt`, socialni draft a spusti export webu.

## Faze 9: Nasazeni

Vystup:

- verejny archiv online.

Doporucene platformy:

- Cloudflare Pages pro web,
- Cloudflare R2 pro vetsi assety,
- GitHub pro verze a nasazovani,
- Cloudflare Workers Cron pro automatizaci.

Implementacni stav:

- `check-site` overuje staticky vystup pred nasazenim,
- kontroluje homepage, archiv, detail karet, assety a unik soukromych poli.

Alternativa pro rychly start:

- Netlify nebo Vercel pro web,
- GitHub Actions pro planovac,
- Google Sheet jako docasna databaze.

## Faze 10: Kreativni rozsireni

Po MVP:

- nahodna karta dne,
- sezony a kolekce,
- kratke video teasery,
- email/RSS odber,
- tri-denni cyklus pro kazdou kartu:
  - Den 1: odhaleni,
  - Den 2: detail/citat,
  - Den 3: dozvuk a teaser dalsi karty.

## Prioritni backlog

### Must have

- `data/cards.json`
- detail karty z dat
- archivni index
- generator stranek
- validace povinnych poli
- manualni schvaleni
- prvni pripraveny socialni caption

### Should have

- generovani obrazku pres API
- Bluesky publishing test
- automaticky vyber dalsi karty
- planovac jednou za tri dny
- deploy na verejnou URL

### Could have

- male admin UI
- Threads integrace
- video teaser
- sezonni landing page
- newsletter/RSS

Implementacni poznamka:

- `preview-card` pridan jako bezpecny lokalni nahled draftu pred publikovanim.

## Navrzeny prvni sprint

Delka:

- 2 az 4 pracovni bloky.

Cil:

- zmenit soucasnou jednu kartu na prvni datove rizeny archiv.

Konkretni vystupy:

1. Vytvorit `data/cards.json`.
2. Prevest `The Clock` do dat.
3. Vytvorit generator statickych stranek.
4. Vygenerovat `/cards/001-the-clock/`.
5. Vytvorit `/cards/` archiv.
6. Zachovat vizualni styl soucasne karty.
7. Pripravit misto pro dalsich 11 karet.

## Definice hotovo pro MVP

MVP je hotove, kdyz:

- web ma archiv a detail karty,
- karta se negeneruje rucne editaci HTML,
- existuje alespon 12 pripravenych zaznamu nebo draftu,
- jedna karta se da oznacit jako `approved`,
- system umi vybrat dalsi schvalenou kartu,
- existuje testovaci socialni post,
- publikacni ritual je jasny: nova karta kazde tri dny rano.
