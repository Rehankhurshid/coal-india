#!/bin/bash

# Vercel Environment Variables Setup Script
# This script helps you set up environment variables for Vercel deployment

echo "🔧 Setting up Vercel Environment Variables for Coal India Directory"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

echo "This script will help you set up the required environment variables for Vercel."
echo "You'll need your Supabase project details ready."
echo ""

# JWT Secret
echo "1. Setting up JWT_SECRET..."
echo "Enter a secure secret key (minimum 32 characters) for JWT tokens:"
read -s JWT_SECRET
if [ ${#JWT_SECRET} -lt 32 ]; then
    echo "❌ JWT_SECRET must be at least 32 characters long!"
    exit 1
fi
vercel env add JWT_SECRET <<< "$JWT_SECRET"

# Supabase URL
echo "2. Setting up NEXT_PUBLIC_SUPABASE_URL..."
echo "Enter your Supabase project URL (e.g., https://xxxx.supabase.co):"
read SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_URL <<< "$SUPABASE_URL"

# Supabase Anon Key
echo "3. Setting up NEXT_PUBLIC_SUPABASE_ANON_KEY..."
echo "Enter your Supabase Anonymous/Public Key:"
read -s SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY <<< "$SUPABASE_ANON_KEY"

# Supabase Service Role Key
echo "4. Setting up SUPABASE_SERVICE_ROLE_KEY..."
echo "Enter your Supabase Service Role Key:"
read -s SUPABASE_SERVICE_ROLE_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY <<< "$SUPABASE_SERVICE_ROLE_KEY"

# App URL
echo "5. Setting up NEXT_PUBLIC_APP_URL..."
echo "Enter your app's public URL (this will be your Vercel domain):"
echo "Example: https://coal-india-directory.vercel.app"
read APP_URL
vercel env add NEXT_PUBLIC_APP_URL <<< "$APP_URL"

echo ""
echo "✅ All environment variables have been set up!"
echo ""
echo "You can now deploy your application using:"
echo "  vercel --prod"
echo ""
echo "Or use the deployment script:"
echo "  ./deploy.sh"
