'use client'

import { useEffect, useState } from 'react'
import { MessagingApiService } from '@/lib/services/messaging-api'

export function MessageDataDebug({ groupId }: { groupId: number }) {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMessages() {
      try {
        setLoading(true)
        const fetchedMessages = await MessagingApiService.getGroupMessages(groupId, 5)
        setMessages(fetchedMessages)
        console.log('Debug - Raw messages:', fetchedMessages)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [groupId])

  if (loading) return <div className="p-4 bg-blue-50">Loading messages...</div>
  if (error) return <div className="p-4 bg-red-50">Error: {error}</div>

  return (
    <div className="p-4 bg-gray-50 border rounded-lg">
      <h3 className="font-bold mb-2">Message Data Debug</h3>
      <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-60">
        {JSON.stringify(messages, null, 2)}
      </pre>
    </div>
  )
}
