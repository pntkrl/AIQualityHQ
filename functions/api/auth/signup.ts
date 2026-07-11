import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../_helpers';
import { json, error, corsPreflight, uuid, now, hashPassword, createSession } from '../_helpers';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  if (ctx.request.method === 'OPTIONS') return corsPreflight();
  if (ctx.request.method !== 'POST') return error('Method not allowed', 405);

  try {
    const { email, password, name } = await ctx.request.json() as { email?: string; password?: string; name?: string };
    if (!email || !password) return error('Email and password are required');
    if (password.length < 8) return error('Password must be at least 8 characters');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error('Invalid email address');

    const existing = await ctx.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) return error('An account with this email already exists', 409);

    const { hash, salt } = await hashPassword(password);
    const userId = uuid();

    await ctx.env.DB.prepare(
      'INSERT INTO users (id, email, password_hash, password_salt, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(userId, email, hash, salt, name || '', now(), now()).run();

    const session = await createSession(ctx.env.DB, userId);

    return json({ user: { id: userId, email, name: name || '' }, session }, 201);
  } catch (e) {
    return error('Registration failed. Please try again.', 500);
  }
};
