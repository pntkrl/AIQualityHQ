import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../_helpers';
import { json, error, corsPreflight, getSessionUser, hashPassword, verifyPassword, checkBodySize, createRequestContext, log, validateCsrf } from '../_helpers';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const reqCtx = createRequestContext(ctx.request, '/api/auth/change-password');

  if (ctx.request.method === 'OPTIONS') return corsPreflight(ctx.request);
  if (ctx.request.method !== 'POST') return error('Method not allowed', 405, ctx.request, 'E_METHOD_NOT_ALLOWED');

  const bodySizeError = checkBodySize(ctx.request);
  if (bodySizeError) return bodySizeError;

  try {
    const auth = ctx.request.headers.get('Authorization') || '';
    const token = auth.replace('Bearer ', '');
    if (!token) return error('Not authenticated', 401, ctx.request, 'E_MISSING_TOKEN');

    const user = await getSessionUser(ctx.env.DB, token);
    if (!user) return error('Session expired or invalid', 401, ctx.request, 'E_INVALID_SESSION');

    // CSRF validation
    const csrfToken = ctx.request.headers.get('X-CSRF-Token') || '';
    if (!csrfToken) return error('X-CSRF-Token header required', 403, ctx.request, 'E_MISSING_CSRF');
    const validCsrf = await validateCsrf(ctx.env.DB, token, csrfToken);
    if (!validCsrf) return error('Invalid CSRF token', 403, ctx.request, 'E_INVALID_CSRF');

    const { currentPassword, newPassword } = await ctx.request.json() as { currentPassword?: string; newPassword?: string };

    if (!currentPassword || !newPassword) {
      return error('Current and new passwords are required', 400, ctx.request, 'E_MISSING_FIELDS');
    }

    if (newPassword.length < 8) return error('New password must be at least 8 characters', 400, ctx.request, 'E_PASSWORD_TOO_SHORT');
    if (!/[A-Z]/.test(newPassword)) return error('New password must contain at least one uppercase letter', 400, ctx.request, 'E_PASSWORD_NO_UPPERCASE');
    if (!/[a-z]/.test(newPassword)) return error('New password must contain at least one lowercase letter', 400, ctx.request, 'E_PASSWORD_NO_LOWERCASE');
    if (!/[0-9]/.test(newPassword)) return error('New password must contain at least one number', 400, ctx.request, 'E_PASSWORD_NO_NUMBER');

    const db = ctx.env.DB;

    // Get current password hash
    const userData = await db.prepare(
      'SELECT password_hash, password_salt FROM users WHERE id = ?'
    ).bind(user.id).first<{ password_hash: string; password_salt: string }>();

    if (!userData) return error('User not found', 404, ctx.request, 'E_USER_NOT_FOUND');

    // Verify current password
    const valid = await verifyPassword(currentPassword, userData.password_hash, userData.password_salt);
    if (!valid) {
      log(reqCtx, 'warn', 'Invalid current password', { userId: user.id });
      return error('Current password is incorrect', 401, ctx.request, 'E_INVALID_PASSWORD');
    }

    // Hash new password
    const { hash, salt } = await hashPassword(newPassword);

    // Update password
    await db.prepare(
      'UPDATE users SET password_hash = ?, password_salt = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(hash, salt, user.id).run();

    // Revoke ALL other sessions (security best practice on password change)
    await db.prepare(
      'DELETE FROM sessions WHERE user_id = ? AND token != ?'
    ).bind(user.id, token).run();

    log(reqCtx, 'info', 'Password changed, other sessions revoked', { userId: user.id });

    return json({
      message: 'Password changed successfully. Other sessions have been revoked.',
    }, 200, ctx.request, { 'Cache-Control': 'no-store', 'X-Request-ID': reqCtx.requestId });

  } catch (e: any) {
    log(reqCtx, 'error', 'Password change failed', { error: e.message });
    return error('Password change failed', 500, ctx.request, 'E_PASSWORD_CHANGE_FAILED');
  }
};
