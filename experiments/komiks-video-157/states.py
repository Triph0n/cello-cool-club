"""Slozi stavy videa z policek komiksu — plocha, na kterou se policka tisknou.

Skill komiks-video, krok 3. Geometrie je zapsana pro 1920x1080 a skaluje se podle
`size`, takze nahled v 1280x720 vypada jako master, jen mensi.

Cte ./manifest.json + komiks.json v adresari komiksu + ./timing.json.
Vystup: ./states/S00.png .. SNN.png a doplneni klice `timeline` do manifestu.

Snimek je zamerne holy: policko, vers pod nim a dole jedina radka
"CELLO COOL CLUB · <karta>". Nahore nic — nazvy aktu, podtitul ani pocty stran do
videa nepatri, divak je nepotrebuje a berou obrazu ticho.

Prepinace v manifestu:
  theme         "papir" (slonovina) | "tma" (tmave pozadi) | "bila"   [default "tma"]
  frame         true/false — vlasova linka kolem policka                [default true]
  working_index true/false — poradove cislo policka v rohu (jen prototyp) [default true]
  panel_only    volitelne cislo policka: slozi jen ten jeden stav (rychla ukazka)
"""
import json, os, re
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.getcwd()
MAN = json.load(open(os.path.join(ROOT, "manifest.json"), encoding="utf-8"))
COMIC = MAN["comic"]
W, H = MAN["size"]
KOM = json.load(open(os.path.join(COMIC, "komiks.json"), encoding="utf-8"))

# ---- barevne polohy. `zrno` je amplituda sumu podkladu (papir ho chce, tma skoro ne)
THEMES = {
    "papir": {"bg": (236, 224, 196), "text": (36, 29, 22),  "tlum": (106, 90, 68),
              "linka": (58, 47, 34),   "index": (184, 135, 63), "zrno": 2.6},
    "tma":   {"bg": (23, 19, 16),    "text": (233, 223, 201), "tlum": (139, 124, 98),
              "linka": (86, 73, 56),   "index": (184, 135, 63), "zrno": 1.1},
    "bila":  {"bg": (250, 249, 246), "text": (28, 26, 24),   "tlum": (128, 122, 114),
              "linka": (60, 58, 54),   "index": (176, 130, 62), "zrno": 0.8},
}
TH = THEMES[MAN.get("theme", "tma")]
RAMECEK = MAN.get("frame", True)

# Geometrie i pisma jsou zapsane pro 1920x1080 a skaluji se — nahled se pak da
# vyrobit v 1280x720 a vypada presne jako master, jen mensi.
S = W / 1920
px = lambda v: int(round(v * S))

F = "C:/Windows/Fonts/"
f_cap   = ImageFont.truetype(F + "georgiai.ttf", px(34))   # vers pod polickem
f_pata  = ImageFont.truetype(F + "georgia.ttf", px(17))    # jedina radka dole
f_index = ImageFont.truetype(F + "georgia.ttf", px(23))    # pracovni cislo policka
f_titul = ImageFont.truetype(F + "georgia.ttf", px(74))

PLOCHA = tuple(px(v) for v in (206, 70, 1714, 830))  # kam se vejde policko
CAP_GAP = px(34)                 # mezera policko → vers
RADEK_CAP = px(44)
PATA_Y = px(1014)
STRED_Y = px(496)                # opticky stred skupiny policko+vers

def text_prostrkane(d, xy, s, font, fill, mezera=6, anchor="la"):
    sirka = sum(d.textlength(ch, font=font) + mezera for ch in s) - mezera
    x, y = xy
    if anchor == "ma": x -= sirka / 2
    elif anchor == "ra": x -= sirka
    for ch in s:
        d.text((x, y), ch, font=font, fill=fill)
        x += d.textlength(ch, font=font) + mezera

# ---- podklad: jedno zrno pro vsechny stavy, jinak mezi snimky sumi cela plocha
rng = np.random.default_rng(7)
zrno = rng.normal(0, TH["zrno"], (H, W, 1)).astype(np.float32)
POZADI = np.clip(np.array(TH["bg"], dtype=np.float32)[None, None, :] + zrno, 0, 255)
novy_arch = lambda: Image.fromarray(POZADI.astype(np.uint8), "RGB")

def pata(arch):
    d = ImageDraw.Draw(arch)
    text_prostrkane(d, (W / 2, PATA_Y), f"CELLO COOL CLUB · {MAN['card']}",
                    f_pata, TH["tlum"], max(2, px(5)), anchor="ma")

def rozmer_policka(cesta):
    im = Image.open(os.path.join(COMIC, cesta)).convert("RGB")
    bw, bh = PLOCHA[2] - PLOCHA[0], PLOCHA[3] - PLOCHA[1]
    s = min(bw / im.width, bh / im.height)
    return im, int(im.width * s), int(im.height * s)

