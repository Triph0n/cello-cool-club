// Download live-set MP3s straight from Suno's feed API instead of driving the workspace list.
//
// download-one.mjs works off the DOM: it types into the workspace search box and clicks the
// row's ⋯ menu at a fixed x. Both assumptions break once a batch is more than a screenful old —
// the search input is a controlled React field that ignores a programmatic value set, so the
// list stays unfiltered and the wanted row is simply not on screen (NO_EXACT_ROW, 2026-08-22).
// The feed endpoint returns every clip with a direct cdn1.suno.ai URL, so titles are matched
// exactly in JS and the file is fetched inside the authenticated page.
//
//   node feed-download.mjs <batch.txt>          # lines of "<cardDir>|<Card Title>"
//   node feed-download.mjs <batch.txt> 1930     # decade suffix, default 1920
//
// Existing files are kept; a card whose clip is still rendering is reported and skipped.
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { CDP } from "file:///C:/Users/Vladimir/.claude/skills/suno-generator/scripts/cdp.mjs";

const LIVE = "C:/Users/Vladimir/Documents/CelloCoolClub/celloclublive";
const [, , batchFile, decadeArg] = process.argv;
if (!batchFile) {
  console.error("Usage: node feed-download.mjs <batch.txt> [decade]");
  process.exit(1);
}
const decade = decadeArg || "1920";
const rows = fs
  .readFileSync(batchFile, "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => {
    const [dir, title] = l.split("|");
    return { dir, title };
  });

const cdp = await CDP.attach("suno.com");

const clipsRaw = await cdp.eval(`(async () => {
  const tok = await window.Clerk.session.getToken();
  const out = [];
  for (let page = 0; page < 6; page++) {
    const r = await fetch("https://studio-api.prod.suno.com/api/feed/v2?page=" + page, {
      headers: { Authorization: "Bearer " + tok },
    });
    const j = await r.json();
    if (!j.clips || !j.clips.length) break;
    // 2026-09-04: audio_url is now ".../api/forbidden" (new ToS download quota), cdn1 returns
    // AccessDenied and the CloudFront media_urls m4a is ENCRYPTED (no moov atom, random bytes).
    // Use api-download.mjs (official authorize + download endpoints) instead of this script.
    for (const c of j.clips) {
      const direct = c.audio_url && !/forbidden/.test(c.audio_url) ? c.audio_url : "";
      const media = (c.media_urls || []).find((m) => m.url) || null;
      out.push({ id: c.id, title: c.title, status: c.status, audio: direct || (media && media.url) || "", isM4a: !direct && !!media });
    }
  }
  return JSON.stringify(out);
})()`);
const clips = JSON.parse(clipsRaw);
console.log("feed clips:", clips.length);

let ok = 0;
const missing = [];
for (const { dir, title } of rows) {
  const full = `${title} — ${decade}`;
  const dest = path.join(LIVE, dir, `${full}.mp3`);
  if (fs.existsSync(dest)) {
    console.log("SKIP", full);
    ok++;
    continue;
  }
  const hit = clips.find((c) => c.title === full && c.status === "complete" && c.audio);
  if (!hit) {
    const pending = clips.some((c) => c.title === full);
    console.log("MISS", full, pending ? "(still rendering)" : "(not in feed)");
    missing.push(full);
    continue;
  }
  // fetch inside the page: the CDN accepts the request without extra auth, but doing it here
  // keeps everything on one connection and avoids a second cookie jar.
  const b64 = await cdp.eval(`(async () => {
    const r = await fetch(${JSON.stringify(hit.audio)});
    const b = new Uint8Array(await r.arrayBuffer());
    let s = "";
    for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    window.__mp3 = btoa(s);
    return window.__mp3.length;
  })()`);
  if (!b64 || typeof b64 !== "number") {
    console.log("FETCH_FAIL", full);
    missing.push(full);
    continue;
  }
  let data = "";
  for (let off = 0; off < b64; off += 500000) {
    data += await cdp.eval(`window.__mp3.slice(${off}, ${off + 500000})`);
  }
  const buf = Buffer.from(data, "base64");
  if (buf.length < 10000 || /AccessDenied/.test(buf.subarray(0, 300).toString())) {
    console.log("FETCH_DENIED", full, buf.length + " B");
    missing.push(full);
    continue;
  }
  if (hit.isM4a) {
    console.log("ENCRYPTED_STREAM", full, "- cloudfront m4a is DRM-encrypted; use api-download.mjs");
    missing.push(full);
    continue;
    const tmp = dest.replace(/\.mp3$/, ".m4a");
    fs.writeFileSync(tmp, buf);
    const res = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-i", tmp, "-codec:a", "libmp3lame", "-q:a", "2", dest], { stdio: "inherit" });
    if (res.status !== 0 || !fs.existsSync(dest)) { console.log("FFMPEG_FAIL", full); missing.push(full); continue; }
    fs.unlinkSync(tmp);
  } else {
    fs.writeFileSync(dest, buf);
  }
  console.log("OK", full, Math.round(fs.statSync(dest).size / 1024) + " KB" + (hit.isM4a ? " (m4a->mp3)" : ""));
  ok++;
}

console.log(`DONE ok=${ok} missing=${missing.length}${missing.length ? " :: " + missing.join(" | ") : ""}`);
process.exit(0);
