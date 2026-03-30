import * as net from 'net'
import type { Monitor } from '@/lib/types'
import type { CheckerResult, CheckerConfig } from './types'

export async function check(monitor: Monitor): Promise<CheckerResult> {
  const config = monitor.config as CheckerConfig
  const [host, defaultPort] = monitor.target.split(':')
  const port = config.port || (defaultPort ? parseInt(defaultPort, 10) : 80)
  const start = Date.now()

  return new Promise<CheckerResult>((resolve) => {
    const socket = new net.Socket()

    socket.setTimeout(monitor.timeout_ms)

    socket.connect(port, host, () => {
      const responseTimeMs = Date.now() - start
      socket.destroy()
      resolve({ status: 'up', responseTimeMs, metadata: { host, port } })
    })

    socket.on('error', (err) => {
      socket.destroy()
      resolve({
        status: 'down',
        responseTimeMs: Date.now() - start,
        errorMessage: err.message,
        metadata: { host, port },
      })
    })

    socket.on('timeout', () => {
      socket.destroy()
      resolve({
        status: 'down',
        responseTimeMs: Date.now() - start,
        errorMessage: 'Connection timeout',
        metadata: { host, port },
      })
    })
  })
}
