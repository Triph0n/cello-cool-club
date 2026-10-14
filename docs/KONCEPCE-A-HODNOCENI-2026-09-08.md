# Cello Cool Club a Cello Cool Club Live

Hodnocení a návrh sjednocené koncepce · 8. září 2026

Tento dokument je nový redakční návrh, nikoli záznam již schválené změny směru. Zachovává rozhodnutí z 13. 7. postupně rozvíjet Atelier → Klub → Rádio. Původní koncepce, díla ani provozní data nepřepisuje.

## Závěr

**Nejsilnější společné jádro projektu jsou malé lidské příběhy, které dostávají obraz, píseň a nakonec skutečné jeviště.** Cello v dialogu se zpěvem dává koncertní větvi konkrétní hudební charakter. Deska, plakát a Devítka dávají příběhům podobu, kterou lze poslouchat, darovat a uchovat.

Projekt má rozsáhlou tvůrčí zásobu a několik působivých forem. Slabší je zatím jednotná odpověď na otázky: co nabídneme novému posluchači jako první, která verze je definitivní a co je již koncertně proveditelné. Doporučuji nyní soustředit práci na jednu dokončenou Devítku a krátký ověřený koncertní pilot.


Poznámka pro další modely: inventura vychází z lokálního pracovního stromu k 8. 9. 2026, který obsahoval i neodeslané změny. Tento dokument byl publikován samostatně; zmíněné podklady nemusí být v této GitHub verzi dostupné. Jejich cesty jsou orientační reference, nikoli důkaz, že jsou nahrané. Před implementací ověřte aktuální soubory; doporučení zde nejsou automaticky schválené úkoly.

## Co bylo skutečně ověřeno

Prošel jsem kořenové README a PRD, dokumentaci enginu a jeho úkoly, všech 24 tematických námětů, rozhodnutí o třech konceptech, Devítku I, pravidla Live a jeho generovací skripty, dokumentaci tří obrazových Live sad, poslechový přehled a komiksové/video prototypy. Datovou inventuru jsem provedl čtením JSON a kontrolou souborů. Detailně jsem četl vybraných pět textů; vizuálně jsem prohlédl plakáty A/C k The Thief of Sleep a kontaktní list videa The Last Word.

Nejde o poslechový audit všech skladeb ani o kontrolu každého obrazu. Hudební kvalita, identita hlasu, zachování melodií a proveditelnost aranží nejsou poslechem ověřeny. Nasazený web se přes webový nástroj nepodařilo načíst; čísla veřejného katalogu níže popisují lokální export. Poptávka, návštěvnost, prodeje, sestava hudebníků a rozpočet koncertu nebyly doloženy.

| Oblast | Ověřený stav na disku | Co z toho plyne |
|---|---|---|
| Textový master | 1 102 číslovaných textů; stejný počet záznamů v crosswalku i dashboardu | Zásoba témat pro pilot existuje |
| Engine | 1 084 karet; 1 082 má vyplněné audio a soubor na odkazované cestě | Existence MP3 není schválení kvality |
| Redakční stav | 3 `posted`, 1 `approved`, 1 078 `music_needed`, 2 `draft` | Všech 1 078 `music_needed` už má existující audio; stav nevystihuje připravenost |
| Lokální veřejný export | 4 záznamy v `data/cards.json` | Nesouhlasí s aktuálními 3 `posted`; před dalším vydáním prověřit rozdíl |
| Live | 57 složek skladeb, všechny s MP3; celkem 74 MP3 | Rozsáhlá knihovna studií pro výběr repertoáru |
| Dekády Live | 1920 u 51 skladeb, 1930 u 10, 1940 u 10; všechny tři u 7 skladeb | Tři dekády nejsou dokončený standard celého katalogu; součty zahrnují další varianty |
| Poslech příběhů | 566 řádků, z toho 56 s Live verzemi | Již existuje pracovní místo pro kurátorský výběr |
| Notové podklady | Ve `celloclublive/` nenalezeny PDF, MusicXML, MSCZ, MIDI ani soubory s názvem setlist/rider | Připravenost koncertního balíčku není doložena; podklady mohou existovat jinde |

Zdroje inventury: `assets/text/AllEnglishTexts.md`, `engine/data/cards.json`, `data/cards.json`, `data/crosswalk.json`, `dashboard/index.json`, `celloclublive/`, `experiments/story-audio-review/rows.json`. Počty MP3 jsou počty souborů, ne unikátních hudebních kompozic.

