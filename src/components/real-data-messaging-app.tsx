"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Send, Plus, Users, Search, MoreVertical, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useMessaging } from '@/hooks/use-messaging'
import { SimpleMessageBubble } from '@/components/messaging/simple-message-bubble'
import { LoadingSpinner } from '@/components/loading-spinner'
import { cn } from '@/lib/utils'
import { Group, Message, CreateGroupRequest } from '@/types/messaging'
import { TypingIndicator } from '@/components/typing-indicator'

// Mock employee data - in a real app, this would come from the employees API
const MOCK_EMPLOYEES = [
  { id: '90145293', name: 'Nayyar Khurshid', designation: 'Software Developer', dept: 'IT' },
  { id: '90145294', name: 'John Doe', designation: 'Manager', dept: 'HR' },
  { id: '90145295', name: 'Jane Smith', designation: 'Analyst', dept: 'Finance' },
  { id: '90145296', name: 'Mike Johnson', designation: 'Engineer', dept: 'Operations' },
  { id: '90145297', name: 'Sarah Wilson', designation: 'Coordinator', dept: 'Admin' }
]

interface RealDataMessagingAppProps {
  currentUserId?: string
  className?: string
}

export function RealDataMessagingApp({ 
  currentUserId = '90145293', // Default to Nayyar Khurshid for testing
  className 
}: RealDataMessagingAppProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [messageText, setMessageText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDescription, setNewGroupDescription] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [showGroupsList, setShowGroupsList] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    groups,
    currentGroup,
    messages,
    loading,
    error,
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

  // Check if mobile on mount
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle group selection
  const handleGroupSelect = async (groupId: number) => {
    setSelectedGroupId(groupId)
    if (isMobile) setShowGroupsList(false)
    
    try {
      await selectGroup(groupId)
    } catch (error) {
      toast.error('Failed to load group messages')
    }
  }

  // Handle send message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentGroup) return

    try {
      await sendMessage({
        content: messageText,
        messageType: 'text',
        replyToId: replyToMessage?.id
      })
      
      setMessageText('')
      setReplyToMessage(null)
      toast.success('Message sent')
    } catch (error) {
      toast.error('Failed to send message')
    }
  }

  // Handle typing indicator
  useEffect(() => {
    let typingTimer: NodeJS.Timeout
    
    if (messageText.trim() && currentGroup) {
      sendTypingIndicator(true)
      
      typingTimer = setTimeout(() => {
        sendTypingIndicator(false)
      }, 2000)
    } else {
      sendTypingIndicator(false)
    }

    return () => {
      clearTimeout(typingTimer)
      sendTypingIndicator(false)
    }
  }, [messageText, currentGroup, sendTypingIndicator])

  // Handle create group
  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || selectedMembers.length === 0) {
      toast.error('Please provide group name and select at least one member')
      return
    }

    try {
      const groupData: CreateGroupRequest = {
        name: newGroupName,
        description: newGroupDescription || undefined,
        memberIds: selectedMembers
      }

      await createGroup(groupData)
      
      setNewGroupName('')
      setNewGroupDescription('')
      setSelectedMembers([])
      setShowCreateGroup(false)
      toast.success('Group created successfully')
    } catch (error) {
      toast.error('Failed to create group')
    }
  }

  // Handle member selection for new group
  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  // Filter groups based on search
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (error) {
    return (
      <Card className={cn("w-full max-w-4xl mx-auto", className)}>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <p className="text-destructive">Error: {error}</p>
            <Button onClick={clearError}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("w-full max-w-6xl mx-auto h-[600px] flex flex-col", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>Messaging</span>
          {loading && <LoadingSpinner size="sm" />}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex p-0 overflow-hidden">
        {/* Groups Sidebar */}
        <div className={cn(
          "w-80 border-r flex flex-col",
          isMobile && !showGroupsList && "hidden"
        )}>
          {/* Search and Create Group */}
          <div className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="groupName">Group Name *</Label>
                    <Input
                      id="groupName"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Enter group name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="groupDescription">Description</Label>
                    <Textarea
                      id="groupDescription"
                      value={newGroupDescription}
                      onChange={(e) => setNewGroupDescription(e.target.value)}
                      placeholder="Optional group description"
                    />
                  </div>
                  <div>
                    <Label>Select Members *</Label>
                    <div className="max-h-48 overflow-y-auto space-y-2 mt-2">
                      {MOCK_EMPLOYEES.filter(emp => emp.id !== currentUserId).map(employee => (
                        <div key={employee.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={employee.id}
                            checked={selectedMembers.includes(employee.id)}
                            onChange={() => handleMemberToggle(employee.id)}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor={employee.id} className="flex-1 cursor-pointer">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {getInitials(employee.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{employee.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {employee.designation} - {employee.dept}
                                </p>
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateGroup(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateGroup}>
                      Create Group
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Separator />

          {/* Groups List */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredGroups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No groups found</p>
                  {groups.length === 0 && (
                    <p className="text-sm">Create your first group to get started</p>
                  )}
                </div>
              ) : (
                filteredGroups.map((group) => (
                  <div
                    key={group.id}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50",
                      selectedGroupId === group.id && "bg-muted"
                    )}
                    onClick={() => handleGroupSelect(group.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {getInitials(group.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium truncate">{group.name}</h4>
                          {(group.unreadCount || 0) > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {group.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {group.lastMessage || 'No messages yet'}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted-foreground">
                            {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {group.updatedAt.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className={cn(
          "flex-1 flex flex-col",
          isMobile && showGroupsList && "hidden"
        )}>
          {currentGroup ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowGroupsList(true)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <Avatar>
                    <AvatarFallback>
                      {getInitials(currentGroup.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{currentGroup.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {currentGroup.memberCount} members
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-0">
                <div className="min-h-full">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No messages yet</p>
                      <p className="text-sm">Send the first message to start the conversation</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <SimpleMessageBubble
                        key={message.id}
                        message={message}
                        currentUserId={currentUserId}
                        isOwn={message.senderId === currentUserId}
                        onReply={setReplyToMessage}
                        onEdit={(msg) => {
                          // Handle edit - you could open an edit dialog here
                          console.log('Edit message:', msg)
                        }}
                        onDelete={(messageId) => deleteMessage(parseInt(messageId))}
                        onCopy={(content) => {
                          navigator.clipboard.writeText(content)
                          toast.success('Message copied to clipboard')
                        }}
                      />
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Typing Indicator */}
              {typingUsers.length > 0 && (
                <div className="px-4 py-2 border-t">
                  <TypingIndicator users={typingUsers.map(userId => {
                    const employee = MOCK_EMPLOYEES.find(e => e.id === userId)
                    return {
                      userId,
                      userName: employee?.name || userId
                    }
                  })} />
                </div>
              )}

              {/* Reply Preview */}
              {replyToMessage && (
                <div className="p-3 bg-muted/30 border-t border-l-4 border-l-primary">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">
                        Replying to {replyToMessage.senderName}
                      </p>
                      <p className="text-sm truncate">{replyToMessage.content}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyToMessage(null)}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              )}

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    className="min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a group to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
