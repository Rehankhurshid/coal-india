-- Create messaging_groups table
CREATE TABLE IF NOT EXISTS messaging_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on created_by for performance
CREATE INDEX IF NOT EXISTS idx_messaging_groups_created_by ON messaging_groups(created_by);

-- Create messaging_group_members table
CREATE TABLE IF NOT EXISTS messaging_group_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES messaging_groups(id) ON DELETE CASCADE,
  employee_id VARCHAR(50) NOT NULL,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, employee_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messaging_group_members_group_id ON messaging_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_messaging_group_members_employee_id ON messaging_group_members(employee_id);

-- Create messaging_messages table
CREATE TABLE IF NOT EXISTS messaging_messages (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES messaging_groups(id) ON DELETE CASCADE,
  sender_id VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('pending', 'sent')),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messaging_messages_group_id ON messaging_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messaging_messages_created_at ON messaging_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messaging_messages_group_created ON messaging_messages(group_id, created_at DESC);

-- Enable RLS on all messaging tables
ALTER TABLE messaging_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE messaging_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messaging_messages ENABLE ROW LEVEL SECURITY;

-- Policies for messaging_groups
-- Users can view groups they are members of
CREATE POLICY "Users can view their groups" ON messaging_groups
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messaging_group_members
      WHERE group_id = messaging_groups.id
      AND employee_id = current_setting('app.current_user_id', true)
    )
  );

-- Users can create new groups
CREATE POLICY "Users can create groups" ON messaging_groups
  FOR INSERT
  WITH CHECK (created_by = current_setting('app.current_user_id', true));

-- Group admins can update groups
CREATE POLICY "Admins can update groups" ON messaging_groups
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM messaging_group_members
      WHERE group_id = messaging_groups.id
      AND employee_id = current_setting('app.current_user_id', true)
      AND role = 'admin'
    )
  );

-- Policies for messaging_group_members
-- Users can view members of their groups
CREATE POLICY "Users can view group members" ON messaging_group_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messaging_group_members mgm
      WHERE mgm.group_id = messaging_group_members.group_id
      AND mgm.employee_id = current_setting('app.current_user_id', true)
    )
  );

-- Only admins can add/remove members
CREATE POLICY "Admins can manage members" ON messaging_group_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM messaging_group_members
      WHERE group_id = messaging_group_members.group_id
      AND employee_id = current_setting('app.current_user_id', true)
      AND role = 'admin'
    )
  );

-- Policies for messaging_messages
-- Users can view messages in their groups
CREATE POLICY "Users can view group messages" ON messaging_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messaging_group_members
      WHERE group_id = messaging_messages.group_id
      AND employee_id = current_setting('app.current_user_id', true)
    )
  );

-- Users can send messages to their groups
CREATE POLICY "Users can send messages" ON messaging_messages
  FOR INSERT
  WITH CHECK (
    sender_id = current_setting('app.current_user_id', true)
    AND EXISTS (
      SELECT 1 FROM messaging_group_members
      WHERE group_id = messaging_messages.group_id
      AND employee_id = current_setting('app.current_user_id', true)
    )
  );

-- Users can edit their own messages
CREATE POLICY "Users can edit own messages" ON messaging_messages
  FOR UPDATE
  USING (
    sender_id = current_setting('app.current_user_id', true)
    AND deleted_at IS NULL
  );

-- Users can soft delete their own messages
CREATE POLICY "Users can delete own messages" ON messaging_messages
  FOR UPDATE
  USING (
    sender_id = current_setting('app.current_user_id', true)
  )
  WITH CHECK (
    sender_id = current_setting('app.current_user_id', true)
  );

-- Enable realtime for messaging tables
alter publication supabase_realtime add table messaging_groups;
alter publication supabase_realtime add table messaging_group_members;
alter publication supabase_realtime add table messaging_messages;
