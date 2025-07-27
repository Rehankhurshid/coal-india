"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Toaster } from "sonner"
import { ErrorBoundary } from "./error-boundary"
import { MessageEditDialog, MessageDeleteDialog } from "./messaging/message-edit-dialog"
import { Message, Group } from "@/types/messaging"
import { useEnhancedRealtimeMessaging } from "@/hooks/use-enhanced-realtime-messaging"
import { ChatArea } from "./messaging/chat-area"
import { WelcomeScreen } from "./messaging/welcome-screen"
import { DesktopSidebar } from "./messaging/desktop-sidebar"
import { useHaptic } from "@/hooks/use-haptic"
import { useSonnerToast } from "@/hooks/use-sonner-toast"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { GroupManagement } from "./group-management"
import { EditGroupPopup } from "./edit-group-popup"
import { MobileDebug } from "./mobile-debug"

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

interface EnhancedMessagingAppRealDataProps {
  currentUserId: string;
}

export function EnhancedMessagingAppRealData({ currentUserId }: EnhancedMessagingAppRealDataProps) {
  const isMobile = useIsMobile()
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
  
  const { triggerHaptic } = useHaptic()
  const { success, error, info } = useSonnerToast()

  const {
    groups,
    currentGroup,
    messages,
    loading,
    error: messagingError,
    typingUsers,
    isConnected,
    loadGroups,
    createGroup,
    selectGroup,
    sendMessage,
    editMessage,
    deleteMessage,
    clearError,
    sendTypingIndicator
  } = useEnhancedRealtimeMessaging(currentUserId)

  // Get online users count (mock for now)
  const onlineUsersCount = 3

  const searchQuery = searchInput.toLowerCase()

  // Auto-select first group on desktop if none selected
  useEffect(() => {
    if (!selectedGroupId && groups.length > 0 && !isMobile) {
      handleGroupClick(groups[0].id)
    }
  }, [groups, isMobile])

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

  // Get typing users for current group (already filtered in the hook)
  const currentTypingUsers = currentGroup ? typingUsers : []

  // Connection status 
  const isOnline = true
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
      <div className="h-full min-h-[100dvh] md:h-full bg-background text-foreground">
        <div className="flex h-full min-h-[100dvh] md:h-full">
          {/* Desktop Sidebar */}
          <div className="hidden md:block w-64 border-r border-border h-full">
            <DesktopSidebar 
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

          {/* Mobile: Show sidebar when no chat is open OR Desktop: Main content */}
          <div className="flex-1 flex flex-col h-full">
            {/* Mobile Group List - Show when no chat is open */}
            {!showChat && (
              <div className="md:hidden h-full bg-background">
                <div className="p-4 border-b border-border">
                  <h1 className="text-lg font-semibold">Messages</h1>
                  <p className="text-sm text-muted-foreground">Select a group to start messaging</p>
                </div>
                <DesktopSidebar 
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
            )}

            {/* Desktop: Welcome Screen */}
            {!currentGroup && (
              <div className="hidden md:flex flex-1 items-center justify-center">
                <WelcomeScreen hasGroups={groups.length > 0} onNewGroup={handleNewGroup} />
              </div>
            )}

            {/* Chat View */}
            {currentGroup && (showChat || !isMobile) && (
              <ChatArea
                currentGroup={currentGroup}
                messages={messages}
                currentUserId={currentUserId}
                onlineUsersCount={onlineUsersCount}
                showBackButton={isMobile}
                typingUsers={currentTypingUsers}
                replyingTo={replyingTo}
                isOnline={isOnline}
                isConnected={isConnected}
                onBackClick={handleBackClick}
                onSettingsClick={() => {
                  triggerHaptic("light")
                  setShowEditGroupModal(true)
                }}
                onSendMessage={handleSendMessage}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCopy={handleCopy}
                onClearReply={() => setReplyingTo(null)}
                onTyping={(typing) => sendTypingIndicator(typing)}
              />
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
        
        {/* Debug Info */}
        <MobileDebug 
          groups={groups}
          showChat={showChat}
          selectedGroupId={selectedGroupId}
          currentGroup={currentGroup}
        />
      </div>
    </ErrorBoundary>
  )
}
