import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../_helpers';
import { json, error, corsPreflight, uuid, now, createSession, checkAuthRateLimit, checkBodySize, checkParsedBodySize, createRequestContext, log } from '../_helpers';

interface GooglePayload {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
  iat: number;
  exp: number;
}

// Cache Google's public keys (rotate every 24h)
let googleKeysCache: { keys: CryptoKey[]; fetchedAt: number } | null = null;
const KEYS_CACHE_TTL = 24 * 60 * 60 * 1000;

async function getGooglePublicKeys(): Promise<CryptoKey[]> {
  if (googleKeysCache && Date.now() - googleKeysCache.fetchedAt < KEYS_CACHE_TTL) {
    return googleKeysCache.keys;
  }

  const resp = await fetch('https://www.googleapis.com/oauth2/v3/certs', {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  });
  if (!resp.ok) throw new Error('Failed to fetch Google keys');

  const { keys } = await resp.json() as { keys: { kid: string; n: string; e: string; kty: string; alg: string; use: string }[] };
  const cryptoKeys = await Promise.all(
    keys.map(k =>
      crypto.subtle.importKey(
        'jwk',
        { kty: k.kty, n: k.n, e: k.e, alg: 'RS256', use: 'sig' },
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify']
      )
    )
  );

  googleKeysCache = { keys: cryptoKeys, fetchedAt: Date.now() };
  return cryptoKeys;
}

async function verifyGoogleJwt(token: string, expectedAudience: string): Promise<GooglePayload> {
  const [headerB64, payloadB64, signatureB64] = token.split('.');
  if (!headerB64 || !payloadB64 || !signatureB64) throw new Error('Invalid JWT format');

  const header = JSON.parse(atob(headerB64.replace(/-/g, '+').replace(/_/g, '/')));
  if (header.alg !== 'RS256') throw new Error(`Unexpected algorithm: ${header.alg}`);

  const keys = await getGooglePublicKeys();
  const keyIndex = keys.findIndex(k => k.alg === header.alg);
  if (keyIndex === -1) throw new Error('No matching Google key found');

  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const sig = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', keys[keyIndex], sig, data);
  if (!valid) throw new Error('Invalid JWT signature');

  const payload: GooglePayload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));

  // Verify issuer
  if (payload.iss !== 'accounts.google.com' && payload.iss !== 'https://accounts.google.com') {
    throw new Error(`Invalid issuer: ${payload.iss}`);
  }

  // Verify audience
  if (payload.aud !== expectedAudience) {
    throw new Error('Invalid audience');
  }

  // Verify expiration
  if (payload.exp * 1000 < Date.now()) {
    throw new Error('Token expired');
  }

  // Verify email is verified
  if (!payload.email_verified) {
    throw new Error('Email not verified by Google');
  }

  return payload;
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const reqCtx = createRequestContext(ctx.request, '/api/auth/google');

  if (ctx.request.method === 'OPTIONS') return corsPreflight(ctx.request);
  if (ctx.request.method !== 'POST') return error('Method not allowed', 405, ctx.request, 'E_METHOD_NOT_ALLOWED');

  const bodySizeError = checkBodySize(ctx.request);
  if (bodySizeError) return bodySizeError;

  try {
    const ip = ctx.request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimit = await checkAuthRateLimit(ctx.env.DB, ip, 'google_auth');
    if (!rateLimit.allowed) {
      log(reqCtx, 'warn', 'Rate limited', { ip });
      return error('Too many requests. Please try again later.', 429, ctx.request, 'E_RATE_LIMITED');
    }

    const { credential } = await ctx.request.json() as { credential?: string };
    const bodyErr = checkParsedBodySize({ credential });
    if (bodyErr) return bodyErr;

    if (!credential) return error('Google credential is required', 400, ctx.request, 'E_MISSING_CREDENTIAL');

    const googleClientId = ctx.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      log(reqCtx, 'error', 'Google Client ID not configured');
      return error('Google Sign-In is not configured', 500, ctx.request, 'E_GOOGLE_NOT_CONFIGURED');
    }

    // Verify Google JWT server-side
    let payload: GooglePayload;
    try {
      payload = await verifyGoogleJwt(credential, googleClientId);
    } catch (e: any) {
      log(reqCtx, 'warn', 'Google JWT verification failed', { error: e.message });
      return error('Invalid Google credential', 401, ctx.request, 'E_INVALID_GOOGLE_CREDENTIAL');
    }

    const db = ctx.env.DB;
    const sanitizedName = (payload.name || '').replace(/<[^>]*>/g, '').slice(0, 100);

    // Check if user exists
    const existing = await db.prepare(
      'SELECT id, email, name, email_verified FROM users WHERE email = ?'
    ).bind(payload.email).first<{ id: string; email: string; name: string; email_verified?: number }>();

    let userId: string;

    if (existing) {
      // User exists — update name/picture if changed, ensure verified
      userId = existing.id;
      await db.prepare(
        'UPDATE users SET name = ?, email_verified = 1, updated_at = datetime(\'now\') WHERE id = ?'
      ).bind(sanitizedName || existing.name, userId).run();
    } else {
      // New user — create with a dummy password hash (Google-only users don't need one)
      userId = uuid();
      const dummyHash = 'google-oauth';
      const dummySalt = 'google-oauth';
      await db.prepare(
        'INSERT INTO users (id, email, password_hash, password_salt, name, email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)'
      ).bind(userId, payload.email, dummyHash, dummySalt, sanitizedName, now(), now()).run();

      // Create free subscription
      await db.prepare(
        'INSERT INTO subscriptions (id, user_id, plan, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(uuid(), userId, 'free', 'active', now(), now()).run();

      log(reqCtx, 'info', 'New Google user created', { email: payload.email });
    }

    // Create session
    const session = await createSession(db, userId);

    log(reqCtx, 'info', 'Google auth successful', { email: payload.email });

    return json({
      user: { id: userId, email: payload.email, name: sanitizedName || existing?.name || '', picture: payload.picture },
      session,
    }, 200, ctx.request, { 'Cache-Control': 'no-store', 'X-Request-ID': reqCtx.requestId });

  } catch (e: any) {
    log(reqCtx, 'error', 'Google auth failed', { error: e.message });
    return error('Google authentication failed', 500, ctx.request, 'E_GOOGLE_AUTH_FAILED');
  }
};
