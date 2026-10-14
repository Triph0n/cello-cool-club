"""Poster-video toolkit pro Cello Cool Club pilot (plakat 001).

Subprikazy:
  plate                       -- syntetizuje cisty papir (plate.png) + detekuje blok (blockmask.png)
  fill --in A --out B --regions r1,r2   -- prekryje oblasti syntetickym papirem
  lock --prev P --edited E --gates g --out O   -- diff-lock: vezme z E jen zmenu v branach, zbytek z P
  diffmap A B OUT [--sigma S]  -- vizualizace rozdilu dvou stavu (QC)
"""
import argparse, json, os, sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = os.path.dirname(os.path.abspath(__file__))
POSTER = r"C:\Users\Vladimir\Documents\CelloCoolClub\assets\posters\001-the-man-who-fed-the-pigeons.png"
W, H = 687, 1024

MANIFEST = json.load(open(os.path.join(ROOT, "manifest.json"), encoding="utf-8"))
REGIONS = MANIFEST["regions"]
GATES = MANIFEST["gates"]

# ciste plochy papiru (x0,y0,x1,y1) -- zdroj zrna a validace povrchu
CLEAN = [(15, 15, 220, 95), (460, 15, 670, 95), (10, 740, 88, 1010),
         (608, 765, 680, 895), (60, 988, 640, 1018), (10, 110, 88, 265)]


def load(p):
    return np.asarray(Image.open(p).convert("RGB"), dtype=np.float64)


def save(arr, p):
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).save(p)


def paper_mask_full():
    """True = cisty papir (vse mimo blok a marginalie)."""
    m = np.ones((H, W), dtype=bool)
    for nm, (x0, y0, x1, y1) in REGIONS.items():
        pad = 26 if nm == "block" else 6   # u bloku sirsi okruh: tmavsi prstenec papiru u hrany
        m[max(0, y0-pad):y1+pad, max(0, x0-pad):x1+pad] = False
    return m


def fit_surface(im):
    """Nizkofrekvencni model papiru: nearest-fill z okraju + rozmazani."""
    pm = paper_mask_full()
    idx = ndimage.distance_transform_edt(~pm, return_indices=True)[1]
    filled = im[idx[0], idx[1]]
    return ndimage.gaussian_filter(filled, (40, 40, 0))


def grain_field(im, surf, seed=7):
    """Kvilting zrna z cistych ploch pres cely format."""
    rng = np.random.default_rng(seed)
    res = im - surf
    res = res - ndimage.gaussian_filter(res, (8, 8, 0))  # jen jemne zrno, zadne nizke frekvence
    cells, weights = np.zeros_like(im), np.zeros((H, W, 1))
    cell, step = 64, 48
    ramp = np.minimum(np.arange(cell)+1, cell-np.arange(cell))
    ramp = np.minimum(ramp / 16.0, 1.0)
    wnd = (ramp[:, None] * ramp[None, :])[:, :, None]
    for y0 in range(0, H, step):
        for x0 in range(0, W, step):
            px0, py0, px1, py1 = CLEAN[rng.integers(len(CLEAN))]
            sw, sh = px1-px0, py1-py0
            cw, ch = min(cell, W-x0), min(cell, H-y0)
            sx = px0 + rng.integers(max(1, sw-cw+1))
            sy = py0 + rng.integers(max(1, sh-ch+1))
            patch = res[sy:sy+min(ch, sh), sx:sx+min(cw, sw)]
            ph, pw = patch.shape[:2]
            if ph < ch or cw > pw:  # dorovnat zrcadlenim
                patch = np.pad(patch, ((0, ch-ph), (0, max(0, cw-pw)), (0, 0)), mode="reflect")
            patch = patch[:ch, :cw]
            wv = wnd[:ch, :cw]
            cells[y0:y0+ch, x0:x0+cw] += patch * wv
            weights[y0:y0+ch, x0:x0+cw] += wv
    return cells / np.maximum(weights, 1e-6)


def cmd_plate():
    im = load(POSTER)
    surf = fit_surface(im)
    plate = surf + grain_field(im, surf)
    save(plate, os.path.join(ROOT, "plate.png"))
    # validace: prumerna |residual| na cistych plochach (ocekavani ~amplituda zrna)
    for (x0, y0, x1, y1) in CLEAN:
        r = np.abs(im[y0:y1, x0:x1] - surf[y0:y1, x0:x1]).mean()
        print(f"clean patch {x0},{y0}: mean|res vs surf|={r:.2f}")


