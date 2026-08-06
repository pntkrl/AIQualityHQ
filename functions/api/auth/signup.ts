import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../_helpers';
import { json, error, corsPreflight, uuid, now, hashPassword, hashOtp, checkAuthRateLimit, checkBodySize, checkParsedBodySize, createRequestContext, log } from '../_helpers';
import { isDisposableEmail } from './disposable-domains';

const EMAIL_TIMEOUT_MS = 10_000;

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const reqCtx = createRequestContext(ctx.request, '/api/auth/signup');

  if (ctx.request.method === 'OPTIONS') return corsPreflight(ctx.request);
  if (ctx.request.method !== 'POST') return error('Method not allowed', 405, ctx.request, 'E_METHOD_NOT_ALLOWED');

  const bodySizeError = checkBodySize(ctx.request);
  if (bodySizeError) return bodySizeError;

  try {
    const ip = ctx.request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimit = await checkAuthRateLimit(ctx.env.DB, ip, 'signup');
    if (!rateLimit.allowed) {
      log(reqCtx, 'warn', 'Rate limited', { ip });
      return error('Too many signup attempts. Please try again later.', 429, ctx.request, 'E_RATE_LIMITED');
    }

    const { email, password, name } = await ctx.request.json() as { email?: string; password?: string; name?: string };
    const bodyErr = checkParsedBodySize({ email, password, name });
    if (bodyErr) return bodyErr;
    if (!email || !password) return error('Email and password are required', 400, ctx.request, 'E_MISSING_FIELDS');
    // Sanitize name: strip HTML tags and limit length
    const sanitizedName = (name || '').replace(/<[^>]*>/g, '').slice(0, 100);
    if (password.length < 8) return error('Password must be at least 8 characters', 400, ctx.request, 'E_PASSWORD_TOO_SHORT');
    if (!/[A-Z]/.test(password)) return error('Password must contain at least one uppercase letter', 400, ctx.request, 'E_PASSWORD_NO_UPPERCASE');
    if (!/[a-z]/.test(password)) return error('Password must contain at least one lowercase letter', 400, ctx.request, 'E_PASSWORD_NO_LOWERCASE');
    if (!/[0-9]/.test(password)) return error('Password must contain at least one number', 400, ctx.request, 'E_PASSWORD_NO_NUMBER');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error('Invalid email address', 400, ctx.request, 'E_INVALID_EMAIL');

    if (isDisposableEmail(email)) {
      log(reqCtx, 'warn', 'Disposable email blocked', { email });
      return error('Disposable or temporary email addresses are not permitted.', 400, ctx.request, 'E_DISPOSABLE_EMAIL');
    }

    const db = ctx.env.DB;
    const existing = await db.prepare('SELECT id, email_verified FROM users WHERE email = ?').bind(email).first<{ id: string; email_verified?: number }>();

    if (existing && existing.email_verified === 1) {
      log(reqCtx, 'info', 'Duplicate signup attempt', { email });
      return error('An account with this email already exists. Please log in.', 409, ctx.request, 'E_USER_EXISTS');
    }

    // Generate cryptographically secure 6-digit OTP
    const otpBytes = crypto.getRandomValues(new Uint8Array(6));
    const otpCode = Array.from(otpBytes).map(b => (b % 10).toString()).join('');
    const otpHash = await hashOtp(otpCode);
    const codeExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const { hash, salt } = await hashPassword(password);
    const userId = existing ? existing.id : uuid();

    if (existing) {
      await db.prepare(
        'UPDATE users SET password_hash = ?, password_salt = ?, name = ?, verification_code = NULL, verification_code_hash = ?, code_expires_at = ?, updated_at = ? WHERE id = ?'
      ).bind(hash, salt, sanitizedName || '', otpHash, codeExpiresAt, now(), userId).run();
    } else {
      await db.prepare(
        'INSERT INTO users (id, email, password_hash, password_salt, name, email_verified, verification_code, verification_code_hash, code_expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, NULL, ?, ?, ?, ?)'
      ).bind(userId, email, hash, salt, sanitizedName || '', otpHash, codeExpiresAt, now(), now()).run();
    }

    const resendApiKey = (ctx.env as any).RESEND_API_KEY;
    let emailSent = false;
    let emailError: string | null = null;

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
            subject: `${otpCode} is your AIQualityHQ verification code`,
            html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;background:#fff"><h2 style="color:#0f172a;margin-bottom:8px">Verify Your AIQualityHQ Account</h2><p style="color:#475569;font-size:14px;line-height:1.5">Enter the 6-digit code below:</p><div style="text-align:center;margin:24px 0"><span style="font-family:monospace;font-size:32px;font-weight:bold;letter-spacing:6px;color:#0891b2;background:#f0fdf4;padding:12px 24px;border-radius:8px;display:inline-block;border:1px solid #bbf7d0">${otpCode}</span></div><p style="color:#94a3b8;font-size:12px;text-align:center">Expires in 15 minutes.</p></div>`
          }),
          signal: controller.signal
        });

        clearTimeout(timer);

        if (!emailResponse.ok) {
          const errText = await emailResponse.text();
          emailError = `Resend API error: ${emailResponse.status}`;
          log(reqCtx, 'error', 'Email send failed', { status: emailResponse.status, error: errText.slice(0, 200) });
        } else {
          emailSent = true;
          log(reqCtx, 'info', 'Verification email sent', { email });
        }
      } catch (e: any) {
        emailError = e.name === 'AbortError' ? 'Email send timed out' : `Email send failed: ${e.message}`;
        log(reqCtx, 'error', 'Email send exception', { error: emailError });
      }
    } else {
      emailError = 'RESEND_API_KEY not configured';
      log(reqCtx, 'warn', 'Email not sent - no API key', { email });
    }

    log(reqCtx, 'info', 'Signup completed', { email, emailSent });

    return json({
      status: 'verification_required',
      email,
      message: emailSent
        ? 'A 6-digit verification code has been sent to your email address.'
        : 'Account created. If email is configured, a verification code will be sent.',
      ...(emailError && !emailSent && { emailWarning: emailError }),
    }, 200, ctx.request, { 'Cache-Control': 'no-store', 'X-Request-ID': reqCtx.requestId });

  } catch (e: any) {
    log(reqCtx, 'error', 'Signup failed', { error: e.message });
    return error('Registration failed', 500, ctx.request, 'E_SIGNUP_FAILED');
  }
};
