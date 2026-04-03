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
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const hasAccess = await checkCompeteAccess(user.org_id)
  if (!hasAccess) redirect('/dashboard/compete')

  const apiKeys = await getApiKeysByOrg(user.org_id)

  return (
    <div>
      <div className="page-header">
        <div>
          <Link href="/dashboard/compete" className="compete-back-link">
            <IconArrowLeft size={16} />
            <span>Back to Compete</span>
          </Link>
          <h1 className="page-title">Connect Your Store</h1>
          <p className="page-subtitle">
            Send product and price data directly from your ecommerce platform.
          </p>
        </div>
      </div>

      <ConnectInstructions
        hasApiKey={apiKeys.length > 0}
        apiKeyPrefix={apiKeys.length > 0 ? apiKeys[0].key_prefix : null}
      />
    </div>
  )
}
