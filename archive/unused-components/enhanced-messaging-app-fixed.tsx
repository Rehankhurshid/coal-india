"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Search, MessageSquare, Users, Moon, Plus, Settings, Smile, Send, Menu, ArrowLeft, Phone, Video, MoreVertical, Bell, UserPlus } from "lucide-react"
import { useMockWebSocket } from "@/hooks/use-mock-websocket"
import { TypingIndicator } from "@/components/typing-indicator"
import { ConnectionStatus } from "@/components/connection-status"
import { useUserPresence } from "@/hooks/use-user-presence"
import { MessageStatusIndicator } from "./message-status-indicator"
import { GroupManagement } from "./group-management"
import { EditGroupPopup } from "./edit-group-popup"
import { UserList } from "./user-list"
import { useHaptic } from "@/hooks/use-haptic"
import { useSonnerToast } from "@/hooks/use-sonner-toast"
import { Toaster } from "sonner"
import { ErrorBoundary } from "./error-boundary"
import { MessageList } from "./messaging/message-bubble"
import { ChatInput } from "./messaging/chat-input"
import { MessageEditDialog, MessageDeleteDialog } from "./messaging/message-edit-dialog"
import { Message } from "@/types/messaging"

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  messageCount: number;
}

interface SidebarContentProps {
  isOnline: boolean;
  isConnected: boolean;
  queuedMessagesCount: number;
  onNewGroup: () => void;
  searchInput: string;
  onSearchChange: (value: string) => void;
  conversations: Conversation[];
  onConversationClick: () => void;
  searchQuery: string;
}

// Enhanced message format
const convertToMessage = (msg: any, currentUserId: string): Message => ({
  id: typeof msg.id === 'string' ? parseInt(msg.id.replace(/[^0-9]/g, '')) : msg.id,
  groupId: 1, // Mock group ID
  content: msg.content,
  senderId: msg.userId,
  senderName: msg.userId === currentUserId ? "You" : 
             msg.userId === "mock-user" ? "John Doe" : 
             msg.userId === "system" ? "System" : "User",
  messageType: 'text' as const,
  createdAt: new Date(msg.timestamp),
  status: msg.status || 'sent',
  readBy: [],
  reactions: [],
  editCount: 0,
  editedAt: undefined,
  deletedAt: undefined,
  replyToMessage: undefined
})

