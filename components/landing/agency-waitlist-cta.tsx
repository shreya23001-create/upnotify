'use client'

import { useState } from 'react'
import { AgencyWaitlistPopup } from './agency-waitlist-popup'

export function AgencyWaitlistCta(): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        className="btn btn-primary btn-lg"
        onClick={() => setIsOpen(true)}
      >
        Join the Waitlist for Early Access
      </button>
      <AgencyWaitlistPopup isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
