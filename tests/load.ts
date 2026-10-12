/** Local only by default. Remote staging requires explicit endpoint + opt-in; never production. */
import {performance} from 'node:perf_hooks';
import {writeFile,mkdir} from 'node:fs/promises';
import os from 'node:os';
import {harness,token} from './harness';
import {quiz,correct} from './fixtures';
const endpoint=process.env.STAGING_API;
if(endpoint&&process.env.ALLOW_STAGING_LOAD!=='I_HAVE_AUTHORIZATION')throw Error('Remote testing requires explicit staging authorization.');
const h=endpoint?null:await harness();
const request=async(path:string,tk?:string,method='GET',body?:unknown)=>{
 if(h)return h.request(path,tk,method,body);
 const r=await fetch(endpoint+path,{method,headers:{...(tk?{Authorization:`Bearer ${tk}`}:{ }),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json() as any,headers:r.headers};
};
const report:any={date:new Date().toISOString(),environment:{platform:os.platform(),cpu:os.cpus()[0]?.model,cores:os.cpus().length,memoryGB:Math.round(os.totalmem()/1024**3),node:process.version},remote:!!endpoint,notes:'Local Miniflare/workerd + real D1 SQLite. Accelerated synchronized join/submit, three changed autosave rounds with jitter; not a 30-minute production-capacity measurement. D1 row metadata excludes publication batch and underlying index accounting may differ remotely.',runs:[]};
try{
for(const count of [25,50,100,250,500]){
 const latencies:number[]=[],failures:any[]=[];let reads=0,writes=0,calls=0;const start=performance.now();
 async function measured(path:string,tk?:string,method='GET',body?:unknown){const begin=performance.now();const r=await request(path,tk,method,body);latencies.push(performance.now()-begin);reads+=Number(r.headers.get('X-DB-Read')||0);writes+=Number(r.headers.get('X-DB-Written')||0);calls++;if(r.status>=400)failures.push({path,status:r.status,error:r.data.error});return r;}
 const owner=token();const p=await measured('/quizzes',owner,'POST',{quiz:{...quiz,title:`Local concurrency ${count}`}});if(p.status!==201)throw Error('Could not create load fixture.');
 const people=Array.from({length:count},()=>({token:token(),key:token().slice(0,32),revision:0}));
 await Promise.all(people.map(async a=>{await measured(`/quizzes/${p.data.id}/join`,a.token,'POST',{key:a.key});await measured(`/quizzes/${p.data.id}/join`,a.token,'POST',{key:a.key});await measured('/attempt/start',a.token,'POST');}));
 for(let round=0;round<3;round++){
  await new Promise(r=>setTimeout(r,1100));
  await Promise.all(people.map(async a=>{await new Promise(r=>setTimeout(r,Math.random()*600));await measured('/attempt/answers',a.token,'PATCH',{revision:++a.revision,answers:{s:round===1?'b':'a'}});}));
 }
 await Promise.all(people.map(async a=>{const key=token().slice(0,32),payload={revision:++a.revision,answers:correct,key};await measured('/attempt/submit',a.token,'POST',payload);await measured('/attempt/submit',a.token,'POST',payload);const delayed=await request('/attempt/answers',a.token,'PATCH',{revision:a.revision+1,answers:{s:'b'}});if(delayed.status!==410)failures.push({path:'delayed-save',status:delayed.status});}));
 await measured('/manage/release',owner,'POST',{scores:true,keys:false});
 let correctness=0;await Promise.all(people.map(async a=>{const r=await measured('/attempt/results',a.token);if(r.data.score?.earned===12&&r.data.score?.pending===2&&r.data.answers.s==='a')correctness++;}));
 const dashboard=await measured('/manage',owner);latencies.sort((a,b)=>a-b);
 report.runs.push({participants:count,durationSeconds:+((performance.now()-start)/1000).toFixed(2),requests:calls,p50Ms:+latencies[Math.floor(latencies.length*.5)].toFixed(2),p95Ms:+latencies[Math.floor(latencies.length*.95)].toFixed(2),failures:failures.length,failureExamples:failures.slice(0,3),rowsRead:reads,rowsWritten:writes,correctResults:correctness,uniqueAttempts:dashboard.data.counts?.joined,pass:failures.length===0&&correctness===count&&dashboard.data.counts?.joined===count});
 console.log(JSON.stringify(report.runs.at(-1)));
 await request('/manage',owner,'DELETE');
}
}finally{await h?.mf.dispose();await mkdir('docs',{recursive:true});await writeFile('docs/load-results.json',JSON.stringify(report,null,2)+'\n');}
if(report.runs.some((r:any)=>!r.pass))process.exitCode=1;
