export class PushNotificationService {
  private static readonly VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

  /**
   * Request notification permission
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported')
    }

    const permission = await Notification.requestPermission()
    return permission
  }

  /**
   * Subscribe to push notifications
   */
  static async subscribeToPush(employeeId: string): Promise<boolean> {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push notifications not supported')
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready
      
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription()
      if (existingSubscription) {
        await existingSubscription.unsubscribe()
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY)
      })

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('session_token') || ''}`
        },
        body: JSON.stringify({ subscription })
      })

      if (!response.ok) {
        throw new Error('Failed to save subscription on server')
      }

      return true
    } catch (error) {
      console.error('Error subscribing to push:', error)
      return false
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  static async unsubscribeFromPush(employeeId: string): Promise<boolean> {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return false
      }

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (!subscription) {
        return true // Already unsubscribed
      }

      // Get endpoint before unsubscribing
      const endpoint = subscription.endpoint

      // Unsubscribe from browser
      await subscription.unsubscribe()

      // Remove subscription from server
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('session_token') || ''}`
        },
        body: JSON.stringify({ endpoint })
      })

      if (!response.ok) {
        console.warn('Failed to remove subscription from server')
      }

      return true
    } catch (error) {
      console.error('Error unsubscribing from push:', error)
      return false
    }
  }

  /**
   * Send a test notification
   */
  static async sendTestNotification(employeeId: string): Promise<void> {
    // Show local notification for testing
    if (Notification.permission === 'granted') {
      const notification = new Notification('Test Notification', {
        body: 'Push notifications are working!',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'test-notification',
        requireInteraction: false
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
      }
    }
  }

  /**
   * Send push notification to recipients
   */
  static async sendPushNotification(
    recipientIds: string[],
    notification: {
      title: string
      body: string
      icon?: string
      badge?: string
      tag?: string
      url?: string
      data?: any
    }
  ): Promise<{ success: boolean; sent?: number; failed?: number }> {
    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('session_token') || ''}`
        },
        body: JSON.stringify({ recipientIds, notification })
      })

      if (!response.ok) {
        throw new Error('Failed to send push notification')
      }

      const result = await response.json()
      return { success: true, ...result }
    } catch (error) {
      console.error('Error sending push notification:', error)
      return { success: false }
    }
  }

  /**
   * Convert VAPID key to Uint8Array for subscription
   */
  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }
}
