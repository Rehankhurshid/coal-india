import { Message, Group } from '@/types/messaging';

export type MessagingActionType =
  | 'SET_LOADING'
  | 'SET_ERROR'
  | 'CLEAR_ERROR'
  | 'SET_GROUPS'
  | 'SET_CURRENT_GROUP'
  | 'SET_MESSAGES'
  | 'ADD_MESSAGE'
  | 'UPDATE_MESSAGE'
  | 'DELETE_MESSAGE'
  | 'SET_TYPING_USERS'
  | 'ADD_TYPING_USER'
  | 'REMOVE_TYPING_USER'
  | 'SET_CONNECTION_STATUS'
  | 'SET_SELECTED_GROUP_ID';

export interface MessagingAction {
  type: MessagingActionType;
  payload?: any;
}

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

export const initialMessagingState: MessagingState = {
  groups: [],
  currentGroup: null,
  messages: [],
  loading: false,
  error: null,
  typingUsers: [],
  isConnected: false,
  selectedGroupId: null,
};

export function messagingReducer(
  state: MessagingState,
  action: MessagingAction
): MessagingState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'SET_GROUPS':
      return { ...state, groups: action.payload };

    case 'SET_CURRENT_GROUP':
      return { ...state, currentGroup: action.payload };

    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };

    case 'ADD_MESSAGE':
      return { 
        ...state, 
        messages: [...state.messages, action.payload],
        // Update last message in group
        groups: state.groups.map(group => 
          group.id === action.payload.groupId
            ? { ...group, lastMessage: action.payload.content }
            : group
        )
      };

    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id ? action.payload : msg
        ),
      };

    case 'DELETE_MESSAGE':
      return {
        ...state,
        messages: state.messages.filter(msg => msg.id !== action.payload),
      };

    case 'SET_TYPING_USERS':
      return { ...state, typingUsers: action.payload };

    case 'ADD_TYPING_USER':
      return {
        ...state,
        typingUsers: state.typingUsers.includes(action.payload)
          ? state.typingUsers
          : [...state.typingUsers, action.payload],
      };

    case 'REMOVE_TYPING_USER':
      return {
        ...state,
        typingUsers: state.typingUsers.filter(user => user !== action.payload),
      };

    case 'SET_CONNECTION_STATUS':
      return { ...state, isConnected: action.payload };

    case 'SET_SELECTED_GROUP_ID':
      return { ...state, selectedGroupId: action.payload };

    default:
      return state;
  }
}
