import { AdminTrustedLogos } from '@/components/admin/admin-trusted-logos'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

interface TrustedLogosData {
  logos: string[]
}

async function getTrustedLogos(): Promise<string[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('page_sections')
    .select('content')
    .eq('section_key', 'trusted_logos')
    .single()

  if (error) {
    logger.warn('Admin settings: trusted logos not found', { error: error.message })
    return []
  }

  const content = data?.content as unknown as TrustedLogosData | null
  return content?.logos ?? []
}

export default async function AdminSettingsPage(): Promise<React.ReactElement> {
  const logos = await getTrustedLogos()

  return (
    <div>
      <h1 className="admin-page-title">Settings</h1>
      <p className="admin-page-subtitle">Platform-wide configuration and content management.</p>

      <div style={{ marginTop: 32 }}>
        <AdminTrustedLogos initialLogos={logos} />
      </div>
    </div>
  )
}
