import type { Env } from './_helpers';
import { json, error, corsPreflight, hashApiKey, checkRateLimit, logUsage, now } from './_helpers';
import { analyzePrompt } from '../engine';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  if (ctx.request.method === 'OPTIONS') return corsPreflight();
  if (ctx.request.method !== 'POST') return error('Method not allowed', 405);

  const apiKey = ctx.request.headers.get('X-API-Key');
  if (!apiKey) return error('X-API-Key header is required', 401);

  const keyHash = await hashApiKey(apiKey);
  const key = await ctx.env.DB.prepare(
    `SELECT k.id, k.user_id, s.plan FROM api_keys k
     JOIN users u ON u.id = k.user_id
     JOIN subscriptions s ON s.user_id = k.user_id
     WHERE k.key_hash = ? AND k.active = 1`
  ).bind(keyHash).first<{ id: string; user_id: string; plan: string }>();

  if (!key) return error('Invalid or inactive API key', 401);

  const { allowed, remaining } = await checkRateLimit(
    ctx.env.DB, key.id, key.plan
  );
  if (!allowed) return error('Rate limit exceeded. Upgrade your plan for higher limits.', 429);

  let body: { prompt?: string };
  try {
    body = await ctx.request.json();
  } catch {
    return error('Invalid JSON', 400);
  }

  if (!body.prompt || typeof body.prompt !== 'string') {
    return error('Missing "prompt" field', 400);
  }

  const cfIp = ctx.request.headers.get('CF-Connecting-IP') || 'unknown';
  await logUsage(ctx.env.DB, key.id, '/api/check', cfIp);

  const result = analyzePrompt(body.prompt);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'X-RateLimit-Remaining': String(remaining),
      'Cache-Control': 'public, max-age=60',
    },
  });
};
