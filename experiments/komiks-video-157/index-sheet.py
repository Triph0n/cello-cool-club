"""Skill komiks-video, krok 3 — prehled policek videa — cislo, cas, akt, vers, soubor. Podle cisel se pri opravach
ukazuje na konkretni policko ("prepis sedmicku"); stejne cislo je i na archu ve videu.

Spousti se z pracovniho adresare projektu, cte ./manifest.json + komiks.json + timeline.
Vystup: ./index-policek.png
"""
import json, os
from PIL import Image, ImageDraw, ImageFont

MAN = json.load(open("manifest.json", encoding="utf-8"))
KOM = json.load(open(os.path.join(MAN["comic"], "komiks.json"), encoding="utf-8"))
TL = {r[0]: r[1] for r in MAN["timeline"]}

F = "C:/Windows/Fonts/"
f_cislo = ImageFont.truetype(F + "georgiab.ttf", 34)
f_vers  = ImageFont.truetype(F + "georgiai.ttf", 19)
f_maly  = ImageFont.truetype(F + "georgia.ttf", 17)

policka = []
for strana in KOM["pages"]:
    for p in strana["panels"]:
        radky = []
        for c in p.get("caps", []):
            radky += c["text"].split("<br>")
        policka.append((p["file"], radky, strana["title"]))

COLS, CW, CH = 3, 600, 400
rows = (len(policka) + COLS - 1) // COLS
sheet = Image.new("RGB", (COLS * CW, rows * CH), (236, 224, 196))
d = ImageDraw.Draw(sheet)
for i, (f, radky, akt) in enumerate(policka, 1):
    im = Image.open(os.path.join(MAN["comic"], f)).convert("RGB")
    s = min(520 / im.width, 250 / im.height)
    im = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
    x0, y0 = (i - 1) % COLS * CW, (i - 1) // COLS * CH
    sheet.paste(im, (x0 + (CW - im.width) // 2, y0 + 66))
    d.text((x0 + 28, y0 + 22), f"{i:02d}", font=f_cislo, fill=(184, 135, 63))
    t = TL.get(f"S{i:02d}")
    d.text((x0 + 96, y0 + 32), f"{t:.2f} s  ·  {akt}", font=f_maly, fill=(106, 90, 68))
    d.text((x0 + CW // 2, y0 + 336), " / ".join(radky), font=f_vers, fill=(36, 29, 22), anchor="ma")
    d.text((x0 + CW // 2, y0 + 366), os.path.basename(f), font=f_maly, fill=(140, 124, 100), anchor="ma")
sheet.save("index-policek.png")
print("index-policek.png", sheet.size)
