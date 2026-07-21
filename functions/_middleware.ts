// Cloudflare Pages Edge Middleware
// Enforces 301 Redirects for domain canonicalization and URL cleanups

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  let redirected = false;

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
    return Response.redirect(url.toString(), 301);
  }

  // 3. Trailing Slash Normalization (remove trailing slash except root /)
  if (url.pathname.endsWith('/') && url.pathname.length > 1) {
    url.pathname = url.pathname.slice(0, -1);
    return Response.redirect(url.toString(), 301);
  }

  // 4. index.html Normalization (redirect /index.html -> /)
  if (url.pathname === '/index.html') {
    url.pathname = '/';
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
};
