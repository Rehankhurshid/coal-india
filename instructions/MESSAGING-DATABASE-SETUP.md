# Messaging Database Setup Complete

This document tracks all the database changes made to support the messaging system.

## Tables Created

### 1. messaging_groups

- id (SERIAL PRIMARY KEY)
- name (VARCHAR(255) NOT NULL)
- description (TEXT)
- created_by (VARCHAR(50) NOT NULL)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

### 2. messaging_group_members

- id (SERIAL PRIMARY KEY)
- group_id (INTEGER REFERENCES messaging_groups)
- employee_id (VARCHAR(50) NOT NULL)
- role (VARCHAR(20) - 'admin' or 'member')
- joined_at (TIMESTAMPTZ)

### 3. messaging_messages

- id (SERIAL PRIMARY KEY)
- group_id (INTEGER REFERENCES messaging_groups)
- sender_id (VARCHAR(50) NOT NULL)
- content (TEXT NOT NULL)
- message_type (VARCHAR(20) - 'text', 'image', 'file')
- status (VARCHAR(20) - 'pending', 'sent')
- edited_at (TIMESTAMPTZ)
- deleted_at (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
- read_by (TEXT[] - array of employee IDs)
- reply_to_id (INTEGER REFERENCES messaging_messages)
- edit_count (INTEGER DEFAULT 0)

## RLS Policies Applied

All tables have Row Level Security enabled with appropriate policies for:

- Users can view groups they are members of
- Users can create new groups
- Admins can update groups and manage members
- Users can view and send messages in their groups
- Users can edit/delete their own messages

## Recent Updates

1. Added `read_by` column to track message read status
2. Added `reply_to_id` column for message threading
3. Added `edit_count` column to track message edits
4. Updated RLS policies to be less restrictive for group creation
5. Added appropriate indexes for performance

## Foreign Key Relationships

- messaging_messages has a foreign key to employees table (sender_id)
- messaging_messages has a self-referential foreign key for replies
- messaging_group_members references messaging_groups
- messaging_messages references messaging_groups

## Testing Steps

1. Login with employee ID (e.g., "3000")
2. Create a group through the UI
3. Send messages in the group
4. Verify messages are displayed correctly

## Troubleshooting

If you encounter errors:

1. Check authentication status at `/test-auth`
2. Verify database tables at `/api/auth/debug`
3. Test messaging tables at `/api/messaging/test-tables`
4. Check browser console for detailed error messages

## SQL Files

- `src/lib/database/messaging-tables.sql` - Initial table creation
- `src/lib/database/messaging-updates.sql` - Updates and policy changes
- `src/lib/database/messaging-missing-columns.sql` - Added missing columns
