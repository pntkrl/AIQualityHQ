/// <reference path="../../.wrangler/types/worker-configuration.d.ts" />

import type { D1Database } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  AIQUALITY_API_KEY: string;
  ENVIRONMENT: string;
  ADMIN_PASSWORD: string;
  GOOGLE_CLIENT_ID: string;
  BREVO_API_KEY?: string;
  BREVO_LIST_ID?: string;
  BREVO_SENDER_EMAIL?: string;
}

const ALLOWED_ORIGINS = [
  'https://aiqualityhq.com',
  'https://www.aiqualityhq.com',
];

function getAllowedOrigin(request: Request): string {
  const origin = request.headers.get('Origin');
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  return ALLOWED_ORIGINS[0];
}

function corsHeaders(request: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(request),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

export function json(data: unknown, status = 200, request?: Request, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Version': '1',
      ...corsHeaders(request || new Request('')),
      ...extraHeaders,
    },
  });
}

export function error(message: string, status = 400, request?: Request, code?: string): Response {
  return json({ error: message, code: code || `E_${status}` }, status, request, { 'Cache-Control': 'no-store' });
}

export function corsPreflight(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}

// Request body size validation — prevents resource exhaustion attacks
const MAX_AUTH_BODY_SIZE = 10 * 1024; // 10KB for auth endpoints
const MAX_API_BODY_SIZE = 50 * 1024; // 50KB for general API

export function checkBodySize(request: Request, maxBytes = MAX_AUTH_BODY_SIZE): Response | null {
  const contentLength = parseInt(request.headers.get('Content-Length') || '0', 10);
  if (contentLength > maxBytes) {
    return error('Request body too large', 413);
  }
  return null;
}

// Validate parsed body size — catches cases where Content-Length is missing or lying
export function checkParsedBodySize(data: unknown, maxBytes = MAX_AUTH_BODY_SIZE): Response | null {
  const size = new TextEncoder().encode(JSON.stringify(data)).length;
  if (size > maxBytes) {
    return error('Request body too large', 413);
  }
  return null;
}

// Structured logging with request IDs
export interface RequestContext {
  requestId: string;
  ip: string;
  method: string;
  path: string;
  timestamp: string;
}

export function createRequestContext(request: Request, path: string): RequestContext {
  return {
    requestId: request.headers.get('X-Request-ID') || uuid(),
    ip: request.headers.get('CF-Connecting-IP') || 'unknown',
    method: request.method,
    path,
    timestamp: now(),
  };
}

export function log(ctx: RequestContext, level: 'info' | 'warn' | 'error', message: string, extra?: Record<string, unknown>): void {
  const entry = {
    level,
    requestId: ctx.requestId,
    method: ctx.method,
    path: ctx.path,
    ip: ctx.ip,
    timestamp: ctx.timestamp,
    message,
    ...extra,
  };
  // Workers console.log is structured JSON when running in production
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export function uuid(): string {
  return crypto.randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}

export function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// Constant-time string comparison to prevent timing attacks
export function constantTimeCompare(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  if (x.length !== y.length) return false;
  let result = 0;
  for (let i = 0; i < x.length; i++) {
    result |= x[i] ^ y[i];
  }
  return result === 0;
}

// PBKDF2 password hashing using Web Crypto API
export async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const enc = new TextEncoder();
  const pwKey = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const s = salt || btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(s), iterations: 600000, hash: 'SHA-256' },
    pwKey, 256
  );
  const hash = btoa(String.fromCharCode(...new Uint8Array(bits)));
  return { hash, salt: s };
}

export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const { hash: computed } = await hashPassword(password, salt);
  // Constant-time comparison to prevent timing attacks
  const a = new TextEncoder().encode(computed);
  const b = new TextEncoder().encode(hash);
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

// OTP hashing using SHA-256 (fast, appropriate for short-lived codes)
export async function hashOtp(code: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(code), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('otp-verification'));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

