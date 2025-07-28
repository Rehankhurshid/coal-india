import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { getAuthenticatedUser } from '@/lib/auth/server-auth';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB in bytes
const ALLOWED_FILE_TYPES = {
  // Images
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'image/bmp': ['.bmp'],
  'image/svg+xml': ['.svg'],
  
  // Documents
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  
  // Archives
  'application/zip': ['.zip'],
  'application/x-rar-compressed': ['.rar'],
  'application/x-7z-compressed': ['.7z'],
  
  // Media
  'video/mp4': ['.mp4'],
  'video/mpeg': ['.mpeg'],
  'video/quicktime': ['.mov'],
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/webm': ['.webm'],
};

function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot !== -1 ? filename.substring(lastDot) : '';
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Upload] Starting file upload request');
    
    // Get authenticated user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      console.log('[Upload] No authenticated user');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.log('[Upload] Authenticated user:', user.employeeId);

    const supabase = createServerClient();
    const formData = await request.formData();
    
    // Handle both single file ('file') and multiple files ('files')
    const singleFile = formData.get('file') as File | null;
    const multipleFiles = formData.getAll('files') as File[];
    const files = singleFile ? [singleFile] : multipleFiles;
    const groupId = formData.get('groupId') as string;

    console.log('[Upload] Form data:', {
      hasSingleFile: !!singleFile,
      multipleFilesCount: multipleFiles.length,
      totalFiles: files.length,
      groupId
    });

    if (files.length === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // Validate all files
    for (const file of files) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ 
          error: `File "${file.name}" exceeds 15MB limit`,
          maxSize: '15MB',
          fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`
        }, { status: 400 });
      }

      // Validate file type
      const fileType = file.type || 'application/octet-stream';
      const isAllowedType = Object.keys(ALLOWED_FILE_TYPES).includes(fileType);
      
      if (!isAllowedType) {
        return NextResponse.json({ 
          error: `File type "${fileType}" not allowed for "${file.name}"`,
          allowedTypes: Object.keys(ALLOWED_FILE_TYPES)
        }, { status: 400 });
      }
    }

    // Verify user is a member of the group
    const { data: membership } = await supabase
      .from('messaging_group_members')
      .select('id')
      .eq('group_id', parseInt(groupId))
      .eq('employee_id', user.employeeId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Process each file
    const uploadedAttachments = [];
    
    for (const file of files) {
      try {
        const fileType = file.type || 'application/octet-stream';
        
        // Generate unique filename
        const fileExtension = getFileExtension(file.name);
        const uniqueFilename = `${uuidv4()}${fileExtension}`;
        const filePath = `messaging/${groupId}/${uniqueFilename}`;

        // Upload file to Supabase Storage
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('message-attachments')
          .upload(filePath, buffer, {
            contentType: fileType,
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          // Clean up previously uploaded files
          for (const uploaded of uploadedAttachments) {
            await supabase.storage
              .from('message-attachments')
              .remove([uploaded.file_path]);
            await supabase
              .from('message_attachments')
              .delete()
              .eq('id', uploaded.id);
          }
          
          return NextResponse.json({ 
            error: `Failed to upload file "${file.name}"`,
            details: uploadError.message 
          }, { status: 500 });
        }

        // Get public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from('message-attachments')
          .getPublicUrl(filePath);

        // Store file metadata in database
        const { data: fileRecord, error: dbError } = await supabase
          .from('message_attachments')
          .insert({
            group_id: parseInt(groupId),
            uploaded_by: user.employeeId,
            file_name: file.name,
            file_type: fileType,
            file_size: file.size,
            file_path: filePath,
            public_url: publicUrl
          })
          .select()
          .single();

        if (dbError) {
          // If database insert fails, delete the uploaded file
          await supabase.storage
            .from('message-attachments')
            .remove([filePath]);

          console.error('Error storing file metadata:', dbError);
          
          // Clean up previously uploaded files
          for (const uploaded of uploadedAttachments) {
            await supabase.storage
              .from('message-attachments')
              .remove([uploaded.file_path]);
            await supabase
              .from('message_attachments')
              .delete()
              .eq('id', uploaded.id);
          }
          
          return NextResponse.json({ 
            error: `Failed to store metadata for "${file.name}"`,
            details: dbError.message 
          }, { status: 500 });
        }

        uploadedAttachments.push({
          id: fileRecord.id,
          fileName: file.name,
          fileType: fileType,
          fileSize: file.size,
          url: publicUrl,
          uploadedAt: fileRecord.created_at,
          file_path: filePath
        });
        
      } catch (error) {
        console.error(`Error processing file "${file.name}":`, error);
        
        // Clean up any uploaded files
        for (const uploaded of uploadedAttachments) {
          await supabase.storage
            .from('message-attachments')
            .remove([uploaded.file_path]);
          await supabase
            .from('message_attachments')
            .delete()
            .eq('id', uploaded.id);
        }
        
        return NextResponse.json({ 
          error: `Failed to process file "${file.name}"`,
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    // Return appropriate response based on single or multiple files
    if (singleFile) {
      return NextResponse.json({
        success: true,
        attachment: uploadedAttachments[0]
      }, { status: 201 });
    } else {
      return NextResponse.json({
        success: true,
        attachments: uploadedAttachments
      }, { status: 201 });
    }

  } catch (error) {
    console.error('Unexpected error in file upload:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE endpoint to remove uploaded files
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get('id');

    if (!attachmentId) {
      return NextResponse.json({ error: 'Attachment ID is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Get attachment details
    const { data: attachment, error: fetchError } = await supabase
      .from('message_attachments')
      .select('*')
      .eq('id', attachmentId)
      .single();

    if (fetchError || !attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // Verify user has permission to delete (either uploader or group admin)
    if (attachment.uploaded_by !== user.employeeId) {
      const { data: membership } = await supabase
        .from('messaging_group_members')
        .select('role')
        .eq('group_id', attachment.group_id)
        .eq('employee_id', user.employeeId)
        .single();

      if (!membership || membership.role !== 'admin') {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      }
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('message-attachments')
      .remove([attachment.file_path]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('message_attachments')
      .delete()
      .eq('id', attachmentId);

    if (dbError) {
      console.error('Error deleting file record:', dbError);
      return NextResponse.json({ 
        error: 'Failed to delete file record',
        details: dbError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Unexpected error in file deletion:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
