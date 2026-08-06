import type { Env } from './_helpers';
import { json, error, corsPreflight, hashApiKey, checkRateLimit, logUsage, now, createRequestContext, log } from './_helpers';
import { analyzePrompt } from '../engine';

const MAX_PROMPT_LENGTH = 50_000;
const MAX_BODY_SIZE = 1024 * 1024; // 1MB

// Simple in-memory LRU cache for identical prompts (deduplication + smart caching)
const CACHE_MAX_SIZE = 500;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  result: ReturnType<typeof analyzePrompt>;
  timestamp: number;
}

const promptCache = new Map<string, CacheEntry>();

async function hashPrompt(prompt: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(prompt), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('prompt-cache'));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function getCachedResult(prompt: string): Promise<CacheEntry | null> {
  const key = await hashPrompt(prompt);
  const entry = promptCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    promptCache.delete(key);
    return null;
  }
  // Move to end (most recently used)
  promptCache.delete(key);
  promptCache.set(key, entry);
  return entry;
}

async function setCachedResult(prompt: string, result: ReturnType<typeof analyzePrompt>): Promise<void> {
  const key = await hashPrompt(prompt);
  // Evict oldest if at capacity
  if (promptCache.size >= CACHE_MAX_SIZE) {
    const firstKey = promptCache.keys().next().value;
    if (firstKey) promptCache.delete(firstKey);
  }
  promptCache.set(key, { result, timestamp: Date.now() });
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const reqCtx = createRequestContext(ctx.request, '/api/check');

  if (ctx.request.method === 'OPTIONS') return corsPreflight(ctx.request);
  if (ctx.request.method !== 'POST') return error('Method not allowed', 405, ctx.request, 'E_METHOD_NOT_ALLOWED');

  log(reqCtx, 'info', 'Request received');

  // Request body size check (Content-Length header)
  const contentLength = parseInt(ctx.request.headers.get('Content-Length') || '0', 10);
  if (contentLength > MAX_BODY_SIZE) {
    log(reqCtx, 'warn', 'Body too large', { contentLength });
    return error('Request body too large. Maximum size is 1MB.', 413, ctx.request, 'E_PAYLOAD_TOO_LARGE');
  }

  const apiKey = ctx.request.headers.get('X-API-Key');
  if (!apiKey) return error('X-API-Key header is required', 401, ctx.request, 'E_MISSING_API_KEY');

  const keyHash = await hashApiKey(apiKey);
  const key = await ctx.env.DB.prepare(
    `SELECT k.id, k.user_id, s.plan FROM api_keys k
     JOIN users u ON u.id = k.user_id
     JOIN subscriptions s ON s.user_id = k.user_id
     WHERE k.key_hash = ? AND k.active = 1`
  ).bind(keyHash).first<{ id: string; user_id: string; plan: string }>();

  if (!key) {
    log(reqCtx, 'warn', 'Invalid API key');
    return error('Invalid or inactive API key', 401, ctx.request, 'E_INVALID_API_KEY');
  }

  const { allowed, remaining } = await checkRateLimit(
    ctx.env.DB, key.id, key.plan
  );
  if (!allowed) {
    log(reqCtx, 'warn', 'Rate limit exceeded', { apiKeyId: key.id, plan: key.plan });
    return error('Rate limit exceeded. Upgrade your plan for higher limits.', 429, ctx.request, 'E_RATE_LIMITED');
  }

  let body: { prompt?: string };
  try {
    body = await ctx.request.json();
  } catch {
    log(reqCtx, 'warn', 'Invalid JSON body');
    return error('Invalid JSON', 400, ctx.request, 'E_INVALID_JSON');
  }

  if (!body.prompt || typeof body.prompt !== 'string') {
    return error('Missing "prompt" field', 400, ctx.request, 'E_MISSING_PROMPT');
  }

  if (body.prompt.length > MAX_PROMPT_LENGTH) {
    log(reqCtx, 'warn', 'Prompt too long', { length: body.prompt.length });
    return error(`Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters.`, 400, ctx.request, 'E_PROMPT_TOO_LONG');
  }

  const cfIp = ctx.request.headers.get('CF-Connecting-IP') || 'unknown';
  await logUsage(ctx.env.DB, key.id, '/api/check', cfIp);

  // Check cache for identical prompts (deduplication)
  const cached = await getCachedResult(body.prompt);
  const result = cached ? cached.result : analyzePrompt(body.prompt);

  if (!cached) {
    await setCachedResult(body.prompt, result);
  }

  log(reqCtx, 'info', 'Request completed', {
    promptLength: body.prompt.length,
    score: result.overallScore,
    cached: !!cached,
  });

  return json(result, 200, ctx.request, {
    'X-Request-ID': reqCtx.requestId,
    'X-RateLimit-Remaining': String(remaining),
    'X-Cache': cached ? 'HIT' : 'MISS',
    'Cache-Control': 'no-store',
  });
};
