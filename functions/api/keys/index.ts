import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../_helpers';
import { json, error, corsPreflight, getSessionUser, generateApiKey, uuid, now } from '../_helpers';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  if (ctx.request.method === 'OPTIONS') return corsPreflight();

  const auth = ctx.request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return error('Not authenticated', 401);

  const user = await getSessionUser(ctx.env.DB, token);
  if (!user) return error('Session expired or invalid', 401);

  if (ctx.request.method === 'GET') {
    const keys = await ctx.env.DB.prepare(
      'SELECT id, key_identifier, name, active, last_used_at, created_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(user.id).all();
    return json({ keys: keys.results });
  }

  if (ctx.request.method === 'POST') {
    const { name } = await ctx.request.json() as { name?: string };
    const { raw, identifier, hash } = await generateApiKey();

    await ctx.env.DB.prepare(
      'INSERT INTO api_keys (id, user_id, key_identifier, key_hash, name, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(uuid(), user.id, identifier, hash, name || 'Default', now()).run();

    return json({ key: { raw, identifier, name: name || 'Default' } }, 201);
  }

  return error('Method not allowed', 405);
};
