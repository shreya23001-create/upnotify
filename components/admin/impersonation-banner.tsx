'use client'

import { useCallback, useState } from 'react'

interface ImpersonationBannerProps {
  userEmail: string
}

export function ImpersonationBanner({ userEmail }: ImpersonationBannerProps): React.ReactElement {
  const [isExiting, setIsExiting] = useState(false)

  const handleExit = useCallback(async (): Promise<void> => {
    setIsExiting(true)
    try {
      const response = await fetch('/api/v1/admin/impersonate', { method: 'DELETE' })
      if (response.ok) {
        window.location.href = '/admin'
      }
    } catch {
      setIsExiting(false)
    }
  }, [])

  return (
    <div className="impersonation-banner">
      <span className="impersonation-banner-text">
        You are viewing as <strong>{userEmail}</strong> &mdash; all actions are read-only
      </span>
      <button
        className="impersonation-banner-exit"
        onClick={handleExit}
        disabled={isExiting}
      >
        {isExiting ? 'Exiting...' : 'Exit Impersonation'}
      </button>
    </div>
  )
}
