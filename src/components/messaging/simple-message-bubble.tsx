"use client"

import React, { useState } from 'react'
import { Message } from '@/types/messaging'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { 
  MoreVertical, 
  Reply, 
  Edit, 
  Trash2, 
  Copy,
  Forward
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface SimpleMessageBubbleProps {
  message: Message
  currentUserId: string
  isOwn?: boolean
  showAvatar?: boolean
  onReply?: (message: Message) => void
  onEdit?: (message: Message) => void
  onDelete?: (messageId: string) => void
  onCopy?: (content: string) => void
}

export function SimpleMessageBubble({
  message,
  currentUserId,
  isOwn = false,
  showAvatar = true,
  onReply,
  onEdit,
  onDelete,
  onCopy
}: SimpleMessageBubbleProps) {
  const [showActions, setShowActions] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatTimestamp = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true })
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    onCopy?.(message.content)
  }

  if (isOwn) {
    // Your messages - right aligned
    return (
      <div 
        className="flex justify-end px-4 py-2 group hover:bg-muted/30 transition-colors"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="flex flex-row-reverse items-start gap-3 max-w-md">
          {showAvatar && (
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {getInitials(message.senderName || 'You')}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="flex flex-col items-end">
            {/* Reply Context */}
            {message.replyToMessage && (
              <div className="mb-2 pr-3 border-r-2 border-muted text-right">
                <div className="text-xs text-muted-foreground">
                  Replying to {message.replyToMessage.senderName}
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {message.replyToMessage.content}
                </div>
              </div>
            )}
            
            <div className="bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm">
              {message.content}
              
              {/* Message Status */}
              <div className="flex items-center justify-end gap-1 mt-1 text-xs text-primary-foreground/70">
                {message.status === 'pending' && <span>⏳</span>}
                {message.status === 'sent' && <span>✓</span>}
                {message.status === 'delivered' && <span>✓✓</span>}
                {message.status === 'read' && <span className="text-blue-300">✓✓</span>}
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                {formatTimestamp(message.createdAt)}
              </span>
              {message.editedAt && (
                <Badge variant="secondary" className="text-xs">
                  edited
                </Badge>
              )}
            </div>
          </div>
          
          {/* Message Actions */}
          <div className="flex items-center gap-1">
            {onReply && (showActions || dropdownOpen) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onReply(message)}
                title="Reply"
              >
                <Reply className="h-3 w-3" />
              </Button>
            )}

            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-6 w-6 p-0 transition-all",
                    dropdownOpen || showActions ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[140px]">
                {onReply && (
                  <>
                    <DropdownMenuItem onClick={() => {
                      onReply(message)
                      setDropdownOpen(false)
                    }}>
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                
                <DropdownMenuItem onClick={() => {
                  handleCopy()
                  setDropdownOpen(false)
                }}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy text
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => setDropdownOpen(false)}>
                  <Forward className="h-4 w-4 mr-2" />
                  Forward
                </DropdownMenuItem>
                
                {(onEdit || onDelete) && <DropdownMenuSeparator />}
                {onEdit && (
                  <DropdownMenuItem onClick={() => {
                    onEdit(message)
                    setDropdownOpen(false)
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => {
                      onDelete(message.id.toString())
                      setDropdownOpen(false)
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    )
  }

  // Other users' messages - left aligned
  return (
    <div 
      className="flex justify-start px-4 py-2 group hover:bg-muted/30 transition-colors"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-3 max-w-md">
        {showAvatar && (
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-muted text-foreground text-xs">
              {getInitials(message.senderName || 'User')}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{message.senderName}</span>
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(message.createdAt)}
            </span>
            {message.editedAt && (
              <Badge variant="secondary" className="text-xs">
                edited
              </Badge>
            )}
          </div>
          
          {/* Reply Context */}
          {message.replyToMessage && (
            <div className="mb-2 pl-3 border-l-2 border-muted">
              <div className="text-xs text-muted-foreground">
                Replying to {message.replyToMessage.senderName}
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {message.replyToMessage.content}
              </div>
            </div>
          )}
          
          <div className="bg-muted rounded-lg px-3 py-2 text-sm">
            {message.content}
          </div>
        </div>
        
        {/* Message Actions */}
        <div className="flex items-center gap-1">
          {onReply && (showActions || dropdownOpen) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onReply(message)}
              title="Reply"
            >
              <Reply className="h-3 w-3" />
            </Button>
          )}

          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-6 w-6 p-0 transition-all",
                  dropdownOpen || showActions ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
              {onReply && (
                <>
                  <DropdownMenuItem onClick={() => {
                    onReply(message)
                    setDropdownOpen(false)
                  }}>
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              
              <DropdownMenuItem onClick={() => {
                handleCopy()
                setDropdownOpen(false)
              }}>
                <Copy className="h-4 w-4 mr-2" />
                Copy text
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setDropdownOpen(false)}>
                <Forward className="h-4 w-4 mr-2" />
                Forward
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

interface SimpleMessageListProps {
  messages: Message[]
  currentUserId: string
  onReply?: (message: Message) => void
  onEdit?: (message: Message) => void
  onDelete?: (messageId: string) => void
  onCopy?: (content: string) => void
  className?: string
}

export function SimpleMessageList({
  messages,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onCopy,
  className
}: SimpleMessageListProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {messages.map((message, index) => {
        const isOwn = message.senderId === currentUserId || message.senderName === "You"
        const prevMessage = messages[index - 1]
        const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId
        
        return (
          <SimpleMessageBubble
            key={message.id}
            message={message}
            currentUserId={currentUserId}
            isOwn={isOwn}
            showAvatar={showAvatar}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
            onCopy={onCopy}
          />
        )
      })}
    </div>
  )
}
