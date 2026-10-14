// Builds a local listening dashboard: only story-poem cards that have audio.
// Not published as an Artifact — audio is referenced via local file:// paths
// (embedding 560+ full songs as base64 would be gigabytes, way past any hosting limit).
import fs from "node:fs";
import path from "node:path";

const ROOT = "C:/Users/Vladimir/Documents/CelloCoolClub";
const cards = JSON.parse(fs.readFileSync(path.join(ROOT, "engine/data/cards.json"), "utf8"));
const storyMd = fs.readFileSync(path.join(ROOT, "assets/text/StoryPoems.md"), "utf8");

const storyTitles = new Set();
for (const line of storyMd.split("\n")) {
  const m = line.match(/^- \d+ — (.+)$/);
  if (m) storyTitles.add(m[1].trim().toLowerCase());
}

// Karty, ktere nejsou v StoryPoems.md, ale Vladimir je chtel na dashboardu pribehu
// (CelloCoolClubLive davka 2026-09-04).
const EXTRA_TITLES = ["The Weather Announcer", "The Wind and the Washing", "The Zero"];
for (const t of EXTRA_TITLES) storyTitles.add(t.toLowerCase());

const LIVE_ROOT = path.join(ROOT, "celloclublive");
function findLiveVersions(cardId) {
  const dirName = fs.existsSync(LIVE_ROOT)
    ? fs.readdirSync(LIVE_ROOT).find((d) => d.startsWith(cardId + "-"))
    : null;
  if (!dirName) return [];
  const dir = path.join(LIVE_ROOT, dirName);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mp3"));
  const byDecade = {};
  for (const f of files) {
    const m = f.match(/— (\d{4}) ?(v\d+)?\.mp3$/);
    if (!m) continue;
    const decade = m[1];
    const isV2 = !!m[2];
    // prefer the highest-numbered variant (v2 over plain) per decade
    if (!byDecade[decade] || (isV2 && !byDecade[decade].isV2)) {
      byDecade[decade] = { decade, isV2, file: f };
    }
  }
  return Object.values(byDecade)
    .sort((a, b) => Number(a.decade) - Number(b.decade))
    .map((v) => ({
      decade: v.decade,
      audioUrl: "file:///" + path.join(dir, v.file).replace(/\\/g, "/"),
    }));
}

const rows = cards
  .filter((c) => c.audio && c.audio.trim() !== "")
  .filter((c) => storyTitles.has((c.title || "").trim().toLowerCase()))
  .sort((a, b) => (a.number || 0) - (b.number || 0))
  .map((c) => ({
    id: c.id,
    number: c.number,
    title: c.title,
    season: c.season || "",
    audioUrl: "file:///" + path.join(ROOT, c.audio).replace(/\\/g, "/"),
    liveVersions: findLiveVersions(c.id),
  }));

fs.writeFileSync(path.join(ROOT, "experiments/story-audio-review/rows.json"), JSON.stringify(rows, null, 2));
console.log("rows:", rows.length);

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const liveHtml = (r) =>
  r.liveVersions.length
    ? `
        <div class="live">
          <span class="live-label">CelloCoolClubLive:</span>
          ${r.liveVersions
            .map(
              (v) => `
          <span class="live-item">
            <span class="live-decade">${esc(v.decade)}s</span>
            <audio controls preload="none" src="${esc(v.audioUrl)}"></audio>
          </span>`
            )
            .join("")}
        </div>`
    : "";

const rowsHtml = rows
  .map(
    (r) => `
      <li class="row" data-id="${esc(r.id)}" data-title="${esc(r.title.toLowerCase())}">
        <div class="meta">
          <span class="num">${esc(r.number)}</span>
          <span class="title">${esc(r.title)}</span>
          <span class="season">${esc(r.season)}</span>
        </div>
        <audio controls preload="none" src="${esc(r.audioUrl)}"></audio>
        <button class="pick" type="button" data-id="${esc(r.id)}" data-title="${esc(r.title)}">Vybrat</button>${liveHtml(r)}
      </li>`
  )
  .join("\n");

