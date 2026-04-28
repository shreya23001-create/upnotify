import { logger } from '@/lib/utils/logger'
import {
  getWpMonitorByToken,
  markWpMonitorVerified,
  updateWpMonitorLastPush,
  saveWpSnapshot,
  getLatestWpSnapshot,
  createWpFinding,
  getOpenWpFindingByType,
  getOpenWpFindingsByTypePrefix,
  resolveWpFinding,
  type WpPlugin,
  type WpUser,
  type WpPage,
  type WpFileScan,
} from '@/lib/db/wp-monitors'
import { updateMonitorStatus } from '@/lib/db/monitors'

interface SecurityConfig {
  login_failures_24h?: number
  world_writable_dirs?: string[]
  xmlrpc_enabled?: boolean
  rest_user_enum?: boolean
  app_passwords_in_use?: boolean
  auto_updates?: string
  spam_comments?: number
  twofa_active?: boolean
  modified_plugin_files?: string[]
  backup_plugin_present?: boolean
  disk_used_pct?: number | null
  disk_free_gb?: number | null
}

interface ForeignPage {
  id: number
  title: string
  slug: string
  lang: string
  detected_in: string
  url: string
}

interface PushPayload {
  site_url?: string
  wp_version?: string
  php_version?: string
  active_plugins?: WpPlugin[]
  inactive_plugins?: WpPlugin[]
  active_theme?: { name: string; version: string; update_available: boolean }
  admin_users?: WpUser[]
  recent_pages?: WpPage[]
  foreign_pages?: ForeignPage[]
  file_scan?: WpFileScan
  debug_mode?: boolean
  memory_limit?: string
  db_size_mb?: number
  cron_last_run?: string
  security_config?: SecurityConfig
  event?: string
}

const EOL_PHP_VERSIONS = ['5.6', '7.0', '7.1', '7.2', '7.3', '7.4', '8.0']

function isEolPhp(version: string | null | undefined): boolean {
  if (!version) return false
  return EOL_PHP_VERSIONS.some(v => version.startsWith(v))
}

function detectForeignLanguage(title: string): boolean {
  return (
    /[Ѐ-ӿ]/.test(title) || // Cyrillic
    /[一-鿿]/.test(title) || // CJK
    /[؀-ۿ]/.test(title) || // Arabic
    /[ऀ-ॿ]/.test(title) || // Devanagari
    /[฀-๿]/.test(title) || // Thai
    /[぀-ゟ゠-ヿ]/.test(title)  // Japanese
  )
}

function computeHealthScore(payload: PushPayload, fileScan: WpFileScan): number {
  let score = 100

  // Critical: executable/php files in uploads
  score -= (fileScan.php_in_uploads?.length ?? 0) * 30
  score -= (fileScan.suspicious_files?.length ?? 0) * 25

  // High: modified sensitive files
  if (fileScan.htaccess_modified) score -= 15
  if (fileScan.wpconfig_modified) score -= 15
  if ((fileScan.core_files_modified?.length ?? 0) > 0) score -= 20
  if ((fileScan.theme_files_modified?.length ?? 0) > 0) score -= 10

  // High: EOL PHP
  if (isEolPhp(payload.php_version)) score -= 15

  // High: debug mode on
  if (payload.debug_mode) score -= 10

  // Medium: outdated plugins
  const outdatedCount = (payload.active_plugins ?? []).filter(p => p.update_available).length
  score -= outdatedCount * 3

  // Medium: outdated theme
  if (payload.active_theme?.update_available) score -= 5

  // High: foreign language pages (potential SEO spam)
  const foreignPages = (payload.recent_pages ?? []).filter(p => p.language && p.language !== 'en')
  score -= foreignPages.length * 10

  // Security config deductions
  const sec = payload.security_config
  if (sec) {
    if ((sec.login_failures_24h ?? 0) > 20) score -= 10
    else if ((sec.login_failures_24h ?? 0) > 5) score -= 5

    score -= (sec.world_writable_dirs?.length ?? 0) * 10

    if (sec.xmlrpc_enabled) score -= 5
    if (sec.rest_user_enum) score -= 5
    if (sec.auto_updates === 'disabled') score -= 5

    if ((sec.spam_comments ?? 0) > 100) score -= 5
    else if ((sec.spam_comments ?? 0) > 20) score -= 2

    if (!sec.twofa_active) score -= 8
    if (!sec.backup_plugin_present) score -= 5

    const modFiles = sec.modified_plugin_files?.length ?? 0
    if (modFiles > 0) score -= Math.min(modFiles * 5, 15)

    if ((sec.disk_used_pct ?? 0) > 90) score -= 10
    else if ((sec.disk_used_pct ?? 0) > 80) score -= 5
  }

  return Math.max(0, Math.min(100, score))
}

