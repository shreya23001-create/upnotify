'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react'
import type { Workspace, Organisation } from '@/lib/types'

const STORAGE_KEY = 'uptrue_workspace_id'

interface WorkspaceContextType {
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
  organisation: Organisation | null
  isAgency: boolean
  setCurrentWorkspace: (workspaceId: string) => void
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  currentWorkspace: null,
  workspaces: [],
  organisation: null,
  isAgency: false,
  setCurrentWorkspace: () => {},
})

export function useWorkspace(): WorkspaceContextType {
  return useContext(WorkspaceContext)
}

interface WorkspaceProviderProps {
  children: React.ReactNode
  organisation: Organisation | null
  workspaces: Workspace[]
}

export function WorkspaceProvider({
  children,
  organisation,
  workspaces,
}: WorkspaceProviderProps): React.JSX.Element {
  const isAgency = organisation?.type === 'agency'

  const [currentWorkspace, setCurrentWorkspaceState] =
    useState<Workspace | null>(() => {
      if (typeof window === 'undefined') return workspaces[0] ?? null
      const savedId = localStorage.getItem(STORAGE_KEY)
      const saved = workspaces.find((w) => w.id === savedId)
      return saved ?? workspaces[0] ?? null
    })

  const setCurrentWorkspace = useCallback(
    (workspaceId: string) => {
      const ws = workspaces.find((w) => w.id === workspaceId)
      if (ws) {
        setCurrentWorkspaceState(ws)
        localStorage.setItem(STORAGE_KEY, workspaceId)
      }
    },
    [workspaces]
  )

  useEffect(() => {
    if (currentWorkspace) {
      localStorage.setItem(STORAGE_KEY, currentWorkspace.id)
    }
  }, [currentWorkspace])

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        workspaces,
        organisation,
        isAgency,
        setCurrentWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}
