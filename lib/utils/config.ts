/**
 * Centralised environment variable access.
 * This is the ONLY file allowed to use process.env directly.
 * All other code must use getConfig() or getServerConfig().
 */

interface PublicConfig {
  supabase: {
    url: string
    anonKey: string
  }
  app: {
    url: string
  }
  admin: {
    emails: string[]
  }
  analytics: {
    gaMeasurementId: string
    gtmId: string
  }
}

interface ServerConfig extends PublicConfig {
  supabase: PublicConfig['supabase'] & {
    serviceRoleKey: string
  }
  resend: {
    apiKey: string
    fromEmail: string
    fromName: string
  }
  stripe: {
    secretKey: string
    webhookSecret: string
  }
  razorpay: {
    keyId: string
    keySecret: string
    webhookSecret: string
  }
  anthropic: {
    apiKey: string
  }
  cron: {
    secret: string
  }
  twitter: {
    consumerKey: string
    consumerSecret: string
    accessToken: string
    accessTokenSecret: string
    bearerToken: string
  }
  linkedin: {
    accessToken: string
    memberId: string        // temp: member posting; swap for organizationId before go-live
    organizationId: string  // go-live: requires w_organization_social scope + LinkedIn approval
  }
  telegram: {
    botToken: string
    chatId: string
  }
  blogApproval: {
    secret: string
  }
  support: {
    apiKey: string  // Bearer token for external tool — set SUPPORT_API_KEY
    webhookUrl: string  // Outbound webhook for external tool — set SUPPORT_WEBHOOK_URL
    webhookSecret: string  // HMAC secret for webhook signing — set SUPPORT_WEBHOOK_SECRET
  }
  adminEmails: string[]
}

/**
 * Next.js only inlines NEXT_PUBLIC_* env vars when accessed as literal
 * property lookups (e.g. process.env.NEXT_PUBLIC_SUPABASE_URL).
 * Dynamic access like process.env[key] does NOT get replaced at build time.
 * So we must use literal references for all client-accessible vars.
 */

let cachedPublicConfig: PublicConfig | null = null

export function getConfig(): PublicConfig {
  if (cachedPublicConfig) return cachedPublicConfig

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  // Always use NEXT_PUBLIC_APP_URL — never the auto-generated Vercel preview URL
  // Dev & Prod: NEXT_PUBLIC_APP_URL = https://upnotify-monitoring.vercel.app
  // const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim()
  const appUrl = resolveAppUrl()
  const adminEmails = process.env.ADMIN_EMAILS || ''
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ''
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID ?? ''

  // NEXT_PUBLIC_* vars are only available in the browser at runtime, not during
  // static prerendering at build time. Don't throw server-side — the browser will
  // always have these vars injected by Next.js when the page is served.
  if (!url || !anonKey) {
    if (typeof window !== 'undefined') {
      // In the browser, missing vars means a real misconfiguration — fail loud.
      throw new Error('Missing required Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)')
    }
    // During SSR/build: return config with empty strings — browser will get real values
    return { supabase: { url: '', anonKey: '' }, app: { url: appUrl }, admin: { emails: adminEmails.split(',').map(e => e.trim()).filter(Boolean) }, analytics: { gaMeasurementId, gtmId } }
  }

  cachedPublicConfig = {
    supabase: { url, anonKey },
    app: { url: appUrl },
    admin: {
      emails: adminEmails.split(',').map(e => e.trim()).filter(Boolean),
    },
    analytics: {
      gaMeasurementId,
      gtmId,
    },
  }

  return cachedPublicConfig
}

// No module-level cache for server config — Vercel serverless functions are
// short-lived and env vars must be read fresh each cold start. Caching across
// requests in the same instance is fine; stale cached empty values are not.
let cachedServerConfig: ServerConfig | null = null

