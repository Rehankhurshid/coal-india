import { supabase } from '@/lib/supabase';
import { Message, Group } from '@/types/messaging';
import { CreateGroupParams, SendMessageParams } from '../types';

export class MessagingService {
  static async getGroups(userId: string): Promise<Group[]> {
    const response = await fetch('/api/messaging/groups', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch groups');
    }

    const data = await response.json();
    return data.groups || [];
  }

  static async getMessages(groupId: number, limit = 50, offset = 0): Promise<Message[]> {
    const response = await fetch(
      `/api/messaging/groups/${groupId}/messages?limit=${limit}&offset=${offset}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch messages');
    }

    const data = await response.json();
    return data.messages || [];
  }

  static async sendMessage(groupId: number, params: SendMessageParams): Promise<Message> {
    const response = await fetch(`/api/messaging/groups/${groupId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: params.content,
        messageType: params.messageType,
        replyToId: params.replyToId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send message');
    }

    const data = await response.json();
    return data.message;
  }

  static async editMessage(messageId: number, content: string): Promise<void> {
    const response = await fetch(`/api/messaging/messages/${messageId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to edit message');
    }
  }

  static async deleteMessage(messageId: number): Promise<void> {
    const response = await fetch(`/api/messaging/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete message');
    }
  }

  static async createGroup(params: CreateGroupParams): Promise<Group> {
    const response = await fetch('/api/messaging/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: params.name,
        description: params.description,
        members: params.memberIds,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create group');
    }

    const data = await response.json();
    return data.group;
  }

  // Realtime subscriptions
  static subscribeToGroupMessages(
    groupId: number,
    onMessage: (message: Message) => void,
    onEdit: (message: Message) => void,
    onDelete: (messageId: number) => void
  ) {
    const channel = supabase
      .channel(`group-${groupId}-messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          onMessage(payload.new as Message);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          onEdit(payload.new as Message);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          onDelete(payload.old.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  static subscribeToTypingIndicators(
    groupId: number,
    onTyping: (userId: string, isTyping: boolean) => void
  ) {
    const channel = supabase
      .channel(`group-${groupId}-typing`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        Object.keys(state).forEach((userId) => {
          const userState = state[userId][0] as any;
          onTyping(userId, userState?.typing || false);
        });
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        newPresences.forEach((presence: any) => {
          onTyping(key, presence.typing || false);
        });
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        onTyping(key, false);
      })
      .subscribe();

    return {
      sendTyping: (isTyping: boolean) => {
        channel.track({ typing: isTyping });
      },
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
    };
  }
}
