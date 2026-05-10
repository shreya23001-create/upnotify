import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { getEngineKeyForTesting } from '@/lib/db/ai-engines'
import { testEngineKey } from '@/lib/services/engine-tester'
import { writeAuditLog } from '@/lib/db/audit'

// POST /api/admin/ai-engines/keys/[id]/test
// Super-admin only. Decrypts the named key, runs a minimal real call against
// the engine's provider, returns { ok, statusCode, message, latencyMs }.
// Does not increment the key's monthly usage counter (test ≠ real usage).
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const user = await getCurrentUser()
  if (!user?.is_super_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const lookup = await getEngineKeyForTesting(id)

  if (!lookup.ok) {
    // Decryption failures are useful to surface to admin — they almost always
    // mean AI_ENGINE_ENCRYPTION_SECRET was rotated since the key was added.
    const httpStatus = lookup.reason === 'not_found' ? 404 : 500
    return NextResponse.json(
      {
        ok:         false,
        statusCode: null,
        message:    lookup.message,
        latencyMs:  0,
      },
      { status: httpStatus },
    )
  }

  const result = await testEngineKey(lookup.engineSlug, lookup.apiKey, lookup.modelId)

  await writeAuditLog({
    orgId:        'system',
    userId:       user.id,
    action:       'admin.engine_key_test',
    resourceType: 'ai_engine_key',
    resourceId:   id,
    metadata: {
      engineSlug: lookup.engineSlug,
      ok:         result.ok,
      statusCode: result.statusCode,
      latencyMs:  result.latencyMs,
    },
  })

  return NextResponse.json(result)
}
