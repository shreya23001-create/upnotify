'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { CONSENT_CHANGED_EVENT } from '@/components/ui/cookie-consent'

// ---------------------------------------------------------------------------
// Paths where Clarity must never load
// ---------------------------------------------------------------------------

const EXCLUDED_PREFIXES = ['/admin']

function isExcludedPath(pathname: string): boolean {
  return EXCLUDED_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

// ---------------------------------------------------------------------------
// Cookie consent helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'Upnotify_cookie_consent'

interface CookiePreferences {
  essential: boolean
  analytics: boolean
  marketing: boolean
}

interface StoredConsent {
  preferences: CookiePreferences
  timestamp: string
  version: number
}

function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const stored: StoredConsent = JSON.parse(raw)
    return stored.preferences.analytics === true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CLARITY_ID = 'w90q9z3qit'

export function MicrosoftClarity(): React.ReactElement | null {
  const pathname = usePathname()
  const [consentGiven, setConsentGiven] = useState<boolean>(() => hasAnalyticsConsent())

  useEffect(() => {
    function handleConsentChanged(event: Event): void {
      const prefs = (event as CustomEvent<CookiePreferences>).detail
      setConsentGiven(prefs?.analytics === true)
    }

    window.addEventListener(CONSENT_CHANGED_EVENT, handleConsentChanged)
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, handleConsentChanged)
  }, [])

  if (isExcludedPath(pathname) || !consentGiven) return null

  return (
    <Script
      id="microsoft-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${CLARITY_ID}");
        `,
      }}
    />
  )
}
