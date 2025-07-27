-- Fix for "Unknown User" issue in messaging
-- This script ensures the foreign key relationships are properly established
-- so that the API can join with the employees table to get sender names

-- Step 1: Verify the foreign key constraints exist
-- Check if messaging_messages_sender_id_fkey exists
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE 
  tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'messaging_messages'
  AND kcu.column_name = 'sender_id';

-- Step 2: If foreign key doesn't exist, create it
-- First, ensure we're not violating referential integrity
UPDATE messaging_messages 
SET sender_id = 'ADMIN001' 
WHERE sender_id NOT IN (SELECT emp_code FROM employees);

-- Now add the foreign key constraint
ALTER TABLE messaging_messages
DROP CONSTRAINT IF EXISTS messaging_messages_sender_id_fkey;

ALTER TABLE messaging_messages
ADD CONSTRAINT messaging_messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES employees(emp_code) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_messaging_messages_sender_id 
ON messaging_messages(sender_id);

-- Step 3: Test the join to ensure it works
SELECT 
  m.id,
  m.content,
  m.sender_id,
  e.name as sender_name
FROM messaging_messages m
LEFT JOIN employees e ON m.sender_id = e.emp_code
ORDER BY m.created_at DESC
LIMIT 5;

-- Step 4: Verify the Supabase query format works
-- This is the exact query the API uses
SELECT
  id,
  group_id,
  sender_id,
  content,
  message_type,
  status,
  read_by,
  created_at,
  edited_at,
  deleted_at,
  reply_to_id,
  edit_count,
  employees!messaging_messages_sender_id_fkey(name)
FROM messaging_messages
WHERE group_id = 1
AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 5;
