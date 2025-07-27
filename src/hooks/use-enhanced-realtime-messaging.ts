'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Group, Message, CreateGroupRequest, SendMessageRequest } from '@/types/messaging'
import { MessagingApiService } from '@/lib/services/messaging-api'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseEnhancedRealtimeMessagingState {
  groups: Group[]
  currentGroup: Group | null
  messages: Message[]
  loading: boolean
  error: string | null
  typingUsers: Array<{ userId: string; userName: string }>
  isConnected: boolean
  groupMembers: Map<string, string> // Map of userId to userName
}

interface UseEnhancedRealtimeMessagingActions {
  loadGroups: () => Promise<void>
  createGroup: (groupData: CreateGroupRequest) => Promise<void>
  selectGroup: (groupId: number) => Promise<void>
  sendMessage: (messageData: SendMessageRequest) => Promise<void>
  editMessage: (messageId: number, newContent: string) => Promise<void>
  deleteMessage: (messageId: number) => Promise<void>
  loadMoreMessages: () => Promise<void>
  clearError: () => void
  sendTypingIndicator: (isTyping: boolean) => void
}

export interface UseEnhancedRealtimeMessagingReturn extends UseEnhancedRealtimeMessagingState, UseEnhancedRealtimeMessagingActions {}

export function useEnhancedRealtimeMessaging(currentUserId: string): UseEnhancedRealtimeMessagingReturn {
  const supabase = createClient()
  
  const [state, setState] = useState<UseEnhancedRealtimeMessagingState>({
    groups: [],
    currentGroup: null,
    messages: [],
    loading: false,
    error: null,
    typingUsers: [],
    isConnected: false,
    groupMembers: new Map()
  })

  const [messagesOffset, setMessagesOffset] = useState(0)
  const messagesLimit = 50
  
  // Channels for realtime functionality
  const messageChannelRef = useRef<RealtimeChannel | null>(null)
  const typingChannelRef = useRef<RealtimeChannel | null>(null)
  const membershipChannelRef = useRef<RealtimeChannel | null>(null)
  
  // Typing timeout management
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }))
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }))
  }, [])

  // Setup realtime subscription for a group
  const setupRealtimeSubscription = useCallback((groupId: number) => {
    // Clean up existing subscriptions
    if (messageChannelRef.current) {
      supabase.removeChannel(messageChannelRef.current)
    }
    if (typingChannelRef.current) {
      supabase.removeChannel(typingChannelRef.current)
    }

    // Create message channel for this group
    const messageChannel = supabase.channel(`group-${groupId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: currentUserId }
      }
    })
    
    messageChannel
      .on('broadcast', { event: 'new-message' }, (payload) => {
        console.log('📨 Real-time message received:', payload)
        const message = payload.payload as Message
        // Don't add our own messages as they're already added optimistically
        if (message.senderId !== currentUserId) {
          setState(prev => ({
            ...prev,
            messages: [...prev.messages, message]
          }))
        }
      })
      .on('broadcast', { event: 'update-message' }, (payload) => {
        console.log('✏️ Real-time message update received:', payload)
        const message = payload.payload as Message
        setState(prev => ({
          ...prev,
          messages: prev.messages.map(msg =>
            msg.id === message.id ? message : msg
          )
        }))
      })
      .on('broadcast', { event: 'delete-message' }, (payload) => {
        console.log('🗑️ Real-time message delete received:', payload)
        const messageId = payload.payload.messageId as number
        setState(prev => ({
          ...prev,
          messages: prev.messages.filter(msg => msg.id !== messageId)
        }))
      })
      .subscribe((status, err) => {
        console.log(`🔌 Real-time channel status for group-${groupId}:`, status)
        if (err) console.error('🚨 Real-time subscription error:', err)
        setState(prev => ({ ...prev, isConnected: status === 'SUBSCRIBED' }))
      })

    messageChannelRef.current = messageChannel

    // Create typing channel for this group using Supabase Presence
    const typingChannel = supabase.channel(`typing-${groupId}`)
    
    // Helper function to update typing users
    const updateTypingUsers = () => {
      const presenceState = typingChannel.presenceState()
      console.log('👥 Typing presence state:', presenceState)
      
      const allUsers = Object.entries(presenceState).flatMap(([key, users]) => 
        users.map((user: any) => ({
          ...user,
          presenceKey: key
        }))
      )
      
      console.log('📋 All presence users:', allUsers)
      
      const typingUsers = allUsers
        .filter((user: any) => user.userId !== currentUserId && user.isTyping === true)
        .map((user: any) => ({
          userId: user.userId,
          userName: user.userName || user.userId
        }))
      
      console.log('✍️ Typing users after filter:', typingUsers)
      setState(prev => ({ ...prev, typingUsers }))
    }
    
    typingChannel
      .on('presence', { event: 'sync' }, updateTypingUsers)
      .on('presence', { event: 'join' }, updateTypingUsers)
      .on('presence', { event: 'leave' }, updateTypingUsers)
      .subscribe((status, err) => {
        console.log(`🔌 Typing channel status for typing-${groupId}:`, status)
        if (err) console.error('🚨 Typing channel subscription error:', err)
      })

    typingChannelRef.current = typingChannel
  }, [currentUserId, supabase])

  // Send typing indicator with automatic timeout
  const sendTypingIndicator = useCallback(async (isTyping: boolean) => {
    console.log(`📝 sendTypingIndicator called with isTyping: ${isTyping}`)
    
    if (!typingChannelRef.current) {
      console.warn('⚠️ No typing channel available')
      return
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Get current user's name from employee table
    let userName = currentUserId
    try {
      const { data: employee, error } = await supabase
        .from('employees')
        .select('name')
        .eq('emp_code', currentUserId)
        .single()
      
      if (employee && !error) {
        userName = employee.name
      }
    } catch (err) {
      console.error('Error fetching employee name:', err)
    }

    // Track typing status with user name
    console.log(`🔥 Tracking typing status: ${isTyping} for user: ${userName} (${currentUserId})`)
    const trackResult = await typingChannelRef.current.track({
      userId: currentUserId,
      userName,
      isTyping,
      timestamp: new Date().toISOString()
    })
    console.log('📊 Track result:', trackResult)

    // If typing, set timeout to automatically stop typing after 10 seconds
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Auto-stopping typing indicator after timeout')
        if (typingChannelRef.current) {
          typingChannelRef.current.track({
            userId: currentUserId,
            userName,
            isTyping: false,
            timestamp: new Date().toISOString()
          })
        }
      }, 10000) // Increased from 3 seconds to 10 seconds
    }
  }, [currentUserId, supabase])

  // Broadcast new message to other clients
  const broadcastNewMessage = useCallback(async (groupId: number, message: Message) => {
    if (messageChannelRef.current) {
      try {
        console.log(`📤 Broadcasting new message to group-${groupId}:`, message)
        const result = await messageChannelRef.current.send({
          type: 'broadcast',
          event: 'new-message',
          payload: message
        })
        console.log('✅ Broadcast successful:', result)
      } catch (error) {
        console.error('🚨 Failed to broadcast new message:', error)
      }
    } else {
      console.warn('⚠️ No message channel available for broadcasting')
    }
  }, [])

  // Broadcast message update to other clients
  const broadcastMessageUpdate = useCallback(async (message: Message) => {
    if (messageChannelRef.current) {
      try {
        console.log('📤 Broadcasting message update:', message)
        const result = await messageChannelRef.current.send({
          type: 'broadcast',
          event: 'update-message',
        })
        console.log('✅ Update broadcast successful:', result)
      } catch (error) {
        console.error('🚨 Failed to broadcast message update:', error)
      }
    } else {
      console.warn('⚠️ No message channel available for update broadcasting')
    }
  }, [])

  // Broadcast message deletion to other clients
  const broadcastMessageDelete = useCallback(async (messageId: number) => {
    if (messageChannelRef.current) {
      try {
        console.log('📤 Broadcasting message deletion:', messageId)
        const result = await messageChannelRef.current.send({
          type: 'broadcast',
          event: 'delete-message',
          payload: { messageId }
        })
        console.log('✅ Delete broadcast successful:', result)
      } catch (error) {
        console.error('🚨 Failed to broadcast message deletion:', error)
      }
    } else {
      console.warn('⚠️ No message channel available for delete broadcasting')
    }
  }, [])

  // Load user's groups
  const loadGroups = useCallback(async () => {
    if (!currentUserId) {
      setState(prev => ({ ...prev, groups: [] }))
      return
    }

    try {
      setLoading(true)
      setError(null)
      const groups = await MessagingApiService.getUserGroups()
      setState(prev => ({ ...prev, groups }))
    } catch (error) {
      console.error('Error loading groups:', error)
      setError(error instanceof Error ? error.message : 'Failed to load groups')
    } finally {
      setLoading(false)
    }
  }, [currentUserId, setError, setLoading])

  // Create a new group
  const createGroup = useCallback(async (groupData: CreateGroupRequest) => {
    try {
      setLoading(true)
      setError(null)
      const newGroup = await MessagingApiService.createGroup(groupData)
      
      if (!newGroup) {
        setError('Unauthorized: cannot create group')
        return
      }
      
      setState(prev => ({ 
        ...prev, 
        groups: [newGroup, ...prev.groups]
      }))
      
      // Reload groups to ensure sync
      await loadGroups()
    } catch (error) {
      console.error('Error creating group:', error)
      setError(error instanceof Error ? error.message : 'Failed to create group')
      throw error
    } finally {
      setLoading(false)
    }
  }, [setError, setLoading, loadGroups])

  // Select a group and load its messages
  const selectGroup = useCallback(async (groupId: number) => {
    try {
      setLoading(true)
      setError(null)
      
      const selectedGroup = state.groups.find(g => g.id === groupId)
      if (!selectedGroup) {
        throw new Error('Group not found')
      }

      const messages = await MessagingApiService.getGroupMessages(groupId, messagesLimit, 0)
      
      setState(prev => ({ 
        ...prev, 
        currentGroup: selectedGroup,
        messages,
        typingUsers: []
      }))
      setMessagesOffset(0)

      // Setup real-time subscriptions for this group
      setupRealtimeSubscription(groupId)

    } catch (error) {
      console.error('Error selecting group:', error)
      setError(error instanceof Error ? error.message : 'Failed to load group messages')
    } finally {
      setLoading(false)
    }
  }, [state.groups, messagesLimit, setError, setLoading, setupRealtimeSubscription])

  // Send a new message with real-time broadcast
  const sendMessage = useCallback(async (messageData: SendMessageRequest) => {
    if (!state.currentGroup) {
      throw new Error('No group selected')
    }

    try {
      setError(null)
      
      // Send via API and get the saved message
      const newMessage = await MessagingApiService.sendMessage(
        state.currentGroup.id,
        messageData
      )
      
      // Add to local state optimistically
      setState(prev => ({ 
        ...prev, 
        messages: [...prev.messages, newMessage]
      }))

      // Broadcast to other clients in real-time
      await broadcastNewMessage(state.currentGroup.id, newMessage)

      // Refresh groups to update last message and timestamps
      await loadGroups()
      
    } catch (error) {
      console.error('Error sending message:', error)
      setError(error instanceof Error ? error.message : 'Failed to send message')
      throw error
    }
  }, [state.currentGroup, broadcastNewMessage, loadGroups, setError])

  // Edit a message with real-time broadcast
  const editMessage = useCallback(async (messageId: number, newContent: string) => {
    if (!state.currentGroup) {
      throw new Error('No group selected')
    }

    try {
      setError(null)
      const updatedMessage = await MessagingApiService.editMessage(state.currentGroup.id, messageId, newContent)
      
      setState(prev => ({ 
        ...prev, 
        messages: prev.messages.map(msg => 
          msg.id === messageId ? updatedMessage : msg
        )
      }))

      // Broadcast update to other clients
      await broadcastMessageUpdate(updatedMessage)
      
    } catch (error) {
      console.error('Error editing message:', error)
      setError(error instanceof Error ? error.message : 'Failed to edit message')
      throw error
    }
  }, [state.currentGroup, setError, broadcastMessageUpdate])

  // Delete a message with real-time broadcast
  const deleteMessage = useCallback(async (messageId: number) => {
    if (!state.currentGroup) {
      throw new Error('No group selected')
    }

    try {
      setError(null)
      await MessagingApiService.deleteMessage(state.currentGroup.id, messageId)
      
      setState(prev => ({ 
        ...prev, 
        messages: prev.messages.filter(msg => msg.id !== messageId)
      }))

      // Broadcast deletion to other clients
      await broadcastMessageDelete(messageId)
      
    } catch (error) {
      console.error('Error deleting message:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete message')
      throw error
    }
  }, [state.currentGroup, setError, broadcastMessageDelete])

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!state.currentGroup) return

    try {
      setLoading(true)
      const newOffset = messagesOffset + messagesLimit
      const moreMessages = await MessagingApiService.getGroupMessages(
        state.currentGroup.id, 
        messagesLimit, 
        newOffset
      )
      
      if (moreMessages.length > 0) {
        setState(prev => ({ 
          ...prev, 
          messages: [...moreMessages, ...prev.messages]
        }))
        setMessagesOffset(newOffset)
      }
    } catch (error) {
      console.error('Error loading more messages:', error)
      setError(error instanceof Error ? error.message : 'Failed to load more messages')
    } finally {
      setLoading(false)
    }
  }, [state.currentGroup, messagesOffset, messagesLimit, setError, setLoading])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [setError])

  // Setup global membership subscription using database changes
  useEffect(() => {
    if (!currentUserId) return

    // Subscribe to messaging_group_members table changes for the current user
    const membershipChannel = supabase
      .channel(`user-memberships-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messaging_group_members',
          filter: `employee_id=eq.${currentUserId}`
        },
        async (payload) => {
          console.log('🔔 New group membership detected:', payload)
          // Reload groups when user is added to a new group
          await loadGroups()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messaging_group_members',
          filter: `employee_id=eq.${currentUserId}`
        },
        async (payload) => {
          console.log('🔔 Group membership removed:', payload)
          // Reload groups when user is removed from a group
          await loadGroups()
        }
      )
      .subscribe((status, err) => {
        console.log(`🔌 Membership channel status:`, status)
        if (err) console.error('🚨 Membership subscription error:', err)
      })

    membershipChannelRef.current = membershipChannel

    // Load groups initially
    loadGroups()

    return () => {
      if (membershipChannelRef.current) {
        supabase.removeChannel(membershipChannelRef.current)
      }
    }
  }, [currentUserId, loadGroups, supabase])

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      if (messageChannelRef.current) {
        supabase.removeChannel(messageChannelRef.current)
      }
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current)
      }
      if (membershipChannelRef.current) {
        supabase.removeChannel(membershipChannelRef.current)
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [supabase])

  return {
    ...state,
    loadGroups,
    createGroup,
    selectGroup,
    sendMessage,
    editMessage,
    deleteMessage,
    loadMoreMessages,
    clearError,
    sendTypingIndicator
  }
}
