'use client';

import React from 'react';
import { MessagingProvider } from '../store/messaging.context';
import { MessagingContent } from './messaging-content';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export function MessagingPage() {
  const { currentUserId, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-red-500">Authentication error. Please log in again.</p>
      </div>
    );
  }

  return (
    <MessagingProvider userId={currentUserId}>
      <MessagingContent />
    </MessagingProvider>
  );
}
