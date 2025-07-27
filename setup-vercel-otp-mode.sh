#!/bin/bash

# Script to set up OTP test mode on Vercel

echo "🔐 Setting up OTP Test Mode for Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm i -g vercel
fi

# Set environment variables
echo "📝 Setting environment variables..."

# Set DISABLE_RATE_LIMITING
vercel env add DISABLE_RATE_LIMITING production <<< "true"

# Set ENABLE_OTP_TEST_MODE
vercel env add ENABLE_OTP_TEST_MODE production <<< "true"

# Set OTP_TEST_MODE_KEY with a default secure value
vercel env add OTP_TEST_MODE_KEY production <<< "coal-india-test-2025"

echo ""
echo "✅ Environment variables set:"
echo "   - DISABLE_RATE_LIMITING=true"
echo "   - ENABLE_OTP_TEST_MODE=true"
echo "   - OTP_TEST_MODE_KEY=coal-india-test-2025"

echo ""
echo "🚀 Triggering redeployment..."
vercel --prod

echo ""
echo "✨ Setup complete!"
echo ""
echo "📋 OTP Pattern: [last 4 digits of employee ID]99"
echo "   Example: ADMIN001 → OTP: 000199"
echo ""
echo "🔍 To view OTPs:"
echo "   1. Check Vercel Function logs"
echo "   2. Use API: GET /api/auth/otp-test-mode?employeeId=ADMIN001&key=coal-india-test-2025"
echo "   3. Check browser Network tab for login response"
echo ""
echo "🔓 To clear rate limits:"
echo "   POST /api/auth/clear-rate-limit"
echo "   Body: {\"adminKey\": \"coal-india-test-2025\"}"
