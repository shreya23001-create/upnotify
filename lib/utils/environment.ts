export type Environment = 'development' | 'staging' | 'production'

export function getEnvironment(): Environment {
  const host =
    typeof window !== 'undefined'
      ? window.location.hostname
      : process.env.VERCEL_URL || 'localhost'

  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return 'development'
  }
  if (host.includes('.vercel.app')) {
    return 'staging'
  }
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
