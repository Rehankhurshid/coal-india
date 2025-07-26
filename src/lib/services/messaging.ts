import { supabase } from '@/lib/supabase'
import { Group, Message, CreateGroupRequest, SendMessageRequest } from '@/types/messaging'

export class MessagingService {
  /**
   * Get all groups for a user
   */
  static async getUserGroups(userId: string): Promise<Group[]> {
    try {
      const { data: userGroups, error } = await supabase
        .from('group_members')
        .select(`
          group_id,
          role,
          joined_at,
          groups!inner (
            id,
            name,
            description,
            created_by,
            created_at,
            updated_at
          )
        `)
        .eq('employee_id', userId)

      if (error) throw error

      // Enrich groups with additional data
      const enrichedGroups = await Promise.all(
        (userGroups || []).map(async (userGroup) => {
          const group = userGroup.groups as any

          // Get member count
          const { count: memberCount } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)

          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select(`
              content, 
              created_at, 
              sender_id,
              employees!messages_sender_id_fkey(name)
            `)
            .eq('group_id', group.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          // Get unread count for current user
          const { count: totalMessages } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)
            .is('deleted_at', null)

          // Count messages read by current user
          const { count: readMessages } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)
            .is('deleted_at', null)
            .contains('read_by', [userId])

          const unreadCount = Math.max(0, (totalMessages || 0) - (readMessages || 0))

          return {
            id: group.id,
            name: group.name,
            description: group.description,
            createdBy: group.created_by,
            createdAt: new Date(group.created_at),
            updatedAt: new Date(group.updated_at),
            memberCount: memberCount || 0,
            lastMessage: lastMessage?.content || undefined,
            unreadCount: unreadCount,
          }
        })
      )

