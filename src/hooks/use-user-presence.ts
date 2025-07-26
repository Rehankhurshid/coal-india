"use client"

import { useEffect, useState, useCallback } from "react"

export interface UserPresence {
  userId: string
  userName: string
  status: "online" | "offline" | "away" | "busy"
  lastSeen?: number
  avatar?: string
}

interface UserPresenceHook {
  userPresences: Map<string, UserPresence>
  updateUserStatus: (userId: string, status: UserPresence["status"]) => void
  getUserStatus: (userId: string) => UserPresence["status"]
  getOnlineUsers: () => UserPresence[]
}

// Mock user data
const mockUsers: UserPresence[] = [
  {
    userId: "john-doe",
    userName: "John Doe",
    status: "online",
    avatar: "JD",
  },
  {
    userId: "jane-smith",
    userName: "Jane Smith",
    status: "away",
    lastSeen: Date.now() - 300000, // 5 minutes ago
    avatar: "JS",
  },
  {
    userId: "mike-johnson",
    userName: "Mike Johnson",
    status: "offline",
    lastSeen: Date.now() - 3600000, // 1 hour ago
    avatar: "MJ",
  },
  {
    userId: "sarah-wilson",
    userName: "Sarah Wilson",
    status: "busy",
    avatar: "SW",
  },
  {
    userId: "alex-brown",
    userName: "Alex Brown",
    status: "online",
    avatar: "AB",
  },
  {
    userId: "emma-davis",
    userName: "Emma Davis",
    status: "offline",
    lastSeen: Date.now() - 7200000, // 2 hours ago
    avatar: "ED",
  },
]

export function useUserPresence(): UserPresenceHook {
  const [userPresences, setUserPresences] = useState<Map<string, UserPresence>>(new Map())

  // Initialize with mock data and simulate status changes
  useEffect(() => {
    const initialPresences = new Map<string, UserPresence>()
    mockUsers.forEach((user) => {
      initialPresences.set(user.userId, user)
    })
    setUserPresences(initialPresences)

    // Simulate random status changes
    const interval = setInterval(() => {
      setUserPresences((prev) => {
        const newPresences = new Map(prev)
        const users = Array.from(newPresences.values())

        if (users.length > 0) {
          const randomUser = users[Math.floor(Math.random() * users.length)]
          const statuses: UserPresence["status"][] = ["online", "offline", "away", "busy"]
          const currentStatus = randomUser.status
          const availableStatuses = statuses.filter((s) => s !== currentStatus)
          const newStatus = availableStatuses[Math.floor(Math.random() * availableStatuses.length)]

          newPresences.set(randomUser.userId, {
            ...randomUser,
            status: newStatus,
            lastSeen: newStatus === "offline" ? Date.now() : undefined,
          })
        }

        return newPresences
      })
    }, 10000) // Change status every 10 seconds

    return () => clearInterval(interval)
  }, [])

  const updateUserStatus = useCallback((userId: string, status: UserPresence["status"]) => {
    setUserPresences((prev) => {
      const newPresences = new Map(prev)
      const user = newPresences.get(userId)
      if (user) {
        newPresences.set(userId, {
          ...user,
          status,
          lastSeen: status === "offline" ? Date.now() : undefined,
        })
      }
      return newPresences
    })
  }, [])

  const getUserStatus = useCallback(
    (userId: string): UserPresence["status"] => {
      return userPresences.get(userId)?.status || "offline"
    },
    [userPresences],
  )

  const getOnlineUsers = useCallback((): UserPresence[] => {
    return Array.from(userPresences.values()).filter((user) => user.status === "online")
  }, [userPresences])

  return {
    userPresences,
    updateUserStatus,
    getUserStatus,
    getOnlineUsers,
  }
}
