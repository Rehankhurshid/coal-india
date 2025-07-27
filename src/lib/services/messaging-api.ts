import { Group, Message, CreateGroupRequest, SendMessageRequest } from '@/types/messaging'
import { getAuthHeaders } from '@/lib/auth/client-auth'

export class MessagingApiService {
  private static baseUrl = '/api/messaging'

  /**
   * Get all groups for a user
   */
  static async getUserGroups(): Promise<Group[]> {
    try {
      const response = await fetch(`${this.baseUrl}/groups`, {
        headers: getAuthHeaders()
      })

      // Handle unauthorized gracefully
      if (response.status === 401) {
        console.warn('Unauthorized fetching groups, returning empty list');
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch groups: ${response.statusText}`)
      }
      const data = await response.json()
      return data.groups || []
    } catch (error) {
      console.error('Error fetching user groups:', error)
      throw error
    }
  }

  /**
   * Create a new group
   */
  static async createGroup(groupData: CreateGroupRequest): Promise<Group | null> {
    try {
      const response = await fetch(`${this.baseUrl}/groups`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: groupData.name,
          description: groupData.description,
          memberIds: groupData.memberIds
        })
      })

      if (!response.ok) {
        // Let the actual server error message propagate
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Failed to create group: ${response.statusText}`);
      }

      const data = await response.json()
      return data.group
    } catch (error) {
      console.error('Error creating group:', error)
      throw error
    }
  }

  /**
   * Get messages for a group
   */
  static async getGroupMessages(
    groupId: number, 
    limit = 50, 
    offset = 0
  ): Promise<Message[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/groups/${groupId}/messages?limit=${limit}&offset=${offset}`,
        {
          headers: getAuthHeaders()
        }
      )
      
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`)
      }

      const data = await response.json()
      return data.messages || []
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
    messageData: SendMessageRequest
  ): Promise<Message> {
    try {
      const response = await fetch(
        `${this.baseUrl}/groups/${groupId}/messages`, 
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(messageData)
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`)
      }

      const data = await response.json()
      return data.message
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(
    groupId: number, 
    messageIds: number[]
  ): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/groups/${groupId}/messages`,
        {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ messageIds, action: 'mark_read' })
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to mark messages as read: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error marking messages as read:', error)
      throw error
    }
  }

  /**
   * Edit a message
   */
  static async editMessage(groupId: number, messageId: number, newContent: string): Promise<Message> {
    try {
      const response = await fetch(
        `${this.baseUrl}/groups/${groupId}/messages/${messageId}`, 
        {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ content: newContent })
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to edit message: ${response.statusText}`)
      }

      const data = await response.json()
      return data.message
    } catch (error) {
      console.error('Error editing message:', error)
      throw error
    }
  }

  /**
   * Delete a message
   */
  static async deleteMessage(groupId: number, messageId: number): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/groups/${groupId}/messages/${messageId}`, 
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to delete message: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error deleting message:', error)
      throw error
    }
  }
}
