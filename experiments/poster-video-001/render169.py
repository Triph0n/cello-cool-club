"""16:9 songbook render: leva stranka = plakat (stavy + stipple reveal),
prava stranka = sazba versu synchronne s timing.json. Stream raw RGB do ffmpeg.

Cte ./manifest.json (timeline, audio, size), ./timing.json (verse casy),
./paper169.png (platno), ./states/*.png. Vystup ./pilot-video-169.mp4.
"""
import json, os, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

ROOT = os.getcwd()
MANIFEST = json.load(open(os.path.join(ROOT, "manifest.json"), encoding="utf-8"))
TIMING = json.load(open(os.path.join(ROOT, "timing.json"), encoding="utf-8"))
AUDIO = MANIFEST["audio"]
FPS = 30
CW, CH = 1920, 1080
W0, H0 = MANIFEST["size"]
PW, PH = W0 - (W0 % 2), H0 - (H0 % 2)   # 686 x 1024
PX, PY = 64, (CH - PH) // 2
DUR = TIMING["duration"]
TIMELINE = [tuple(x) for x in MANIFEST["timeline"]]

INK = np.array([50.0, 37.0, 15.0])
TEXT_X = 850
TEXT_XEND = 1856

# ---------- platno + plakat ----------
base = np.asarray(Image.open("paper169.png").convert("RGB"), dtype=np.float32)

def load_state(name):
    p = os.path.join(ROOT, "states", f"{name}.png")
    im = np.asarray(Image.open(p).convert("RGB"), dtype=np.float32)
    return im[:PH, :PW]

states = {name: load_state(name) for name, _, _ in TIMELINE}

for i in range(1, len(TIMELINE) - 1):
    n, t, d = TIMELINE[i]
    t2 = TIMELINE[i + 1][1]
    if t is not None and t2 is not None and t + d > t2 - 0.05:
        TIMELINE[i] = (n, t, max(0.6, t2 - 0.05 - t))

rng = np.random.default_rng(11)
Rp = ndimage.gaussian_filter(rng.random((PH, PW)).astype(np.float32), 1.1)
Rp -= Rp.min(); Rp /= Rp.max()

trans = []
for i in range(1, len(TIMELINE)):
    name, t, d = TIMELINE[i]
    prev = states[TIMELINE[i - 1][0]]
    nxt = states[name]
    diff = np.abs(ndimage.gaussian_filter(prev - nxt, (1.5, 1.5, 0))).mean(axis=2)
    fp = ndimage.binary_dilation(diff > 4, iterations=3)
    trans.append((t, d, prev, nxt, fp.astype(np.float32)))

# feather 24 px na okraji plakatu -> plynule vplyne do platna
fy = np.minimum(np.arange(PH), np.arange(PH)[::-1])[:, None]
fx = np.minimum(np.arange(PW), np.arange(PW)[::-1])[None, :]
FEATHER = np.clip(np.minimum(fy, fx) / 24.0, 0, 1).astype(np.float32)[:, :, None]

SOFT = 0.22
def poster_at(t):
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
        a = np.clip((thr + SOFT - Rp) / SOFT, 0, 1) * fp
        return prev + (nxt - prev) * a[:, :, None]
    return cur

# ---------- sazba ----------
F = r"C:\Windows\Fonts"
f_verse = ImageFont.truetype(os.path.join(F, "pala.ttf"), 36)
f_bold = ImageFont.truetype(os.path.join(F, "palab.ttf"), 36)
f_pointe = ImageFont.truetype(os.path.join(F, "palai.ttf"), 46)
f_title = ImageFont.truetype(os.path.join(F, "palai.ttf"), 52)
f_caps = ImageFont.truetype(os.path.join(F, "pala.ttf"), 26)
f_colo = ImageFont.truetype(os.path.join(F, "pala.ttf"), 24)

grain_rng = np.random.default_rng(23)

def typeset(text, font):
    """Vrati (alpha 0..1 float, w, h) — vyhlazeny glyf s tiskovou nerovnomernosti."""
    tmp = Image.new("L", (10, 10))
    d = ImageDraw.Draw(tmp)
    x0, y0, x1, y1 = d.textbbox((0, 0), text, font=font)
    w, h = x1 - x0 + 8, y1 - y0 + 8
    img = Image.new("L", (w, h), 0)
    ImageDraw.Draw(img).text((4 - x0, 4 - y0), text, font=font, fill=255)
    a = np.asarray(img, dtype=np.float32) / 255.0
    tex = ndimage.gaussian_filter(grain_rng.random((h, w)).astype(np.float32), 1.0)
    tex = (tex - tex.min()) / max(tex.max() - tex.min(), 1e-6)
    return a * (0.84 + 0.30 * tex), w, h

