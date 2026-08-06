import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../_helpers';
import { json, error, corsPreflight, getSessionUser, createRequestContext } from '../_helpers';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const reqCtx = createRequestContext(ctx.request, '/api/auth/me');

  if (ctx.request.method === 'OPTIONS') return corsPreflight(ctx.request);
  if (ctx.request.method !== 'GET') return error('Method not allowed', 405, ctx.request, 'E_METHOD_NOT_ALLOWED');

  const auth = ctx.request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return error('Not authenticated', 401, ctx.request, 'E_MISSING_TOKEN');

  const user = await getSessionUser(ctx.env.DB, token);
  if (!user) return error('Session expired or invalid', 401, ctx.request, 'E_INVALID_SESSION');

  return json({ user }, 200, ctx.request, { 'Cache-Control': 'no-store', 'X-Request-ID': reqCtx.requestId });
};
