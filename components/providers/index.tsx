'use client'

import { AuthProvider } from './auth-provider'
import { WorkspaceProvider } from './workspace-provider'
import type { User, Organisation, Workspace } from '@/lib/types'

interface ProvidersProps {
  children: React.ReactNode
  user: User | null
  organisation: Organisation | null
  workspaces: Workspace[]
}

export function Providers({
  children,
  user,
  organisation,
  workspaces,
}: ProvidersProps): React.JSX.Element {
  return (
    <AuthProvider initialUser={user}>
      <WorkspaceProvider organisation={organisation} workspaces={workspaces}>
        {children}
      </WorkspaceProvider>
    </AuthProvider>
  )
}
