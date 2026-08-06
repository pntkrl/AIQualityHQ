import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../_helpers';
import { json, error, corsPreflight, createSession, hashOtp, now, checkAuthRateLimit, checkBodySize, checkParsedBodySize, createRequestContext, log, constantTimeCompare } from '../_helpers';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const reqCtx = createRequestContext(ctx.request, '/api/auth/verify-email');

  if (ctx.request.method === 'OPTIONS') return corsPreflight(ctx.request);
  if (ctx.request.method !== 'POST') return error('Method not allowed', 405, ctx.request, 'E_METHOD_NOT_ALLOWED');

  const bodySizeError = checkBodySize(ctx.request);
  if (bodySizeError) return bodySizeError;

  try {
    const ip = ctx.request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimit = await checkAuthRateLimit(ctx.env.DB, ip, 'verify_email');
    if (!rateLimit.allowed) {
      log(reqCtx, 'warn', 'Rate limited', { ip });
      return error('Too many verification attempts. Please try again later.', 429, ctx.request, 'E_RATE_LIMITED');
    }

    const { email, code } = await ctx.request.json() as { email?: string; code?: string };
    const bodyErr = checkParsedBodySize({ email, code });
    if (bodyErr) return bodyErr;
    if (!email || !code) return error('Email and 6-digit verification code are required', 400, ctx.request, 'E_MISSING_FIELDS');

    // Enforce max lengths
    if (email.length > 254) return error('Invalid email format', 400, ctx.request, 'E_INVALID_EMAIL');
    if (code.length > 10) return error('Invalid verification code', 400, ctx.request, 'E_INVALID_CODE');

    const db = ctx.env.DB;
    const user = await db.prepare(
      'SELECT id, name, email, verification_code_hash, code_expires_at, email_verified FROM users WHERE email = ?'
    ).bind(email).first<{
      id: string;
      name: string;
      email: string;
      verification_code_hash?: string;
      code_expires_at?: string;
      email_verified?: number;
    }>();

    if (!user) return error('Account not found. Please sign up first.', 404, ctx.request, 'E_USER_NOT_FOUND');
    if (user.email_verified === 1) return error('Email is already verified. Please log in.', 400, ctx.request, 'E_ALREADY_VERIFIED');

    if (!user.verification_code_hash) return error('No verification code found. Please sign up again.', 400, ctx.request, 'E_NO_VERIFICATION_CODE');
    const inputHash = await hashOtp(code.trim());
    if (!constantTimeCompare(inputHash, user.verification_code_hash)) {
      log(reqCtx, 'warn', 'Invalid OTP', { email });
      return error('Invalid 6-digit verification code.', 400, ctx.request, 'E_INVALID_CODE');
    }

    if (user.code_expires_at && new Date(user.code_expires_at) < new Date()) {
      return error('Verification code has expired. Please sign up again.', 400, ctx.request, 'E_CODE_EXPIRED');
    }

    await db.prepare(
      'UPDATE users SET email_verified = 1, verification_code = NULL, verification_code_hash = NULL, code_expires_at = NULL, updated_at = ? WHERE id = ?'
    ).bind(now(), user.id).run();

    const session = await createSession(db, user.id);

    log(reqCtx, 'info', 'Email verified', { email });

    return json({
      message: 'Email successfully verified!',
      user: { id: user.id, email: user.email, name: user.name },
      session
    }, 200, ctx.request, { 'Cache-Control': 'no-store', 'X-Request-ID': reqCtx.requestId });

  } catch (e: any) {
    log(reqCtx, 'error', 'Verification failed', { error: e.message });
    return error('Email verification failed', 500, ctx.request, 'E_VERIFY_FAILED');
  }
};
