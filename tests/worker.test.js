import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';
const origin='https://brewpunk.example';
const make=(path,init={})=>new Request(origin+path,init);
const post=(data,headers={})=>({method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(data)});
test('Worker serves registered static assets through the platform binding',async()=>{
 let seen;const result=await worker.fetch(make('/assets/kitchen/k01-preparation.png'),{ASSETS:{fetch:r=>{seen=r.url;return new Response('asset')}}});
 assert.equal(await result.text(),'asset');assert.ok(seen.endsWith('.png'));
});
test('Worker health exposes readiness, never the secret',async()=>{
 const result=await worker.fetch(make('/api/health'),{OPENAI_API_KEY:'test-only'});
 assert.deepEqual(await result.json(),{online:true,model:'gpt-6-luna'});
});
test('Worker rejects cross-origin requests, excess bodies and malformed JSON before calling a model',async()=>{
 assert.equal((await worker.fetch(make('/api/guests',post({}, {Origin:'https://elsewhere.example'})),{})).status,403);
 assert.equal((await worker.fetch(make('/api/guests',{method:'POST',body:'{}'}),{})).status,415);
 assert.equal((await worker.fetch(make('/api/guests',post({text:'a'.repeat(34000)})),{})).status,413);
 assert.equal((await worker.fetch(make('/api/guests',{method:'POST',headers:{'Content-Type':'application/json'},body:'not-json'}),{})).status,400);
 assert.equal((await worker.fetch(make('/api/guests'),{})).status,405);
 assert.equal((await worker.fetch(make('/api/unknown',post({})),{})).status,404);
});
test('Worker preserves local fallback when runtime key is absent',async()=>{
 const response=await worker.fetch(make('/api/adjudicate',post({})),{});
 assert.equal(response.status,503);assert.deepEqual(await response.json(),{error:'offline'});
});
