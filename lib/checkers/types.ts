export interface CheckerResult {
  status: 'up' | 'down' | 'degraded'
  responseTimeMs?: number
  statusCode?: number
  errorMessage?: string
  metadata?: Record<string, unknown>
  configUpdates?: Partial<CheckerConfig>
  // When set, the check-runner uses this severity for the opened incident
  // instead of the monitor's statically-configured severity. Lets a checker
  // escalate a specific, business-critical failure mode (e.g. robots.txt
  // blocking Googlebot → P1) above the monitor's default severity.
  severityOverride?: 'P1' | 'P2' | 'P3' | 'P4'
}

export interface CheckerConfig {
  // HTTP
  method?: string
  headers?: Record<string, string>
  body?: string
  expectedStatus?: number
  // Keyword — legacy (single keyword)
  keyword?: string
  shouldExist?: boolean
  // Keyword — new (multiple keywords)
  positiveKeywords?: string[]
  negativeKeywords?: string[]
  // Port
  port?: number
  // API assertions
  assertions?: Array<{
    type: 'status' | 'body_contains' | 'response_time'
    value: string
  }>
  // Heartbeat
  expectedIntervalSeconds?: number
  // Response time thresholds
  thresholdMs?: number
  degradedMs?: number
  // Redirect chain
  maxRedirects?: number
  // Page size
  maxSizeKb?: number
  warnSizeKb?: number
  // Change-detection baselines (written back by check runner after each run)
  lastRobotsHash?: string
  lastIp?: string
  lastWhoisSnapshot?: string
  lastNameservers?: string[]
  // DNS change detection (existing)
  lastDnsRecords?: Record<string, unknown>
}
