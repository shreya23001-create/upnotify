'use client'

import type { FeatureFlag } from '@/lib/types'

interface AdminFeatureFlagsContentProps {
  featureFlags: FeatureFlag[]
}

export function AdminFeatureFlagsContent({ featureFlags }: AdminFeatureFlagsContentProps): React.ReactElement {
  if (featureFlags.length === 0) {
    return (
      <div className="empty-state">
        <p>No feature flags configured.</p>
      </div>
    )
  }

  return (
    <div className="admin-flags-grid">
      {featureFlags.map((flag) => (
        <div key={flag.id} className="admin-flag-card">
          <div className="admin-flag-card-header">
            <div className="admin-flag-card-info">
              <span className="admin-flag-card-key">{flag.key}</span>
              {flag.description && (
                <span className="admin-flag-card-desc">{flag.description}</span>
              )}
            </div>
            <label className="switch">
              <input type="checkbox" checked={flag.is_enabled} disabled />
              <span className="switch-slider" />
            </label>
          </div>
          <div className="admin-flag-card-footer">
            <span className={`badge ${flag.is_enabled ? 'badge-success' : 'badge-outline'}`}>
              {flag.is_enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