      return enrichedGroups
    } catch (error) {
      console.error('Error fetching user groups:', error)
      throw error
    }
  }

  /**
   * Create a new group
   */
  static async createGroup(creatorId: string, groupData: CreateGroupRequest): Promise<Group> {
    try {
      // Create the group
      const { data: newGroup, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: groupData.name,
          description: groupData.description,
          created_by: creatorId
        })
        .select()
        .single()

      if (groupError) throw groupError

      // Add creator as admin
      const membersToAdd = [
        { group_id: newGroup.id, employee_id: creatorId, role: 'admin' },
        ...groupData.memberIds
          .filter(id => id !== creatorId)
          .map(id => ({ group_id: newGroup.id, employee_id: id, role: 'member' }))
      ]

      const { error: membersError } = await supabase
        .from('group_members')
        .insert(membersToAdd)

      if (membersError) {
        // Clean up the group if member addition fails
        await supabase.from('groups').delete().eq('id', newGroup.id)
        throw membersError
      }

      return {
        id: newGroup.id,
        name: newGroup.name,
        description: newGroup.description,
        createdBy: newGroup.created_by,
        createdAt: new Date(newGroup.created_at),
        updatedAt: new Date(newGroup.updated_at),
        memberCount: membersToAdd.length,
        lastMessage: undefined,
        unreadCount: 0
      }
    } catch (error) {
      console.error('Error creating group:', error)
      throw error
    }
  }

  /**
   * Get messages for a group
   */
  static async getGroupMessages(groupId: number, userId: string, limit = 50, offset = 0): Promise<Message[]> {
    try {
      // Verify user is a member of the group
      const { data: membership } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('employee_id', userId)
        .single()

      if (!membership) {
        throw new Error('Access denied: User is not a member of this group')
      }

      // Fetch messages with sender information and reply data
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          group_id,
          sender_id,
          content,
          message_type,
          status,
          read_by,
          created_at,
          edited_at,
          deleted_at,
          reply_to_id,
          edit_count,
          employees!messages_sender_id_fkey(name),
          reply_message:messages!reply_to_id(
            id,
            content,
            sender_id,
            employees!messages_sender_id_fkey(name)
          )
        `)
        .eq('group_id', groupId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      // Transform messages with sender names and reply context
      const transformedMessages: Message[] = (messages || []).map((msg: any) => ({
        id: msg.id,
        groupId: msg.group_id,
        senderId: msg.sender_id,
        content: msg.content,
        messageType: msg.message_type,
        status: msg.status,
        readBy: msg.read_by || [],
        createdAt: new Date(msg.created_at),
        editedAt: msg.edited_at ? new Date(msg.edited_at) : undefined,
        deletedAt: msg.deleted_at ? new Date(msg.deleted_at) : undefined,
        senderName: msg.employees?.name || 'Unknown User',
        editCount: msg.edit_count || 0,
        replyToMessage: msg.reply_message ? {
          id: msg.reply_message.id,
          content: msg.reply_message.content,
          senderName: msg.reply_message.employees?.name || 'Unknown User'
        } : undefined
      }))

      return transformedMessages.reverse() // Return in chronological order
    } catch (error) {
      console.error('Error fetching messages:', error)
      throw error
    }
  }

  /**
   * Send a new message
   */
  static async sendMessage(
    groupId: number, 
    senderId: string, 
    messageData: SendMessageRequest
  ): Promise<Message> {
    try {
      // Verify user is a member of the group
      const { data: membership } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('employee_id', senderId)
        .single()

      if (!membership) {
        throw new Error('Access denied: User is not a member of this group')
      }

      // Insert the new message
      const { data: newMessage, error: insertError } = await supabase
        .from('messages')
        .insert({
          group_id: groupId,
          sender_id: senderId,
          content: messageData.content.trim(),
          message_type: messageData.messageType || 'text',
          reply_to_id: messageData.replyToId || null,
          status: 'sent'
        })
        .select(`
          id,
          group_id,
          sender_id,
          content,
          message_type,
          status,
          read_by,
          created_at,
          reply_to_id,
          employees!messages_sender_id_fkey(name),
          reply_message:messages!reply_to_id(
            id,
            content,
            sender_id,
            employees!messages_sender_id_fkey(name)
          )
        `)
        .single()

      if (insertError) throw insertError

      // Update group's updated_at timestamp
      await supabase
        .from('groups')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', groupId)

      // Transform the message response
      const message: Message = {
        id: newMessage.id,
        groupId: newMessage.group_id,
        senderId: newMessage.sender_id,
        content: newMessage.content,
        messageType: newMessage.message_type,
        status: newMessage.status,
        readBy: newMessage.read_by || [],
        createdAt: new Date(newMessage.created_at),
        senderName: (newMessage.employees as any)?.name || 'Unknown User',
        replyToMessage: newMessage.reply_message ? {
          id: (newMessage.reply_message as any).id,
          content: (newMessage.reply_message as any).content,
          senderName: (newMessage.reply_message as any).employees?.name || 'Unknown User'
        } : undefined
      }

      return message
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(groupId: number, userId: string, messageIds: number[]): Promise<number> {
    try {
      // Verify user is a member of the group
      const { data: membership } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('employee_id', userId)
        .single()

      if (!membership) {
        throw new Error('Access denied: User is not a member of this group')
      }

      let successCount = 0

      // For each message, add current user to read_by array if not already there
      for (const messageId of messageIds) {
        // First get the current read_by array
        const { data: currentMessage } = await supabase
          .from('messages')
          .select('read_by')
          .eq('id', messageId)
          .eq('group_id', groupId)
          .single()

        if (currentMessage) {
          const readBy = currentMessage.read_by || []
          if (!readBy.includes(userId)) {
            readBy.push(userId)
            const { error } = await supabase
              .from('messages')
              .update({ read_by: readBy })
              .eq('id', messageId)

            if (!error) successCount++
          } else {
            successCount++ // Already read
          }
        }
      }

      return successCount
    } catch (error) {
      console.error('Error marking messages as read:', error)
      throw error
    }
  }

  /**
   * Edit a message
   */
  static async editMessage(messageId: number, userId: string, newContent: string): Promise<Message> {
    try {
      // Get the current message to verify ownership
      const { data: currentMessage, error: fetchError } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          group_id,
          edit_count,
          employees!messages_sender_id_fkey(name)
        `)
        .eq('id', messageId)
        .single()

      if (fetchError || !currentMessage) {
        throw new Error('Message not found')
      }

      if (currentMessage.sender_id !== userId) {
        throw new Error('Access denied: You can only edit your own messages')
      }

      // Update the message
      const { data: updatedMessage, error: updateError } = await supabase
        .from('messages')
        .update({
          content: newContent.trim(),
          edited_at: new Date().toISOString(),
          edit_count: (currentMessage.edit_count || 0) + 1
        })
        .eq('id', messageId)
        .select(`
          id,
          group_id,
          sender_id,
          content,
          message_type,
          status,
          read_by,
          created_at,
          edited_at,
          edit_count,
          reply_to_id,
          employees!messages_sender_id_fkey(name),
          reply_message:messages!reply_to_id(
            id,
            content,
            sender_id,
            employees!messages_sender_id_fkey(name)
          )
        `)
        .single()

      if (updateError) throw updateError

      return {
        id: updatedMessage.id,
        groupId: updatedMessage.group_id,
        senderId: updatedMessage.sender_id,
        content: updatedMessage.content,
        messageType: updatedMessage.message_type,
        status: updatedMessage.status,
        readBy: updatedMessage.read_by || [],
        createdAt: new Date(updatedMessage.created_at),
        editedAt: new Date(updatedMessage.edited_at),
        senderName: (updatedMessage.employees as any)?.name || 'Unknown User',
        editCount: updatedMessage.edit_count || 0,
        replyToMessage: updatedMessage.reply_message ? {
          id: (updatedMessage.reply_message as any).id,
          content: (updatedMessage.reply_message as any).content,
          senderName: (updatedMessage.reply_message as any).employees?.name || 'Unknown User'
        } : undefined
      }
    } catch (error) {
      console.error('Error editing message:', error)
      throw error
    }
  }

  /**
   * Delete a message (soft delete)
   */
  static async deleteMessage(messageId: number, userId: string): Promise<void> {
    try {
      // Get the current message to verify ownership
      const { data: currentMessage, error: fetchError } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('id', messageId)
        .single()

      if (fetchError || !currentMessage) {
        throw new Error('Message not found')
      }

      if (currentMessage.sender_id !== userId) {
        throw new Error('Access denied: You can only delete your own messages')
      }

      // Soft delete the message
      const { error: deleteError } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId)

      if (deleteError) throw deleteError
    } catch (error) {
      console.error('Error deleting message:', error)
      throw error
    }
  }

  /**
   * Get group members
   */
  static async getGroupMembers(groupId: number, userId: string) {
    try {
      // Verify user is a member of the group
      const { data: membership } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('employee_id', userId)
        .single()

      if (!membership) {
        throw new Error('Access denied: User is not a member of this group')
      }

      const { data: members, error } = await supabase
        .from('group_members')
        .select(`
          id,
          employee_id,
          role,
          joined_at,
          employees!group_members_employee_id_fkey(
            emp_code,
            name,
            designation,
            dept,
            profile_image
          )
        `)
        .eq('group_id', groupId)

      if (error) throw error

      return members?.map(member => ({
        id: member.id,
        employeeId: member.employee_id,
        role: member.role,
        joinedAt: new Date(member.joined_at),
        employee: member.employees
      })) || []
    } catch (error) {
      console.error('Error fetching group members:', error)
      throw error
    }
  }
}
