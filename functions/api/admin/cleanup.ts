import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../_helpers';
import { json, error, corsPreflight, createRequestContext, log, checkAuthRateLimit, constantTimeCompare, validateCsrf } from '../_helpers';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const reqCtx = createRequestContext(ctx.request, '/api/admin/cleanup');

  if (ctx.request.method === 'OPTIONS') return corsPreflight(ctx.request);
  if (ctx.request.method !== 'POST') return error('Method not allowed', 405, ctx.request, 'E_METHOD_NOT_ALLOWED');

  // Rate limit admin actions
  const { allowed } = await checkAuthRateLimit(ctx.env.DB, reqCtx.ip, 'admin_cleanup');
  if (!allowed) {
    log(reqCtx, 'warn', 'Rate limited cleanup attempt');
    return error('Too many requests', 429, ctx.request, 'E_RATE_LIMITED');
  }

  // Authenticate admin
  const authHeader = ctx.request.headers.get('Authorization') || ctx.request.headers.get('X-Admin-Token');
  const token = authHeader?.replace('Bearer ', '').trim();
  const adminPassword = ctx.env.ADMIN_PASSWORD;

  if (!adminPassword || !token || !constantTimeCompare(token, adminPassword)) {
    log(reqCtx, 'warn', 'Unauthorized cleanup attempt');
    return error('Unauthorized', 401, ctx.request, 'E_UNAUTHORIZED');
  }

  // CSRF validation for state-changing operation
  const sessionToken = ctx.request.headers.get('Authorization')?.replace('Bearer ', '').trim();
  const csrfToken = ctx.request.headers.get('X-CSRF-Token');
  if (sessionToken && csrfToken) {
    const csrfValid = await validateCsrf(ctx.env.DB, sessionToken, csrfToken);
    if (!csrfValid) {
      log(reqCtx, 'warn', 'CSRF validation failed');
      return error('Invalid CSRF token', 403, ctx.request, 'E_CSRF_FAILED');
    }
  }

  try {
    const db = ctx.env.DB;

    // Delete expired sessions
    const expiredSessions = await db.prepare(
      "DELETE FROM sessions WHERE expires_at < datetime('now')"
    ).run();

    // Delete old auth rate limits (older than 1 hour)
    const oldRateLimits = await db.prepare(
      "DELETE FROM auth_rate_limits WHERE timestamp < datetime('now', '-1 hour')"
    ).run();

    // Delete old usage logs (older than 90 days) — optional, keeps storage lean
    const oldUsage = await db.prepare(
      "DELETE FROM usage_logs WHERE timestamp < datetime('now', '-90 days')"
    ).run();

    log(reqCtx, 'info', 'Cleanup completed', {
      sessionsDeleted: expiredSessions.meta?.changes || 0,
      rateLimitsDeleted: oldRateLimits.meta?.changes || 0,
      usageDeleted: oldUsage.meta?.changes || 0,
    });

    return json({
      message: 'Cleanup completed',
      results: {
        expiredSessions: expiredSessions.meta?.changes || 0,
        oldRateLimits: oldRateLimits.meta?.changes || 0,
        oldUsageLogs: oldUsage.meta?.changes || 0,
      }
    }, 200, ctx.request, {
      'X-Request-ID': reqCtx.requestId,
      'Cache-Control': 'no-store',
    });

  } catch (e: any) {
    log(reqCtx, 'error', 'Cleanup failed');
    return error('Cleanup failed', 500, ctx.request, 'E_CLEANUP_FAILED');
  }
};
