'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

interface UseConnectionStatusReturn {
  isOnline: boolean
  connectionStatus: ConnectionStatus
  isConnected: boolean
  lastConnectedAt: Date | null
  reconnectAttempts: number
  checkConnection: () => Promise<void>
}

export function useConnectionStatus(): UseConnectionStatusReturn {
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting')
  const [lastConnectedAt, setLastConnectedAt] = useState<Date | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  
  const supabase = createClient()
  const connectionCheckInterval = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null)
  const hasInitialConnection = useRef(false)

  // Check Supabase connection by making a simple query
  const checkConnection = useCallback(async () => {
    if (!isOnline) {
      setConnectionStatus('disconnected')
      return
    }

    try {
      // Simple health check query - just check if we can reach Supabase
      const { error } = await supabase
        .from('employees')
        .select('emp_code')
        .limit(1)
        .single()

      if (!error || error.code === 'PGRST116') { // PGRST116 is "no rows found" which still means connected
        setConnectionStatus('connected')
        setLastConnectedAt(new Date())
        setReconnectAttempts(0)
        hasInitialConnection.current = true
      } else {
        throw error
      }
    } catch (err) {
      // Better error handling
      const errorMessage = err instanceof Error ? err.message : 'Unknown connection error'
      console.warn('Connection check failed:', errorMessage)
      
      if (hasInitialConnection.current && reconnectAttempts < 5) {
        // We were connected before and haven't exceeded max retries
        setConnectionStatus('reconnecting')
        setReconnectAttempts(prev => prev + 1)
      } else if (hasInitialConnection.current) {
        // Max retries exceeded
        setConnectionStatus('disconnected')
      } else {
        // Never connected, still connecting
        setConnectionStatus('connecting')
      }
    }
  }, [isOnline, supabase, reconnectAttempts])

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setReconnectAttempts(0) // Reset attempts when coming back online
      setConnectionStatus('connecting')
      // When coming back online, immediately check connection
      checkConnection()
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      setConnectionStatus('disconnected')
      setReconnectAttempts(0)
      hasInitialConnection.current = false // Reset initial connection flag
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [checkConnection])

  // Initial connection check and periodic checks
  useEffect(() => {
    // Initial check
    checkConnection()

    // Set up periodic connection checks every 10 seconds
    connectionCheckInterval.current = setInterval(() => {
      checkConnection()
    }, 10000)

    return () => {
      if (connectionCheckInterval.current) {
        clearInterval(connectionCheckInterval.current)
      }
    }
  }, [checkConnection])

  // Handle reconnection with exponential backoff
  useEffect(() => {
    if (connectionStatus === 'reconnecting' && isOnline && reconnectAttempts < 5) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 16000) // Max 16 seconds
      
      reconnectTimeout.current = setTimeout(() => {
        checkConnection()
      }, delay)

      return () => {
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current)
        }
      }
    }
  }, [connectionStatus, reconnectAttempts, isOnline, checkConnection])

  const isConnected = connectionStatus === 'connected'

  return {
    isOnline,
    connectionStatus,
    isConnected,
    lastConnectedAt,
    reconnectAttempts,
    checkConnection
  }
}
