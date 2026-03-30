'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus } from 'lucide-react'
import type { ApiKey } from '@/lib/types'

export function ApiKeysSettings({ apiKeys }: { apiKeys: ApiKey[] }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>API Keys</CardTitle>
          <Button size="sm" disabled>
            <Plus className="mr-2 h-4 w-4" />
            Create Key
          </Button>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <p className="text-sm text-zinc-500">No API keys created yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Prefix</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell className="font-mono text-sm">{key.key_prefix}...</TableCell>
                    <TableCell className="text-zinc-500">
                      {new Date(key.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-zinc-500">
                      {key.last_used_at
                        ? new Date(key.last_used_at).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" disabled>
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <p className="text-xs text-zinc-500">API key management will be enabled in a future update.</p>
    </div>
  )
}
