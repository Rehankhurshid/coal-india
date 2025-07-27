-- Enable real-time for messaging tables
-- This is required for the broadcast functionality to work

-- Enable real-time on messaging_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messaging_messages;

-- Enable real-time on messaging_groups table
ALTER PUBLICATION supabase_realtime ADD TABLE messaging_groups;

-- Enable real-time on messaging_group_members table
ALTER PUBLICATION supabase_realtime ADD TABLE messaging_group_members;

-- Verify real-time is enabled
-- You can check which tables have real-time enabled with:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
