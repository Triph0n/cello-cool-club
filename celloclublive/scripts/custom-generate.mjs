// Generate a Suno song from explicit title/style/lyrics files (CelloClubLive project —
// NOT tied to engine cards.json). Mechanics copied verbatim from suno-generator's
// fable-generate.mjs (hard-won selectors), only the input source differs.
// Usage: node custom-generate.mjs <title> <styleFile> <lyricsFile> [--no-create]
import fs from "node:fs";
import { CDP } from "file:///C:/Users/Vladimir/.claude/skills/suno-generator/scripts/cdp.mjs";

const [, , title, styleFile, lyricsFile] = process.argv;
const noCreate = process.argv.includes("--no-create");
if (!title || !styleFile || !lyricsFile) {
  console.error("Usage: node custom-generate.mjs <title> <styleFile> <lyricsFile> [--no-create]");
  process.exit(2);
}
const stylePrompt = fs.readFileSync(styleFile, "utf8").replace(/^Style prompt:\s*/i, "").trim();
const lyrics = fs.readFileSync(lyricsFile, "utf8").trim();
if (stylePrompt.length > 1000) {
  console.error(`STYLE_TOO_LONG ${stylePrompt.length}/1000 — shorten ${styleFile}`);
  process.exit(2);
}

const cdp = await CDP.attach("suno");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!/\/create/.test(await cdp.eval("location.href"))) {
  await cdp.eval("location.href='https://suno.com/create'");
  await sleep(6500);
}

// Close the onboarding / "New feature" modal if present — confirmed 2026-08-18 it can
// silently absorb the first Create click and no song gets generated.
await cdp.eval("(()=>{const b=[...document.querySelectorAll('button')].find(e=>/^(Next|Got it)$/.test(e.textContent.trim()));if(b){b.click();return 'closed';}const x=document.querySelector('[aria-label=Close]');if(x){x.click();return 'closed-x';}return 'none';})()");
await sleep(500);

const STY = `(()=>{const h=[...document.querySelectorAll('*')].find(e=>e.children.length===0&&e.textContent.trim()==='Styles'&&e.getBoundingClientRect().width>0);if(!h)return null;const hy=h.getBoundingClientRect().y;return [...document.querySelectorAll('textarea')].filter(e=>{const r=e.getBoundingClientRect();return r.width>300&&r.y>hy&&r.y<hy+250}).sort((a,b)=>a.getBoundingClientRect().y-b.getBoundingClientRect().y)[0]||null})()`;
const isAdvanced = `(!!document.querySelector('[contenteditable="true"]') && !!${STY})`;
async function ensureAdvanced() {
  for (let i = 0; i < 8; i++) {
    if (await cdp.eval(isAdvanced)) return true;
    const r = await cdp.eval(`(()=>{const els=[...document.querySelectorAll('*')].filter(e=>e.textContent.trim()==='Advanced'&&e.getBoundingClientRect().width>0&&e.getBoundingClientRect().y<80);const el=els[els.length-1];if(!el)return null;const rc=el.getBoundingClientRect();return JSON.stringify({x:Math.round(rc.x+rc.width/2),y:Math.round(rc.y+rc.height/2)})})()`);
    if (r) { const p = JSON.parse(r); await cdp.click(p.x, p.y); }
    await sleep(1500);
  }
  return false;
}
if (!(await ensureAdvanced())) { console.log("NO_ADVANCED " + title); await cdp.screenshot("gen-fail.png"); cdp.close(); process.exit(1); }

await cdp.eval("(()=>{const b=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()==='Got it');if(b)b.click();return 1})()");

async function valueOf(finder) {
  return cdp.eval(`(()=>{const el=${finder};if(!el)return null;return (el.value!=null?el.value:el.textContent)||''})()`);
}

const LYR = `[...document.querySelectorAll('[contenteditable="true"]')].filter(e=>e.getBoundingClientRect().width>100).sort((a,b)=>b.getBoundingClientRect().height-a.getBoundingClientRect().height)[0]`;
const TIT = `[...document.querySelectorAll('input,textarea')].filter(e=>/Song Title/i.test(e.placeholder||'')&&e.getBoundingClientRect().width>0).sort((a,b)=>b.getBoundingClientRect().y-a.getBoundingClientRect().y)[0]||null`;

