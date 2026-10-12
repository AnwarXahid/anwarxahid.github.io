import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {harness,token} from './harness';
import {quiz,correct} from './fixtures';
let h:Awaited<ReturnType<typeof harness>>;
beforeAll(async()=>{h=await harness();});afterAll(async()=>{await h.mf.dispose();});
async function publish(q=quiz){const owner=token();const p=await h.request('/quizzes',owner,'POST',{quiz:q});expect(p.status).toBe(201);return {...p.data,owner};}
async function join(id:string){const participant=token(),key=token().slice(0,32);const r=await h.request(`/quizzes/${id}/join`,participant,'POST',{key});expect(r.status).toBe(201);return {participant,key,id:r.data.id};}
describe('real Worker + D1 integration',()=>{
 it('publishes, preserves immutable versions, joins idempotently, saves, submits, grades, releases and deletes',async()=>{
  const p=await publish(),a=await join(p.id);
  expect((await h.request('/quizzes',p.owner,'POST',{quiz})).data.id).toBe(p.id);
  expect((await h.request(`/quizzes/${p.id}/join`,a.participant,'POST',{key:a.key})).data.id).toBe(a.id);
  const lobby=await h.request(`/quizzes/${p.id}`);expect(JSON.stringify(lobby.data)).not.toContain('Private explanation');expect(lobby.data).not.toHaveProperty('questions');
  expect((await h.request('/attempt',a.participant)).data.questions).toEqual([]);
  await h.request('/attempt/start',a.participant,'POST');const started=await h.request('/attempt',a.participant);expect(started.data.questions).toHaveLength(8);expect(JSON.stringify(started.data)).not.toContain('correct');expect(started.headers.get('Cache-Control')).toBe('no-store');
  const saved=await h.request('/attempt/answers',a.participant,'PATCH',{revision:1,answers:{s:'a'}});expect(saved.status).toBe(200);
  expect((await h.request('/attempt/answers',a.participant,'PATCH',{revision:1,answers:{s:'b'}})).data.answers.s).toBe('a');
  expect((await h.request('/attempt',a.participant)).data.answers.s).toBe('a');
  const key=token().slice(0,32);const submitted=await h.request('/attempt/submit',a.participant,'POST',{revision:2,answers:correct,key});expect(submitted.status).toBe(200);
  expect((await h.request('/attempt/submit',a.participant,'POST',{revision:2,answers:correct,key})).status).toBe(200);
  expect((await h.request('/attempt/answers',a.participant,'PATCH',{revision:3,answers:{s:'b'}})).status).toBe(410);
  expect((await h.request('/attempt/results',a.participant)).data.score).toBeNull();
  await h.request('/manage/release',p.owner,'POST',{scores:true,keys:false});expect((await h.request('/attempt/results',a.participant)).data).toMatchObject({score:{earned:12,pending:2},questions:null});
  for(const question of ['w','l'])expect((await h.request('/manage/grade',p.owner,'POST',{attempt:a.id,question,points:2})).status).toBe(200);
  expect((await h.request('/attempt/results',a.participant)).data.score).toMatchObject({earned:16,pending:0});
  await h.request('/manage/release',p.owner,'POST',{scores:true,keys:true});expect((await h.request('/attempt/results',a.participant)).data.questions).toHaveLength(8);
  const rotated=token();await h.request('/manage/rotate',p.owner,'POST',{token:rotated});expect((await h.request('/manage',p.owner)).status).toBe(401);expect((await h.request('/manage',rotated)).status).toBe(200);
  expect((await h.request('/manage',rotated,'DELETE')).status).toBe(200);expect((await h.request('/manage',rotated,'DELETE')).status).toBe(200);expect((await h.request('/attempt',a.participant)).status).toBe(401);
 });
 it('isolates creator/attempt/job/agent roles and unrelated attempts',async()=>{
  const p=await publish(),a=await join(p.id);expect((await h.request('/manage',a.participant)).status).toBe(401);expect((await h.request('/attempt',p.owner)).status).toBe(401);expect((await h.request('/ai/job',a.participant)).status).toBe(410);expect((await h.request('/agent/claim',p.owner,'POST',{available:true})).status).toBe(401);
  const p2=await publish();expect((await h.request('/manage/grade',p2.owner,'POST',{attempt:a.id,question:'w',points:2})).status).toBe(409);
 });
 it('enforces schedules, late join, host start, close and server deadlines despite client clock data',async()=>{
  const p=await publish({...quiz,settings:{...quiz.settings,mode:'exam',durationMinutes:30,startsAt:Date.now()+3600000,lateJoin:false}});const a=await join(p.id);
  expect((await h.request('/attempt/start',a.participant,'POST')).status).toBe(409);
  await h.db.prepare('UPDATE quizzes SET start_at=?,end_at=? WHERE id=?').bind(Date.now()-1000,Date.now()+60000,p.id).run();
  expect((await h.request(`/quizzes/${p.id}/join`,token(),'POST',{key:token().slice(0,32)})).status).toBe(409);
  expect((await h.request('/attempt/start',a.participant,'POST')).status).toBe(200);
  expect((await h.request('/attempt/answers',a.participant,'PATCH',{revision:1,answers:{s:'a'},clientTime:0})).status).toBe(400);
  await h.request('/attempt/answers',a.participant,'PATCH',{revision:1,answers:{s:'a'}});
  await h.db.prepare('UPDATE attempts SET deadline=? WHERE id=?').bind(Date.now()-1,a.id).run();
  expect((await h.request('/attempt/submit',a.participant,'POST',{revision:2,answers:{s:'b'},key:token().slice(0,32)})).status).toBe(410);
  expect((await h.request('/attempt',a.participant)).data).toMatchObject({status:'expired',answers:{s:'a'}});
  const host=await publish({...quiz,settings:{...quiz.settings,mode:'competition',hostControlled:true,durationMinutes:30}});const b=await join(host.id);expect((await h.request('/attempt/start',b.participant,'POST')).status).toBe(409);await h.request('/manage/start',host.owner,'POST');await h.request('/attempt/start',b.participant,'POST');await h.request('/manage/close',host.owner,'POST');expect((await h.request('/attempt/answers',b.participant,'PATCH',{revision:1,answers:{s:'a'}})).status).toBe(410);
 });
 it('serializes concurrent saves and final submission without reverting terminal state',async()=>{
  const p=await publish(),a=await join(p.id);await h.request('/attempt/start',a.participant,'POST');const key=token().slice(0,32);
  await Promise.all([h.request('/attempt/answers',a.participant,'PATCH',{revision:1,answers:{s:'b'}}),h.request('/attempt/submit',a.participant,'POST',{revision:1,answers:correct,key})]);
  const state=(await h.request('/attempt',a.participant)).data;if(state.status==='started')expect((await h.request('/attempt/submit',a.participant,'POST',{revision:state.revision+1,answers:correct,key})).status).toBe(200);
  const final=(await h.request('/attempt',a.participant)).data;expect(final.status).toBe('submitted');expect(final.answers).toEqual(correct);
 });
 it('authorizes AI jobs, atomically leases once, rejects stale leases, validates output and deletes acknowledged data',async()=>{
  const jobToken=token();const input={source:'',topic:'Planets',language:'en',audience:'Grade 5',difficulty:'easy',count:1,types:['single'],consent:true};
  expect((await h.request('/ai/jobs',token(),'POST',{input,token:jobToken})).status).toBe(401);
  expect((await h.request('/ai/jobs','b'.repeat(64),'POST',{input,token:jobToken})).status).toBe(201);
  const claims=await Promise.all([h.request('/agent/claim','a'.repeat(64),'POST',{available:true}),h.request('/agent/claim','a'.repeat(64),'POST',{available:true})]);const jobs=claims.map(r=>r.data.job).filter(Boolean);expect(jobs).toHaveLength(1);const j=jobs[0];
  expect((await h.request(`/agent/jobs/${j.id}/complete`,'a'.repeat(64),'POST',{lease:token(),questions:[quiz.questions[0]]})).status).toBe(409);
  expect((await h.request(`/agent/jobs/${j.id}/complete`,'a'.repeat(64),'POST',{lease:j.lease,questions:[quiz.questions[0]]})).status).toBe(200);
  expect((await h.request('/ai/job',jobToken)).data.state).toBe('completed');await h.request('/ai/job',jobToken,'DELETE');expect((await h.request('/ai/job',jobToken)).status).toBe(410);
 });
 it('denies expired data immediately and rejects invalid answers',async()=>{
  const p=await publish(),a=await join(p.id);await h.request('/attempt/start',a.participant,'POST');expect((await h.request('/attempt/answers',a.participant,'PATCH',{revision:1,answers:{unknown:'x'}})).status).toBe(400);expect((await h.request('/attempt/answers',a.participant,'PATCH',{revision:1,answers:{m:['x']}})).status).toBe(400);await h.db.prepare('UPDATE quizzes SET expires_at=1 WHERE id=?').bind(p.id).run();expect((await h.request(`/quizzes/${p.id}`)).status).toBe(410);
 });
});
it('keeps practice retakes separate, competition scores private and ties equal',async()=>{
 const q={...quiz,questions:quiz.questions.slice(0,1),settings:{...quiz.settings,mode:'competition' as const,durationMinutes:20,hostControlled:true,leaderboard:true}};
 const p=await publish(q),a=await join(p.id),b=await join(p.id);await h.request('/manage/start',p.owner,'POST');
 for(const person of [a,b]){await h.request('/attempt/start',person.participant,'POST');await h.request('/attempt/submit',person.participant,'POST',{revision:1,answers:{s:'a'},key:token().slice(0,32)});}
 expect((await h.request('/attempt/leaderboard',a.participant)).status).toBe(403);await h.request('/manage/close',p.owner,'POST');await h.request('/manage/release',p.owner,'POST',{scores:true,keys:false});const board=await h.request('/attempt/leaderboard',a.participant);expect(board.data.leaders.map((x:any)=>x.points)).toEqual([2,2]);expect(board.data.ties).toBe('shared');
 const practice=await publish({...quiz,questions:quiz.questions.slice(0,1),settings:{...quiz.settings,feedback:true}});const first=await join(practice.id),second=await join(practice.id);expect(first.id).not.toBe(second.id);await h.request('/attempt/start',first.participant,'POST');await h.request('/attempt/submit',first.participant,'POST',{revision:1,answers:{s:'a'},key:token().slice(0,32)});expect((await h.request('/attempt/results',first.participant)).data.score.earned).toBe(2);
});
it('bounds creation, save rate, queue and expiring job access',async()=>{
 const p=await publish(),a=await join(p.id);await h.request('/attempt/start',a.participant,'POST');await h.request('/attempt/answers',a.participant,'PATCH',{revision:1,answers:{s:'a'}});expect((await h.request('/attempt/answers',a.participant,'PATCH',{revision:2,answers:{s:'b'}})).status).toBe(429);
 const jt=token(),input={source:'Water freezes.',topic:'',language:'en',audience:'Grade 5',difficulty:'easy',count:1,types:['single'],consent:true};const j=await h.request('/ai/jobs','b'.repeat(64),'POST',{input,token:jt});expect(j.status).toBe(201);const claim=await h.request('/agent/claim','a'.repeat(64),'POST',{available:true});await h.db.prepare('UPDATE ai_jobs SET lease_until=1 WHERE id=?').bind(j.data.id).run();expect((await h.request(`/agent/jobs/${j.data.id}/complete`,'a'.repeat(64),'POST',{lease:claim.data.job.lease,questions:[quiz.questions[0]]})).status).toBeGreaterThanOrEqual(400);await h.db.prepare('UPDATE ai_jobs SET expires_at=1 WHERE id=?').bind(j.data.id).run();expect((await h.request('/ai/job',jt)).status).toBe(410);
 const explain=await h.db.prepare('EXPLAIN QUERY PLAN SELECT id FROM attempts WHERE quiz_id=? AND id>? ORDER BY id LIMIT 50').bind(p.id,'').all();expect(JSON.stringify(explain.results)).toContain('attempt_quiz');
});
