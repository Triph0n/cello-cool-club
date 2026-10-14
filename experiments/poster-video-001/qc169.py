"""QC 16:9 videa: mrizka klicovych snimku + stabilita statickych vydrzi."""
import os, subprocess
import numpy as np
from PIL import Image

VID = "pilot-video-169.mp4"
os.makedirs("qc-frames", exist_ok=True)

def grab(t):
    p = os.path.join("qc-frames", f"qc169-{t:06.1f}.png")
    subprocess.run(["ffmpeg", "-y", "-ss", str(t), "-i", VID, "-frames:v", "1", p],
                   capture_output=True)
    return p

# mrizka 3x4
TS = [0.5, 3.0, 12.0, 28.0, 45.0, 63.5, 72.0, 90.0, 110.0, 128.0, 145.0, 155.0]
paths = [grab(t) for t in TS]
tile_w, tile_h = 480, 270
grid = Image.new("RGB", (tile_w * 4, tile_h * 3))
for i, p in enumerate(paths):
    im = Image.open(p).resize((tile_w, tile_h), Image.LANCZOS)
    grid.paste(im, ((i % 4) * tile_w, (i // 4) * tile_h))
grid.save(os.path.join("qc-frames", "grid169.png"))
print("grid: qc-frames/grid169.png")

# stabilita vydrzi: instrumentalni most (105 vs 120 s) a zaver (154 vs 156 s)
for t1, t2 in [(105.0, 120.0), (154.0, 156.0)]:
    a = np.asarray(Image.open(grab(t1)), dtype=np.float32)
    b = np.asarray(Image.open(grab(t2)), dtype=np.float32)
    print(f"hold {t1}-{t2}: mean|diff| = {np.abs(a - b).mean():.4f}")
