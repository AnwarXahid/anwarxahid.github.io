import {useState,type ReactNode} from 'react';
import {useI18n} from '../../i18n';
export function Field({label,children}: {label:string;children:ReactNode}){const {t}=useI18n();return <label className="field"><span>{t(label)}</span>{children}</label>;}
export function Check({label,value,onChange}:{label:string;value:boolean;onChange:(v:boolean)=>void}){const {t}=useI18n();return <label className="check"><input type="checkbox" checked={value} onChange={e=>onChange(e.target.checked)}/><span>{t(label)}</span></label>;}
export function ErrorBox({code}:{code:string}){const {t}=useI18n();return code?<p className="notice error" role="alert">{t(code)}</p>:null;}
export function Copy({value}:{value:string}){const {t}=useI18n();const [copied,set]=useState(false);return <button type="button" className="secondary" onClick={async()=>{try{await navigator.clipboard.writeText(value);set(true);setTimeout(()=>set(false),2000);}catch{set(false);}}}>{t(copied?'copied':'copy')}</button>;}
export function useTask(){const [error,setError]=useState(''),[busy,setBusy]=useState(false);async function run(fn:()=>Promise<void>){setError('');setBusy(true);try{await fn();}catch(e){setError(e instanceof Error?e.message:'busy');}finally{setBusy(false);}}return {error,setError,busy,run};}
