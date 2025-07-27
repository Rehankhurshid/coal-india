"use client"

import React from "react"
import { MessageSquare, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WelcomeScreenProps {
  hasGroups: boolean
  onNewGroup?: () => void
}

export function WelcomeScreen({ hasGroups, onNewGroup }: WelcomeScreenProps) {
  return (
    <div className="hidden md:flex flex-1 items-center justify-center">
      <div className="text-center">
        <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Welcome to Coal India Directory Messaging</h3>
        <p className="text-muted-foreground mb-4">
          {hasGroups ? 'Select a conversation to start chatting' : 'Create a group to get started'}
        </p>
        {!hasGroups && onNewGroup && (
          <Button onClick={onNewGroup} className="gap-2">
            <Plus className="w-4 h-4" />
            Create New Group
          </Button>
        )}
      </div>
    </div>
  )
}
