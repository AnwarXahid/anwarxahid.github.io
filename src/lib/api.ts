const configured=import.meta.env.PUBLIC_API_BASE;
export const API_BASE=(configured||(import.meta.env.DEV?'http://127.0.0.1:8787/v1':'')).replace(/\/$/,'');
export class ApiError extends Error{constructor(public code:string,public status:number){super(code);}}
export async function api<T=any>(path:string,token?:string,method='GET',data?:unknown):Promise<T>{
 if(!API_BASE)throw new ApiError('offline',503);
 let response:Response;try{response=await fetch(API_BASE+path,{method,headers:{...(token?{Authorization:`Bearer ${token}`}:{ }),...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined,cache:'no-store',referrerPolicy:'no-referrer'});}catch{throw new ApiError('offline',0);}
 const result=await response.json();if(!response.ok)throw new ApiError(result.error?.code||'busy',response.status);return result as T;
}
export function newToken(bytes=32){return Array.from(crypto.getRandomValues(new Uint8Array(bytes)),x=>x.toString(16).padStart(2,'0')).join('');}
export function download(name:string,data:string,type='application/json'){const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function consumeFragment(role:'creator'){
 const token=new URLSearchParams(location.hash.slice(1)).get('token');
 if(token&&/^[a-f0-9]{64}$/.test(token)){history.replaceState(null,'',location.pathname+location.search);sessionStorage.setItem(`quizora.${role}`,token);return token;}
 return sessionStorage.getItem(`quizora.${role}`)||'';
}
export const storage={get<T>(key:string,fallback:T):T{try{return JSON.parse(sessionStorage.getItem(`quizora.${key}`)||'null')??fallback;}catch{return fallback;}},set(key:string,v:unknown){sessionStorage.setItem(`quizora.${key}`,JSON.stringify(v));},remove(key:string){sessionStorage.removeItem(`quizora.${key}`);}};
export function clearDevice(){for(const store of [localStorage,sessionStorage])for(const key of Object.keys(store))if(key.startsWith('quizora.'))store.removeItem(key);}
