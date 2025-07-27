"use client"

import { RealDataMessagingApp } from '@/components/real-data-messaging-app'

export default function RealMessagingPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Real Data Messaging</h1>
        <p className="text-muted-foreground">
          Messaging app with real Supabase data integration
        </p>
      </div>
      
      <RealDataMessagingApp currentUserId="90145293" />
    </div>
  )
}
