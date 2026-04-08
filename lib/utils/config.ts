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
    apiKey:         string  // Bearer token for external tool — set SUPPORT_API_KEY
    webhookUrl:     string  // Outbound webhook for external tool — set SUPPORT_WEBHOOK_URL
    webhookSecret:  string  // HMAC secret for webhook signing — set SUPPORT_WEBHOOK_SECRET
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
  // Dev: NEXT_PUBLIC_APP_URL = https://dev.uptrue.io
  // Prod: NEXT_PUBLIC_APP_URL = https://uptrue.io
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim()
  const adminEmails = process.env.ADMIN_EMAILS || ''
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ''

  // NEXT_PUBLIC_* vars are only available in the browser at runtime, not during
  // static prerendering at build time. Don't throw server-side — the browser will
  // always have these vars injected by Next.js when the page is served.
  if (!url || !anonKey) {
    if (typeof window !== 'undefined') {
      // In the browser, missing vars means a real misconfiguration — fail loud.
      throw new Error('Missing required Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)')
    }
    // During SSR/build: return config with empty strings — browser will get real values
    return { supabase: { url: '', anonKey: '' }, app: { url: appUrl }, admin: { emails: adminEmails.split(',').map(e => e.trim()).filter(Boolean) }, analytics: { gaMeasurementId } }
  }

  cachedPublicConfig = {
    supabase: { url, anonKey },
    app: { url: appUrl },
    admin: {
      emails: adminEmails.split(',').map(e => e.trim()).filter(Boolean),
    },
    analytics: {
      gaMeasurementId,
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
      resend: { apiKey: '', fromEmail: 'alerts@uptrue.io', fromName: 'Uptrue Alerts' },
      stripe: { secretKey: '', webhookSecret: '' },
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
  const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'alerts@uptrue.io'
  const resendFromName = process.env.RESEND_FROM_NAME || 'Uptrue Alerts'

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? ''
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ''
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
      apiKey:        supportApiKey,
      webhookUrl:    supportWebhookUrl,
      webhookSecret: supportWebhookSecret,
    },
    adminEmails: adminEmailsList,
  }

  return cachedServerConfig
}
