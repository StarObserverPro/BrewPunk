import fs from 'node:fs';
import {albumEntries} from '../ui/asset-album.js';
const root=new URL('../',import.meta.url);
const html=fs.readFileSync(new URL('dist/BrewPunk.html',root),'utf8');
const imports=JSON.parse(html.match(/<script type="importmap">(.*?)<\/script>/s)[1]).imports;
const unresolved=[];
for(const [id,url] of Object.entries(imports)){
  const code=Buffer.from(url.split(',')[1],'base64').toString();
  if(/['"]assets\//.test(code))unresolved.push(id);
}
const registered=new Set(albumEntries.map(a=>a.src));
const missing=[...registered].filter(src=>!fs.existsSync(new URL(src,root)));
const report={registered:registered.size,missing,unresolved,portableMB:Number((Buffer.byteLength(html)/1048576).toFixed(1))};
console.log(JSON.stringify(report,null,2));
if(missing.length || unresolved.length)process.exitCode=1;
