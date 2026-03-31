'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import { signOut as signOutAction } from '@/lib/auth/actions'
import type { User } from '@/lib/types'
import type { Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
})

export function useAuth(): AuthContextType {
  return useContext(AuthContext)
}

interface AuthProviderProps {
  children: React.ReactNode
  initialUser: User | null
}

export function AuthProvider({
  children,
  initialUser,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(!initialUser)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (!s) setUser(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = useCallback(async () => {
    await signOutAction()
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, session, isLoading, signOut: handleSignOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}