// Extracted SidebarContent to prevent re-renders on parent state changes
const SidebarContent = React.memo(({
  isOnline,
  isConnected,
  queuedMessagesCount,
  onNewGroup,
  searchInput,
  onSearchChange,
  conversations,
  onConversationClick,
  searchQuery,
}: SidebarContentProps) => {
  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Messages Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <MessageSquare className="w-5 h-5" />
          <span className="font-semibold">Messages</span>
          <div className="flex items-center gap-2">
            <ConnectionStatus isOnline={isOnline} isConnected={isConnected} queuedMessagesCount={queuedMessagesCount} />
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

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={onConversationClick}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer"
              >
                <div className="relative">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-sm font-medium">
                    {conv.avatar}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{conv.name}</p>
                    {conv.messageCount > 0 && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                        {conv.messageCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                </div>
              </div>
            ))
          ) : searchQuery && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No conversations found</p>
              <p className="text-xs">Try a different search term</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

SidebarContent.displayName = "SidebarContent";

export function EnhancedMessagingApp() {
  const [message, setMessage] = useState("")
  const [showChat, setShowChat] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [groupModalMode, setGroupModalMode] = useState<"create" | "edit">("create")
  const [showEditGroupModal, setShowEditGroupModal] = useState(false)
  const [editMessageDialog, setEditMessageDialog] = useState<{ open: boolean; message: Message | null }>({
    open: false,
    message: null
  })
  const [deleteMessageDialog, setDeleteMessageDialog] = useState<{ open: boolean; message: Message | null }>({
    open: false,
    message: null
  })
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { triggerHaptic } = useHaptic()
  const { success, error, info } = useSonnerToast()

  const { isConnected, isOnline, sendMessage, messages, typingUsers, startTyping, stopTyping, queuedMessages } =
    useMockWebSocket()

  const presenceHook = useUserPresence()
  
  // Mock online users since the hook structure is different
  const onlineUsers = [
    { id: "user1", name: "Alice Johnson", avatar: "AJ" },
    { id: "user2", name: "Bob Smith", avatar: "BS" },
    { id: "current-user", name: "You", avatar: "YO" },
  ]

  // Mock conversations for testing
  const conversations: Conversation[] = [
    {
      id: "ge",
      name: "General Discussion",
      avatar: "GE",
      lastMessage: "Let's finalize the project timeline.",
      messageCount: 3,
    },
    {
      id: "dev",
      name: "Development Team",
      avatar: "DT",
      lastMessage: "The new feature is ready for testing.",
      messageCount: 0,
    },
    {
      id: "hr",
      name: "HR Updates",
      avatar: "HR",
      lastMessage: "Welcome to the new team members!",
      messageCount: 1,
    },
  ]

  const searchQuery = searchInput.toLowerCase()
  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery)
  )

  const currentUserId = "current-user"

  // Convert WebSocket messages to enhanced Message format
  const enhancedMessages: Message[] = messages.map(msg => convertToMessage(msg, currentUserId))

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleConversationClick = () => {
    triggerHaptic("light")
    setShowChat(true)
    setSidebarOpen(false)
  }

  const handleBackClick = () => {
    triggerHaptic("light")
    setShowChat(false)
  }

  const handleSendMessage = (content: string, replyTo?: Message) => {
    if (content.trim()) {
      if (!isOnline) {
        triggerHaptic("heavy")
        error("Cannot send message", "You're currently offline. Please check your connection and try again.")
        return
      }

      triggerHaptic("light")
      
      sendMessage({
        content: content.trim(),
        userId: currentUserId,
        conversationId: "ge"
      })

      success("Message sent!")
      setReplyingTo(null)
    }
  }

  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/messaging/groups/ge/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      })

      if (!response.ok) throw new Error('Failed to add reaction')
      
      success(`Reacted with ${emoji}`)
      triggerHaptic("light")
    } catch (err) {
      error("Failed to add reaction", "Please try again.")
    }
  }

  const handleRemoveReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/messaging/groups/ge/messages/${messageId}/reactions`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      })

      if (!response.ok) throw new Error('Failed to remove reaction')
      
      info("Reaction removed")
      triggerHaptic("light")
    } catch (err) {
      error("Failed to remove reaction", "Please try again.")
    }
  }

  const handleReply = (message: Message) => {
    setReplyingTo(message)
    triggerHaptic("light")
  }

  const handleEdit = (message: Message) => {
    setEditMessageDialog({ open: true, message })
    triggerHaptic("light")
  }

  const handleDelete = (messageId: string) => {
    const message = enhancedMessages.find(m => m.id.toString() === messageId)
    if (message) {
      setDeleteMessageDialog({ open: true, message })
      triggerHaptic("medium")
    }
  }

  const handleSaveEdit = async (messageId: string, newContent: string) => {
    try {
      const response = await fetch(`/api/messaging/groups/ge/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent })
      })

      if (!response.ok) throw new Error('Failed to edit message')
      
      success("Message updated!")
      triggerHaptic("light")
    } catch (err) {
      error("Failed to edit message", "Please try again.")
      throw err
    }
  }

  const handleConfirmDelete = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messaging/groups/ge/messages/${messageId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete message')
      
      success("Message deleted")
      triggerHaptic("light")
    } catch (err) {
      error("Failed to delete message", "Please try again.")
      throw err
    }
  }

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
    success("Copied to clipboard!")
    triggerHaptic("light")
  }

  const handleNewGroup = useCallback(() => {
    triggerHaptic("light")
    setGroupModalMode("create")
    setShowGroupModal(true)
  }, [triggerHaptic])

  // Get typing users for current conversation
  const currentTypingUsers = typingUsers.filter(
    (user) => user.conversationId === "ge" && user.userId !== currentUserId,
  )

  return (
    <ErrorBoundary
      onError={(err, errorInfo) => {
        error("Messaging Error", "Something went wrong with the messaging system. Please try refreshing the page.")
        console.error("Enhanced messaging app error:", err, errorInfo)
      }}
    >
      <div className="h-full bg-background text-foreground">
        <div className="flex h-full">
          {/* Desktop Sidebar */}
          <div className="hidden md:block w-64 border-r border-border h-full">
            <SidebarContent 
              isOnline={isOnline}
              isConnected={isConnected}
              queuedMessagesCount={queuedMessages.length}
              onNewGroup={handleNewGroup}
              searchInput={searchInput}
              onSearchChange={setSearchInput}
              conversations={filteredConversations}
              onConversationClick={handleConversationClick}
              searchQuery={searchQuery}
            />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col h-full">
            {/* Desktop: Welcome Screen */}
            {!showChat && (
              <div className="hidden md:flex flex-1 items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Welcome to Coal India Directory Messaging</h3>
                  <p className="text-muted-foreground">Select a conversation to start chatting</p>
                </div>
              </div>
            )}

            {/* Mobile: Conversation List */}
            <div className={`md:hidden flex flex-col h-full ${showChat ? 'hidden' : 'flex'}`}>
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-background shrink-0">
                <div className="flex items-center space-x-2">
                  <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Menu className="w-4 h-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 p-0">
                      <SidebarContent 
                        isOnline={isOnline}
                        isConnected={isConnected}
                        queuedMessagesCount={queuedMessages.length}
                        onNewGroup={handleNewGroup}
                        searchInput={searchInput}
                        onSearchChange={setSearchInput}
                        conversations={filteredConversations}
                        onConversationClick={handleConversationClick}
                        searchQuery={searchQuery}
                      />
                    </SheetContent>
                  </Sheet>
                  <MessageSquare className="w-5 h-5" />
                  <h1 className="font-semibold">Messages</h1>
                </div>
                <div className="flex items-center space-x-2">
                  <ConnectionStatus isOnline={isOnline} isConnected={isConnected} queuedMessagesCount={queuedMessages.length} />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNewGroup}
                    className="h-8 w-8"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Mobile Search */}
              <div className="p-4 border-b border-border shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search conversations..." 
                    className="pl-10"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
              </div>

              {/* Mobile Conversation List */}
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-1 p-2">
                  {filteredConversations.length > 0 ? (
                    filteredConversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={handleConversationClick}
                        className="flex items-center space-x-3 p-4 rounded-lg hover:bg-accent cursor-pointer touch-manipulation"
                      >
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center text-sm font-medium">
                          {conv.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{conv.name}</p>
                            {conv.messageCount > 0 && (
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                                {conv.messageCount}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                        </div>
                      </div>
                    ))
                  ) : searchQuery ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No conversations found</p>
                      <p className="text-xs">Try a different search term</p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">No conversations yet</p>
                      <p className="text-xs">Start a new conversation</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chat View (Both Desktop and Mobile) */}
            {showChat && (
              <div className="flex flex-col h-full">
                {/* Chat Header */}
                <div className="flex items-center space-x-3 p-4 bg-background border-b border-border shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden text-muted-foreground hover:text-foreground"
                    onClick={handleBackClick}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>

                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-sm font-medium">
                    GE
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold">General Discussion</h2>
                    <p className="text-sm text-muted-foreground">45 members • {onlineUsers.length} online</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        triggerHaptic("light")
                        setShowEditGroupModal(true)
                      }}
                    >
                      <Settings className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto">
                  <div className="py-4">
                    <div className="flex justify-center mb-4">
                      <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">Today</span>
                    </div>

                    <MessageList
                      messages={enhancedMessages}
                      currentUserId={currentUserId}
                      onAddReaction={handleAddReaction}
                      onRemoveReaction={handleRemoveReaction}
                      onReply={handleReply}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onCopy={handleCopy}
                    />

                    {/* Typing Indicator */}
                    {currentTypingUsers.length > 0 && (
                      <div className="px-4 py-2">
                        <TypingIndicator
                          users={currentTypingUsers.map(u => ({
                            userId: u.userId,
                            userName: u.userId === "mock-user" ? "John Doe" : "User"
                          }))}
                        />
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Chat Input */}
                <div className="border-t border-border bg-background shrink-0">
                  <ChatInput
                    onSendMessage={handleSendMessage}
                    onTyping={(typing) => {
                      if (typing) {
                        startTyping("ge")
                      } else {
                        stopTyping("ge")
                      }
                    }}
                    replyToMessage={replyingTo}
                    onClearReply={() => setReplyingTo(null)}
                    disabled={!isOnline}
                    placeholder={isOnline ? "Type a message..." : "You're offline"}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dialogs */}
        <MessageEditDialog
          message={editMessageDialog.message}
          open={editMessageDialog.open}
          onOpenChange={(open) => setEditMessageDialog(prev => ({ ...prev, open }))}
          onSave={handleSaveEdit}
        />

        <MessageDeleteDialog
          message={deleteMessageDialog.message}
          open={deleteMessageDialog.open}
          onOpenChange={(open) => setDeleteMessageDialog(prev => ({ ...prev, open }))}
          onConfirm={handleConfirmDelete}
        />

        {/* Simplified for demo - Group modals would need proper implementation */}
        {showGroupModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Create New Group</h3>
              <p className="text-muted-foreground mb-4">Group creation functionality would be implemented here.</p>
              <Button onClick={() => setShowGroupModal(false)}>Close</Button>
            </div>
          </div>
        )}

        {showEditGroupModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Edit Group</h3>
              <p className="text-muted-foreground mb-4">Group editing functionality would be implemented here.</p>
              <Button onClick={() => setShowEditGroupModal(false)}>Close</Button>
            </div>
          </div>
        )}

        <Toaster />
      </div>
    </ErrorBoundary>
  )
}
