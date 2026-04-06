// =============================================================================
// AOE — Automated Outreach Engine
// Email templates — one per campaign
// All templates use real check data — never fabricated claims
// =============================================================================

import { AOE_CONFIG } from '../config'
import type { AoeSiteCheckSummary } from '../types'
import crypto from 'crypto'

// ---------------------------------------------------------------------------
// Base layout — shared across all AOE emails
// ---------------------------------------------------------------------------

function buildUnsubscribeUrl(messageId: string): string {
  const secret = process.env.AOE_UNSUBSCRIBE_SECRET ?? 'missing-secret'
  const sig = crypto.createHmac('sha256', secret).update(messageId).digest('hex')
  return `${AOE_CONFIG.product.signupUrl.replace('/signup', '')}/api/v1/outreach/unsubscribe?id=${encodeURIComponent(messageId)}&sig=${sig}`
}

function baseLayout(content: string, unsubscribeUrl: string): string {
  const { product } = AOE_CONFIG
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${product.name}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

<!-- Header -->
<tr><td style="padding:24px 32px 20px;border-bottom:1px solid #eaeaea;">
  <span style="font-size:18px;font-weight:700;color:#111827;letter-spacing:-0.3px;">${product.name}</span>
</td></tr>

<!-- Body -->
<tr><td style="padding:28px 32px 32px;">
${content}
</td></tr>

<!-- Footer -->
<tr><td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #eaeaea;">
  <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
    ${product.companyName} · ${product.companyAddress}<br>
    You received this because we monitor website health across the web.<br>
    <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe from outreach emails</a>
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

function ctaButton(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;padding:11px 28px;background-color:${AOE_CONFIG.product.primaryColour};color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:6px;">${text}</a>`
}

function esc(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AoeEmailTemplate {
  subject: string
  html: string
}

// ---------------------------------------------------------------------------
// 1. SSL Expiry
// ---------------------------------------------------------------------------

export function buildSslExpiryEmail(
  domain: string,
  summary: AoeSiteCheckSummary,
  messageId: string
): AoeEmailTemplate {
  const days = summary.sslExpiryDays ?? 0
  const { campaigns } = AOE_CONFIG
  const cta = campaigns.ssl_expiry

  const subject = `Your SSL certificate for ${domain} expires in ${days} day${days === 1 ? '' : 's'}`

  const html = baseLayout(`
    <h2 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#111827;">
      SSL certificate expiring in <span style="color:#ef4444;">${days} day${days === 1 ? '' : 's'}</span>
    </h2>
    <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Domain: <strong>${esc(domain)}</strong></p>
    <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">
      Hi,<br><br>
      We noticed during a routine scan that the SSL certificate for <strong>${esc(domain)}</strong>
      will expire in <strong>${days} day${days === 1 ? '' : 's'}</strong>.
    </p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0;font-size:14px;color:#dc2626;font-weight:600;">What happens when it expires:</p>
      <ul style="margin:8px 0 0;padding-left:20px;font-size:14px;color:#374151;line-height:1.8;">
        <li>Browsers show a <strong>"Not Secure"</strong> warning to all visitors</li>
        <li>Google may lower your search rankings</li>
        <li>Checkout and forms stop working for visitors</li>
      </ul>
    </div>
    <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">
      ${cta.ctaText.includes('free') ? 'Uptrue monitors your SSL certificate and alerts you automatically before it expires — free to start.' : cta.ctaText}
    </p>
    ${ctaButton(cta.ctaText, cta.ctaUrl)}
    <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">
      Uptrue monitors uptime, SSL, DNS and performance automatically. Free plan available.
    </p>
  `, buildUnsubscribeUrl(messageId))

  return { subject, html }
}

// ---------------------------------------------------------------------------
// 2. Site Down
// ---------------------------------------------------------------------------

export function buildSiteDownEmail(
  domain: string,
  summary: AoeSiteCheckSummary,
  messageId: string
): AoeEmailTemplate {
  const { campaigns } = AOE_CONFIG
  const cta = campaigns.site_down

  const subject = `${domain} was unreachable ${summary.downCount} time${summary.downCount === 1 ? '' : 's'} in our monitoring`

  const html = baseLayout(`
    <h2 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#111827;">
      We detected <span style="color:#ef4444;">${summary.downCount} outage${summary.downCount === 1 ? '' : 's'}</span> on ${esc(domain)}
    </h2>
    <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">
      Hi,<br><br>
      Over the past few nights we ran routine checks on <strong>${esc(domain)}</strong> and found
      it was unreachable <strong>${summary.downCount} time${summary.downCount === 1 ? '' : 's'}</strong>.
      ${summary.avgResponseMs > 0 ? `Average response time when it was up: <strong>${summary.avgResponseMs}ms</strong>.` : ''}
    </p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0 0 8px;font-size:14px;color:#dc2626;font-weight:600;">Impact of undetected downtime:</p>
      <ul style="margin:0;padding-left:20px;font-size:14px;color:#374151;line-height:1.8;">
        <li>Visitors arrive to a broken page and leave permanently</li>
        <li>Google crawls a down page and may deindex it</li>
        <li>You only find out when a customer complains</li>
      </ul>
    </div>
    <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">
      Uptrue checks your site every minute and sends an instant alert the moment it goes down — so you can fix it before most visitors notice.
    </p>
    ${ctaButton(cta.ctaText, cta.ctaUrl)}
    <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">
      No credit card required. Free plan checks every 5 minutes.
    </p>
  `, buildUnsubscribeUrl(messageId))

  return { subject, html }
}

// ---------------------------------------------------------------------------
// 3. Site Slow
// ---------------------------------------------------------------------------

export function buildSiteSlowEmail(
  domain: string,
  summary: AoeSiteCheckSummary,
  messageId: string
): AoeEmailTemplate {
  const { campaigns } = AOE_CONFIG
  const cta = campaigns.site_slow
  const avgMs = summary.avgResponseMs
  const worstMs = summary.worstResponseMs

  const subject = `${domain} is loading slowly — avg ${avgMs}ms response time`

  const html = baseLayout(`
    <h2 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#111827;">
      ${esc(domain)} is loading <span style="color:#f59e0b;">slowly</span>
    </h2>
    <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">
      Hi,<br><br>
      We've been monitoring <strong>${esc(domain)}</strong> over the past few nights and found some performance issues worth flagging.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-bottom:20px;">
      <tr style="background:#f9fafb;">
        <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Metric</td>
        <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Your site</td>
        <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Good target</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:14px;color:#374151;border-bottom:1px solid #f3f4f6;">Average response</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#f59e0b;border-bottom:1px solid #f3f4f6;">${avgMs}ms</td>
        <td style="padding:10px 16px;font-size:14px;color:#6b7280;border-bottom:1px solid #f3f4f6;">&lt; 800ms</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:14px;color:#374151;">Worst response</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#ef4444;">${worstMs}ms</td>
        <td style="padding:10px 16px;font-size:14px;color:#6b7280;">&lt; 2000ms</td>
      </tr>
    </table>
    <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;padding:14px 18px;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
        Google uses page speed as a ranking factor. A 1-second delay reduces conversions by up to 7%.
      </p>
    </div>
    <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">
      Uptrue tracks your response time around the clock and alerts you when performance degrades — so you catch problems before they cost you traffic.
    </p>
    ${ctaButton(cta.ctaText, cta.ctaUrl)}
  `, buildUnsubscribeUrl(messageId))

  return { subject, html }
}

// ---------------------------------------------------------------------------
// 4. Ecommerce Down (Shopify / WooCommerce)
// ---------------------------------------------------------------------------

export function buildEcomDownEmail(
  domain: string,
  summary: AoeSiteCheckSummary,
  messageId: string
): AoeEmailTemplate {
  const { campaigns } = AOE_CONFIG
  const cta = campaigns.ecom_down
  const platformLabel = summary.platform === 'shopify' ? 'Shopify' : 'WooCommerce'

  const subject = `Your ${platformLabel} store at ${domain} had downtime — you may have lost sales`

  const html = baseLayout(`
    <h2 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#111827;">
      Your ${platformLabel} store had <span style="color:#ef4444;">${summary.downCount} outage${summary.downCount === 1 ? '' : 's'}</span>
    </h2>
    <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">
      Hi,<br><br>
      We found that your ${platformLabel} store at <strong>${esc(domain)}</strong> was
      unreachable <strong>${summary.downCount} time${summary.downCount === 1 ? '' : 's'}</strong> during recent monitoring.
      ${summary.avgResponseMs > 0 ? `Response time when available: <strong>${summary.avgResponseMs}ms</strong>.` : ''}
    </p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0 0 8px;font-size:14px;color:#dc2626;font-weight:600;">Every minute of downtime costs you:</p>
      <ul style="margin:0;padding-left:20px;font-size:14px;color:#374151;line-height:1.8;">
        <li>Abandoned carts from visitors who couldn't complete checkout</li>
        <li>Lost ad spend — you're paying for clicks that hit a broken page</li>
        <li>Damaged trust if repeat customers experience the outage</li>
      </ul>
    </div>
    <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">
      Uptrue monitors your store every minute and sends you an instant alert by email (or SMS) the moment it goes down. You'll know before your customers do.
    </p>
    ${ctaButton(cta.ctaText, cta.ctaUrl)}
    <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">
      Free plan available. Takes 2 minutes to set up. No credit card required.
    </p>
  `, buildUnsubscribeUrl(messageId))

  return { subject, html }
}

// ---------------------------------------------------------------------------
// 5. Compete Cold (no issues — ecommerce platform detected)
// ---------------------------------------------------------------------------

export function buildCompeteColdEmail(
  domain: string,
  summary: AoeSiteCheckSummary,
  messageId: string
): AoeEmailTemplate {
  const { campaigns } = AOE_CONFIG
  const cta = campaigns.compete_cold
  const platformLabel = summary.platform === 'shopify' ? 'Shopify' : 'WooCommerce'

  const subject = `Are your competitors monitoring you? How ${domain} compares to rivals`

  const html = baseLayout(`
    <h2 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#111827;">
      How does <span style="color:${AOE_CONFIG.product.primaryColour};">${esc(domain)}</span> perform vs. your competitors?
    </h2>
    <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">
      Hi,<br><br>
      Your ${platformLabel} store at <strong>${esc(domain)}</strong> looks healthy — good response times and no downtime we detected.
      That's great. But do you know how your competitors are performing?
    </p>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0 0 8px;font-size:14px;color:#1e40af;font-weight:600;">What Uptrue Compete shows you:</p>
      <ul style="margin:0;padding-left:20px;font-size:14px;color:#374151;line-height:1.8;">
        <li>Real-time uptime of your top competitors' stores</li>
        <li>Speed comparisons — who loads faster?</li>
        <li>Instant alerts when a competitor goes down (opportunity)</li>
        <li>Monthly reports to share with your team</li>
      </ul>
    </div>
    <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">
      When a competitor goes down, their customers start looking for alternatives. With Uptrue Compete, you know the moment that window opens.
    </p>
    ${ctaButton(cta.ctaText, cta.ctaUrl)}
    <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">
      Monitor up to 5 competitors free. No credit card required.
    </p>
  `, buildUnsubscribeUrl(messageId))

  return { subject, html }
}

// ---------------------------------------------------------------------------
// Router — pick the right template for a category
// ---------------------------------------------------------------------------

export function buildAoeEmail(
  domain: string,
  summary: AoeSiteCheckSummary,
  messageId: string
): AoeEmailTemplate | null {
  switch (summary.category) {
    case 'ssl_expiry':  return buildSslExpiryEmail(domain, summary, messageId)
    case 'down':        return buildSiteDownEmail(domain, summary, messageId)
    case 'ecom_issue':  return buildEcomDownEmail(domain, summary, messageId)
    case 'slow':        return buildSiteSlowEmail(domain, summary, messageId)
    case 'compete':     return buildCompeteColdEmail(domain, summary, messageId)
    default:            return null
  }
}
