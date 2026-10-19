import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const inventory=JSON.parse(await readFile('docs/migration-inventory.json','utf8'));
for(const [path,hash] of Object.entries(inventory.assets)){const output=await readFile(`dist/${path}`);if(createHash('sha256').update(output).digest('hex')!==hash)throw Error(`Asset changed: ${path}`);}
for(const page of inventory.pages){for(const url of [page.url,...page.redirects]){const file=url.endsWith('.html')?`dist${url}`:`dist${url.endsWith('/')?url:url+'/'}index.html`;if(!(await stat(file)).isFile())throw Error(`Missing ${url}`);}}
for(const route of ['','create/','join/','take/','manage/','results/','privacy/','qr/'])await stat(`dist/exam/${route}index.html`);
for(const asset of ['game/index.html','game/game.js','game/game.css','game/social-preview.png','llms.txt'])await stat(`dist/${asset}`);
if(!(await readFile('dist/sitemap.xml','utf8')).includes('https://anwarxahid.github.io/game/'))throw Error('Game missing from sitemap');
const robots=await readFile('dist/robots.txt','utf8');
if(!robots.startsWith('User-agent: *')||!robots.includes('Sitemap: https://anwarxahid.github.io/sitemap.xml'))throw Error('Invalid robots.txt');
// Every language gets the translated pages and its own 404; the language script ships once.
const locales=['zh','hi','es','ar','fr','bn','pt','ru','ur'];
for(const locale of locales){for(const page of inventory.pages){const file=page.url.endsWith('.html')?`dist/${locale}${page.url}`:`dist/${locale}${page.url}index.html`;if(!(await stat(file)).isFile())throw Error(`Missing ${locale} ${page.url}`);}
 const html=await readFile(`dist/${locale}/index.html`,'utf8');if(!html.includes(`data-locale="${locale}"`))throw Error(`Untranslated /${locale}/`);}
if(!(await readFile('dist/i18n.js','utf8')).includes('Asia/Dhaka'))throw Error('Language script missing');
const homepage=await readFile('dist/index.html','utf8');if(homepage.includes('astro-island'))throw Error('Portfolio unexpectedly hydrated');
console.log(`Verified ${inventory.pages.length} content routes in ${locales.length+1} languages, redirects, 8 exam routes and ${Object.keys(inventory.assets).length} unchanged assets.`);
