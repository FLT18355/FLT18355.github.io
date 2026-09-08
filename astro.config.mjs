import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';

export default defineConfig({
  site: 'https://flt18355.github.io/',
  // preserve：直接产出 /projects.html 等，与旧站 URL 完全一致
  build: { format: 'preserve' },
  integrations: [vue()],
});
