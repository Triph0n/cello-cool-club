"""Forced alignment versu na MP3 (faster-whisper word timestamps + DP zarovnani).

Spousti se z pracovniho adresare projektu; cte ./manifest.json:
  audio      absolutni cesta k MP3
  card       id karty v engine/data/cards.json (odtud poemText)
  cards_json volitelne: cesta ke cards.json
             (default C:/Users/Vladimir/Documents/CelloCoolClub/engine/data/cards.json)
Vystup: ./timing.json  {duration, verses: [{verse, text, t}]}
"""
import json, os, re

ROOT = os.getcwd()
MANIFEST = json.load(open(os.path.join(ROOT, "manifest.json"), encoding="utf-8"))
AUDIO = MANIFEST["audio"]
CARDS = MANIFEST.get("cards_json", r"C:\Users\Vladimir\Documents\CelloCoolClub\engine\data\cards.json")

cards = json.load(open(CARDS, encoding="utf-8"))
card = next(c for c in cards if str(c.get("id")) == str(MANIFEST["card"]))
VERSES = card["poemText"]
print(f"karta {MANIFEST['card']}: {len(VERSES)} versu")

norm = lambda s: re.sub(r"[^a-z' ]", " ", s.lower()).split()

from faster_whisper import WhisperModel
model = WhisperModel("small", device="cpu", compute_type="int8")
segments, info = model.transcribe(AUDIO, word_timestamps=True, language=card.get("language", "en"))
words = []
for seg in segments:
    for w in seg.words or []:
        toks = norm(w.word)
        if toks:
            words.append({"w": toks[0], "t": w.start, "end": w.end})
print(f"transcribed {len(words)} words, duration {info.duration:.1f}s")
json.dump(words, open(os.path.join(ROOT, "words.json"), "w"), indent=1)

import numpy as np
vwords = [(vi, w) for vi, v in enumerate(VERSES) for w in norm(v)]
N, M = len(vwords), len(words)
GAP_V, GAP_W, MIS = 1.0, 0.35, 1.2
D = np.zeros((N + 1, M + 1)); B = np.zeros((N + 1, M + 1), dtype=np.int8)
D[:, 0] = np.arange(N + 1) * GAP_V
D[0, :] = np.arange(M + 1) * GAP_W
for i in range(1, N + 1):
    for j in range(1, M + 1):
        a, b = vwords[i - 1][1], words[j - 1]["w"]
        cost = 0.0 if a == b else (0.4 if (a[:3] == b[:3] and min(len(a), len(b)) >= 3) else MIS)
        opts = (D[i-1, j-1] + cost, D[i-1, j] + GAP_V, D[i, j-1] + GAP_W)
        k = int(np.argmin(opts))
        D[i, j], B[i, j] = opts[k], k
i, j = N, M
assign = {}
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
print(f"matched {matched}/{len(VERSES)} verses" + ("" if matched == len(VERSES) else "  !! zkontroluj rucne"))
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
prev = 0.0
for vi in range(len(VERSES)):
    if starts[vi] < prev: starts[vi] = prev
    prev = starts[vi]

out = [{"verse": vi + 1, "text": VERSES[vi], "t": round(starts[vi], 2)} for vi in range(len(VERSES))]
json.dump({"duration": info.duration, "verses": out}, open(os.path.join(ROOT, "timing.json"), "w"), indent=1)
for o in out:
    print(f"v{o['verse']:2d} {o['t']:7.2f}  {o['text']}")
