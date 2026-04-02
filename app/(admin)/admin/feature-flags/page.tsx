import { getFeatureFlags } from '@/lib/db/admin'
import { AdminFeatureFlagsContent } from '@/components/admin/admin-feature-flags-content'

export default async function AdminFeatureFlagsPage(): Promise<React.ReactElement> {
  const featureFlags = await getFeatureFlags()

  const enabledCount = featureFlags.filter((f) => f.is_enabled).length

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Feature Flags</h1>
          <p className="admin-page-subtitle">
            Toggle features on and off across the platform.
          </p>
        </div>
        <div className="admin-page-header-stat">
          <span className="admin-page-header-stat-number">{enabledCount}/{featureFlags.length}</span>
          <span className="admin-page-header-stat-label">enabled</span>
        </div>
      </div>
      <AdminFeatureFlagsContent featureFlags={featureFlags} />
    </div>
  )
}
