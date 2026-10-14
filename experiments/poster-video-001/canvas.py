"""Papirove platno 1920x1080 pro 16:9 songbook: kvilting zrna z plate.png.

Cte ./plate.png (synteticky papir plakatu), vystup ./paper169.png.
Kvilting: nahodne bunky z desky, kosinusovy prechod v prekryvu 16 px.
"""
import numpy as np
from PIL import Image

W, H = 1920, 1080
CELL, STEP = 160, 144  # prekryv 16 px
MARG = 12              # nevzorkovat okraje desky

plate = np.asarray(Image.open("plate.png").convert("RGB"), dtype=np.float32)
ph, pw = plate.shape[:2]

# deska = hladky povrch + zrno; kviltuje se JEN zrno (povrch ma gradient,
# michani tonu z ruznych mist by delalo flekate platno)
from scipy import ndimage
surface = np.stack([ndimage.gaussian_filter(plate[:, :, c], 40) for c in range(3)], axis=2)
grain = plate - surface
print("surface span", (surface.max(axis=(0, 1)) - surface.min(axis=(0, 1))).round(2),
      "grain std", grain.std(axis=(0, 1)).round(2))

rng = np.random.default_rng(7)
acc = np.zeros((H, W, 3), dtype=np.float64)
wacc = np.zeros((H, W), dtype=np.float64)

ramp = np.ones(CELL, dtype=np.float64)
ov = CELL - STEP
r = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, ov))
ramp[:ov] = r
ramp[-ov:] = r[::-1]
win = np.outer(ramp, ramp)

for y0 in range(0, H, STEP):
    for x0 in range(0, W, STEP):
        ch = min(CELL, H - y0)
        cw = min(CELL, W - x0)
        sy = rng.integers(MARG, ph - MARG - ch)
        sx = rng.integers(MARG, pw - MARG - cw)
        src = grain[sy:sy + ch, sx:sx + cw]
        if rng.random() < 0.5:
            src = src[:, ::-1]
        if rng.random() < 0.5:
            src = src[::-1, :]
        w = win[:ch, :cw]
        acc[y0:y0 + ch, x0:x0 + cw] += src * w[:, :, None]
        wacc[y0:y0 + ch, x0:x0 + cw] += w

# povrch platna: edge-extend povrchu desky tak, aby na pozici plakatu
# (PX=64, PY=28) presne navazoval — jinak by u hrany byl tonalni schod
PXo, PYo = 64, (H - ph) // 2
surf169 = np.empty((H, W, 3), dtype=np.float32)
pady = ((PYo, H - PYo - ph), (PXo, W - PXo - pw), (0, 0))
surf169 = np.pad(surface, pady, mode="edge")
canvas = surf169 + acc / np.maximum(wacc, 1e-6)[:, :, None]
print("plate  mean", plate.mean(axis=(0, 1)).round(2), "std", plate.std(axis=(0, 1)).round(2))
print("canvas mean", canvas.mean(axis=(0, 1)).round(2), "std", canvas.std(axis=(0, 1)).round(2))
Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8)).save("paper169.png")
print("OK paper169.png")
