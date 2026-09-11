'use client'

import { useState, useEffect, useCallback } from 'react'

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

/* ──────────────────────────────────────────────
   Constants
   ────────────────────────────────────────────── */

const STORAGE_KEY = 'Upnotify_cookie_consent'
const CONSENT_VERSION = 1
const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000

/* Global event name for re-opening the preferences modal */
const REOPEN_EVENT = 'Upnotify:cookie-preferences'

/* Dispatched whenever consent preferences are saved */
export const CONSENT_CHANGED_EVENT = 'Upnotify:consent-changed'

/* ──────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────── */

function getStoredConsent(): StoredConsent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: StoredConsent = JSON.parse(raw)
    /* Expire after 6 months */
    const age = Date.now() - new Date(parsed.timestamp).getTime()
    if (age > SIX_MONTHS_MS) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function saveConsent(preferences: CookiePreferences): void {
  const consent: StoredConsent = {
    preferences,
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: preferences }))
}

/**
 * Call this from anywhere to re-open the cookie preferences modal.
 * Works via a custom DOM event so the component does not need to be
 * imported as a dependency.
 *
 * Usage:  import { openCookiePreferences } from '@/components/ui/cookie-consent'
 *         openCookiePreferences()
 */
export function openCookiePreferences(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(REOPEN_EVENT))
  }
}

/* ──────────────────────────────────────────────
   Component
   ────────────────────────────────────────────── */

export function CookieConsent(): React.ReactElement | null {
  const [visible, setVisible] = useState<boolean>(false)
  const [showPrefs, setShowPrefs] = useState<boolean>(false)
  const [analytics, setAnalytics] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const stored = getStoredConsent()
    return stored?.preferences.analytics ?? false
  })
  const [marketing, setMarketing] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const stored = getStoredConsent()
    return stored?.preferences.marketing ?? false
  })

  /* Show banner if no valid consent stored */
  useEffect((): (() => void) => {
    const stored = getStoredConsent()
    if (!stored) {
      /* Small delay so the page paints before the banner animates in */
      const timer = setTimeout(() => setVisible(true), 600)
      return () => clearTimeout(timer)
    }
    return () => { }
  }, [])

  /* Listen for re-open event */
  useEffect((): (() => void) => {
    function handleReopen(): void {
      const stored = getStoredConsent()
      if (stored) {
        setAnalytics(stored.preferences.analytics)
        setMarketing(stored.preferences.marketing)
      }
      setShowPrefs(true)
      setVisible(true)
    }
    window.addEventListener(REOPEN_EVENT, handleReopen)
    return () => window.removeEventListener(REOPEN_EVENT, handleReopen)
  }, [])

  const accept = useCallback((): void => {
    saveConsent({ essential: true, analytics: true, marketing: true })
    setVisible(false)
    setShowPrefs(false)
  }, [])

  const reject = useCallback((): void => {
    saveConsent({ essential: true, analytics: false, marketing: false })
    setVisible(false)
    setShowPrefs(false)
  }, [])

  const savePreferences = useCallback((): void => {
    saveConsent({ essential: true, analytics, marketing })
    setVisible(false)
    setShowPrefs(false)
  }, [analytics, marketing])

  if (!visible) return null

  return (
    <>
      {/* Backdrop when preferences modal is open */}
      {showPrefs && (
        <div
          className="cc-backdrop"
          onClick={() => setShowPrefs(false)}
          role="presentation"
        />
      )}

      {/* Preferences modal */}
      {showPrefs && (
        <div className="cc-modal" role="dialog" aria-label="Cookie preferences">
          <div className="cc-modal-header">
            <h3 className="cc-modal-title">Cookie Preferences</h3>
            <button
              className="cc-modal-close"
              onClick={() => setShowPrefs(false)}
              aria-label="Close preferences"
            >
              &times;
            </button>
          </div>

          <p className="cc-modal-desc">
            Choose which cookies you allow. Essential cookies are always active
            because they are required for the site to function.{' '}
            <a href="/cookies" className="cc-link">Learn more</a>
          </p>

          <div className="cc-pref-list">
            {/* Essential — always on */}
            <label className="cc-pref-row">
              <div className="cc-pref-info">
                <span className="cc-pref-name">Essential</span>
                <span className="cc-pref-desc">
                  Required for login, security, and core functionality.
                </span>
              </div>
              <input
                type="checkbox"
                className="cc-toggle"
                checked
                disabled
                aria-label="Essential cookies (always enabled)"
              />
            </label>

            {/* Analytics */}
            <label className="cc-pref-row">
              <div className="cc-pref-info">
                <span className="cc-pref-name">Analytics</span>
                <span className="cc-pref-desc">
                  Help us understand how visitors interact with the site.
                </span>
              </div>
              <input
                type="checkbox"
                className="cc-toggle"
                checked={analytics}
                onChange={() => setAnalytics(prev => !prev)}
                aria-label="Analytics cookies"
              />
            </label>

            {/* Marketing */}
            <label className="cc-pref-row">
              <div className="cc-pref-info">
                <span className="cc-pref-name">Marketing</span>
                <span className="cc-pref-desc">
                  Used to deliver relevant ads and measure campaign performance.
                </span>
              </div>
              <input
                type="checkbox"
                className="cc-toggle"
                checked={marketing}
                onChange={() => setMarketing(prev => !prev)}
                aria-label="Marketing cookies"
              />
            </label>
          </div>

          <div className="cc-modal-actions">
            <button className="btn btn-secondary btn-sm" onClick={reject}>
              Reject Non-Essential
            </button>
            <button className="btn btn-primary btn-sm" onClick={savePreferences}>
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* Banner */}
      <div className="cc-banner" role="banner" aria-label="Cookie consent">
        <div className="cc-banner-content">
          <p className="cc-banner-text">
            We use cookies to improve your experience. Essential cookies keep the
            site working. Analytics and marketing cookies are optional.{' '}
            <a href="/cookies" className="cc-link">Cookie Policy</a>
          </p>
          <div className="cc-banner-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setShowPrefs(true)}>
              Manage Preferences
            </button>
            <button className="btn btn-secondary btn-sm" onClick={reject}>
              Reject Non-Essential
            </button>
            <button className="btn btn-primary btn-sm" onClick={accept}>
              Accept All
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
