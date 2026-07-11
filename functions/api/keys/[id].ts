import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../_helpers';
import { json, error, corsPreflight, getSessionUser } from '../_helpers';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  if (ctx.request.method === 'OPTIONS') return corsPreflight();
  if (ctx.request.method !== 'DELETE') return error('Method not allowed', 405);

  const auth = ctx.request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return error('Not authenticated', 401);

  const user = await getSessionUser(ctx.env.DB, token);
  if (!user) return error('Session expired or invalid', 401);

  const keyId = ctx.params.id;
  if (!keyId) return error('Key ID is required');

  const key = await ctx.env.DB.prepare(
    'SELECT id FROM api_keys WHERE id = ? AND user_id = ?'
  ).bind(keyId, user.id).first();
  if (!key) return error('Key not found', 404);

  await ctx.env.DB.prepare('DELETE FROM api_keys WHERE id = ?').bind(keyId).run();

  return json({ success: true });
};
