# -*- coding: utf-8 -*-
"""Sestavi records.js pro prototyp gramodesky.

Bere jen zaznamy z crosswalk.json, ktere maji plakat + basen + audio.
Basne se parsuji ze sekci '## Cesky — …' a '## English — …' v poems/*.md.
"""
import json, os, re, io

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

def parse_poem(path):
    text = io.open(path, encoding='utf-8').read()
    poems, titles = {}, {}
    # sekce: ## Jazyk — TITUL ... az po dalsi '## ' nebo konec
    for m in re.finditer(r'^## (\S+)\s*(?:—\s*([^\n]*))?\n(.*?)(?=^## |\Z)', text, re.M | re.S):
        lang, title, body = m.group(1), m.group(2), m.group(3)
        key = {'Česky': 'cs', 'English': 'en', 'Français': 'fr'}.get(lang)
        if not key:
            continue
        body = body.split('\n---')[0]
        lines = [l.rstrip() for l in body.strip('\n').split('\n')]
        # orez uvodnich/koncovych prazdnych radku
        while lines and not lines[0]: lines.pop(0)
        while lines and not lines[-1]: lines.pop()
        poems[key] = lines
        if title:
            titles[key] = title.strip()
    return poems, titles

cw = json.load(io.open(os.path.join(ROOT, 'data', 'crosswalk.json'), encoding='utf-8'))['entries']
audio_files = os.listdir(os.path.join(ROOT, 'assets', 'audio'))
posters = set(os.listdir(os.path.join(ROOT, 'assets', 'posters')))

records = []
for key, v in cw.items():
    poster, poem_file, cid = v.get('poster'), v.get('poemFile'), v.get('cardId')
    if not (poster and poem_file and cid):
        continue
    if poster not in posters:
        continue
    poem_path = os.path.join(ROOT, 'poems', poem_file)
    if not os.path.exists(poem_path):
        continue
    matches = sorted(a for a in audio_files if a.startswith(cid + '-'))
    if not matches:
        continue
    poem, titles = parse_poem(poem_path)
    if 'en' not in poem:
        continue
    records.append({
        'canon': key,
        'title': v['displayTitle'],
        'titles': titles,
        'poemNumber': v.get('poemNumber', ''),
        'poster': '../../assets/posters/' + poster,
        'audio': '../../assets/audio/' + matches[0],
        'poem': poem,
    })

records.sort(key=lambda r: r['poemNumber'] or r['canon'])

out_path = os.path.join(os.path.dirname(__file__), 'records.js')
with io.open(out_path, 'w', encoding='utf-8') as f:
    f.write('const RECORDS = ')
    json.dump(records, f, ensure_ascii=False, indent=1)
    f.write(';\n')
print('records:', len(records), '->', out_path)
