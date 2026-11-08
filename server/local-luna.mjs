import {spawn} from "node:child_process";
import {mkdtemp,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
export async function localLuna(_fetch,_key,_name,schema,instructions,input){
 const dir=await mkdtemp(join(tmpdir(),"brew-luna-"));
 const spec=join(dir,"result.json");
 try{
  await writeFile(spec,JSON.stringify(schema));
  const raw=await new Promise((resolve,reject)=>{
   const child=spawn("codex",["exec","--ephemeral","--ignore-user-config","--skip-git-repo-check","--disable","shell_tool","--disable","apps","--disable","multi_agent","-c",'web_search="disabled"',"-s","read-only","-m","gpt-6-luna","--output-schema",spec,"-"],{cwd:dir,windowsHide:true,timeout:85000,stdio:["pipe","pipe","ignore"]});
   let text="";child.stdout.setEncoding("utf8").on("data",x=>{text+=x;if(text.length>150000)child.kill()});child.on("error",reject);child.on("close",n=>n===0?resolve(text):reject(Error("Luna unavailable")));child.stdin.on("error",()=>{});child.stdin.end(instructions+"\n游戏数据："+JSON.stringify(input));
  });return JSON.parse(raw.trim());
 }finally{await rm(spec,{force:true});await import("node:fs/promises").then(fs=>fs.rmdir(dir)).catch(()=>{});}
}
