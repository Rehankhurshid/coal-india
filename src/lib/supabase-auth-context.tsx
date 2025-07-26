'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface SupabaseAuthContextType {
  setCurrentUserId: (userId: string | null) => void
  currentUserId: string | null
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType>({
  setCurrentUserId: () => {},
  currentUserId: null
})

export const useSupabaseAuth = () => useContext(SupabaseAuthContext)

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    // Set the current user ID in database connection for RLS
    const setUserIdForRLS = async (userId: string | null) => {
      if (userId) {
        try {
          await supabase.rpc('set_current_user_id', { user_id: userId })
        } catch (error) {
          console.error('Error setting user ID for RLS:', error)
        }
      }
    }

    if (currentUserId) {
      setUserIdForRLS(currentUserId)
    }
  }, [currentUserId])

  return (
    <SupabaseAuthContext.Provider value={{ setCurrentUserId, currentUserId }}>
      {children}
    </SupabaseAuthContext.Provider>
  )
}
