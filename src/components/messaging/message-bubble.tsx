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

interface MessageBubbleProps {
  message: Message
  currentUserId: string
  isOwn?: boolean
  showAvatar?: boolean
  showTimestamp?: boolean
  onReply?: (message: Message) => void
  onEdit?: (message: Message) => void
  onDelete?: (messageId: string) => void
  onCopy?: (content: string) => void
  className?: string
}

export function MessageBubble({
  message,
  currentUserId,
  isOwn = false,
  showAvatar = true,
  showTimestamp = true,
  onReply,
  onEdit,
  onDelete,
  onCopy,
  className
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    onCopy?.(message.content)
  }

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

  return (
    <div
      className={cn(
        "group flex gap-3 px-4 py-2 hover:bg-muted/30 transition-colors",
        isOwn && "flex-row-reverse",
        className
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      {showAvatar && (
        <div className={cn("flex-shrink-0", isOwn && "order-2")}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={`/api/placeholder/32/32`} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {getInitials(message.senderName || 'User')}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Message Content */}
      <div className={cn("flex-1 min-w-0", isOwn && "order-1")}>
        {/* Header */}
        <div className={cn(
          "flex items-center gap-2 mb-1",
          isOwn && "flex-row-reverse"
        )}>
          {!isOwn && (
            <span className="font-medium text-sm text-foreground">
              {message.senderName || 'Unknown User'}
            </span>
          )}
          {showTimestamp && (
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(message.createdAt)}
            </span>
          )}
          {message.editedAt && (
            <Badge variant="secondary" className="text-xs">
              edited
            </Badge>
          )}
        </div>

        {/* Reply Context */}
        {message.replyToMessage && (
          <div className={cn(
            "mb-2 pl-3 border-l-2 border-muted",
            isOwn && "border-r-2 border-l-0 pr-3 pl-0 text-right"
          )}>
            <div className="text-xs text-muted-foreground">
              Replying to {message.replyToMessage.senderName}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {message.replyToMessage.content}
            </div>
          </div>
        )}

        {/* Message Bubble */}
        <div className={cn(
          "relative max-w-md rounded-lg px-3 py-2 text-sm",
          isOwn
            ? "bg-primary text-primary-foreground ml-auto"
            : "bg-muted"
        )}>
          {/* Message Content */}
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>

          {/* Message Status */}
          {isOwn && (
            <div className={cn(
              "flex items-center justify-end gap-1 mt-1 text-xs",
              "text-primary-foreground/70"
            )}>
              {message.status === 'pending' && (
                <span>⏳</span>
              )}
              {message.status === 'sent' && (
                <span>✓</span>
              )}
              {message.status === 'delivered' && (
                <span>✓✓</span>
              )}
              {message.status === 'read' && (
                <span className="text-blue-300">✓✓</span>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Message Actions */}
      {showActions && (
        <div className={cn(
          "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
          isOwn && "order-3"
        )}>
          {onReply && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onReply(message)}
              title="Reply"
            >
              <Reply className="h-3 w-3" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onReply && (
                <>
                  <DropdownMenuItem onClick={() => onReply(message)}>
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              
              <DropdownMenuItem onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" />
                Copy text
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <Forward className="h-4 w-4 mr-2" />
                Forward
              </DropdownMenuItem>
              
              {isOwn && (
                <>
                  <DropdownMenuSeparator />
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(message)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={() => onDelete(message.id.toString())}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}

// Message list component
interface MessageListProps {
  messages: Message[]
  currentUserId: string
  onReply?: (message: Message) => void
  onEdit?: (message: Message) => void
  onDelete?: (messageId: string) => void
  onCopy?: (content: string) => void
  className?: string
}

export function MessageList({
  messages,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onCopy,
  className
}: MessageListProps) {
  console.log('MessageList currentUserId:', currentUserId)
  console.log('All messages:', messages.map(m => ({ id: m.id, senderId: m.senderId, content: m.content.slice(0, 20) })))
  
  return (
    <div className={cn("flex flex-col", className)}>
      {messages.map((message, index) => {
        // Multiple ways to determine if message is own
        const normalizedSenderId = String(message.senderId).trim()
        const normalizedCurrentUserId = String(currentUserId).trim()
        const isOwnByComparison = normalizedSenderId === normalizedCurrentUserId
        const isOwnByName = message.senderName === "You"
        const isOwnByRecentSend = index === messages.length - 1 && message.senderName === "You"
        
        // Use multiple checks to ensure proper detection - prioritize senderName check
        const isOwn = isOwnByName || isOwnByComparison || isOwnByRecentSend
        
        // FINAL TEST: Force any message with "You" as sender to be own
        const finalIsOwn = message.senderName === "You" ? true : isOwn
        
        console.log(`Message ${index}:`, {
          senderId: message.senderId,
          senderName: message.senderName,
          currentUserId,
          normalizedSenderId,
          normalizedCurrentUserId,
          isOwnByComparison,
          isOwnByName,
          isOwnByRecentSend,
          finalIsOwn: finalIsOwn,
          content: message.content
        })
        
        const prevMessage = messages[index - 1]
        const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId
        
        // FORCE TEST: Make ALL messages appear on right to test CSS
        const forceOwn = true
        
        return (
          <MessageBubble
            key={message.id}
            message={message}
            currentUserId={currentUserId}
            isOwn={forceOwn}
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
