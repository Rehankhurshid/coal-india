'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { MessagingService } from '../services/messaging.service';
import { messagingReducer, initialMessagingState } from './messaging.reducer';
import type { MessagingContextValue, SendMessageParams, CreateGroupParams } from '../types';

const MessagingContext = createContext<MessagingContextValue | null>(null);

interface MessagingProviderProps {
  children: React.ReactNode;
  userId: string;
}

export function MessagingProvider({ children, userId }: MessagingProviderProps) {
  const [state, dispatch] = useReducer(messagingReducer, initialMessagingState);
  const typingChannelRef = useRef<any>(null);
  const messageSubscriptionRef = useRef<(() => void) | null>(null);

  // Load groups
  const loadGroups = useCallback(async () => {
    if (!userId) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const groups = await MessagingService.getGroups(userId);
      dispatch({ type: 'SET_GROUPS', payload: groups });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [userId]);

  // Select a group
  const selectGroup = useCallback(async (groupId: number) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_SELECTED_GROUP_ID', payload: groupId });

    try {
      // Find group from state
      const group = state.groups.find(g => g.id === groupId);
      if (!group) throw new Error('Group not found');

      dispatch({ type: 'SET_CURRENT_GROUP', payload: group });

      // Load messages
      const messages = await MessagingService.getMessages(groupId);
      dispatch({ type: 'SET_MESSAGES', payload: messages });

      // Clean up previous subscriptions
      if (messageSubscriptionRef.current) {
        messageSubscriptionRef.current();
      }
      if (typingChannelRef.current) {
        typingChannelRef.current.unsubscribe();
      }

      // Subscribe to messages
      messageSubscriptionRef.current = MessagingService.subscribeToGroupMessages(
        groupId,
        (message) => dispatch({ type: 'ADD_MESSAGE', payload: message }),
        (message) => dispatch({ type: 'UPDATE_MESSAGE', payload: message }),
        (messageId) => dispatch({ type: 'DELETE_MESSAGE', payload: messageId })
      );

      // Subscribe to typing indicators
      typingChannelRef.current = MessagingService.subscribeToTypingIndicators(
        groupId,
        (userId, isTyping) => {
          if (isTyping) {
            dispatch({ type: 'ADD_TYPING_USER', payload: userId });
          } else {
            dispatch({ type: 'REMOVE_TYPING_USER', payload: userId });
          }
        }
      );

      dispatch({ type: 'SET_CONNECTION_STATUS', payload: true });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.groups]);

  // Send message
  const sendMessage = useCallback(async (params: SendMessageParams) => {
    if (!state.currentGroup || !userId) return;

    try {
      const message = await MessagingService.sendMessage(state.currentGroup.id, params);
      // Message will be added via realtime subscription
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [state.currentGroup, userId]);

  // Edit message
  const editMessage = useCallback(async (messageId: number, content: string) => {
    try {
      await MessagingService.editMessage(messageId, content);
      // Update will be handled via realtime subscription
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  // Delete message
  const deleteMessage = useCallback(async (messageId: number) => {
    try {
      await MessagingService.deleteMessage(messageId);
      // Deletion will be handled via realtime subscription
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  // Create group
  const createGroup = useCallback(async (params: CreateGroupParams) => {
    if (!userId) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const group = await MessagingService.createGroup(params);
      dispatch({ type: 'SET_GROUPS', payload: [...state.groups, group] });
      // Select the newly created group
      await selectGroup(group.id);
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [userId, state.groups, selectGroup]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (typingChannelRef.current) {
      typingChannelRef.current.sendTyping(isTyping);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Load groups on mount
  useEffect(() => {
    if (userId) {
      loadGroups();
    }
  }, [userId, loadGroups]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (messageSubscriptionRef.current) {
        messageSubscriptionRef.current();
      }
      if (typingChannelRef.current) {
        typingChannelRef.current.unsubscribe();
      }
    };
  }, []);

  const value: MessagingContextValue = {
    ...state,
    loadGroups,
    selectGroup,
    sendMessage,
    editMessage,
    deleteMessage,
    createGroup,
    sendTypingIndicator,
    clearError,
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
}
