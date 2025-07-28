'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

interface UseConnectionStatusReturn {
  isOnline: boolean
  connectionStatus: ConnectionStatus
  isConnected: boolean
  lastConnectedAt: Date | null
  reconnectAttempts: number
  checkConnection: () => Promise<void>
}

// Configuration
const HEALTH_CHECK_URL = '/api/auth/me'
const CHECK_INTERVAL = 30000 // 30 seconds
const MAX_RECONNECT_ATTEMPTS = 5
const INITIAL_CHECK_DELAY = 1000 // 1 second delay for initial check
const MIN_CHECK_INTERVAL = 3000 // Minimum 3 seconds between checks
const CONNECTION_TIMEOUT = 5000 // 5 second timeout

export function useConnectionStatus(): UseConnectionStatusReturn {
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting')
  const [lastConnectedAt, setLastConnectedAt] = useState<Date | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  
  // Refs for managing state without causing re-renders
  const connectionCheckInterval = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null)
  const hasInitialConnection = useRef(false)
  const isChecking = useRef(false)
  const lastCheckTime = useRef(0)
  const isMounted = useRef(true)

  // Cleanup function
  const cleanup = useCallback(() => {
    if (connectionCheckInterval.current) {
      clearInterval(connectionCheckInterval.current)
      connectionCheckInterval.current = null
    }
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current)
      reconnectTimeout.current = null
    }
  }, [])

  // Check connection with improved error handling
  const checkConnection = useCallback(async () => {
    // Skip if component unmounted
    if (!isMounted.current) return

    // Prevent concurrent checks
    if (isChecking.current) {
      console.log('[Connection] Check already in progress, skipping')
      return
    }
    
    // Enforce minimum interval between checks
    const now = Date.now()
    const timeSinceLastCheck = now - lastCheckTime.current
    if (timeSinceLastCheck < MIN_CHECK_INTERVAL) {
      console.log(`[Connection] Too soon since last check (${timeSinceLastCheck}ms), skipping`)
      return
    }
    
    lastCheckTime.current = now
    isChecking.current = true

    try {
      // Quick offline check
      if (!navigator.onLine) {
        console.log('[Connection] Browser is offline')
        setIsOnline(false)
        if (connectionStatus !== 'disconnected') {
          setConnectionStatus('disconnected')
        }
        return
      }

      // Online but need to verify server connection
      setIsOnline(true)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT)

      console.log('[Connection] Checking server connection...')
      const response = await fetch(HEALTH_CHECK_URL, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache',
        credentials: 'include'
      })

      clearTimeout(timeoutId)

      if (!isMounted.current) return

      if (response.ok || response.status === 401) {
        // Connected successfully (401 means connected but not authenticated)
        console.log('[Connection] Server connection successful')
        if (connectionStatus !== 'connected') {
          setConnectionStatus('connected')
          setLastConnectedAt(new Date())
        }
        setReconnectAttempts(0)
        hasInitialConnection.current = true
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (err) {
      if (!isMounted.current) return

      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.log('[Connection] Check failed:', errorMessage)
      
      // Handle different failure scenarios
      if (!hasInitialConnection.current) {
        // Still trying initial connection
        setConnectionStatus('connecting')
      } else if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        // Was connected before, try reconnecting
        if (connectionStatus !== 'reconnecting') {
          setConnectionStatus('reconnecting')
        }
        setReconnectAttempts(prev => prev + 1)
      } else {
        // Max attempts reached
        setConnectionStatus('disconnected')
      }
    } finally {
      isChecking.current = false
    }
  }, [connectionStatus, reconnectAttempts])

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('[Connection] Browser went online')
      setIsOnline(true)
      
      // Only reset attempts and check if we were disconnected
      if (connectionStatus === 'disconnected') {
        setReconnectAttempts(0)
        setConnectionStatus('connecting')
        // Give network time to stabilize before checking
        setTimeout(() => {
          if (isMounted.current) {
            checkConnection()
          }
        }, 1500)
      }
    }
    
    const handleOffline = () => {
      console.log('[Connection] Browser went offline')
      setIsOnline(false)
      setConnectionStatus('disconnected')
      setReconnectAttempts(0)
      cleanup()
    }

    // Set initial state based on browser status
    const initialOnlineState = navigator.onLine
    console.log('[Connection] Initial online state:', initialOnlineState)
    
    if (!initialOnlineState) {
      setIsOnline(false)
      setConnectionStatus('disconnected')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [connectionStatus, checkConnection, cleanup])

  // Initial connection check with delay
  useEffect(() => {
    isMounted.current = true
    
    // Delay initial check to ensure app is ready
    const initialCheckTimer = setTimeout(() => {
      if (isMounted.current && isOnline) {
        console.log('[Connection] Running initial connection check')
        checkConnection()
      }
    }, INITIAL_CHECK_DELAY)

    return () => {
      isMounted.current = false
      clearTimeout(initialCheckTimer)
      cleanup()
    }
  }, []) // Only run once on mount

  // Periodic connection checks
  useEffect(() => {
    if (!isOnline || connectionStatus === 'disconnected') {
      // Don't check if offline or disconnected
      return
    }

    // Set up periodic checks
    connectionCheckInterval.current = setInterval(() => {
      checkConnection()
    }, CHECK_INTERVAL)

    return () => {
      if (connectionCheckInterval.current) {
        clearInterval(connectionCheckInterval.current)
      }
    }
  }, [isOnline, connectionStatus, checkConnection])

  // Handle reconnection with exponential backoff
  useEffect(() => {
    if (connectionStatus === 'reconnecting' && isOnline && reconnectAttempts > 0) {
      // Clear any existing timeout
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
      }

      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 16000)
      console.log(`Scheduling reconnect attempt ${reconnectAttempts} in ${delay}ms`)
      
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
