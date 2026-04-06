import { createClient } from '@/lib/supabase/server'
import { createApiKey, getApiKeysByOrg } from '@/lib/db/api-keys'
import { getPlanLimits } from '@/lib/utils/plan-limits'
import { writeAuditLog } from '@/lib/db/audit'
import { logger } from '@/lib/utils/logger'

const MAX_KEY_NAME_LENGTH = 64
const MAX_KEYS_PER_ORG = 10

export async function POST(request: Request): Promise<Response> {
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

    // Only admins and owners can create API keys
    if (role !== 'owner' && role !== 'admin') {
      return Response.json({ error: 'Only owners and admins can create API keys' }, { status: 403 })
    }

    // Check plan allows API access
    const planLimits = await getPlanLimits(orgId)
    if (!planLimits.hasApiAccess) {
      return Response.json({ error: 'API access is not available on your current plan. Please upgrade.' }, { status: 403 })
    }

    // Validate request body
    const body = await request.json() as Record<string, unknown>
    const { name } = body as { name?: unknown }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return Response.json({ error: 'Key name is required' }, { status: 400 })
    }
    if (name.trim().length > MAX_KEY_NAME_LENGTH) {
      return Response.json({ error: `Key name must be ${MAX_KEY_NAME_LENGTH} characters or fewer` }, { status: 400 })
    }

    // Enforce per-org key limit
    const existingKeys = await getApiKeysByOrg(orgId)
    if (existingKeys.length >= MAX_KEYS_PER_ORG) {
      return Response.json({ error: `Maximum of ${MAX_KEYS_PER_ORG} API keys allowed per organisation` }, { status: 429 })
    }

    // Create the key
    const result = await createApiKey({
      orgId,
      name: name.trim(),
      scopes: ['read', 'write'],
    })

    if (!result) {
      return Response.json({ error: 'Failed to create API key' }, { status: 500 })
    }

    await writeAuditLog({
      orgId,
      userId: user.id,
      action: 'api_key.created',
      resourceType: 'api_key',
      resourceId: result.key.id,
      metadata: { name: name.trim() },
    })

    logger.info('API key created', { orgId, keyId: result.key.id, name: name.trim() })

    // Return both the stored key record AND the raw key (raw key shown ONCE)
    return Response.json({
      key: result.key,
      rawKey: result.rawKey,
    }, { status: 201 })
  } catch (err) {
    logger.error('POST /api/v1/api-keys failed', { error: String(err) })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
