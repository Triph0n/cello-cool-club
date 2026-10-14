const wsUrl = process.argv[2];
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
};
function send(method, params = {}) {
  const myId = ++id;
  return new Promise((resolve) => {
    pending.set(myId, resolve);
    ws.send(JSON.stringify({ id: myId, method, params }));
    setTimeout(() => { if (pending.has(myId)) { pending.delete(myId); resolve({ error: "timeout" }); } }, 15000);
  });
}
console.log("enable:", JSON.stringify(await send("Page.enable")));
console.log("navigate:", JSON.stringify(await send("Page.navigate", { url: "https://gemini.google.com/app" })));
await new Promise(r => setTimeout(r, 3000));
console.log("eval:", JSON.stringify(await send("Runtime.evaluate", { expression: "location.href", returnByValue: true })));
ws.close();