## Hodnocení uměleckého jádra

**Příběhy s konkrétní situací a obratem mají podle mého čtení největší sílu.** The Thief of Sleep nabízí morálně dvojznačnou postavu a odhalení důvodu krádeže. The Last Word má překvapení, humor i něhu v posledním gestu psa. To jsou dobré předpoklady pro písňové vyprávění a živou interpretaci.

Část textů na konci ještě vysvětluje to, co už obraz nebo děj sdělil. U The Thief of Sleep závěrečné pojmenování „a criminal and a savior“ výklad uzavírá; u The Boy and the Echo poslední obecné poučení mění příběh v bajku s výslovnou morálkou. Doporučuji před hudebním uzamčením textu porovnat plný závěr s verzí končící konkrétním gestem. Není to návrh na plošné škrtání: dětská bajka může vyslovenou pointu potřebovat, dospělá píseň často unese více ticha. Texty jsem neměnil.

Vizuální větev má patrnou jednotu: tisková textura, tmavý obrazový blok, teplé světlo a papírový okraj. U plakátu A k The Thief of Sleep dominuje zloděj a pytel; C propojuje pytel se spícím dítětem a prozrazuje rozuzlení. **A proto dává smysl jako první obal, C jako obraz po poslechu.** Jednotnost nesmí přerůst v povinně stejnou tmavost a melancholii: v jedné Devítce má být místo i pro komiku, lehkost a vizuální vzduch.

Odkazy na Préverta a Borna jsou užitečné pracovní reference. Ve veřejném představení bych popisoval vlastní motivy, humor, způsob vyprávění a konkrétní tvůrčí podíl. Značka potřebuje být zapamatovatelná sama o sobě.

## Sjednocená koncepce — návrh textu

> **Cello Cool Club je poetický hudební klub Vladimíra Fortina. Z malých příběhů všedního života vznikají ilustrované písně: někdy něžné, někdy absurdní, vždy s lidskou pointou. Poslouchají se jako malé desky, potkávají se v tematických Devítkách a mohou pokračovat jako obraz nebo dárek.**
>
> **Cello Cool Club Live přenáší vybrané příběhy na jeviště. Jeden sólový hlas vypráví, cello mu odpovídá a klavír, kontrabas a bicí vytvářejí prostor pro komorní jazzový koncert.**

Druhý odstavec popisuje zamýšlený cílový koncertní formát. Do nabídky pořadatelům patří až po ověření skutečného obsazení a repertoáru.

| Vrstva | Její role | První konkrétní výsledek |
|---|---|---|
| Cello Cool Club | Zastřešující autorský svět a katalog | Jeden srozumitelný vstup k poslechu |
| Devítky | Dramaturgické edice po devíti písních | Dokončený set s pořadím a hlavní verzí každé skladby |
| Cello Cool Club Live | Koncertní interpretace vybraného repertoáru | Tři vyzkoušené skladby a záznam zkoušky |
| Obrazové edice | Plakát, karta, dárek odvozený od konkrétní písně | Jeden fyzický vzorek s fungujícím přehráním přes QR |
| Klub a Rádio | Pozdější rozšíření vztahu s publikem | Až po ověření, že se lidé vracejí |

Engine, generátory a pracovní dashboardy jsou výrobní zázemí této koncepce. Komiks a video jsou možné interpretace konkrétního příběhu; nemusí být povinnou přílohou každé skladby.

## Co sjednotit v dosavadních dokumentech

| Souběžná tvrzení | Doporučené vyjasnění |
|---|---|
| Sezóna 12 skladeb versus Devítka | Devítku použít jako výchozí edici. Sezóna může obsahovat více edic. Advent je samostatný formát |
| Denní píseň, vydání jednou za tři dny, odemykání po poslechu | Oddělit datum vydání od doporučeného pořadí poslechu. Denní výběr může být repríza |
| „Digitál hojný“ versus poslech jen dnes a povinné dokončení | Nabídnout volný poslech vydaných skladeb; postupné odhalování jako dobrovolný režim |
| Claire jako hlavní značka versus skutečná koncertní zpěvačka | Claire může zůstat přiznanou fiktivní hostitelkou studiového světa. Live uvádí skutečné interprety |
| Atelier Claire/riso versus současné litografické plakáty | Původní vizuální návrh označit jako historický; pro nové edice popsat současný společný jazyk |
| Dashboard jako „jediný zdroj pravdy“ versus engine a crosswalk | Určit odpovědnost každého zdroje; dashboard je přehled s ručními doplňky, nikoli náhrada všech dat |

