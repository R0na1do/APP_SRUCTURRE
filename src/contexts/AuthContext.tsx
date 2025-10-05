'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabaseBrowser } from '@/lib/supabase-browser'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  userType: 'customer' | 'owner' | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState<'customer' | 'owner' | null>(null)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabaseBrowser().auth.getSession()
      setUser(session?.user ?? null)
      setUserType(session?.user?.user_metadata?.user_type ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabaseBrowser().auth.onAuthStateChange(
      async (event: any, session: any) => {
        setUser(session?.user ?? null)
        setUserType(session?.user?.user_metadata?.user_type ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabaseBrowser().auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, userType }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
