import { Group, Message, CreateGroupRequest, SendMessageRequest } from '@/types/messaging'

export class MessagingApiService {
  private static baseUrl = '/api/messaging'

  /**
   * Get all groups for a user
   */
  static async getUserGroups(userId: string): Promise<Group[]> {
    try {
      const response = await fetch(`${this.baseUrl}/groups?userId=${userId}`)
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
  static async createGroup(creatorId: string, groupData: CreateGroupRequest): Promise<Group> {
    try {
      const response = await fetch(`${this.baseUrl}/groups?userId=${creatorId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: groupData.name,
          description: groupData.description,
          createdBy: creatorId,
          memberIds: groupData.memberIds
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create group: ${response.statusText}`)
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
    userId: string, 
    limit = 50, 
    offset = 0
  ): Promise<Message[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/groups/${groupId}/messages?userId=${userId}&limit=${limit}&offset=${offset}`
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
    senderId: string, 
    messageData: SendMessageRequest
  ): Promise<Message> {
    try {
      const response = await fetch(
        `${this.baseUrl}/groups/${groupId}/messages?userId=${senderId}`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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
    userId: string, 
    messageIds: number[]
  ): Promise<number> {
    try {
      const response = await fetch(
        `${this.baseUrl}/groups/${groupId}/messages?userId=${userId}`, 
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messageIds })
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to mark messages as read: ${response.statusText}`)
      }

      const data = await response.json()
      return data.updatedCount || 0
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
      const response = await fetch(
        `${this.baseUrl}/messages/${messageId}?userId=${userId}`, 
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
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
  static async deleteMessage(messageId: number, userId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/messages/${messageId}?userId=${userId}`, 
        {
          method: 'DELETE'
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
