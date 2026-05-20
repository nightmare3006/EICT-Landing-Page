import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  output: 'static',
  site: 'https://eict-sa.netlify.app',
  compressHTML: true,
  exclude: ['admin/**'],
});