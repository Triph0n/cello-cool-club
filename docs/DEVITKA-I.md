# Devítka — zastřešující koncept setů Cello Cool Clubu

*2026-08-02 — navazuje na PRD (rituál odhalování, sběratelský princip, sezóny) a na
experiment `police-devitka.html`. Grafický styl karet: born-emblem (schváleno na kartě 226).*

## Princip

Písně se nevydávají jednotlivě, ale v **devítkách** — malých uzavřených albech po devíti
deskách na jedné polici 3×3. Devítka je zároveň:

- **sbírka** — každá deska má obal (emblematický plakát), báseň a nahrávku,
- **rituál** — police se odemyká postupně: další deska se odemkne, až doposloucháš předchozí
  (mechanika z `police-devitka.html`: odemčená / duch prosvítající pod papírem / slepá ražba),
- **artefakt** — jedna police = jedna stránka s vlastní URL, kterou lze poslat, vyvěsit,
  nebo dát do bio profilu.

Proč devět: 3×3 mřížka má střed — každá devítka má **středovou kartu**, kolem které se
ostatních osm točí. Kompozičně i dramaturgicky.

## Distribuce (co pošlem lidem / vyvěsíme / přes profil)

1. **Pošleme lidem**: odkaz na polici (jedna URL). Příjemce vidí obálky, klikne, poslouchá;
   police si pamatuje postup (localStorage). Karta jednotlivé desky má vlastní URL —
   dá se poslat i jedna deska jako „pohlednice".
2. **Vyvěsíme**: každý obal je zároveň plakát (verze s bílým okrajem, 2:3) — tisknutelné
   přes `/poster-upscale`. Devítka = série devíti plakátů + desátý „obal setu" (police).
3. **Přes profil**: police je link-in-bio hub. Sociální posty podle PRD rytmu (jedna karta
   za tři dny = devítka vydrží ~měsíc), post = výřez emblému + dva verše + odkaz na kartu.
   Deváté odhalení odemkne celou polici — pointa měsíce.

## Default styl karty (závazné)

- Obraz: **born-emblem** (jeden emblematický motiv z pointy básně, tmavý matný litografický
  rastr, tmavá paleta ~1920 s jedním světelným akcentem; bílý okraj u plakátové verze,
  pro kartu se řeže čistý blok).
- Karta: layout `experiments/karta-226-le-dernier-client.html` — artwork nahoře dominantní,
  gramofonový medailon (bornovský gramofon `gramofon-icon-born.png`, NE starý klipart),
  číslo / sezóna, titul, celá báseň, audio ze Suna.
- Každý vygenerovaný obraz projde kontrolou čtyřcípé hvězdičky (`born-emblem/scripts/star-fix.ps1`).

## Devítka I — Nebeská rodina (The Celestial Household)

Prvních devět písní katalogu: osm planet (0002–0009) + Slunce (0016) uprostřed police.
Sluneční soustava jako činžák: uprostřed osamělý domácí, kolem nájemníci.

| pozice | č. | deska | emblém (pointa) | paleta |
|---|---|---|---|---|
| 1 | 0004 | Mercury, the Hurried Messenger | káča/vlček — půl rozžhavená, půl ojíněná | umbra tma, žhavý okr × ledová modř |
| 2 | 0008 | Venus, the Veiled Beauty | hedvábný plášť na krejčovské panně, pod ním žár pece | švestková tma, krémové zlato, žár rudé |
| 3 | 0009 | Earth, the Noisy House | modrá kulička-dům s rozsvícenými okny, jediný obydlený na ulici | půlnoční modř, lahvová zelená, okrová okna |
| 4 | 0003 | Mars, the Old Soldier | rezavá helma v rudém prachu, dvě ledové medaile, složená vojenská deka | rez, cihlová, sépie, bledě modrý led |
| 5 (střed) | 0016 | The Sun, the Lonely King | unavený král-slunce klesá za obzor jako dělník po šichtě, zlatá linka pod dveřmi | oheň: okr, staré zlato, rumělka, noc nahoře |
| 6 | 0002 | Jupiter, the Stormy King | královské nemrkající rudé oko v stuhách bouří, měsíčky-služebníčci kolem | okr, cihla, staré zlato, tma |
| 7 | 0006 | Saturn, the Sad Ballerina | balerínka v hrací skříňce, obruč z jíní a diamantů místo aplausu | perleť, stříbromodrá, švestková tma |
| 8 | 0007 | Uranus, the Silent Rebel | sud bledě modrozeleného vína ležící na boku, pavučinkové obruče | lagunová modrozelená, petrolej, sépie |
| 9 | 0005 | Neptune, the Lighthouse Keeper | maják s modrou lucernou na kraji tmy — „tady končí svět" | nejhlubší modře, petrolej, studené světlo |

Pořadí police = pořadí od Slunce čtené kolem středu; poslech se odemyká od Merkuru.
Slunce se odemkne jako poslední — král zůstává sám, dokud nevyslechneš celou rodinu.

**v2 (2026-08-03, schválený směr „udělej celé planety")**: emblémy z tabulky byly nahrazeny
**celými planetami** — každá deska nese kompletní kouli-postavu s atributy z básně (Jupiter =
koule bouřkových pásů s nemrkajícím okem, Mars = koule-veterán s helmou a dekou, Merkur =
koule se dvěma tvářemi, Saturn = koule-balerína s tutu-prstencem, Uran = spící koule na boku,
Venuše = koule v hedvábné róbě s ohnivým profilem, Země = koule-dům, Neptun = větrná koule
s majáčkem, Slunce = král s korunou a bandaskou). Původní objektové emblémy: `devitka-i/v1/`.

## Výhled

- Devítka II a dál: měsíce roku (0010+, 12 → dvě police po... nebo výběr 9), barvy (0020+),
  Time & Rooms výběr. Vždy: střed police = klíčová karta, 8 satelitů.
- Až se set schválí, přesun z `experiments/devitka-i/` do `cards/` + výměna gramo.png
  na všech ostrých kartách.
