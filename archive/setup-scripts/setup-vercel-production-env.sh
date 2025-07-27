#!/bin/bash

# Production-ready Vercel environment setup with complete configuration
# This matches the environment variables from a properly deployed SECL app

echo "🚀 Setting up Production Vercel Environment for Coal India Directory..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Please install it first:"
    echo "npm i -g vercel"
    exit 1
fi

# Read current environment variables
source .env.local

echo "📋 Current Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"

# Extract project details from Supabase URL
if [[ $NEXT_PUBLIC_SUPABASE_URL =~ https://([^.]+)\.supabase\.co ]]; then
    PROJECT_REF="${BASH_REMATCH[1]}"
    echo "🔍 Detected Supabase project reference: $PROJECT_REF"
else
    echo "❌ Could not extract project reference from Supabase URL"
    exit 1
fi

# Determine region (adjust based on your Supabase region)
REGION="aws-0-ap-south-1"  # Common: aws-0-us-east-1, aws-0-eu-west-1, aws-0-ap-south-1

echo "🌍 Using region: $REGION"
echo "⚠️  If this is incorrect, please update the REGION variable in this script"

# Get database password
echo ""
echo "🔐 Enter your Supabase database password:"
echo "Find this in: Supabase Dashboard > Settings > Database > Connection string"
echo ""
read -p "Database Password: " -s DB_PASSWORD
echo ""

# Get app URL
echo "🌐 Enter your production app URL:"
echo "Example: https://coal-india-directory.vercel.app"
read -p "App URL: " APP_URL

# Generate encryption key if not exists
if [ -z "$ENCRYPTION_KEY" ]; then
    ENCRYPTION_KEY=$(openssl rand -hex 32)
    echo "🔑 Generated new encryption key: $ENCRYPTION_KEY"
fi

# Construct database URLs with connection pooling
POOLED_DB_URL="postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@${REGION}.pooler.supabase.com:6543/postgres?sslmode=require"
DIRECT_DB_URL="postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@${REGION}.pooler.supabase.com:6543/postgres"

echo "📝 Setting comprehensive Vercel environment variables..."

# Core Supabase variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "$NEXT_PUBLIC_SUPABASE_URL"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "$SUPABASE_SERVICE_ROLE_KEY"

# Database connection with pooling
vercel env add DATABASE_URL production <<< "$POOLED_DB_URL"
vercel env add DIRECT_URL production <<< "$DIRECT_DB_URL"

# Authentication & Security
vercel env add JWT_SECRET production <<< "$JWT_SECRET"
vercel env add NEXTAUTH_SECRET production <<< "$JWT_SECRET"
vercel env add ENCRYPTION_KEY production <<< "$ENCRYPTION_KEY"

# App Configuration
vercel env add NEXT_PUBLIC_APP_URL production <<< "$APP_URL"
vercel env add NEXTAUTH_URL production <<< "$APP_URL"
vercel env add NODE_ENV production <<< "production"

# App Metadata
vercel env add NEXT_PUBLIC_APP_NAME production <<< "SECL Employee Directory"
vercel env add NEXT_PUBLIC_APP_VERSION production <<< "1.0.0"

# Feature Flags
vercel env add NEXT_PUBLIC_ENABLE_MESSAGING production <<< "true"
vercel env add NEXT_PUBLIC_ENABLE_ADVANCED_SEARCH production <<< "true"
vercel env add NEXT_PUBLIC_ENABLE_EXPORT production <<< "true"

# File Upload Configuration
vercel env add NEXT_PUBLIC_MAX_FILE_SIZE production <<< "5242880"

# Push Notifications (if available)
if [ ! -z "$NEXT_PUBLIC_VAPID_PUBLIC_KEY" ]; then
    vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production <<< "$NEXT_PUBLIC_VAPID_PUBLIC_KEY"
    vercel env add VAPID_PRIVATE_KEY production <<< "$VAPID_PRIVATE_KEY"
    vercel env add VAPID_EMAIL production <<< "mailto:admin@secl.co.in"
fi

echo "✅ All production environment variables configured!"
echo ""
echo "🔄 Deploying to production with new configuration..."
vercel --prod

echo ""
echo "✨ Production setup complete!"
echo ""
echo "📊 Verification checklist:"
echo "1. Visit: $APP_URL"
echo "2. Test login flow"
echo "3. Test group creation"
echo "4. Check: $APP_URL/api/debug/env-check"
echo ""
echo "🔧 Environment includes:"
echo "  ✓ Connection pooling for database"
echo "  ✓ Comprehensive security configuration"
echo "  ✓ Feature flags enabled"
echo "  ✓ File upload limits set"
echo "  ✓ Push notifications configured"
