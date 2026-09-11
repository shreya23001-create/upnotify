'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { getConfig } from '@/lib/utils/config'
import { CONSENT_CHANGED_EVENT } from '@/components/ui/cookie-consent'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

declare global {
  interface Window {
    dataLayer: unknown[]
  }
}

// ---------------------------------------------------------------------------
// Paths where GTM must never load
// ---------------------------------------------------------------------------

const EXCLUDED_PREFIXES = ['/admin', '/dashboard']

function isExcludedPath(pathname: string): boolean {
  return EXCLUDED_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

// ---------------------------------------------------------------------------
// Cookie consent helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'Upnotify_cookie_consent'

function getStoredConsent(): CookiePreferences | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const stored: StoredConsent = JSON.parse(raw)
    return stored.preferences
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GoogleTagManager(): React.ReactElement | null {
  const pathname = usePathname()
  const gtmId = getConfig().analytics.gtmId
  const [consentGiven, setConsentGiven] = useState<boolean>(() => {
    const stored = getStoredConsent()
    return stored?.analytics === true
  })

  // Listen for consent changes from the cookie banner
  useEffect(() => {
    function handleConsentChanged(event: Event): void {
      const prefs = (event as CustomEvent<CookiePreferences>).detail
      const analyticsAllowed = prefs?.analytics === true

      setConsentGiven(analyticsAllowed)

      // Push consent update to dataLayer so GTM consent mode picks it up
      if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({
          event: 'consent_update',
          analytics_storage: analyticsAllowed ? 'granted' : 'denied',
          ad_storage: prefs?.marketing ? 'granted' : 'denied',
        })
      }
    }

    window.addEventListener(CONSENT_CHANGED_EVENT, handleConsentChanged)
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, handleConsentChanged)
  }, [])

  // Nothing to render if: no GTM ID, excluded path, or no consent
  if (!gtmId || isExcludedPath(pathname) || !consentGiven) return null

  return (
    <>
      {/* GTM script — loads the container */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `,
        }}
      />

      {/* GTM noscript fallback */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>
    </>
  )
}
