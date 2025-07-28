#!/bin/bash

# Load environment variables
source .env.local

# Execute the SQL to create push notifications table
echo "Creating push_subscriptions table..."

# Read the SQL file and execute it
SQL=$(cat src/lib/database/push-notifications-setup.sql)

# Use curl to execute the SQL via Supabase REST API
curl -X POST \
  "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"${SQL//\"/\\\"}\"}"

echo "Push notifications table setup complete!"
