import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../_helpers';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { env, request } = ctx;
  const url = new URL(request.url);

  const code = url.searchParams.get('code');
  if (!code) {
    return new Response('Missing authorization code.', { status: 400 });
  }

  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response('GitHub OAuth is not configured.', { status: 500 });
  }

  // Exchange code for access token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  const tokenData = await tokenRes.json<{ access_token?: string; error?: string }>();
  if (!tokenData.access_token) {
    return new Response(`GitHub token exchange failed: ${tokenData.error || 'unknown error'}`, { status: 502 });
  }

  // Fetch user profile
  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'AIQualityHQ' },
  });
  const userData = await userRes.json<{ login: string; name?: string; email?: string; avatar_url: string }>();

  // Fetch primary email if not public
  let email = userData.email;
  if (!email) {
    const emailRes = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'AIQualityHQ' },
    });
    const emails = await emailRes.json<Array<{ email: string; primary: boolean; verified: boolean }>>();
    email = emails.find(e => e.primary)?.email || emails[0]?.email || '';
  }

  const user = {
    name: userData.name || userData.login,
    email,
    picture: userData.avatar_url,
  };

  const origin = new URL(request.url).origin;

  return new Response(
    `<!DOCTYPE html><html><body><script>
      (function() {
        if (window.opener) {
          window.opener.postMessage({ provider: 'github', user: ${JSON.stringify(user)} }, '${origin}');
        }
        window.close();
      })();
    <\/script></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
};
