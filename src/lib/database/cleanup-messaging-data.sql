-- Clean up all messaging database data
-- This script deletes all data from messaging tables while preserving the table structure
-- Run this in your Supabase SQL editor

-- Step 1: Delete all messages (has foreign keys to groups)
DELETE FROM messaging_messages;

-- Step 2: Delete all group memberships
DELETE FROM messaging_group_members;

-- Step 3: Delete all groups
DELETE FROM messaging_groups;

-- Optional: Reset sequences if you want IDs to start from 1 again
ALTER SEQUENCE messaging_messages_id_seq RESTART WITH 1;
ALTER SEQUENCE messaging_group_members_id_seq RESTART WITH 1;
ALTER SEQUENCE messaging_groups_id_seq RESTART WITH 1;

-- Verify the cleanup
SELECT 
    'messaging_messages' as table_name, 
    COUNT(*) as row_count 
FROM messaging_messages
UNION ALL
SELECT 
    'messaging_group_members' as table_name, 
    COUNT(*) as row_count 
FROM messaging_group_members
UNION ALL
SELECT 
    'messaging_groups' as table_name, 
    COUNT(*) as row_count 
FROM messaging_groups;
