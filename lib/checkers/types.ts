export interface CheckerResult {
  status: 'up' | 'down' | 'degraded'
  responseTimeMs?: number
  statusCode?: number
  errorMessage?: string
  metadata?: Record<string, unknown>
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
}
