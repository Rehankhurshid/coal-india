"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { Message, Group } from '@/types/messaging'
import { wsManager } from '@/lib/websocket/websocket-manager'
import { offlineSyncManager } from '@/lib/websocket/offline-sync-manager'

interface UseWebSocketOptions {
  userId: string
  autoConnect?: boolean
}

interface WebSocketState {
  isConnected: boolean
  isConnecting: boolean
  connectionError: string | null
  lastConnected: Date | null
}

export function useWebSocket(options: UseWebSocketOptions) {
  const { userId, autoConnect = true } = options
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    lastConnected: null
  })

  useEffect(() => {
    if (!autoConnect) return

    const handleConnect = () => {
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        connectionError: null,
        lastConnected: new Date()
      }))
    }

    const handleDisconnect = () => {
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false
      }))
    }

    const handleConnecting = () => {
      setState(prev => ({
        ...prev,
        isConnecting: true,
        connectionError: null
      }))
    }

    const handleError = (error: string) => {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        connectionError: error
      }))
    }

    // Subscribe to WebSocket events
    wsManager.on('connected', handleConnect)
    wsManager.on('disconnected', handleDisconnect)
    wsManager.on('connecting', handleConnecting)
    wsManager.on('error', handleError)

    // Connect with userId
    wsManager.connect(userId)

    return () => {
      wsManager.off('connected', handleConnect)
      wsManager.off('disconnected', handleDisconnect)
      wsManager.off('connecting', handleConnecting)
      wsManager.off('error', handleError)
      wsManager.disconnect()
    }
  }, [userId, autoConnect])

  const connect = useCallback(() => {
    wsManager.connect(userId)
  }, [userId])

  const disconnect = useCallback(() => {
    wsManager.disconnect()
  }, [])

  const sendMessage = useCallback((type: string, payload: any) => {
    return wsManager.sendMessage({ type: type as any, payload })
  }, [])

  return {
    ...state,
    connect,
    disconnect,
    sendMessage
  }
}

interface UseRealTimeMessagesOptions {
  conversationId: string
  userId: string
  loadFromCache?: boolean
}

