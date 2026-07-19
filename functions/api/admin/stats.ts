import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../_helpers';
import { json, error, corsPreflight } from '../_helpers';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  if (ctx.request.method === 'OPTIONS') return corsPreflight();
  if (ctx.request.method !== 'GET') return error('Method not allowed', 405);

  // Authenticate admin using X-Admin-Token header or Authorization header
  const authHeader = ctx.request.headers.get('Authorization') || ctx.request.headers.get('X-Admin-Token');
  const token = authHeader?.replace('Bearer ', '').trim();
  const adminPassword = ctx.env.ADMIN_PASSWORD || "aiqualityhq-admin-secret-2026";

  if (!token || token !== adminPassword) {
    return error('Unauthorized admin access', 401);
  }

  try {
    const db = ctx.env.DB;

    // 1. Total users
    const totalUsers = await db.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();

    // 2. Users in last 7 days and 30 days
    const users7d = await db.prepare("SELECT COUNT(*) as count FROM users WHERE created_at >= datetime('now', '-7 days')").first<{ count: number }>();
    const users30d = await db.prepare("SELECT COUNT(*) as count FROM users WHERE created_at >= datetime('now', '-30 days')").first<{ count: number }>();

    // 3. Active sessions
    const activeSessions = await db.prepare("SELECT COUNT(*) as count FROM sessions WHERE expires_at > datetime('now')").first<{ count: number }>();

    // 4. Total and active API keys
    const totalApiKeys = await db.prepare('SELECT COUNT(*) as count FROM api_keys').first<{ count: number }>();
    const activeApiKeys = await db.prepare('SELECT COUNT(*) as count FROM api_keys WHERE active = 1').first<{ count: number }>();

    // 5. Subscription counts
    const subscriptions = await db.prepare('SELECT plan, COUNT(*) as count FROM subscriptions GROUP BY plan').all<{ plan: string; count: number }>();

    // 6. Total usage requests & last 24 hours
    const totalUsage = await db.prepare('SELECT COUNT(*) as count FROM usage_logs').first<{ count: number }>();
    const usage24h = await db.prepare("SELECT COUNT(*) as count FROM usage_logs WHERE timestamp >= datetime('now', '-24 hours')").first<{ count: number }>();

    // 7. Recent signups (last 10)
    const recentSignups = await db.prepare('SELECT name, email, created_at FROM users ORDER BY created_at DESC LIMIT 10').all<{ name: string; email: string; created_at: string }>();

    // 8. Top endpoints
    const topEndpoints = await db.prepare('SELECT endpoint, COUNT(*) as count FROM usage_logs GROUP BY endpoint ORDER BY count DESC LIMIT 5').all<{ endpoint: string; count: number }>();

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
      recentSignups: recentSignups.results || [],
      topEndpoints: topEndpoints.results || []
    });
  } catch (err: any) {
    return error(`Failed to fetch admin stats: ${err.message || err}`, 500);
  }
};
