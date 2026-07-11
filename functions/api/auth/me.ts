import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../_helpers';
import { json, error, corsPreflight, getSessionUser } from '../_helpers';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  if (ctx.request.method === 'OPTIONS') return corsPreflight();
  if (ctx.request.method !== 'GET') return error('Method not allowed', 405);

  const auth = ctx.request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return error('Not authenticated', 401);

  const user = await getSessionUser(ctx.env.DB, token);
  if (!user) return error('Session expired or invalid', 401);

  return json({ user });
};