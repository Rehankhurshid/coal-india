#!/bin/bash

# Deploy Real-time Chat to Vercel
# Quick deployment script for the real-time messaging features

set -e

echo "🚀 Deploying Real-time Chat to Vercel..."
echo ""
echo "📋 Pre-deployment Checklist:"
echo "✓ Real-time messaging uses Supabase Broadcast (free tier compatible)"
echo "✓ No additional configuration needed"
echo "✓ Works with existing Supabase connection"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel >/dev/null 2>&1; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "⚡ Real-time Features Being Deployed:"
echo "• Instant message delivery"
echo "• Live message updates/edits"
echo "• Real-time message deletion"
echo "• Typing indicators"
echo "• Presence tracking"
echo ""

echo "🔧 Required Environment Variables:"
echo "• NEXT_PUBLIC_SUPABASE_URL"
echo "• NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "• SUPABASE_SERVICE_ROLE_KEY"
echo "• JWT_SECRET"
echo "• NEXT_PUBLIC_APP_URL"
echo ""

read -p "Have you set all required environment variables in Vercel? (y/n): " confirm

if [[ $confirm != [yY] ]]; then
    echo ""
    echo "📌 To set environment variables:"
    echo "1. Go to: https://vercel.com/dashboard"
    echo "2. Select your project"
    echo "3. Go to Settings → Environment Variables"
    echo "4. Add the required variables"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo ""
echo "🚀 Starting deployment..."

# Deploy to Vercel
vercel --prod

echo ""
echo "✅ Real-time Chat Deployed Successfully!"
echo ""
echo "🧪 To test real-time features:"
echo "1. Open your app in two different browsers"
echo "2. Log in with different users"
echo "3. Join the same group"
echo "4. Send messages - they appear instantly!"
echo "5. Try editing/deleting messages"
echo "6. Watch typing indicators"
echo ""
echo "📚 Documentation:"
echo "• Real-time Integration: docs/REALTIME-MESSAGING-INTEGRATION.md"
echo "• Alternatives Guide: docs/VERCEL-REALTIME-ALTERNATIVES.md"
echo ""
echo "🎉 Your real-time messaging is now live!"
