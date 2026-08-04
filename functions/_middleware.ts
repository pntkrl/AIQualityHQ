// Cloudflare Pages Edge Middleware
// Enforces 301 Redirects for domain canonicalization, URL cleanups, and global HSTS

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  let redirected = false;

  const hstsHeader = 'max-age=31536000; includeSubDomains; preload';

  // 1. Force HTTPS protocol (301 Redirect http -> https)
  if (url.protocol === 'http:') {
    url.protocol = 'https:';
    redirected = true;
  }

  // 2. Hostname Canonicalization (301 Redirect www.aiqualityhq.com -> aiqualityhq.com)
  if (url.hostname === 'www.aiqualityhq.com') {
    url.hostname = 'aiqualityhq.com';
    redirected = true;
  }

  if (redirected) {
    const res = Response.redirect(url.toString(), 301);
    res.headers.set('Strict-Transport-Security', hstsHeader);
    return res;
  }

  // 3. Handle HEAD preflight/verification requests cleanly
  if (context.request.method === 'HEAD') {
    const res = await context.next();
    res.headers.set('Strict-Transport-Security', hstsHeader);
    return res;
  }

  // 4. Trailing Slash Normalization (remove trailing slash except root /)
  if (url.pathname.endsWith('/') && url.pathname.length > 1) {
    url.pathname = url.pathname.slice(0, -1);
    const res = Response.redirect(url.toString(), 301);
    res.headers.set('Strict-Transport-Security', hstsHeader);
    return res;
  }

  // 5. index.html Normalization (redirect /index.html -> /)
  if (url.pathname === '/index.html') {
    url.pathname = '/';
    const res = Response.redirect(url.toString(), 301);
    res.headers.set('Strict-Transport-Security', hstsHeader);
    return res;
  }

  const response = await context.next();
  response.headers.set('Strict-Transport-Security', hstsHeader);

  // Allowlist QA & Monitoring tools on read-only GET/HEAD requests for reliable audit scores
  const userAgent = context.request.headers.get('User-Agent') || '';
  const isQA = /(?:Google-Lighthouse|Chrome-Lighthouse|Lighthouse|PageSpeed|GTmetrix|WebPageTest|PTST|UptimeRobot|Pingdom|StatusCake|BetterUptime|Datadog|NewRelic|Site24x7|LinkWatcher|VibeCodingList|Googlebot|Bingbot|DuckDuckBot)/i.test(userAgent);
  if (isQA && (context.request.method === 'GET' || context.request.method === 'HEAD')) {
    response.headers.set('X-QA-Monitoring-Allowlist', 'passed');
  }

  return response;
};
