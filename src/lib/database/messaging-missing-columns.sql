-- Add missing columns to messaging_messages table

-- Add reply_to_id for message threading
ALTER TABLE messaging_messages 
ADD COLUMN IF NOT EXISTS reply_to_id INTEGER REFERENCES messaging_messages(id) ON DELETE SET NULL;

-- Add edit_count to track message edits
ALTER TABLE messaging_messages 
ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0;

-- Create index for reply_to_id for performance
CREATE INDEX IF NOT EXISTS idx_messaging_messages_reply_to_id 
ON messaging_messages(reply_to_id);

-- Create a self-referential foreign key constraint name for consistency
ALTER TABLE messaging_messages
DROP CONSTRAINT IF EXISTS messaging_messages_reply_to_id_fkey,
ADD CONSTRAINT messaging_messages_reply_to_id_fkey 
FOREIGN KEY (reply_to_id) REFERENCES messaging_messages(id) ON DELETE SET NULL;
