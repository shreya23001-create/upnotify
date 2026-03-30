'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import type { User } from '@/lib/types'

export function TeamSettings({
  members,
  currentUserId,
}: {
  members: User[]
  currentUserId: string
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Team Members</CardTitle>
          <Button size="sm" disabled>
            <Plus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-zinc-500">No team members.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.full_name ?? '—'}
                      {member.id === currentUserId && (
                        <span className="ml-2 text-xs text-zinc-400">(you)</span>
                      )}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.id !== currentUserId && (
                        <Button variant="ghost" size="sm" disabled>
                          Remove
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <p className="text-xs text-zinc-500">Team management features will be enabled in a future update.</p>
    </div>
  )
}
