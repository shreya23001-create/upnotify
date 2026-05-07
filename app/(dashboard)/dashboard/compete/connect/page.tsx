// @ts-nocheck — dead route, redirects to /dashboard until Compete launches in v1.5
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/db/users'
import { getApiKeysByOrg } from '@/lib/db/api-keys'
import { checkCompeteAccess } from '@/lib/utils/plan-limits'
import { IconArrowLeft } from '@/components/icons'
import { ConnectInstructions } from '@/components/compete/connect-instructions'

export const metadata: Metadata = {
  title: 'Connect Store — Compete',
}

export default async function ConnectStorePage(): Promise<React.ReactElement> {
  return redirect('/dashboard') // Hidden until v1.5 launch
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const hasAccess = await checkCompeteAccess(user.org_id)
  if (!hasAccess) redirect('/dashboard/compete')

  const apiKeys = await getApiKeysByOrg(user.org_id)

  return (
    <div className="db-content">
      <div className="db-page-header">
        <div>
          <Link href="/dashboard/compete" className="db-breadcrumb">← Back to Compete</Link>
          <div className="db-page-title">Connect Your Store</div>
          <div className="db-page-sub">Send product and price data directly from your ecommerce platform.</div>
        </div>
      </div>

      <ConnectInstructions
        hasApiKey={apiKeys.length > 0}
        apiKeyPrefix={apiKeys.length > 0 ? apiKeys[0].key_prefix : null}
      />
    </div>
  )
}
