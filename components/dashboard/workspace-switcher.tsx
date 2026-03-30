'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useWorkspace } from '@/components/providers/workspace-provider'

export function WorkspaceSwitcher() {
  const { currentWorkspace, workspaces, isAgency, setCurrentWorkspace } = useWorkspace()

  if (!isAgency || workspaces.length <= 1) return null

  return (
    <Select
      value={currentWorkspace?.id ?? ''}
      onValueChange={(value) => { if (value) setCurrentWorkspace(value) }}
    >
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select workspace" />
      </SelectTrigger>
      <SelectContent>
        {workspaces.map((ws) => (
          <SelectItem key={ws.id} value={ws.id}>
            {ws.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
