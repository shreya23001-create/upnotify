'use client'

import { getEnvironment } from '@/lib/utils/environment'

export function EnvironmentBanner() {
  const env = getEnvironment()

  if (env === 'production') return null

  const label = env === 'development' ? 'Development Environment' : 'Staging Environment'

  return (
    <div className="bg-yellow-100 px-4 py-1.5 text-center text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
      {label}
    </div>
  )
}
