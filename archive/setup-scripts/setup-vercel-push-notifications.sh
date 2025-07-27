#!/bin/bash

# Setup Push Notifications for Vercel Deployment
# This script provides instructions for enabling push notifications

set -e

echo "🔔 Setting up Push Notifications for Vercel..."
echo ""
echo "📋 Push notifications use Web Push API with Supabase for storage"
echo ""
echo "⚡ Setup Steps:"
echo ""
echo "1️⃣  Generate VAPID Keys (for Web Push):"
echo "    Visit: https://vapidkeys.com/"
echo "    Save the Public and Private keys"
echo ""
echo "2️⃣  Add to Vercel Environment Variables:"
echo "    NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key"
echo "    VAPID_PRIVATE_KEY=your-private-key"
echo "    NEXT_PUBLIC_APP_URL=https://your-app.vercel.app"
echo ""
echo "3️⃣  Run Database Setup:"
echo "    Execute this SQL in Supabase SQL Editor:"
echo ""
cat << 'EOF'
-- Push notification subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id varchar(255) NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage their own subscriptions" ON push_subscriptions
  FOR ALL TO authenticated
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

-- Index for faster lookups
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
EOF
echo ""
echo "4️⃣  Deploy Service Worker:"
echo "    The sw.js file in /public handles push notifications"
echo "    It's already configured and will be deployed automatically"
echo ""
echo "5️⃣  Features Enabled:"
echo "    • New message notifications"
echo "    • Group invitation alerts"
echo "    • Message reaction notifications"
echo "    • Offline message queue"
echo "    • Background sync"
echo ""
echo "📝 Testing Push Notifications:"
echo "    1. Deploy with: vercel --prod"
echo "    2. Allow notifications when prompted"
echo "    3. Send a test message from another browser"
echo "    4. Check notification appears!"
echo ""
echo "🔧 Troubleshooting:"
echo "    • Check browser supports notifications"
echo "    • Verify HTTPS is enabled (required for push)"
echo "    • Check VAPID keys are correct"
echo "    • Review browser console for errors"
echo ""
