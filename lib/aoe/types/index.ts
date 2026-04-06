// =============================================================================
// AOE — Automated Outreach Engine
// Types — shared across all AOE modules
// =============================================================================

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

export type AoeCampaign =
  | 'ssl_expiry'
  | 'site_down'
  | 'site_slow'
  | 'ecom_down'
  | 'compete_cold'

export type AoePlatform = 'general' | 'shopify' | 'woocommerce'

export type AoeProduct = 'uptrue' | 'compete'

export type AoeEmailSource = 'whois' | 'rdap' | 'website_scrape' | 'pattern_guess'

// ---------------------------------------------------------------------------
// Site discovery
// ---------------------------------------------------------------------------

export type AoeSiteStatus =
  | 'pending_check'
  | 'checking'
  | 'ready'
  | 'emailed'
  | 'opted_out'
  | 'skip'

export type AoeSkipReason =
  | 'existing_user'
  | 'no_email'
  | 'opted_out'
  | 'no_issues'

export interface AoeSiteDiscovery {
  id: string
  domain: string
  platform: AoePlatform | null
  email: string | null
  email_source: AoeEmailSource | null
  discovered_at: string
  status: AoeSiteStatus
  check_count: number
  last_checked_at: string | null
  ready_at: string | null
  emailed_at: string | null
  skip_reason: AoeSkipReason | null
}

// ---------------------------------------------------------------------------
// Site checks
// ---------------------------------------------------------------------------

export interface AoeSiteCheck {
  id: string
  domain: string
  checked_at: string
  response_time_ms: number | null
  status_code: number | null
  is_down: boolean
  ssl_expiry_days: number | null
  error_message: string | null
  check_number: number
}

// Categorised result after 3 nights of checks
export type AoeSiteCategory =
  | 'down'       // was actually down during checks
  | 'slow'       // response time > threshold on 4+ checks
  | 'ssl_expiry' // SSL expiring within configured days
  | 'ecom_issue' // shopify/woocommerce specific issue
  | 'compete'    // no issues but ecommerce — Compete pitch
  | 'skip'       // no issues found, not worth emailing

export interface AoeSiteCheckSummary {
  domain: string
  platform: AoePlatform | null
  category: AoeSiteCategory
  downCount: number
  slowCount: number
  avgResponseMs: number
  sslExpiryDays: number | null
  worstResponseMs: number
}

// ---------------------------------------------------------------------------
// Outreach log
// ---------------------------------------------------------------------------

export type AoeQuotaStatus = 'active' | 'paused_85' | 'upgrade_required_95'

export type AoeConvertedPlan = 'free' | 'lite' | 'builder' | 'scale'

export interface AoeOutreachLog {
  id: string
  domain: string
  email_sent_to: string
  email_source: AoeEmailSource
  campaign: AoeCampaign
  platform: AoePlatform | null
  product: AoeProduct
  sent_at: string
  opened_at: string | null
  clicked_at: string | null
  bounced: boolean
  spam_complaint: boolean
  opted_out: boolean
  opted_out_at: string | null
  converted: boolean
  converted_at: string | null
  converted_plan: AoeConvertedPlan | null
  resend_message_id: string | null
  month: string
}

// ---------------------------------------------------------------------------
// Email quota
// ---------------------------------------------------------------------------

export interface AoeEmailQuota {
  id: string
  month: string
  total_quota: number
  reserved_alerts: number
  safety_buffer: number
  hard_reserve: number
  available_marketing: number
  monitors_with_email: number | null
  status_page_subs: number | null
  marketing_sent: number
  alert_sent: number
  burst_sent: number
  status: AoeQuotaStatus
  calculated_at: string | null
  updated_at: string
}

// Derived quota state for crons to read
export interface AoeQuotaState {
  availableForMarketing: number
  alreadySentMarketing: number
  remainingMarketing: number
  hardReserve: number
  status: AoeQuotaStatus
  isMarketingAllowed: boolean
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface AoeSettings {
  master_enabled: boolean
  campaign_ssl_expiry: boolean
  campaign_site_down: boolean
  campaign_ecom_down: boolean
  campaign_compete_cold: boolean
  last_day_burst_enabled: boolean
  daily_discovery_limit: number
  daily_email_limit: number
  cooldown_days: number
}

// ---------------------------------------------------------------------------
// Config types (from /lib/aoe/config.ts)
// ---------------------------------------------------------------------------

export interface AoeCampaignConfig {
  enabled: boolean
  ctaText: string
  ctaUrl: string
}

export interface AoeSslExpiryCampaignConfig extends AoeCampaignConfig {
  daysBeforeExpiry: number[]
}

export interface AoeEcomCampaignConfig extends AoeCampaignConfig {
  platforms: AoePlatform[]
}

export interface AoeConfig {
  product: {
    name: string
    tagline: string
    signupUrl: string
    logoUrl: string
    primaryColour: string
    companyName: string
    companyAddress: string
    unsubscribeUrl: string
  }
  campaigns: {
    ssl_expiry: AoeSslExpiryCampaignConfig
    site_down: AoeCampaignConfig
    site_slow: AoeCampaignConfig & { slowThresholdMs: number }
    ecom_down: AoeEcomCampaignConfig
    compete_cold: AoeEcomCampaignConfig
  }
  quota: {
    monthlyLimit: number
    alertThreshold: number
    pauseThreshold: number
    upgradeThreshold: number
    hardReservePercent: number
    alertBufferPercent: number
  }
  sending: {
    dailySendHour: number
    burstHour: number
    cooldownDays: number
    fromName: string
    fromEmail: string
  }
}

// ---------------------------------------------------------------------------
// Cron result shapes
// ---------------------------------------------------------------------------

export interface AoeQuotaManagerResult {
  month: string
  totalQuota: number
  reservedAlerts: number
  safetyBuffer: number
  hardReserve: number
  availableMarketing: number
  monitorsWithEmail: number
  statusPageSubs: number
  status: AoeQuotaStatus
  adminAlertSent: boolean
}
