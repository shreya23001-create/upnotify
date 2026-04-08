'use client'

import { useWorkspace } from '@/components/providers/workspace-provider'

export function WorkspaceSwitcher() {
  const { currentWorkspace, workspaces, isAgency, setCurrentWorkspace } = useWorkspace()
  if (!isAgency || workspaces.length <= 1) return null

  return (
    <select
      className="form-select"
      value={currentWorkspace?.id ?? ''}
      onChange={(e) => setCurrentWorkspace(e.target.value)}
      style={{ width: 200 }}
    >
      <option value="">All Workspaces</option>
      {workspaces.map((ws) => (
        <option key={ws.id} value={ws.id}>{ws.name}</option>
      ))}
    </select>
  )
}