Zachovávám původní přání postupně rozvinout všechny větve. Doporučení je změna pořadí a soustředění práce, nikoli odstranění budoucích námětů. Ceny, rychlost návratnosti a výroky „nikdo jiný to nedělá“ v brainstormu jsou pracovní domněnky, nikoli ověřené obchodní výsledky.

## Live: zásadní krok od studií ke koncertu

**1. Rozlišit nové zhudebnění a aranž stejné melodie.** `build-live-style.mjs` přebírá text a upravuje původní stylový prompt; `custom-generate.mjs` vyplňuje název, text a styl a spouští Create. V kontrolovaném postupu není předání původního audia nebo notové melodie. Stejný text a stylové zadání tedy nedokládají, že vzniká tatáž skladba v jiném aranžmá.

Pokud se zachování melodie požaduje, vybrat referenční nahrávku a ověřovat varianty proti ní. Suno popisuje Cover jako změnu stylu se zachováním melodie; případný pilot Cover je vhodné porovnat poslechem, nikoli považovat za záruku výsledku. [Oficiální vysvětlení Covers](https://help.suno.com/en/articles/2872257).

**2. Zvolit jednu hlavní koncertní verzi každé skladby.** Dekády 1920/1930/1940 ponechat jako tvůrčí varianty. Na prvním veřejném přehrávači nabídnout redakčně vybranou verzi, ostatní až pod další volbou. Devět skladeb ve třech dekádách znamená 27 kandidátů před započtením druhých pokusů; posluchač nepotřebuje přebírat práci dramaturga.

**3. Zachovat rozpoznatelnou funkci cella a dát jí prostor.** Dialog po zpěvní frázi, vlastní motiv, krátké sólo, pauza po pointě. Návrh dramaturgie: nevynucovat odpověď cella po každém řádku. Nástroj musí někdy mlčet, aby příští vstup něco znamenal. Pravidlo jednoho sólového hlasu a absence skutečných saxofonů/žesťů v Live zůstává.

**4. Vyrobit zkušební balíček.** Ke každé ze tří pilotních skladeb připravit definitivní text, referenční audio, tóninu a rozsah hlasu, tempo/takt, formu, melodii s akordy, vstupy cella, začátek a konec. První zkouška rozhodne o zpívatelnosti, délce a dynamice. AI nahrávka je pracovní reference; samotné MP3 není hotová aranž pro hráče.

**5. Nemíchat dva koncertní sliby.** Zpěvačka + cello + klavír + kontrabas + bicí odpovídá aktuálnímu Live zadání. Živé cello s nahranou Claire je jiný formát; případně ho uvést samostatně a popsat, co hraje živě. Nezměnil jsem stanovené obsazení.

Pro první program navrhuji oblouk **pozvání → hravost → konflikt → ztišení → obrat → rozloučení**. Délku určit z naměřených nahrávek a zkoušky. Devět krátkých nahrávek samo o sobě nemusí naplnit koncertní večer. Projekci používat střídmě: jeden obraz může publiku ponechat více pozornosti pro hudebníky než nepřetržitý klip.

## Devítka a cesta posluchače

Nejprve dokončit jednu ze stávajících edic. Nebeská rodina má už konkrétní téma a devět vizuálů; Live má silné lidské příběhy. Planety bych ponechal jako vlastní svět. Pro spojení s koncertem bych z existujících Live skladeb sestavil další Devítku až po poslechu, bez výroby nových básní jen kvůli zaplnění police.

Pro první kontakt doporučuji tento jednoduchý průchod:

1. Jedna věta o klubu a výrazný vstup „Pustit příběh“.
2. Jeden obraz, jedna hlavní nahrávka, dostupný text a překlad.
3. Po poslechu volby pokračovat v Devítce, poslat příběh nebo poznat Live.
4. Podrobné varianty a celý katalog až pro zájemce.

Středová karta v mřížce a závěrečná skladba nemusí být totéž. U Nebeské rodiny je Slunce uprostřed, ale poslouchá se poslední: vizuální pozici a pořadí přehrávání evidovat odděleně. Odhalování pointy může být krásné, avšak přímý odkaz na darovanou píseň by měl fungovat bez povinného poslechu osmi předchozích.

Primární publikum první dospělé Devítky bych vymezil jako lidi, které baví krátký příběh, jemný humor, ilustrace a komorní jazz. Dětské a výukové edice mají vlastní výběr a kontext. Obsah typu The Last Word nebo The Thief of Sleep není automaticky školní repertoár jen proto, že má ilustrace.

## Produkce, která pomůže dokončovat

Identita díla má stát na kanonickém čísle a existujícím crosswalku. Například The Thief of Sleep má kanonické číslo `0069`, engine kartu `055` a v obrazové Live sadě `posterNumber: 083`. Tyto údaje nesměšovat a soubory hromadně nepřejmenovávat.

Doporučené odpovědnosti:

- Textový master a crosswalk: dílo a vazby mezi historickými čísly.
- Engine: redakční stav a původní publikovaná karta.
- Samostatný Live registr: reference na dílo, dostupné varianty, vybrané audio, hudební parametry a stav zkoušky.
- Dashboard: společný pohled a zaznamenaná rozhodnutí, například proč byla vybrána konkrétní verze.

U nové evidence Live rozlišovat **audio existuje → poslech schválen → aranž připravena → vyzkoušeno → koncertně připraveno**. Historické `music_needed` v enginu opravit cíleným auditem; nepřevádět automaticky všechny nalezené MP3 do schváleného stavu. Poslechový přehled dnes vybírá příběhy podle názvů a novější variantu podle jména souboru; pro definitivní výběr je vhodné explicitní ID nahrávky a redakční rozhodnutí.

Nedělal bych povinně tři plakáty a video pro každou píseň. Výchozí jednotka je text + vybrané audio + jeden obal. Symbol, komiks a video vznikají tam, kde přinášejí další význam. Tím se uvolní čas pro výběr, zkoušku a dokončení.

## Doporučené pořadí práce

| Priorita | Úkol | Poznatelný konec |
|---|---|---|
| 1 | Kurátorský poslech existujícího Live a výběr pilotu | Tři skladby, každá s jednou zvolenou nahrávkou a krátkým zdůvodněním |
| 2 | Připravit hudební podklady a zkoušku | Hráči odehrají skladby od začátku do konce; jsou zapsané úpravy |
| 3 | Dokončit jednu Devítku | Devět schválených skladeb, pořadí, obaly, čitelné texty a funkční poslech |
| 4 | Sjednotit vstup pro publikum | Jeden stabilní odkaz; návštěvník dokáže bez vysvětlování začít poslouchat |
| 5 | Zkusit jeden fyzický artefakt | Vytištěný vzorek, fungující QR a spočítaný materiál, práce, balení a doručení |
| Později | Členství, hitparáda, rádio, advent, 3D/NFC | Rozšířit podle skutečné odezvy a kapacity |

První ověření navrhuji s 5–10 lidmi mimo výrobní proces. Sledovat, zda rozumějí nabídce bez výkladu, kterou píseň chtějí slyšet znovu, zda umějí převyprávět její pointu a zda se ptají na koncert nebo fyzickou edici. Je to návrh kvalitativního pilotu, nikoli odhad tržní poptávky. Počet vygenerovaných souborů není hlavní metrika této fáze.

## Mapa navazujících materiálů

- Původní rozhodnutí o pořadí Atelier → Klub → Rádio — `engine/docs/napady/KONCEPTY.md`
- Devítka I — Nebeská rodina — `docs/DEVITKA-I.md`
- Původní základ projektu — `PRD.md`
- Provozní úkoly enginu — `engine/TASK.md`
- Skript stylových variant Live — `celloclublive/scripts/build-live-style.mjs`
- Skript vytváření Live skladeb — `celloclublive/scripts/custom-generate.mjs`
- Poslechový přehled — zdroj dat — `experiments/story-audio-review/rows.json`
- Příklad obrazové Live edice — `experiments/cards-live-2/055-the-thief-of-sleep/meta.json`

Dokumentace potřebuje především rozlišení „platná koncepce / provozní návod / historický nápad“. Tento návrh nabízí společný výchozí text, ale nezavádí své návrhy zpětně jako Vladimírova schválená rozhodnutí.
