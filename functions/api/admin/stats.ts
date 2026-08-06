import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../_helpers';
import { json, error, corsPreflight, checkAuthRateLimit, createRequestContext, log, constantTimeCompare, validateCsrf } from '../_helpers';

function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 1) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const masked = local[0] + '*'.repeat(Math.max(1, local.length - 2)) + local[local.length - 1];
  return masked + domain;
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const reqCtx = createRequestContext(ctx.request, '/api/admin/stats');

  if (ctx.request.method === 'OPTIONS') return corsPreflight(ctx.request);
  if (ctx.request.method !== 'GET') return error('Method not allowed', 405, ctx.request, 'E_METHOD_NOT_ALLOWED');

  const ip = ctx.request.headers.get('CF-Connecting-IP') || 'unknown';
  const userAgent = ctx.request.headers.get('User-Agent');
  const rateLimit = await checkAuthRateLimit(ctx.env.DB, ip, 'admin_stats', userAgent);
  if (!rateLimit.allowed) {
    log(reqCtx, 'warn', 'Rate limited', { ip });
    return error('Too many requests. Please try again later.', 429, ctx.request, 'E_RATE_LIMITED');
  }

  const authHeader = ctx.request.headers.get('Authorization') || ctx.request.headers.get('X-Admin-Token');
  const token = authHeader?.replace('Bearer ', '').trim();
  const adminPassword = ctx.env.ADMIN_PASSWORD;

  if (!adminPassword || !token || !constantTimeCompare(token, adminPassword)) {
    log(reqCtx, 'warn', 'Unauthorized admin access attempt', { ip });
    return error('Unauthorized admin access', 401, ctx.request, 'E_UNAUTHORIZED');
  }

  try {
    const db = ctx.env.DB;

    const totalUsers = await db.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();
    const users7d = await db.prepare("SELECT COUNT(*) as count FROM users WHERE created_at >= datetime('now', '-7 days')").first<{ count: number }>();
    const users30d = await db.prepare("SELECT COUNT(*) as count FROM users WHERE created_at >= datetime('now', '-30 days')").first<{ count: number }>();
    const activeSessions = await db.prepare("SELECT COUNT(*) as count FROM sessions WHERE expires_at > datetime('now')").first<{ count: number }>();
    const totalApiKeys = await db.prepare('SELECT COUNT(*) as count FROM api_keys').first<{ count: number }>();
    const activeApiKeys = await db.prepare('SELECT COUNT(*) as count FROM api_keys WHERE active = 1').first<{ count: number }>();
    const subscriptions = await db.prepare('SELECT plan, COUNT(*) as count FROM subscriptions GROUP BY plan').all<{ plan: string; count: number }>();
    const totalUsage = await db.prepare('SELECT COUNT(*) as count FROM usage_logs').first<{ count: number }>();
    const usage24h = await db.prepare("SELECT COUNT(*) as count FROM usage_logs WHERE timestamp >= datetime('now', '-24 hours')").first<{ count: number }>();
    const recentSignups = await db.prepare('SELECT name, email, created_at FROM users ORDER BY created_at DESC LIMIT 10').all<{ name: string; email: string; created_at: string }>();
    const topEndpoints = await db.prepare('SELECT endpoint, COUNT(*) as count FROM usage_logs GROUP BY endpoint ORDER BY count DESC LIMIT 5').all<{ endpoint: string; count: number }>();

    // Mask emails to reduce PII exposure (keeps audit value while hiding addresses)
    const maskedSignups = (recentSignups.results || []).map((u) => ({
      name: u.name,
      email: maskEmail(u.email),
      created_at: u.created_at,
    }));

    log(reqCtx, 'info', 'Admin stats retrieved');

    return json({
      summary: {
        totalUsers: totalUsers?.count || 0,
        newUsers7d: users7d?.count || 0,
        newUsers30d: users30d?.count || 0,
        activeSessions: activeSessions?.count || 0,
        totalApiKeys: totalApiKeys?.count || 0,
        activeApiKeys: activeApiKeys?.count || 0,
        totalUsageRequests: totalUsage?.count || 0,
        usageRequests24h: usage24h?.count || 0
      },
      subscriptions: subscriptions.results || [],
      recentSignups: maskedSignups,
      topEndpoints: topEndpoints.results || []
    }, 200, ctx.request, { 'Cache-Control': 'no-store', 'X-Request-ID': reqCtx.requestId });
  } catch (err: any) {
    log(reqCtx, 'error', 'Admin stats failed', { error: err.message });
    return error('Failed to fetch admin stats', 500, ctx.request, 'E_STATS_FAILED');
  }
};
