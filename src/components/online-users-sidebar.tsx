"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { UserPresence } from "../hooks/use-user-presence"
import { UserPresenceIndicator } from "./user-presence-indicator"

interface OnlineUsersSidebarProps {
  onlineUsers: UserPresence[]
  className?: string
}

export function OnlineUsersSidebar({ onlineUsers, className = "" }: OnlineUsersSidebarProps) {
  return (
    <div className={`bg-card border-l border-border ${className}`}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Online Now</h3>
          <Badge variant="secondary" className="text-xs">
            {onlineUsers.length}
          </Badge>
        </div>
      </div>

      <div className="p-2">
        {onlineUsers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">No one is online</p>
          </div>
        ) : (
          <div className="space-y-1">
            {onlineUsers.map((user) => (
              <div
                key={user.userId}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent cursor-pointer"
              >
                <div className="relative">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-muted text-xs">
                      {user.avatar || user.userName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5">
                    <UserPresenceIndicator status={user.status} size="sm" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.userName}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
