"use client"

import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Users } from "lucide-react"
import type { UserPresence } from "../hooks/use-user-presence"
import { UserPresenceIndicator } from "./user-presence-indicator"

interface UserListProps {
  users: UserPresence[]
  onUserClick?: (user: UserPresence) => void
  className?: string
}

export function UserList({ users, onUserClick, className = "" }: UserListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | UserPresence["status"]>("all")

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.userName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getLastSeenText = (lastSeen?: number) => {
    if (!lastSeen) return ""

    const now = Date.now()
    const diff = now - lastSeen
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const statusCounts = users.reduce(
    (acc, user) => {
      acc[user.status] = (acc[user.status] || 0) + 1
      return acc
    },
    {} as Record<UserPresence["status"], number>,
  )

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span className="font-semibold">Team Members</span>
          <Badge variant="secondary" className="text-xs">
            {users.length}
          </Badge>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2 overflow-x-auto">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
            className="flex-shrink-0"
          >
            All ({users.length})
          </Button>
          <Button
            variant={statusFilter === "online" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("online")}
            className="flex-shrink-0"
          >
            <UserPresenceIndicator status="online" size="sm" className="mr-1" />
            Online ({statusCounts.online || 0})
          </Button>
          <Button
            variant={statusFilter === "away" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("away")}
            className="flex-shrink-0"
          >
            <UserPresenceIndicator status="away" size="sm" className="mr-1" />
            Away ({statusCounts.away || 0})
          </Button>
          <Button
            variant={statusFilter === "busy" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("busy")}
            className="flex-shrink-0"
          >
            <UserPresenceIndicator status="busy" size="sm" className="mr-1" />
            Busy ({statusCounts.busy || 0})
          </Button>
          <Button
            variant={statusFilter === "offline" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("offline")}
            className="flex-shrink-0"
          >
            <UserPresenceIndicator status="offline" size="sm" className="mr-1" />
            Offline ({statusCounts.offline || 0})
          </Button>
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pb-4">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.userId}
                  onClick={() => onUserClick?.(user)}
                  className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors ${
                    onUserClick ? "cursor-pointer" : ""
                  }`}
                >
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-muted text-sm font-medium">
                        {user.avatar || user.userName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                      <UserPresenceIndicator status={user.status} size="sm" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{user.userName}</p>
                      <UserPresenceIndicator status={user.status} showText size="sm" />
                    </div>
                    {user.status === "offline" && user.lastSeen && (
                      <p className="text-xs text-muted-foreground">Last seen {getLastSeenText(user.lastSeen)}</p>
                    )}
                    {user.status === "away" && <p className="text-xs text-muted-foreground">Away</p>}
                    {user.status === "busy" && <p className="text-xs text-muted-foreground">Do not disturb</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