def region_mask(names):
    m = np.zeros((H, W), dtype=bool)
    for nm in names:
        x0, y0, x1, y1 = REGIONS[nm]
        m[y0:y1, x0:x1] = True
    return m


def feather(mask, sigma):
    return ndimage.gaussian_filter(mask.astype(np.float64), sigma)[:, :, None]


def cmd_fill(a):
    im = load(a.inp)
    plate = load(os.path.join(ROOT, "plate.png"))
    names = a.regions.split(",")
    m = feather(region_mask(names), 3.0)
    save(im*(1-m) + plate*m, a.out)
    print("filled", names, "->", a.out)


def phase_shift(a, b):
    """Posun (dy,dx), o ktery je nutne posunout b, aby sedelo na a."""
    A = np.fft.rfft2(a); B = np.fft.rfft2(b)
    R = A * np.conj(B)
    R /= np.abs(R) + 1e-9
    r = np.fft.irfft2(R, a.shape)
    dy, dx = np.unravel_index(np.argmax(r), r.shape)
    if dy > a.shape[0]//2: dy -= a.shape[0]
    if dx > a.shape[1]//2: dx -= a.shape[1]
    return dy, dx, r.max()


def cmd_lock(a):
    prev = load(a.prev)
    ed = Image.open(a.edited).convert("RGB")
    if ed.size != (W, H):
        ed = ed.resize((W, H), Image.LANCZOS)
    ed = np.asarray(ed, dtype=np.float64)
    ga = prev.mean(axis=2); gb = ed.mean(axis=2)
    dy, dx, peak = phase_shift(ga, gb)
    ed = np.roll(ed, (dy, dx), axis=(0, 1))
    print(f"align shift dy={dy} dx={dx} peak={peak:.3f}")
    pb = ndimage.gaussian_filter(prev, (1.6, 1.6, 0))
    eb = ndimage.gaussian_filter(ed, (1.6, 1.6, 0))
    d = np.abs(pb - eb).mean(axis=2)
    gate = np.zeros((H, W), dtype=bool)
    for g in a.gates.split(","):
        for (x0, y0, x1, y1) in GATES[g]:
            gate[y0:y1, x0:x1] = True
    m = (d > a.thr) & gate
    m = ndimage.binary_closing(m, np.ones((5, 5)))
    lab, n = ndimage.label(m)
    if n:
        sizes = ndimage.sum(m, lab, range(1, n+1))
        m = np.isin(lab, np.where(sizes >= 60)[0] + 1)
    m = ndimage.binary_dilation(m, iterations=a.dilate)
    m &= ndimage.binary_dilation(gate, iterations=8)
    cover = m.sum() / max(gate.sum(), 1)
    print(f"mask px={int(m.sum())} gate coverage={cover:.1%}")
    out_of_gate = (d > a.thr) & ~ndimage.binary_dilation(gate, iterations=12)
    print(f"zmeny mimo brany (px s diff>thr): {int(out_of_gate.sum())} (zahazuji se)")
    mf = feather(m, 2.5)
    save(prev*(1-mf) + ed*mf, a.out)
    viz = prev.copy()
    edge = ndimage.binary_dilation(m, iterations=2) & ~m
    viz[edge] = [255, 0, 0]
    save(viz, a.out.replace(".png", "-viz.png"))
    print("locked ->", a.out)


