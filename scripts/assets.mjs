import {cp,mkdir,access} from 'node:fs/promises';
await mkdir('public',{recursive:true});
for (const name of ['assets','images','files','talkmap','robots.txt','CNAME']) {
  try {await access(name); await cp(name,`public/${name}`,{recursive:true});} catch(e){if(e.code!=='ENOENT')throw e;}
}
