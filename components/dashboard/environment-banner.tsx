'use client'

import { getEnvironment } from '@/lib/utils/environment'

export function EnvironmentBanner() {
  const env = getEnvironment()
  if (env === 'production') return null
  const label = env === 'development' ? 'Development Environment' : 'Staging Environment'
  return <div className="env-banner">{label}</div>
}
