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
  }
  linkedin: {
    accessToken: string
    organizationId: string
  }
  blogApproval: {
    secret: string
  }
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const adminEmails = process.env.ADMIN_EMAILS || ''
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ''

  if (!url || !anonKey) {
    if (typeof window === 'undefined') {
      throw new Error('Missing required Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)')
    }
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

let cachedServerConfig: ServerConfig | null = null

export function getServerConfig(): ServerConfig {
  if (typeof window !== 'undefined') {
    throw new Error('getServerConfig() must not be called from client-side code')
  }

  if (cachedServerConfig) return cachedServerConfig

  const publicConfig = getConfig()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

  if (!serviceRoleKey) {
    throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY')
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
  const linkedinAccessToken = process.env.LINKEDIN_ACCESS_TOKEN ?? ''
  const linkedinOrganizationId = process.env.LINKEDIN_ORGANIZATION_ID ?? ''
  const blogApprovalSecret = process.env.BLOG_APPROVAL_SECRET ?? ''

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
    },
    linkedin: {
      accessToken: linkedinAccessToken,
      organizationId: linkedinOrganizationId,
    },
    blogApproval: {
      secret: blogApprovalSecret,
    },
  }

  return cachedServerConfig
}
