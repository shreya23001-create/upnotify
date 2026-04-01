/**
 * Client-side analytics event tracking.
 * Wraps Google Analytics 4 gtag() with type-safe event names.
 *
 * IMPORTANT: This module is client-only. Never import on the server.
 * All calls are no-ops if gtag is not loaded (graceful degradation).
 */

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */

/** Standard Uptrue analytics events */
export type AnalyticsEvent =
  | 'signup'
  | 'login'
  | 'monitor_created'
  | 'monitor_deleted'
  | 'alert_configured'
  | 'status_page_created'
  | 'status_page_viewed'
  | 'plan_upgraded'
  | 'plan_downgraded'
  | 'report_generated'
  | 'client_added'
  | 'team_member_invited'
  | 'api_key_created'

export type EventParams = Record<string, string | number | boolean>

/* ──────────────────────────────────────────────
   Core
   ────────────────────────────────────────────── */

function isGtagAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function'
}

/**
 * Track a custom event in GA4.
 * No-op if gtag is not loaded or if called on the server.
 */
export function trackEvent(eventName: AnalyticsEvent, params?: EventParams): void {
  if (!isGtagAvailable()) return
  window.gtag('event', eventName, params ?? {})
}

/**
 * Track a page view manually.
 * Normally GA4 handles this automatically, but use this for
 * client-side route changes if needed.
 */
export function trackPageView(path: string, title?: string): void {
  if (!isGtagAvailable()) return
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title ?? document.title,
  })
}
