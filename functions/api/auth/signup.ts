import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../_helpers';
import { json, error, corsPreflight, uuid, now, hashPassword } from '../_helpers';
import { isDisposableEmail } from './disposable-domains';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  if (ctx.request.method === 'OPTIONS') return corsPreflight();
  if (ctx.request.method !== 'POST') return error('Method not allowed', 405);

  try {
    const { email, password, name } = await ctx.request.json() as { email?: string; password?: string; name?: string };
    if (!email || !password) return error('Email and password are required');
    if (password.length < 8) return error('Password must be at least 8 characters');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error('Invalid email address');

    // 1. Check Disposable / Temporary Email Domain Blocklist
    if (isDisposableEmail(email)) {
      return error('Disposable or temporary email addresses are not permitted. Please use a valid personal or work email.', 400);
    }

    // 2. Check if user exists
    const db = ctx.env.DB;
    const existing = await db.prepare('SELECT id, email_verified FROM users WHERE email = ?').bind(email).first<{ id: string; email_verified?: number }>();
    
    if (existing && existing.email_verified === 1) {
      return error('An account with this email address already exists. Please log in.', 409);
    }

    // 3. Generate 6-digit OTP verification code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins
    const { hash, salt } = await hashPassword(password);
    const userId = existing ? existing.id : uuid();

    if (existing) {
      // Update existing unverified user
      await db.prepare(
        'UPDATE users SET password_hash = ?, password_salt = ?, name = ?, verification_code = ?, code_expires_at = ?, updated_at = ? WHERE id = ?'
      ).bind(hash, salt, name || '', otpCode, codeExpiresAt, now(), userId).run();
    } else {
      // Insert new unverified user
      await db.prepare(
        'INSERT INTO users (id, email, password_hash, password_salt, name, email_verified, verification_code, code_expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)'
      ).bind(userId, email, hash, salt, name || '', otpCode, codeExpiresAt, now(), now()).run();
    }

    // 4. Send Email via Resend API
    const resendApiKey = (ctx.env as any).RESEND_API_KEY;
    if (resendApiKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'AIQualityHQ <verify@aiqualityhq.com>',
          to: [email],
          subject: `${otpCode} is your AIQualityHQ verification code`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded-lg; background: #ffffff;">
              <h2 style="color: #0f172a; margin-bottom: 8px;">Verify Your AIQualityHQ Account</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.5;">Thank you for registering. Enter the 6-digit verification code below to activate your account and unlock AI tools:</p>
              <div style="text-align: center; margin: 24px 0;">
                <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0891b2; background: #f0fdf4; padding: 12px 24px; border-radius: 8px; display: inline-block; border: 1px solid #bbf7d0;">
                  ${otpCode}
                </span>
              </div>
              <p style="color: #94a3b8; font-size: 12px; text-align: center;">This code will expire in 15 minutes. If you did not request this code, please ignore this email.</p>
            </div>
          `
        })
      }).catch(() => {});
    }

    return json({
      status: 'verification_required',
      email,
      message: 'A 6-digit verification code has been sent to your email address.',
      // Provide fallback OTP in dev mode or if resend key not configured
      dev_otp: !resendApiKey ? otpCode : undefined
    }, 200);

  } catch (e: any) {
    return error(`Registration failed: ${e.message || e}`, 500);
  }
};
