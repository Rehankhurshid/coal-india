# Message Attachments Implementation

## Overview

This document describes the implementation of file attachments in the messaging system, allowing users to send images, PDFs, and other files up to 15MB along with text messages.

## Features Implemented

### 1. Database Schema

- Created `message_attachments` table to store attachment metadata
- Fields include: id, message_id, file_name, file_type, file_size, url, uploaded_at
- Foreign key relationship with messaging_messages table

### 2. File Upload API (`/api/messaging/upload`)

- Accepts multipart/form-data with file uploads
- Validates file size (max 15MB)
- Stores files in Supabase Storage bucket `message-attachments`
- Creates temporary attachment records (message_id = -1)
- Returns attachment metadata for immediate UI display

### 3. UI Components

#### Chat Input Enhancement

- Added file input with Paper Clip icon
- Shows selected files with preview
- Displays file size and allows removal before sending
- Supports multiple file selection
- Visual feedback for upload progress

#### Message Bubble Enhancement

- Displays attachments below message text
- Shows appropriate icons based on file type (image, PDF, etc.)
- Allows downloading attachments by clicking
- Responsive layout for multiple attachments

#### Message Attachment Component

- Dedicated component for rendering individual attachments
- Smart file type detection and icon display
- File size formatting (KB/MB)
- Click to download functionality

### 4. API Integration

#### Send Message API

- Updated to accept `attachmentIds` array
- Links temporary attachments to the message after creation
- Updates last message preview to show attachment count when no text

#### Get Messages API

- Returns attachments array with each message
- Includes all attachment metadata for display

### 5. Type Definitions

- Added `MessageAttachment` interface
- Updated `Message` interface to include optional attachments array
- Updated `SendMessageRequest` to include optional attachmentIds

## File Size Limits

- Maximum file size: 15MB per file
- No limit on number of attachments per message
- Supported file types: All (images, PDFs, documents, etc.)

## Security Considerations

- Files are uploaded to authenticated endpoints only
- Storage bucket has RLS policies for access control
- File URLs are served through Supabase Storage with built-in security

## Usage Flow

1. User clicks the paper clip icon in chat input
2. Selects one or more files (up to 15MB each)
3. Files are immediately uploaded to storage
4. User can add text message (optional)
5. On send, attachments are linked to the message
6. Recipients see attachments in the message bubble
7. Click attachments to download

## Technical Implementation Details

### Storage Structure

```
message-attachments/
  └── {user_id}/
      └── {timestamp}_{filename}
```

### Database Relations

```sql
message_attachments.message_id -> messaging_messages.id
```

### API Endpoints

- `POST /api/messaging/upload` - Upload files
- `POST /api/messaging/groups/[id]/messages` - Send message with attachments
- `GET /api/messaging/groups/[id]/messages` - Retrieve messages with attachments

## Future Enhancements

- Image preview in chat
- Video player for video files
- Document viewer for PDFs
- Virus scanning for uploaded files
- Compression for large images
- Thumbnail generation

## Testing

1. Test file upload with various file types
2. Test 15MB file size limit
3. Test sending message with only attachments (no text)
4. Test sending message with text and attachments
5. Test multiple file attachments
6. Test download functionality
7. Test on mobile devices
