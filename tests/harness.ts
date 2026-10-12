import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
export async function harness(){
 const bundled=await build({entryPoints:['worker/src/index.ts'],bundle:true,write:false,format:'esm',platform:'browser',target:'es2022'});
 const mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:bundled.outputFiles[0].text,compatibilityDate:'2026-10-01',d1Databases:['DB'],bindings:{ALLOWED_ORIGINS:'http://127.0.0.1:4321',ENVIRONMENT:'development',CREATION_ENABLED:'true',DAILY_CREATIONS:'10000',MAX_ATTEMPTS:'600',AI_ENABLED:'true',AGENT_SECRET:'a'.repeat(64),AI_CREATOR_SECRET:'b'.repeat(64),ADMIN_SECRET:'c'.repeat(64)}}));
 const db=await mf.getD1Database('DB');const sql=await readFile('worker/migrations/0001_initial.sql','utf8');await db.batch(sql.split(';').map(x=>x.trim()).filter(Boolean).map(x=>db.prepare(x)));
 return {mf,db,async request(path:string,token?:string,method='GET',body?:unknown){const r=await mf.dispatchFetch('http://localhost/v1'+path,{method,headers:{...(token?{Authorization:`Bearer ${token}`}:{ }),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json() as any,headers:r.headers};}};
}
export const token=()=>crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');
