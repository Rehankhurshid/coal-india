"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Search, MessageSquare, Users, Moon, Plus, Settings, Send, Menu, ArrowLeft, Phone, Video, MoreVertical, Bell, UserPlus } from "lucide-react"
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
import { SimpleMessageList } from "./messaging/simple-message-bubble"
import { ChatInput } from "./messaging/chat-input"
import { MessageEditDialog, MessageDeleteDialog } from "./messaging/message-edit-dialog"
import { Message, Group } from "@/types/messaging"
import { useMessaging } from "@/hooks/use-messaging"
import { useAuth } from '@/hooks/use-auth'

interface SidebarContentProps {
  isOnline: boolean;
  isConnected: boolean;
  queuedMessagesCount: number;
  onNewGroup: () => void;
  searchInput: string;
  onSearchChange: (value: string) => void;
  groups: Group[];
  selectedGroupId: number | null;
  onGroupClick: (groupId: number) => void;
  searchQuery: string;
}

// Extracted SidebarContent to prevent re-renders on parent state changes
const SidebarContent = React.memo(({
  isOnline,
  isConnected,
  queuedMessagesCount,
  onNewGroup,
  searchInput,
  onSearchChange,
  groups,
  selectedGroupId,
  onGroupClick,
  searchQuery,
}: SidebarContentProps) => {
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

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

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <div
                key={group.id}
                onClick={() => onGroupClick(group.id)}
                className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer ${
                  selectedGroupId === group.id ? 'bg-accent' : ''
                }`}
              >
                <div className="relative">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-sm font-medium">
                    {getInitials(group.name)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
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
                </div>
              </div>
            ))
          ) : searchQuery && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No conversations found</p>
              <p className="text-xs">Try a different search term</p>
            </div>
          )}
          
          {!searchQuery && groups.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No groups yet</p>
              <p className="text-xs">Create your first group to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

SidebarContent.displayName = "SidebarContent";

interface EnhancedMessagingAppRealDataProps {
  currentUserId: string;
}

export function EnhancedMessagingAppRealData({ currentUserId }: EnhancedMessagingAppRealDataProps) {
  const [showChat, setShowChat] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchInput, setSearchInput] = useState("")
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
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { triggerHaptic } = useHaptic()
  const { success, error, info } = useSonnerToast()

  const {
    groups,
    currentGroup,
    messages,
    loading,
    error: messagingError,
    typingUsers,
    loadGroups,
    createGroup,
    selectGroup,
    sendMessage,
    editMessage,
    deleteMessage,
    markMessagesAsRead,
    clearError,
    sendTypingIndicator
  } = useMessaging(currentUserId)

  const presenceHook = useUserPresence()
  
  // Get online users count (mock for now)
  const onlineUsersCount = 3

  const searchQuery = searchInput.toLowerCase()

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-select first group on desktop if none selected
  useEffect(() => {
    if (!selectedGroupId && groups.length > 0 && window.innerWidth >= 768) {
      handleGroupClick(groups[0].id)
    }
  }, [groups])

  const handleGroupClick = async (groupId: number) => {
    triggerHaptic("light")
    setSelectedGroupId(groupId)
    setShowChat(true)
    setSidebarOpen(false)
    
    try {
      await selectGroup(groupId)
    } catch (error) {
      console.error('Failed to select group:', error)
    }
  }

  const handleBackClick = () => {
    triggerHaptic("light")
    setShowChat(false)
  }

  const handleSendMessage = async (content: string, replyTo?: Message) => {
    if (content.trim() && currentGroup) {
      triggerHaptic("light")
      
      try {
        await sendMessage({
          content: content.trim(),
          messageType: 'text',
          replyToId: replyTo?.id
        })
        
        setReplyingTo(null)
      } catch (err) {
        error("Failed to send message", "Please try again.")
      }
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
    const message = messages.find(m => m.id.toString() === messageId)
    if (message) {
      setDeleteMessageDialog({ open: true, message })
      triggerHaptic("medium")
    }
  }

  const handleSaveEdit = async (messageId: string, newContent: string) => {
    try {
      await editMessage(parseInt(messageId), newContent)
      success("Message updated!")
      triggerHaptic("light")
    } catch (err) {
      error("Failed to edit message", "Please try again.")
      throw err
    }
  }

  const handleConfirmDelete = async (messageId: string) => {
    try {
      await deleteMessage(parseInt(messageId))
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

  // Get typing users for current group
  const currentTypingUsers = currentGroup ? typingUsers.filter(
    (userId) => userId !== currentUserId
  ) : []

  // Connection status (for now, always online)
  const isOnline = true
  const isConnected = true
  const queuedMessagesCount = 0

  if (messagingError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">Error: {messagingError}</p>
          <Button onClick={clearError}>Try Again</Button>
        </div>
      </div>
    )
  }

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
              queuedMessagesCount={queuedMessagesCount}
              onNewGroup={handleNewGroup}
              searchInput={searchInput}
              onSearchChange={setSearchInput}
              groups={groups}
              selectedGroupId={selectedGroupId}
              onGroupClick={handleGroupClick}
              searchQuery={searchQuery}
            />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col h-full">
            {/* Desktop: Welcome Screen */}
            {!currentGroup && (
              <div className="hidden md:flex flex-1 items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Welcome to Coal India Directory Messaging</h3>
                  <p className="text-muted-foreground">
                    {groups.length > 0 ? 'Select a conversation to start chatting' : 'Create a group to get started'}
                  </p>
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
                        queuedMessagesCount={queuedMessagesCount}
                        onNewGroup={handleNewGroup}
                        searchInput={searchInput}
                        onSearchChange={setSearchInput}
                        groups={groups}
                        selectedGroupId={selectedGroupId}
                        onGroupClick={handleGroupClick}
                        searchQuery={searchQuery}
                      />
                    </SheetContent>
                  </Sheet>
                  <MessageSquare className="w-5 h-5" />
                  <h1 className="font-semibold">Messages</h1>
                </div>
                <div className="flex items-center space-x-2">
                  <ConnectionStatus isOnline={isOnline} isConnected={isConnected} queuedMessagesCount={queuedMessagesCount} />
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
                  {groups.filter(g => g.name.toLowerCase().includes(searchQuery)).map((group) => (
                    <div
                      key={group.id}
                      onClick={() => handleGroupClick(group.id)}
                      className="flex items-center space-x-3 p-4 rounded-lg hover:bg-accent cursor-pointer touch-manipulation"
                    >
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center text-sm font-medium">
                        {group.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{group.name}</p>
                          {(group.unreadCount || 0) > 0 && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                              {group.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {group.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {groups.length === 0 && (
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
            {currentGroup && (showChat || window.innerWidth >= 768) && (
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
                    {currentGroup.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold">{currentGroup.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {currentGroup.memberCount} members • {onlineUsersCount} online
                    </p>
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
                          onReply={handleReply}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onCopy={handleCopy}
                        />
                      </>
                    )}

                    {/* Typing Indicator */}
                    {currentTypingUsers.length > 0 && (
                      <div className="px-4 py-2">
                        <TypingIndicator
                          users={currentTypingUsers.map(userId => ({
                            userId,
                            userName: userId
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
                      sendTypingIndicator(typing)
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

        <GroupManagement
          isOpen={showGroupModal}
          onClose={() => setShowGroupModal(false)}
          mode={groupModalMode}
          existingGroup={
            groupModalMode === "edit" && currentGroup
              ? {
                  name: currentGroup.name,
                  description: currentGroup.description || '',
                  members: []
                }
              : undefined
          }
          onCreateGroup={async (groupData: { name: string; description: string; members: Array<{ employeeId: string }> }) => {
            try {
              await createGroup({
                name: groupData.name,
                description: groupData.description,
                memberIds: groupData.members.map((m: { employeeId: string }) => m.employeeId)
              })
              setShowGroupModal(false)
              success("Group created successfully!")
            } catch (err) {
              error("Failed to create group", "Please try again.")
            }
          }}
        />

        {currentGroup && (
          <EditGroupPopup
            isOpen={showEditGroupModal}
            onClose={() => setShowEditGroupModal(false)}
            group={{
              id: currentGroup.id.toString(),
              name: currentGroup.name,
              description: currentGroup.description || '',
              members: [],
              createdAt: currentGroup.createdAt instanceof Date 
                ? currentGroup.createdAt.getTime() 
                : new Date(currentGroup.createdAt).getTime(),
              isAdmin: true
            }}
            onUpdateGroup={(updatedGroup) => {
              console.log("Group updated:", updatedGroup)
              success("Group settings updated!")
              setShowEditGroupModal(false)
            }}
          />
        )}

        <Toaster />
      </div>
    </ErrorBoundary>
  )
}
