import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../_helpers';
import { json, error, corsPreflight, hashPassword, hashOtp, checkBodySize, checkParsedBodySize, createRequestContext, log, constantTimeCompare, checkAuthRateLimit } from '../_helpers';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const reqCtx = createRequestContext(ctx.request, '/api/auth/reset-password');

  if (ctx.request.method === 'OPTIONS') return corsPreflight(ctx.request);
  if (ctx.request.method !== 'POST') return error('Method not allowed', 405, ctx.request, 'E_METHOD_NOT_ALLOWED');

  // Rate limit reset attempts (prevent brute-forcing 6-digit code)
  const ip = ctx.request.headers.get('CF-Connecting-IP') || 'unknown';
  const rateLimit = await checkAuthRateLimit(ctx.env.DB, ip, 'reset_password');
  if (!rateLimit.allowed) {
    log(reqCtx, 'warn', 'Rate limited', { ip });
    return error('Too many reset attempts. Please try again later.', 429, ctx.request, 'E_RATE_LIMITED');
  }

  const bodySizeError = checkBodySize(ctx.request);
  if (bodySizeError) return bodySizeError;

  try {
    const { email, code, newPassword } = await ctx.request.json() as {
      email?: string; code?: string; newPassword?: string;
    };
    const bodyErr = checkParsedBodySize({ email, code, newPassword });
    if (bodyErr) return bodyErr;

    if (!email || !code || !newPassword) {
      return error('Email, code, and new password are required', 400, ctx.request, 'E_MISSING_FIELDS');
    }

    // Enforce max lengths
    if (email.length > 254) return error('Invalid email format', 400, ctx.request, 'E_INVALID_EMAIL');
    if (newPassword.length > 128) return error('Password must be at most 128 characters', 400, ctx.request, 'E_PASSWORD_TOO_LONG');
    if (code.length > 10) return error('Invalid verification code', 400, ctx.request, 'E_INVALID_CODE');

    if (newPassword.length < 8) return error('Password must be at least 8 characters', 400, ctx.request, 'E_PASSWORD_TOO_SHORT');
    if (!/[A-Z]/.test(newPassword)) return error('Password must contain at least one uppercase letter', 400, ctx.request, 'E_PASSWORD_NO_UPPERCASE');
    if (!/[a-z]/.test(newPassword)) return error('Password must contain at least one lowercase letter', 400, ctx.request, 'E_PASSWORD_NO_LOWERCASE');
    if (!/[0-9]/.test(newPassword)) return error('Password must contain at least one number', 400, ctx.request, 'E_PASSWORD_NO_NUMBER');

    const db = ctx.env.DB;
    const user = await db.prepare(
      'SELECT id, reset_code_hash, reset_code_expires_at FROM users WHERE email = ?'
    ).bind(email).first<{
      id: string;
      reset_code_hash?: string;
      reset_code_expires_at?: string;
    }>();

    if (!user) return error('Account not found', 404, ctx.request, 'E_USER_NOT_FOUND');

    if (!user.reset_code_hash) {
      return error('No reset code found. Please request a new one.', 400, ctx.request, 'E_NO_RESET_CODE');
    }

    // Verify code
    const inputHash = await hashOtp(code.trim());
    if (!constantTimeCompare(inputHash, user.reset_code_hash)) {
      log(reqCtx, 'warn', 'Invalid reset code', { email });
      return error('Invalid reset code', 400, ctx.request, 'E_INVALID_CODE');
    }

    // Check expiration
    if (user.reset_code_expires_at && new Date(user.reset_code_expires_at) < new Date()) {
      return error('Reset code has expired. Please request a new one.', 400, ctx.request, 'E_CODE_EXPIRED');
    }

    // Hash new password
    const { hash, salt } = await hashPassword(newPassword);

    // Update password and clear reset code (dedicated reset columns)
    await db.prepare(
      'UPDATE users SET password_hash = ?, password_salt = ?, reset_code_hash = NULL, reset_code_expires_at = NULL, failed_login_attempts = 0, locked_until = NULL, updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(hash, salt, user.id).run();

    // Revoke all sessions (security best practice on password reset)
    await db.prepare(
      'DELETE FROM sessions WHERE user_id = ?'
    ).bind(user.id).run();

    log(reqCtx, 'info', 'Password reset completed', { email });

    return json({
      message: 'Password reset successfully. Please log in with your new password.',
    }, 200, ctx.request, { 'Cache-Control': 'no-store', 'X-Request-ID': reqCtx.requestId });

  } catch (e: any) {
    log(reqCtx, 'error', 'Password reset failed', { error: e.message });
    return error('Password reset failed', 500, ctx.request, 'E_RESET_FAILED');
  }
};