async function key(type, key, code, vk, modifiers = 0) {
  await cdp.send("Input.dispatchKeyEvent", { type, key, code, windowsVirtualKeyCode: vk, modifiers });
}
async function fillLyrics(text) {
  const want = text.replace(/\s+/g, " ").trim().slice(0, 30).toLowerCase();
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await cdp.eval(`(()=>{const el=${LYR};if(!el)return null;el.scrollIntoView({block:'center'});const rc=el.getBoundingClientRect();return JSON.stringify({x:Math.round(rc.x+rc.width/2),y:Math.round(rc.y+Math.min(rc.height/2,40))})})()`);
    if (!r) { await sleep(600); continue; }
    const c = JSON.parse(r);
    await cdp.click(c.x, c.y);
    await sleep(350);
    await key("keyDown", "a", "KeyA", 65, 2); await key("keyUp", "a", "KeyA", 65, 2);
    await sleep(150);
    await key("keyDown", "Delete", "Delete", 46); await key("keyUp", "Delete", "Delete", 46);
    await sleep(250);
    await cdp.send("Input.insertText", { text });
    await sleep(500);
    const v = ((await valueOf(LYR)) || "").replace(/\s+/g, " ").trim();
    if (v.slice(0, 30).toLowerCase() === want) return true;
    if (attempt === 3) console.log(`  lyrics readback len=${v.length} val="${v.slice(0,30)}"`);
  }
  return false;
}
async function fillInput(finder, text, label) {
  const want = text.replace(/\s+/g, " ").trim().slice(0, 25).toLowerCase();
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await cdp.eval(`(()=>{const el=${finder};if(!el)return null;el.scrollIntoView({block:'center'});const rc=el.getBoundingClientRect();return JSON.stringify({x:Math.round(rc.x+rc.width/2),y:Math.round(rc.y+Math.min(rc.height/2,20))})})()`);
    if (!r) { await sleep(600); continue; }
    const c = JSON.parse(r);
    await sleep(250);
    await cdp.click(c.x, c.y);
    await sleep(300);
    await key("keyDown", "a", "KeyA", 65, 2); await key("keyUp", "a", "KeyA", 65, 2);
    await sleep(150);
    await key("keyDown", "Delete", "Delete", 46); await key("keyUp", "Delete", "Delete", 46);
    await sleep(200);
    await cdp.send("Input.insertText", { text });
    await sleep(400);
    const v = ((await valueOf(finder)) || "").replace(/\s+/g, " ").trim();
    if (v.slice(0, 25).toLowerCase() === want) return true;
    if (attempt === 3) console.log(`  ${label} readback="${v.slice(0,30)}"`);
  }
  return false;
}

if (!(await fillLyrics(lyrics))) { console.log("LYRICS_FAIL " + title); await cdp.screenshot("gen-fail.png"); cdp.close(); process.exit(1); }
if (!(await fillInput(STY, stylePrompt, "styles"))) { console.log("STYLE_FAIL " + title); await cdp.screenshot("gen-fail.png"); cdp.close(); process.exit(1); }
const titleOk = await fillInput(TIT, title, "title");

const lyrV = ((await valueOf(LYR)) || "").replace(/\s+/g, " ").trim();
const styV = ((await valueOf(STY)) || "").replace(/\s+/g, " ").trim();
const titV = ((await valueOf(TIT)) || "").replace(/\s+/g, " ").trim();
const okLyr = lyrV.slice(0, 30).toLowerCase() === lyrics.replace(/\s+/g, " ").trim().slice(0, 30).toLowerCase();
const okSty = /inspired by the style/i.test(styV);
const okTit = titV.toLowerCase() === title.toLowerCase();
await cdp.screenshot("gen-filled.png");
if (!okLyr || !okSty) { console.log(`FIELDS_BAD ${title} lyr=${okLyr} sty=${okSty} tit=${okTit} | styVal="${styV.slice(0,40)}"`); await cdp.screenshot("gen-fail.png"); cdp.close(); process.exit(1); }
if (!okTit) console.log(`WARN_title ${title} got="${titV.slice(0,40)}"`);

if (noCreate) { console.log(`FILLED_OK ${title} | tit=${okTit}`); cdp.close(); process.exit(0); }

const cbtn = await cdp.eval(`(()=>{const b=[...document.querySelectorAll('button')].find(e=>/^Create$/.test(e.textContent.trim())&&e.getBoundingClientRect().width>100&&!e.disabled);if(!b)return null;const rc=b.getBoundingClientRect();return JSON.stringify({x:Math.round(rc.x+rc.width/2),y:Math.round(rc.y+rc.height/2)})})()`);
if (!cbtn) { console.log("CREATE_DISABLED " + title); await cdp.screenshot("gen-fail.png"); cdp.close(); process.exit(1); }
const cp = JSON.parse(cbtn);
await cdp.click(cp.x, cp.y);
await sleep(4500);
await cdp.screenshot("gen-after.png");
console.log(`CREATED ${title}`);
console.log("NOTE: do not reload/navigate this tab now — Suno needs the live tab to register the job.");
console.log("Poll with a separate CDP connection (do not close this one) for the workspace item to stop spinning.");
cdp.close();
