import type { Env } from './_helpers';
import { json, error, corsPreflight, createRequestContext, log } from './_helpers';

interface SubscribePayload {
  email: string;
  promptScore?: number;
  promptSnippet?: string;
  useCase?: string;
  source?: string;
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const reqCtx = createRequestContext(ctx.request, '/api/subscribe');

  if (ctx.request.method === 'OPTIONS') return corsPreflight(ctx.request);
  if (ctx.request.method !== 'POST') {
    return error('Method not allowed', 405, ctx.request, 'E_METHOD_NOT_ALLOWED');
  }

  log(reqCtx, 'info', 'Subscribe / Email Audit request received');

  let body: SubscribePayload;
  try {
    body = await ctx.request.json() as SubscribePayload;
  } catch {
    return error('Invalid JSON payload', 400, ctx.request, 'E_INVALID_JSON');
  }

  const { email, promptScore, useCase, source = 'Email Prompt Audit Report' } = body;

  // Basic email syntax validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    return error('Please provide a valid email address', 400, ctx.request, 'E_INVALID_EMAIL');
  }

  const cleanEmail = email.trim().toLowerCase();
  const apiKey = ctx.env.BREVO_API_KEY;
  const listId = Number(ctx.env.BREVO_LIST_ID) || 2;

  // If BREVO_API_KEY is not configured in environment variables yet (e.g. local testing), return success with demo notice
  if (!apiKey) {
    log(reqCtx, 'warn', 'BREVO_API_KEY environment variable not configured');
    return json({
      success: true,
      mode: 'demo',
      message: 'Report request recorded! Set BREVO_API_KEY in Cloudflare Pages to forward leads directly to Brevo.',
      email: cleanEmail
    }, 200, ctx.request);
  }

  try {
    // Send to Brevo v3 Contacts API
    const brevoRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: cleanEmail,
        listIds: [listId],
        updateEnabled: true,
        attributes: {
          LAST_AUDIT_SCORE: promptScore !== undefined ? promptScore : null,
          LAST_USE_CASE: useCase || 'general',
          SIGNUP_SOURCE: source
        }
      })
    });

    if (!brevoRes.ok && brevoRes.status !== 204) {
      const errDetails = await brevoRes.json().catch(() => ({}));
      log(reqCtx, 'error', 'Brevo API error', { status: brevoRes.status, errDetails });
      // If contact already exists or updated, Brevo status 200 or 204 or 400 with duplicate message
      if (brevoRes.status === 400 && JSON.stringify(errDetails).includes('duplicate_parameter')) {
        return json({
          success: true,
          message: 'Your report delivery request has been updated!',
          email: cleanEmail
        }, 200, ctx.request);
      }
    }

    return json({
      success: true,
      message: 'Audit report requested! Check your inbox shortly.',
      email: cleanEmail
    }, 200, ctx.request);
  } catch (err: any) {
    log(reqCtx, 'error', 'Failed to reach Brevo API', { message: err?.message });
    return error('Unable to process subscription at this time', 500, ctx.request, 'E_BREVO_FAILURE');
  }
};
