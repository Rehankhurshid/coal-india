-- Add read_by column to track which users have read messages
ALTER TABLE messaging_messages 
ADD COLUMN IF NOT EXISTS read_by TEXT[] DEFAULT '{}';

-- Create index for read_by lookups
CREATE INDEX IF NOT EXISTS idx_messaging_messages_read_by 
ON messaging_messages USING GIN (read_by);

-- Update the policies to be less restrictive for initial creation
-- Drop existing policies
DROP POLICY IF EXISTS "Users can create groups" ON messaging_groups;
DROP POLICY IF EXISTS "Admins can manage members" ON messaging_group_members;

-- Create more permissive policies for group creation
-- Allow users to create groups without RLS context check
CREATE POLICY "Users can create groups" ON messaging_groups
  FOR INSERT
  WITH CHECK (true);

-- Allow users to add themselves as members when creating a group
CREATE POLICY "Users can add members when creating group" ON messaging_group_members
  FOR INSERT
  WITH CHECK (
    -- Allow if user is adding themselves as admin
    (employee_id = current_setting('app.current_user_id', true) AND role = 'admin')
    OR
    -- Allow if user is already an admin of the group
    EXISTS (
      SELECT 1 FROM messaging_group_members existing
      WHERE existing.group_id = messaging_group_members.group_id
      AND existing.employee_id = current_setting('app.current_user_id', true)
      AND existing.role = 'admin'
    )
  );

-- Update the admin management policy to be more specific
CREATE POLICY "Admins can update and delete members" ON messaging_group_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM messaging_group_members admin_check
      WHERE admin_check.group_id = messaging_group_members.group_id
      AND admin_check.employee_id = current_setting('app.current_user_id', true)
      AND admin_check.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete members" ON messaging_group_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM messaging_group_members admin_check
      WHERE admin_check.group_id = messaging_group_members.group_id
      AND admin_check.employee_id = current_setting('app.current_user_id', true)
      AND admin_check.role = 'admin'
    )
  );
