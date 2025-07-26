'use client'

import { EnhancedMessagingAppRealData } from '@/components/enhanced-messaging-app-real-data'
import { Bell, BellOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { useEffect } from 'react'

export default function MessagingPage() {
  const { permission, isSubscribed, isLoading, subscribe, unsubscribe, requestPermission } = usePushNotifications()

  useEffect(() => {
    // Check if service worker is supported
    if ('serviceWorker' in navigator) {
      // Service worker will be registered automatically by PWA plugin
      console.log('Service Worker supported')
    }
  }, [])

  const handleNotificationToggle = async () => {
    if (!permission || permission === 'default') {
      await requestPermission()
    } else if (permission === 'granted') {
      if (isSubscribed) {
        await unsubscribe()
      } else {
        await subscribe()
      }
    }
  }

  return (
    <div className="h-full relative"> {/* Use full height of the main container */}
      <EnhancedMessagingAppRealData />
      
      {/* Floating Notification Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleNotificationToggle}
          disabled={isLoading || permission === 'denied'}
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
          variant={isSubscribed ? "default" : "outline"}
        >
          {isSubscribed ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  )
}
