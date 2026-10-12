import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const inventory=JSON.parse(await readFile('docs/migration-inventory.json','utf8'));
for(const [path,hash] of Object.entries(inventory.assets)){const output=await readFile(`dist/${path}`);if(createHash('sha256').update(output).digest('hex')!==hash)throw Error(`Asset changed: ${path}`);}
for(const page of inventory.pages){for(const url of [page.url,...page.redirects]){const file=url.endsWith('.html')?`dist${url}`:`dist${url.endsWith('/')?url:url+'/'}index.html`;if(!(await stat(file)).isFile())throw Error(`Missing ${url}`);}}
for(const route of ['','create/','join/','take/','manage/','results/','privacy/','qr/'])await stat(`dist/exam/${route}index.html`);
const homepage=await readFile('dist/index.html','utf8');if(homepage.includes('astro-island'))throw Error('Portfolio unexpectedly hydrated');
console.log(`Verified ${inventory.pages.length} content routes, redirects, 8 exam routes and ${Object.keys(inventory.assets).length} unchanged assets.`);