VERSES = TIMING["verses"]
STANZA_BREAK = {7, 11, 16, 20, 23, 26, 29}     # cislo verse, pred kterym je mezera
PAGES = [(1, 14), (15, 25), (26, 32)]
PAGE_LAYOUT = [(280, 50, 22), (285, 54, 22), (300, 60, 22)]  # y0, line_h, gap
REVEAL_D = 1.0
FADE_REST = 0.45

lines = []   # {A,w,h,x,y,t,page,rest}

# titulni blok (page None = nikdy nemizi)
A, w, h = typeset("C E L L O   C O O L   C L U B", f_caps)
lines.append(dict(A=A, w=w, h=h, x=TEXT_X, y=96, t=0.4, page=None, rest=0.55))
A, w, h = typeset("The Man Who Fed the Pigeons", f_title)
lines.append(dict(A=A, w=w, h=h, x=TEXT_X, y=138, t=0.7, page=None, rest=1.0))
rule = np.ones((3, 320), dtype=np.float32) * 0.85
lines.append(dict(A=rule, w=320, h=3, x=TEXT_X + 2, y=224, t=1.2, page=None, rest=0.7))

for pi, (v_lo, v_hi) in enumerate(PAGES):
    y0, lh, gap = PAGE_LAYOUT[pi]
    y = y0
    for v in VERSES:
        n = v["verse"]
        if not (v_lo <= n <= v_hi):
            continue
        if n in STANZA_BREAK and n != v_lo:
            y += gap
        font = f_bold if n == 8 else (f_pointe if n == 30 else f_verse)
        rest = 0.85 if n == 30 else FADE_REST
        A, w, h = typeset(v["text"], font)
        lines.append(dict(A=A, w=w, h=h, x=TEXT_X, y=y, t=v["t"], page=pi, rest=rest, verse=n))
        y += lh + (14 if n == 30 else 0)

A, w, h = typeset("no. 001", f_colo)
lines.append(dict(A=A, w=w, h=h, x=TEXT_XEND - w, y=1006, t=150.5, page=None, rest=0.5))

# prvni vers ma t=0.0 -> posun na 0.5 (at nezacina pred titulem)
for L in lines:
    if L.get("verse") == 1:
        L["t"] = 0.9

# fade na rest: kdyz zacne dalsi vers TEHOZ druhu (page not None)
verse_lines = sorted([L for L in lines if L["page"] is not None], key=lambda L: L["t"])
for i, L in enumerate(verse_lines):
    L["fade_t"] = verse_lines[i + 1]["t"] if i + 1 < len(verse_lines) else None

# page-out casy: tesne pred prvnim versem dalsi stranky
PAGE_OUT = {}
for pi in range(len(PAGES) - 1):
    t_next = min(L["t"] for L in verse_lines if L["page"] == pi + 1)
    PAGE_OUT[pi] = t_next - 1.15
PAGE_OUT_D = 0.9

# stipple pole pro text (globalni, oriznute per line)
Rt_full = ndimage.gaussian_filter(rng.random((CH, CW)).astype(np.float32), 1.1)
Rt_full -= Rt_full.min(); Rt_full /= Rt_full.max()
for L in lines:
    L["R"] = Rt_full[L["y"]:L["y"] + L["h"], L["x"]:L["x"] + L["w"]].copy()

def smooth(p):
    return p * p * (3 - 2 * p)

def compose_text(frame, t):
    for L in lines:
        if t < L["t"]:
            continue
        pi = L["page"]
        if pi is not None and pi in PAGE_OUT:
            if t >= PAGE_OUT[pi] + PAGE_OUT_D:
                continue
        # reveal
        p = min((t - L["t"]) / REVEAL_D, 1.0)
        if p >= 1.0:
            a_rev = None
        else:
            thr = smooth(p) * (1 + SOFT) - SOFT
            a_rev = np.clip((thr + SOFT - L["R"]) / SOFT, 0, 1)
        # fade na rest
        s = 1.0
        ft = L.get("fade_t")
        if ft is not None and t > ft:
            fp = min((t - ft) / 1.0, 1.0)
            s = 1.0 + (L["rest"] - 1.0) * smooth(fp)
        elif ft is None:
            s = L["rest"] if L["page"] is None and t > L["t"] + REVEAL_D + 1.5 else s
        # page-out (stipple ven)
        a_out = None
        if pi is not None and pi in PAGE_OUT and t >= PAGE_OUT[pi]:
            q = min((t - PAGE_OUT[pi]) / PAGE_OUT_D, 1.0)
            thr = smooth(q) * (1 + SOFT) - SOFT
            a_out = 1.0 - np.clip((thr + SOFT - L["R"]) / SOFT, 0, 1)
        a = L["A"] * s
        if a_rev is not None:
            a = a * a_rev
        if a_out is not None:
            a = a * a_out
        y, x, w, h = L["y"], L["x"], L["w"], L["h"]
        reg = frame[y:y + h, x:x + w]
        reg -= (reg - INK[None, None, :]) * a[:, :, None]
    return frame