export function getServerConfig(): ServerConfig {
  if (typeof window !== 'undefined') {
    throw new Error('getServerConfig() must not be called from client-side code')
  }

  if (cachedServerConfig) return cachedServerConfig

  const publicConfig = getConfig()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

  // During static generation (local npm run build without .env.development loaded),
  // server-only env vars may not be present. Return empty config so the build
  // succeeds — Vercel always has env vars set, so ISR regeneration works correctly.
  if (!serviceRoleKey) {
    return {
      ...publicConfig,
      supabase: { ...publicConfig.supabase, serviceRoleKey: '' },
      resend: { apiKey: '', fromEmail: 'noreply@crozent.com', fromName: 'Upnotify Alerts' },
      stripe: { secretKey: '', webhookSecret: '' },
      razorpay: { keyId: '', keySecret: '', webhookSecret: '' },
      anthropic: { apiKey: '' },
      cron: { secret: '' },
      twitter: { consumerKey: '', consumerSecret: '', accessToken: '', accessTokenSecret: '', bearerToken: '' },
      linkedin: { accessToken: '', memberId: '', organizationId: '' },
      telegram: { botToken: '', chatId: '' },
      blogApproval: { secret: '' },
      support: { apiKey: '', webhookUrl: '', webhookSecret: '' },
      adminEmails: [],
    }
  }

  const resendApiKey = process.env.RESEND_API_KEY ?? ''
  const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@crozent.com'
  const resendFromName = process.env.RESEND_FROM_NAME || 'Upnotify Alerts'

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? ''
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ''
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID ?? ''
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET ?? ''
  const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET ?? ''
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY ?? ''
  const cronSecret = process.env.CRON_SECRET ?? ''
  const twitterConsumerKey = process.env.X_CONSUMER_KEY ?? ''
  const twitterConsumerSecret = process.env.X_CONSUMER_SECRET ?? ''
  const twitterAccessToken = process.env.X_ACCESS_TOKEN ?? ''
  const twitterAccessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET ?? ''
  const twitterBearerToken = process.env.X_BEARER_TOKEN ?? ''
  const linkedinAccessToken = process.env.LINKEDIN_ACCESS_TOKEN ?? ''
  const linkedinMemberId = process.env.LINKEDIN_MEMBER_ID ?? ''
  const linkedinOrganizationId = process.env.LINKEDIN_ORGANIZATION_ID ?? ''
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN ?? ''
  const telegramChatId = process.env.TELEGRAM_CHAT_ID ?? ''
  const blogApprovalSecret = process.env.BLOG_APPROVAL_SECRET ?? ''
  const supportApiKey = process.env.SUPPORT_API_KEY ?? ''
  const supportWebhookUrl = process.env.SUPPORT_WEBHOOK_URL ?? ''
  const supportWebhookSecret = process.env.SUPPORT_WEBHOOK_SECRET ?? ''
  const adminEmailsList = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)

  cachedServerConfig = {
    ...publicConfig,
    supabase: {
      ...publicConfig.supabase,
      serviceRoleKey,
    },
    resend: {
      apiKey: resendApiKey,
      fromEmail: resendFromEmail,
      fromName: resendFromName,
    },
    stripe: {
      secretKey: stripeSecretKey,
      webhookSecret: stripeWebhookSecret,
    },
    razorpay: {
      keyId: razorpayKeyId,
      keySecret: razorpayKeySecret,
      webhookSecret: razorpayWebhookSecret,
    },
    anthropic: {
      apiKey: anthropicApiKey,
    },
    cron: {
      secret: cronSecret,
    },
    twitter: {
      consumerKey: twitterConsumerKey,
      consumerSecret: twitterConsumerSecret,
      accessToken: twitterAccessToken,
      accessTokenSecret: twitterAccessTokenSecret,
      bearerToken: twitterBearerToken,
    },
    linkedin: {
      accessToken: linkedinAccessToken,
      memberId: linkedinMemberId,
      organizationId: linkedinOrganizationId,
    },
    telegram: {
      botToken: telegramBotToken,
      chatId: telegramChatId,
    },
    blogApproval: {
      secret: blogApprovalSecret,
    },
    support: {
      apiKey: supportApiKey,
      webhookUrl: supportWebhookUrl,
      webhookSecret: supportWebhookSecret,
    },
    adminEmails: adminEmailsList,
  }

  return cachedServerConfig
}


/**
 * Resolve the canonical app URL.
 *
 * Why this is more than just `process.env.NEXT_PUBLIC_APP_URL`:
 *
 * `NEXT_PUBLIC_*` vars in Next.js are inlined into the JS bundle at BUILD
 * time. If a build was cached (or built with the wrong env-var scope on
 * Vercel), the runtime can't override the inlined value — it'll always be
 * whatever the build saw. This caused a real bug where digest emails
 * shipped on the dev deploy contained `localhost:3000` links because the
 * build cache had a stale value.
 *
 * Resolution order (first non-empty wins):
 *   1. `APP_URL` — server-only env var (NOT inlined; always read at runtime)
 *      — recommended setup: APP_URL=https://upnotify-monitoring.vercel.app (prod & preview)
 *   2. `NEXT_PUBLIC_APP_URL` — client-side compatibility
 *      (subject to inlining; localhost values rejected when on Vercel)
 *   3. Vercel runtime detection — uses VERCEL_ENV + VERCEL_GIT_COMMIT_REF
 *      (always fresh from runtime; never inlined)
 *   4. Vercel auto-generated branch URL — last-resort, may not be the alias
 *   5. `http://localhost:3000` — local dev only
 *
 * On Vercel runtime with no resolvable URL, throws — silent localhost fallback
 * is too dangerous (broken email links in production).
 */
function resolveAppUrl(): string {
  // 1. Server-only override — never inlined, always runtime
  const explicit = process.env.APP_URL?.trim()
  if (explicit) return explicit

  const onVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV)

  // 2. NEXT_PUBLIC_APP_URL — accept on local; reject localhost values on Vercel
  const publicUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (publicUrl) {
    if (!onVercel) return publicUrl
    if (!publicUrl.includes('localhost') && !publicUrl.includes('127.0.0.1')) {
      return publicUrl
    }
    // On Vercel with a localhost-y NEXT_PUBLIC_APP_URL — fall through to derive
  }

  // 3. Vercel runtime derivation (always read at runtime, not inlined)
  if (onVercel) {
    const vercelEnv = process.env.VERCEL_ENV
    const branch = process.env.VERCEL_GIT_COMMIT_REF
    const ciBranch = process.env.CI_COMMIT_REF_NAME // GitLab CI fallback

    if (vercelEnv === 'production') return 'https://upnotify-monitoring.vercel.app'
    if (branch === 'dev' || ciBranch === 'dev') return 'https://upnotify-monitoring.vercel.app'
    if (branch === 'master' || branch === 'main' || ciBranch === 'master') return 'https://upnotify-monitoring.vercel.app'

    // 4. Vercel auto-generated URL (won't be the alias, but valid URL)
    const branchUrl = process.env.VERCEL_BRANCH_URL
    if (branchUrl) return `https://${branchUrl}`
    const vercelUrl = process.env.VERCEL_URL
    if (vercelUrl) return `https://${vercelUrl}`
  }

  // 5. NEXT_PUBLIC_APP_URL even if localhost (last-resort, accepts inlined value)
  if (publicUrl) return publicUrl

  // 6. True local dev
  return 'http://localhost:3000'
}
