"use client"

import React from "react"
import { MessageSquare } from "lucide-react"
import { Group } from "@/types/messaging"
import { GroupListItem } from "./group-list-item"

interface GroupListProps {
  groups: Group[]
  selectedGroupId: number | null
  searchQuery: string
  onGroupClick: (groupId: number) => void
}

export function GroupList({ groups, selectedGroupId, searchQuery, onGroupClick }: GroupListProps) {
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (searchQuery && filteredGroups.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No conversations found</p>
        <p className="text-xs">Try a different search term</p>
      </div>
    )
  }

  if (!searchQuery && groups.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm">No groups yet</p>
        <p className="text-xs">Create your first group to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {filteredGroups.map((group) => (
        <GroupListItem
          key={group.id}
          group={group}
          isSelected={selectedGroupId === group.id}
          onClick={onGroupClick}
        />
      ))}
    </div>
  )
}
