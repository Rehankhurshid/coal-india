#!/bin/bash

echo "🚀 Enabling Real-time for Coal India Messaging System"
echo "================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 What this script does:${NC}"
echo "• Enables Supabase real-time for messaging tables"
echo "• messaging_messages"
echo "• messaging_groups" 
echo "• messaging_group_members"
echo ""

echo -e "${YELLOW}🔧 Manual Setup Required:${NC}"
echo "1. Go to https://app.supabase.com"
echo "2. Open your project: vwuhblcnwirskxyfqjwv"
echo "3. Navigate to Database → Replication"
echo "4. Enable real-time for the messaging tables"
echo ""

echo -e "${YELLOW}💡 Or run this SQL in Supabase SQL Editor:${NC}"
echo ""
cat << 'EOF'
-- Enable real-time for messaging tables
ALTER PUBLICATION supabase_realtime ADD TABLE messaging_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE messaging_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE messaging_group_members;

-- Verify real-time is enabled
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
EOF

echo ""
echo -e "${GREEN}✅ After enabling real-time:${NC}"
echo "• Test at: http://localhost:3001/realtime-chat-test"
echo "• Use messaging at: http://localhost:3001/messaging"
echo "• Open multiple tabs to see real-time updates!"
echo ""

echo -e "${YELLOW}🔍 Verification:${NC}"
echo "If real-time is working, you should see:"
echo "• Green 'Real-time' badge in chat headers"
echo "• Instant message delivery between tabs"
echo "• Typing indicators working"
echo ""

echo "🎉 Enjoy your real-time messaging system!"
