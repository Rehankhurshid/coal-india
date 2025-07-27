import { supabase } from '@/lib/supabase'
import { Group, Message, CreateGroupRequest, SendMessageRequest } from '@/types/messaging'

export class SupabaseMessagingService {
  /**
   * Get all groups for a user with member count and last message
   */
  static async getUserGroups(userId: string): Promise<Group[]> {
    // First get all groups the user is a member of
    const { data: memberData, error: memberError } = await supabase
      .from('messaging_group_members')
      .select('group_id')
      .eq('employee_id', userId)

    if (memberError) {
      console.error('Error fetching user groups:', memberError)
      throw memberError
    }

    if (!memberData || memberData.length === 0) {
      return []
    }

    const groupIds = memberData.map(m => m.group_id)

    // Fetch groups with details
    const { data: groups, error: groupError } = await supabase
      .from('messaging_groups')
      .select('*')
      .in('id', groupIds)
      .order('updated_at', { ascending: false })

    if (groupError) {
      console.error('Error fetching groups:', groupError)
      throw groupError
    }

    // Get member counts and last messages for each group
    const enrichedGroups = await Promise.all((groups || []).map(async (group) => {
      // Get member count
      const { count: memberCount } = await supabase
        .from('messaging_group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id)

      // Get last message
      const { data: lastMessageData } = await supabase
        .from('messaging_messages')
        .select('content, created_at')
        .eq('group_id', group.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Get unread count
      const { data: unreadMessages } = await supabase
        .from('messaging_messages')
        .select('id')
        .eq('group_id', group.id)
        .neq('sender_id', userId)
        .gt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days

      return {
        id: group.id,
        name: group.name,
        description: group.description,
        createdBy: group.created_by,
        createdAt: new Date(group.created_at),
        updatedAt: new Date(group.updated_at),
        memberCount: memberCount || 0,
        lastMessage: lastMessageData?.content,
        unreadCount: unreadMessages?.length || 0
      }
    }))

    return enrichedGroups
  }

  /**
   * Create a new group
   */
  static async createGroup(creatorId: string, groupData: CreateGroupRequest): Promise<Group> {
    // Create the group
    const { data: group, error: groupError } = await supabase
      .from('messaging_groups')
      .insert({
        name: groupData.name,
        description: groupData.description,
        created_by: creatorId
      })
      .select()
      .single()

    if (groupError) {
      console.error('Error creating group:', groupError)
      throw groupError
    }

    // Add members including the creator as admin
    const allMemberIds = [...new Set([creatorId, ...groupData.memberIds])]
    const memberInserts = allMemberIds.map(employeeId => ({
      group_id: group.id,
      employee_id: employeeId,
      role: employeeId === creatorId ? 'admin' : 'member'
    }))

    const { error: memberError } = await supabase
      .from('messaging_group_members')
      .insert(memberInserts)

    if (memberError) {
      console.error('Error adding members:', memberError)
      // Rollback by deleting the group (cascade will delete members)
      await supabase.from('messaging_groups').delete().eq('id', group.id)
      throw memberError
    }

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      createdBy: group.created_by,
      createdAt: new Date(group.created_at),
      updatedAt: new Date(group.updated_at),
      memberCount: allMemberIds.length,
      unreadCount: 0
    }
  }

  /**
   * Get messages for a group
   */
  static async getGroupMessages(
    groupId: number,
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<Message[]> {
    // Verify user is a member of the group
    const { data: membership } = await supabase
      .from('messaging_group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('employee_id', userId)
      .single()

    if (!membership) {
      throw new Error('Access denied: User is not a member of this group')
    }

    // Fetch messages
    const { data: messages, error } = await supabase
      .from('messaging_messages')
      .select('*')
      .eq('group_id', groupId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching messages:', error)
      throw error
    }

    // Get sender names from employees table
    const senderIds = [...new Set(messages?.map(m => m.sender_id) || [])]
    const { data: employees } = await supabase
      .from('employees')
      .select('emp_code, name')
      .in('emp_code', senderIds)

    const employeeMap = new Map((employees || []).map(e => [e.emp_code, e.name]))

    // Transform messages to match our Message type
    return (messages || []).reverse().map(msg => ({
      id: msg.id,
      groupId: msg.group_id,
      senderId: msg.sender_id,
      content: msg.content,
      messageType: msg.message_type as 'text' | 'image' | 'file',
      status: msg.status as 'pending' | 'sent',
      readBy: [], // Simplified - no read receipts
      createdAt: new Date(msg.created_at),
      editedAt: msg.edited_at ? new Date(msg.edited_at) : undefined,
      deletedAt: msg.deleted_at ? new Date(msg.deleted_at) : undefined,
      senderName: employeeMap.get(msg.sender_id) || msg.sender_id
    }))
  }

  /**
   * Send a new message
   */
  static async sendMessage(
    groupId: number,
    senderId: string,
    messageData: SendMessageRequest
  ): Promise<Message> {
    // Verify user is a member of the group
    const { data: membership } = await supabase
      .from('messaging_group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('employee_id', senderId)
      .single()

    if (!membership) {
      throw new Error('Access denied: User is not a member of this group')
    }

    // Insert the message
    const { data: message, error } = await supabase
      .from('messaging_messages')
      .insert({
        group_id: groupId,
        sender_id: senderId,
        content: messageData.content,
        message_type: messageData.messageType || 'text',
        status: 'sent'
      })
      .select()
      .single()

    if (error) {
      console.error('Error sending message:', error)
      throw error
    }

    // Update group's updated_at timestamp
    await supabase
      .from('messaging_groups')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', groupId)

    // Get sender name
    const { data: sender } = await supabase
      .from('employees')
      .select('name')
      .eq('emp_code', senderId)
      .single()

    const newMessage: Message = {
      id: message.id,
      groupId: message.group_id,
      senderId: message.sender_id,
      content: message.content,
      messageType: message.message_type as 'text' | 'image' | 'file',
      status: 'sent',
      readBy: [],
      createdAt: new Date(message.created_at),
      senderName: sender?.name || senderId
    }

    // Broadcast the new message to all other users in the group
    await this.broadcastNewMessage(groupId, newMessage)

    return newMessage
  }

  /**
   * Edit a message
   */
  static async editMessage(messageId: number, userId: string, newContent: string): Promise<Message> {
    // Get the original message
    const { data: originalMessage, error: fetchError } = await supabase
      .from('messaging_messages')
      .select('*')
      .eq('id', messageId)
      .single()

    if (fetchError || !originalMessage) {
      throw new Error('Message not found')
    }

    // Verify the user is the sender
    if (originalMessage.sender_id !== userId) {
      throw new Error('Access denied: You can only edit your own messages')
    }

    // Update the message
    const { data: updatedMessage, error: updateError } = await supabase
      .from('messaging_messages')
      .update({
        content: newContent,
        edited_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select()
      .single()

    if (updateError) {
      console.error('Error editing message:', updateError)
      throw updateError
    }

    // Get sender name
    const { data: sender } = await supabase
      .from('employees')
      .select('name')
      .eq('emp_code', userId)
      .single()

    const editedMessage: Message = {
      id: updatedMessage.id,
      groupId: updatedMessage.group_id,
      senderId: updatedMessage.sender_id,
      content: updatedMessage.content,
      messageType: updatedMessage.message_type as 'text' | 'image' | 'file',
      status: 'sent',
      readBy: [],
      createdAt: new Date(updatedMessage.created_at),
      editedAt: new Date(updatedMessage.edited_at),
      senderName: sender?.name || userId
    }

    // Broadcast the updated message to all other users in the group
    await this.broadcastMessageUpdate(originalMessage.group_id, editedMessage)

    return editedMessage
  }

  /**
   * Delete a message (soft delete)
   */
  static async deleteMessage(messageId: number, userId: string): Promise<void> {
    // Get the original message
    const { data: originalMessage, error: fetchError } = await supabase
      .from('messaging_messages')
      .select('sender_id, group_id')
      .eq('id', messageId)
      .single()

    if (fetchError || !originalMessage) {
      throw new Error('Message not found')
    }

    // Verify the user is the sender
    if (originalMessage.sender_id !== userId) {
      throw new Error('Access denied: You can only delete your own messages')
    }

    // Soft delete the message
    const { error: deleteError } = await supabase
      .from('messaging_messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', messageId)

    if (deleteError) {
      console.error('Error deleting message:', deleteError)
      throw deleteError
    }

    // Broadcast the message deletion to all other users in the group
    await this.broadcastMessageDelete(originalMessage.group_id, messageId)
  }

  /**
   * Subscribe to real-time updates for a group using Broadcast (works on free tier!)
   */
  static subscribeToGroup(
    groupId: number,
    callbacks: {
      onNewMessage?: (message: Message) => void
      onMessageUpdate?: (message: Message) => void
      onMessageDelete?: (messageId: number) => void
    }
  ) {
    const channel = supabase.channel(`group-${groupId}`)

    // Subscribe to broadcast messages
    channel.on(
      'broadcast',
      { event: 'new-message' },
      async (payload) => {
        if (callbacks.onNewMessage && payload.payload.message) {
          callbacks.onNewMessage(payload.payload.message)
        }
      }
    )

    channel.on(
      'broadcast',
      { event: 'update-message' },
      async (payload) => {
        if (callbacks.onMessageUpdate && payload.payload.message) {
          callbacks.onMessageUpdate(payload.payload.message)
        }
      }
    )

    channel.on(
      'broadcast',
      { event: 'delete-message' },
      async (payload) => {
        if (callbacks.onMessageDelete && payload.payload.messageId) {
          callbacks.onMessageDelete(payload.payload.messageId)
        }
      }
    )

    return channel.subscribe()
  }

  /**
   * Broadcast a new message to the group channel
   */
  static async broadcastNewMessage(groupId: number, message: Message) {
    const channel = supabase.channel(`group-${groupId}`)
    await channel.send({
      type: 'broadcast',
      event: 'new-message',
      payload: { message }
    })
  }

  /**
   * Broadcast a message update to the group channel
   */
  static async broadcastMessageUpdate(groupId: number, message: Message) {
    const channel = supabase.channel(`group-${groupId}`)
    await channel.send({
      type: 'broadcast',
      event: 'update-message',
      payload: { message }
    })
  }

  /**
   * Broadcast a message deletion to the group channel
   */
  static async broadcastMessageDelete(groupId: number, messageId: number) {
    const channel = supabase.channel(`group-${groupId}`)
    await channel.send({
      type: 'broadcast',
      event: 'delete-message',
      payload: { messageId }
    })
  }

  /**
   * Subscribe to typing indicators using Supabase Presence
   */
  static subscribeToTypingIndicators(
    groupId: number,
    userId: string,
    onTypingUpdate: (typingUsers: string[]) => void
  ) {
    const channel = supabase.channel(`typing-${groupId}`)

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const typingUsers = Object.values(state)
          .flat()
          .filter((user: any) => user.userId !== userId && user.isTyping)
          .map((user: any) => user.userId)
        onTypingUpdate(typingUsers)
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const state = channel.presenceState()
        const typingUsers = Object.values(state)
          .flat()
          .filter((user: any) => user.userId !== userId && user.isTyping)
          .map((user: any) => user.userId)
        onTypingUpdate(typingUsers)
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const state = channel.presenceState()
        const typingUsers = Object.values(state)
          .flat()
          .filter((user: any) => user.userId !== userId && user.isTyping)
          .map((user: any) => user.userId)
        onTypingUpdate(typingUsers)
      })

    return channel
  }

  /**
   * Send typing indicator
   */
  static async sendTypingIndicator(
    channel: any,
    userId: string,
    isTyping: boolean
  ) {
    await channel.track({
      userId,
      isTyping,
      timestamp: new Date().toISOString()
    })
  }
}
