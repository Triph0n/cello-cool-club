import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.dirname(fileURLToPath(import.meta.url));
const media=JSON.parse(fs.readFileSync(path.join(ROOT,'assets.json'),'utf8'));
const mime={'.html':'text/html; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.mp3':'audio/mpeg'};
const pages=new Set(['dashboardy.html','novy-vyber.html','oblibene.html','barvy.html']);
http.createServer((req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');let name=decodeURIComponent(url.pathname).replace(/^\//,'');
  if(name==='health'){res.writeHead(200,{'content-type':'text/plain'}).end('ccc-three-selections');return}
  if(!name){res.writeHead(302,{location:'/dashboardy.html'}).end();return}
  let file;if(name.startsWith('media/'))file=media[name.slice(6)];else if(pages.has(name)||/^thumbs\/\d+-\d+\.jpg$/.test(name))file=path.join(ROOT,name);
  if(!file||!fs.existsSync(file)){res.writeHead(404).end('Not found');return}
  const size=fs.statSync(file).size;let start=0,end=size-1,status=200;
  const headers={'content-type':mime[path.extname(file)]||'application/octet-stream','accept-ranges':'bytes','cache-control':name.endsWith('.html')?'no-store':'private, max-age=3600'};
  if(req.headers.range){const m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);if(!m||(!m[1]&&!m[2])){res.writeHead(416,{'content-range':`bytes */${size}`}).end();return}if(!m[1])start=Math.max(0,size-Number(m[2]));else{start=Number(m[1]);if(m[2])end=Math.min(end,Number(m[2]))}if(start>end||start>=size){res.writeHead(416,{'content-range':`bytes */${size}`}).end();return}status=206;headers['content-range']=`bytes ${start}-${end}/${size}`;}
  headers['content-length']=end-start+1;res.writeHead(status,headers);if(req.method==='HEAD'){res.end();return}fs.createReadStream(file,{start,end}).on('error',()=>res.destroy()).pipe(res);
 }catch{if(!res.headersSent)res.writeHead(500);res.end('Unable to read file');}
}).listen(8793,'127.0.0.1',()=>console.log('Cello Cool Club: http://127.0.0.1:8793/novy-vyber.html'));
