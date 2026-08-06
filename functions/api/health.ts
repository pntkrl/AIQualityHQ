import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from './_helpers';
import { json, corsPreflight, createRequestContext } from './_helpers';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const reqCtx = createRequestContext(ctx.request, '/api/health');

  if (ctx.request.method === 'OPTIONS') return corsPreflight(ctx.request);
  if (ctx.request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

  const db = ctx.env.DB;

  // Check database connectivity
  let dbStatus = 'ok';
  try {
    await db.prepare('SELECT 1 as ping').first();
  } catch {
    dbStatus = 'error';
  }

  const status = dbStatus === 'ok' ? 200 : 503;

  return json(
    {
      status: dbStatus === 'ok' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      checks: {
        database: { status: dbStatus },
      },
    },
    status,
    ctx.request,
    { 'Cache-Control': 'no-store', 'X-Request-ID': reqCtx.requestId }
  );
};
