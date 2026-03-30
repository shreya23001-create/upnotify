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

function getRequiredEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

function getOptionalEnv(key: string, fallback: string): string {
  return process.env[key] || fallback
}

let cachedPublicConfig: PublicConfig | null = null

export function getConfig(): PublicConfig {
  if (cachedPublicConfig) return cachedPublicConfig

  cachedPublicConfig = {
    supabase: {
      url: getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
      anonKey: getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    },
    app: {
      url: getOptionalEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
    },
    admin: {
      emails: getOptionalEnv('ADMIN_EMAILS', '').split(',').map(e => e.trim()).filter(Boolean),
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

  cachedServerConfig = {
    ...publicConfig,
    supabase: {
      ...publicConfig.supabase,
      serviceRoleKey: getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    },
  }

  return cachedServerConfig
}
