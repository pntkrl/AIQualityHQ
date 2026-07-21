import { existsSync, cpSync, unlinkSync, readFileSync, writeFileSync } from 'fs';

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

// Clean .html extensions from sitemap to prevent 308 redirect loops
if (existsSync(d + 'sitemap.xml')) {
  const sitemapContent = readFileSync(d + 'sitemap.xml', 'utf-8');
  const cleanedSitemap = sitemapContent.replace(/\.html</g, '<');
  writeFileSync(d + 'sitemap.xml', cleanedSitemap, 'utf-8');
}
