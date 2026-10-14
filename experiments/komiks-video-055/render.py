"""Slozeni videa: stavy + stipple-dissolve prechody, stream raw RGB do ffmpeg (zadne PNG sekvence).

Spousti se z pracovniho adresare projektu; cte ./manifest.json:
  audio      cesta k MP3
  size       [W, H] plakatu (orizne se na sude rozmery)
  timeline   [["S00", null, null], ["S01", 0.5, 2.2], ...]
             (stav, zacatek revealu v sekundach, delka revealu; prvni stav = vychozi)
  fps        volitelne, default 30
  fade_out   volitelne: sekundy stmivani na konci (0 = bez), fade_to = [r,g,b]
  duration   volitelne, default delka audia (z timing.json, jinak nutne zadat)
Stavy se ctou ze ./states/<NAZEV>.png, vystup ./pilot-video.mp4.
"""
import json, os, subprocess
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.getcwd()
MANIFEST = json.load(open(os.path.join(ROOT, "manifest.json"), encoding="utf-8"))
AUDIO = MANIFEST["audio"]
FPS = MANIFEST.get("fps", 30)
W0, H0 = MANIFEST["size"]
W, H = W0 - (W0 % 2), H0 - (H0 % 2)
if "duration" in MANIFEST:
    DUR = MANIFEST["duration"]
else:
    DUR = json.load(open(os.path.join(ROOT, "timing.json")))["duration"]
TIMELINE = [tuple(x) for x in MANIFEST["timeline"]]
FADE = float(MANIFEST.get("fade_out", 0) or 0)
FADE_TO = np.array(MANIFEST.get("fade_to", [0, 0, 0]), dtype=np.float32)

def load_state(name):
    p = os.path.join(ROOT, "states", f"{name}.png")
    im = np.asarray(Image.open(p).convert("RGB"), dtype=np.float32)
    return im[:H, :W]

states = {name: load_state(name) for name, _, _ in TIMELINE}
print("states loaded:", len(states))

for i in range(1, len(TIMELINE) - 1):
    n, t, d = TIMELINE[i]
    t2 = TIMELINE[i + 1][1]
    if t is not None and t2 is not None and t + d > t2 - 0.05:
        TIMELINE[i] = (n, t, max(0.6, t2 - 0.05 - t))
        print(f"zkracen reveal {n} na {TIMELINE[i][2]:.2f}s")

rng = np.random.default_rng(11)
Rfield = rng.random((H, W)).astype(np.float32)
Rfield = ndimage.gaussian_filter(Rfield, 1.1)
Rfield -= Rfield.min(); Rfield /= Rfield.max()

trans = []
for i in range(1, len(TIMELINE)):
    name, t, d = TIMELINE[i]
    prev = states[TIMELINE[i - 1][0]]
    nxt = states[name]
    diff = np.abs(ndimage.gaussian_filter(prev - nxt, (1.5, 1.5, 0))).mean(axis=2)
    fp = ndimage.binary_dilation(diff > 4, iterations=3)
    trans.append((t, d, prev, nxt, fp.astype(np.float32)))
    print(f"{name}: reveal @{t}s dur {d}s, footprint {int(fp.sum())} px")

SOFT = 0.22
def frame_at(t):
    cur = states[TIMELINE[0][0]]
    for (ts, d, prev, nxt, fp) in trans:
        if t < ts:
            break
        if t >= ts + d:
            cur = nxt
            continue
        p = (t - ts) / d
        p = p * p * (3 - 2 * p)
        thr = p * (1 + SOFT) - SOFT
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
    if FADE and t > DUR - FADE:
        # linearni stmivani do podkladove barvy — pri fade do cerne by na svetlem
        # papiru problikla zmena tonu, proto se stmiva do barvy pozadi stavu
        k = min(1.0, (t - (DUR - FADE)) / FADE)
        fr = fr + (FADE_TO[None, None, :] - fr) * k
    proc.stdin.write(np.clip(fr, 0, 255).astype(np.uint8).tobytes())
    if f % 300 == 0:
        print(f"frame {f}/{n_frames} ({t:.0f}s)", flush=True)
proc.stdin.close()
proc.wait()
print("DONE:", out_mp4, os.path.getsize(out_mp4) // 1024, "KB")