export async function POST(request: Request): Promise<Response> {
  const authHeader = request.headers.get('Authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''

  if (!token) {
    return Response.json({ error: 'Missing token' }, { status: 401 })
  }

  const wpMonitor = await getWpMonitorByToken(token)
  if (!wpMonitor) {
    return Response.json({ error: 'Invalid token' }, { status: 401 })
  }

  let payload: PushPayload
  try {
    payload = await request.json() as PushPayload
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Handle plugin deactivation event
  if (payload.event === 'plugin_deactivated') {
    logger.info('WP plugin deactivated', { wpMonitorId: wpMonitor.id, siteUrl: wpMonitor.site_url })
    return Response.json({ ok: true })
  }

  const fileScan: WpFileScan = {
    php_in_uploads: payload.file_scan?.php_in_uploads ?? [],
    js_in_uploads: payload.file_scan?.js_in_uploads ?? [],
    htaccess_modified: payload.file_scan?.htaccess_modified ?? false,
    wpconfig_modified: payload.file_scan?.wpconfig_modified ?? false,
    suspicious_files: payload.file_scan?.suspicious_files ?? [],
    core_files_modified: payload.file_scan?.core_files_modified ?? [],
    theme_files_modified: payload.file_scan?.theme_files_modified ?? [],
  }

  const healthScore = computeHealthScore(payload, fileScan)

  // Save snapshot
  const snapshot = await saveWpSnapshot({
    wp_monitor_id: wpMonitor.id,
    org_id: wpMonitor.org_id,
    wp_version: payload.wp_version,
    php_version: payload.php_version,
    active_plugins: payload.active_plugins as unknown[],
    inactive_plugins: payload.inactive_plugins as unknown[],
    active_theme: payload.active_theme as unknown,
    admin_users: payload.admin_users as unknown[],
    recent_pages: payload.recent_pages as unknown[],
    file_scan: fileScan as unknown,
    debug_mode: payload.debug_mode,
    memory_limit: payload.memory_limit,
    db_size_mb: payload.db_size_mb,
    cron_last_run: payload.cron_last_run,
    health_score: healthScore,
    raw_data: payload as unknown,
  })

  // Mark verified on first push
  if (!wpMonitor.token_verified) {
    await markWpMonitorVerified(wpMonitor.id)
  } else {
    await updateWpMonitorLastPush(wpMonitor.id)
  }

  // A successful push proves the site is reachable — always 'up'.
  // Health score drives the security panel, not the uptime status.
  // Staleness (no push received) is handled separately by the check-runner cron.
  await updateMonitorStatus(wpMonitor.monitor_id, {
    status: 'up',
    last_checked_at: new Date().toISOString(),
    next_check_at: new Date(Date.now() + wpMonitor.check_interval_minutes * 60 * 1000).toISOString(),
  })

  // Diff against previous snapshot to create/resolve findings
  const prevSnapshot = await getLatestWpSnapshot(wpMonitor.id)
  const snapshotId = snapshot?.id

  // PHP files in uploads
  for (const file of fileScan.php_in_uploads) {
    const existing = await getOpenWpFindingByType(wpMonitor.id, `php_in_uploads:${file}`)
    if (!existing) {
      await createWpFinding({
        wp_monitor_id: wpMonitor.id,
        org_id: wpMonitor.org_id,
        snapshot_id: snapshotId,
        finding_type: `php_in_uploads:${file}`,
        severity: 'critical',
        title: `PHP file found in /uploads/: ${file}`,
        detail: { file, location: 'uploads' },
      })
    }
  }

  // Resolve cleared PHP file findings
  if (prevSnapshot) {
    const prevPhpFiles = (prevSnapshot.file_scan as WpFileScan)?.php_in_uploads ?? []
    for (const file of prevPhpFiles) {
      if (!fileScan.php_in_uploads.includes(file)) {
        const existing = await getOpenWpFindingByType(wpMonitor.id, `php_in_uploads:${file}`)
        if (existing) await resolveWpFinding(existing.id)
      }
    }
  }

  // Suspicious/executable files in uploads
  for (const file of fileScan.suspicious_files) {
    const existing = await getOpenWpFindingByType(wpMonitor.id, `exec_in_uploads:${file}`)
    if (!existing) {
      await createWpFinding({
        wp_monitor_id: wpMonitor.id,
        org_id: wpMonitor.org_id,
        snapshot_id: snapshotId,
        finding_type: `exec_in_uploads:${file}`,
        severity: 'critical',
        title: `Executable file found in /uploads/: ${file}`,
        detail: { file, location: 'uploads' },
      })
    }
  }

  // htaccess modified
  if (fileScan.htaccess_modified) {
    const existing = await getOpenWpFindingByType(wpMonitor.id, 'htaccess_modified')
    if (!existing) {
      await createWpFinding({
        wp_monitor_id: wpMonitor.id,
        org_id: wpMonitor.org_id,
        snapshot_id: snapshotId,
        finding_type: 'htaccess_modified',
        severity: 'high',
        title: '.htaccess file has been modified',
        detail: {},
      })
    }
  } else {
    const existing = await getOpenWpFindingByType(wpMonitor.id, 'htaccess_modified')
    if (existing) await resolveWpFinding(existing.id)
  }

  // wp-config.php modified
  if (fileScan.wpconfig_modified) {
    const existing = await getOpenWpFindingByType(wpMonitor.id, 'wpconfig_modified')
    if (!existing) {
      await createWpFinding({
        wp_monitor_id: wpMonitor.id,
        org_id: wpMonitor.org_id,
        snapshot_id: snapshotId,
        finding_type: 'wpconfig_modified',
        severity: 'high',
        title: 'wp-config.php has been modified',
        detail: {},
      })
    }
  } else {
    const existing = await getOpenWpFindingByType(wpMonitor.id, 'wpconfig_modified')
    if (existing) await resolveWpFinding(existing.id)
  }

  // New admin users (compare by user ID against previous snapshot)
  if (prevSnapshot) {
    const prevAdminIds = new Set((prevSnapshot.admin_users as WpUser[]).map(u => u.id))
    const newAdmins = (payload.admin_users ?? []).filter(u => !prevAdminIds.has(u.id))
    for (const user of newAdmins) {
      await createWpFinding({
        wp_monitor_id: wpMonitor.id,
        org_id: wpMonitor.org_id,
        snapshot_id: snapshotId,
        finding_type: `new_admin_user:${user.id}`,
        severity: 'high',
        title: `New admin/editor user created: ${user.login}`,
        detail: { user_id: user.id, login: user.login, roles: user.roles },
      })
    }
  }

  // EOL PHP version
  if (isEolPhp(payload.php_version)) {
    const existing = await getOpenWpFindingByType(wpMonitor.id, 'eol_php')
    if (!existing) {
      await createWpFinding({
        wp_monitor_id: wpMonitor.id,
        org_id: wpMonitor.org_id,
        snapshot_id: snapshotId,
        finding_type: 'eol_php',
        severity: 'high',
        title: `PHP version ${payload.php_version} is end-of-life`,
        detail: { version: payload.php_version },
      })
    }
  } else {
    const existing = await getOpenWpFindingByType(wpMonitor.id, 'eol_php')
    if (existing) await resolveWpFinding(existing.id)
  }

  // Debug mode on
  if (payload.debug_mode) {
    const existing = await getOpenWpFindingByType(wpMonitor.id, 'debug_mode_on')
    if (!existing) {
      await createWpFinding({
        wp_monitor_id: wpMonitor.id,
        org_id: wpMonitor.org_id,
        snapshot_id: snapshotId,
        finding_type: 'debug_mode_on',
        severity: 'medium',
        title: 'WP_DEBUG is enabled in production',
        detail: {},
      })
    }
  } else {
    const existing = await getOpenWpFindingByType(wpMonitor.id, 'debug_mode_on')
    if (existing) await resolveWpFinding(existing.id)
  }

  // Foreign language injection — scans ALL published pages (title + slug + content snippet)
  const foreignPages = payload.foreign_pages ?? []
  const currentForeignIds = new Set(foreignPages.map(p => p.id))
  for (const page of foreignPages) {
    const findingType = `foreign_page:${page.id}`
    const existing = await getOpenWpFindingByType(wpMonitor.id, findingType)
    if (!existing) {
      const langLabels: Record<string, string> = { zh: 'Chinese', ru: 'Russian', ar: 'Arabic', hi: 'Hindi', ja: 'Japanese', th: 'Thai' }
      const langLabel = langLabels[page.lang] ?? page.lang.toUpperCase()
      await createWpFinding({
        wp_monitor_id: wpMonitor.id,
        org_id: wpMonitor.org_id,
        snapshot_id: snapshotId,
        finding_type: findingType,
        severity: 'high',
        title: `${langLabel} content injected in ${page.detected_in}: "${page.title}"`,
        detail: { page_id: page.id, title: page.title, slug: page.slug, lang: page.lang, detected_in: page.detected_in, url: page.url },
      })
    }
  }
  // Resolve findings for pages that no longer contain foreign content
  const openForeignFindings = await getOpenWpFindingsByTypePrefix(wpMonitor.id, 'foreign_page:')
  for (const finding of openForeignFindings) {
    const pageId = parseInt(finding.finding_type.replace('foreign_page:', ''), 10)
    if (!currentForeignIds.has(pageId)) {
      await resolveWpFinding(finding.id)
    }
  }

  // Outdated plugins (create once, resolve when updated)
  for (const plugin of payload.active_plugins ?? []) {
    const findingType = `outdated_plugin:${plugin.slug}`
    if (plugin.update_available) {
      const existing = await getOpenWpFindingByType(wpMonitor.id, findingType)
      if (!existing) {
        await createWpFinding({
          wp_monitor_id: wpMonitor.id,
          org_id: wpMonitor.org_id,
          snapshot_id: snapshotId,
          finding_type: findingType,
          severity: 'medium',
          title: `Plugin update available: ${plugin.name} (${plugin.version} → ${plugin.new_version ?? 'latest'})`,
          detail: { name: plugin.name, slug: plugin.slug, current: plugin.version, latest: plugin.new_version },
        })
      }
    } else {
      const existing = await getOpenWpFindingByType(wpMonitor.id, findingType)
      if (existing) await resolveWpFinding(existing.id)
    }
  }

  // Security config findings
  const sec = payload.security_config
  if (sec) {
    // Brute force / login failures
    if ((sec.login_failures_24h ?? 0) > 5) {
      const existing = await getOpenWpFindingByType(wpMonitor.id, 'brute_force')
      if (!existing) {
        await createWpFinding({
          wp_monitor_id: wpMonitor.id,
          org_id: wpMonitor.org_id,
          snapshot_id: snapshotId,
          finding_type: 'brute_force',
          severity: (sec.login_failures_24h ?? 0) > 20 ? 'critical' : 'high',
          title: `Brute force detected: ${sec.login_failures_24h} failed login attempts in 24h`,
          detail: { count: sec.login_failures_24h },
        })
      }
    } else {
      const existing = await getOpenWpFindingByType(wpMonitor.id, 'brute_force')
      if (existing) await resolveWpFinding(existing.id)
    }

    // World-writable directories
    for (const dir of (sec.world_writable_dirs ?? [])) {
      const existing = await getOpenWpFindingByType(wpMonitor.id, `world_writable:${dir}`)
      if (!existing) {
        await createWpFinding({
          wp_monitor_id: wpMonitor.id,
          org_id: wpMonitor.org_id,
          snapshot_id: snapshotId,
          finding_type: `world_writable:${dir}`,
          severity: 'high',
          title: `World-writable directory detected: ${dir}`,
          detail: { directory: dir },
        })
      }
    }

    // XML-RPC
    if (sec.xmlrpc_enabled) {
      const existing = await getOpenWpFindingByType(wpMonitor.id, 'xmlrpc_enabled')
      if (!existing) {
        await createWpFinding({
          wp_monitor_id: wpMonitor.id,
          org_id: wpMonitor.org_id,
          snapshot_id: snapshotId,
          finding_type: 'xmlrpc_enabled',
          severity: 'medium',
          title: 'XML-RPC is enabled — can be exploited for brute-force and DDoS amplification attacks',
          detail: {},
        })
      }
    } else {
      const existing = await getOpenWpFindingByType(wpMonitor.id, 'xmlrpc_enabled')
      if (existing) await resolveWpFinding(existing.id)
    }

    // REST API user enumeration
    if (sec.rest_user_enum) {
      const existing = await getOpenWpFindingByType(wpMonitor.id, 'rest_user_enum')
      if (!existing) {
        await createWpFinding({
          wp_monitor_id: wpMonitor.id,
          org_id: wpMonitor.org_id,
          snapshot_id: snapshotId,
          finding_type: 'rest_user_enum',
          severity: 'medium',
          title: 'REST API exposes username list at /wp-json/wp/v2/users — install a security plugin to restrict this',
          detail: {},
        })
      }
    } else {
      const existing = await getOpenWpFindingByType(wpMonitor.id, 'rest_user_enum')
      if (existing) await resolveWpFinding(existing.id)
    }

    // Auto-updates disabled
    if (sec.auto_updates === 'disabled') {
      const existing = await getOpenWpFindingByType(wpMonitor.id, 'auto_updates_disabled')
      if (!existing) {
        await createWpFinding({
          wp_monitor_id: wpMonitor.id,
          org_id: wpMonitor.org_id,
          snapshot_id: snapshotId,
          finding_type: 'auto_updates_disabled',
          severity: 'high',
          title: 'WordPress automatic updates are disabled — site will not receive security patches automatically',
          detail: { setting: sec.auto_updates },
        })
      }
    } else {
      const existing = await getOpenWpFindingByType(wpMonitor.id, 'auto_updates_disabled')
      if (existing) await resolveWpFinding(existing.id)
    }

    // High spam volume
    if ((sec.spam_comments ?? 0) > 50) {
      const existing = await getOpenWpFindingByType(wpMonitor.id, 'high_spam')
      if (!existing) {
        await createWpFinding({
          wp_monitor_id: wpMonitor.id,
          org_id: wpMonitor.org_id,
          snapshot_id: snapshotId,
          finding_type: 'high_spam',
          severity: 'medium',
          title: `High spam comment volume: ${sec.spam_comments} spam comments queued`,
          detail: { count: sec.spam_comments },
        })
      }
    } else {
      const existing = await getOpenWpFindingByType(wpMonitor.id, 'high_spam')
      if (existing) await resolveWpFinding(existing.id)
    }

    // No 2FA
    if (!sec.twofa_active) {
      const existing = await getOpenWpFindingByType(wpMonitor.id, 'no_twofa')
      if (!existing) {
        await createWpFinding({
          wp_monitor_id: wpMonitor.id,
          org_id: wpMonitor.org_id,
          snapshot_id: snapshotId,
          finding_type: 'no_twofa',
          severity: 'high',
          title: 'No two-factor authentication plugin detected — admin accounts are vulnerable to credential theft',
          detail: {},
        })
      }
    } else {
      const existing = await getOpenWpFindingByType(wpMonitor.id, 'no_twofa')
      if (existing) await resolveWpFinding(existing.id)
    }

    // Recently modified plugin files
    for (const file of (sec.modified_plugin_files ?? [])) {
      const existing = await getOpenWpFindingByType(wpMonitor.id, `modified_plugin:${file}`)
      if (!existing) {
        await createWpFinding({
          wp_monitor_id: wpMonitor.id,
          org_id: wpMonitor.org_id,
          snapshot_id: snapshotId,
          finding_type: `modified_plugin:${file}`,
          severity: 'high',
          title: `Plugin file modified in last 24h: ${file}`,
          detail: { file },
        })
      }
    }

    // No backup plugin
    if (!sec.backup_plugin_present) {
      const existing = await getOpenWpFindingByType(wpMonitor.id, 'no_backup_plugin')
      if (!existing) {
        await createWpFinding({
          wp_monitor_id: wpMonitor.id,
          org_id: wpMonitor.org_id,
          snapshot_id: snapshotId,
          finding_type: 'no_backup_plugin',
          severity: 'medium',
          title: 'No backup plugin detected — site has no automated backup protection',
          detail: {},
        })
      }
    } else {
      const existing = await getOpenWpFindingByType(wpMonitor.id, 'no_backup_plugin')
      if (existing) await resolveWpFinding(existing.id)
    }

    // High disk usage
    if ((sec.disk_used_pct ?? 0) > 80) {
      const existing = await getOpenWpFindingByType(wpMonitor.id, 'high_disk_usage')
      if (!existing) {
        await createWpFinding({
          wp_monitor_id: wpMonitor.id,
          org_id: wpMonitor.org_id,
          snapshot_id: snapshotId,
          finding_type: 'high_disk_usage',
          severity: (sec.disk_used_pct ?? 0) > 90 ? 'high' : 'medium',
          title: `Disk usage is at ${sec.disk_used_pct}%${sec.disk_free_gb != null ? ` — ${sec.disk_free_gb} GB free` : ''}`,
          detail: { used_pct: sec.disk_used_pct, free_gb: sec.disk_free_gb },
        })
      }
    } else {
      const existing = await getOpenWpFindingByType(wpMonitor.id, 'high_disk_usage')
      if (existing) await resolveWpFinding(existing.id)
    }
  }

  logger.info('WP push processed', {
    wpMonitorId: wpMonitor.id,
    healthScore,
    snapshotId,
  })

  return Response.json({ ok: true, health_score: healthScore })
}
