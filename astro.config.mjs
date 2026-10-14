// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { oldUrls } from './src/data/redirects.mjs';

export default defineConfig({
  site: 'https://interimstaffing.co.uk',
  trailingSlash: 'ignore',
  build: { format: 'file' },
  scopedStyleStrategy: 'class',
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  server: { port: 4341 },
  redirects: oldUrls,
  integrations: [sitemap({ filter: (p) => !p.includes('/404') && !Object.keys(oldUrls).some((o) => p.replace(/\/$/, '').endsWith(o.replace(/\/$/, ''))) })],
});