def vsad(arch, cesta, radky, cislo):
    """Policko + vers pod nim, skupina opticky vycentrovana."""
    im, nw, nh = rozmer_policka(cesta)
    im = im.resize((nw, nh), Image.LANCZOS)
    vyska = nh + CAP_GAP + RADEK_CAP * len(radky)
    y = int(STRED_Y - vyska / 2)
    x = PLOCHA[0] + (PLOCHA[2] - PLOCHA[0] - nw) // 2
    arch.paste(im, (x, y))
    d = ImageDraw.Draw(arch)
    if RAMECEK:
        d.rectangle([x - 1, y - 1, x + nw, y + nh], outline=TH["linka"], width=1)
    for i, r in enumerate(radky):
        d.text((W / 2, y + nh + CAP_GAP + i * RADEK_CAP + RADEK_CAP / 2), r,
               font=f_cap, fill=TH["text"], anchor="mm")
    # Pracovni cislo policka — jen v prototypu, aby na nej slo pri opravach ukazat.
    if MAN.get("working_index", True):
        d.text((x - px(18), y + px(4)), f"{cislo:02d}", font=f_index, fill=TH["index"], anchor="ra")

# ---- policka v poradi cteni
policka = []
for strana in KOM["pages"]:
    for p in strana["panels"]:
        radky = []
        for c in p.get("caps", []):
            radky += c["text"].split("<br>")
        policka.append({"file": p["file"], "radky": radky})
print(f"policek: {len(policka)}  ·  theme={MAN.get('theme','tma')} frame={RAMECEK}")

os.makedirs(os.path.join(ROOT, "states"), exist_ok=True)

# rychla ukazka jednoho policka (nesklada zbytek ani timeline)
if MAN.get("panel_only"):
    i = int(MAN["panel_only"])
    arch = novy_arch(); pata(arch)
    vsad(arch, policka[i - 1]["file"], policka[i - 1]["radky"], i)
    out = os.path.join(ROOT, f"ukazka-{MAN.get('theme','tma')}-{'ramecek' if RAMECEK else 'bez'}.png")
    arch.save(out); print("ukazka:", out); raise SystemExit

# S00 — titul, bez podtitulu a bez poctu stran
arch = novy_arch(); pata(arch)
ImageDraw.Draw(arch).text((W / 2, STRED_Y), KOM["title"], font=f_titul,
                          fill=TH["text"], anchor="mm")
arch.save(os.path.join(ROOT, "states", "S00.png"))

for i, p in enumerate(policka, 1):
    arch = novy_arch(); pata(arch)
    vsad(arch, p["file"], p["radky"], i)
    arch.save(os.path.join(ROOT, "states", f"S{i:02d}.png"))
    print(f"S{i:02d} {os.path.basename(p['file'])}")

# ---- timeline: cas policka = cas jeho verse
TIM = json.load(open(os.path.join(ROOT, "timing.json"), encoding="utf-8"))
vt = [x["t"] for x in TIM["verses"]]

# Radky se na verse parujou PODLE TEXTU, ne podle poctu — jeden vers muze byt
# rozdeleny do dvou policek a naopak dva verse muzou byt pod jednim polickem.
_n = lambda s: re.sub(r"[^a-z ]", " ", s.lower())
norm = lambda s: re.sub(r"\s+", " ", _n(s)).strip()
vnorm = [norm(x["text"]) for x in TIM["verses"]]

def najdi(radek, od):
    n = norm(radek)
    for j in range(od, len(vnorm)):
        if n and n in vnorm[j]:
            return j
    return None

casy, vi = [], 0
for p in policka:
    radky = p["radky"] or [""]
    j = najdi(radky[0], vi)
    if j is None:
        print(f"!! vers k radku {radky[0]!r} nenalezen, beru cas predchoziho")
        j = vi
    casy.append(vt[j])
    posledni = najdi(radky[-1], j)
    vi = posledni if posledni is not None else j

# Dve policka na jeden vers dostanou stejny cas — druhe se posune do pulky mezery.
for i in range(1, len(casy)):
    if casy[i] <= casy[i - 1]:
        dalsi = next((c for c in casy[i + 1:] if c > casy[i - 1]), TIM["duration"])
        casy[i] = round(casy[i - 1] + (dalsi - casy[i - 1]) / 2, 2)
casy[0] = max(0.15, casy[0])

tl = [["S00", None, None]]
for i, t in enumerate(casy):
    dalsi = casy[i + 1] if i + 1 < len(casy) else TIM["duration"]
    tl.append([f"S{i+1:02d}", t, round(min(2.2, max(0.9, (dalsi - t) * 0.45)), 2)])
MAN["timeline"] = tl
MAN["fade_to"] = list(TH["bg"])          # do ceho stmivat na konci
MAN.setdefault("fade_out", 3.5)
json.dump(MAN, open(os.path.join(ROOT, "manifest.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=2)
print(f"timeline: {len(tl)} stavu, prvni reveal @{tl[1][1]}s, posledni @{tl[-1][1]}s")
print("stavy hotove")
