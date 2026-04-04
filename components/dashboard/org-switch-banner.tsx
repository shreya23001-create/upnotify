'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface OrgSwitchBannerProps {
  currentOrgName: string
  originalOrgId: string
  originalOrgName: string
}

export function OrgSwitchBanner({ currentOrgName, originalOrgId, originalOrgName }: OrgSwitchBannerProps): React.ReactElement {
  const router = useRouter()
  const [switching, setSwitching] = useState(false)

  const handleSwitch = async (): Promise<void> => {
    setSwitching(true)
    try {
      const res = await fetch('/api/v1/org-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetOrgId: originalOrgId }),
      })
      if (res.ok) {
        router.refresh()
      }
    } catch {
      // ignore
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div className="org-switch-banner">
      <span>
        You are viewing <strong>{currentOrgName}</strong>.
      </span>
      <button
        className="btn btn-sm btn-primary"
        onClick={handleSwitch}
        disabled={switching}
        style={{ marginLeft: 12 }}
      >
        {switching ? 'Switching...' : `Switch back to ${originalOrgName}`}
      </button>
    </div>
  )
}