export function useRealTimeMessages(options: UseRealTimeMessagesOptions) {
  const { conversationId, userId, loadFromCache = true } = options
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  
  const messagesRef = useRef<Message[]>([])
  const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true)
      setError(null)

      try {
        // Try to load from cache first if offline or requested
        if (loadFromCache && (!navigator.onLine || loadFromCache)) {
          const cachedMessages = await offlineSyncManager.getCachedMessages(conversationId)
          if (cachedMessages.length > 0) {
            setMessages(cachedMessages)
            messagesRef.current = cachedMessages
            setLoading(false)
            
            // If online, still fetch fresh data in background
            if (navigator.onLine) {
              fetchMessagesFromAPI()
            }
            return
          }
        }

        // Load from API
        await fetchMessagesFromAPI()
      } catch (err) {
        console.error('Failed to load messages:', err)
        setError(err instanceof Error ? err.message : 'Failed to load messages')
        setLoading(false)
      }
    }

    const fetchMessagesFromAPI = async () => {
      const response = await fetch(`/api/messaging/groups/${conversationId}/messages`)
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`)
      }

      const data = await response.json()
      const newMessages = data.messages || []
      
      setMessages(newMessages)
      messagesRef.current = newMessages
      setHasMore(data.hasMore || false)
      setLoading(false)

      // Cache messages for offline use
      await offlineSyncManager.cacheMessages(conversationId, newMessages)
    }

    loadMessages()
  }, [conversationId, loadFromCache])

  // Handle incoming real-time messages
  useEffect(() => {
    const handleChatMessage = (data: any) => {
      if (data.conversationId !== conversationId) return

      const newMessage: Message = {
        id: parseInt(data.id) || Date.now(),
        content: data.content,
        senderId: data.senderId,
        groupId: parseInt(conversationId),
        messageType: 'text',
        status: 'sent',
        readBy: data.readBy || [],
        createdAt: new Date(data.timestamp),
        reactions: data.reactions || []
      }

      setMessages(prev => {
        const updated = [...prev, newMessage]
        messagesRef.current = updated
        
        // Update cache
        offlineSyncManager.cacheMessages(conversationId, updated)
        
        return updated
      })
    }

    const handleTyping = (data: any) => {
      if (data.conversationId !== conversationId) return
      if (data.userId === userId) return // Don't show own typing

      const { userId: typingUserId, isTyping } = data

      setTypingUsers(prev => {
        if (isTyping) {
          // Clear existing timeout for this user
          const existingTimeout = typingTimeouts.current.get(typingUserId)
          if (existingTimeout) {
            clearTimeout(existingTimeout)
          }

          // Set new timeout to remove typing indicator after 3 seconds
          const timeout = setTimeout(() => {
            setTypingUsers(current => current.filter(id => id !== typingUserId))
            typingTimeouts.current.delete(typingUserId)
          }, 3000)

          typingTimeouts.current.set(typingUserId, timeout)

          return prev.includes(typingUserId) ? prev : [...prev, typingUserId]
        } else {
          // Clear timeout and remove from typing
          const existingTimeout = typingTimeouts.current.get(typingUserId)
          if (existingTimeout) {
            clearTimeout(existingTimeout)
            typingTimeouts.current.delete(typingUserId)
          }

          return prev.filter(id => id !== typingUserId)
        }
      })
    }

    const handleReaction = (data: any) => {
      if (data.conversationId !== conversationId) return

      const { messageId, emoji, action, userId: reactorId } = data

      setMessages(prev => {
        const updated = prev.map(message => {
          if (message.id === messageId) {
            const reactions = message.reactions || []
            
            if (action === 'add') {
              // Add reaction if not already present
              const existingReactionIndex = reactions.findIndex(r => r.emoji === emoji && r.userId === reactorId)
              if (existingReactionIndex === -1) {
                reactions.push({
                  emoji,
                  userId: reactorId,
                  userName: 'User', // TODO: Get actual user name
                  createdAt: new Date()
                })
              }
            } else if (action === 'remove') {
              // Remove reaction
              const reactionIndex = reactions.findIndex(r => r.emoji === emoji && r.userId === reactorId)
              if (reactionIndex >= 0) {
                reactions.splice(reactionIndex, 1)
              }
            }

            return { ...message, reactions }
          }
          return message
        })

        messagesRef.current = updated
        
        // Update cache
        offlineSyncManager.cacheMessages(conversationId, updated)
        
        return updated
      })
    }

    // Subscribe to WebSocket events
    wsManager.on('chat', handleChatMessage)
    wsManager.on('typing', handleTyping)
    wsManager.on('reaction', handleReaction)

    return () => {
      wsManager.off('chat', handleChatMessage)
      wsManager.off('typing', handleTyping)
      wsManager.off('reaction', handleReaction)
      
      // Clear all typing timeouts
      typingTimeouts.current.forEach(timeout => clearTimeout(timeout))
      typingTimeouts.current.clear()
    }
  }, [conversationId, userId])

  const sendMessage = useCallback(async (content: string) => {
    try {
      if (navigator.onLine && wsManager.isConnected()) {
        // Send via WebSocket
        wsManager.sendMessage({
          type: 'chat',
          payload: {
            conversationId,
            content,
            senderId: userId,
            timestamp: Date.now()
          }
        })

        // Also send to API for persistence
        await fetch(`/api/messaging/groups/${conversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, userId })
        })
      } else {
        // Queue for offline sync
        await offlineSyncManager.queueMessage({
          content,
          conversationId,
          userId,
          timestamp: Date.now()
        })

        // Add optimistic update
        const tempMessage: Message = {
          id: Date.now(),
          content,
          senderId: userId,
          groupId: parseInt(conversationId),
          messageType: 'text',
          status: 'pending',
          readBy: [],
          createdAt: new Date(),
          reactions: []
        }

        setMessages(prev => [...prev, tempMessage])
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      throw err
    }
  }, [conversationId, userId])

  const sendTyping = useCallback((isTyping: boolean) => {
    if (wsManager.isConnected()) {
      wsManager.sendMessage({
        type: 'typing',
        payload: {
          conversationId,
          isTyping,
          userId
        }
      })
    }
  }, [conversationId, userId])

  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      // Send via WebSocket
      if (wsManager.isConnected()) {
        wsManager.sendMessage({
          type: 'reaction',
          payload: {
            conversationId,
            messageId,
            emoji,
            action: 'add',
            userId
          }
        })
      }

      // Update API
      await fetch(`/api/messaging/groups/${conversationId}/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji, userId })
      })
    } catch (err) {
      console.error('Failed to add reaction:', err)
      throw err
    }
  }, [conversationId, userId])

  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      // Send via WebSocket
      if (wsManager.isConnected()) {
        wsManager.sendMessage({
          type: 'reaction',
          payload: {
            conversationId,
            messageId,
            emoji,
            action: 'remove',
            userId
          }
        })
      }

      // Update API
      await fetch(`/api/messaging/groups/${conversationId}/messages/${messageId}/reactions`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji, userId })
      })
    } catch (err) {
      console.error('Failed to remove reaction:', err)
      throw err
    }
  }, [conversationId, userId])

  const markAsRead = useCallback(async () => {
    try {
      // Update API
      await fetch(`/api/messaging/groups/${conversationId}/messages`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'mark_read' })
      })

      // Update local state
      setMessages(prev => {
        const updated = prev.map(message => ({
          ...message,
          readBy: message.readBy.includes(userId) 
            ? message.readBy 
            : [...message.readBy, userId]
        }))

        messagesRef.current = updated
        
        // Update cache
        offlineSyncManager.cacheMessages(conversationId, updated)
        
        return updated
      })
    } catch (err) {
      console.error('Failed to mark messages as read:', err)
      throw err
    }
  }, [conversationId, userId])

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return

    try {
      setLoading(true)
      const oldestMessage = messages[0]
      const before = oldestMessage ? oldestMessage.createdAt.toISOString() : undefined

      const response = await fetch(
        `/api/messaging/groups/${conversationId}/messages?before=${before}&limit=20`
      )
      
      if (!response.ok) {
        throw new Error(`Failed to load more messages: ${response.statusText}`)
      }

      const data = await response.json()
      const newMessages = data.messages || []

      setMessages(prev => {
        const updated = [...newMessages, ...prev]
        messagesRef.current = updated
        
        // Update cache
        offlineSyncManager.cacheMessages(conversationId, updated)
        
        return updated
      })
      
      setHasMore(data.hasMore || false)
    } catch (err) {
      console.error('Failed to load more messages:', err)
      setError(err instanceof Error ? err.message : 'Failed to load more messages')
    } finally {
      setLoading(false)
    }
  }, [conversationId, messages, hasMore, loading])

  return {
    messages,
    loading,
    error,
    hasMore,
    typingUsers,
    sendMessage,
    sendTyping,
    addReaction,
    removeReaction,
    markAsRead,
    loadMore
  }
}

interface UseUserPresenceOptions {
  userId: string
}

export function useUserPresence(options: UseUserPresenceOptions) {
  const { userId } = options
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [userPresence, setUserPresence] = useState<Record<string, { isOnline: boolean; lastSeen: Date }>>({})

  useEffect(() => {
    const handlePresence = (data: any) => {
      const { userId: presenceUserId, isOnline, timestamp } = data

      setOnlineUsers(prev => {
        const updated = new Set(prev)
        if (isOnline) {
          updated.add(presenceUserId)
        } else {
          updated.delete(presenceUserId)
        }
        return updated
      })

      setUserPresence(prev => ({
        ...prev,
        [presenceUserId]: {
          isOnline,
          lastSeen: new Date(timestamp)
        }
      }))
    }

    // Subscribe to presence updates
    wsManager.on('presence', handlePresence)

    return () => {
      wsManager.off('presence', handlePresence)
    }
  }, [])

  const updatePresence = useCallback((isOnline: boolean) => {
    if (wsManager.isConnected()) {
      wsManager.sendMessage({
        type: 'presence',
        payload: {
          userId,
          isOnline,
          timestamp: Date.now()
        }
      })
    }
  }, [userId])

  const isUserOnline = useCallback((checkUserId: string) => {
    return onlineUsers.has(checkUserId)
  }, [onlineUsers])

  const getUserLastSeen = useCallback((checkUserId: string) => {
    return userPresence[checkUserId]?.lastSeen || null
  }, [userPresence])

  return {
    onlineUsers: Array.from(onlineUsers),
    isUserOnline,
    getUserLastSeen,
    updatePresence
  }
}
