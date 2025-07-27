import { useState, useEffect, useCallback, useRef } from 'react'
import { Group, Message, CreateGroupRequest, SendMessageRequest } from '@/types/messaging'
import { MessagingApiService } from '@/lib/services/messaging-api'
import { SupabaseMessagingService } from '@/lib/services/supabase-messaging'
import { RealtimeChannel } from '@supabase/supabase-js'

interface UseMessagingState {
  groups: Group[]
  currentGroup: Group | null
  messages: Message[]
  loading: boolean
  error: string | null
  typingUsers: string[]
}

interface UseMessagingActions {
  loadGroups: () => Promise<void>
  createGroup: (groupData: CreateGroupRequest) => Promise<void>
  selectGroup: (groupId: number) => Promise<void>
  sendMessage: (messageData: SendMessageRequest) => Promise<void>
  editMessage: (messageId: number, newContent: string) => Promise<void>
  deleteMessage: (messageId: number) => Promise<void>
  markMessagesAsRead: (messageIds: number[]) => Promise<void>
  loadMoreMessages: () => Promise<void>
  clearError: () => void
  sendTypingIndicator: (isTyping: boolean) => Promise<void>
}

export interface UseMessagingReturn extends UseMessagingState, UseMessagingActions {}

export function useMessaging(currentUserId: string): UseMessagingReturn {
  const [state, setState] = useState<UseMessagingState>({
    groups: [],
    currentGroup: null,
    messages: [],
    loading: false,
    error: null,
    typingUsers: []
  })

  const [messagesOffset, setMessagesOffset] = useState(0)
  const messagesLimit = 50
  const messageChannelRef = useRef<RealtimeChannel | null>(null)
  const typingChannelRef = useRef<RealtimeChannel | null>(null)

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
      messageChannelRef.current.unsubscribe()
    }
    if (typingChannelRef.current) {
      typingChannelRef.current.unsubscribe()
    }

    // Subscribe to real-time messages
    messageChannelRef.current = SupabaseMessagingService.subscribeToGroup(groupId, {
      onNewMessage: (message) => {
        // Don't add our own messages as they're already added optimistically
        if (message.senderId !== currentUserId) {
          setState(prev => ({
            ...prev,
            messages: [...prev.messages, message]
          }))
        }
      },
      onMessageUpdate: (message) => {
        setState(prev => ({
          ...prev,
          messages: prev.messages.map(msg =>
            msg.id === message.id ? message : msg
          )
        }))
      },
      onMessageDelete: (messageId) => {
        setState(prev => ({
          ...prev,
          messages: prev.messages.filter(msg => msg.id !== messageId)
        }))
      }
    })

    // Subscribe to typing indicators
    typingChannelRef.current = SupabaseMessagingService.subscribeToTypingIndicators(
      groupId,
      currentUserId,
      (typingUsers) => {
        setState(prev => ({
          ...prev,
          typingUsers
        }))
      }
    )

    // Subscribe to the typing channel
    typingChannelRef.current.subscribe()
  }, [currentUserId])

  // Send typing indicator
  const sendTypingIndicator = useCallback(async (isTyping: boolean) => {
    if (typingChannelRef.current) {
      await SupabaseMessagingService.sendTypingIndicator(
        typingChannelRef.current,
        currentUserId,
        isTyping
      )
    }
  }, [currentUserId])

  // Load user's groups
  const loadGroups = useCallback(async () => {
    if (!currentUserId) {
      setState(prev => ({ ...prev, groups: [] }));
      return;
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
      console.log('Creating group with data:', groupData)
      const newGroup = await MessagingApiService.createGroup(groupData)
      console.log('Group created:', newGroup)
      if (!newGroup) {
        setError('Unauthorized: cannot create group')
        return
      }
      setState(prev => ({ 
        ...prev, 
        groups: [newGroup, ...prev.groups]
      }))
      // Reload groups to ensure the new group appears and is synced
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

      // No read receipts as per requirements
    } catch (error) {
      console.error('Error selecting group:', error)
      setError(error instanceof Error ? error.message : 'Failed to load group messages')
    } finally {
      setLoading(false)
    }
  }, [state.groups, messagesLimit, setError, setLoading, setupRealtimeSubscription])

  // Send a new message
  const sendMessage = useCallback(async (messageData: SendMessageRequest) => {
    if (!state.currentGroup) {
      throw new Error('No group selected')
    }

    try {
      setError(null)
      const newMessage = await MessagingApiService.sendMessage(
        state.currentGroup.id,
        messageData
      )
      
      setState(prev => ({ 
        ...prev, 
        messages: [...prev.messages, newMessage]
      }))

      // Refresh groups to update last message and timestamps
      await loadGroups()
    } catch (error) {
      console.error('Error sending message:', error)
      setError(error instanceof Error ? error.message : 'Failed to send message')
      throw error
    }
  }, [state.currentGroup, currentUserId, loadGroups, setError])

  // Edit a message
  const editMessage = useCallback(async (messageId: number, newContent: string) => {
    try {
      setError(null)
      const updatedMessage = await MessagingApiService.editMessage(messageId, newContent)
      
      setState(prev => ({ 
        ...prev, 
        messages: prev.messages.map(msg => 
          msg.id === messageId ? updatedMessage : msg
        )
      }))
    } catch (error) {
      console.error('Error editing message:', error)
      setError(error instanceof Error ? error.message : 'Failed to edit message')
      throw error
    }
  }, [setError])

  // Delete a message
  const deleteMessage = useCallback(async (messageId: number) => {
    try {
      setError(null)
      await MessagingApiService.deleteMessage(messageId)
      
      setState(prev => ({ 
        ...prev, 
        messages: prev.messages.filter(msg => msg.id !== messageId)
      }))
    } catch (error) {
      console.error('Error deleting message:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete message')
      throw error
    }
  }, [setError])

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (messageIds: number[]) => {
    // Removed as per requirements - no read receipts
    return
  }, [])

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

  // Load groups on mount
  useEffect(() => {
    if (currentUserId) {
      loadGroups()
    }
  }, [currentUserId, loadGroups])

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      if (messageChannelRef.current) {
        messageChannelRef.current.unsubscribe()
      }
      if (typingChannelRef.current) {
        typingChannelRef.current.unsubscribe()
      }
    }
  }, [])

  return {
    ...state,
    loadGroups,
    createGroup,
    selectGroup,
    sendMessage,
    editMessage,
    deleteMessage,
    markMessagesAsRead,
    loadMoreMessages,
    clearError,
    sendTypingIndicator
  }
}
