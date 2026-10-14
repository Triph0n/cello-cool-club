# CelloCoolClubLive — co ještě zbývá (stav 2026-08-26)

**2026-08-26:** přibyla dvanáctá karta **1074 The Boy and the Echo** (posterNumber 081) —
všechny čtyři plakáty, tři dekádové nahrávky (1920/1930/1940), deska publikovaná,
dashboard přestavěn. Kvůli velikosti artifactu se přitom pro celou sadu přepočítalo
`audio-small.mp3` na 48 kbps a plakátové `.jpg` na 600 px / q80 — dashboard z 16,3 MB
na 14,3 MB.



Sada jedenácti koncertních aranží (157 The Last Word přidána 22. 8.). Devět karet má hotovou desku a publikovaný artifact, dvě čekají
na plakáty. Generování se zastavilo na denním limitu obrázků v Gemini
("I can create more images as soon as your limit resets"), ne na chybě pipeline.

## Chybí vygenerovat

| karta | plakát | proč |
|---|---|---|
| 029 The Revolt of the Fairy Tales | C | tři pokusy skončily na limitu |
| 035 The Song of the Chipped Cup | A, B, C | limit vyčerpán dřív, než na kartu došlo |

Pozor, od 2026-08-24 se `GENERATION_TIMEOUT` v `born-generate.mjs` NESMÍ číst jako
vyčerpaný limit — Gemini dává obrázek z cross-origin URL a renderuje pomaleji, takže
skript vytimeoutuje, i když se obrázek v tom chatu dorenderuje. Doplň za něj
`node scripts/grab-image.mjs <out.png> --must-contain "<úryvek promptu>"`, detaily
ve skillu `born-poster`.

## Doporučené přegenerování (kvalita, ne chyba)

| karta | plakát | co je špatně |
|---|---|---|
| 026 | C | Gemini nakreslilo černý rám kolem celé stránky — chybí čistý bílý okraj, který kompozice born-emblem předepisuje |
| 019 | B | blok je posazený moc nízko, dole zbývá ~27 px okraje proti 184 px nahoře |
| 025 | B | pečeť vypadá jako prázdná vosková placka, ne jako zašlápnutá žvýkačka |

## Jak v tom pokračovat

Chrome s CDP na portu 9222 a přihlášeným Gemini, pak:

```bash
cd ~/.claude/skills/born-poster
REF=/c/Users/Vladimir/Documents/CelloCoolClub/assets/poster-references
FACE=/c/Users/Vladimir/Documents/CelloCoolClub/assets/poster-face-references
D=/c/Users/Vladimir/Documents/CelloCoolClub/experiments/cards-live/035-the-song-of-the-chipped-cup

node scripts/newchat.mjs
node scripts/born-generate.mjs "$D/prompt-A.txt" "$D/poster-A.png" \
  "$REF/Born - Pohlednice z Taiwanu.jpg" "$REF/Born - Vecery na Loire.jpg" \
  "$REF/Born - Vlivy osmanske benatske a recke na Peloponesu (2012).jpg" \
  "$FACE/face-06-grandmother-profile.png" "$FACE/face-05-tall-haired-woman.png"
node scripts/clean-margin.mjs "$D/poster-A.png"   # smaže podpis, číslo edice, watermark v okraji
```

Které dvě face reference k té které kartě patří, je v `faces.txt` v každé složce.
Přegenerování už existujícího plakátu: nejdřív smazat `poster-X.png` (jinak dávkový skript
`scratchpad/run-posters.mjs` slot přeskočí) a starou verzi odložit jako `poster-X-v1.png`.

Po doplnění plakátů:

```bash
cd ~/.claude/skills/card-dashboard/scripts
node prep-assets.mjs <cardDir> && node build-deska.mjs <cardDir>
node build-dashboard.mjs /c/Users/Vladimir/Documents/CelloCoolClub/experiments/cards-live \
                         /c/Users/Vladimir/Documents/CelloCoolClub/experiments/cards-live/dashboard.html
```

Desku pak publikovat jako artifact a vrácenou URL zapsat do `meta.json` → `deskaUrl`;
dashboard publikovat na tutéž URL jako minule, ať odkaz vydrží.

Pozor na velikost: dashboard je teď 12,9 MB proti stropu 16 MB. Audio se do něj bere
z `audio-small.mp3` (mono 48 kbps); plné `audio.mp3` zůstává v desce.

## Publikované desky

| karta | artifact |
|---|---|
| 007 | https://claude.ai/code/artifact/20effd68-bdd5-4cda-b4b8-965e1605b25d |
| 009 | https://claude.ai/code/artifact/5e2064a6-d53b-44d6-98e6-2560b93cc93c |
| 012 | https://claude.ai/code/artifact/b1559da6-ac5e-41ac-afaf-4c79d5703cad |
| 014 | https://claude.ai/code/artifact/b0cbd9c8-3f32-428d-bfc0-30393e403948 |
| 018 | https://claude.ai/code/artifact/b3ec019b-ba5c-47e4-9e77-080c5cb5ea43 |
| 019 | https://claude.ai/code/artifact/9e6b76b1-624a-40be-a4a7-1081708dac2f |
| 025 | https://claude.ai/code/artifact/0fb51d9c-701a-483b-97c0-b8202d2652df |
| 026 | https://claude.ai/code/artifact/55c80188-3cf1-4bf8-adfa-17cb730999f0 |
| 157 | https://claude.ai/code/artifact/05384564-a32e-4d6f-8578-55681d8aada4 |
| dashboard | https://claude.ai/code/artifact/286dd2c6-3aed-4cd8-a448-0a9d62219b26 |
