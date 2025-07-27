"use client"

import { useEffect, useRef, useState, useCallback } from "react"

interface Message {
  id: string
  content: string
  timestamp: number
  userId: string
  conversationId: string
}

interface TypingUser {
  userId: string
  userName: string
  conversationId: string
}

interface WebSocketHook {
  isConnected: boolean
  isOnline: boolean
  sendMessage: (message: Omit<Message, "id" | "timestamp">) => void
  messages: Message[]
  typingUsers: TypingUser[]
  startTyping: (conversationId: string) => void
  stopTyping: (conversationId: string) => void
  queuedMessages: Message[]
}

// Mock WebSocket for demo purposes to avoid parsing errors
export function useMockWebSocket(): WebSocketHook {
  const [isConnected, setIsConnected] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [queuedMessages, setQueuedMessages] = useState<Message[]>([])

  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    console.log("Mock WebSocket connecting...")

    // Simulate connection delay
    connectionTimeoutRef.current = setTimeout(() => {
      if (isOnline) {
        setIsConnected(true)
        console.log("Mock WebSocket connected")

        // Send queued messages when connection is restored
        queuedMessages.forEach((message) => {
          setMessages((prev) => {
            const withoutQueued = prev.filter((msg) => msg.id !== `queued-${message.id}`)
            return [...withoutQueued, message]
          })
        })
        setQueuedMessages([])
      }
    }, 1000)
  }, [isOnline, queuedMessages])

  const sendMessage = useCallback(
    (message: Omit<Message, "id" | "timestamp">) => {
      const fullMessage: Message = {
        ...message,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
      }

      if (isConnected && isOnline) {
        // Add message immediately
        setMessages((prev) => [...prev, fullMessage])

        // Simulate receiving a response from another user after a delay
        setTimeout(
          () => {
            const responses = [
              "That's interesting!",
              "I agree with that.",
              "Thanks for sharing!",
              "Good point!",
              "Let me think about that.",
            ]

            const randomResponse = responses[Math.floor(Math.random() * responses.length)]
            const responseMessage: Message = {
              id: Math.random().toString(36).substr(2, 9),
              content: randomResponse,
              timestamp: Date.now(),
              userId: "mock-user",
              conversationId: message.conversationId,
            }

            setMessages((prev) => [...prev, responseMessage])
          },
          2000 + Math.random() * 3000,
        ) // Random delay between 2-5 seconds
      } else {
        // Queue message for later sending
        setQueuedMessages((prev) => [...prev, fullMessage])
        setMessages((prev) => [...prev, { ...fullMessage, id: `queued-${fullMessage.id}` }])
      }
    },
    [isConnected, isOnline],
  )

  const startTyping = useCallback(
    (conversationId: string) => {
      if (isConnected) {
        // Simulate someone else typing
        setTimeout(() => {
          setTypingUsers((prev) => {
            const exists = prev.find((user) => user.userId === "mock-user" && user.conversationId === conversationId)
            if (!exists) {
              return [
                ...prev,
                {
                  userId: "mock-user",
                  userName: "John Doe",
                  conversationId,
                },
              ]
            }
            return prev
          })

          // Stop typing after a few seconds
          setTimeout(() => {
            setTypingUsers((prev) =>
              prev.filter((user) => !(user.userId === "mock-user" && user.conversationId === conversationId)),
            )
          }, 3000)
        }, 1000)
      }
    },
    [isConnected],
  )

  const stopTyping = useCallback((conversationId: string) => {
    // Mock implementation - in real app this would send to server
    console.log("Stopped typing in", conversationId)
  }, [])

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log("Device came online")
      setIsOnline(true)
      if (!isConnected) {
        connect()
      }
    }

    const handleOffline = () => {
      console.log("Device went offline")
      setIsOnline(false)
      setIsConnected(false)
    }

    // Check initial online status
    setIsOnline(navigator.onLine)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Initial connection attempt
    if (navigator.onLine) {
      connect()
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)

      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [connect])

  return {
    isConnected,
    isOnline,
    sendMessage,
    messages,
    typingUsers,
    startTyping,
    stopTyping,
    queuedMessages,
  }
}
