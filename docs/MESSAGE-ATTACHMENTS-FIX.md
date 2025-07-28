# Message Attachments Visibility Fix

## Issue

- Attachments are uploaded successfully and stored in the database with correct URLs
- The attachment URLs are visible in the database
- However, attachments are not visible in the chat interface

## Root Cause

The RPC function `get_group_messages_with_names` used to fetch messages was not including attachments in its response.

## Solution

### 1. Update the RPC Function

Run the SQL script to create an improved RPC function that includes attachments:

```bash
# Run this SQL in your Supabase SQL editor
archive/database-scripts/create-get-messages-with-attachments-rpc.sql
```

This function:

- Fetches all message data including sender names
- Joins with the `message_attachments` table to get attachments
- Returns attachments as a JSON array
- Properly handles cases where messages have no attachments

### 2. API Route Updates

The API route has been updated to:

- Parse attachments from JSON when they come from the RPC function
- Handle both string (JSON) and array formats for attachments
- Transform attachments into the correct format for the frontend

### 3. Testing

After applying the database function:

1. Refresh the messaging page
2. Upload a file attachment
3. The attachment should now be visible in the chat
4. Both images and documents should display correctly

## Technical Details

### Database Schema

- `message_attachments` table stores attachment metadata
- `public_url` field contains the Supabase Storage URL
- Attachments are linked to messages via `message_id`

### API Flow

1. File is uploaded via `/api/messaging/upload`
2. Attachment record is created with temporary `message_id = -1`
3. When message is sent, attachment is updated with actual message ID
4. When messages are fetched, attachments are included in the response

### Frontend Components

- `MessageAttachment` component handles display
- Images show inline with preview
- Documents show with download button
- File icons indicate file type

## Debugging Tips

If attachments still don't show:

1. Check browser console for errors
2. Verify the RPC function exists in Supabase
3. Check that attachment URLs are accessible
4. Ensure CORS is properly configured in Supabase Storage
