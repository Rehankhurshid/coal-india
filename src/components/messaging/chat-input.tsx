"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ReactionPicker } from './reaction-picker'
import { cn } from '@/lib/utils'
import { 
  Send, 
  Paperclip, 
  Smile, 
  X,
  AtSign,
  Hash
} from 'lucide-react'
import { Message } from '@/types/messaging'

interface ChatInputProps {
  onSendMessage: (content: string, replyTo?: Message) => void
  onTyping?: (isTyping: boolean) => void
  replyToMessage?: Message | null
  onClearReply?: () => void
  placeholder?: string
  disabled?: boolean
  maxLength?: number
  className?: string
}

export function ChatInput({
  onSendMessage,
  onTyping,
  replyToMessage,
  onClearReply,
  placeholder = "Type a message...",
  disabled = false,
  maxLength = 2000,
  className
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [message])

  // Handle typing indicator
  useEffect(() => {
    if (message.trim() && !isTyping) {
      setIsTyping(true)
      onTyping?.(true)
    } else if (!message.trim() && isTyping) {
      setIsTyping(false)
      onTyping?.(false)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    if (message.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false)
        onTyping?.(false)
      }, 3000)
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [message, isTyping, onTyping])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isTyping) {
        onTyping?.(false)
      }
    }
  }, [isTyping, onTyping])

  const handleSend = () => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage || disabled) return

    onSendMessage(trimmedMessage, replyToMessage || undefined)
    setMessage('')
    setIsTyping(false)
    onTyping?.(false)
    
    // Clear reply
    if (replyToMessage && onClearReply) {
      onClearReply()
    }

    // Focus back on textarea
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow new line with Shift+Enter
        return
      } else {
        // Send message with Enter
        e.preventDefault()
        handleSend()
      }
    }

    if (e.key === 'Escape' && replyToMessage) {
      onClearReply?.()
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
    textareaRef.current?.focus()
  }

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newMessage = message.slice(0, start) + text + message.slice(end)
    
    setMessage(newMessage)
    
    // Restore cursor position
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length
      textarea.focus()
    }, 0)
  }

  const handleMentionClick = () => {
    insertAtCursor('@')
  }

  const handleChannelClick = () => {
    insertAtCursor('#')
  }

  return (
    <div className={cn("border-t bg-background", className)}>
      {/* Reply Banner */}
      {replyToMessage && (
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-b">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Replying to {replyToMessage.senderName || 'Unknown User'}
              </span>
              <Badge variant="secondary" className="text-xs">
                Reply
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground truncate mt-1">
              {replyToMessage.content}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onClearReply}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2 p-4">
        {/* Quick Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleMentionClick}
            title="Mention someone"
          >
            <AtSign className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleChannelClick}
            title="Reference channel"
          >
            <Hash className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        </div>

        {/* Text Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            className={cn(
              "min-h-[40px] max-h-32 resize-none border-0 shadow-none focus-visible:ring-0",
              "bg-muted rounded-lg px-3 py-2"
            )}
            rows={1}
          />
          
          {/* Character Count */}
          {message.length > maxLength * 0.8 && (
            <div className="absolute bottom-1 right-2 text-xs text-muted-foreground">
              {message.length}/{maxLength}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Emoji Picker */}
          <ReactionPicker
            onReactionSelect={handleEmojiSelect}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Add emoji"
              >
                <Smile className="h-4 w-4" />
              </Button>
            }
          />

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            size="sm"
            className="h-8 w-8 p-0"
            title="Send message (Enter)"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex justify-between items-center px-4 pb-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {isTyping && (
            <span className="flex items-center gap-1">
              <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
              Typing...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span>Press Shift+Enter for new line</span>
          {replyToMessage && (
            <span>• Press Escape to cancel reply</span>
          )}
        </div>
      </div>
    </div>
  )
}

// Typing indicator component for showing other users typing
interface TypingIndicatorProps {
  typingUsers: string[]
  className?: string
}

export function TypingIndicator({ typingUsers, className }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0]} is typing...`
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0]} and ${typingUsers[1]} are typing...`
    } else {
      return `${typingUsers.length} people are typing...`
    }
  }

  return (
    <div className={cn("flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground", className)}>
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
      </div>
      <span>{getTypingText()}</span>
    </div>
  )
}
