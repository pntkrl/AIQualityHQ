import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../_helpers';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { env, request } = ctx;
  const url = new URL(request.url);

  const clientId = env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return new Response('GitHub OAuth is not configured.', { status: 500 });
  }

  const redirectUri = `${url.origin}/api/auth/github/callback`;
  const scope = 'read:user user:email';

  const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;

  return Response.redirect(githubUrl, 302);
};
