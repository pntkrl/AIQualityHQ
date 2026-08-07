import type { Env } from './_helpers';
import { json, error, corsPreflight, createRequestContext, log } from './_helpers';
import { analyzePrompt } from '../engine';

interface SubscribePayload {
  email: string;
  promptScore?: number;
  promptText?: string;
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

  log(reqCtx, 'info', 'Subscribe / Exhaustive Email Audit request received');

  let body: SubscribePayload;
  try {
    body = await ctx.request.json() as SubscribePayload;
  } catch {
    return error('Invalid JSON payload', 400, ctx.request, 'E_INVALID_JSON');
  }

  const { email, promptScore, promptText, promptSnippet, useCase = 'general', source = 'Email Prompt Audit Report' } = body;

  // Basic email syntax validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    return error('Please provide a valid email address', 400, ctx.request, 'E_INVALID_EMAIL');
  }

  const cleanEmail = email.trim().toLowerCase();
  const apiKey = ctx.env.BREVO_API_KEY;
  const listId = Number(ctx.env.BREVO_LIST_ID) || 3;
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
    // 1. Run Engine Analysis on the full prompt text if available
    const targetPrompt = promptText || promptSnippet || '';
    const analysis = targetPrompt.trim() ? analyzePrompt(targetPrompt) : null;
    const finalScore = analysis ? analysis.overallScore : (promptScore !== undefined ? promptScore : 70);
    const passed = analysis ? analysis.passed : finalScore >= 60;

    // 2. Add / Update Contact in Brevo Contacts List
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
          LAST_AUDIT_SCORE: finalScore,
          LAST_USE_CASE: useCase,
          SIGNUP_SOURCE: source
        }
      })
    });

    if (!brevoContactRes.ok && brevoContactRes.status !== 204) {
      const errDetails = await brevoContactRes.json().catch(() => ({}));
      log(reqCtx, 'warn', 'Brevo Contact API response', { status: brevoContactRes.status, errDetails });
    }

    // 3. Build Exhaustive HTML Email Audit Report
    const formattedScore = `${finalScore}/100`;
    const scoreColor = finalScore >= 80 ? '#10b981' : finalScore >= 60 ? '#f59e0b' : '#ef4444';
    const emailSubject = `Prompt Audit Report (${formattedScore} - ${passed ? 'VERIFIED PASS' : 'NEEDS REVISION'}) — AIQualityHQ`;

    // Extract dimension results HTML table
    let dimensionsTableHtml = '';
    if (analysis && analysis.dimensions) {
      dimensionsTableHtml = Object.values(analysis.dimensions).map(dim => `
        <tr style="border-bottom: 1px solid #1e293b;">
          <td style="padding: 10px 12px; font-size: 13px; font-weight: 600; color: #f1f5f9;">${dim.name}</td>
          <td style="padding: 10px 12px; font-size: 13px; font-family: monospace; font-weight: 700; color: ${dim.score >= 80 ? '#10b981' : dim.score >= 60 ? '#38bdf8' : '#ef4444'}; text-align: center;">${dim.score}/100</td>
          <td style="padding: 10px 12px; font-size: 12px; color: #94a3b8; text-align: center;">${dim.passedCount} / ${dim.factorsCount} Passed</td>
          <td style="padding: 10px 12px; font-size: 11px; text-align: right;">
            <span style="padding: 3px 8px; border-radius: 4px; font-weight: 700; font-family: monospace; ${dim.passed ? 'background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);' : 'background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);'}">
              ${dim.passed ? 'PASS' : 'FAIL'}
            </span>
          </td>
        </tr>
      `).join('');
    }

    // Extract failed rules & actionable recommendations HTML
    let failedRulesHtml = '';
    if (analysis && analysis.rules) {
      const failedRules = analysis.rules.filter(r => !r.passed);
      if (failedRules.length > 0) {
        failedRulesHtml = failedRules.map(r => `
          <div style="background: #020617; border: 1px solid #1e293b; border-left: 4px solid ${r.severity === 'critical' ? '#ef4444' : r.severity === 'major' ? '#f59e0b' : '#38bdf8'}; border-radius: 8px; padding: 14px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 13px; font-weight: 700; color: #f8fafc;">${r.name}</span>
              <span style="font-size: 10px; font-family: monospace; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; ${r.severity === 'critical' ? 'background: rgba(239, 68, 68, 0.2); color: #ef4444;' : r.severity === 'major' ? 'background: rgba(245, 158, 11, 0.2); color: #f59e0b;' : 'background: rgba(56, 189, 248, 0.2); color: #38bdf8;'}">
                ${r.severity}
              </span>
            </div>
            <div style="font-size: 12px; color: #cbd5e1; margin-bottom: 6px; leading-height: 1.4;">${r.explanation}</div>
            ${r.suggestion ? `<div style="font-size: 11px; color: #38bdf8; font-weight: 600; background: rgba(56, 189, 248, 0.08); padding: 8px 10px; border-radius: 6px;">&rarr; Action Item: ${r.suggestion}</div>` : ''}
          </div>
        `).join('');
      } else {
        failedRulesHtml = `
          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 14px; border-radius: 8px; font-size: 13px; color: #10b981; font-weight: 600;">
            ✓ Exceptional Prompt Rigor! All evaluated rules passed successfully.
          </div>
        `;
      }
    }

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Exhaustive AI Quality Audit Report</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #f1f5f9; padding: 30px 15px; margin: 0;">
        <div style="max-width: 650px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 14px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          
          <!-- Brand Header -->
          <div style="padding: 28px 24px; background: #020617; border-bottom: 1px solid #1e293b; text-align: center;">
            <div style="font-size: 22px; font-weight: 800; tracking-tight; color: #ffffff;">
              AIQuality<span style="color: #38bdf8;">HQ</span>
            </div>
            <div style="font-size: 12px; font-family: monospace; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px;">
              Exhaustive Prompt Audit & Diagnostic Certificate
            </div>
          </div>

          <div style="padding: 28px 24px;">
            
            <!-- Overall Score Banner -->
            <div style="background: #020617; border: 1px solid #1e293b; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <div style="font-size: 11px; font-family: monospace; font-weight: 700; text-transform: uppercase; tracking-wider; color: #94a3b8; margin-bottom: 6px;">
                Overall Quality Score
              </div>
              <div style="font-size: 52px; font-family: monospace; font-weight: 900; color: ${scoreColor}; line-height: 1;">
                ${formattedScore}
              </div>
              <div style="margin-top: 10px;">
                <span style="padding: 4px 12px; font-size: 12px; font-family: monospace; font-weight: 800; border-radius: 6px; ${passed ? 'background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #10b981;' : 'background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444;'}">
                  ${passed ? 'VERIFIED PASS' : 'NEEDS REVISION'}
                </span>
              </div>
              <div style="font-size: 12px; color: #64748b; margin-top: 12px;">
                Domain: <strong style="color: #cbd5e1;">${useCase.toUpperCase()}</strong> &nbsp;&bull;&nbsp; Date: <strong style="color: #cbd5e1;">${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
              </div>
            </div>

            <!-- 6-Dimension Breakdown Section -->
            ${dimensionsTableHtml ? `
              <div style="margin-bottom: 28px;">
                <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #38bdf8; margin-bottom: 12px; font-family: monospace;">
                  1. Six-Dimension Score Breakdown
                </h3>
                <table style="width: 100%; border-collapse: collapse; background: #020617; border: 1px solid #1e293b; border-radius: 10px; overflow: hidden;">
                  <thead>
                    <tr style="background: #1e293b; color: #94a3b8; font-size: 11px; text-transform: uppercase; font-family: monospace;">
                      <th style="padding: 10px 12px; text-align: left;">Dimension</th>
                      <th style="padding: 10px 12px; text-align: center;">Score</th>
                      <th style="padding: 10px 12px; text-align: center;">Passed Checks</th>
                      <th style="padding: 10px 12px; text-align: right;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${dimensionsTableHtml}
                  </tbody>
                </table>
              </div>
            ` : ''}

            <!-- Diagnostic Rule Findings Section -->
            ${failedRulesHtml ? `
              <div style="margin-bottom: 28px;">
                <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #38bdf8; margin-bottom: 12px; font-family: monospace;">
                  2. Priority Action Items & Diagnostic Findings
                </h3>
                ${failedRulesHtml}
              </div>
            ` : ''}

            <!-- Evaluated Prompt Content Container -->
            ${targetPrompt ? `
              <div style="margin-bottom: 28px;">
                <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #38bdf8; margin-bottom: 12px; font-family: monospace;">
                  3. Evaluated Prompt Payload
                </h3>
                <div style="background: #020617; border: 1px solid #1e293b; padding: 16px; border-radius: 10px; font-family: monospace; font-size: 12px; color: #cbd5e1; max-height: 250px; overflow-y: auto; white-space: pre-wrap; word-break: break-all; leading-height: 1.5;">
                  ${targetPrompt.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                </div>
              </div>
            ` : ''}

            <!-- Action CTAs -->
            <div style="text-align: center; padding-top: 12px; margin-bottom: 16px;">
              <a href="https://aiqualityhq.com/checker" style="display: inline-block; padding: 14px 28px; background: #0284c7; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 8px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);">
                Open Interactive Prompt Checker &rarr;
              </a>
            </div>

            <div style="text-align: center;">
              <a href="https://aiqualityhq.com/prompt-rewriter" style="font-size: 12px; color: #38bdf8; text-decoration: underline;">
                Auto-Optimize Prompt in AI Prompt Rewriter
              </a>
            </div>

          </div>

          <!-- Footer -->
          <div style="padding: 20px 24px; text-align: center; font-size: 11px; color: #64748b; background: #020617; border-top: 1px solid #1e293b; leading-height: 1.5;">
            &copy; ${new Date().getFullYear()} AIQualityHQ &bull; Help people measure, improve, and trust every AI interaction.<br>
            Sent directly via Brevo Integration for <strong style="color: #94a3b8;">${cleanEmail}</strong>
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
      log(reqCtx, 'info', 'Exhaustive Brevo transactional audit email sent successfully to ' + cleanEmail);
    }

    return json({
      success: true,
      message: 'Exhaustive audit report & certificate sent to your email!',
      email: cleanEmail
    }, 200, ctx.request);
  } catch (err: any) {
    log(reqCtx, 'error', 'Failed to execute Brevo API calls', { message: err?.message });
    return error('Unable to process subscription at this time', 500, ctx.request, 'E_BREVO_FAILURE');
  }
};
