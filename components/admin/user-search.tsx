'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { User, Organisation } from '@/lib/types'

export function UserSearch({
  users,
  organisations,
}: {
  users: User[]
  organisations: Organisation[]
}) {
  const [search, setSearch] = useState('')

  const orgMap = new Map(organisations.map((o) => [o.id, o.name]))

  const filtered = search
    ? users.filter(
        (u) =>
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          (u.full_name ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : users

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search users by email or name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Organisation</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.slice(0, 50).map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.full_name ?? '—'}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{orgMap.get(user.org_id) ?? '—'}</TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {user.role}
                </Badge>
                {user.is_super_admin && (
                  <Badge variant="destructive" className="ml-1">
                    Admin
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {filtered.length > 50 && (
        <p className="text-sm text-zinc-500">
          Showing 50 of {filtered.length} results. Refine your search.
        </p>
      )}
    </div>
  )
}
