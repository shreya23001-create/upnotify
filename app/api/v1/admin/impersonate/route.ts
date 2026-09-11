import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { writeAuditLog } from '@/lib/db/audit'
import { logger } from '@/lib/utils/logger'

const COOKIE_NAME = 'Upnotify_impersonate'
const COOKIE_MAX_AGE = 60 * 60 // 1 hour

interface ImpersonateRequestBody {
  userId: string
}

/**
 * POST /api/v1/admin/impersonate
 * Start impersonating a user. Super admin only.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify the caller is a super admin
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('id, is_super_admin, org_id, email')
      .eq('id', authUser.id)
      .single()

    const adminEmailsRaw = process.env.ADMIN_EMAILS || ''
    const adminEmails = adminEmailsRaw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
    const callerEmail = (adminUser?.email ?? '').toLowerCase()
    const isSuperAdmin = adminUser?.is_super_admin || adminEmails.includes(callerEmail)

    if (adminError || !isSuperAdmin) {
      logger.warn('Non-admin attempted impersonation', { userId: authUser.id })
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = (await request.json()) as ImpersonateRequestBody
    const { userId } = body

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    // Verify the target user exists
    const adminClient = createAdminClient()
    const { data: targetUser, error: targetError } = await adminClient
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single()

    if (targetError || !targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Set the impersonation cookie
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, userId, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })

    // Audit log
    await writeAuditLog({
      orgId: adminUser.org_id,
      userId: adminUser.id,
      action: 'admin.impersonation_started',
      resourceType: 'user',
      resourceId: userId,
      ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
      metadata: {
        adminEmail: adminUser.email,
        targetEmail: targetUser.email,
      },
    })

    logger.info('Impersonation started', {
      adminId: adminUser.id,
      targetUserId: userId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Impersonation start failed', { error: String(error) })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/admin/impersonate
 * Stop impersonating. Clears the cookie.
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const cookieStore = await cookies()
    const impersonatedUserId = cookieStore.get(COOKIE_NAME)?.value

    // Clear the cookie
    cookieStore.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    })

    // Audit log if there was an active impersonation
    if (impersonatedUserId) {
      const { data: adminUser } = await supabase
        .from('users')
        .select('id, org_id, email')
        .eq('id', authUser.id)
        .single()

      if (adminUser) {
        await writeAuditLog({
          orgId: adminUser.org_id,
          userId: adminUser.id,
          action: 'admin.impersonation_ended',
          resourceType: 'user',
          resourceId: impersonatedUserId,
          ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
          userAgent: request.headers.get('user-agent') ?? undefined,
          metadata: {
            adminEmail: adminUser.email,
          },
        })

        logger.info('Impersonation ended', {
          adminId: adminUser.id,
          targetUserId: impersonatedUserId,
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Impersonation end failed', { error: String(error) })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
