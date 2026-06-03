import { getEnvironment } from './environment'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// LOG_LEVEL is infrastructure (controls Vercel Observability event volume),
// not feature config — read directly like environment.ts does for VERCEL_ENV.
function getMinLevel(): LogLevel {
  const raw = process.env.LOG_LEVEL
  if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') {
    return raw
  }
  return getEnvironment() === 'development' ? 'debug' : 'info'
}

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  environment: string
  data?: Record<string, unknown>
}

function formatEntry(entry: LogEntry): string {
  const env = entry.environment
  if (env === 'development') {
    const prefix = `[${entry.level.toUpperCase()}]`
    const base = `${entry.timestamp} ${prefix} ${entry.message}`
    return entry.data ? `${base} ${JSON.stringify(entry.data, null, 2)}` : base
  }
  return JSON.stringify(entry)
}

function log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
  const environment = getEnvironment()

  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[getMinLevel()]) {
    return
  }

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    environment,
    ...(data && { data }),
  }

  const formatted = formatEntry(entry)

  switch (level) {
    case 'debug':
    case 'info':
      console.info(formatted)
      break
    case 'warn':
      console.warn(formatted)
      break
    case 'error':
      console.error(formatted)
      break
  }
}

export const logger = {
  debug(message: string, data?: Record<string, unknown>): void {
    log('debug', message, data)
  },
  info(message: string, data?: Record<string, unknown>): void {
    log('info', message, data)
  },
  warn(message: string, data?: Record<string, unknown>): void {
    log('warn', message, data)
  },
  error(message: string, data?: Record<string, unknown>): void {
    log('error', message, data)
  },
}
