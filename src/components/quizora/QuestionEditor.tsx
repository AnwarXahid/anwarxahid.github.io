import type {Question} from '../../../packages/shared/schema';
import {useI18n} from '../../i18n';
import {newQuestion} from '../../lib/samples';
import {Check,Field} from './common';
export const types=['single','multiple','boolean','blanks','matching','short','long','ordering'] as const;
export default function QuestionEditor({q,onChange}:{q:Question;onChange:(q:Question)=>void}){
 const {t,n}=useI18n();const patch=(v:Record<string,unknown>)=>onChange({...q,...v} as Question);
 function list(name:'choices'|'left'|'right'){
  const values=(q as any)[name] as {id:string;text:string}[];
  return <div className="stack"><h4>{t(name)}</h4>{values.map((c,i)=><div className="row" key={c.id}><label className="grow"><span className="sr-only">{t(name)} {n(i+1)}</span><input value={c.text} maxLength={500} onChange={e=>patch({[name]:values.map(x=>x.id===c.id?{...x,text:e.target.value}:x)})}/></label><button type="button" className="secondary" disabled={values.length<=2} onClick={()=>patch({[name]:values.filter(x=>x.id!==c.id)})} aria-label={`${t('remove')} ${n(i+1)}`}>×</button></div>)}<button type="button" className="secondary" disabled={values.length>=12} onClick={()=>patch({[name]:[...values,{id:crypto.randomUUID(),text:''}]})}>{t('add')}</button></div>;
 }
 return <div className="stack"><div className="grid two"><Field label="type"><select value={q.type} onChange={e=>onChange({...newQuestion(e.target.value as Question['type']),id:q.id,prompt:q.prompt,points:q.points})}>{types.map(type=><option key={type} value={type}>{t(type)}</option>)}</select></Field><Field label="points"><input type="number" min="0.25" max="100" step="0.25" value={q.points} onChange={e=>patch({points:Number(e.target.value)})}/></Field></div>
 <Field label="prompt"><textarea value={q.prompt} maxLength={4000} onChange={e=>patch({prompt:e.target.value})}/></Field>
 {'choices'in q&&list('choices')}
 {q.type==='single'&&<Field label="correct"><select value={q.correct} onChange={e=>patch({correct:e.target.value})}>{q.choices.map((c,i)=><option key={c.id} value={c.id}>{n(i+1)} · {c.text}</option>)}</select></Field>}
 {q.type==='multiple'&&<fieldset><legend>{t('correct')}</legend>{q.choices.map((c,i)=><label className="check" key={c.id}><input type="checkbox" checked={q.correct.includes(c.id)} onChange={e=>patch({correct:e.target.checked?[...q.correct,c.id]:q.correct.filter(id=>id!==c.id)})}/>{n(i+1)} · {c.text}</label>)}</fieldset>}
 {q.type==='boolean'&&<Field label="correct"><select value={String(q.correct)} onChange={e=>patch({correct:e.target.value==='true'})}><option value="true">{t('true')}</option><option value="false">{t('false')}</option></select></Field>}
 {q.type==='blanks'&&<><Field label="accepted"><textarea value={q.accepted.map(a=>a.join(';')).join('\n')} onChange={e=>patch({accepted:e.target.value.split('\n').map(s=>s.split(';'))})}/></Field><Check label="caseSensitive" value={q.caseSensitive} onChange={v=>patch({caseSensitive:v})}/><Check label="normalizeWhitespace" value={q.normalizeWhitespace} onChange={v=>patch({normalizeWhitespace:v})}/></>}
 {q.type==='matching'&&<><div className="grid two">{list('left')}{list('right')}</div><fieldset><legend>{t('correct')}</legend>{q.left.map(l=><label className="match-row" key={l.id}><span>{l.text}</span><select value={q.correct[l.id]||''} onChange={e=>patch({correct:{...q.correct,[l.id]:e.target.value}})}><option value="">{t('select')}</option>{q.right.map(r=><option key={r.id} value={r.id}>{r.text}</option>)}</select></label>)}</fieldset></>}
 {q.type==='ordering'&&<fieldset><legend>{t('correct')}</legend>{q.choices.map((_,i)=><label className="match-row" key={i}><span>{n(i+1)}</span><select value={q.correct[i]||''} onChange={e=>{const a=[...q.correct];a[i]=e.target.value;patch({correct:a});}}><option value="">{t('select')}</option>{q.choices.map(c=><option key={c.id} value={c.id}>{c.text}</option>)}</select></label>)}</fieldset>}
 {'partial'in q&&<Check label="partial" value={q.partial} onChange={v=>patch({partial:v})}/>}
 {'rubric'in q&&<Field label="rubric"><textarea value={q.rubric} maxLength={4000} onChange={e=>patch({rubric:e.target.value})}/></Field>}
 <Field label="explanation"><textarea value={q.explanation} maxLength={4000} onChange={e=>patch({explanation:e.target.value})}/></Field>{q.sourceRef&&<blockquote>{q.sourceRef}</blockquote>}</div>;
}
