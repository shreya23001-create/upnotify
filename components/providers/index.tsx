'use client'

import { AuthProvider } from './auth-provider'
import { WorkspaceProvider } from './workspace-provider'
import { ToastProvider } from '@/components/ui/toast'
import type { User, Organisation, Workspace } from '@/lib/types'

interface ProvidersProps {
  children: React.ReactNode
  user: User | null
  organisation: Organisation | null
  workspaces: Workspace[]
  hasActivePlan: boolean
}

export function Providers({
  children,
  user,
  organisation,
  workspaces,
  hasActivePlan,
}: ProvidersProps) {
  return (
    <AuthProvider initialUser={user}>
      <WorkspaceProvider organisation={organisation} workspaces={workspaces} hasActivePlan={hasActivePlan}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </WorkspaceProvider>
    </AuthProvider>
  )
}
