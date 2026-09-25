import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/db/users'
import { createTeamMemberDirectly, updateTeamMemberAccess } from '@/lib/db/team'
import { sendMemberCredentialsEmail } from '@/lib/services/email'
import { writeAuditLog } from '@/lib/db/audit'
import { getServerConfig } from '@/lib/utils/config'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

interface CreateMemberRequestBody {
  name: string
  email: string
  password: string
  role: 'member' | 'admin'
  access: string[]
}

/**
 * POST /api/v1/team/create-member — Admin creates a team member account
 * directly (sets their password) and emails them the login credentials.
 * This is separate from the self-service invite-link flow (POST
 * /api/v1/team) — that one sends an invite the recipient must accept by
 * signing up themselves; this one creates the real account up front.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const canManageTeam = user.role === 'admin' || user.is_super_admin
    if (!canManageTeam) {
      return NextResponse.json(
        { error: 'You do not have permission to add team members.' },
        { status: 403 }
      )
    }

    const body = (await request.json()) as CreateMemberRequestBody
    const { name, email, password, role, access } = body

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters.' }, { status: 400 })
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }
    if (role !== 'member' && role !== 'admin') {
      return NextResponse.json({ error: 'Role must be "member" or "admin".' }, { status: 400 })
    }
    if (!Array.isArray(access) || (role === 'member' && access.length === 0)) {
      return NextResponse.json({ error: 'Select at least one tab this member can access.' }, { status: 400 })
    }

    const trimmedEmail = email.toLowerCase().trim()
    const trimmedName = name.trim()
    // Admins get unrestricted access (null) regardless of what was checked —
    // the Access list is only meaningful for members.
    const tabAccess = role === 'admin' ? null : access

    const result = await createTeamMemberDirectly({
      orgId: user.org_id,
      name: trimmedName,
      email: trimmedEmail,
      password,
      role,
      tabAccess,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const config = getServerConfig()
    const supabase = createAdminClient()
    const { data: org } = await supabase
      .from('organisations')
      .select('name')
      .eq('id', user.org_id)
      .single()

    await sendMemberCredentialsEmail({
      to: trimmedEmail,
      name: trimmedName,
      orgName: org?.name ?? 'your organisation',
      role,
      addedByName: user.full_name ?? user.email ?? 'Your admin',
      tempPassword: password,
      loginUrl: `${config.app.url}/login`,
    })

    await writeAuditLog({
      orgId: user.org_id,
      userId: user.id,
      action: 'team.member_created_directly',
      resourceType: 'user',
      resourceId: result.userId,
      metadata: { email: trimmedEmail, role, access: tabAccess },
    })

    logger.info('Team member created directly by admin', {
      orgId: user.org_id,
      email: trimmedEmail,
      role,
    })

    return NextResponse.json({ success: true, userId: result.userId })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Create team member API error', { error: message })
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

interface UpdateMemberRequestBody {
  userId: string
  role: 'member' | 'admin'
  access: string[]
}

/**
 * PUT /api/v1/team/create-member — Edit an existing member's role/access.
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const canManageTeam = user.role === 'admin' || user.is_super_admin
    if (!canManageTeam) {
      return NextResponse.json(
        { error: 'You do not have permission to manage team members.' },
        { status: 403 }
      )
    }

    const body = (await request.json()) as UpdateMemberRequestBody
    const { userId: targetUserId, role, access } = body

    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json({ error: 'userId is required.' }, { status: 400 })
    }
    if (role !== 'member' && role !== 'admin') {
      return NextResponse.json({ error: 'Role must be "member" or "admin".' }, { status: 400 })
    }
    if (!Array.isArray(access) || (role === 'member' && access.length === 0)) {
      return NextResponse.json({ error: 'Select at least one tab this member can access.' }, { status: 400 })
    }

    const result = await updateTeamMemberAccess(user.org_id, targetUserId, {
      role,
      tabAccess: access,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    await writeAuditLog({
      orgId: user.org_id,
      userId: user.id,
      action: 'team.member_access_updated',
      resourceType: 'user',
      resourceId: targetUserId,
      metadata: { role, access },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Update team member API error', { error: message })
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
