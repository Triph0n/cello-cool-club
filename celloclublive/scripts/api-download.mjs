// CelloCoolClubLive: official Suno download flow (2026-09-04, new ToS download quota).
// Per clip: GET /api/download/clip/{id}?format=mp3 -> if not authorized, POST
// /api/download/authorize {item_id,item_type:"clip"} (consumes 1 plan download) -> GET again
// -> signed S3 download_url fetched from node straight into the card folder.
// Usage: node api-download.mjs <batch.txt> [decade]      (batch lines: <dir>|<Title>)
import fs from "node:fs";
import path from "node:path";
import { CDP } from "file:///C:/Users/Vladimir/.claude/skills/suno-generator/scripts/cdp.mjs";

const LIVE = "C:/Users/Vladimir/Documents/CelloCoolClub/celloclublive";
const [, , batchFile, decadeArg] = process.argv;
if (!batchFile) { console.error("Usage: node api-download.mjs <batch.txt> [decade]"); process.exit(2); }
const decade = decadeArg || "1920";
const rows = fs.readFileSync(batchFile, "utf8").split(/\r?\n/).filter(Boolean).map((l) => { const [dir, title] = l.split("|"); return { dir, title }; });

const cdp = await CDP.attach("suno.com");
const api = async (method, url, body) => JSON.parse(await cdp.eval(`(async()=>{const tok=await window.Clerk.session.getToken();const r=await fetch(${JSON.stringify(url)},{method:${JSON.stringify(method)},headers:{Authorization:'Bearer '+tok,'Content-Type':'application/json'},body:${body ? JSON.stringify(JSON.stringify(body)) : "undefined"}});const t=await r.text();return JSON.stringify({status:r.status,text:t})})()`));

const clips = JSON.parse(await cdp.eval(`(async()=>{const tok=await window.Clerk.session.getToken();const out=[];for(let p=0;p<6;p++){const r=await fetch('https://studio-api.prod.suno.com/api/feed/v2?page='+p,{headers:{Authorization:'Bearer '+tok}});const j=await r.json();if(!j.clips||!j.clips.length)break;for(const c of j.clips)out.push({id:c.id,title:c.title,status:c.status,unlocked:c.is_download_unlocked,dur:c.metadata&&c.metadata.duration});}return JSON.stringify(out)})()`));
console.log("feed clips:", clips.length);

let ok = 0; const missing = [];
for (const { dir, title } of rows) {
  const full = `${title} — ${decade}`;
  const dest = path.join(LIVE, dir, `${full}.mp3`);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 100000) { console.log("SKIP", full); continue; }
  const cands = clips.filter((c) => c.title === full && c.status === "complete");
  const hit = cands.find((c) => c.unlocked) || cands[0];
  if (!hit) { console.log("MISS", full, clips.some((c) => c.title === full) ? "(still rendering)" : "(not in feed)"); missing.push(full); continue; }
  const dlUrl = `https://studio-api.prod.suno.com/api/download/clip/${hit.id}?format=mp3`;
  let r = await api("GET", dlUrl);
  let j = JSON.parse(r.text || "{}");
  if (!j.ok) {
    const a = await api("POST", "https://studio-api.prod.suno.com/api/download/authorize", { item_id: hit.id, item_type: "clip" });
    console.log("  authorize:", a.status, a.text.slice(0, 160));
    r = await api("GET", dlUrl); j = JSON.parse(r.text || "{}");
  }
  // mp3 transcode runs after authorize ("processing"), and the API rate-limits bursts -> poll slowly
  for (let i = 0; i < 24 && !(j.ok && j.download_url); i++) {
    await new Promise((res) => setTimeout(res, 6000));
    r = await api("GET", dlUrl); j = JSON.parse(r.text || "{}");
    if (j.ok === false && j.reason !== "rate_limited") break;
  }
  if (!j.ok || !j.download_url) { console.log("NOT_AUTHORIZED", full, r.text.slice(0, 160)); missing.push(full); continue; }
  const res = await fetch(j.download_url);
  if (!res.ok) { console.log("FETCH_FAIL", full, res.status); missing.push(full); continue; }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 100000) { console.log("TOO_SMALL", full, buf.length); missing.push(full); continue; }
  fs.writeFileSync(dest, buf);
  console.log("OK", full, Math.round(buf.length / 1024) + " KB", hit.id.slice(0, 8), Math.round(hit.dur || 0) + "s");
  ok++;
  await new Promise((res) => setTimeout(res, 4000));
}
console.log(`DONE ok=${ok} missing=${missing.length}` + (missing.length ? " :: " + missing.join(" | ") : ""));
cdp.close();
