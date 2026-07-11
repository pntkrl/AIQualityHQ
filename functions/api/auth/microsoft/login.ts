import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../_helpers';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { env, request } = ctx;
  const url = new URL(request.url);

  const clientId = env.MICROSOFT_CLIENT_ID;
  if (!clientId) {
    return new Response('Microsoft OAuth is not configured.', { status: 500 });
  }

  const redirectUri = `${url.origin}/api/auth/microsoft/callback`;
  const scope = 'openid profile email User.Read';

  const msUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;

  return Response.redirect(msUrl, 302);
};
