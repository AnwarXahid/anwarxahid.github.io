import type {Answer,Answers,Question} from './schema';
const equal=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
export function grade(q:Question,a:Answer|undefined):number|null{
 if(q.type==='short'||q.type==='long')return null;
 if(a==null)return 0;
 let fraction=0;
 if(q.type==='single'||q.type==='boolean')fraction=a===q.correct?1:0;
 if(q.type==='multiple'&&Array.isArray(a)){
  fraction=q.partial?Math.max(0,(a.filter(x=>q.correct.includes(x)).length-a.filter(x=>!q.correct.includes(x)).length)/q.correct.length):equal([...a].sort(),[...q.correct].sort())?1:0;
 }
 if(q.type==='blanks'&&Array.isArray(a)){
  const norm=(s:string)=>{let x=s.normalize('NFC');if(q.normalizeWhitespace)x=x.trim().replace(/\s+/gu,' ');return q.caseSensitive?x:x.toLowerCase();};
  fraction=q.accepted.every((alternatives,i)=>alternatives.some(v=>norm(v)===norm(a[i]??'')))?1:0;
 }
 if(q.type==='matching'&&typeof a==='object'&&!Array.isArray(a)){
  const n=Object.entries(q.correct).filter(([k,v])=>a[k]===v).length;fraction=q.partial?n/q.left.length:n===q.left.length?1:0;
 }
 if(q.type==='ordering'&&Array.isArray(a)){const n=q.correct.filter((v,i)=>a[i]===v).length;fraction=q.partial?n/q.correct.length:n===q.correct.length?1:0;}
 return Math.round(q.points*fraction*10000)/10000;
}
export function score(questions:Question[],answers:Answers,manual:Record<string,number>={}){
 const items=questions.map(q=>({id:q.id,possible:q.points,earned:q.type==='short'||q.type==='long'?(manual[q.id]??null):grade(q,answers[q.id])}));
 return {items,total:items.reduce((s,i)=>s+i.possible,0),earned:items.reduce((s,i)=>s+(i.earned??0),0),gradedPossible:items.reduce((s,i)=>s+(i.earned===null?0:i.possible),0),pending:items.filter(i=>i.earned===null).length};
}
export function csvCell(v:unknown){let s=String(v??'');if(/^[\s]*[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
