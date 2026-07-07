# PRD: Cello Cool Club Engine

## 1. Účel aplikace

Cello Cool Club Engine je lokální produkční panel pro tvorbu poetických hudebních karet. Aplikace má vzít výchozí texty ze souboru, vytvořit z nich karty, připravit prompty pro obraz a Suno, pomoct skladby vytvořit, stáhnout hotové audio do lokální složky, připojit assety ke kartě a exportovat veřejný archiv do projektu `C:\Users\Vladimir\Documents\CelloCoolClub`.

Veřejný web má zůstat jednoduchý archiv. Engine je pracovní místo pro chaos, dávky, experimenty, schvalování a automatizaci.

## 2. Co aplikace už dělá

Současný stav podle kódu a dokumentace:

- Má lokální admin panel na `http://127.0.0.1:5174/`.
- Načítá zdrojové básně ze souborů v `data/clean-sources/`.
- Umí zobrazit seznam zdrojových textů a existujících karet.
- Umí vytvořit draft karty ze zdrojové básně.
- Umí vytvořit dávku Suno packetů podle rozsahu typu `1-5` nebo `1,3,7-9`.
- Umí kopírovat báseň, sound prompt, image prompt a wallpaper prompt do schránky.
- Umí otevřít Suno, Gemini a ChatGPT s připraveným obsahem ve schránce.
- Umí exportovat Suno packet jako `.txt`, `-lyrics.txt`, `.md` a `.json` do `exports/suno/`.
- Umí připojit vybraný obrázek a audio soubor ke kartě.
- Umí vytvořit lokální preview karty ve veřejném webu.
- Umí schválit kartu.
- Umí validovat karty.
- Umí exportovat veřejný statický archiv do `C:\Users\Vladimir\Documents\CelloCoolClub`.
- Umí připravit social post draft.
- Umí publikovat na Bluesky po potvrzení a s credentials mimo repo.
- Umí spustit třídenní release flow v dry-run nebo potvrzeném režimu.

## 3. Uživatel

Primární uživatel je tvůrce Cello Cool Clubu.

Potřebuje rychle vzít sadu básní ze souboru, vybrat nebo dávkově zpracovat konkrétní čísla, vytvořit písně v Suno, uložit výsledná MP3, připojit je ke kartám a bez ruční editace HTML dostat hotovou kartu do veřejného archivu.

## 4. Základní workflow

1. Uživatel vloží nebo aktualizuje zdrojový soubor s texty v `data/clean-sources/`.
2. Engine zdroj načte jako výchozí sadu textů.
3. Uživatel vybere jednu báseň nebo rozsah básní.
4. Engine vytvoří draft karty a prompty.
5. Engine připraví Suno packet.
6. Uživatel nebo automat otevře Suno a spustí vytvoření skladby.
7. Engine počká přibližně 3 minuty, protože vytvoření skladby běžně trvá kolem 3 minut.
8. Engine stáhne hotovou skladbu do staging složky.
9. Uživatel vybere finální audio variantu, nebo Engine připojí nejnovější stažený soubor podle vazby na kartu.
10. Engine připojí audio ke kartě, vytvoří preview, umožní schválení a exportuje veřejný archiv.

## 5. Sada skillů aplikace

Tyto skilly jsou produktové schopnosti Engine, ne nutně samostatné Codex skilly:

- **Source Loader**: načte výchozí texty ze souborů v `data/clean-sources/`, rozpozná čísla, názvy, jazyky a text básně.
- **Card Draft Builder**: vytvoří draft karty ze zdrojové básně, nastaví `id`, `slug`, `title`, `language`, `poemText`, sezonu a základní metadata.
- **Prompt Builder**: vytvoří image prompt, Suno style prompt, wallpaper prompt a krátké texty pro práci s AI nástroji.
- **Suno Packet Builder**: exportuje pro každou kartu strukturovaný packet se `songTitle`, `lyrics`, `stylePrompt`, `targetUrl`, instrukcemi a lokálními soubory.
- **Suno Create Assistant**: otevře Suno create stránku, připraví data do schránky a v cílovém stavu vyplní title, lyrics, style prompt a stiskne Create.
- **Suno Download Watcher**: po vytvoření skladby čeká cca 3 minuty, sleduje dokončení, stáhne MP3 do staging složky a vrátí cestu ke staženému souboru.
- **Audio Attach Skill**: připojí vybraný nebo nově stažený MP3 soubor ke kartě a zkopíruje ho do `assets/audio/`.
- **Image Attach Skill**: připojí vybraný nebo vygenerovaný obrázek ke kartě a zkopíruje ho do `assets/generated-images/`.
- **Preview Skill**: vytvoří lokální náhled karty ve veřejném archivu bez publikování.
- **Approval Skill**: změní kartu do schváleného stavu jen pokud má povinné assety a metadata.
- **Public Export Skill**: exportuje čistá veřejná data a HTML do projektu `CelloCoolClub`.
- **Release Skill**: hlídá třídenní rytmus, vybírá další `approved` kartu a spouští export/release.
- **Social Draft Skill**: připraví texty pro sociální sítě.
- **Bluesky Publish Skill**: publikuje potvrzený post na Bluesky a zapíše URL zpět do dat.

## 6. Nový požadavek: stažení skladby po vytvoření

Po vytvoření skladby v Suno musí Engine doplnit navazující krok stažení audia.

### Požadované chování

