'use client';

import React from 'react';
import { EnhancedMessagingAppRealData } from '@/components/enhanced-messaging-app-real-data';
import { getCurrentUserId } from '@/lib/auth/client-auth';

export function MessagingContent() {
  const currentUserId = getCurrentUserId();

  if (!currentUserId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-red-500">User not authenticated</p>
      </div>
    );
  }

  // For now, we'll use the existing EnhancedMessagingAppRealData component
  // In a future refactor, this would be replaced with proper messaging components
  return <EnhancedMessagingAppRealData currentUserId={currentUserId} />;
}
