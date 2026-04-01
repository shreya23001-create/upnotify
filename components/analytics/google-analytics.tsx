'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { getConfig } from '@/lib/utils/config'
import { isDevelopment } from '@/lib/utils/environment'
import { CONSENT_CHANGED_EVENT } from '@/components/ui/cookie-consent'

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */

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

/* Extend Window to include gtag */
declare global {
  interface Window {
    gtag: (command: string, ...args: unknown[]) => void
    dataLayer: unknown[]
  }
}

/* ──────────────────────────────────────────────
   Constants
   ────────────────────────────────────────────── */

const STORAGE_KEY = 'uptrue_cookie_consent'

/* ──────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────── */

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

/* ──────────────────────────────────────────────
   Component
   ────────────────────────────────────────────── */

export function GoogleAnalytics(): React.ReactElement | null {
  const [enabled, setEnabled] = useState<boolean>(() => hasAnalyticsConsent())
  const measurementId = getConfig().analytics.gaMeasurementId

  useEffect((): (() => void) => {
    /* Listen for consent changes from cookie banner */
    function handleConsentChanged(event: Event): void {
      const detail = (event as CustomEvent<CookiePreferences>).detail
      setEnabled(detail?.analytics === true)
    }

    window.addEventListener(CONSENT_CHANGED_EVENT, handleConsentChanged)

    return () => {
      window.removeEventListener(CONSENT_CHANGED_EVENT, handleConsentChanged)
    }
  }, [])

  /* If GA4 was disabled after being enabled, revoke consent via gtag */
  useEffect((): void => {
    if (!enabled && typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
      })
    }
  }, [enabled])

  /* Do not render if measurement ID is missing or consent not given */
  if (!measurementId || !enabled) return null

  const debugMode = isDevelopment()

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script
        id="ga4-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              analytics_storage: 'granted',
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
            });
            gtag('js', new Date());
            gtag('config', '${measurementId}'${debugMode ? ", { debug_mode: true }" : ''});
          `,
        }}
      />
    </>
  )
}
