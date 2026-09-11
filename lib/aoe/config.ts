// =============================================================================
// AOE — Automated Outreach Engine
// Config — the ONLY file you change when deploying AOE to a different product
// =============================================================================

import type { AoeConfig } from './types'

export const AOE_CONFIG: AoeConfig = {
  // -------------------------------------------------------------------------
  // Product — change these when deploying to a different product
  // -------------------------------------------------------------------------
  product: {
    name: 'Uptrue',
    tagline: 'Website monitoring that works while you sleep',
    signupUrl: 'https://upnotify-monitoring.vercel.app/signup',
    logoUrl: 'https://upnotify-monitoring.vercel.app/logo.png',
    primaryColour: '#3b82f6',
    companyName: 'Crozent Techlabs Private Limited',
    companyAddress: 'Noida, Uttar Pradesh, India',
    unsubscribeUrl: 'https://upnotify-monitoring.vercel.app/api/v1/outreach/unsubscribe',
  },

  // -------------------------------------------------------------------------
  // Campaigns — enabled/disabled here are defaults only
  // Live ON/OFF is controlled from admin panel (aoe_settings table)
  // -------------------------------------------------------------------------
  campaigns: {
    ssl_expiry: {
      enabled: true,
      daysBeforeExpiry: [14, 7, 3],
      ctaText: 'Monitor my SSL free →',
      ctaUrl: 'https://upnotify-monitoring.vercel.app/signup?utm_source=outreach&utm_campaign=ssl_expiry&utm_medium=email',
    },
    site_down: {
      enabled: true,
      ctaText: 'Monitor my site free →',
      ctaUrl: 'https://upnotify-monitoring.vercel.app/signup?utm_source=outreach&utm_campaign=site_down&utm_medium=email',
    },
    site_slow: {
      enabled: true,
      slowThresholdMs: 3000,
      ctaText: 'See my full performance report →',
      ctaUrl: 'https://upnotify-monitoring.vercel.app/signup?utm_source=outreach&utm_campaign=site_slow&utm_medium=email',
    },
    ecom_down: {
      enabled: true,
      platforms: ['shopify', 'woocommerce'],
      ctaText: 'Protect my store free →',
      ctaUrl: 'https://upnotify-monitoring.vercel.app/signup?utm_source=outreach&utm_campaign=ecom_down&utm_medium=email',
    },
    compete_cold: {
      enabled: false, // starts disabled — turn on from admin panel when ready
      platforms: ['shopify', 'woocommerce'],
      ctaText: 'Track my competitors free →',
      ctaUrl: 'https://upnotify-monitoring.vercel.app/signup?utm_source=outreach&utm_campaign=compete_cold&utm_medium=email',
    },
    ai_seo: {
      enabled: false, // starts disabled — turn on from admin panel after Harvey sign-off
      primaryCtaText: 'Check your AI visibility score — free →',
      primaryCtaUrl: 'https://upnotify-monitoring.vercel.app/tools/ai-visibility?utm_source=outreach&utm_campaign=ai_seo&utm_medium=email',
      secondaryCtaText: 'Generate your llms.txt — free →',
      secondaryCtaUrl: 'https://upnotify-monitoring.vercel.app/tools/llms-txt?utm_source=outreach&utm_campaign=ai_seo&utm_medium=email',
    },
  },

  // -------------------------------------------------------------------------
  // Quota thresholds — change here if plan changes
  // -------------------------------------------------------------------------
  quota: {
    monthlyLimit: 50000,       // Resend Starter plan
    alertThreshold: 0.70,      // 70% → warn admin
    pauseThreshold: 0.85,      // 85% → pause all marketing
    upgradeThreshold: 0.95,    // 95% → temp upgrade required
    hardReservePercent: 0.02,  // 2% always reserved (never touched)
    alertBufferPercent: 0.20,  // 20% buffer on top of alert reservation
  },

  // -------------------------------------------------------------------------
  // Sending schedule
  // -------------------------------------------------------------------------
  sending: {
    dailySendHour: 8,    // 8am UTC — main send
    burstHour: 23,       // 11pm UTC — last day burst
    cooldownDays: 30,    // never email same domain more than once per 30 days
    fromName: 'Uptrue',
    fromEmail: 'shreya23001@gmail.com',
  },
}
