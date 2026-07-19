import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://aiqualityhq.com',
  trailingSlash: 'never',
  integrations: [
    react(),
    sitemap({
      filter: (page) =>
        !page.includes('/report') &&
        !page.includes('/dashboard') &&
        !page.includes('/settings') &&
        !page.includes('/library') &&
        !page.includes('/integrations') &&
        !page.includes('/login') &&
        !page.includes('/signup') &&
        !page.includes('/admin') &&
        !page.includes('/404'),
    }),
  ],
  build: {
    format: 'file',
    inlineStylesheets: 'always',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
