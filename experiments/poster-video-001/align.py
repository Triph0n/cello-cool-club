"""Forced alignment versu na MP3: faster-whisper (word timestamps) + fuzzy mapovani na verse.
Vystup: timing.json s casem nastupu kazdeho verse.
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
AUDIO = r"C:\Users\Vladimir\Documents\CelloCoolClub\assets\audio\992-the-man-who-fed-the-pigeons.mp3"

VERSES = [
    "Every morning at seven", "on the market square", "an old man in a grey coat",
    "crumbled bread for the pigeons", "and the pigeons knew him", "the way one knows church bells",
    "Then came the sign", "FEEDING PIGEONS FORBIDDEN", "fine one thousand crowns",
    "signature illegible", "Next morning at seven", "the old man came",
    "sat down on the bench", "with empty hands", "entirely empty",
    "and the pigeons came all the same", "landed on his shoulders", "on his hat",
    "on his knees", "The clerk who had signed the sign", "watched from the town hall window",
    "on the third day he came down", "What are you feeding them? he asked sternly",
    "Nothing, said the man", "Then why do they come?", "And the old man smiled",
    "The bread, that was for you", "so you'd have something to forbid",
    "They never came here for bread", "they came here for me", "and against that",
    "you have no paragraph yet",
]

norm = lambda s: re.sub(r"[^a-z' ]", " ", s.lower()).split()

from faster_whisper import WhisperModel
model = WhisperModel("small", device="cpu", compute_type="int8")
segments, info = model.transcribe(AUDIO, word_timestamps=True, language="en")
words = []
for seg in segments:
    for w in seg.words or []:
        words.append({"w": norm(w.word)[0] if norm(w.word) else "", "t": w.start, "end": w.end})
words = [w for w in words if w["w"]]
print(f"transcribed {len(words)} words, duration {info.duration:.1f}s")
json.dump(words, open(os.path.join(ROOT, "words.json"), "w"), indent=1)

# --- dynamicke programovani: zarovnej sekvenci slov versu na sekvenci rozpoznanych slov ---
vwords = []           # (verse_idx, word)
for vi, v in enumerate(VERSES):
    for w in norm(v):
        vwords.append((vi, w))

N, M = len(vwords), len(words)
GAP_V, GAP_W, MIS = 1.0, 0.35, 1.2   # cena vynechani verse-slova / navic slova / zameny
import numpy as np
D = np.zeros((N + 1, M + 1))
B = np.zeros((N + 1, M + 1), dtype=np.int8)
D[:, 0] = np.arange(N + 1) * GAP_V
D[0, :] = np.arange(M + 1) * GAP_W
for i in range(1, N + 1):
    for j in range(1, M + 1):
        a, b = vwords[i - 1][1], words[j - 1]["w"]
        cost = 0.0 if a == b else (0.4 if (a[:3] == b[:3] and min(len(a), len(b)) >= 3) else MIS)
        opts = (D[i-1, j-1] + cost, D[i-1, j] + GAP_V, D[i, j-1] + GAP_W)
        k = int(np.argmin(opts))
        D[i, j], B[i, j] = opts[k], k
# traceback
i, j = N, M
assign = {}           # verse_idx -> [casy slov]
while i > 0 and j > 0:
    k = B[i, j]
    if k == 0:
        a, b = vwords[i - 1][1], words[j - 1]["w"]
        if a == b or (a[:3] == b[:3] and min(len(a), len(b)) >= 3):
            assign.setdefault(vwords[i - 1][0], []).append(words[j - 1]["t"])
        i, j = i - 1, j - 1
    elif k == 1:
        i -= 1
    else:
        j -= 1

starts = {}
for vi in range(len(VERSES)):
    ts = sorted(assign.get(vi, []))
    starts[vi] = ts[0] if ts else None
matched = sum(1 for v in starts.values() if v is not None)
print(f"matched {matched}/{len(VERSES)} verses")
# doplnit chybejici interpolaci
known = [(vi, t) for vi, t in starts.items() if t is not None]
for vi in range(len(VERSES)):
    if starts[vi] is None:
        before = [(v, t) for v, t in known if v < vi]
        after = [(v, t) for v, t in known if v > vi]
        if before and after:
            (v0, t0), (v1, t1) = before[-1], after[0]
            starts[vi] = t0 + (t1 - t0) * (vi - v0) / (v1 - v0)
        elif before: starts[vi] = before[-1][1]
        else: starts[vi] = after[0][1] if after else 0.0
# monotonie
prev = 0.0
for vi in range(len(VERSES)):
    if starts[vi] < prev: starts[vi] = prev
    prev = starts[vi]

out = [{"verse": vi + 1, "text": VERSES[vi], "t": round(starts[vi], 2)} for vi in range(len(VERSES))]
json.dump({"duration": info.duration, "verses": out}, open(os.path.join(ROOT, "timing.json"), "w"), indent=1)
for o in out:
    print(f"v{o['verse']:2d} {o['t']:7.2f}  {o['text']}")
