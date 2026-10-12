import {records} from '../lib/portfolio';
export async function GET(){return new Response(`<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...(await records()).filter(p=>p.url!='/404.html').map(p=>p.url),'/exam/','/exam/privacy/'].map(p=>`<url><loc>https://anwarxahid.github.io${p}</loc></url>`).join('')}</urlset>`,{headers:{'Content-Type':'application/xml'}});}
