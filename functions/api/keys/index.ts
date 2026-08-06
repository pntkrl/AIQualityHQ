import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../_helpers';
import { json, error, corsPreflight, getSessionUser, generateApiKey, uuid, now, checkBodySize, checkAuthRateLimit, createRequestContext, log, validateCsrf } from '../_helpers';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const reqCtx = createRequestContext(ctx.request, '/api/keys');

  if (ctx.request.method === 'OPTIONS') return corsPreflight(ctx.request);

  const auth = ctx.request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return error('Not authenticated', 401, ctx.request, 'E_MISSING_TOKEN');

  const user = await getSessionUser(ctx.env.DB, token);
  if (!user) return error('Session expired or invalid', 401, ctx.request, 'E_INVALID_SESSION');

  if (ctx.request.method === 'GET') {
    try {
      const keys = await ctx.env.DB.prepare(
        'SELECT id, key_identifier, name, active, last_used_at, created_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC'
      ).bind(user.id).all();
      return json({ keys: keys.results }, 200, ctx.request, { 'Cache-Control': 'no-store', 'X-Request-ID': reqCtx.requestId });
    } catch (e: any) {
      log(reqCtx, 'error', 'Failed to list API keys');
      return error('Failed to retrieve API keys', 500, ctx.request, 'E_KEYS_LIST_FAILED');
    }
  }

  if (ctx.request.method === 'POST') {
    // Rate limit key creation (prevent spam)
    const rateLimit = await checkAuthRateLimit(ctx.env.DB, reqCtx.ip, 'create_key');
    if (!rateLimit.allowed) {
      log(reqCtx, 'warn', 'Rate limited key creation');
      return error('Too many requests. Please try again later.', 429, ctx.request, 'E_RATE_LIMITED');
    }

    // CSRF validation for state-changing requests
    const csrfToken = ctx.request.headers.get('X-CSRF-Token') || '';
    if (!csrfToken) return error('X-CSRF-Token header required', 403, ctx.request, 'E_MISSING_CSRF');
    const validCsrf = await validateCsrf(ctx.env.DB, token, csrfToken);
    if (!validCsrf) return error('Invalid CSRF token', 403, ctx.request, 'E_INVALID_CSRF');

    const bodySizeError = checkBodySize(ctx.request);
    if (bodySizeError) return bodySizeError;

    const { name } = await ctx.request.json() as { name?: string };
    const safeName = (name || 'Default').replace(/[<>]/g, '').slice(0, 100);
    const { raw, identifier, hash } = await generateApiKey();

    await ctx.env.DB.prepare(
      'INSERT INTO api_keys (id, user_id, key_identifier, key_hash, name, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(uuid(), user.id, identifier, hash, safeName, now()).run();

    log(reqCtx, 'info', 'API key created', { userId: user.id });

    return json({ key: { raw, identifier, name: safeName } }, 201, ctx.request, { 'Cache-Control': 'no-store', 'X-Request-ID': reqCtx.requestId });
  }

  return error('Method not allowed', 405, ctx.request, 'E_METHOD_NOT_ALLOWED');
};
