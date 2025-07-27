'use client'

import { RealtimeChat } from '@/components/realtime-chat'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RealtimeChatTestPage() {
  const { employee, loading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated || !employee) return null

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Real-time Chat Test</CardTitle>
          <CardDescription>
            This uses Supabase Broadcast channels - works without database replication!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>✅ Real-time messaging using Broadcast channels</p>
            <p>✅ No database replication needed</p>
            <p>✅ Low latency updates</p>
            <p>✅ Works on free Supabase tier</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="h-[600px]">
            <RealtimeChat 
              roomName="coal-india-test-room" 
              username={employee.emp_code || 'Anonymous'} 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
