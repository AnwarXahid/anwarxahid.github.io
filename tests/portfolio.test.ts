import {describe,it,expect} from 'vitest';
import {readFile} from 'node:fs/promises';
import {records,renderPortfolio,localizeUrl,translationLog,translations} from '../src/lib/portfolio';
import {locales,localeCodes} from '../src/i18n/locales';
it('keeps portfolio content and presents the four Lab projects under one nav entry',async()=>{const all=await records();expect(all.filter(p=>p.path.startsWith('_publications'))).toHaveLength(4);expect(all.filter(p=>p.path.startsWith('_posts'))).toHaveLength(3);const home=await renderPortfolio(all.find(p=>p.url==='/')!,all);for(const anchor of ['about','research','publications','experience','projects','teaching','writing','contact'])expect(home).toContain(`id="${anchor}"`);expect(home).toContain('Soft Assertions');expect(home).toContain('/files/resume.pdf');expect(home).toContain('Unsupervised Lab');expect(home).not.toContain('>Fun</a>');expect(home).not.toContain('>Quizora</a>');expect(home).not.toContain('{%');const lab=await renderPortfolio(all.find(p=>p.url==='/lab/')!,all);for(const name of ['Quizora','QR Code Generator','PromptDude','OpenMath Studio'])expect(lab).toContain(name);expect(lab).toContain('https://anwarxahid.github.io/PromptDude/');expect(lab).not.toContain('PromptPilot');expect(lab).not.toContain('game-start');expect(all.find(p=>p.url==='/lab/')?.redirect_from).toContain('/fun/');expect((await readFile('files/resume.pdf')).byteLength).toBeGreaterThan(1000);});
describe('site languages',()=>{
 it('renders every page in all ten languages with complete, used translations',async()=>{
  const all=await records();
  expect(localeCodes).toEqual(['en','zh','hi','es','ar','fr','bn','pt','ru','ur']);
  for(const locale of localeCodes){
   translationLog.used.clear();translationLog.missing.clear();
   for(const page of all){const html=await renderPortfolio(page,all,locale);expect(html).not.toMatch(/{%|{{/);expect(html).toContain(`<html lang="${locales[locale].lang}" dir="${locales[locale].dir}"`);}
   expect([...translationLog.missing]).toEqual([]);
   const ui=Object.keys((await translations(locale)).ui||{});
   expect(ui.filter(key=>!translationLog.used.has(key))).toEqual([]);
  }
 });
 it('links within the chosen language and points search engines at real translations only',async()=>{
  const all=await records();const home=all.find(p=>p.url==='/')!;const post=all.find(p=>p.path.startsWith('_posts'))!;
  const bn=await renderPortfolio(home,all,'bn');
  expect(bn).toContain('href="/bn/lab/"');expect(bn).toContain('href="/bn/about-me/"');expect(bn).toContain('<link rel="canonical" href="https://anwarxahid.github.io/bn/">');
  expect(bn).toContain('hreflang="x-default" href="https://anwarxahid.github.io/"');expect(bn).toContain('লুকোনো ফাটল');
  expect(bn).toContain('href="/files/resume.pdf"');expect(await renderPortfolio(all.find(p=>p.url==='/lab/')!,all,'bn')).toContain('href="/exam/"');
  const ar=await renderPortfolio(home,all,'ar');expect(ar).toContain('dir="rtl"');expect(ar).toContain('/assets/css/i18n.css');
  const bnPost=await renderPortfolio(post,all,'bn');
  expect(bnPost).toContain(`<link rel="canonical" href="https://anwarxahid.github.io${post.url}">`);expect(bnPost).not.toContain('rel="alternate" hreflang=');expect(bnPost).toContain('class="i18n-notice"');expect(bnPost).toContain('lang="en" dir="ltr"');
  const enPost=await renderPortfolio(post,all,'en');expect(enPost).not.toContain('i18n-notice');expect(enPost).not.toContain('rel="alternate" hreflang=');
  expect(localizeUrl('/lab/','en')).toBe('/lab/');expect(localizeUrl('/#about','pt')).toBe('/pt/#about');
 });
 it('serves the browser language script with the locale table baked in',async()=>{
  const {GET}=await import('../src/pages/i18n.js.ts');const js=await GET().text();
  expect(js).not.toContain('DATA');expect(js).toContain('"Asia/Dhaka"');expect(js).toContain('বাংলায় দেখুন');
  expect(()=>new Function(js)).not.toThrow();
 });
});
