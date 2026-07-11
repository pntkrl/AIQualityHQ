import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../_helpers';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { env, request } = ctx;
  const url = new URL(request.url);

  const code = url.searchParams.get('code');
  if (!code) {
    return new Response('Missing authorization code.', { status: 400 });
  }

  const clientId = env.MICROSOFT_CLIENT_ID;
  const clientSecret = env.MICROSOFT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response('Microsoft OAuth is not configured.', { status: 500 });
  }

  const redirectUri = `${url.origin}/api/auth/microsoft/callback`;

  // Exchange code for access token
  const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const tokenData = await tokenRes.json<{ access_token?: string; error?: string }>();
  if (!tokenData.access_token) {
    return new Response(`Microsoft token exchange failed: ${tokenData.error || 'unknown error'}`, { status: 502 });
  }

  // Fetch user info using Microsoft Graph API
  const userRes = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const userData = await userRes.json<{ displayName: string; mail?: string; userPrincipalName: string; id?: string }>();

  const photoRes = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  let picture = '';
  if (photoRes.ok) {
    const blob = await photoRes.blob();
    const buffer = await blob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    picture = `data:${blob.type};base64,${base64}`;
  }

  const user = {
    name: userData.displayName || userData.userPrincipalName,
    email: userData.mail || userData.userPrincipalName,
    picture,
  };

  const origin = new URL(request.url).origin;

  return new Response(
    `<!DOCTYPE html><html><body><script>
      (function() {
        if (window.opener) {
          window.opener.postMessage({ provider: 'microsoft', user: ${JSON.stringify(user)} }, '${origin}');
        }
        window.close();
      })();
    <\/script></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
};
