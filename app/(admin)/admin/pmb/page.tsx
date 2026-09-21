export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/db/users'
import {
  getPmbCategories,
  getPmbMonitors,
  getPmbRunsAdmin,
  getPmbQueueStats,
  getPmbCronHistory,
} from '@/lib/db/pmb'
import { PmbClient } from './pmb-client'

const PMB_CRON_PATHS = [
  '/api/cron/pmb/daily-publisher',
  '/api/cron/pmb/monthly-generator',
  '/api/cron/public-checks',
]

export default async function PmbPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!user.is_super_admin) redirect('/admin')

  const today = new Date().toISOString().split('T')[0]
  const weekStart = (() => {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    return d.toISOString().split('T')[0]
  })()

  const [categories, monitors, todayRuns, stats, cronHistory] = await Promise.all([
    getPmbCategories(),
    getPmbMonitors(),
    getPmbRunsAdmin({ date: today, limit: 100 }),
    getPmbQueueStats(weekStart),
    getPmbCronHistory(PMB_CRON_PATHS, 10),
  ])

  const pmbEnabled = monitors.filter(m => m.pmb_enabled).length

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Public Monitor Blogging</h1>
          <p className="admin-page-subtitle">
            PMB generates weekly comparison posts across {categories.length} categories.
            Admin-only — not visible to end users.
          </p>
        </div>
        <div className="admin-page-header-stat">
          <span className="admin-page-header-stat-number">{pmbEnabled}</span>
          <span className="admin-page-header-stat-label">providers enabled</span>
        </div>
      </div>

      <PmbClient
        categories={categories}
        monitors={monitors}
        todayRuns={todayRuns}
        stats={stats}
        cronHistory={cronHistory}
        today={today}
        weekStart={weekStart}
      />
    </div>
  )
}
