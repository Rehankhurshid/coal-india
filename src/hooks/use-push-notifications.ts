import { useState, useEffect, useCallback } from 'react'
import { PushNotificationService } from '@/lib/services/push-notifications'
import { useAuth } from '@/hooks/use-auth'

interface UsePushNotificationsReturn {
  permission: NotificationPermission | null
  isSubscribed: boolean
  isLoading: boolean
  error: string | null
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
  requestPermission: () => Promise<void>
  sendTestNotification: () => Promise<void>
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const { employee } = useAuth()
  const [permission, setPermission] = useState<NotificationPermission | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check notification permission and subscription status on mount
  useEffect(() => {
    const checkStatus = async () => {
      if (!('Notification' in window)) {
        setError('Notifications not supported')
        return
      }

      // Check permission
      setPermission(Notification.permission)

      // Check if subscribed
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.ready
          const subscription = await registration.pushManager.getSubscription()
          setIsSubscribed(!!subscription)
        } catch (err) {
          console.error('Error checking subscription status:', err)
        }
      }
    }

    checkStatus()
  }, [])

  const requestPermission = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await PushNotificationService.requestPermission()
      setPermission(result)
    } catch (err) {
      setError('Failed to request permission')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const subscribe = useCallback(async () => {
    if (!employee?.emp_code) {
      setError('Please login to enable notifications')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const success = await PushNotificationService.subscribeToPush(employee.emp_code)
      if (success) {
        setIsSubscribed(true)
      } else {
        setError('Failed to subscribe to notifications')
      }
    } catch (err) {
      setError('Failed to subscribe to notifications')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [employee?.emp_code])

  const unsubscribe = useCallback(async () => {
    if (!employee?.emp_code) {
      setError('Please login to manage notifications')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const success = await PushNotificationService.unsubscribeFromPush(employee.emp_code)
      if (success) {
        setIsSubscribed(false)
      } else {
        setError('Failed to unsubscribe from notifications')
      }
    } catch (err) {
      setError('Failed to unsubscribe from notifications')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [employee?.emp_code])

  const sendTestNotification = useCallback(async () => {
    if (!employee?.emp_code) {
      setError('Please login to send test notification')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      await PushNotificationService.sendTestNotification(employee.emp_code)
    } catch (err) {
      setError('Failed to send test notification')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [employee?.emp_code])

  return {
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    requestPermission,
    sendTestNotification
  }
}
