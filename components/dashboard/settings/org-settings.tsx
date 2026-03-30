'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { Organisation } from '@/lib/types'

export function OrgSettings({ organisation }: { organisation: Organisation }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Organisation Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="org-name">Name</Label>
          <Input id="org-name" defaultValue={organisation.name} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-slug">Slug</Label>
          <Input id="org-slug" defaultValue={organisation.slug} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-type">Account Type</Label>
          <Input id="org-type" defaultValue={organisation.type} disabled className="capitalize" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-timezone">Timezone</Label>
          <Input id="org-timezone" defaultValue={organisation.timezone} disabled />
        </div>
        <Button disabled>Save Changes</Button>
        <p className="text-xs text-zinc-500">Settings editing will be enabled in a future update.</p>
      </CardContent>
    </Card>
  )
}
