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
}

interface ServerConfig extends PublicConfig {
  supabase: PublicConfig['supabase'] & {
    serviceRoleKey: string
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const adminEmails = process.env.ADMIN_EMAILS || ''

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

  cachedServerConfig = {
    ...publicConfig,
    supabase: {
      ...publicConfig.supabase,
      serviceRoleKey,
    },
  }

  return cachedServerConfig
}
