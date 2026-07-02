import { analyzePrompt } from '../engine';

interface Env {
  AIQUALITY_API_KEY?: string;
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const req = ctx.request;
  const url = new URL(req.url);
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  const apiKey = req.headers.get('X-API-Key');
  const configuredKey = ctx.env.AIQuality_API_Key;
  if (configuredKey && apiKey !== configuredKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
  }

  let body: { prompt?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers });
  }

  if (!body.prompt || typeof body.prompt !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing "prompt" field' }), { status: 400, headers });
  }

  const result = analyzePrompt(body.prompt);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { ...headers, 'Cache-Control': 'public, max-age=60' },
  });
};