const html = `<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<title>Cello Cool Club — poslech příběhů</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root {
    --bg: #14110f;
    --panel: #1d1916;
    --ink: #f1e9dd;
    --ink-dim: #a89a86;
    --accent: #c98a3d;
    --accent-ink: #14110f;
    --line: #33291f;
    --picked-bg: #2a3a1e;
    --picked-line: #7fae3f;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--ink);
    font-family: -apple-system, "Segoe UI", Inter, sans-serif;
  }
  header {
    position: sticky;
    top: 0;
    z-index: 5;
    background: var(--bg);
    padding: 20px 24px 14px;
    border-bottom: 1px solid var(--line);
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    align-items: center;
  }
  h1 { font-size: 19px; margin: 0; font-weight: 600; letter-spacing: .01em; }
  .count { color: var(--ink-dim); font-size: 13.5px; font-variant-numeric: tabular-nums; }
  #filter {
    background: var(--panel);
    border: 1px solid var(--line);
    color: var(--ink);
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 14px;
    min-width: 220px;
  }
  .export {
    background: var(--accent);
    color: var(--accent-ink);
    border: none;
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
  }
  .export:active { transform: translateY(1px); }
  .onlyPicked {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--ink-dim);
    font-size: 13.5px;
  }
  main { max-width: 980px; margin: 0 auto; padding: 10px 24px 60px; }
  ul { list-style: none; margin: 0; padding: 0; }
  .row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 14px;
    align-items: center;
    padding: 12px 10px;
    border-bottom: 1px solid var(--line);
  }
  .row.hidden { display: none; }
  .row.picked { background: var(--picked-bg); border-radius: 8px; border-bottom-color: var(--picked-line); }
  .meta { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .num { font-size: 11px; color: var(--ink-dim); font-variant-numeric: tabular-nums; }
  .title { font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .season { font-size: 11px; color: var(--ink-dim); }
  audio { height: 34px; width: 260px; }
  .pick {
    background: transparent;
    border: 1px solid var(--line);
    color: var(--ink);
    padding: 7px 14px;
    border-radius: 7px;
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
  }
  .row.picked .pick {
    background: var(--picked-line);
    border-color: var(--picked-line);
    color: #14110f;
    font-weight: 600;
  }
  .live {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 16px;
    margin-top: 2px;
    padding: 8px 10px;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 8px;
  }
  .live-label { font-size: 11px; color: var(--ink-dim); white-space: nowrap; }
  .live-item { display: flex; align-items: center; gap: 8px; }
  .live-decade {
    font-size: 11px;
    color: var(--accent);
    border: 1px solid var(--accent);
    border-radius: 5px;
    padding: 1px 6px;
    white-space: nowrap;
  }
  .live audio { width: 210px; height: 30px; }
  @media (max-width: 700px) {
    .row { grid-template-columns: 1fr; }
    audio { width: 100%; }
    .live audio { width: 100%; }
  }
</style>
</head>
<body>
<header>
  <h1>Poslech příběhů</h1>
  <span class="count"><span id="pickedCount">0</span> / ${rows.length} vybráno</span>
  <input id="filter" type="text" placeholder="hledat v názvu…">
  <label class="onlyPicked"><input type="checkbox" id="onlyPicked"> jen vybrané</label>
  <button class="export" id="exportBtn" type="button">Exportovat vybrané</button>
</header>
<main>
  <ul id="list">
    ${rowsHtml}
  </ul>
</main>
<script>
  const STORE_KEY = 'ccc-story-audio-picked';
  const picked = new Set(JSON.parse(localStorage.getItem(STORE_KEY) || '[]'));
  const list = document.getElementById('list');
  const pickedCountEl = document.getElementById('pickedCount');
  const filterEl = document.getElementById('filter');
  const onlyPickedEl = document.getElementById('onlyPicked');

  function save() {
    localStorage.setItem(STORE_KEY, JSON.stringify([...picked]));
    pickedCountEl.textContent = picked.size;
  }

  function applyRowState(row) {
    const id = row.dataset.id;
    row.classList.toggle('picked', picked.has(id));
    const btn = row.querySelector('.pick');
    btn.textContent = picked.has(id) ? 'Vybráno ✓' : 'Vybrat';
  }

  list.querySelectorAll('.row').forEach(applyRowState);
  pickedCountEl.textContent = picked.size;

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.pick');
    if (!btn) return;
    const id = btn.dataset.id;
    if (picked.has(id)) picked.delete(id); else picked.add(id);
    applyRowState(btn.closest('.row'));
    save();
    if (onlyPickedEl.checked) applyFilter();
  });

  function applyFilter() {
    const q = filterEl.value.trim().toLowerCase();
    const onlyPicked = onlyPickedEl.checked;
    list.querySelectorAll('.row').forEach((row) => {
      const matchesText = !q || row.dataset.title.includes(q);
      const matchesPicked = !onlyPicked || picked.has(row.dataset.id);
      row.classList.toggle('hidden', !(matchesText && matchesPicked));
    });
  }
  filterEl.addEventListener('input', applyFilter);
  onlyPickedEl.addEventListener('change', applyFilter);

  document.getElementById('exportBtn').addEventListener('click', () => {
    const rows = [...list.querySelectorAll('.row')]
      .filter((row) => picked.has(row.dataset.id))
      .map((row) => \`\${row.dataset.id} — \${row.querySelector('.pick').dataset.title}\`);
    const text = rows.length ? rows.join('\\n') : '(nic není vybráno)';
    navigator.clipboard?.writeText(text).catch(() => {});
    alert('Vybráno ' + rows.length + ' písní (zkopírováno do schránky):\\n\\n' + text);
  });
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, "experiments/story-audio-review/index.html"), html);
console.log("written index.html");
