import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
export default defineConfig({site:'https://anwarxahid.github.io',base:'/',output:'static',integrations:[react()],devToolbar:{enabled:false}});