- Po úspěšném stisku Create se ke kartě uloží stav `suno_submitted`.
- Engine nastaví čekání na 3 minuty.
- Po čekání spustí kontrolu, zda je skladba v Suno hotová.
- Pokud je hotová, stáhne MP3 do staging složky.
- Doporučená staging složka:

```text
C:\Users\Vladimir\Documents\CelloCoolClubEngine\downloads\suno\
```

- Stažený soubor se pojmenuje podle karty:

```text
{cardId}-{slug}-{timestamp}.mp3
```

- Po stažení Engine nabídne tlačítko `Attach Downloaded Audio`.
- Po připojení audia se soubor zkopíruje do:

```text
C:\Users\Vladimir\Documents\CelloCoolClubEngine\assets\audio\
```

- Veřejný export pak zkopíruje audio do:

```text
C:\Users\Vladimir\Documents\CelloCoolClub\assets\audio\
```

### Stavové přechody

```text
draft
image_ready
music_needed
suno_submitted
suno_ready
audio_downloaded
ready_for_review
approved
posted
```

### Chybové chování

- Pokud skladba po 3 minutách ještě není hotová, Engine ukáže `Still generating` a nabídne další kontrolu za 60 sekund.
- Pokud Suno nabídne dvě varianty, Engine stáhne obě a označí je `variant-a` / `variant-b`.
- Pokud stažení selže, karta nesmí přejít do `ready_for_review`.
- Pokud není jisté, ke které kartě stažený soubor patří, zůstane ve staging složce a uživatel ho připojí ručně.

## 7. Výchozí texty ze souboru

Výchozí texty se nebudou psát ručně do UI. Engine je načte ze souboru.

### MVP zdroj

```text
C:\Users\Vladimir\Documents\CelloCoolClubEngine\data\clean-sources\prevert_komplet.md
```

### Požadavky

- Admin panel má při startu načíst dostupné soubory z `data/clean-sources/`.
- Uživatel zvolí zdrojový soubor v rozbalovacím menu.
- Pokud není nic vybráno, použije se poslední použitý zdroj nebo první nalezený podporovaný soubor.
- Podporovaný vstup pro MVP: Markdown/text s číslovanými básněmi.
- Parser musí vracet stabilní `sourceFile`, `sourceNumber`, `titles` a `texts`.
- Vytvořená karta si musí uložit vazbu na zdroj:

```json
{
  "sourceFile": "prevert_komplet.md",
  "sourceNumber": 12
}
```

## 8. MVP rozsah

MVP této další fáze je hotové, když:

- Uživatel vybere zdrojový soubor s texty.
- Uživatel zadá rozsah básní.
- Engine vytvoří drafty a Suno packety.
- Engine otevře Suno a připraví vytvoření skladby.
- Po vytvoření skladby počká cca 3 minuty.
- Engine stáhne hotové MP3 do `downloads/suno/`.
- Uživatel umí jedním tlačítkem připojit stažené audio ke kartě.
- Karta s připojeným audiem jde previewovat, schválit a exportovat do veřejného archivu.

## 9. Mimo rozsah MVP

- Plně nehlídané obcházení Suno UI.
- Výběr nejlepší hudební varianty podle AI poslechu.
- Automatické publikování na Instagram nebo TikTok.
- Přepis autorských básní bez lidského schválení.
- Produkční cloud deploy Engine.

## 10. Akceptační kritéria

- Zdrojový soubor lze načíst bez ručního kopírování textů do adminu.
- Dávka `1-3` vytvoří tři karty nebo tři Suno packety a jasně vypíše případné přeskočené položky.
- Každý Suno packet obsahuje `songTitle`, `lyrics`, `stylePrompt` a `targetUrl`.
- Po odeslání do Suno se u karty uloží čas odeslání.
- Po cca 3 minutách existuje lokální pokus o stažení.
- Stažený MP3 soubor je dohledatelný v `downloads/suno/`.
- Připojené audio se objeví v kartě a ve veřejném exportu.
- Karta bez audia nebo bez označení `silent card` nejde schválit.
- Žádný soukromý prompt, log ani lokální cesta se neexportuje do veřejného `data/cards.json`.

## 11. Otevřené otázky

- Má Engine stahovat automaticky první Suno variantu, obě varianty, nebo čekat na ruční výběr?
- Má staging složka `downloads/suno/` zůstat mimo git, nebo se má přesouvat jen finální audio do verzovaných assetů?
- Má být vytvoření skladby přes plnou browser automatizaci, nebo přes asistovaný clipboard workflow?
- Má dávka pokračovat na další báseň až po stažení audia, nebo stačí odeslat všechny skladby a potom stahovat hotové kusy?
- Má být cílový jazyk pro dávku vždy výběr v UI, nebo má parser použít nejlepší dostupnou jazykovou verzi ze zdrojového souboru?

## 12. Doporučený další implementační krok

Nejmenší užitečný další krok:

1. Přidat složku `downloads/suno/` do `.gitignore`.
2. Přidat datová pole `sunoSubmittedAt`, `sunoDownloadedAt`, `downloadedAudioCandidates`.
3. Přidat API endpoint `POST /api/cards/:id/suno-submitted`.
4. Přidat API endpoint `POST /api/cards/:id/check-suno-download`.
5. Přidat v adminu tlačítko `Mark Suno Submitted` a `Check Download`.
6. Po stažení nabídnout `Attach Downloaded Audio`.

Tím vznikne praktický mezikrok: i když Suno UI bude křehké, Engine bude mít jasnou evidenci, staging složku a připojení hotového audia bez ručního hledání.
