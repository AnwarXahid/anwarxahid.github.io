import {Hono} from 'hono';
import {z} from 'zod';
import {generationSchema,questionSchema} from '../../packages/shared/schema';
import {type App,bearer,body,budget,fail,hash,one,random,run,secret} from './core';
export const ai=new Hono<App>();
ai.get('/ai/status',async c=>{const r=await one<{heartbeat:number;available:number}>(c,'SELECT heartbeat,available FROM agent_status WHERE id=1');return c.json({available:c.env.AI_ENABLED==='true'&&!!r?.available&&r.heartbeat>Date.now()-180000,enabled:c.env.AI_ENABLED==='true'});});
ai.post('/ai/jobs',async c=>{
 await secret(c,'ai-creator',c.env.AI_CREATOR_SECRET);if(c.env.AI_ENABLED!=='true')fail(503,'aiOffline');
 const b=await body(c,z.object({input:generationSchema,token:z.string().regex(/^[a-f0-9]{64}$/)}).strict(),180000);
 const owner=await hash('ai-creator',bearer(c));const jobHash=await hash('job',b.token),id=random(16),now=Date.now();
 const previous=await one<{id:string}>(c,'SELECT id FROM ai_jobs WHERE token_hash=? AND expires_at>?',jobHash,now);if(previous)return c.json(previous);
 await budget(c,`ai:${owner}`,10,86400000);await budget(c,'ai:global',50,86400000);
 const r=await run(c,"INSERT INTO ai_jobs(id,token_hash,owner_hash,state,input,created_at,expires_at) SELECT ?,?,?,'queued',?,?,? WHERE (SELECT count(*) FROM ai_jobs WHERE state IN ('queued','leased') AND expires_at>?)<10 AND (SELECT count(*) FROM ai_jobs WHERE owner_hash=? AND state IN ('queued','leased') AND expires_at>?)<2",id,jobHash,owner,JSON.stringify(b.input),now,now+3600000,now,owner,now);
 if(!r.meta.changes)fail(429,'busy');return c.json({id},201);
});
ai.get('/ai/job',async c=>{
 const h=await hash('job',bearer(c)),now=Date.now();const j=await one<{state:string;output:string|null;error:string|null}>(c,'SELECT state,output,error FROM ai_jobs WHERE token_hash=? AND expires_at>?',h,now);if(!j)fail(410,'expired');
 return c.json({state:j.state,output:j.output?JSON.parse(j.output):null,error:j.error});
});
// Client acknowledges retrieval only after saving the reviewed draft locally, avoiding loss on a dropped response.
ai.delete('/ai/job',async c=>{await run(c,'DELETE FROM ai_jobs WHERE token_hash=?',await hash('job',bearer(c)));return c.json({ok:true});});
ai.post('/agent/claim',async c=>{
 await secret(c,'agent',c.env.AGENT_SECRET);const b=await body(c,z.object({available:z.boolean()}).strict());const now=Date.now();
 await run(c,'INSERT INTO agent_status(id,heartbeat,available) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET heartbeat=excluded.heartbeat,available=excluded.available',now,+b.available);
 if(c.env.AI_ENABLED!=='true'||!b.available)return c.json({job:null});
 const lease=random();const j=await one<{id:string;input:string}>(c,`UPDATE ai_jobs SET state='leased',lease_hash=?,lease_until=?,tries=tries+1 WHERE id=(SELECT id FROM ai_jobs WHERE expires_at>? AND tries<3 AND (state='queued' OR (state='leased' AND lease_until<=?)) ORDER BY created_at LIMIT 1) AND NOT EXISTS(SELECT 1 FROM ai_jobs WHERE state='leased' AND lease_until>? AND expires_at>?) RETURNING id,input`,await hash('lease',lease),now+180000,now,now,now,now);
 return c.json({job:j?{id:j.id,input:JSON.parse(j.input),lease}:null});
});
ai.post('/agent/jobs/:id/renew',async c=>{
 await secret(c,'agent',c.env.AGENT_SECRET);const b=await body(c,z.object({lease:z.string().length(64)}).strict());const now=Date.now();
 const r=await run(c,"UPDATE ai_jobs SET lease_until=? WHERE id=? AND state='leased' AND lease_hash=? AND lease_until>? AND expires_at>?",now+180000,c.req.param('id'),await hash('lease',b.lease),now,now);if(!r.meta.changes)fail(409,'expiredLease');await run(c,'UPDATE agent_status SET heartbeat=? WHERE id=1',now);return c.json({ok:true});
});
ai.post('/agent/jobs/:id/complete',async c=>{
 await secret(c,'agent',c.env.AGENT_SECRET);const b=await body(c,z.object({lease:z.string().length(64),questions:z.array(questionSchema).min(1).max(20).optional(),error:z.enum(['modelUnavailable','invalidGeneration','generationFailed']).optional()}).strict());
 const now=Date.now();const j=await one<{input:string;state:string;lease_hash:string}>(c,'SELECT input,state,lease_hash FROM ai_jobs WHERE id=? AND expires_at>?',c.req.param('id'),now);if(!j||j.lease_hash!==await hash('lease',b.lease))fail(409,'expiredLease');if(j.state==='completed'||j.state==='failed')return c.json({ok:true});
 const input=JSON.parse(j.input);if(!b.error&&(!b.questions||b.questions.length!==input.count||b.questions.some(q=>!input.types.includes(q.type)||(input.source&&!q.sourceRef))||new Set(b.questions.map(q=>q.prompt.trim())).size!==b.questions.length||new Set(b.questions.map(q=>q.id)).size!==b.questions.length))fail(400,'invalidGeneration');
 const r=await run(c,"UPDATE ai_jobs SET state=?,output=?,error=?,input=NULL,expires_at=min(expires_at,?),lease_until=NULL WHERE id=? AND state='leased' AND lease_hash=? AND lease_until>? AND expires_at>?",b.error?'failed':'completed',b.questions?JSON.stringify(b.questions):null,b.error||null,now+3600000,c.req.param('id'),await hash('lease',b.lease),now,now);if(!r.meta.changes)fail(409,'expiredLease');return c.json({ok:true});
});
