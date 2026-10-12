import {Hono} from 'hono';
import {cors} from 'hono/cors';
import {bodyLimit} from 'hono/body-limit';
import {HTTPException} from 'hono/http-exception';
import {type App,type Env,budget,hash,run,secret} from './core';
import {quizzes} from './quizzes';
import {attempts} from './attempts';
import {ai} from './ai';
export const app=new Hono<App>();
app.use('*',async(c,next)=>{
 if(c.env.ENVIRONMENT!=='development'&&new URL(c.req.url).protocol!=='https:')return c.json({error:{code:'unauthorized'}},403);
 c.header('Cache-Control','no-store');c.header('Referrer-Policy','no-referrer');c.header('X-Content-Type-Options','nosniff');
 c.header('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'");
 await next();if(c.env.ENVIRONMENT==='development'){c.header('X-DB-Read',String(c.get('rowsRead')||0));c.header('X-DB-Written',String(c.get('rowsWritten')||0));}
});
app.use('*',cors({origin:(origin,c)=>c.env.ALLOWED_ORIGINS.split(',').includes(origin)?origin:undefined,allowMethods:['GET','POST','PATCH','DELETE','OPTIONS'],allowHeaders:['Authorization','Content-Type'],exposeHeaders:['X-Next-Cursor'],maxAge:86400}));
app.use('*',bodyLimit({maxSize:250000,onError:c=>c.json({error:{code:'tooLarge'}},413)}));
app.use('/v1/*',async(c,next)=>{
 // Shared D1 buckets protect anonymous entry points. Never persist raw IP addresses.
 if((c.req.path.includes('/codes/')||c.req.path.endsWith('/join')||c.req.path==='/v1/quizzes')&&c.req.method!=='OPTIONS'){
  const ip=c.req.header('CF-Connecting-IP')||'local';const key=await hash('abuse',`${c.env.ADMIN_SECRET||'development'}:${Math.floor(Date.now()/86400000)}:${ip}`);
  await budget(c,`entry:${key}`,3000);
 }await next();
});
app.get('/v1/health',c=>c.json({ok:true}));
app.route('/v1',quizzes);app.route('/v1',attempts);app.route('/v1',ai);
app.get('/v1/admin/usage',async c=>{await secret(c,'admin',c.env.ADMIN_SECRET);const r=await run(c,'SELECT key,count,expires_at FROM budgets WHERE expires_at>? ORDER BY expires_at LIMIT 100',Date.now());return c.json({budgets:r.results});});
app.notFound(c=>c.json({error:{code:'notFound'}},404));
app.onError((e,c)=>{if(e instanceof HTTPException)return c.json({error:{code:e.message}},e.status);console.error(JSON.stringify({event:'request_failed',class:e.name}));return c.json({error:{code:'busy'}},503);});
export async function cleanup(env:Env){const now=Date.now();await env.DB.batch([
 env.DB.prepare("UPDATE attempts SET status='expired',submitted_at=? WHERE id IN (SELECT id FROM attempts WHERE status='started' AND deadline<=? LIMIT 100)").bind(now,now),
 env.DB.prepare('DELETE FROM attempts WHERE id IN (SELECT id FROM attempts WHERE expires_at<=? LIMIT 100)').bind(now),
 env.DB.prepare('DELETE FROM quizzes WHERE id IN (SELECT id FROM quizzes WHERE expires_at<=? LIMIT 5)').bind(now),
 env.DB.prepare('DELETE FROM ai_jobs WHERE id IN (SELECT id FROM ai_jobs WHERE expires_at<=? LIMIT 100)').bind(now),
 env.DB.prepare('DELETE FROM budgets WHERE key IN (SELECT key FROM budgets WHERE expires_at<=? LIMIT 100)').bind(now)
]);}
export default {fetch:app.fetch,scheduled:(_controller:ScheduledController,env:Env,ctx:ExecutionContext)=>ctx.waitUntil(cleanup(env))};
