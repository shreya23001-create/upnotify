import { AdminSettingsContent } from '@/components/admin/admin-settings-content'
import { getAllLandingSections, getCmsTheme } from '@/lib/db/page-sections'
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
  const [trustedLogos, cmsSections, cmsTheme] = await Promise.all([
    getTrustedLogos(),
    getAllLandingSections(),
    getCmsTheme(),
  ])

  return (
    <div>
      <h1 className="admin-page-title">Settings</h1>
      <p className="admin-page-subtitle">Platform-wide configuration and content management.</p>

      <div style={{ marginTop: 32 }}>
        <AdminSettingsContent
          cmsSections={cmsSections}
          cmsTheme={cmsTheme}
          trustedLogos={trustedLogos}
        />
      </div>
    </div>
  )
}
