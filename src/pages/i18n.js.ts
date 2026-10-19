import script from '../i18n/client.js?raw';
import {clientLocaleData} from '../i18n/locales';
/** The language menu and suggestion script, with the locale table baked in at build time. */
export function GET(){return new Response(script.replace(/\}\)\(DATA\);\s*$/,`})(${JSON.stringify(clientLocaleData())});\n`),{headers:{'Content-Type':'text/javascript; charset=utf-8'}});}
