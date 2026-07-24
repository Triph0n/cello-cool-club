# Cello Cool Club — Dashboard

Přehled básní Cello Cool Clubu. Pro každou báseň: **název · dvě zvukové stopy (Suno A/B) ·
Suno prompt · poster + použité Bornovy reference · text básně**. Vše řízeno jedním indexem,
takže se s tím dá „mluvit přes Codexe" a dál generovat.

## Spuštění

```bash
cd dashboard
node serve.mjs        # -> http://localhost:8790
```

(Otevřít `index.html` přímo přes `file://` nejde — prohlížeč nesmí načíst `index.json`
lokálně. Vždy přes `node serve.mjs`.)

## Jediný zdroj pravdy: `index.json`

Dashboard po načtení jen vykresluje `index.json`. Chceš něco změnit → uprav `index.json`
(ručně nebo řekni Codexovi) a obnov stránku. Nic se negeneruje v HTML.

### Schéma jedné básně

```jsonc
{
  "id": "001",
  "slug": "the-man-who-fed-the-pigeons",
  "title": "The Man Who Fed the Pigeons",
  "language": "en",
  "source": "prevert_fable_english.md #001",
  "poemText": ["verš 1", "verš 2", "", "..."],       // "" = prázdný řádek/sloka
  "suno": {
    "prompt": "Style prompt: ...",                    // prompt, kterým vznikne hudba
    "promptSource": "buildSunoPrompt (engine)",
    "status": "prompt-ready"                           // prompt-ready | generating | done
  },
  "audio": {
    "variantA": { "file": null, "label": "Suno A", "sunoUrl": null },  // 2 Suno varianty
    "variantB": { "file": null, "label": "Suno B", "sunoUrl": null }
  },
  "poster": {
    "file": "assets/posters/001-....png",
    "style": "Born litografie — ...",
    "prompt": "Study the attached lithographs ...",   // poster prompt (Gemini)
    "references": [                                    // Bornovy litografie použité na poster
      { "file": "assets/references/born-senatori.jpg", "name": "born-senatori",
        "assigned": false, "note": "navrzeno" }        // assigned:true => v UI "použito", false => "navrzeno"
    ]
  },
  "status": "poster-done, audio-pending"
}
```

## Časté úpravy (co říct Codexovi)

- **„Přiřaď audio A/B k básni 001"** → nahraj MP3 do `assets/audio/`, vlož názvy do
  `audio.variantA.file` a `audio.variantB.file`, přepni `suno.status` na `"done"`.
- **„Reference k holubům jsou born-radecky a born-senatori"** → uprav pole
  `poster.references` a nastav `"assigned": true`.
- **„Přegeneruj Suno prompt pro 002"** → přepiš `suno.prompt`
  (builder: `CelloCoolClubEngine/scripts/card-workflow.mjs` → `buildSunoPrompt`).
- **„Přidej třetí báseň"** → přidej další objekt do pole `poems` + zkopíruj poster/reference
  do `assets/`.

## Co je ve složce `assets/` (vše lokálně, self-contained)

- `posters/` — web-res postery (001, 002)
- `posters-hires/` — hi-res varianty z AI Studia (zatím jen 001, ~10 MB)
- `references/` — **všech 39 Bornových litografií** (celá knihovna, ne jen použité)
- `audio/` — nepoužívá se; audio se **nekopíruje**, bere se přímo z externí složky (viz níže)

### Audio: bere se z `CelloCoolClub/assets/audio`

Dashboard MP3 **nekopíruje** — přehrává je rovnou z
`C:\Users\Vladimir\Documents\CelloCoolClub\assets\audio` přes cestu `/ccc-audio/<soubor>`
(řeší `serve.mjs`). Do indexu tedy stačí vložit **název souboru**:

```jsonc
"audio": {
  "variantA": { "file": "900-mlecny-zub.mp3", "label": "Suno A", "sunoUrl": null },
  "variantB": { "file": "Mléčný zub.mp3",     "label": "Suno B", "sunoUrl": null }
}
```

Jiná složka? `CCC_AUDIO=... node serve.mjs`. Pro obě seed básně píseň zatím neexistuje → `file:null`.

Celá knihovna referencí je i v indexu (`referenceLibrary.files`) a v dashboardu dole jako
rozbalovací sekce „Knihovna Bornových referencí" — z ní vybíráš, které se u posteru použily.

## Odkud data pocházejí

- **Texty básní**: `CelloCoolClubEngine/data/clean-sources/prevert_fable_english.md`
- **Postery + poster prompty**: `Desktop/Born plakaty/vystupy/` (`prompty/*.txt`),
  zrcadlené v `CelloCoolClub/assets/posters/`
- **Suno prompty**: generuje `buildSunoPrompt` v enginu (jazz styl dle nálady básně)
- **Referenční knihovna** (39 Bornových litografií): `~/.claude/skills/suno-generator/references/`
- **Audio (Suno)**: generuje se skillem `suno-generator` (Chrome CDP → Suno) — 2 varianty na prompt

## Stav teď

Seed = 2 básně (poster série 001, 002). Mají **text + poster + poster prompt + Suno prompt**
a **navržené** reference. **Audio A/B zatím chybí** (prázdné sloty) — Suno se pro tyhle dvě
ještě negenerovalo. To je další krok.
