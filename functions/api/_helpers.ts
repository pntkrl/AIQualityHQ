/// <reference path="../../.wrangler/types/worker-configuration.d.ts" />

import type { D1Database } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  AIQUALITY_API_KEY: string;
  ENVIRONMENT: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  MICROSOFT_CLIENT_ID: string;
  MICROSOFT_CLIENT_SECRET: string;
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export function error(message: string, status = 400): Response {
  return json({ error: message }, status);
}

export function corsPreflight(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400',
    },
  });
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

// PBKDF2 password hashing using Web Crypto API
export async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const enc = new TextEncoder();
  const pwKey = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const s = salt || btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(s), iterations: 100000, hash: 'SHA-256' },
    pwKey, 256
  );
  const hash = btoa(String.fromCharCode(...new Uint8Array(bits)));
  return { hash, salt: s };
}

export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const { hash: computed } = await hashPassword(password, salt);
  return computed === hash;
}

// Session token generation and validation
export async function createSession(db: D1Database, userId: string): Promise<{ token: string; expiresAt: string }> {
  const token = uuid() + '-' + uuid();
  const expiresAt = daysFromNow(30);
  await db.prepare(
    'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)'
  ).bind(uuid(), userId, token, expiresAt).run();
  return { token, expiresAt };
}

export async function getSessionUser(db: D1Database, token: string): Promise<{ id: string; email: string; name: string } | null> {
  const session = await db.prepare(
    `SELECT u.id, u.email, u.name FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > datetime('now')`
  ).bind(token).first<{ id: string; email: string; name: string }>();
  return session || null;
}

// API key generation and validation
export async function generateApiKey(): Promise<{ raw: string; identifier: string; hash: string }> {
  const raw = 'aq_live_' + Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  const identifier = raw.substring(0, 15) + '...';
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

// Rate limiting
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
  const count = await db.prepare(
    `SELECT COUNT(*) as count FROM usage_logs
     WHERE api_key_id = ? AND timestamp > ?`
  ).bind(apiKeyId, windowStart).first<{ count: number }>();
  const used = count?.count || 0;
  return { allowed: used < limit, remaining: Math.max(0, limit - used) };
}

export async function logUsage(db: D1Database, apiKeyId: string, endpoint: string, ip: string): Promise<void> {
  await db.prepare(
    'INSERT INTO usage_logs (id, api_key_id, endpoint, ip_address, timestamp) VALUES (?, ?, ?, ?, ?)'
  ).bind(uuid(), apiKeyId, endpoint, ip, now()).run();
}
