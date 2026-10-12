import type {Context} from 'hono';
import {HTTPException} from 'hono/http-exception';
import {z} from 'zod';
export interface Env {DB:D1Database;ALLOWED_ORIGINS:string;ENVIRONMENT:string;CREATION_ENABLED:string;AI_ENABLED:string;DAILY_CREATIONS:string;MAX_ATTEMPTS:string;AI_CREATOR_SECRET?:string;AGENT_SECRET?:string;ADMIN_SECRET?:string;TURNSTILE_SECRET?:string}
export type App={Bindings:Env;Variables:{rowsRead:number;rowsWritten:number}};
export type Ctx=Context<App>;
export const fail=(status:400|401|403|404|409|410|413|429|503,code:string):never=>{throw new HTTPException(status,{message:code});};
export const random=(bytes=32)=>{const a=crypto.getRandomValues(new Uint8Array(bytes));return Array.from(a,x=>x.toString(16).padStart(2,'0')).join('');};
export async function hash(role:string,token:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${role}:${token}`))),x=>x.toString(16).padStart(2,'0')).join('');}
export function bearer(c:Ctx){const t=c.req.header('Authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];if(!t)fail(401,'unauthorized');return t!;}
export async function secret(c:Ctx,role:string,expected:string|undefined){if(!expected||await hash(role,bearer(c))!==await hash(role,expected))fail(401,'unauthorized');}
export async function body<T>(c:Ctx,s:z.ZodType<T>,max=250000):Promise<T>{
 const raw=await c.req.text();if(new TextEncoder().encode(raw).length>max)fail(413,'tooLarge');
 let parsed;try{parsed=JSON.parse(raw);}catch{fail(400,'invalidInput');}
 const out=s.safeParse(parsed);if(!out.success)fail(400,'invalidInput');return out.data as T;
}
export async function run<T=Record<string,unknown>>(c:Ctx,sql:string,...args:unknown[]){
 const r=await c.env.DB.prepare(sql).bind(...args).all<T>();
 c.set('rowsRead',(c.get('rowsRead')||0)+(r.meta.rows_read||0));c.set('rowsWritten',(c.get('rowsWritten')||0)+(r.meta.rows_written||0));return r;
}
export async function one<T>(c:Ctx,sql:string,...args:unknown[]){return (await run<T>(c,sql,...args)).results[0];}
export async function budget(c:Ctx,key:string,max:number,period=60000){const now=Date.now(),bucket=Math.floor(now/period);const r=await one<{count:number}>(c,'INSERT INTO budgets(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<? RETURNING count',`${key}:${bucket}`,now+period*2,max);if(!r)fail(429,'busy');}
export interface QuizRow {id:string;code:string;title:string;subject:string;audience:string;language:string;instructions:string;settings:string;start_at:number|null;end_at:number|null;host_controlled:number;closed_at:number|null;score_released:number;keys_released:number;created_at:number;expires_at:number}
export const quizFields='id,code,title,subject,audience,language,instructions,settings,start_at,end_at,host_controlled,closed_at,score_released,keys_released,created_at,expires_at';
export async function quiz(c:Ctx,id:string){const q=await one<QuizRow>(c,`SELECT ${quizFields} FROM quizzes WHERE id=?`,id);if(!q)fail(404,'notFound');if(q.expires_at<=Date.now())fail(410,'expired');return q;}
export async function creator(c:Ctx){const q=await one<QuizRow>(c,`SELECT ${quizFields} FROM quizzes WHERE creator_hash=?`,await hash('creator',bearer(c)));if(!q)fail(401,'unauthorized');if(q.expires_at<=Date.now())fail(410,'expired');return q;}
export interface AttemptRow {id:string;quiz_id:string;version_id:string;nickname:string;status:'created'|'started'|'submitted'|'expired';created_at:number;started_at:number|null;deadline:number|null;submitted_at:number|null;revision:number;answers:string;manual:string;submit_key:string|null;expires_at:number}
export const attemptFields='id,quiz_id,version_id,nickname,status,created_at,started_at,deadline,submitted_at,revision,answers,manual,submit_key,expires_at';
export async function attempt(c:Ctx){const a=await one<AttemptRow>(c,`SELECT ${attemptFields} FROM attempts WHERE token_hash=?`,await hash('attempt',bearer(c)));if(!a)fail(401,'unauthorized');if(a.expires_at<=Date.now())fail(410,'expired');return a;}
export async function finalize(c:Ctx,id:string){await run(c,`UPDATE attempts SET status='expired',submitted_at=? WHERE id=? AND status='started' AND (deadline<=? OR EXISTS(SELECT 1 FROM quizzes q WHERE q.id=attempts.quiz_id AND (q.closed_at IS NOT NULL OR q.end_at<=?)))`,Date.now(),id,Date.now(),Date.now());}
