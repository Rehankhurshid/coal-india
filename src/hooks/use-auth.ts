'use client'

import { useState, useEffect, useCallback } from 'react'
import { ClientAuthService } from '@/lib/auth/client-auth'

interface AuthState {
  currentUserId: string | null
  employee: any | null
  loading: boolean
  isAuthenticated: boolean
  error: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    currentUserId: null,
    employee: null,
    loading: true,
    isAuthenticated: false,
    error: null
  })

  const checkAuth = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      const session = await ClientAuthService.getValidSession()
      
      if (!session) {
        setAuthState({
          currentUserId: null,
          employee: null,
          loading: false,
          isAuthenticated: false,
          error: null
        })
        return
      }

      const employee = await ClientAuthService.getCurrentUser()
      
      if (!employee) {
        // User data not found, clear session
        ClientAuthService.clearSession()
        setAuthState({
          currentUserId: null,
          employee: null,
          loading: false,
          isAuthenticated: false,
          error: 'User data not found'
        })
        return
      }

      setAuthState({
        currentUserId: session.employeeId,
        employee,
        loading: false,
        isAuthenticated: true,
        error: null
      })
    } catch (error) {
      console.error('Auth check error:', error)
      setAuthState({
        currentUserId: null,
        employee: null,
        loading: false,
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Authentication error'
      })
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await ClientAuthService.logout()
      setAuthState({
        currentUserId: null,
        employee: null,
        loading: false,
        isAuthenticated: false,
        error: null
      })
    } catch (error) {
      console.error('Logout error:', error)
      // Force clear local state even if API call fails
      setAuthState({
        currentUserId: null,
        employee: null,
        loading: false,
        isAuthenticated: false,
        error: null
      })
    }
  }, [])

  const refreshAuth = useCallback(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return {
    ...authState,
    logout,
    refreshAuth
  }
}
