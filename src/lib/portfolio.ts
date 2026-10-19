/** Build-time compatibility adapter: original records remain the single source of truth. */
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import {parse} from 'yaml';
import MarkdownIt from 'markdown-it';
import {Liquid, Tag, Value, type Context, type Emitter, type Parser, type TagToken, type Template, type TopLevelToken} from 'liquidjs';
import {locales, localeCodes, defaultLocale, LOCALE_STORAGE_KEY, type SiteLocale} from '../i18n/locales';
const md=new MarkdownIt({html:true,linkify:true}); // trusted repository content only
const engine=new Liquid({root:path.resolve('_includes'),jekyllInclude:true});
engine.registerFilter('relative_url',(s)=>s||'/');
engine.registerFilter('absolute_url',(s)=>new URL(s||'/', 'https://anwarxahid.github.io').href);
engine.registerFilter('normalize_whitespace',(s)=>String(s||'').replace(/\s+/g,' ').trim());
engine.registerFilter('jsonify',JSON.stringify);
engine.registerFilter('slugify',(s)=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-'));

/** A page URL in the given language: English lives at the root, others under /<code>/. */
export const localizeUrl=(url:string,locale:SiteLocale)=>locale===defaultLocale?url:`/${locale}${url.startsWith('/')?url:`/${url}`}`;
/** Pages whose own text is translated; posts, papers and project pages keep their English body. */
export const isTranslatedPage=(page:RecordPage)=>page.path.startsWith('_pages/');
const localeOf=(ctx:{getSync(p:PropertyKey[]):unknown})=>(ctx.getSync(['locale']) as SiteLocale|undefined)??defaultLocale;
engine.registerFilter('lurl',function(this:{context:Context},s:string){return localizeUrl(s||'/',localeOf(this.context));});
const dateStyles:Record<string,Intl.DateTimeFormatOptions>={year:{year:'numeric'},month:{month:'short',year:'numeric'},medium:{dateStyle:'medium'},long:{dateStyle:'long'}};
engine.registerFilter('ldate',function(this:{context:Context},value:unknown,style='long'){
 if(value===undefined||value===null||value==='')return '';
 const date=value instanceof Date?value:new Date(String(value).length===10?`${value}T00:00:00Z`:String(value));
 if(Number.isNaN(date.getTime()))return String(value);
 return new Intl.DateTimeFormat(locales[localeOf(this.context)].intl,{...dateStyles[style],timeZone:'UTC'}).format(date);
});

/** Keys looked up while rendering, so tests can prove every translation is used and complete. */
export const translationLog={used:new Set<string>(),missing:new Set<string>()};
const parsedTranslations=new Map<string,Template[]>();
/**
 * {% t "key" %}English text{% endt %} renders the current language's text for "key",
 * or the inline English. Translations may contain markup and Liquid, so links and
 * emphasis can sit wherever the sentence needs them in that language.
 */
engine.registerTag('t',class extends Tag{
 private key:Value; private tpls:Template[]=[];
 constructor(token:TagToken,remain:TopLevelToken[],liquid:Liquid,parser:Parser){
  super(token,remain,liquid);
  this.key=new Value(token.args,liquid);
  const stream=parser.parseStream(remain)
   .on('tag:endt',()=>stream.stop())
   .on('template',(tpl:Template)=>this.tpls.push(tpl))
   .on('end',()=>{throw new Error(`{% t ${token.args} %} is missing {% endt %}`);});
  stream.start();
 }
 *render(ctx:Context,emitter:Emitter):Generator<unknown,void,unknown>{
  const key=String(yield this.key.value(ctx,false));
  const locale=localeOf(ctx);
  translationLog.used.add(key);
  const text=(ctx.getSync(['i18n']) as Record<string,string>|undefined)?.[key];
  if(text===undefined){
   if(locale!==defaultLocale)translationLog.missing.add(`${locale}:${key}`);
   yield this.liquid.renderer.renderTemplates(this.tpls,ctx,emitter);
   return;
  }
  let tpls=parsedTranslations.get(text);
  if(!tpls){tpls=this.liquid.parse(text);parsedTranslations.set(text,tpls);}
  yield this.liquid.renderer.renderTemplates(tpls,ctx,emitter);
 }
});

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

/** One language's translations: interface strings plus overlays for records and data files. */
export interface Translations {
 ui?:Record<string,string>;
 records?:Record<string,Record<string,string>>;
 news?:Record<string,string>;
 experience?:Record<string,Record<string,string>>;
}
const translationCache=new Map<SiteLocale,Promise<Translations>>();
export function translations(locale:SiteLocale):Promise<Translations>{
 if(locale===defaultLocale)return Promise.resolve({});
 let loaded=translationCache.get(locale);
 if(!loaded){loaded=fs.readFile(`_i18n/${locale}.yml`,'utf8').then(text=>parse(text) as Translations);translationCache.set(locale,loaded);}
 return loaded;
}
const recordId=(record:RecordPage)=>path.basename(record.path).replace(/\.(md|html)$/,'');
const overlay=(record:RecordPage,t:Translations)=>({...record,...t.records?.[recordId(record)]});

export async function renderPortfolio(page:RecordPage, all:RecordPage[], locale:SiteLocale=defaultLocale){
 const t=await translations(locale);
 const translated=locale===defaultLocale||isTranslatedPage(page);
 const site=parse(await fs.readFile('_config.yml','utf8'));
 site.time=new Date();site.data={};
 for(const file of (await fs.readdir('_data')).filter(s=>s.endsWith('.yml')))site.data[file.replace('.yml','')]=parse(await fs.readFile(`_data/${file}`,'utf8'));
 site.data.news=(site.data.news||[]).map((item:{date:string;text:string})=>({...item,text:t.news?.[item.date]??item.text}));
 site.data.experience=(site.data.experience||[]).map((job:{id:string})=>({...job,...t.experience?.[job.id]}));
 const localized=all.map(record=>overlay(record,t));
 site.posts=localized.filter(p=>p.path.startsWith('_posts')).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 site.portfolio=localized.filter(p=>p.path.startsWith('_portfolio'));
 site.publications=localized.filter(p=>p.path.startsWith('_publications'));
 const current=translated?overlay(page,t):page;
 const context={
  site,page:current,content:'',locale,i18n:t.ui||{},
  lmeta:{code:locale,...locales[locale]},
  page_translated:translated,
  // hreflang only links real translations: localized post/paper pages keep their English body.
  hreflang:isTranslatedPage(page)&&page.sitemap!==false,
  english_only:translated?'':' lang="en" dir="ltr"',
  canonical:translated?localizeUrl(page.url,locale):page.url,
  alternates:localeCodes.map(code=>({code,name:locales[code].name,lang:locales[code].lang,dir:locales[code].dir,url:localizeUrl(page.url,code),current:code===locale})),
  other_locales:localeCodes.filter(code=>code!==defaultLocale),
  locale_storage_key:LOCALE_STORAGE_KEY,
 };
 let content=await engine.parseAndRender(page.content,context);
 // HTML-first portfolio pages must not turn indented Liquid loops into code blocks.
 if(!page.content.trimStart().startsWith('<'))content=md.render(content);
 let layout=page.layout;
 while(layout){const parsed=matter(await fs.readFile(`_layouts/${layout}.html`,'utf8')); content=await engine.parseAndRender(parsed.content,{...context,content});layout=parsed.data.layout;}
 return content;
}
