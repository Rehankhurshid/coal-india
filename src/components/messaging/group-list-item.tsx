"use client"

import React from "react"
import { Group } from "@/types/messaging"

interface GroupListItemProps {
  group: Group
  isSelected: boolean
  onClick: (groupId: number) => void
}

export function GroupListItem({ group, isSelected, onClick }: GroupListItemProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div
      onClick={() => onClick(group.id)}
      className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer ${
        isSelected ? 'bg-accent' : ''
      }`}
    >
      <div className="relative">
        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-sm font-medium">
          {getInitials(group.name)}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="font-medium truncate">{group.name}</p>
          {(group.unreadCount || 0) > 0 && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
              {group.unreadCount}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {group.lastMessage || 'No messages yet'}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {group.memberCount || 0} {group.memberCount === 1 ? 'member' : 'members'}
        </p>
      </div>
    </div>
  )
}
