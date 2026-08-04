import { readFileSync, existsSync } from 'fs';

const site = process.env.SITE_URL || 'https://aiqualityhq.com';
const sitemapPath = 'dist/sitemap.xml';

async function warmEdgeCache() {
  console.log(`🔥 Pre-warming Cloudflare Edge CDN cache for ${site}...`);

  let urls = [
    '/',
    '/checker',
    '/prompt-rewriter',
    '/jailbreak-detector',
    '/prompt-injection-scanner',
    '/prompt-length-optimizer',
    '/ai-system-prompt-generator',
    '/ai-audit',
    '/pricing',
    '/docs',
    '/articles',
    '/faq',
    '/about',
    '/partners',
    '/contact',
    '/terms',
    '/privacy',
    '/how-it-was-built',
    '/generative-engine-optimization-ai-visibility',
    '/ai-software-testing',
    '/ai-in-test-automation',
    '/artificial-intelligence-testing',
    '/artificial-intelligence-in-testing',
    '/artificial-intelligence-in-software-testing'
  ];

  if (existsSync(sitemapPath)) {
    try {
      const xml = readFileSync(sitemapPath, 'utf-8');
      const matches = xml.match(/<loc>(.*?)<\/loc>/g);
      if (matches) {
        urls = Array.from(new Set(matches.map(m => m.replace('<loc>', '').replace('</loc>', ''))));
      }
    } catch (e) {
      console.warn('Could not parse sitemap for cache warming, using default route list.');
    }
  }

  let warmedCount = 0;
  for (const urlStr of urls) {
    try {
      const targetUrl = urlStr.startsWith('http') ? urlStr : `${site}${urlStr}`;
      const res = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'AIQualityHQ-EdgeCacheWarmer/1.0',
          'Accept': 'text/html,application/xhtml+xml'
        }
      });
      const cacheStatus = res.headers.get('cf-cache-status') || res.headers.get('x-cache') || 'FETCHED';
      console.log(`  ✓ ${targetUrl} [${res.status}] (CF-Cache: ${cacheStatus})`);
      warmedCount++;
    } catch (err) {
      console.warn(`  ✗ Failed to warm ${urlStr}:`, err.message);
    }
  }

  console.log(`\n✨ Successfully pre-warmed ${warmedCount} public HTML routes at Cloudflare Edge CDN!`);
}

warmEdgeCache().catch(console.error);
