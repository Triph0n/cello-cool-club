"""Vyrez oblasti plakatu pro overeni souradnic (2x zvetsene, s popiskem)."""
from PIL import Image, ImageDraw
import sys, os

SRC = r"C:\Users\Vladimir\Documents\CelloCoolClub\assets\posters\001-the-man-who-fed-the-pigeons.png"
OUT = r"C:\Users\Vladimir\Documents\CelloCoolClub\experiments\poster-video-001\crops"
os.makedirs(OUT, exist_ok=True)

REGIONS = {
    "feather":        (25, 590, 105, 720),
    "bread":          (15, 280, 110, 375),
    "stamp_seal":     (575, 235, 680, 395),
    "bell":           (585, 585, 685, 720),
    "flourish_top":   (235, 20, 445, 105),
    "flourish_bottom":(210, 870, 465, 980),
    "left_squiggle":  (25, 410, 80, 490),
    "left_dash":      (30, 570, 80, 615),
    "right_squiggle": (595, 450, 660, 540),
    "right_below_bell":(595, 695, 665, 755),
    "star_suspect":   (545, 870, 640, 940),
    "clerk":          (470, 640, 580, 845),
    "sign_board":     (330, 125, 575, 400),
    "pole":           (415, 380, 495, 840),
}

im = Image.open(SRC).convert("RGB")
for name, (x0, y0, x1, y1) in REGIONS.items():
    c = im.crop((x0, y0, x1, y1))
    c = c.resize((c.width * 3, c.height * 3), Image.NEAREST)
    c.save(os.path.join(OUT, f"{name}.png"))
print("saved", len(REGIONS), "crops to", OUT)

# prehledova mapa s ramecky
ov = im.copy()
d = ImageDraw.Draw(ov)
for name, box in REGIONS.items():
    d.rectangle(box, outline=(255, 0, 0), width=2)
    d.text((box[0] + 2, box[1] + 2), name, fill=(255, 0, 0))
ov.save(os.path.join(OUT, "_overview.png"))
print("overview saved")
