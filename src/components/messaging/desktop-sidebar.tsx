"use client"

import React from "react"
import { MessageSquare, Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConnectionStatus } from "@/components/connection-status"
import { Group } from "@/types/messaging"
import { GroupListItem } from "./group-list-item"

interface DesktopSidebarProps {
  isOnline: boolean
  isConnected: boolean
  queuedMessagesCount: number
  searchInput: string
  onSearchChange: (value: string) => void
  groups: Group[]
  selectedGroupId: number | null
  onGroupClick: (groupId: number) => void
  onNewGroup: () => void
  searchQuery: string
}

export function DesktopSidebar({
  isOnline,
  isConnected,
  queuedMessagesCount,
  searchInput,
  onSearchChange,
  groups,
  selectedGroupId,
  onGroupClick,
  onNewGroup,
  searchQuery,
}: DesktopSidebarProps) {
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-full flex flex-col">
      {/* Messages Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            <span className="font-semibold">Messages</span>
          </div>
          <div className="flex items-center gap-2">
            <ConnectionStatus
              isOnline={isOnline}
              isConnected={isConnected}
              queuedMessagesCount={queuedMessagesCount}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={onNewGroup}
              className="h-8 w-8"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-10"
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <GroupListItem
                key={group.id}
                group={group}
                isSelected={selectedGroupId === group.id}
                onClick={() => onGroupClick(group.id)}
              />
            ))
          ) : searchQuery ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No conversations found</p>
              <p className="text-xs">Try a different search term</p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No groups yet</p>
              <p className="text-xs">Create your first group to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
