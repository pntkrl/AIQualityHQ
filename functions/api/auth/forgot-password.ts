import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../_helpers';
import { json, error, corsPreflight, hashOtp, checkAuthRateLimit, checkBodySize, createRequestContext, log } from '../_helpers';

const EMAIL_TIMEOUT_MS = 10_000;

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const reqCtx = createRequestContext(ctx.request, '/api/auth/forgot-password');

  if (ctx.request.method === 'OPTIONS') return corsPreflight(ctx.request);
  if (ctx.request.method !== 'POST') return error('Method not allowed', 405, ctx.request, 'E_METHOD_NOT_ALLOWED');

  const bodySizeError = checkBodySize(ctx.request);
  if (bodySizeError) return bodySizeError;

  try {
    const ip = ctx.request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimit = await checkAuthRateLimit(ctx.env.DB, ip, 'forgot_password');
    if (!rateLimit.allowed) {
      log(reqCtx, 'warn', 'Rate limited', { ip });
      return error('Too many requests. Please try again later.', 429, ctx.request, 'E_RATE_LIMITED');
    }

    const { email } = await ctx.request.json() as { email?: string };
    if (!email) return error('Email is required', 400, ctx.request, 'E_MISSING_EMAIL');
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return error('Invalid email format', 400, ctx.request, 'E_INVALID_EMAIL');
    }

    const db = ctx.env.DB;
    const user = await db.prepare(
      'SELECT id, email FROM users WHERE email = ?'
    ).bind(email).first<{ id: string; email: string }>();

    // Always return success to prevent email enumeration
    if (!user) {
      log(reqCtx, 'info', 'Password reset requested for non-existent email');
      return json({
        message: 'If an account exists with this email, a reset code has been sent.',
      }, 200, ctx.request, { 'Cache-Control': 'no-store', 'X-Request-ID': reqCtx.requestId });
    }

    // Generate cryptographically secure 6-digit reset code
    const otpBytes = crypto.getRandomValues(new Uint8Array(6));
    const resetCode = Array.from(otpBytes).map(b => (b % 10).toString()).join('');
    const resetHash = await hashOtp(resetCode);
    const codeExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Store the reset code hash in dedicated reset columns (not verification_code_hash)
    await db.prepare(
      'UPDATE users SET reset_code_hash = ?, reset_code_expires_at = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(resetHash, codeExpiresAt, user.id).run();

    // Send email
    const resendApiKey = (ctx.env as any).RESEND_API_KEY;
    let emailSent = false;

    if (resendApiKey) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), EMAIL_TIMEOUT_MS);

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'AIQualityHQ <verify@aiqualityhq.com>',
            to: [email],
            subject: `${resetCode} is your AIQualityHQ password reset code`,
            html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;background:#fff"><h2 style="color:#0f172a;margin-bottom:8px">Reset Your Password</h2><p style="color:#475569;font-size:14px;line-height:1.5">Enter the 6-digit code below to reset your password:</p><div style="text-align:center;margin:24px 0"><span style="font-family:monospace;font-size:32px;font-weight:bold;letter-spacing:6px;color:#dc2626;background:#fef2f2;padding:12px 24px;border-radius:8px;display:inline-block;border:1px solid #fecaca">${resetCode}</span></div><p style="color:#94a3b8;font-size:12px;text-align:center">Expires in 15 minutes. If you did not request this, ignore this email.</p></div>`
          }),
          signal: controller.signal
        });

        clearTimeout(timer);
        emailSent = emailResponse.ok;
      } catch {
        // Silently fail — we still return success to prevent enumeration
      }
    }

    log(reqCtx, 'info', 'Password reset requested', { email, emailSent });

    return json({
      message: 'If an account exists with this email, a reset code has been sent.',
    }, 200, ctx.request, { 'Cache-Control': 'no-store', 'X-Request-ID': reqCtx.requestId });

  } catch (e: any) {
    log(reqCtx, 'error', 'Forgot password failed', { error: e.message });
    return error('Request failed', 500, ctx.request, 'E_FORGOT_PASSWORD_FAILED');
  }
};
