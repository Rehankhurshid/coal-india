#!/bin/bash

# Script to set VAPID keys for push notifications in Vercel

echo "Setting up VAPID keys for push notifications in Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Error: Vercel CLI is not installed."
    echo "Please install it with: npm install -g vercel"
    exit 1
fi

# Set VAPID keys
echo "Setting VAPID keys..."

# Public key (exposed to client)
vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production <<< "BAwNl4aaOjsZLj4SlSb9kCDMDtNL9DfYmN8aGgTsejnuP6YKsZ7OiCKgn3X2-0qwH81xaz_HPe3UDVzV9nN0KUM"

# Private key (server-side only)
vercel env add VAPID_PRIVATE_KEY production <<< "qC-hMy2HmMprQTImFfwnoeg3PM46jacq5ZFA_6TWBMc"

# Email
vercel env add VAPID_EMAIL production <<< "mailto:rehan@activeset.co"

echo ""
echo "✅ VAPID keys have been set in Vercel!"
echo ""
echo "Next steps:"
echo "1. Deploy your application: vercel --prod"
echo "2. Test push notifications in production"
echo ""
echo "To verify the environment variables were set correctly:"
echo "  vercel env ls production"
echo ""
echo "Note: You may need to redeploy for changes to take effect."