# titulni radky: rest fade bez fade_t -> udelej pozvolna (uz vyreseno v s vetvi vyse)
for L in lines:
    if L["page"] is None:
        L["fade_t"] = L["t"] + REVEAL_D + 1.5

# ---------- symboly (Akt 1 pecet B, Akt 3 dialog symbolu C) ----------
# gutter mezi plakatem A (konci na PX+PW=750) a textovym sloupcem (TEXT_X=850) je
# cista neobsazena plocha -- pecet a symbolovy pár tam sedi jako marginalie, beze
# zmeny existujiciho layoutu sazby.
def load_badge(name, target_w):
    im = Image.open(os.path.join(ROOT, name)).convert("RGB")
    w, h = im.size
    th = round(target_w * h / w)
    return np.asarray(im.resize((target_w, th), Image.LANCZOS), dtype=np.float32)

badge_B = load_badge("badge-B.png", 86)
BX, BY = 760, 40
BH, BW = badge_B.shape[:2]

badge_C = load_badge("badge-C.png", 88)   # sirka jako badge B -- gutter konci na TEXT_X=850, nesmi prekryt sazbu
SX, SY = 760, 560   # "CX,CY" uz zabrane platnem 1920x1080
SH, SW = badge_C.shape[:2]

def badge_alpha(bh, bw, x, y, t, t_in, d_in, t_out=None, d_out=None):
    R = Rt_full[y:y + bh, x:x + bw]
    p_in = smooth(min(max((t - t_in) / d_in, 0.0), 1.0))
    thr = p_in * (1 + SOFT) - SOFT
    a = np.clip((thr + SOFT - R) / SOFT, 0, 1)
    if t_out is not None and t >= t_out:
        p_out = smooth(min((t - t_out) / d_out, 1.0))
        thr2 = p_out * (1 + SOFT) - SOFT
        a = a * (1.0 - np.clip((thr2 + SOFT - R) / SOFT, 0, 1))
    return a

def compose_badges(frame, t):
    a = badge_alpha(BH, BW, BX, BY, t, 0.2, 1.0)          # pecet: nastoupi pred v1, uz nemizi
    reg = frame[BY:BY + BH, BX:BX + BW]
    frame[BY:BY + BH, BX:BX + BW] = reg + (badge_B - reg) * a[:, :, None]

    a = badge_alpha(SH, SW, SX, SY, t, 101.0, 2.0, t_out=152.0, d_out=3.0)  # dialog: most -> odtisk v kolofonu
    reg = frame[SY:SY + SH, SX:SX + SW]
    frame[SY:SY + SH, SX:SX + SW] = reg + (badge_C - reg) * a[:, :, None]
    return frame

def frame_at(t):
    frame = base.copy()
    pf = poster_at(t)
    reg = frame[PY:PY + PH, PX:PX + PW]
    frame[PY:PY + PH, PX:PX + PW] = reg + (pf - reg) * FEATHER
    frame = compose_text(frame, t)
    return compose_badges(frame, t)

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "probe":
        os.makedirs("qc-frames", exist_ok=True)
        for t in [float(x) for x in sys.argv[2:]]:
            f = np.clip(frame_at(t), 0, 255).astype(np.uint8)
            p = os.path.join("qc-frames", f"probe169-{t:06.1f}.png")
            Image.fromarray(f).save(p)
            print("saved", p)
        sys.exit(0)

    out_mp4 = os.path.join(ROOT, "pilot-video-169.mp4")
    cmd = ["ffmpeg", "-y",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{CW}x{CH}", "-r", str(FPS), "-i", "-",
           "-i", AUDIO,
           "-map", "0:v", "-map", "1:a",
           "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p",
           "-c:a", "aac", "-b:a", "192k", "-shortest",
           out_mp4]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    n_frames = int(DUR * FPS)
    for f in range(n_frames):
        t = f / FPS
        proc.stdin.write(np.clip(frame_at(t), 0, 255).astype(np.uint8).tobytes())
        if f % 300 == 0:
            print(f"frame {f}/{n_frames} ({t:.0f}s)", flush=True)
    proc.stdin.close()
    proc.wait()
    print("DONE:", out_mp4, os.path.getsize(out_mp4) // 1024, "KB")
