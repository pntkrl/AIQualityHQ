import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../_helpers';
import { json, error, corsPreflight, createSession, now } from '../_helpers';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  if (ctx.request.method === 'OPTIONS') return corsPreflight();
  if (ctx.request.method !== 'POST') return error('Method not allowed', 405);

  try {
    const { email, code } = await ctx.request.json() as { email?: string; code?: string };
    if (!email || !code) return error('Email and 6-digit verification code are required');

    const db = ctx.env.DB;
    const user = await db.prepare(
      'SELECT id, name, email, verification_code, code_expires_at, email_verified FROM users WHERE email = ?'
    ).bind(email).first<{
      id: string;
      name: string;
      email: string;
      verification_code?: string;
      code_expires_at?: string;
      email_verified?: number;
    }>();

    if (!user) return error('Account not found. Please sign up first.', 404);
    if (user.email_verified === 1) return error('Email is already verified. Please log in.', 400);

    // Verify 6-digit code matches
    if (!user.verification_code || user.verification_code.trim() !== code.trim()) {
      return error('Invalid 6-digit verification code. Please check your email and try again.', 400);
    }

    // Check code expiration
    if (user.code_expires_at && new Date(user.code_expires_at) < new Date()) {
      return error('Verification code has expired. Please sign up again to receive a new code.', 400);
    }

    // Mark email as verified and clear OTP code
    await db.prepare(
      'UPDATE users SET email_verified = 1, verification_code = NULL, code_expires_at = NULL, updated_at = ? WHERE id = ?'
    ).bind(now(), user.id).run();

    // Create session token
    const session = await createSession(db, user.id);

    return json({
      message: 'Email successfully verified!',
      user: { id: user.id, email: user.email, name: user.name },
      session
    }, 200);

  } catch (e: any) {
    return error(`Email verification failed: ${e.message || e}`, 500);
  }
};
