import type { Monitor } from '@/lib/types'
import type { CheckerResult } from '@/lib/checkers/types'
import { logger } from '@/lib/utils/logger'

import { check as checkHttp } from '@/lib/checkers/http'
import { check as checkSsl } from '@/lib/checkers/ssl'
import { check as checkDns } from '@/lib/checkers/dns'
import { check as checkKeyword } from '@/lib/checkers/keyword'
import { check as checkDomain } from '@/lib/checkers/domain'
import { check as checkPort } from '@/lib/checkers/port'
import { check as checkPing } from '@/lib/checkers/ping'
import { check as checkApiEndpoint } from '@/lib/checkers/api-endpoint'
import { check as checkHeartbeat } from '@/lib/checkers/heartbeat'
import { check as checkCompetitor } from '@/lib/checkers/competitor'
import { check as checkSecurityHeaders } from '@/lib/checkers/security-headers'
import { check as checkResponseTime } from '@/lib/checkers/response-time'
import { check as checkRobotsTxt } from '@/lib/checkers/robots-txt'
import { check as checkIpChange } from '@/lib/checkers/ip-change'
import { check as checkMxHealth } from '@/lib/checkers/mx-health'
import { check as checkWhoisChange } from '@/lib/checkers/whois-change'
import { check as checkSitemap } from '@/lib/checkers/sitemap'
import { check as checkRedirectChain } from '@/lib/checkers/redirect-chain'
import { check as checkSpfDmarc } from '@/lib/checkers/spf-dmarc'
import { check as checkBlacklist } from '@/lib/checkers/blacklist'
import { check as checkPageSize } from '@/lib/checkers/page-size'
import { check as checkCookieConsent } from '@/lib/checkers/cookie-consent'
import { check as checkNameserverChange } from '@/lib/checkers/nameserver-change'

const checkerMap: Record<string, (monitor: Monitor) => Promise<CheckerResult>> = {
  http: checkHttp,
  ssl: checkSsl,
  dns: checkDns,
  keyword: checkKeyword,
  domain: checkDomain,
  port: checkPort,
  ping: checkPing,
  api: checkApiEndpoint,
  heartbeat: checkHeartbeat,
  competitor: checkCompetitor,
  'security-headers': checkSecurityHeaders,
  'response-time': checkResponseTime,
  'robots-txt': checkRobotsTxt,
  'ip-change': checkIpChange,
  'mx-health': checkMxHealth,
  'whois-change': checkWhoisChange,
  sitemap: checkSitemap,
  'redirect-chain': checkRedirectChain,
  'spf-dmarc': checkSpfDmarc,
  blacklist: checkBlacklist,
  'page-size': checkPageSize,
  'cookie-consent': checkCookieConsent,
  'nameserver-change': checkNameserverChange,
}

export async function dispatchChecker(monitor: Monitor): Promise<CheckerResult> {
  const checker = checkerMap[monitor.type]

  if (!checker) {
    logger.error('Unknown monitor type', { type: monitor.type, monitorId: monitor.id })
    return { status: 'down', errorMessage: `Unknown monitor type: ${monitor.type}` }
  }

  try {
    const result = await checker(monitor)
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Check failed unexpectedly'
    logger.error('Checker threw exception', {
      type: monitor.type,
      monitorId: monitor.id,
      error: message,
    })
    return { status: 'down', errorMessage: message }
  }
}

export type { CheckerResult }
