import {records} from '../src/lib/portfolio';
import {writeFile,readdir,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const pages=await records();
const hashes:Record<string,string>={};
async function walk(dir:string){for(const file of await readdir(dir,{withFileTypes:true})){const p=`${dir}/${file.name}`;if(file.isDirectory())await walk(p);else hashes[p]=createHash('sha256').update(await readFile(p)).digest('hex');}}
for(const dir of ['assets','files','images','talkmap'])await walk(dir);
await writeFile('docs/migration-inventory.json',JSON.stringify({pages:pages.map(p=>({source:p.path,url:p.url,title:p.title,redirects:p.redirect_from||[]})),assets:hashes},null,2)+'\n');
