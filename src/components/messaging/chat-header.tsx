"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Settings } from "lucide-react"
import { Group } from "@/types/messaging"
import { RealtimeStatus } from "./realtime-status"
import { NotificationStatus } from "./notification-status"

interface ChatHeaderProps {
  group: Group
  onlineUsersCount: number
  isConnected: boolean
  onBackClick?: () => void
  onSettingsClick: () => void
  showBackButton?: boolean
}

export function ChatHeader({ 
  group, 
  onlineUsersCount,
  isConnected,
  onBackClick, 
  onSettingsClick,
  showBackButton = false
}: ChatHeaderProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex items-center space-x-3 p-4 bg-background border-b border-border shrink-0">
      {showBackButton && (
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-muted-foreground hover:text-foreground"
          onClick={onBackClick}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      )}

      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-sm font-medium">
        {getInitials(group.name)}
      </div>

      <div className="flex-1 min-w-0">
        <h2 className="font-semibold">{group.name}</h2>
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {group.memberCount} members • {onlineUsersCount} online
          </p>
          <RealtimeStatus isConnected={isConnected} />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <NotificationStatus showLabel={false} />
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          onClick={onSettingsClick}
        >
          <Settings className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}
