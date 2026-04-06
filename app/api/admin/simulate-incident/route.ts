import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerConfig } from '@/lib/utils/config'
import { getMonitorById } from '@/lib/db/monitors'
import { createIncident, resolveIncident } from '@/lib/db/incidents'
import { dispatchAlerts } from '@/lib/services/alert-dispatcher'
import { writeAuditLog } from '@/lib/db/audit'
import { logger } from '@/lib/utils/logger'

/**
 * POST /api/admin/simulate-incident
 *
 * Admin-only endpoint to simulate a monitor going down and/or recovering.
 * Creates a real incident, fires real alerts, then optionally auto-resolves.
 *
 * Body:
 *   monitorId   — the monitor to simulate against
 *   action      — 'down' | 'recover' | 'both' (default: 'both')
 *   resolveAfterMs — delay before auto-resolve when action='both' (default: 5000)
 *
 * Dev/staging only — blocked in production unless ALLOW_SIMULATION=true.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const config = getServerConfig()

    // Verify admin auth
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'Unauthorised' }, { status: 401 })
    }
    const adminEmails = config.admin.emails.map((e: string) => e.toLowerCase())
    if (!adminEmails.includes((user.email ?? '').toLowerCase())) {
      return Response.json({ error: 'Super admin only' }, { status: 403 })
    }

    // Block in production unless explicitly enabled
    const isProduction = (process.env.VERCEL_ENV ?? '') === 'production'
    const simulationAllowed = process.env.ALLOW_SIMULATION === 'true'
    if (isProduction && !simulationAllowed) {
      return Response.json(
        { error: 'Simulation disabled in production. Set ALLOW_SIMULATION=true to enable.' },
        { status: 403 }
      )
    }

    const body: unknown = await request.json()
    const { monitorId, action = 'both', resolveAfterMs = 5000 } = body as {
      monitorId?: string
      action?: string
      resolveAfterMs?: number
    }

    if (!monitorId || typeof monitorId !== 'string') {
      return Response.json({ error: 'monitorId is required' }, { status: 400 })
    }
    if (!['down', 'recover', 'both'].includes(action)) {
      return Response.json({ error: 'action must be "down", "recover", or "both"' }, { status: 400 })
    }

    const monitor = await getMonitorById(monitorId)
    if (!monitor) {
      return Response.json({ error: 'Monitor not found' }, { status: 404 })
    }

    const result: { incident?: unknown; resolved?: boolean } = {}

    if (action === 'down' || action === 'both') {
      // Create simulated incident
      const incident = await createIncident({
        org_id: monitor.org_id,
        workspace_id: monitor.workspace_id,
        monitor_id: monitor.id,
        title: `[SIMULATED] ${monitor.name} is down`,
        severity: 'high',
      })

      if (!incident) {
        return Response.json({ error: 'Failed to create simulated incident' }, { status: 500 })
      }

      result.incident = incident

      // Fire real alerts
      await dispatchAlerts(incident, monitor)

      await writeAuditLog({
        orgId: monitor.org_id,
        userId: user.id,
        action: 'simulate.incident_created',
        resourceType: 'monitor',
        resourceId: monitor.id,
        metadata: { incidentId: incident.id, action },
      })

      // Auto-resolve after delay when action='both'
      if (action === 'both') {
        await new Promise((resolve) => setTimeout(resolve, Math.min(resolveAfterMs, 30000)))
        await resolveIncident(monitor.id)
        result.resolved = true

        await writeAuditLog({
          orgId: monitor.org_id,
          userId: user.id,
          action: 'simulate.incident_resolved',
          resourceType: 'monitor',
          resourceId: monitor.id,
          metadata: { incidentId: incident.id },
        })
      }
    } else if (action === 'recover') {
      // Resolve any open incident
      await resolveIncident(monitor.id)
      result.resolved = true

      await writeAuditLog({
        orgId: monitor.org_id,
        userId: user.id,
        action: 'simulate.incident_resolved',
        resourceType: 'monitor',
        resourceId: monitor.id,
      })
    }

    logger.info('Simulation completed', { monitorId, action, userId: user.id })
    return Response.json({ ok: true, ...result })
  } catch (err) {
    logger.error('Simulate incident error', { error: String(err) })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
