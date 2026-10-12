import {Hono} from 'hono';
import {z} from 'zod';
import {quizSchema,publicQuestion,type Quiz} from '../../packages/shared/schema';
import {quizState} from '../../packages/shared/time';
import {score,csvCell} from '../../packages/shared/grading';
import {type App,type AttemptRow,attemptFields,bearer,body,budget,creator,fail,hash,one,quiz,random,run,finalize} from './core';
export const quizzes=new Hono<App>();
quizzes.post('/quizzes',async c=>{
 if(c.env.CREATION_ENABLED!=='true')fail(503,'creationPaused');
 const token=bearer(c),creatorHash=await hash('creator',token);
 const data=await body(c,z.object({quiz:quizSchema,turnstile:z.string().max(2048).optional()}).strict());
 const existing=await one<{id:string;code:string}>(c,'SELECT id,code FROM quizzes WHERE creator_hash=? AND expires_at>?',creatorHash,Date.now());if(existing)return c.json(existing);
 if(c.env.ENVIRONMENT!=='development'){
  if(!c.env.TURNSTILE_SECRET||!data.turnstile)fail(403,'verificationRequired');
  const verification=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:c.env.TURNSTILE_SECRET!,response:data.turnstile!})});
  const v=await verification.json() as {success:boolean;hostname:string;action:string};
  if(!v.success||v.action!=='create'||!c.env.ALLOWED_ORIGINS.split(',').some(o=>new URL(o).hostname===v.hostname))fail(403,'verificationRequired');
 }
 await budget(c,'creation:global',Number(c.env.DAILY_CREATIONS)||100,86400000);
 const now=Date.now(),q=data.quiz,s=q.settings;
 if(s.startsAt&&s.startsAt>now+(s.lifetimeDays-1)*86400000)fail(400,'invalidTime');
 const expires=now+s.lifetimeDays*86400000;
 const end=s.endsAt??(s.mode!=='practice'&&s.startsAt?s.startsAt+s.durationMinutes!*60000:null);
 const id=random(16),version=random(16);
 for(let i=0;i<5;i++){
  const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const code=Array.from(crypto.getRandomValues(new Uint8Array(8)),n=>alphabet[n%32]).join('');
  try{
   await c.env.DB.batch([
    c.env.DB.prepare('INSERT INTO quizzes(id,code,creator_hash,title,subject,audience,language,instructions,settings,start_at,end_at,host_controlled,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,code,creatorHash,q.title,q.subject,q.audience,q.language,q.instructions,JSON.stringify(s),s.startsAt,end,+s.hostControlled,now,expires),
    c.env.DB.prepare('INSERT INTO versions(id,quiz_id,content,public_questions,answer_shape) VALUES(?,?,?,?,?)').bind(version,id,JSON.stringify(q),JSON.stringify(q.questions.map(publicQuestion)),JSON.stringify(q.questions.map(x=>{const p=publicQuestion(x);return {...p,prompt:"",choices:p.choices?.map(c=>({...c,text:""})),left:p.left?.map(c=>({...c,text:""})),right:p.right?.map(c=>({...c,text:""}))};})))
   ]);return c.json({id,code,version},201);
  }catch(e){if(!String(e).includes('quizzes.code'))throw e;}
 }
 return fail(503,'busy');
});
quizzes.get('/codes/:code',async c=>{const q=await one<{id:string}>(c,'SELECT id FROM quizzes WHERE code=? AND expires_at>?',c.req.param('code').toUpperCase(),Date.now());if(!q)fail(404,'notFound');return c.json(q);});
quizzes.get('/quizzes/:id',async c=>{
 const q=await quiz(c,c.req.param('id'));const s=JSON.parse(q.settings);
 return c.json({id:q.id,title:q.title,subject:q.subject,audience:q.audience,language:q.language,instructions:q.instructions,mode:s.mode,state:quizState(q,Date.now()),startsAt:q.start_at,endsAt:q.end_at,timezone:s.timezone,durationMinutes:s.durationMinutes,nicknameMode:s.nicknameMode,serverTime:Date.now()});
});
quizzes.get('/manage',async c=>{
 const q=await creator(c);const v=await one<{content:string}>(c,'SELECT content FROM versions WHERE quiz_id=?',q.id);
 const counts=await one(c,"SELECT count(*) AS joined,sum(status!='created') AS started,sum(status IN ('submitted','expired')) AS submitted FROM attempts WHERE quiz_id=? AND expires_at>?",q.id,Date.now());
 return c.json({quiz:q,content:JSON.parse(v!.content),state:quizState(q,Date.now()),counts,serverTime:Date.now()});
});
quizzes.post('/manage/start',async c=>{
 const q=await creator(c),s=JSON.parse(q.settings),now=Date.now();
 await run(c,'UPDATE quizzes SET start_at=?,end_at=? WHERE id=? AND start_at IS NULL AND host_controlled=1 AND closed_at IS NULL AND expires_at>?',now,now+s.durationMinutes*60000,q.id,now);
 const updated=await quiz(c,q.id);if(updated.end_at)await run(c,'UPDATE attempts SET expires_at=min(expires_at,?) WHERE quiz_id=? AND expires_at>?',updated.end_at+s.retentionDays*86400000,q.id,updated.end_at+s.retentionDays*86400000);
 return c.json({ok:true});
});
quizzes.post('/manage/close',async c=>{const q=await creator(c),now=Date.now(),s=JSON.parse(q.settings);await run(c,'UPDATE quizzes SET closed_at=coalesce(closed_at,?) WHERE id=?',now,q.id);await run(c,'UPDATE attempts SET expires_at=min(expires_at,?) WHERE quiz_id=?',now+s.retentionDays*86400000,q.id);return c.json({ok:true});});
quizzes.post('/manage/release',async c=>{const q=await creator(c);const b=await body(c,z.object({scores:z.boolean(),keys:z.boolean()}).strict());if(quizState(q,Date.now())!=='closed'&&JSON.parse(q.settings).mode!=='practice')fail(409,'notClosed');await run(c,'UPDATE quizzes SET score_released=?,keys_released=? WHERE id=?',+b.scores,+b.keys,q.id);return c.json({ok:true});});
quizzes.post('/manage/rotate',async c=>{const q=await creator(c);const b=await body(c,z.object({token:z.string().regex(/^[a-f0-9]{64}$/)}).strict());await run(c,'UPDATE quizzes SET creator_hash=? WHERE id=?',await hash('creator',b.token),q.id);return c.json({ok:true});});
quizzes.delete('/manage',async c=>{const h=await hash('creator',bearer(c));await run(c,'DELETE FROM quizzes WHERE creator_hash=?',h);return c.json({ok:true});});
quizzes.get('/manage/responses',async c=>{
 const q=await creator(c),cursor=c.req.query('after')||'';if(cursor.length>64)fail(400,'invalidInput');
 // One bounded lazy-finalization query per page, independent of browser participation.
 await run(c,`UPDATE attempts SET status='expired',submitted_at=? WHERE id IN (SELECT id FROM attempts WHERE quiz_id=? AND id>? AND status='started' AND (deadline<=? OR ? IS NOT NULL OR ?<=?) ORDER BY id LIMIT 50)`,Date.now(),q.id,cursor,Date.now(),q.closed_at,q.end_at,Date.now());
 const rows=(await run<AttemptRow>(c,`SELECT ${attemptFields} FROM attempts WHERE quiz_id=? AND id>? AND expires_at>? ORDER BY id LIMIT 50`,q.id,cursor,Date.now())).results;
 const v=await one<{content:string}>(c,'SELECT content FROM versions WHERE quiz_id=?',q.id);const content=JSON.parse(v!.content) as Quiz;
 const results=rows.map(a=>({id:a.id,nickname:a.nickname,status:a.status,answers:JSON.parse(a.answers),manual:JSON.parse(a.manual),score:score(content.questions,JSON.parse(a.answers),JSON.parse(a.manual))}));
 if(c.req.query('format')==='csv')return c.text([['id','nickname','status','earned','graded_possible','total','pending',...content.questions.map(q=>q.prompt)].map(csvCell).join(','),...results.map(r=>[r.id,r.nickname,r.status,r.score.earned,r.score.gradedPossible,r.score.total,r.score.pending,...content.questions.map(q=>JSON.stringify(r.answers[q.id]??null))].map(csvCell).join(','))].join('\r\n'),200,{'Content-Type':'text/csv; charset=utf-8','X-Next-Cursor':rows.length===50?rows.at(-1)!.id:''});
 return c.json({results,next:rows.length===50?rows.at(-1)!.id:null});
});
quizzes.post('/manage/grade',async c=>{
 const q=await creator(c);const b=await body(c,z.object({attempt:z.string().max(64),question:z.string().max(64),points:z.number().min(0).max(100)}).strict());
 const v=await one<{content:string}>(c,'SELECT content FROM versions WHERE quiz_id=?',q.id),content=JSON.parse(v!.content) as Quiz;
 const question=content.questions.find(x=>x.id===b.question);if(!question||!['short','long'].includes(question.type)||b.points>question.points)fail(400,'invalidInput');
 await finalize(c,b.attempt);
 const r=await run(c,"UPDATE attempts SET manual=json_patch(manual,?) WHERE id=? AND quiz_id=? AND status IN ('submitted','expired') AND expires_at>?",JSON.stringify({[b.question]:b.points}),b.attempt,q.id,Date.now());if(!r.meta.changes)fail(409,'notSubmitted');return c.json({ok:true});
});
