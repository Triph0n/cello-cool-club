# Tři poslechové dashboardy

Spuštění: `open.ps1` otevře přehled a případně spustí místní server na portu 8793.

- http://127.0.0.1:8793/novy-vyber.html — devět dalších příběhů podle favoritů.
- http://127.0.0.1:8793/oblibene.html — deset Vladimírových favoritů. Potvrzeno: The Boy and the Echo (1074) a The Forgotten Umbrella (993).
- http://127.0.0.1:8793/barvy.html — osm jednotlivých barev v existujícím katalogu.

Přehledy obsahují původní text, základní MP3, existující Live MP3 a přiřazené postery. Audio se nekopíruje ani nekomprimuje. Náhledy obrázků se generují do `thumbs/`; klik otevírá plný zdrojový obrázek. Při spuštění další nahrávky se předchozí pozastaví.

Hledání ignoruje diakritiku. Označení karet se sdílí mezi třemi přehledy přes localStorage; tlačítko Uložit výběr exportuje označené položky aktuálního přehledu do Markdownu.

## Obnovení z aktuálních dat

Z tohoto adresáře: `node build.mjs`. Potom restartovat `node serve.mjs`, protože server načítá mapu médií při startu. Build využívá sharp z existujícího enginu.

Zdroj textů a audia: `engine/data/cards.json`. Postery: přes přesné engineCardId v `experiments/**/meta.json` a přes cardId v `dashboard/index.json`. Přiřazení není odhadované podle čísla posteru nebo podobnosti názvu. Chybějící postery jsou výslovně označené. Barevná plocha u karty bez posteru je pouze orientační značka, ne generovaný artwork.

`inventory.json` obsahuje ověřené počty. `assets.json` je lokální mapa existujících médií. Server poslouchá pouze na 127.0.0.1 a zpřístupňuje tři stránky, jejich náhledy a explicitní seznam médií; nepodává libovolné soubory projektu. Podporuje HTTP Range pro přeskakování v nahrávce.

Tyto dashboardy jsou místní pracovní přehledy, nejsou nasazené na veřejném webu a nemění stav publikace karet.

## Porovnání Five Story Posters (9. 9. 2026)

Soubor na ploše `Cello Cool Club - Five Story Posters.html` obsahuje 20 vložených JPEGů: čtyři obrazy ke kartám 1081, 370, 288, 372 a 435. Všechny byly vizuálně porovnány s PNG v projektu; jde o stejné obrazy. HTML má 520 × 775 px, původní PNG 687 × 1024 px. Dashboard ponechává větší PNG. U těchto pěti sad je uveden původ Five Story Posters.

Podklady a protokol jsou v `comparison/`. Označení v dashboardu se zobrazí pouze tehdy, pokud kontrolní součty současných PNG souhlasí s vizuálně ověřenými podklady. Přestavba tedy neoznačí budoucí změněný poster jako dříve ověřený.
