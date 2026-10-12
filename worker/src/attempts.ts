import {Hono} from 'hono';
import {z} from 'zod';
import {answersSchema,validAnswer,publicQuestion,type PublicQuestion,type Quiz} from '../../packages/shared/schema';
import {quizState} from '../../packages/shared/time';
import {score} from '../../packages/shared/grading';
import {type App,type AttemptRow,attempt,attemptFields,bearer,body,budget,fail,hash,one,quiz,random,run,finalize} from './core';
export const attempts=new Hono<App>();
attempts.post('/quizzes/:id/join',async c=>{
 const q=await quiz(c,c.req.param('id')),now=Date.now(),s=JSON.parse(q.settings);
 const b=await body(c,z.object({key:z.string().regex(/^[a-f0-9]{32}$/),nickname:z.string().trim().min(1).max(40).optional()}).strict());
 const h=await hash('attempt',bearer(c));
 const existing=await one<{id:string;token_hash:string}>(c,'SELECT id,token_hash FROM attempts WHERE quiz_id=? AND join_key=?',q.id,b.key);
 if(existing){if(existing.token_hash!==h)fail(401,'unauthorized');return c.json({id:existing.id});}
 const state=quizState(q,now);if(state==='closed'||state==='expired')fail(410,'closed');
 if(!s.lateJoin&&q.start_at!==null&&now>=q.start_at)fail(409,'lateJoinDisabled');
 const v=await one<{id:string}>(c,'SELECT id FROM versions WHERE quiz_id=?',q.id);
 const id=random(16);const nickname=s.nicknameMode==='custom'&&b.nickname?b.nickname:`Learner-${random(3).toUpperCase()}`;
 const expires=Math.min(q.expires_at,(q.end_at??q.expires_at)+s.retentionDays*86400000);
 const r=await run(c,`INSERT INTO attempts(id,quiz_id,version_id,token_hash,join_key,nickname,status,created_at,expires_at) SELECT ?,?,?,?,?,?,'created',?,? WHERE (SELECT count(*) FROM attempts WHERE quiz_id=?)<? AND EXISTS(SELECT 1 FROM quizzes WHERE id=? AND closed_at IS NULL AND (end_at IS NULL OR end_at>?) AND expires_at>?) ON CONFLICT(quiz_id,join_key) DO NOTHING`,id,q.id,v!.id,h,b.key,nickname,now,expires,q.id,Math.min(s.maxAttempts,Number(c.env.MAX_ATTEMPTS)||600),q.id,now,now);
 if(!r.meta.changes){const retry=await one<{id:string;token_hash:string}>(c,'SELECT id,token_hash FROM attempts WHERE quiz_id=? AND join_key=?',q.id,b.key);if(retry?.token_hash===h)return c.json({id:retry.id});fail(429,'busy');}
 return c.json({id},201);
});
attempts.post('/attempt/start',async c=>{
 const a=await attempt(c),q=await quiz(c,a.quiz_id),s=JSON.parse(q.settings),now=Date.now();
 if(quizState(q,now)!=='open')fail(409,'notOpen');
 const deadline=Math.min(q.end_at??q.expires_at,s.durationMinutes?now+s.durationMinutes*60000:q.expires_at);
 await run(c,`UPDATE attempts SET status='started',started_at=?,deadline=? WHERE id=? AND status='created' AND expires_at>? AND EXISTS(SELECT 1 FROM quizzes WHERE id=attempts.quiz_id AND closed_at IS NULL AND (start_at IS NULL OR start_at<=?) AND (end_at IS NULL OR end_at>?) AND expires_at>?)`,now,deadline,a.id,now,now,now,now);
 return c.json({ok:true});
});
attempts.get('/attempt',async c=>{
 let a=await attempt(c);const q=await quiz(c,a.quiz_id);await finalize(c,a.id);a=await attempt(c);
 const state=quizState(q,Date.now());let questions:PublicQuestion[]=[];
 if(a.status==='started'&&state==='open'){
  const v=await one<{public_questions:string}>(c,'SELECT public_questions FROM versions WHERE id=?',a.version_id);questions=JSON.parse(v!.public_questions);
  if(JSON.parse(q.settings).shuffle){const rank=async(id:string)=>(await hash('shuffle',`${a.id}:${id}`));const ranked=await Promise.all(questions.map(async x=>({x,rank:await rank(x.id)})));questions=ranked.sort((x,y)=>x.rank.localeCompare(y.rank)).map(x=>x.x);}
 }
 return c.json({id:a.id,nickname:a.nickname,status:a.status,revision:a.revision,answers:JSON.parse(a.answers),deadline:a.deadline,serverTime:Date.now(),quiz:{id:q.id,title:q.title,state,startsAt:q.start_at,endsAt:q.end_at,instructions:q.instructions},questions});
});
const mutation=z.object({revision:z.number().int().min(1).max(100000),answers:answersSchema,key:z.string().regex(/^[a-f0-9]{32}$/).optional()}).strict();
async function mutate(c:Parameters<typeof attempt>[0],submit:boolean){
 const a=await attempt(c),b=await body(c,mutation,64000),now=Date.now();
 if(submit&&!b.key)fail(400,'invalidInput');
 if(a.status==='submitted'&&submit&&a.submit_key===b.key)return c.json({revision:a.revision,status:a.status,answers:JSON.parse(a.answers)});
 // Only public validation shape is read here, never grading keys.
 const v=await one<{answer_shape:string}>(c,'SELECT answer_shape FROM versions WHERE id=?',a.version_id);const questions=JSON.parse(v!.answer_shape) as PublicQuestion[];
 if(Object.entries(b.answers).some(([id,value])=>{const q=questions.find(x=>x.id===id);return !q||!validAnswer(q,value);}))fail(400,'invalidAnswer');
 // Revisions form one compare-and-swap stream. Retries may acknowledge an already applied revision,
 // but different payloads with the same revision can never replace it.
 if(b.revision<=a.revision&&!submit&&a.status==='started')return c.json({revision:a.revision,status:a.status,answers:JSON.parse(a.answers)});
 if(b.revision!==a.revision+1)fail(409,'revisionConflict');
 const merged=submit?b.answers:{...JSON.parse(a.answers),...b.answers};
 if(new TextEncoder().encode(JSON.stringify(merged)).length>64000)fail(413,'tooLarge');
 const r=await run<AttemptRow>(c,`UPDATE attempts SET answers=?,revision=?,last_save_at=?,status=?,submitted_at=?,submit_key=? WHERE id=? AND revision=? AND status='started' AND deadline>? AND expires_at>? AND (?=1 OR last_save_at<=?) AND EXISTS(SELECT 1 FROM quizzes q WHERE q.id=attempts.quiz_id AND q.closed_at IS NULL AND q.expires_at>? AND (q.end_at IS NULL OR q.end_at>?) AND (q.start_at IS NULL OR q.start_at<=?)) RETURNING ${attemptFields}`,JSON.stringify(merged),b.revision,now,submit?'submitted':'started',submit?now:null,submit?b.key:null,a.id,a.revision,now,now,+submit,now-1000,now,now,now);
 if(!r.results.length){await finalize(c,a.id);const latest=await attempt(c);if(submit&&latest.submit_key===b.key)return c.json({revision:latest.revision,status:latest.status,answers:JSON.parse(latest.answers)});if(latest.status!=='started'||latest.deadline!<=now)fail(410,'closed');if(latest.revision!==a.revision)fail(409,'revisionConflict');fail(429,'busy');}
 return c.json({revision:b.revision,status:r.results[0].status,answers:merged});
}
attempts.patch('/attempt/answers',c=>mutate(c,false));
attempts.post('/attempt/submit',c=>mutate(c,true));
attempts.get('/attempt/results',async c=>{
 let a=await attempt(c);const q=await quiz(c,a.quiz_id);await finalize(c,a.id);a=await attempt(c);
 if(!['submitted','expired'].includes(a.status))fail(409,'notSubmitted');
 const s=JSON.parse(q.settings),feedback=s.mode==='practice'&&s.feedback;
 const v=await one<{content:string}>(c,'SELECT content FROM versions WHERE id=?',a.version_id);const content=JSON.parse(v!.content) as Quiz;
 return c.json({id:a.id,title:q.title,nickname:a.nickname,status:a.status,score:q.score_released||feedback?score(content.questions,JSON.parse(a.answers),JSON.parse(a.manual)):null,questions:q.keys_released||feedback?content.questions.map(q=>({...publicQuestion(q),explanation:q.explanation,...'correct'in q?{correct:q.correct}:{},...q.type==='blanks'?{accepted:q.accepted}:{}})):null,answers:JSON.parse(a.answers),mode:s.mode,quizId:q.id,serverTime:Date.now()});
});
attempts.get('/attempt/leaderboard',async c=>{
 const a=await attempt(c),q=await quiz(c,a.quiz_id),s=JSON.parse(q.settings);
 if(!s.leaderboard||s.youngAudience||s.mode!=='competition'||!q.score_released||quizState(q,Date.now())!=='closed')fail(403,'resultsHidden');
 const v=await one<{content:string}>(c,'SELECT content FROM versions WHERE id=?',a.version_id);const content=JSON.parse(v!.content) as Quiz;
 await run(c,"UPDATE attempts SET status='expired',submitted_at=? WHERE quiz_id=? AND status='started' AND expires_at>?",Date.now(),q.id,Date.now());
 // Bounded by MAX_ATTEMPTS; score only terminal, fully graded attempts. No speed bonus.
 const rows=(await run<AttemptRow>(c,`SELECT ${attemptFields} FROM attempts WHERE quiz_id=? AND status IN ('submitted','expired') AND expires_at>? LIMIT 600`,q.id,Date.now())).results;
 const leaders=rows.map(r=>({nickname:r.nickname,score:score(content.questions,JSON.parse(r.answers),JSON.parse(r.manual))})).filter(r=>!r.score.pending).sort((x,y)=>y.score.earned-x.score.earned).slice(0,20).map(r=>({nickname:r.nickname,points:r.score.earned}));return c.json({leaders,ties:'shared'});
});
