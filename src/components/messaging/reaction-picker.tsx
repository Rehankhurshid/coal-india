"use client"

import React, { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ReactionPickerProps {
  onReactionSelect: (emoji: string) => void
  trigger?: React.ReactNode
  className?: string
}

const COMMON_EMOJIS = [
  '👍', '👎', '❤️', '😂', '😮', '😢', '😡', '🎉', '👏', '🔥',
  '💯', '✨', '🤔', '😍', '🤩', '😊', '😎', '🙏', '👌', '💪'
]

const EMOJI_CATEGORIES = {
  'Reactions': ['👍', '👎', '❤️', '😂', '😮', '😢', '😡'],
  'Celebration': ['🎉', '👏', '🔥', '💯', '✨', '🥳', '🎊'],
  'Faces': ['😊', '😍', '🤩', '😎', '🤔', '😴', '🤗', '😇'],
  'Gestures': ['🙏', '👌', '💪', '👋', '✊', '🤞', '🤟', '🤲']
}

export function ReactionPicker({ onReactionSelect, trigger, className }: ReactionPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Reactions')
  const [open, setOpen] = useState(false)

  const handleEmojiClick = (emoji: string) => {
    onReactionSelect(emoji)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0 hover:bg-muted", className)}
          >
            <span className="text-lg">😊</span>
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start" side="top">
        <div className="p-4">
          {/* Header */}
          <div className="mb-4">
            <h3 className="font-medium text-sm text-foreground">Add Reaction</h3>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1 mb-4 border-b">
            {Object.keys(EMOJI_CATEGORIES).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-3 py-2 text-xs font-medium transition-colors border-b-2 border-transparent",
                  selectedCategory === category
                    ? "text-primary border-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Quick Reactions (Always visible) */}
          <div className="mb-4">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Quick Reactions</h4>
            <div className="grid grid-cols-7 gap-1">
              {COMMON_EMOJIS.slice(0, 7).map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className="p-2 text-lg hover:bg-muted rounded-md transition-colors flex items-center justify-center"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Category Emojis */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">{selectedCategory}</h4>
            <div className="grid grid-cols-7 gap-1 max-h-32 overflow-y-auto">
              {EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className="p-2 text-lg hover:bg-muted rounded-md transition-colors flex items-center justify-center"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface MessageReactionsProps {
  reactions: Record<string, { userId: string; userName: string }[]>
  currentUserId: string
  onAddReaction: (emoji: string) => void
  onRemoveReaction: (emoji: string) => void
  className?: string
}

export function MessageReactions({
  reactions,
  currentUserId,
  onAddReaction,
  onRemoveReaction,
  className
}: MessageReactionsProps) {
  const hasReactions = Object.keys(reactions).length > 0

  if (!hasReactions) {
    return null
  }

  return (
    <div className={cn("flex flex-wrap gap-1 mt-2", className)}>
      {Object.entries(reactions).map(([emoji, users]) => {
        const hasUserReacted = users.some(user => user.userId === currentUserId)
        const count = users.length

        return (
          <button
            key={emoji}
            onClick={() => hasUserReacted ? onRemoveReaction(emoji) : onAddReaction(emoji)}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors",
              hasUserReacted
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-muted hover:bg-muted/80 text-muted-foreground border border-transparent"
            )}
            title={`${users.map(u => u.userName).join(', ')} reacted with ${emoji}`}
          >
            <span>{emoji}</span>
            <span className="font-medium">{count}</span>
          </button>
        )
      })}
    </div>
  )
}

// Combined component for easy use in messages
interface MessageReactionSystemProps {
  messageId: string
  reactions?: Record<string, { userId: string; userName: string }[]>
  currentUserId: string
  onAddReaction: (messageId: string, emoji: string) => void
  onRemoveReaction: (messageId: string, emoji: string) => void
  showPicker?: boolean
  className?: string
}

export function MessageReactionSystem({
  messageId,
  reactions = {},
  currentUserId,
  onAddReaction,
  onRemoveReaction,
  showPicker = true,
  className
}: MessageReactionSystemProps) {
  const handleAddReaction = (emoji: string) => {
    onAddReaction(messageId, emoji)
  }

  const handleRemoveReaction = (emoji: string) => {
    onRemoveReaction(messageId, emoji)
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Existing Reactions */}
      <MessageReactions
        reactions={reactions}
        currentUserId={currentUserId}
        onAddReaction={handleAddReaction}
        onRemoveReaction={handleRemoveReaction}
      />
      
      {/* Add Reaction Button */}
      {showPicker && (
        <ReactionPicker
          onReactionSelect={handleAddReaction}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        />
      )}
    </div>
  )
}
