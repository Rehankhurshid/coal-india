'use client'

import { RealtimeChat } from '@/components/realtime-chat'
import { useState, useEffect } from 'react'

export default function RealtimeChatTestPage() {
  const [username, setUsername] = useState('')
  const [roomName, setRoomName] = useState('test-room')
  const [isJoined, setIsJoined] = useState(false)

  useEffect(() => {
    // Generate a random username if not set
    if (!username) {
      const randomId = Math.random().toString(36).substring(2, 8)
      setUsername(`User-${randomId}`)
    }
  }, [username])

  if (!isJoined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-auto p-6 space-y-4">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Real-time Chat Test</h1>
            <p className="text-muted-foreground">
              Test the Supabase real-time messaging functionality
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Your Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                placeholder="Enter your username"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Room Name
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                placeholder="Enter room name"
              />
            </div>
            
            <button
              onClick={() => setIsJoined(true)}
              disabled={!username.trim() || !roomName.trim()}
              className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Join Chat Room
            </button>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>💡 Open this page in multiple tabs to test real-time messaging!</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div>
            <h1 className="text-lg font-semibold">Real-time Chat: {roomName}</h1>
            <p className="text-sm text-muted-foreground">Logged in as: {username}</p>
          </div>
          <button
            onClick={() => setIsJoined(false)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Leave Room
          </button>
        </div>
      </div>
      
      <div className="flex-1 max-w-4xl mx-auto w-full">
        <RealtimeChat
          roomName={roomName}
          username={username}
          onMessage={(messages) => {
            console.log('Messages updated:', messages)
          }}
        />
      </div>
    </div>
  )
}
