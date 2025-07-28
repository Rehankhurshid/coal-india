"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Search, MessageSquare, Users, Moon, Plus, Settings, Smile, Send, Menu, ArrowLeft } from "lucide-react"
import { GroupManagement } from "./components/group-management"
import { useMockWebSocket } from "./hooks/use-mock-websocket" // Using mock for demo
import { TypingIndicator } from "./components/typing-indicator"
import { ConnectionStatus } from "./components/connection-status"
import { useUserPresence } from "./hooks/use-user-presence"
import { UserList } from "./components/user-list"
import { OnlineUsersSidebar } from "./components/online-users-sidebar"
import { UserPresenceIndicator } from "./components/user-presence-indicator"
import { Badge } from "@/components/ui/badge"
import { useHaptic } from "./hooks/use-haptic"
import { EditGroupPopup } from "./components/edit-group-popup"
import { MessageStatusIndicator } from "./components/message-status-indicator"
import { useSonnerToast } from "./hooks/use-sonner-toast"

export default function MessagingApp() {
  const [message, setMessage] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [groupModalMode, setGroupModalMode] = useState<"create" | "edit">("create")
  const [isTyping, setIsTyping] = useState(false)
  const [showUserList, setShowUserList] = useState(false)
  const [showEditGroupModal, setShowEditGroupModal] = useState(false)
  const [messageStatuses, setMessageStatuses] = useState<
    Record<string, "sending" | "sent" | "delivered" | "read" | "failed">
  >({})

  // Using mock WebSocket for demo purposes - replace with useWebSocket for production
  const { isConnected, isOnline, sendMessage, messages, typingUsers, startTyping, stopTyping, queuedMessages } =
    useMockWebSocket()

  const { userPresences, getUserStatus, getOnlineUsers } = useUserPresence()
  const { triggerHaptic } = useHaptic()

  const { success, error, info, warning } = useSonnerToast()
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const conversations = [
    {
      id: "ge",
      name: "General Discussion",
      avatar: "GE",
      messageCount: 3,
      lastMessage: "Hello everyone! Welcome t...",
    },
    {
      id: "it",
      name: "IT Support",
      avatar: "IT",
      messageCount: 1,
      lastMessage: "The server maintenance is s...",
    },
    {
      id: "hr",
      name: "HR Announcements",
      avatar: "HR",
      messageCount: 1,
      lastMessage: "New policy updates availabl...",
    },
  ]

  const mockMessages = [
    {
      id: 1,
      user: "John Doe",
      avatar: "JO",
      time: "03:00 PM",
      content: "Hello everyone! Welcome to the new messaging system.",
    },
    {
      id: 2,
      user: "Jane Smith",
      avatar: "JA",
      time: "03:01 PM",
      content: "This looks great! Thanks for setting this up.",
    },
    {
      id: 3,
      user: "Mike Johnson",
      avatar: "MI",
      time: "03:03 PM",
      content: "Looking forward to using this for team coordination.",
    },
  ]

  const handleConversationClick = () => {
    triggerHaptic("light")
    setShowChat(true)
    setSidebarOpen(false)
  }

  const handleBackClick = () => {
    triggerHaptic("light")
    setShowChat(false)
  }

  const handleSendMessage = () => {
    if (message.trim()) {
      if (!isOnline) {
        triggerHaptic("heavy")
        error("Cannot send message", "You're currently offline. Please check your connection and try again.")
        return
      }

      triggerHaptic("light")
      const messageId = Math.random().toString(36).substr(2, 9)

      // Set initial status
      setMessageStatuses((prev) => ({ ...prev, [messageId]: "sending" }))

      sendMessage({
        content: message,
        userId: "current-user",
        conversationId: "ge",
      })

      // Simulate status updates
      setTimeout(() => {
        setMessageStatuses((prev) => ({ ...prev, [messageId]: "sent" }))
      }, 500)

      setTimeout(() => {
        setMessageStatuses((prev) => ({ ...prev, [messageId]: "delivered" }))
      }, 1500)

      setMessage("")
      stopTyping("ge")
      setIsTyping(false)
    }
  }

  const handleMessageChange = (value: string) => {
    setMessage(value)

    if (value.trim() && !isTyping) {
      setIsTyping(true)
      startTyping("ge")
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      stopTyping("ge")
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Get typing users for current conversation
  const currentTypingUsers = typingUsers.filter(
    (user) => user.conversationId === "ge" && user.userId !== "current-user",
  )

  // Sidebar content component
  const SidebarContent = () => (
    <div className="h-full bg-card flex flex-col">
      {/* Messages Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5" />
          <span className="font-semibold">Messages</span>
        </div>
        <div className="flex items-center space-x-2">
          <ConnectionStatus isOnline={isOnline} isConnected={isConnected} queuedMessagesCount={queuedMessages.length} />
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => {
              triggerHaptic("light")
              setGroupModalMode("create")
              setShowGroupModal(true)
            }}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search conversations..." className="pl-10" />
        </div>
      </div>

      {/* Recent Conversations */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent Conversations</h3>
          <div className="space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={handleConversationClick}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer touch-manipulation"
              >
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-sm font-medium">
                  {conv.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{conv.name}</p>
                    {conv.messageCount > 0 && (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                        {conv.messageCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      {/* Top Navigation */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center space-x-3 md:space-x-6">
          {/* Mobile menu button */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => triggerHaptic("light")}>
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80">
              <SidebarContent />
            </SheetContent>
          </Sheet>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-white">
              S
            </div>
            <span className="font-semibold text-lg hidden sm:block">SECL Directory</span>
            <span className="font-semibold text-lg sm:hidden">SECL</span>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setShowUserList(!showUserList)}
            >
              <Users className="w-4 h-4 mr-2" />
              Directory
              <Badge variant="secondary" className="ml-2 text-xs">
                {getOnlineUsers().length}
              </Badge>
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </nav>
        </div>

        <div className="flex items-center space-x-2 md:space-x-3">
          <ConnectionStatus isOnline={isOnline} isConnected={isConnected} queuedMessagesCount={queuedMessages.length} />

          {/* Mobile Create Group Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => {
              triggerHaptic("medium")
              setGroupModalMode("create")
              setShowGroupModal(true)
            }}
          >
            <Plus className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => triggerHaptic("light")}
          >
            <Moon className="w-5 h-5" />
          </Button>
          <Avatar className="w-8 h-8">
            <AvatarImage src="/placeholder.svg?height=32&width=32" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 border-r border-border">
          <SidebarContent />
        </div>

        {/* Desktop User List */}
        {showUserList && (
          <div className="hidden md:block w-80 border-r border-border">
            <UserList
              users={Array.from(userPresences.values())}
              onUserClick={(user) => console.log("User clicked:", user)}
            />
          </div>
        )}

        {/* Mobile: Show conversation list or chat */}
        <div className="flex-1 flex flex-col md:hidden">
          {!showChat ? (
            /* Mobile Conversation List */
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search conversations..." className="pl-10" />
                </div>

                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Recent Conversations</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      triggerHaptic("medium")
                      setGroupModalMode("create")
                      setShowGroupModal(true)
                    }}
                    className="flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Group</span>
                  </Button>
                </div>

                <div className="space-y-2">
                  {conversations.map((conv) => (
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
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                              {conv.messageCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Mobile Chat View */
            <>
              {/* Mobile Chat Header */}
              <div className="flex items-center space-x-3 p-4 bg-card border-b border-border">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground flex-shrink-0"
                  onClick={handleBackClick}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>

                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-sm font-medium">
                  GE
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold">General Discussion</h2>
                  <p className="text-sm text-muted-foreground">45 members</p>
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

              {/* Mobile Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex justify-center">
                  <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">Today</span>
                </div>

                {mockMessages.map((msg) => (
                  <div key={msg.id} className="flex items-start space-x-3">
                    <div className="relative">
                      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {msg.avatar}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                        <UserPresenceIndicator
                          status={getUserStatus(msg.user.toLowerCase().replace(" ", "-"))}
                          size="sm"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">{msg.user}</span>
                        <UserPresenceIndicator
                          status={getUserStatus(msg.user.toLowerCase().replace(" ", "-"))}
                          size="sm"
                          showText
                        />
                        <span className="text-xs text-muted-foreground">{msg.time}</span>
                      </div>
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* WebSocket Messages */}
                {messages.map((msg) => (
                  <div key={msg.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {msg.userId === "current-user" ? "YO" : msg.userId === "mock-user" ? "JD" : "US"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">
                          {msg.userId === "current-user" ? "You" : msg.userId === "mock-user" ? "John Doe" : "User"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                        {msg.id.startsWith("queued-") && (
                          <span className="text-xs text-yellow-600 bg-yellow-100 px-1 rounded">Queued</span>
                        )}
                        {msg.userId === "current-user" && (
                          <MessageStatusIndicator status={messageStatuses[msg.id] || "sent"} />
                        )}
                      </div>
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {currentTypingUsers.length > 0 && <TypingIndicator users={currentTypingUsers} className="px-3" />}
              </div>

              {/* Mobile Message Input */}
              <div className="p-4 bg-card border-t border-border">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <Input
                      value={message}
                      onChange={(e) => handleMessageChange(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={isOnline ? "Type a message..." : "You're offline. Connect to send messages."}
                      className="pr-20"
                      disabled={!isOnline}
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground h-8 w-8"
                        onClick={() => triggerHaptic("light")}
                      >
                        <Smile className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground h-8 w-8"
                        onClick={handleSendMessage}
                        disabled={!message.trim() || !isOnline}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Desktop Chat Area */}
        <div className="hidden md:flex flex-1 flex-col">
          {/* Desktop Chat Header */}
          <div className="flex items-center justify-between p-4 bg-card border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-sm font-medium">GE</div>
              <div>
                <h2 className="font-semibold">General Discussion</h2>
                <p className="text-sm text-muted-foreground">45 members</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setGroupModalMode("edit")
                  setShowGroupModal(true)
                }}
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Desktop Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex justify-center">
              <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">Today</span>
            </div>

            {mockMessages.map((msg) => (
              <div key={msg.id} className="flex items-start space-x-3">
                <div className="relative">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {msg.avatar}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                    <UserPresenceIndicator status={getUserStatus(msg.user.toLowerCase().replace(" ", "-"))} size="sm" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium">{msg.user}</span>
                    <UserPresenceIndicator
                      status={getUserStatus(msg.user.toLowerCase().replace(" ", "-"))}
                      size="sm"
                      showText
                    />
                    <span className="text-xs text-muted-foreground">{msg.time}</span>
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2 max-w-md">
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* WebSocket Messages */}
            {messages.map((msg) => (
              <div key={msg.id} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {msg.userId === "current-user" ? "YO" : msg.userId === "mock-user" ? "JD" : "US"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium">
                      {msg.userId === "current-user" ? "You" : msg.userId === "mock-user" ? "John Doe" : "User"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                    {msg.id.startsWith("queued-") && (
                      <span className="text-xs text-yellow-600 bg-yellow-100 px-1 rounded">Queued</span>
                    )}
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2 max-w-md">
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {currentTypingUsers.length > 0 && <TypingIndicator users={currentTypingUsers} className="px-3" />}
          </div>

          {/* Desktop Message Input */}
          <div className="p-4 bg-card border-t border-border">
            <div className="flex items-center space-x-3">
              <div className="flex-1 relative">
                <Input
                  value={message}
                  onChange={(e) => handleMessageChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isOnline ? "Type a message..." : "You're offline. Messages will be queued."}
                  className="pr-20"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
                    <Smile className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground h-8 w-8"
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Online Users Sidebar */}
        <div className="hidden lg:block w-64">
          <OnlineUsersSidebar onlineUsers={getOnlineUsers()} />
        </div>
      </div>

      <GroupManagement
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        mode={groupModalMode}
        existingGroup={
          groupModalMode === "edit"
            ? {
                name: "General Discussion",
                description: "Main discussion channel for the team",
                members: [],
              }
            : undefined
        }
      />

      <EditGroupPopup
        isOpen={showEditGroupModal}
        onClose={() => setShowEditGroupModal(false)}
        group={{
          id: "ge",
          name: "General Discussion",
          description: "Main discussion channel for the team",
          members: [],
          createdAt: Date.now(),
          isAdmin: true,
        }}
        onUpdateGroup={(updatedGroup) => {
          console.log("Group updated:", updatedGroup)
          setShowEditGroupModal(false)
        }}
      />
    </div>
  )
}
