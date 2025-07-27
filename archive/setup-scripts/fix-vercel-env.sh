#!/bin/bash

# Fix Vercel Environment Variables
# This script updates the production environment variables with correct values

echo "🔧 Fixing Vercel Environment Variables..."

# Set the correct Supabase Service Role Key (this was the main issue)
vercel env rm SUPABASE_SERVICE_ROLE_KEY production -y 2>/dev/null || true
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3dWhibGNud2lyc2t4eWZxand2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjUyNDMxMiwiZXhwIjoyMDY4MTAwMzEyfQ.XP24ooLUQ7-5HiIyly-01yTd77HO1dlfAK_n9dN7MeY" | vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Set the correct JWT Secret
vercel env rm JWT_SECRET production -y 2>/dev/null || true
echo "/g/GFZHETLGmz8ht6sGdy0EvqEn0TAOrRPp7KZ2Ucus=" | vercel env add JWT_SECRET production

# Set the correct VAPID keys for push notifications
vercel env rm NEXT_PUBLIC_VAPID_PUBLIC_KEY production -y 2>/dev/null || true
echo "BIV5qkkvt76rLfAoqfQLfcLZ2ONbiuehoXyw6TQjBHyjKAWjcSnJd83F0_vVqGGnvE-FpomRhBKDRy4bxeLWK84" | vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production

vercel env rm VAPID_PRIVATE_KEY production -y 2>/dev/null || true
echo "3XTw9iPdYDFGpx8Il-1gKPB1XyO0VpQwjlp7z2I4E7Q" | vercel env add VAPID_PRIVATE_KEY production

echo "✅ Critical environment variables updated!"
echo ""
echo "🚀 Now redeploy your application:"
echo "   vercel --prod"
echo ""
echo "This should fix the authentication and group creation issues."
