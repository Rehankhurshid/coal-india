'use client'

import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { EnhancedMessagingAppRealData } from '@/components/enhanced-messaging-app-real-data'
import { useAuth } from '@/hooks/use-auth'
import { getCurrentUserId } from '@/lib/auth/client-auth'
import { Loader2 } from 'lucide-react'

export default function MessagingPage() {
  const { currentUserId, loading: authLoading } = useAuth()

  const handleDebugAuth = () => {
    console.log('--- Debug Auth Button Clicked ---')
    const userId = getCurrentUserId()
    const sessionData = localStorage.getItem('auth_session')
    
    console.log('Current User ID from getCurrentUserId():', userId)
    console.log('Raw auth_session from localStorage:', sessionData)

    if (sessionData) {
      try {
        const parsedSession = JSON.parse(sessionData)
        console.log('Parsed auth_session:', parsedSession)
        toast.info(
          `User ID: ${userId}. Session expires at: ${new Date(
            parsedSession.expiresAt
          ).toLocaleTimeString()}`
        )
      } catch (e) {
        console.error('Failed to parse auth_session:', e)
        toast.error('Failed to parse auth session from localStorage.')
      }
    } else {
      toast.warning('No auth_session found in localStorage.')
    }
    console.log('--- End Debug Auth ---')
  }

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!currentUserId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-red-500">Authentication error. Please log in again.</p>
      </div>
    )
  }

  return (
    <div className="h-full relative">
      <EnhancedMessagingAppRealData currentUserId={currentUserId} />
      
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 z-50">
          <Button onClick={handleDebugAuth} variant="outline" size="sm">
            Debug Auth
          </Button>
        </div>
      )}
    </div>
  )
}
