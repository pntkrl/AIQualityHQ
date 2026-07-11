import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../_helpers';
import { json, error, corsPreflight, verifyPassword, createSession } from '../_helpers';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  if (ctx.request.method === 'OPTIONS') return corsPreflight();
  if (ctx.request.method !== 'POST') return error('Method not allowed', 405);

  try {
    const { email, password } = await ctx.request.json() as { email?: string; password?: string };
    if (!email || !password) return error('Email and password are required');

    const user = await ctx.env.DB.prepare(
      'SELECT id, email, name, password_hash, password_salt FROM users WHERE email = ?'
    ).bind(email).first<{ id: string; email: string; name: string; password_hash: string; password_salt: string }>();

    if (!user) return error('Invalid email or password', 401);

    const valid = await verifyPassword(password, user.password_hash, user.password_salt);
    if (!valid) return error('Invalid email or password', 401);

    const session = await createSession(ctx.env.DB, user.id);

    return json({
      user: { id: user.id, email: user.email, name: user.name },
      session,
    });
  } catch (e) {
    return error('Login failed. Please try again.', 500);
  }
};
