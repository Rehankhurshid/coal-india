// Messaging System Types

export interface Group {
  id: number;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  memberCount?: number;
  lastMessage?: string;
  unreadCount?: number;
}

export interface GroupMember {
  id: number;
  groupId: number;
  employeeId: string;
  role: 'admin' | 'member';
  joinedAt: Date;
}

export interface Message {
  id: number;
  groupId: number;
  senderId: string;
  content: string;
  messageType: 'text' | 'image' | 'file';
  status: 'pending' | 'sent' | 'delivered' | 'read';
  readBy: string[];
  createdAt: Date;
  editedAt?: Date;
  deletedAt?: Date;
  senderName?: string; // Populated from employee data
  replyToMessage?: {
    id: number;
    content: string;
    senderName: string;
  };
  reactions?: MessageReaction[];
  editCount?: number;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  userName: string;
  createdAt: Date;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  conversationId: string;
  isTyping: boolean;
  timestamp: Date;
}

export interface WebSocketMessage {
  type: 'message' | 'typing' | 'reaction' | 'edit' | 'delete' | 'presence';
  payload: any;
  timestamp: Date;
}

export interface ConnectionStatus {
  isConnected: boolean;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastConnected?: Date;
  reconnectAttempts: number;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  memberIds: string[];
}

export interface SendMessageRequest {
  content: string;
  messageType?: 'text' | 'image' | 'file';
  replyToId?: number;
}

export interface Employee {
  id: string;
  name: string;
  initials: string;
  employeeId: string;
  designation: string;
  department: string;
  location: string;
  grade: string;
  category: string;
  gender: string;
  avatar?: string; // Optional URL for the employee's avatar image
  isStarred?: boolean; // Optional starred status
}
