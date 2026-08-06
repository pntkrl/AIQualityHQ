import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../_helpers';
import { json, error, corsPreflight, createRequestContext, log, validateCsrf } from '../_helpers';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const reqCtx = createRequestContext(ctx.request, '/api/auth/logout');

  if (ctx.request.method === 'OPTIONS') return corsPreflight(ctx.request);
  if (ctx.request.method !== 'POST') return error('Method not allowed', 405, ctx.request, 'E_METHOD_NOT_ALLOWED');

  try {
    const auth = ctx.request.headers.get('Authorization') || '';
    const token = auth.replace('Bearer ', '');
    if (!token) return error('Not authenticated', 401, ctx.request, 'E_MISSING_TOKEN');

    // CSRF validation for state-changing requests
    const csrfToken = ctx.request.headers.get('X-CSRF-Token') || '';
    if (!csrfToken) return error('X-CSRF-Token header required', 403, ctx.request, 'E_MISSING_CSRF');
    const validCsrf = await validateCsrf(ctx.env.DB, token, csrfToken);
    if (!validCsrf) return error('Invalid CSRF token', 403, ctx.request, 'E_INVALID_CSRF');

    const db = ctx.env.DB;
    await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();

    log(reqCtx, 'info', 'User logged out');

    return json({
      message: 'Logged out successfully',
      success: true,
    }, 200, ctx.request, {
      'X-Request-ID': reqCtx.requestId,
      'Cache-Control': 'no-store',
    });
  } catch (e: any) {
    log(reqCtx, 'error', 'Logout failed');
    return error('Logout failed', 500, ctx.request, 'E_LOGOUT_FAILED');
  }
};
