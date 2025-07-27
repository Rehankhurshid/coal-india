-- Add foreign key relationship between messaging_messages and employees
-- This is needed for Supabase to properly join the tables

-- First, drop any existing constraint if it exists
ALTER TABLE messaging_messages
DROP CONSTRAINT IF EXISTS messaging_messages_sender_id_fkey;

-- Add the foreign key constraint
ALTER TABLE messaging_messages
ADD CONSTRAINT messaging_messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES employees(emp_code) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_messaging_messages_sender_id 
ON messaging_messages(sender_id);

-- Similarly for messaging_group_members
ALTER TABLE messaging_group_members
DROP CONSTRAINT IF EXISTS messaging_group_members_employee_id_fkey;

ALTER TABLE messaging_group_members
ADD CONSTRAINT messaging_group_members_employee_id_fkey 
FOREIGN KEY (employee_id) REFERENCES employees(emp_code) ON DELETE CASCADE;

-- And for messaging_groups
ALTER TABLE messaging_groups
DROP CONSTRAINT IF EXISTS messaging_groups_created_by_fkey;

ALTER TABLE messaging_groups
ADD CONSTRAINT messaging_groups_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES employees(emp_code) ON DELETE CASCADE;
