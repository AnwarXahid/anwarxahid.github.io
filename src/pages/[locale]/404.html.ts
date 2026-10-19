import {records,renderPortfolio} from '../../lib/portfolio';
import {localeCodes,defaultLocale,type SiteLocale} from '../../i18n/locales';
/** GitHub Pages serves only /404.html; the English one forwards readers here. */
export function getStaticPaths(){return localeCodes.filter(locale=>locale!==defaultLocale).map(locale=>({params:{locale}}));}
export async function GET({params}:{params:{locale:SiteLocale}}){const all=await records();return new Response(await renderPortfolio(all.find(p=>p.url==='/404.html')!,all,params.locale),{headers:{'Content-Type':'text/html; charset=utf-8'}});}
