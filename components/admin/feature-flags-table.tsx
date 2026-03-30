'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import type { FeatureFlag } from '@/lib/types'

export function FeatureFlagsTable({ flags }: { flags: FeatureFlag[] }) {
  if (flags.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-sm text-zinc-500">No feature flags configured.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {flags.map((flag) => (
        <Card key={flag.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium font-mono">{flag.key}</p>
                {flag.rollout_percentage > 0 && flag.rollout_percentage < 100 && (
                  <Badge variant="secondary">{flag.rollout_percentage}% rollout</Badge>
                )}
              </div>
              {flag.description && (
                <p className="text-xs text-zinc-500">{flag.description}</p>
              )}
            </div>
            <Switch checked={flag.is_enabled} disabled />
          </CardContent>
        </Card>
      ))}
      <p className="text-xs text-zinc-500">Feature flag toggling will be enabled in a future update.</p>
    </div>
  )
}
