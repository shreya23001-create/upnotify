import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import type { Json } from '@/lib/types/database.types'

interface AuditLogInput {
  orgId: string
  userId: string | null
  action: string
  resourceType?: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}

export async function writeAuditLog(input: AuditLogInput): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('audit_log').insert({
      org_id: input.orgId,
      user_id: input.userId,
      action: input.action,
      resource_type: input.resourceType ?? null,
      resource_id: input.resourceId ?? null,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
      metadata: (input.metadata ?? {}) as Json,
    })

    if (error) {
      logger.error('Failed to write audit log', {
        error: error.message,
        action: input.action,
      })
      return false
    }

    return true
  } catch (error) {
    logger.error('Audit log write threw an exception', {
      error: String(error),
      action: input.action,
    })
    return false
  }
}
