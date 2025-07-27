"use client"

import React, { useRef, useEffect } from "react"
import { Message, Group } from "@/types/messaging"
import { SimpleMessageList } from "./simple-message-bubble"
import { ChatInput } from "./chat-input"
import { TypingIndicator } from "@/components/typing-indicator"
import { ChatHeader } from "./chat-header"

interface ChatAreaProps {
  currentGroup: Group
  messages: Message[]
  currentUserId: string
  typingUsers: Array<{ userId: string; userName: string }>
  onlineUsersCount: number
  replyingTo: Message | null
  isOnline: boolean
  isConnected: boolean
  showBackButton?: boolean
  onBackClick?: () => void
  onSettingsClick: () => void
  onSendMessage: (content: string, replyTo?: Message) => void
  onTyping: (typing: boolean) => void
  onReply: (message: Message) => void
  onEdit: (message: Message) => void
  onDelete: (messageId: string) => void
  onCopy: (content: string) => void
  onClearReply: () => void
}

export function ChatArea({
  currentGroup,
  messages,
  currentUserId,
  typingUsers,
  onlineUsersCount,
  replyingTo,
  isOnline,
  isConnected,
  showBackButton = false,
  onBackClick,
  onSettingsClick,
  onSendMessage,
  onTyping,
  onReply,
  onEdit,
  onDelete,
  onCopy,
  onClearReply
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        group={currentGroup}
        onlineUsersCount={onlineUsersCount}
        isConnected={isConnected}
        onBackClick={onBackClick}
        onSettingsClick={onSettingsClick}
        showBackButton={showBackButton}
      />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No messages yet</p>
              <p className="text-sm">Send the first message to start the conversation</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">Today</span>
              </div>

              <SimpleMessageList
                messages={messages}
                currentUserId={currentUserId}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onCopy={onCopy}
              />
            </>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2 border-t border-border bg-background">
          <TypingIndicator users={typingUsers} />
        </div>
      )}

      {/* Chat Input */}
      <div className={`border-t border-border bg-background shrink-0`}>
        <ChatInput
          onSendMessage={onSendMessage}
          onTyping={onTyping}
          replyToMessage={replyingTo}
          onClearReply={onClearReply}
          disabled={!isOnline}
          placeholder={isOnline ? "Type a message..." : "You're offline"}
        />
      </div>
    </div>
  )
}
