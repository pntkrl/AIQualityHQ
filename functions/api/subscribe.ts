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

  const { email, promptScore, promptSnippet, useCase, source = 'Email Prompt Audit Report' } = body;

  // Basic email syntax validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    return error('Please provide a valid email address', 400, ctx.request, 'E_INVALID_EMAIL');
  }

  const cleanEmail = email.trim().toLowerCase();
  const apiKey = ctx.env.BREVO_API_KEY;
  const listId = Number(ctx.env.BREVO_LIST_ID) || 2;
  const senderEmail = ctx.env.BREVO_SENDER_EMAIL || 'support@aiqualityhq.com';

  // If BREVO_API_KEY is not configured in environment variables yet (e.g. local testing), return success with demo notice
  if (!apiKey) {
    log(reqCtx, 'warn', 'BREVO_API_KEY environment variable not configured');
    return json({
      success: true,
      mode: 'demo',
      message: 'Report request recorded! Set BREVO_API_KEY in Cloudflare Pages settings to forward leads & send transactional emails via Brevo.',
      email: cleanEmail
    }, 200, ctx.request);
  }

  try {
    // 1. Add / Update Contact in Brevo Contacts List
    const brevoContactRes = await fetch('https://api.brevo.com/v3/contacts', {
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

    if (!brevoContactRes.ok && brevoContactRes.status !== 204) {
      const errDetails = await brevoContactRes.json().catch(() => ({}));
      log(reqCtx, 'warn', 'Brevo Contact API response', { status: brevoContactRes.status, errDetails });
    }

    // 2. Send Immediate Transactional Email via Brevo SMTP API
    const formattedScore = promptScore !== undefined ? `${promptScore}/100` : 'Evaluated';
    const emailSubject = `Your AI Quality Audit Report (${formattedScore}) — AIQualityHQ`;
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>AIQualityHQ Audit Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #090d16; color: #f1f5f9; padding: 30px; margin: 0; }
          .container { max-width: 600px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; }
          .header { padding: 24px; background: #1e293b; border-b: 1px solid #334155; text-align: center; }
          .title { font-size: 20px; font-weight: 700; color: #f8fafc; margin: 0; }
          .subtitle { font-size: 13px; color: #94a3b8; margin-top: 4px; }
          .content { padding: 24px; }
          .score-box { background: #020617; border: 1px solid #1e293b; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px; }
          .score-num { font-size: 42px; font-weight: 800; color: ${promptScore && promptScore >= 60 ? '#10b981' : '#f59e0b'}; }
          .snippet-box { background: #020617; border: 1px solid #1e293b; padding: 14px; border-radius: 8px; font-family: monospace; font-size: 12px; color: #cbd5e1; margin-bottom: 20px; word-break: break-all; }
          .btn { display: inline-block; padding: 12px 24px; background: #0284c7; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 8px; }
          .footer { padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="title">AIQualityHQ Prompt Diagnosis Certificate</div>
            <div class="subtitle">38 Deterministic Rules Assessment</div>
          </div>
          <div class="content">
            <div class="score-box">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8;">Overall Prompt Score</div>
              <div class="score-num">${formattedScore}</div>
              <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Use Case Domain: ${useCase || 'General'}</div>
            </div>

            ${promptSnippet ? `
              <div style="font-size: 12px; font-weight: 600; color: #94a3b8; margin-bottom: 6px;">Evaluated Prompt Snippet:</div>
              <div class="snippet-box">${promptSnippet.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            ` : ''}

            <p style="font-size: 13px; line-height: 1.6; color: #94a3b8;">
              Your prompt audit certificate was successfully generated by AIQualityHQ. You can view your complete interactive report, detailed rule breakdown, and AI rewriter suggestions directly on our portal.
            </p>

            <div style="text-align: center; margin-top: 24px;">
              <a href="https://aiqualityhq.com/checker" class="btn">Open Interactive Checker &rarr;</a>
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} AIQualityHQ. Help people measure, improve, and trust every AI interaction.<br>
            Sent via Brevo Integration for ${cleanEmail}
          </div>
        </div>
      </body>
      </html>
    `;

    const sendEmailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'AIQualityHQ Quality Engine', email: senderEmail },
        to: [{ email: cleanEmail }],
        subject: emailSubject,
        htmlContent: htmlBody
      })
    });

    if (!sendEmailRes.ok) {
      const errText = await sendEmailRes.text();
      log(reqCtx, 'error', 'Brevo SMTP API send failed', { status: sendEmailRes.status, response: errText });
    } else {
      log(reqCtx, 'info', 'Brevo transactional audit email sent successfully to ' + cleanEmail);
    }

    return json({
      success: true,
      message: 'Audit report & certificate sent to your email!',
      email: cleanEmail
    }, 200, ctx.request);
  } catch (err: any) {
    log(reqCtx, 'error', 'Failed to execute Brevo API calls', { message: err?.message });
    return error('Unable to process subscription at this time', 500, ctx.request, 'E_BREVO_FAILURE');
  }
};
