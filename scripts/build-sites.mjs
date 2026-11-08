import { build } from 'esbuild';
import {cp,readFile,writeFile,mkdir,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist/client',{recursive:true});await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
for(const name of ['index.html','ui','core','vendor','assets'])await cp(name,'dist/client/'+name,{recursive:true});
await build({entryPoints:['worker/index.js'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true});
await cp('.openai/hosting.json','dist/.openai/hosting.json');
// Sites recognizes the standard Worker + client asset output.
await writeFile('dist/server/wrangler.json',JSON.stringify({name:'brewpunk',main:'index.js',compatibility_date:'2026-11-01',assets:{directory:'../client',binding:'ASSETS'}}));
console.log('Sites Worker and client assets built');
