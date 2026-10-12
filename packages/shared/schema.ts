import {z} from 'zod';
export const limits={questions:50,choices:12,input:40000,fileBytes:10*1024*1024,answerBytes:64000,quizBytes:240000};
const id=z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/).refine(v=>!['__proto__','constructor','prototype'].includes(v));
const text=z.string().trim().min(1).max(4000);
const choice=z.object({id,text:text.max(500)}).strict();
const choices=z.array(choice).min(2).max(limits.choices);
const base={id,prompt:text,points:z.number().min(0.25).max(100),explanation:z.string().max(4000).default(''),sourceRef:z.string().max(500).default('')};
export const questionSchema=z.discriminatedUnion('type',[
 z.object({...base,type:z.literal('single'),choices,correct:id}).strict(),
 z.object({...base,type:z.literal('multiple'),choices,correct:z.array(id).min(1).max(12),partial:z.boolean().default(false)}).strict(),
 z.object({...base,type:z.literal('boolean'),correct:z.boolean()}).strict(),
 z.object({...base,type:z.literal('blanks'),accepted:z.array(z.array(text.max(200)).min(1).max(10)).min(1).max(10),caseSensitive:z.boolean().default(true),normalizeWhitespace:z.boolean().default(true)}).strict(),
 z.object({...base,type:z.literal('matching'),left:choices,right:choices,correct:z.record(id,id),partial:z.boolean().default(false)}).strict(),
 z.object({...base,type:z.literal('short'),rubric:z.string().max(4000).default('')}).strict(),
 z.object({...base,type:z.literal('long'),rubric:z.string().max(4000).default('')}).strict(),
 z.object({...base,type:z.literal('ordering'),choices,correct:z.array(id).min(2).max(12),partial:z.boolean().default(false)}).strict()
]).superRefine((q,ctx)=>{
 const fail=()=>ctx.addIssue({code:'custom',message:'invalidQuestion'});
 const unique=(v:string[])=>new Set(v).size===v.length;
 for(const list of ['choices' in q?q.choices:[], 'left' in q?q.left:[], 'right' in q?q.right:[]])if(!unique(list.map(c=>c.id))||!unique(list.map(c=>c.text.normalize('NFC').trim())))fail();
 if(q.type==='single'&&!q.choices.some(c=>c.id===q.correct))fail();
 if(q.type==='multiple'||q.type==='ordering'){
  if(!unique(q.correct)||q.correct.some(k=>!q.choices.some(c=>c.id===k))||(q.type==='ordering'&&q.correct.length!==q.choices.length))fail();
 }
 if(q.type==='matching'&&(q.left.length!==q.right.length||Object.keys(q.correct).length!==q.left.length||!unique(Object.values(q.correct))||q.left.some(c=>!q.right.some(r=>r.id===q.correct[c.id]))))fail();
});
export type Question=z.infer<typeof questionSchema>;
export const settingsSchema=z.object({
 mode:z.enum(['practice','exam','competition']).default('practice'),
 durationMinutes:z.number().int().min(1).max(240).nullable().default(null),
 startsAt:z.number().int().positive().nullable().default(null),endsAt:z.number().int().positive().nullable().default(null),
 timezone:z.string().max(100).default('UTC').refine(v=>{try{new Intl.DateTimeFormat('en',{timeZone:v});return true;}catch{return false;}},'invalidTime'),
 hostControlled:z.boolean().default(false),lateJoin:z.boolean().default(true),
 maxAttempts:z.number().int().min(1).max(600).default(600),shuffle:z.boolean().default(false),leaderboard:z.boolean().default(false),youngAudience:z.boolean().default(false),
 feedback:z.boolean().default(false),nicknameMode:z.enum(['generated','custom']).default('generated'),
 retentionDays:z.number().int().min(1).max(30).default(30),lifetimeDays:z.number().int().min(1).max(90).default(90)
}).strict().superRefine((s,c)=>{
 const fail=()=>c.addIssue({code:'custom',message:'invalidTime'});
 if(s.startsAt&&s.endsAt&&s.endsAt<=s.startsAt)fail();
 if(s.mode!=='practice'&&(!s.durationMinutes||(!s.hostControlled&&!s.startsAt)))fail();
 if(s.mode!=='practice'&&s.startsAt&&s.endsAt&&s.endsAt>s.startsAt+s.durationMinutes!*60000)fail();
 if(s.mode==='practice'&&s.hostControlled)fail();
 if(s.youngAudience&&s.leaderboard)c.addIssue({code:'custom',message:'invalidSettings'});
});
export const quizSchema=z.object({title:text.max(160),subject:z.string().max(120).default(''),audience:z.string().max(120).default(''),difficulty:z.string().max(80).default(''),language:text.max(80).default('en'),instructions:z.string().max(2000).default(''),settings:settingsSchema,questions:z.array(questionSchema).min(1).max(limits.questions)}).strict().superRefine((q,c)=>{
 if(new Set(q.questions.map(x=>x.id)).size!==q.questions.length||new Set(q.questions.map(x=>x.prompt.normalize('NFC').trim())).size!==q.questions.length)c.addIssue({code:'custom',message:'duplicateQuestion'});
});
export type Quiz=z.infer<typeof quizSchema>;
export type PublicQuestion={id:string;prompt:string;type:Question['type'];points:number;choices?:{id:string;text:string}[];left?:{id:string;text:string}[];right?:{id:string;text:string}[];blanks?:number};
export function publicQuestion(q:Question):PublicQuestion {
 const p:PublicQuestion={id:q.id,prompt:q.prompt,type:q.type,points:q.points};
 if('choices'in q)p.choices=q.choices;
 if(q.type==='matching'){p.left=q.left;p.right=q.right;}
 if(q.type==='blanks')p.blanks=q.accepted.length;
 return p;
}
export const answerSchema=z.union([z.string().max(8000),z.boolean(),z.array(z.string().max(500)).max(12),z.record(id,z.string().max(64)),z.null()]);
export type Answer=z.infer<typeof answerSchema>;
export const answersSchema=z.record(id,answerSchema).refine(v=>Object.keys(v).length<=50);
export type Answers=z.infer<typeof answersSchema>;
export function validAnswer(q:PublicQuestion,a:Answer){
 if(a===null)return true;
 if(q.type==='single')return typeof a==='string'&&q.choices!.some(c=>c.id===a);
 if(q.type==='boolean')return typeof a==='boolean';
 if(q.type==='short'||q.type==='long')return typeof a==='string'&&a.length<=(q.type==='short'?1000:8000);
 if(q.type==='blanks')return Array.isArray(a)&&a.length===q.blanks&&a.every(v=>v.length<=200);
 if(q.type==='matching')return typeof a==='object'&&!Array.isArray(a)&&Object.entries(a).every(([k,v])=>q.left!.some(c=>c.id===k)&&q.right!.some(c=>c.id===v));
 return Array.isArray(a)&&new Set(a).size===a.length&&a.every(v=>q.choices!.some(c=>c.id===v))&&(q.type!=='ordering'||a.length===q.choices!.length);
}
export const generationSchema=z.object({source:z.string().max(limits.input).default(''),topic:z.string().max(1000).default(''),language:text.max(80),audience:z.string().max(120),difficulty:z.string().max(80),count:z.number().int().min(1).max(20),types:z.array(z.enum(['single','multiple','boolean','blanks','matching','short','long','ordering'])).min(1).max(8),consent:z.literal(true)}).strict().refine(v=>v.source.trim().length>0||v.topic.trim().length>0);
