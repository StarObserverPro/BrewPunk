import { createLuna } from '../server/luna.mjs';
let client, configuredKey;
const json = (body,status=200) => Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export default {
 async fetch(request,env) {
  const url=new URL(request.url);
  if(!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
  if(url.pathname==='/api/health') return json({online:!!env.OPENAI_API_KEY,model:'gpt-6-luna'});
  if(!['/api/adjudicate','/api/guests'].includes(url.pathname))return json({error:'unknown_route'},404);
  if(request.method!=='POST')return json({error:'method'},405);
  if(request.headers.has('Origin') && request.headers.get('Origin')!==url.origin)return json({error:'origin'},403);
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'content_type'},415);
  if(Number(request.headers.get('Content-Length'))>32768)return json({error:'body_size'},413);
  let data;
  try{
   // Enforce the same limit for chunked bodies before allocating an entire payload.
   const reader=request.body?.getReader();if(!reader)return json({error:'invalid_json'},400);
   const chunks=[];let length=0;
   while(true){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>32768){await reader.cancel();return json({error:'body_size'},413)}chunks.push(value);}
   const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
   data=JSON.parse(new TextDecoder().decode(bytes));
  }catch{return json({error:'invalid_json'},400)}
  try{
   if(!client || configuredKey!==env.OPENAI_API_KEY){client=createLuna({apiKey:env.OPENAI_API_KEY});configuredKey=env.OPENAI_API_KEY;}
   return json(await client(url.pathname.slice(5),data));
  }catch(error){
   const status=error.status || 502;
   console.error(JSON.stringify({route:url.pathname,status,reason:error.status?'request_rejected':'generation_failed'}));
   return json({error:status===503?'offline':status===400?'invalid_input':'unavailable'},status);
  }
 }
};
