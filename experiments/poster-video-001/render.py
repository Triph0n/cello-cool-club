"""Slozeni videa: stavy S00..S10 + stipple-dissolve prechody, stream do ffmpeg.

Casova osa z timing.json (t = zacatek reveal daneho stavu).
"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.abspath(__file__))
AUDIO = r"C:\Users\Vladimir\Documents\CelloCoolClub\assets\audio\992-the-man-who-fed-the-pigeons.mp3"
FPS = 30
W, H = 686, 1024          # orez na sudou sirku kvuli yuv420
DUR = 157.0

# (stav, zacatek_revealu, delka_revealu)
TIMELINE = [
    ("S00", None, None),          # vychozi prazdny papir
    ("S01", 0.50, 2.2),           # ornamenty
    ("S03", 4.64, 3.2),           # cela scena vc. prazdne lavicky ("on the market square")
    ("S04", 8.28, 2.5),           # stary pan ("an old man in a grey coat")
    ("S05", 13.48, 2.2),          # chleb + zvon ("crumbled bread")
    ("S06", 26.32, 3.0),          # cedule + razitko ("Then came the sign")
    ("S07", 66.50, 2.5),          # holubi A - ramena, klobouk ("came all the same")
    ("S08", 75.90, 2.0),          # holubi B - ruce, klin, lavicka ("on his knees")
    ("S09", 77.96, 2.2),          # urednicek ("The clerk who had signed")
    ("S10", 143.04, 2.4),         # pirko ("they came here for me")
]

def load_state(name):
    p = os.path.join(ROOT, "states", f"{name}.png")
    im = np.asarray(Image.open(p).convert("RGB"), dtype=np.float32)
    return im[:H, :W]

states = {name: load_state(name) for name, _, _ in TIMELINE}
print("states loaded")

# zabranit prekryvu prechodu: konec revealu N musi byt <= zacatek revealu N+1
for i in range(1, len(TIMELINE) - 1):
    n, t, d = TIMELINE[i]
    t2 = TIMELINE[i + 1][1]
    if t is not None and t2 is not None and t + d > t2 - 0.05:
        TIMELINE[i] = (n, t, max(0.6, t2 - 0.05 - t))
        print(f"zkracen reveal {n} na {TIMELINE[i][2]:.2f}s")

# reveal pole: nahodny stipple prah, jemne vyhlazeny
rng = np.random.default_rng(11)
Rfield = rng.random((H, W)).astype(np.float32)
Rfield = ndimage.gaussian_filter(Rfield, 1.1)
Rfield -= Rfield.min(); Rfield /= Rfield.max()

# footprinty prechodu (kde se stavy lisi)
trans = []   # (t_start, dur, prev_arr, next_arr, mask)
for i in range(1, len(TIMELINE)):
    name, t, d = TIMELINE[i]
    prev = states[TIMELINE[i - 1][0]]
    nxt = states[name]
    diff = np.abs(ndimage.gaussian_filter(prev - nxt, (1.5, 1.5, 0))).mean(axis=2)
    fp = diff > 4
    fp = ndimage.binary_dilation(fp, iterations=3)
    trans.append((t, d, prev, nxt, fp.astype(np.float32)))
    print(f"{name}: reveal @{t}s dur {d}s, footprint {int(fp.sum())} px")

SOFT = 0.22
def frame_at(t):
    # najdi aktivni prechod / stav
    cur = states["S00"]
    for (ts, d, prev, nxt, fp) in trans:
        if t < ts:
            break
        if t >= ts + d:
            cur = nxt
            continue
        p = (t - ts) / d
        p = p * p * (3 - 2 * p)                      # ease
        thr = p * (1 + SOFT) - SOFT                  # -SOFT..1
        a = np.clip((thr + SOFT - Rfield) / SOFT, 0, 1) * fp
        return prev + (nxt - prev) * a[:, :, None]
    return cur

out_mp4 = os.path.join(ROOT, "pilot-video.mp4")
cmd = ["ffmpeg", "-y",
       "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
       "-i", AUDIO,
       "-map", "0:v", "-map", "1:a",
       "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p",
       "-c:a", "aac", "-b:a", "192k", "-shortest",
       out_mp4]
proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
n_frames = int(DUR * FPS)
for f in range(n_frames):
    t = f / FPS
    fr = frame_at(t)
    proc.stdin.write(np.clip(fr, 0, 255).astype(np.uint8).tobytes())
    if f % 300 == 0:
        print(f"frame {f}/{n_frames} ({t:.0f}s)", flush=True)
proc.stdin.close()
proc.wait()
print("DONE:", out_mp4, os.path.getsize(out_mp4) // 1024, "KB")
