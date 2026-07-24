// Exact-title variant of Desktop/suno-generator/scripts/download-one.mjs.
// It uses the skill's CDP driver but targets aria-label="Search clips" and
// derives the result-row Y coordinate from the requested visible title.
import fs from "node:fs";
import { CDP } from "file:///C:/Users/Vladimir/Desktop/suno-generator/scripts/cdp.mjs";

const title = process.argv[2];
const rowIndex = Number(process.argv[3] || 0);
const downloadDir = "C:/Users/Vladimir/Downloads";

if (!title) {
  console.error("Usage: node download-one-exact.mjs \"Exact title\" [rowIndex]");
  process.exit(2);
}

const before = new Set(
  fs.readdirSync(downloadDir).filter((file) => file.endsWith(".mp3")),
);
const cdp = await CDP.attach("suno");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function key(type, key, code, virtualKeyCode, modifiers = 0) {
  await cdp.send("Input.dispatchKeyEvent", {
    type,
    key,
    code,
    windowsVirtualKeyCode: virtualKeyCode,
    modifiers,
  });
}

async function escape() {
  await key("keyDown", "Escape", "Escape", 27);
  await key("keyUp", "Escape", "Escape", 27);
}

async function centerOf(expression) {
  const result = await cdp.eval(
    `(()=>{const el=${expression};if(!el)return null;const r=el.getBoundingClientRect();if(!r.width)return null;return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)})})()`,
  );
  return result ? JSON.parse(result) : null;
}

const search = `document.querySelector('input[aria-label="Search clips"]')`;
const searchPoint = await centerOf(search);
if (!searchPoint) {
  console.log("NO_SEARCH_CLIPS");
  await cdp.screenshot("download-exact-fail.png");
  cdp.close();
  process.exit(2);
}

const existingSearch = await cdp.eval(`${search}.value`);
if (existingSearch !== title) {
  await cdp.click(searchPoint.x, searchPoint.y);
  await key("keyDown", "a", "KeyA", 65, 2);
  await key("keyUp", "a", "KeyA", 65, 2);
  await key("keyDown", "Delete", "Delete", 46);
  await key("keyUp", "Delete", "Delete", 46);
  await cdp.send("Input.insertText", { text: title });
  await sleep(5000);
  // Suno's virtualized result list can remain unmounted after a fresh search
  // until the page is painted. Capturing once forces that paint.
  await cdp.screenshot("download-exact-search.png");
  await sleep(1000);
}

const searchValue = await cdp.eval(`${search}.value`);
if (searchValue !== title) {
  console.log(`SEARCH_MISMATCH|${searchValue}`);
  await cdp.screenshot("download-exact-fail.png");
  cdp.close();
  process.exit(2);
}

let rows = [];
for (let attempt = 0; attempt < 60 && rows.length === 0; attempt += 1) {
  const titleRows = await cdp.eval(`(()=>{const wanted=${JSON.stringify(
    title.toLowerCase(),
  )};const ys=[...document.querySelectorAll('*')]
    .filter(e=>e.children.length===0&&e.offsetParent&&e.textContent.trim().toLowerCase()===wanted)
    .map(e=>{const r=e.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y+r.height/2),w:Math.round(r.width)}})
    .filter(r=>r.x>500&&r.y>80&&r.w>20)
    .sort((a,b)=>a.y-b.y);
  const unique=[];for(const row of ys){if(!unique.some(x=>Math.abs(x.y-row.y)<4))unique.push(row)}
  return JSON.stringify(unique)})()`);
  rows = JSON.parse(titleRows || "[]");
  if (rows.length === 0) await sleep(1000);
}
if (!rows[rowIndex]) {
  console.log(`NO_EXACT_ROW|${title}|rows=${rows.length}`);
  await cdp.screenshot("download-exact-fail.png");
  cdp.close();
  process.exit(2);
}

const rowY = rows[rowIndex].y;
await escape();
await escape();
await cdp.send("Input.dispatchMouseEvent", {
  type: "mouseMoved",
  x: Math.max(600, rows[rowIndex].x),
  y: rowY,
});
await sleep(600);

