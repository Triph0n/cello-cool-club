"""Vyrizne tesny blok z emblem plakatu (bez bileho okraje) a zmensi na cilovou sirku.
Pouziti: python badge.py <in.png> <out.png> <target_w>
Blok = ohranicena tmava oblast (prah na jas < 235 na sedotonu), inset 9 px dovnitr.
"""
import sys
import numpy as np
from PIL import Image

inp, outp, target_w = sys.argv[1], sys.argv[2], int(sys.argv[3])
im = Image.open(inp).convert("RGB")
arr = np.asarray(im, dtype=np.float32)
gray = arr.mean(axis=2)
dark = gray < 235
ys, xs = np.where(dark)
y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
inset = 9
y0, x0 = y0 + inset, x0 + inset
y1, x1 = y1 - inset, x1 - inset
block = im.crop((x0, y0, x1, y1))
w, h = block.size
target_h = round(target_w * h / w)
block = block.resize((target_w, target_h), Image.LANCZOS)
block.save(outp)
print(f"block bbox ({x0},{y0},{x1},{y1}) size {w}x{h} -> {target_w}x{target_h} saved {outp}")