def cmd_scenefill(a):
    """Vyplni obdelnik texturou sceny: povrch nearest+blur JEN z domeny (vnitrek bloku),
    zrno kviltingem z explicitnich zdrojovych obdelniku (vybira se podle blizkosti v y)."""
    im = load(a.inp)
    x0, y0, x1, y1 = [int(v) for v in a.rect.split(",")]
    dx0, dy0, dx1, dy1 = [int(v) for v in a.domain.split(",")]
    valid = np.zeros((H, W), dtype=bool)
    valid[dy0:dy1, dx0:dx1] = True
    valid[y0:y1, x0:x1] = False
    if a.exclude:
        for spec in a.exclude.split(";"):
            ex = [int(v) for v in spec.split(",")]
            valid[ex[1]:ex[3], ex[0]:ex[2]] = False
    idx = ndimage.distance_transform_edt(~valid, return_indices=True)[1]
    filled = im[idx[0], idx[1]]
    surf = ndimage.gaussian_filter(filled, (28, 28, 0))
    res = im - ndimage.gaussian_filter(im, (8, 8, 0))
    sources = []
    for spec in a.sources.split(";"):
        sx0, sy0, sx1, sy1 = [int(v) for v in spec.split(",")]
        sources.append((sx0, sy0, sx1, sy1, (sy0 + sy1) / 2))
    rng = np.random.default_rng(23)
    cell, step, ov = 48, 36, 12
    ramp = np.minimum(np.arange(cell) + 1, cell - np.arange(cell))
    ramp = np.minimum(ramp / ov, 1.0)
    wnd = (ramp[:, None] * ramp[None, :])[:, :, None]
    grain = np.zeros_like(im)
    weight = np.zeros((H, W, 1))
    for cy in range(y0, y1, step):
        ch = min(cell, y1 - cy)
        yc = cy + ch / 2
        sx0, sy0, sx1, sy1, _ = min(sources, key=lambda s: abs(s[4] - yc))
        for cx in range(x0, x1, step):
            cw = min(cell, x1 - cx)
            sw, sh = sx1 - sx0, sy1 - sy0
            py = sy0 + rng.integers(max(1, sh - ch)) if sh > ch else sy0
            px = sx0 + rng.integers(max(1, sw - cw)) if sw > cw else sx0
            patch = res[py:py+min(ch, sh), px:px+min(cw, sw)]
            ph, pw = patch.shape[:2]
            if ph < ch or pw < cw:
                patch = np.pad(patch, ((0, ch - ph), (0, cw - pw), (0, 0)), mode="reflect")
            grain[cy:cy+ch, cx:cx+cw] += patch * wnd[:ch, :cw]
            weight[cy:cy+ch, cx:cx+cw] += wnd[:ch, :cw]
    gm = weight[:, :, 0] > 0
    grain[gm] /= weight[gm]
    synth = surf + grain
    m = np.zeros((H, W), dtype=bool)
    m[y0:y1, x0:x1] = True
    mf = feather(m, 3.0)
    save(im * (1 - mf) + synth * mf, a.out)
    print("scenefill", a.rect, "->", a.out)


def cmd_diffmap(a):
    A, B = load(a.a), load(a.b)
    d = np.abs(ndimage.gaussian_filter(A, (a.sigma, a.sigma, 0)) -
               ndimage.gaussian_filter(B, (a.sigma, a.sigma, 0))).mean(axis=2)
    print(f"max={d.max():.1f} mean={d.mean():.2f} px>12: {int((d>12).sum())}")
    heat = np.zeros((H, W, 3))
    heat[:, :, 0] = np.clip(d*6, 0, 255)
    heat[:, :, 1] = np.clip(d*2, 0, 255)
    save(heat, a.out)


p = argparse.ArgumentParser()
sub = p.add_subparsers(dest="cmd", required=True)
sub.add_parser("plate")
f = sub.add_parser("fill"); f.add_argument("--in", dest="inp", required=True)
f.add_argument("--out", required=True); f.add_argument("--regions", required=True)
l = sub.add_parser("lock"); l.add_argument("--prev", required=True)
l.add_argument("--edited", required=True); l.add_argument("--gates", required=True)
l.add_argument("--out", required=True); l.add_argument("--thr", type=float, default=16)
l.add_argument("--dilate", type=int, default=10)
d = sub.add_parser("diffmap"); d.add_argument("a"); d.add_argument("b")
d.add_argument("out"); d.add_argument("--sigma", type=float, default=1.6)
s = sub.add_parser("scenefill"); s.add_argument("--in", dest="inp", required=True)
s.add_argument("--out", required=True); s.add_argument("--rect", required=True)
s.add_argument("--exclude", default=""); s.add_argument("--domain", required=True)
s.add_argument("--sources", required=True)
a = p.parse_args()
{"plate": cmd_plate, "fill": cmd_fill, "lock": cmd_lock, "diffmap": cmd_diffmap,
 "scenefill": cmd_scenefill}[a.cmd](*([] if a.cmd == "plate" else [a]))
