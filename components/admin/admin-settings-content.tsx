'use client'

import { useState } from 'react'
import { CmsManager } from '@/components/admin/cms-manager'
import { AdminTrustedLogos } from '@/components/admin/admin-trusted-logos'
import { EmailProvidersContent } from '@/components/admin/email-providers-content'
import type { PageSection, CmsTheme } from '@/lib/types/cms'

interface Props {
  cmsSections: PageSection[]
  cmsTheme: CmsTheme | null
  trustedLogos: string[]
}

const TABS = [
  { id: 'cms',    label: 'Landing CMS' },
  { id: 'logos',  label: 'Trusted Logos' },
  { id: 'email',  label: 'Email' },
] as const

type TabId = typeof TABS[number]['id']

export function AdminSettingsContent({ cmsSections, cmsTheme, trustedLogos }: Props): React.ReactElement {
  const [tab, setTab] = useState<TabId>('cms')

  return (
    <div>
      <div className="tabs-list">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-trigger${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'cms' && (
        <CmsManager initialSections={cmsSections} initialTheme={cmsTheme} />
      )}

      {tab === 'logos' && (
        <AdminTrustedLogos initialLogos={trustedLogos} />
      )}

      {tab === 'email' && (
        <EmailProvidersContent />
      )}
    </div>
  )
}
