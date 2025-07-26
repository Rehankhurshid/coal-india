import { supabase } from '@/lib/supabase'

interface PushSubscription {
  endpoint: string
  p256dh: string
  auth: string
}

export class PushNotificationService {
  static urlBase64ToUint8Array(base64String: string): Uint8Array {
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

  static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.error('This browser does not support desktop notifications')
      return 'denied'
    }

    return await Notification.requestPermission()
  }

  static async subscribeToPush(employeeId: string): Promise<boolean> {
    try {
      // Check if service worker is supported
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.error('Push notifications are not supported')
        return false
      }

      // Request notification permission
      const permission = await this.requestPermission()
      if (permission !== 'granted') {
        console.log('Notification permission denied')
        return false
      }

      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready
      console.log('Service worker is ready')

      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription()
      if (existingSubscription) {
        console.log('Already subscribed, updating subscription')
        await existingSubscription.unsubscribe()
      }

      // Subscribe to push notifications
      // Note: You'll need to get a VAPID public key from your backend
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
      
      if (!vapidPublicKey) {
        console.error('VAPID public key not configured')
        return false
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      })

      console.log('Push subscription created:', subscription)

      // Extract subscription details
      const subscriptionJson = subscription.toJSON()
      const { endpoint, keys } = subscriptionJson
      
      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        throw new Error('Invalid subscription data')
      }

      // Save subscription to database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          employee_id: employeeId,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          platform: 'web',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'employee_id,endpoint'
        })

      if (error) {
        console.error('Error saving push subscription:', error)
        return false
      }

      console.log('Push subscription saved successfully')
      return true
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      return false
    }
  }

  static async unsubscribeFromPush(employeeId: string): Promise<boolean> {
    try {
      // Get current subscription
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        // Unsubscribe from browser
        await subscription.unsubscribe()
        
        // Remove from database
        const { error } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('employee_id', employeeId)
          .eq('endpoint', subscription.endpoint)

        if (error) {
          console.error('Error removing push subscription:', error)
          return false
        }
      }

      return true
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error)
      return false
    }
  }

  static async sendTestNotification(employeeId: string): Promise<void> {
    try {
      // Call the setup API endpoint for test notification
      const response = await fetch('/api/messaging/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ employeeId })
      })

      if (!response.ok) {
        throw new Error('Failed to send test notification')
      }

      console.log('Test notification sent')
    } catch (error) {
      console.error('Error sending test notification:', error)
      throw error
    }
  }

  // Send notification to specific users (called from backend typically)
  static async sendNotificationToUsers(
    userIds: string[], 
    notification: {
      title: string
      body: string
      icon?: string
      url?: string
      tag?: string
    }
  ): Promise<void> {
    // This would be called from your backend to send notifications
    // The backend would look up push subscriptions and send via FCM/Web Push
    console.log('Sending notification to users:', userIds, notification)
  }
}
