# CelloCoolClubLive III (karty 109–133) — stav 2026-08-22

Třetí desítka koncertních aranží (dekáda 1920). Kompletní: audio, text, prompty,
plakáty A/B/C, deska i dashboard.

Dashboard: https://claude.ai/code/artifact/c8ed7687-829c-4d5c-9b1e-f459272118ba

## Publikované desky

| karta | název | artifact |
|---|---|---|
| 109 | The Poem That Was Looking for a Reader | https://claude.ai/code/artifact/5089bc47-ceae-49e1-8692-655f330f74d8 |
| 110 | The Revolt of the Still Lifes | https://claude.ai/code/artifact/f2eb6af7-16a9-4362-bc14-cc248c0ee2da |
| 119 | The Revolt of the Furniture | https://claude.ai/code/artifact/598dd016-8ee8-4bf9-93f5-1005ddb6d8f9 |
| 121 | The Tool Conference | https://claude.ai/code/artifact/41438c59-33c5-40f7-a61a-1c9d37861d6c |
| 124 | The Revolt of the Adjectives | https://claude.ai/code/artifact/bbec8dd2-c388-4551-8767-a1efc1eb9cf7 |
| 129 | The Revolt of the Odd Numbers | https://claude.ai/code/artifact/bda09b51-6dba-4136-8438-81ee3807ea0c |
| 130 | The Merchant of First Words | https://claude.ai/code/artifact/77876e1b-da09-4f92-a8cc-cccc6ba7d838 |
| 131 | The Saints' Strike | https://claude.ai/code/artifact/b5036540-b7c1-46f3-a413-d6b037f36cc0 |
| 132 | The Tattooed Poem | https://claude.ai/code/artifact/a98bed18-bf73-441f-bad5-c9515df6aa9e |
| 133 | The Revolt of the Red Lights | https://claude.ai/code/artifact/f6e64ae5-0b1f-4c92-b89a-0b6eb6eff391 |

## Přegenerované plakáty (staré verze leží vedle jako `poster-X-v1.png`)

| karta | plakát | co bylo špatně |
|---|---|---|
| 110 | B | jablko vypadalo jako plochý logotyp, ne jako ovoce v litografii |
| 119 | B | otevřená dvířka skříně vyšla jako okno |
| 124 | C | Gemini vrátilo zpátky nahranou referenci (hustá městská scéna) místo nového obrázku; navíc původní zadání s dětskou slzou dvakrát skončilo na GENERATION_TIMEOUT, motiv přepsán na otevřenou dlaň se slzou |

## Poznámka k dávkovému generování

`experiments/run-posters-live.mjs` projde kolekce, přeskočí sloty, které už mají
`poster-X.png`, a po třech chybách po sobě skončí (denní limit obrázků v Gemini).
Kontrola se dělá kontaktními listy: `experiments/qc-sheet.mjs <out.png> <cardDir…>`
složí 5 karet × 3 sloty do jednoho PNG. Automatická detekce „vrácené reference"
přes perceptuální hash NEFUNGUJE — všechny plakáty sdílejí kompozici blok + bílý
okraj, takže vzdálenosti vycházejí podobně u dobrých i vadných. Musí se to vidět.
