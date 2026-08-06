import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../_helpers';
import { json, error, corsPreflight, verifyPassword, createSession, checkAuthRateLimit, checkBodySize, checkParsedBodySize, createRequestContext, log } from '../_helpers';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

// Precomputed PBKDF2 hash+salt for a dummy password, used to equalize response
// timing for unknown accounts (prevents user-enumeration timing oracle).
const DUMMY_PASSWORD_HASH = 'XrRZTHfN7aQxLMng2mELEJZ/F/5JvSLp98aE//S8T1c=';
const DUMMY_PASSWORD_SALT = 'dummy-timing-equalizer';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const reqCtx = createRequestContext(ctx.request, '/api/auth/login');

  if (ctx.request.method === 'OPTIONS') return corsPreflight(ctx.request);
  if (ctx.request.method !== 'POST') return error('Method not allowed', 405, ctx.request, 'E_METHOD_NOT_ALLOWED');

  const bodySizeError = checkBodySize(ctx.request);
  if (bodySizeError) return bodySizeError;

  try {
    const ip = ctx.request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimit = await checkAuthRateLimit(ctx.env.DB, ip, 'login');
    if (!rateLimit.allowed) {
      log(reqCtx, 'warn', 'Rate limited', { ip });
      return error('Too many login attempts. Please try again later.', 429, ctx.request, 'E_RATE_LIMITED');
    }

    const { email, password } = await ctx.request.json() as { email?: string; password?: string };
    const bodyErr = checkParsedBodySize({ email, password });
    if (bodyErr) return bodyErr;
    if (!email || !password) return error('Email and password are required', 400, ctx.request, 'E_MISSING_FIELDS');

    // Enforce max lengths
    if (email.length > 254) return error('Invalid email format', 400, ctx.request, 'E_INVALID_EMAIL');
    if (password.length > 128) return error('Invalid password format', 400, ctx.request, 'E_INVALID_PASSWORD');

    const db = ctx.env.DB;
    const user = await db.prepare(
      'SELECT id, email, name, password_hash, password_salt, email_verified, failed_login_attempts, locked_until FROM users WHERE email = ?'
    ).bind(email).first<{
      id: string; email: string; name: string;
      password_hash: string; password_salt: string;
      email_verified?: number; failed_login_attempts?: number; locked_until?: string;
    }>();

    if (!user) {
      // Return same generic message — don't reveal whether account exists.
      // Compute a dummy PBKDF2 hash so response time matches a real account,
      // preventing user-enumeration via timing side-channel.
      await verifyPassword(password, DUMMY_PASSWORD_HASH, DUMMY_PASSWORD_SALT).catch(() => {});
      log(reqCtx, 'warn', 'Invalid credentials - user not found', { email });
      return error('Invalid email or password', 401, ctx.request, 'E_INVALID_CREDENTIALS');
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
      log(reqCtx, 'warn', 'Locked account login attempt', { email, remainingMinutes });
      return error(`Account is locked. Try again in ${remainingMinutes} minutes.`, 423, ctx.request, 'E_ACCOUNT_LOCKED');
    }

    // If lockout expired, reset the counter
    if (user.locked_until && new Date(user.locked_until) <= new Date()) {
      await db.prepare(
        'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?'
      ).bind(user.id).run();
      user.failed_login_attempts = 0;
    }

    const valid = await verifyPassword(password, user.password_hash, user.password_salt);
    if (!valid) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      const lockUntil = attempts >= MAX_FAILED_ATTEMPTS
        ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60000).toISOString()
        : null;

      await db.prepare(
        'UPDATE users SET failed_login_attempts = ?, last_failed_login = datetime(\'now\'), locked_until = ? WHERE id = ?'
      ).bind(attempts, lockUntil, user.id).run();

      log(reqCtx, 'warn', 'Invalid password', { email, attempts, locked: !!lockUntil });

      if (lockUntil) {
        return error(`Account is locked. Try again in ${LOCKOUT_DURATION_MINUTES} minutes.`, 423, ctx.request, 'E_ACCOUNT_LOCKED');
      }
      return error('Invalid email or password', 401, ctx.request, 'E_INVALID_CREDENTIALS');
    }

    // Successful login — reset failed attempts
    await db.prepare(
      'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?'
    ).bind(user.id).run();

    if (user.email_verified === 0) {
      log(reqCtx, 'info', 'Unverified email login attempt', { email });
      return json({
        error: 'Please verify your email address first before logging in.',
        code: 'E_EMAIL_NOT_VERIFIED',
        status: 'verification_required',
        email: user.email
      }, 403, ctx.request, { 'Cache-Control': 'no-store', 'X-Request-ID': reqCtx.requestId });
    }

    const session = await createSession(db, user.id);

    log(reqCtx, 'info', 'Login successful', { email });

    return json({
      user: { id: user.id, email: user.email, name: user.name },
      session,
    }, 200, ctx.request, { 'Cache-Control': 'no-store', 'X-Request-ID': reqCtx.requestId });
  } catch (e: any) {
    log(reqCtx, 'error', 'Login failed', { error: e.message });
    return error('Login failed', 500, ctx.request, 'E_LOGIN_FAILED');
  }
};
