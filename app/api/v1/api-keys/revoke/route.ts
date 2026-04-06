import { createClient } from '@/lib/supabase/server'
import { revokeApiKey, getApiKeysByOrg } from '@/lib/db/api-keys'
import { writeAuditLog } from '@/lib/db/audit'
import { logger } from '@/lib/utils/logger'

export async function DELETE(request: Request): Promise<Response> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('org_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.org_id) {
      return Response.json({ error: 'No organisation found' }, { status: 403 })
    }

    const { role, org_id: orgId } = profile
    if (role !== 'owner' && role !== 'admin') {
      return Response.json({ error: 'Only owners and admins can revoke API keys' }, { status: 403 })
    }

    const body: unknown = await request.json()
    const { ids } = body as { ids?: unknown }
    if (!Array.isArray(ids) || ids.length === 0) {
      return Response.json({ error: 'ids must be a non-empty array' }, { status: 400 })
    }
    if (ids.length > 50) {
      return Response.json({ error: 'Maximum 50 keys per request' }, { status: 400 })
    }
    if (!ids.every((id) => typeof id === 'string')) {
      return Response.json({ error: 'All ids must be strings' }, { status: 400 })
    }

    // Verify all keys belong to the user's org (prevents cross-org revocation)
    const orgKeys = await getApiKeysByOrg(orgId)
    const orgKeyIds = new Set(orgKeys.map((k) => k.id))
    const unauthorised = (ids as string[]).filter((id) => !orgKeyIds.has(id))
    if (unauthorised.length > 0) {
      logger.warn('Attempt to revoke keys not belonging to org', { userId: user.id, orgId, unauthorised })
      return Response.json({ error: 'One or more keys do not belong to your organisation' }, { status: 403 })
    }

    // Revoke each key
    const results = await Promise.allSettled(
      (ids as string[]).map((id) => revokeApiKey(id))
    )

    const failed = results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value))
    if (failed.length > 0) {
      logger.error('Some API keys failed to revoke', { userId: user.id, orgId, failedCount: failed.length })
      return Response.json({ error: `${failed.length} key(s) failed to revoke` }, { status: 500 })
    }

    await writeAuditLog({
      orgId,
      userId: user.id,
      action: 'api_key.revoked',
      resourceType: 'api_key',
      resourceId: (ids as string[]).join(','),
      metadata: { count: ids.length },
    })

    return Response.json({ ok: true, revoked: ids.length })
  } catch (err) {
    logger.error('API key revoke error', { error: String(err) })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
