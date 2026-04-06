export type Environment = 'development' | 'staging' | 'production'

export function getEnvironment(): Environment {
  // NEXT_PUBLIC_VERCEL_ENV is set by Vercel on both server and client —
  // no window check needed, no hydration mismatch.
  // Values: 'production' | 'preview' | 'development'
  // Locally it is undefined, so we fall back to 'development'.
  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV

  if (!vercelEnv || vercelEnv === 'development') return 'development'
  if (vercelEnv === 'preview') return 'staging'
  return 'production'
}

export function isDevelopment(): boolean {
  return getEnvironment() === 'development'
}

export function isStaging(): boolean {
  return getEnvironment() === 'staging'
}

export function isProduction(): boolean {
  return getEnvironment() === 'production'
}
