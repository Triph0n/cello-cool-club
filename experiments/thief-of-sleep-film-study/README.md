# The Thief of Sleep — filmová studie 01

Nová režijní studie z existujících ilustrací, 16. 9. 2026.

Ústřední myšlenka: **stejné světlo mění význam**. Stuha spánku je nejdřív
kořistí, poté darem. Úleva dítěte nezbaví otce tíhy toho, co udělal.

## Výstupy

- `The-Thief-of-Sleep-film-study.mp4`: celá píseň, přibližně 87 sekund, 1280 × 720 / 24 fps.
- `The-Thief-of-Sleep-60s.mp4`: souvislá poslední minuta, od unaveného města k pointě.
- `index.html`: přehrávač s volitelnými anglickými titulky u celého filmu.
- `storyboard.jpg`: 12 záběrů a jejich nástupy.
- `manifest.json`: konkrétní dramaturgie, zdroje a časová osa.
- `lyrics.vtt`: titulky odvozené z uloženého časování slov a veršů.
- `film.py`: reprodukovatelná sazba, kompozice pohyblivého světla, render a kontroly.

## Režie

Převládají přímé střihy a dlouhé nehybné výdrže. Světlo se pohybuje jen
v ručně vymezených částech již namalované zlaté stuhy a pytle. Kresba se
nedeformuje, kamera nezoomuje a zrno nepulzuje na celém obrazu. Jediné delší
prolnutí je při usnutí dítěte. Obrazy unaveného města a závěrečného pokoje
zůstávají nehybné. Obraz 15 je použit před usnutím, protože dcera je v něm
ještě vzhůru. Obraz 12 ji již ukazuje spící, proto do této části nepatří.

Studie zkouší střih, výdrž, význam opakovaného motivu a jemný lokální světelný
pohyb. Není to dokončená figurální animace; ruce, obličeje a těla se nehýbou.
Případná další fáze by potřebovala samostatné vrstvy a nové mezifáze gest.

Zdroj: `../komiks-live-055-pages/panels/*.png`; nahrávka CelloCoolClubLive 1920,
karta 055. Zdrojové ilustrace, audio i starší komiksové video zůstávají beze změny.
První verze používala pouze původní ilustrace. Po připomínce uživatele byl
druhý záběr opraven přes vestavěný image_gen: obětí je nyní starší muž se
šedými vlasy, kulatou tváří a výrazným knírem, nikoli dvojník zloděje.
Nový zdroj: `artwork/04-taking-the-sleep-v2.png`. Přesný prompt leží vedle něj.
Originál komiksového políčka zůstává beze změny. Zvolená nahrávka je zatím
Live 1920; uživatel chce audio následně změnit, nová verze ještě není vybraná.

## Kontrola

`python film.py prepare` kontroluje pohyb uvnitř masek a přesnou stabilitu
závěrečné výdrže. `python film.py render` vyrábí obě videa.
`python film.py verify` kontroluje délku, přítomnost zvukové stopy, úplné
dekódování obou MP4 a vytváří kontaktní list ze skutečně zakódovaného videa.
Výsledky jsou v `qc/`. Časování je převzaté z dřívějšího zarovnání písně;
v této studii nebylo znovu nezávisle poslechově ověřeno.

Ověřeno 16. 9. 2026: oba soubory se kompletně dekódují bez chyby; délky
86,840 s a 60,000 s; obraz H.264 1280 × 720 / 24 fps, zvuk AAC. Vizuálně
zkontrolován `qc/encoded-contact.jpg`. Mimo masky světla se v šesti animovaných
záběrech mění přesně 0 pixelů nekomprimované kompozice; závěrečná výdrž je
pixelově stabilní. Porovnání zvuku ve 43.–48. sekundě s originálem má zjištěný
posun 0,000 s (korelace mono signálu při 8 kHz). Extrakce posledního snímku
do JPEG selhala; kontrola byla dokončena přes PNG ve chvíli 86,7 s.

Lokální přehrávač: http://127.0.0.1:8775 (server spuštěný jen na loopbacku).
Otevírání přes automatizovaný vestavěný prohlížeč skončilo timeoutem;
přehrávač byl následně předán panelu Codexu. HTTP odpověď ověřena: 200.
