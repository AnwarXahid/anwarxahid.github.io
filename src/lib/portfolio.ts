/** Build-time compatibility adapter: original records remain the single source of truth. */
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import {parse} from 'yaml';
import MarkdownIt from 'markdown-it';
import {Liquid} from 'liquidjs';
const md=new MarkdownIt({html:true,linkify:true}); // trusted repository content only
const engine=new Liquid({root:path.resolve('_includes'),jekyllInclude:true});
engine.registerFilter('relative_url',(s)=>s||'/');
engine.registerFilter('absolute_url',(s)=>new URL(s||'/', 'https://anwarxahid.github.io').href);
engine.registerFilter('normalize_whitespace',(s)=>String(s||'').replace(/\s+/g,' ').trim());
engine.registerFilter('jsonify',JSON.stringify);
engine.registerFilter('slugify',(s)=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-'));
export interface RecordPage { path:string; url:string; content:string; layout?:string; title?:string; excerpt?:string; date?:string; redirect_from?:string[]; [key:string]:unknown }
export async function records(){
 const all:RecordPage[]=[];
 for(const [dir,prefix] of [['_pages',''],['_posts','blog'],['_publications','publication'],['_portfolio','portfolio']]){
  for(const name of (await fs.readdir(dir)).sort()){
   const raw=await fs.readFile(`${dir}/${name}`,'utf8'); const {data,content}=matter(raw);
   const slug=name.replace(/\.(md|html)$/,'');
   const url=data.permalink || `/${prefix}/${dir==='_posts'?slug.replace(/^\d{4}-\d{2}-\d{2}-/,''):slug}/`;
   all.push({...data,path:`${dir}/${name}`,url,content,layout:data.layout||(dir==='_publications'?'publication':'single'),date:data.date||name.match(/^\d{4}-\d{2}-\d{2}/)?.[0],excerpt:data.excerpt||md.render(content.split('\n\n')[1]||'')});
  }
 }
 return all;
}
export async function renderPortfolio(page:RecordPage, all:RecordPage[]){
 const site=parse(await fs.readFile('_config.yml','utf8'));
 site.time=new Date();site.data={};
 for(const file of (await fs.readdir('_data')).filter(s=>s.endsWith('.yml')))site.data[file.replace('.yml','')]=parse(await fs.readFile(`_data/${file}`,'utf8'));
 site.data.navigation.main.push({title:'Quizora',url:'/exam/'});
 site.posts=all.filter(p=>p.path.startsWith('_posts')).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 site.portfolio=all.filter(p=>p.path.startsWith('_portfolio'));
 site.publications=all.filter(p=>p.path.startsWith('_publications'));
 const context={site,page,content:''};
 let content=await engine.parseAndRender(page.content,context);
 // HTML-first portfolio pages must not turn indented Liquid loops into code blocks.
 if(!page.content.trimStart().startsWith('<'))content=md.render(content);
 let layout=page.layout;
 while(layout){const parsed=matter(await fs.readFile(`_layouts/${layout}.html`,'utf8')); content=await engine.parseAndRender(parsed.content,{...context,content});layout=parsed.data.layout;}
 return content;
}