const buttonCoordinates = `(()=>{const buttons=[...document.querySelectorAll('button[aria-label="More options"]')].filter(b=>b.getBoundingClientRect().width>0);const button=buttons.sort((a,b)=>Math.abs(a.getBoundingClientRect().y+a.getBoundingClientRect().height/2-${rowY})-Math.abs(b.getBoundingClientRect().y+b.getBoundingClientRect().height/2-${rowY}))[0];if(!button)return null;const r=button.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)})})()`;

let menuOpen = false;
for (let attempt = 0; attempt < 8 && !menuOpen; attempt += 1) {
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: Math.max(600, rows[rowIndex].x),
    y: rowY,
  });
  await sleep(400);
  const pointValue = await cdp.eval(buttonCoordinates);
  if (!pointValue) continue;
  const point = JSON.parse(pointValue);
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: point.x,
    y: point.y,
  });
  await sleep(250);
  await cdp.click(point.x, point.y);
  for (let check = 0; check < 6 && !menuOpen; check += 1) {
    await sleep(400);
    menuOpen = await cdp.eval(
      `[...document.querySelectorAll('button')].some(e=>e.textContent.trim()==='Download'&&e.getBoundingClientRect().width>0)`,
    );
  }
  if (!menuOpen) await escape();
}

if (!menuOpen) {
  console.log("NO_MENU_BTN");
  await cdp.screenshot("download-exact-fail.png");
  cdp.close();
  process.exit(2);
}

const openSubmenu = `(()=>{const button=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()==='Download'&&e.getBoundingClientRect().width>0);if(!button)return false;const r=button.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;['pointerenter','pointerover','pointermove','mouseenter','mouseover','mousemove'].forEach(type=>button.dispatchEvent(type.startsWith('pointer')?new PointerEvent(type,{bubbles:true,clientX:x,clientY:y,pointerId:1,pointerType:'mouse'}):new MouseEvent(type,{bubbles:true,clientX:x,clientY:y})));return true})()`;

let mp3Point = null;
for (let attempt = 0; attempt < 4 && !mp3Point; attempt += 1) {
  await cdp.eval(openSubmenu);
  for (let check = 0; check < 6 && !mp3Point; check += 1) {
    await sleep(400);
    mp3Point = await centerOf(
      `[...document.querySelectorAll('*')].filter(e=>e.textContent.trim()==='MP3 Audio'&&e.getBoundingClientRect().width>0).sort((a,b)=>{const ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect();return ra.width*ra.height-rb.width*rb.height})[0]`,
    );
  }
}

if (!mp3Point) {
  console.log("NO_MP3_ITEM");
  await cdp.screenshot("download-exact-fail.png");
  cdp.close();
  process.exit(2);
}

await cdp.send("Input.dispatchMouseEvent", {
  type: "mouseMoved",
  x: mp3Point.x,
  y: mp3Point.y,
});
await sleep(300);
await cdp.eval(`(()=>{const el=[...document.querySelectorAll('*')].filter(e=>e.textContent.trim()==='MP3 Audio'&&e.getBoundingClientRect().width>0).sort((a,b)=>{const ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect();return ra.width*ra.height-rb.width*rb.height})[0];const target=el.closest('button,[role=menuitem],div')||el;const r=target.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;['pointerdown','pointerup','mousedown','mouseup','click'].forEach(type=>target.dispatchEvent(type.startsWith('pointer')?new PointerEvent(type,{bubbles:true,clientX:x,clientY:y,pointerId:1,pointerType:'mouse'}):new MouseEvent(type,{bubbles:true,clientX:x,clientY:y})));return true})()`);

let newFile = null;
for (let attempt = 0; attempt < 120; attempt += 1) {
  await sleep(1000);
  const now = fs.readdirSync(downloadDir);
  const fresh = now.filter(
    (file) => file.endsWith(".mp3") && !before.has(file),
  );
  if (fresh.length && !fresh.some((file) => now.includes(`${file}.crdownload`))) {
    newFile = fresh[0];
    break;
  }
}

await escape();

if (!newFile) {
  console.log("TIMEOUT_NO_FILE");
  cdp.close();
  process.exit(1);
}

const normalize = (value) =>
  value
    .replace(/\.mp3$/i, "")
    .replace(/ \(\d+\)$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
const matches = normalize(newFile) === normalize(title);
console.log(`${matches ? "DOWNLOADED" : "MISMATCH"}|${newFile}|expected=${title}`);
cdp.close();
process.exit(matches ? 0 : 3);
