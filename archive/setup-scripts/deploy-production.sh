#!/bin/bash

# Quick Production Deployment Script for Coal India Directory
# This script deploys using your actual credentials and production configuration

echo "🚀 Deploying Coal India Directory to Production..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm i -g vercel
fi

echo "📝 Setting production environment variables..."

# Read from the production environment file
source .env.production

# Set all environment variables for production
vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "$NEXT_PUBLIC_SUPABASE_URL"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "$SUPABASE_SERVICE_ROLE_KEY"

# Database URLs with connection pooling
vercel env add DATABASE_URL production <<< "$DATABASE_URL"
vercel env add DIRECT_URL production <<< "$DIRECT_URL"

# Authentication & Security
vercel env add JWT_SECRET production <<< "$JWT_SECRET"
vercel env add NEXTAUTH_SECRET production <<< "$NEXTAUTH_SECRET"
vercel env add ENCRYPTION_KEY production <<< "$ENCRYPTION_KEY"

# App Configuration
vercel env add NEXT_PUBLIC_APP_URL production <<< "$NEXT_PUBLIC_APP_URL"
vercel env add NEXTAUTH_URL production <<< "$NEXTAUTH_URL"
vercel env add NODE_ENV production <<< "$NODE_ENV"

# App Metadata
vercel env add NEXT_PUBLIC_APP_NAME production <<< "$NEXT_PUBLIC_APP_NAME"
vercel env add NEXT_PUBLIC_APP_VERSION production <<< "$NEXT_PUBLIC_APP_VERSION"

# Feature Flags
vercel env add NEXT_PUBLIC_ENABLE_MESSAGING production <<< "$NEXT_PUBLIC_ENABLE_MESSAGING"
vercel env add NEXT_PUBLIC_ENABLE_ADVANCED_SEARCH production <<< "$NEXT_PUBLIC_ENABLE_ADVANCED_SEARCH"
vercel env add NEXT_PUBLIC_ENABLE_EXPORT production <<< "$NEXT_PUBLIC_ENABLE_EXPORT"

# File Upload Configuration
vercel env add NEXT_PUBLIC_MAX_FILE_SIZE production <<< "$NEXT_PUBLIC_MAX_FILE_SIZE"

# Push Notifications
vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production <<< "$NEXT_PUBLIC_VAPID_PUBLIC_KEY"
vercel env add VAPID_PRIVATE_KEY production <<< "$VAPID_PRIVATE_KEY"
vercel env add VAPID_EMAIL production <<< "$VAPID_EMAIL"

echo "✅ Environment variables configured!"
echo ""
echo "🔄 Deploying to production..."
vercel --prod

echo ""
echo "✨ Production deployment complete!"
echo ""
echo "🔗 Your app should be available at: $NEXT_PUBLIC_APP_URL"
echo ""
echo "📋 Test these features:"
echo "  ✓ Login with OTP authentication"
echo "  ✓ Create messaging groups"
echo "  ✓ Send messages in groups"
echo "  ✓ Employee directory search"
echo ""
echo "🛠️ Debug endpoints:"
echo "  • $NEXT_PUBLIC_APP_URL/api/debug/env-check"
echo "  • $NEXT_PUBLIC_APP_URL/api/auth/debug"
