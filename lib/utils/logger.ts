import { getEnvironment } from './environment'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

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

  if (level === 'debug' && environment !== 'development') {
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
