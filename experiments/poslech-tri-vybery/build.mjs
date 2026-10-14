import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const HERE=path.dirname(fileURLToPath(import.meta.url)), ROOT=path.resolve(HERE,'../..');
const require=createRequire(path.join(ROOT,'engine/package.json')), sharp=require('sharp');
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const cards=read('engine/data/cards.json'), dashboard=read('dashboard/index.json').poems;
const collections=[
 {slug:'novy-vyber',title:'Další příběhy',subtitle:'Devět kandidátů podle tvých favoritů',ids:['321','390','371','280','432','299','255','423','374']},
 {slug:'oblibene',title:'Tvůj výběr',subtitle:'Deset oblíbených příběhů',ids:['157','1074','993','055','1081','370','288','372','435','395']},
 {slug:'barvy',title:'Barvy',subtitle:'Osm barev, osm vlastních hlasů',ids:['245','1016','231','229','232','230','228','233']}
];
const translations={'321':'Kohout, který zpíval pozdě','390':'Dvě kapky na okně','371':'Počítání ovcí','280':'Vnitrozemský maják','432':'Prasklý šálek','299':'Rozbité rádio','255':'Nevrácená kniha','423':'Veverka a zapomenuté ořechy','374':'Pauza v hudbě','157':'Poslední slovo','1074':'Chlapec a ozvěna','993':'Zapomenutý deštník','055':'Zloděj spánku','1081':'Hlasatel počasí','370':'Vítr a prádlo','288':'Studna','372':'Nula','435':'Čekárna','395':'Jeden deštník pro dva','245':'Bílá · všechno a nic','1016':'Černá · tajemství','231':'Červená · srdce','229':'Oranžová · soumrak','232':'Žlutá · smích','230':'Zelená · naděje','228':'Modrá · sny','233':'Fialová · kouzla'};
const colors={'245':'#ede4d1','1016':'#514a45','231':'#bc635c','229':'#ca925c','232':'#d4b45f','230':'#79a780','228':'#749ebe','233':'#ac88b2'};
const metadata=[];
function scan(dir,depth=0){if(depth>3)return;for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())scan(f,depth+1);else if(e.name==='meta.json'){try{const m=JSON.parse(fs.readFileSync(f));if(m.engineCardId)metadata.push({dir:path.dirname(f),...m});}catch{}}}}
scan(path.join(ROOT,'experiments'));
const assets={}, warnings=[];let serial=0;
function asset(file){const f=path.resolve(ROOT,file);if(!fs.existsSync(f)){warnings.push('Chybí '+file);return null;}const existing=Object.entries(assets).find(([,v])=>v===f);if(existing)return '/media/'+existing[0];const key=String(++serial)+path.extname(f).toLowerCase();assets[key]=f;return '/media/'+key;}
const comparisonPath=path.join(HERE,'comparison/report.json');
const comparison=fs.existsSync(comparisonPath)?JSON.parse(fs.readFileSync(comparisonPath,'utf8')):null;
const records={};fs.mkdirSync(path.join(HERE,'thumbs'),{recursive:true});
for(const id of collections.flatMap(x=>x.ids)){
 const c=cards.find(x=>x.id===id);if(!c)throw Error('Missing card '+id);
 const audio=[];if(c.audio){const url=asset(c.audio);if(url)audio.push({label:'Původní nahrávka',url});}
 const liveRoot=path.join(ROOT,'celloclublive');for(const dir of fs.readdirSync(liveRoot).filter(d=>d.startsWith(id+'-'))){for(const f of fs.readdirSync(path.join(liveRoot,dir)).filter(f=>f.endsWith('.mp3')).sort()){const url=asset(path.join(liveRoot,dir,f));audio.push({label:'Live · '+(f.match(/—\s*(.+)\.mp3$/)?.[1]||f),url});}}
 const posters=[];const seen=new Set();
 async function poster(file,label){const abs=path.resolve(ROOT,file);if(seen.has(abs)||!fs.existsSync(abs))return;seen.add(abs);const url=asset(abs);const thumb=`thumbs/${id}-${posters.length}.jpg`;await sharp(abs).rotate().resize({width:440,height:580,fit:'inside',withoutEnlargement:true}).jpeg({quality:82}).toFile(path.join(HERE,thumb));posters.push({label,url,thumb:'/'+thumb,source:path.relative(ROOT,abs).replaceAll('\\','/')});}
 for(const m of metadata.filter(m=>String(m.engineCardId)===id)){
  for(const slot of ['A','B','C','video']){const f=path.join(m.dir,`poster-${slot}.png`);const alt=f.replace(/\.png$/,'.jpg');await poster(fs.existsSync(f)?f:alt,(slot==='B'||slot==='video')?'':`Plakát ${slot}${m.dir.includes('cards-live')?' · Live':''}`);}
 }
 for(const d of dashboard.filter(d=>String(d.cardId)===id)){if(d.poster?.file)await poster(d.poster.file.replace(/^\/ccc-posters\//,'assets/posters/'),'Plakát ze sbírky');}
 if(c.image)await poster(c.image,'Obraz karty');
 const compared=comparison?.rows.filter(r=>r.id===id)||[];
 const verified=compared.length===4&&compared.every(r=>r.visuallyMatched&&fs.existsSync(path.join(ROOT,r.currentPath))&&createHash('sha256').update(fs.readFileSync(path.join(ROOT,r.currentPath))).digest('hex')===r.currentSha256);
 records[id]={posterSet:verified?'Sada Five Story Posters · všechny 4 obrazy':'' ,id,title:c.title,cs:translations[id],color:colors[id]||'#cda56d',poem:c.poemText,prompt:c.sunoPrompt||'',audio,posters,pilot:['371','432','374'].includes(id)};
}
fs.writeFileSync(path.join(HERE,'assets.json'),JSON.stringify(assets,null,2));
const template=fs.readFileSync(path.join(HERE,'page.html'),'utf8');
for(const collection of collections){const data={collection,collections:collections.map(({slug,title})=>({slug,title})),records:collection.ids.map(id=>records[id])};const html=template.replace('__TITLE__',collection.title).replace('__DATA__',JSON.stringify(data).replaceAll('<','\\u003c'));fs.writeFileSync(path.join(HERE,collection.slug+'.html'),html);}
const report={builtAt:new Date().toISOString(),collections:collections.map(c=>({title:c.title,count:c.ids.length,withAudio:c.ids.filter(id=>records[id].audio.length).length,withPosters:c.ids.filter(id=>records[id].posters.length).length,posters:c.ids.reduce((n,id)=>n+records[id].posters.length,0)})),assets:Object.keys(assets).length,warnings};
fs.writeFileSync(path.join(HERE,'inventory.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
