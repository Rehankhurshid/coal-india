-- Enable realtime for messaging_group_members table
ALTER PUBLICATION supabase_realtime ADD TABLE messaging_group_members;

-- Verify realtime is enabled
SELECT 
    schemaname,
    tablename,
    pubinsert,
    pubupdate,
    pubdelete
FROM 
    pg_publication_tables
WHERE 
    pubname = 'supabase_realtime'
    AND tablename = 'messaging_group_members';
