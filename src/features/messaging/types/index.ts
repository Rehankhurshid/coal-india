// Import types from main types directory
import type { Message, Group, GroupMember } from '@/types/messaging';

// Re-export imported types
export type { Message, Group, GroupMember };

// Extract types from message interface
export type MessageType = 'text' | 'image' | 'file';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read';

// Feature-specific types
export interface MessagingState {
  groups: Group[];
  currentGroup: Group | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  typingUsers: string[];
  isConnected: boolean;
  selectedGroupId: number | null;
}

export interface MessagingContextValue extends MessagingState {
  // Actions
  loadGroups: () => Promise<void>;
  selectGroup: (groupId: number) => Promise<void>;
  sendMessage: (params: SendMessageParams) => Promise<void>;
  editMessage: (messageId: number, content: string) => Promise<void>;
  deleteMessage: (messageId: number) => Promise<void>;
  createGroup: (params: CreateGroupParams) => Promise<void>;
  sendTypingIndicator: (isTyping: boolean) => void;
  clearError: () => void;
}

export interface SendMessageParams {
  content: string;
  messageType: MessageType;
  replyToId?: number;
}

export interface CreateGroupParams {
  name: string;
  description: string;
  memberIds: string[];
}

export interface MessageDialogState {
  open: boolean;
  message: Message | null;
}

export interface GroupModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  group?: {
    name: string;
    description: string;
    members: GroupMember[];
  };
}

// UI States
export interface ChatAreaProps {
  currentGroup: Group;
  messages: Message[];
  currentUserId: string;
  onlineUsersCount: number;
  showBackButton: boolean;
  typingUsers: string[];
  replyingTo: Message | null;
  isOnline: boolean;
  isConnected: boolean;
  onBackClick: () => void;
  onSettingsClick: () => void;
  onSendMessage: (content: string, replyTo?: Message) => Promise<void>;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onCopy: (content: string) => void;
  onClearReply: () => void;
  onTyping: (isTyping: boolean) => void;
}

export interface SidebarProps {
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
