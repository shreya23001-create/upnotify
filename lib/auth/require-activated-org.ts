import { redirect } from 'next/navigation'
import { hasAnyActivePlan } from '@/lib/utils/plan-limits'

/**
 * Call at the top of every gated dashboard page, right after the existing
 * `getCurrentUser()` / `redirect('/login')` check. Redirects to
 * /dashboard/plans if the org has no active plan (no grandfathered legacy
 * subscription and no active per-website subscription) — enforced
 * server-side so it can't be bypassed by typing a URL directly, unlike
 * hiding the sidebar link alone.
 */
export async function requireActivatedOrg(orgId: string): Promise<void> {
  if (!(await hasAnyActivePlan(orgId))) {
    redirect('/dashboard/plans')
  }
}
