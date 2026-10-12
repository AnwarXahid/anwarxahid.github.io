import {useState} from 'react';
import {api} from '../../lib/api';
import {useI18n} from '../../i18n';
import {ErrorBox,Field,useTask} from './common';

export default function Join(){const {t}=useI18n(),task=useTask();const [code,setCode]=useState('');return <section className="narrow card stack"><p className="eyebrow">Quizora</p><h1>{t('join')}</h1><form className="stack" onSubmit={e=>{e.preventDefault();task.run(async()=>{const r=await api<{id:string}>(`/codes/${encodeURIComponent(code.trim().toUpperCase())}`);location.href=`/exam/take/?id=${r.id}`;});}}><Field label="code"><input autoComplete="off" autoCapitalize="characters" value={code} maxLength={8} minLength={8} required onChange={e=>setCode(e.target.value)}/></Field><ErrorBox code={task.error}/><button disabled={task.busy}>{t('join')}</button></form></section>;}