// Session token generation and validation — uses cryptographic randomness
export async function createSession(db: D1Database, userId: string): Promise<{ token: string; expiresAt: string; csrfToken: string }> {
  // 48 bytes = 384 bits of entropy — far exceeds OWASP minimum of 128 bits
  const tokenBytes = crypto.getRandomValues(new Uint8Array(48));
  const token = 'sess_' + Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  // CSRF token: separate 32-byte token for cross-site request forgery protection
  const csrfBytes = crypto.getRandomValues(new Uint8Array(32));
  const csrfToken = 'csrf_' + Array.from(csrfBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const expiresAt = daysFromNow(30);
  await db.prepare(
    'INSERT INTO sessions (id, user_id, token, csrf_token, expires_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(uuid(), userId, token, csrfToken, expiresAt).run();
  return { token, expiresAt, csrfToken };
}

export async function getSessionUser(db: D1Database, token: string): Promise<{ id: string; email: string; name: string } | null> {
  const session = await db.prepare(
    `SELECT u.id, u.email, u.name FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > datetime('now')`
  ).bind(token).first<{ id: string; email: string; name: string }>();
  return session || null;
}

// CSRF validation — check X-CSRF-Token header matches session's CSRF token
export async function validateCsrf(db: D1Database, token: string, csrfToken: string): Promise<boolean> {
  const session = await db.prepare(
    'SELECT csrf_token FROM sessions WHERE token = ? AND expires_at > datetime(\'now\')'
  ).bind(token).first<{ csrf_token: string }>();
  return session?.csrf_token !== undefined && constantTimeCompare(session.csrf_token, csrfToken);
}

// API key generation and validation — identifier is opaque, reveals nothing about the key
export async function generateApiKey(): Promise<{ raw: string; identifier: string; hash: string }> {
  const raw = 'aq_live_' + Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  // Opaque identifier: random string, not derived from the key
  const identifier = 'key_' + Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(raw), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('api-key'));
  const hash = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return { raw, identifier, hash };
}

export async function hashApiKey(raw: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(raw), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('api-key'));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

// Rate limiting — uses indexed lookup instead of COUNT(*) full table scan
export async function checkRateLimit(db: D1Database, apiKeyId: string, plan: string): Promise<{ allowed: boolean; remaining: number }> {
  const limits: Record<string, number> = {
    free: 60,
    pro_monthly: 10000,
    pro_yearly: 10000,
    team_monthly: 50000,
    team_yearly: 50000,
  };
  const limit = limits[plan] || limits.free;
  const windowStart = new Date(Date.now() - 3600000).toISOString();

  // Use indexed column with LIMIT instead of COUNT(*) for O(1) lookup
  const result = await db.prepare(
    `SELECT id FROM usage_logs
     WHERE api_key_id = ? AND timestamp > ?
     ORDER BY timestamp DESC
     LIMIT ?`
  ).bind(apiKeyId, windowStart, limit + 1).all<{ id: string }>();

  const used = result.results.length;
  return { allowed: used <= limit, remaining: Math.max(0, limit - used) };
}

// QA / Monitoring / Browser User-Agent Allowlist for read-only checks and automated verification
const QA_MONITORING_UA_REGEX = /(?:Mozilla|Chrome|Safari|AppleWebKit|Gecko|Firefox|Edg|Edge|Opera|OPR|HeadlessChrome|Playwright|Puppeteer|Cypress|Selenium|Google-Lighthouse|Chrome-Lighthouse|Lighthouse|PageSpeed|GTmetrix|WebPageTest|PTST|UptimeRobot|Pingdom|StatusCake|BetterUptime|Datadog|NewRelic|Site24x7|LinkWatcher|VibeCodingList|vibecodinglist|vibecodinglist\.com|VibeCoding|Findly|findly\.tools|trylaunch|trylaunch\.ai|openhunts|openhunts\.com|aat|aat\.ee|startupfast|startupfa\.st|indiehunt|indiehunt\.io|huzzler|huzzler\.so|foundrlist|foundrlist\.com|shipyardhq|shipyardhq\.dev|Googlebot|Bingbot|DuckDuckBot)/i;

export function isQAMonitoringUserAgent(userAgent?: string | null): boolean {
  if (!userAgent) return true;
  return QA_MONITORING_UA_REGEX.test(userAgent);
}

// Auth rate limiting (per IP, 5 attempts per 15 minutes)
export async function checkAuthRateLimit(db: D1Database, ip: string, action: string, userAgent?: string | null): Promise<{ allowed: boolean; remaining: number }> {
  // Bypass rate limits for allowlisted QA, monitoring, and standard browser user-agents on read-only / status / verification actions
  if ((!userAgent || isQAMonitoringUserAgent(userAgent)) && (action === 'health_check' || action === 'status_check' || action === 'admin_stats' || action === 'verify_check')) {
    return { allowed: true, remaining: 999 };
  }

  const maxAttempts = 5;
  const windowMs = 15 * 60 * 1000;
  const windowStart = new Date(Date.now() - windowMs).toISOString();
  
  // Clean up old entries periodically (every ~5th request)
  if (Math.random() < 0.20) {
    await db.prepare("DELETE FROM auth_rate_limits WHERE timestamp < datetime('now', '-1 hour')").run().catch(() => {});
  }
  
  const count = await db.prepare(
    'SELECT COUNT(*) as count FROM auth_rate_limits WHERE ip = ? AND action = ? AND timestamp > ?'
  ).bind(ip, action, windowStart).first<{ count: number }>();
  
  const used = count?.count || 0;
  if (used >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }
  
  // Log this attempt
  await db.prepare(
    'INSERT INTO auth_rate_limits (id, ip, action, timestamp) VALUES (?, ?, ?, ?)'
  ).bind(uuid(), ip, action, now()).run().catch(() => {});
  
  return { allowed: true, remaining: maxAttempts - used - 1 };
}

export async function logUsage(db: D1Database, apiKeyId: string, endpoint: string, ip: string): Promise<void> {
  await db.prepare(
    'INSERT INTO usage_logs (id, api_key_id, endpoint, ip_address, timestamp) VALUES (?, ?, ?, ?, ?)'
  ).bind(uuid(), apiKeyId, endpoint, ip, now()).run();
}
