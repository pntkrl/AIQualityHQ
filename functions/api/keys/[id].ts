import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../_helpers';
import { json, error, corsPreflight, getSessionUser, createRequestContext, log, validateCsrf } from '../_helpers';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const reqCtx = createRequestContext(ctx.request, '/api/keys/:id');

  if (ctx.request.method === 'OPTIONS') return corsPreflight(ctx.request);
  if (ctx.request.method !== 'DELETE') return error('Method not allowed', 405, ctx.request, 'E_METHOD_NOT_ALLOWED');

  try {
    const auth = ctx.request.headers.get('Authorization') || '';
    const token = auth.replace('Bearer ', '');
    if (!token) return error('Not authenticated', 401, ctx.request, 'E_MISSING_TOKEN');

    const user = await getSessionUser(ctx.env.DB, token);
    if (!user) return error('Session expired or invalid', 401, ctx.request, 'E_INVALID_SESSION');

    // CSRF validation for state-changing requests
    const csrfToken = ctx.request.headers.get('X-CSRF-Token') || '';
    if (!csrfToken) return error('X-CSRF-Token header required', 403, ctx.request, 'E_MISSING_CSRF');
    const validCsrf = await validateCsrf(ctx.env.DB, token, csrfToken);
    if (!validCsrf) return error('Invalid CSRF token', 403, ctx.request, 'E_INVALID_CSRF');

    const keyId = ctx.params.id;
    if (!keyId) return error('Key ID is required', 400, ctx.request, 'E_MISSING_KEY_ID');

    const key = await ctx.env.DB.prepare(
      'SELECT id FROM api_keys WHERE id = ? AND user_id = ?'
    ).bind(keyId, user.id).first();
    if (!key) return error('Key not found', 404, ctx.request, 'E_KEY_NOT_FOUND');

    await ctx.env.DB.prepare('DELETE FROM api_keys WHERE id = ?').bind(keyId).run();

    log(reqCtx, 'info', 'API key deleted', { userId: user.id, keyId });

    return json({ success: true }, 200, ctx.request, { 'X-Request-ID': reqCtx.requestId });
  } catch (e: any) {
    log(reqCtx, 'error', 'Key deletion failed');
    return error('Failed to delete API key', 500, ctx.request, 'E_DELETE_FAILED');
  }
};
