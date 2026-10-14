import { CDP } from "file:///C:/Users/Vladimir/.claude/skills/suno-generator/scripts/cdp.mjs";
const cdp = await CDP.attach("suno");
const r = await cdp.eval(`(async()=>{const tok=await window.Clerk.session.getToken();const res=await fetch('https://studio-api.prod.suno.com/api/billing/info/',{headers:{Authorization:'Bearer '+tok}});const j=await res.json();delete j.credit_packs;delete j.download_credit_packs;if(j.plan)delete j.plan.prices;return JSON.stringify(j)})()`);
console.log(r);
cdp.close();
