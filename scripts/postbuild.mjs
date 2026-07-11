import { existsSync, cpSync, unlinkSync } from 'fs';

const d = 'dist/';

// Rename sitemap-0.xml to sitemap.xml (single sitemap, no index needed)
if (existsSync(d + 'sitemap-0.xml')) {
  cpSync(d + 'sitemap-0.xml', d + 'sitemap.xml');
  unlinkSync(d + 'sitemap-0.xml');
}

// Remove the sitemap index file
if (existsSync(d + 'sitemap-index.xml')) {
  unlinkSync(d + 'sitemap-index.xml');
}
