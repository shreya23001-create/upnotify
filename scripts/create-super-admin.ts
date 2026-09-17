/**
 * ONE-OFF DEV UTILITY — creates a super admin account.
 *
 * Uses the Supabase Admin API to create a confirmed auth user (bypassing
 * the "confirm your email" step), which fires the same on_auth_user_created
 * trigger a normal signup does (creates the matching public.users +
 * organisations rows). Then flips users.is_super_admin = true so the
 * account lands in /admin instead of the customer dashboard, per
 * lib/db/admin-roles.ts's hasAdminAccess() check.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/create-super-admin.ts <email> <password>
 */

import { createClient } from '@supabase/supabase-js'

async function main(): Promise<void> {
  const [, , email, password] = process.argv
  if (!email || !password) {
    console.error('Usage: npx tsx --env-file=.env.local scripts/create-super-admin.ts <email> <password>')
    process.exit(1)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set in your environment.')
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

  console.log('Creating auth user...')
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Super Admin' },
  })

  if (createError || !created.user) {
    console.error('Failed to create auth user:', createError?.message ?? 'unknown error')
    process.exit(1)
  }

  const userId = created.user.id
  console.log('Auth user created:', userId)

  // The on_auth_user_created trigger creates the matching public.users row
  // asynchronously-but-in-the-same-transaction — it should already exist,
  // but poll briefly in case of replication lag.
  let dbUser: { id: string; org_id: string } | null = null
  for (let attempt = 0; attempt < 10 && !dbUser; attempt++) {
    const { data } = await supabase.from('users').select('id, org_id').eq('id', userId).maybeSingle()
    dbUser = data
    if (!dbUser) await new Promise(r => setTimeout(r, 300))
  }

  if (!dbUser) {
    console.error('auth user was created, but no matching public.users row appeared — check the on_auth_user_created trigger.')
    process.exit(1)
  }

  console.log('Matching users row found, org_id:', dbUser.org_id)

  const { error: updateError } = await supabase
    .from('users')
    .update({ is_super_admin: true })
    .eq('id', userId)

  if (updateError) {
    console.error('Failed to set is_super_admin:', updateError.message)
    process.exit(1)
  }

  console.log('\nDone. Super admin account created:')
  console.log('  Email:', email)
  console.log('  Log in at /login — you will land in /admin automatically.')
}

main().catch(err => {
  console.error('Failed:', err)
  process.exit(1)
})
