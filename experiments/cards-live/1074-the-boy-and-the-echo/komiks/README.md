# Komiks — The Boy and the Echo (karta 1074)

Vícestránkový komiks k živé kartě 1074, skill `born-comics`. Čtyři strany, osmnáct
políček, **celý text básně** (42 veršů) v rámečcích, plus závěrečný plátek s básní vcelku.

Artifact: https://claude.ai/code/artifact/50145e9f-8676-413d-a6a6-77134b56c2a6

## Strany

1. **The Valley** — kluk nad údolím, hory mlčí, ranní vyhubování, nádech (4 políčka)
2. **You Idiot** — výkřik, údolí se nadechne, ozvěna ze všech stran, pláč (5 políček)
3. **Grandpa** — dědeček s dýmkou, „zkus jim říct něco jinýho", hory jen opakují (4 políčka)
4. **I Love You** — kluk se postaví, nadechne, výkřik, návrat ze všech stran, večer (5 políček)

Paleta je stejná jako u plakátů karty: lahvová zeleň + petrolej + okr, kde okr je
**vyřčené slovo letící vzduchem** — jediná světlá věc v celém komiksu. Na prvních
čtyřech políčkách okr chybí úplně (ještě se nekřičelo) a na posledním doznívá.

## Přegenerovaná políčka

| políčko | co bylo špatně |
|---|---|
| `12-mountains-repeat` | místo skalní stěny se čtyřmi ochrovými pásy přišla surreální vana s rybami, mapou a nahou ženou — cizí obrázek, viz [[gemini-vraci-nahranou-referenci]]; prompt přepsán konkrétněji a s výslovným zákazem lidí, vody a interiéru |
| `15-breathes-in-down-to-his-boots` | třikrát po sobě `GENERATION_TIMEOUT` + `NO_IMAGE`, v chatu „unable to generate an image" — vadila absurdní formulace „breath drawn up out of the ground through his boots"; přepsáno na obyčejný popis postoje a prošlo na první pokus |

Originál zamítnutého políčka je v `archiv/`.

## Past, kvůli které to skoro nešlo

`born-generate.mjs` končil na `GENERATION_TIMEOUT`, i když se obrázek dorenderoval —
Gemini dává obrázek z cross-origin URL a renderuje pomaleji. `gen-panels.mjs` proto
po neúspěchu zkouší ještě `grab-image.mjs` (nechá soubor stáhnout sám prohlížeč).
Detaily ve skillu `born-poster`.
