import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { Message, SendMessageRequest } from '@/types/messaging';
import { getAuthenticatedUser } from '@/lib/auth/server-auth';

// GET /api/messaging/groups/[id]/messages - Fetch messages for a group
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = createServerClient();
    const params = await context.params;
    const groupId = parseInt(params.id);
    
    if (isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    const employeeId = user.employeeId;
    console.log('Fetching messages for group:', groupId, 'user:', employeeId);

    // Verify user is a member of the group using the correct table name
    const { data: membership } = await supabase
      .from('messaging_group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('employee_id', employeeId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get pagination parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Fetch messages with sender information using raw SQL for proper joins
    const { data: messages, error } = await supabase.rpc('get_group_messages_with_names', {
      p_group_id: groupId,
      p_limit: limit,
      p_offset: offset
    })

    // If RPC doesn't exist, fall back to simple query and populate names manually
    if (error && error.code === '42883') {
      const { data: simpleMessages, error: simpleError } = await supabase
        .from('messaging_messages')
        .select(`
          id,
          group_id,
          sender_id,
          content,
          message_type,
          status,
          read_by,
          created_at,
          edited_at,
          deleted_at,
          reply_to_id,
          edit_count,
          message_attachments (
            id,
            file_name,
            file_type,
            file_size,
            public_url,
            uploaded_at
          )
        `)
        .eq('group_id', groupId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (simpleError) {
        console.error('Error fetching simple messages:', simpleError)
        return NextResponse.json({ 
          error: 'Failed to fetch messages',
          details: simpleError.message
        }, { status: 500 })
      }

      // Get sender names separately
      const senderIds = [...new Set(simpleMessages?.map(m => m.sender_id) || [])]
      const { data: employees } = await supabase
        .from('employees')
        .select('emp_code, name')
        .in('emp_code', senderIds)

      const employeeMap = new Map(employees?.map(e => [e.emp_code, e.name]) || [])

      // Transform messages with sender names
      const transformedMessages: Message[] = (simpleMessages || []).map((msg: any) => ({
        id: msg.id,
        groupId: msg.group_id,
        senderId: msg.sender_id,
        content: msg.content,
        messageType: msg.message_type,
        status: msg.status,
        readBy: msg.read_by || [],
        createdAt: new Date(msg.created_at),
        editedAt: msg.edited_at ? new Date(msg.edited_at) : undefined,
        deletedAt: msg.deleted_at ? new Date(msg.deleted_at) : undefined,
        senderName: employeeMap.get(msg.sender_id) || 'Unknown User',
        editCount: msg.edit_count || 0,
        replyToMessage: undefined, // Handle reply messages separately if needed
        attachments: msg.message_attachments?.map((att: any) => ({
          id: att.id,
          fileName: att.file_name,
          fileType: att.file_type,
          fileSize: att.file_size,
          url: att.public_url,
          uploadedAt: new Date(att.uploaded_at)
        })) || []
      }))

      return NextResponse.json({ messages: transformedMessages.reverse() })
    };

    if (error) {
      console.error('Error fetching messages:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        groupId,
        employeeId
      });
      return NextResponse.json({ 
        error: 'Failed to fetch messages',
        details: error.message,
        hint: error.hint
      }, { status: 500 });
    }

    // Transform messages with sender names (for RPC response)
    const transformedMessages: Message[] = (messages || []).map((msg: any) => ({
      id: msg.id,
      groupId: msg.group_id || msg.groupId,
      senderId: msg.sender_id || msg.senderId,
      content: msg.content,
      messageType: msg.message_type || msg.messageType,
      status: msg.status,
      readBy: msg.read_by || msg.readBy || [],
      createdAt: new Date(msg.created_at || msg.createdAt),
      editedAt: msg.edited_at || msg.editedAt ? new Date(msg.edited_at || msg.editedAt) : undefined,
      deletedAt: msg.deleted_at || msg.deletedAt ? new Date(msg.deleted_at || msg.deletedAt) : undefined,
      senderName: msg.sender_name || msg.senderName || 'Unknown User',
      editCount: msg.edit_count || msg.editCount || 0,
      replyToMessage: (msg.reply_to_id && msg.reply_content) ? {
        id: msg.reply_to_id,
        content: msg.reply_content,
        senderName: msg.reply_sender_name || 'Unknown User'
      } : undefined
    }));

    return NextResponse.json({ messages: transformedMessages.reverse() });

  } catch (error) {
    console.error('Unexpected error in messages API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/messaging/groups/[id]/messages - Mark messages as read
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = createServerClient();
    const params = await context.params;
    const groupId = parseInt(params.id);
    
    if (isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    const employeeId = user.employeeId;
    const { messageIds } = await request.json();

    if (!messageIds || !Array.isArray(messageIds)) {
      return NextResponse.json({ error: 'Invalid messageIds array' }, { status: 400 });
    }

    // Verify user is a member of the group
    const { data: membership } = await supabase
      .from('messaging_group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('employee_id', employeeId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // For each message, add current user to read_by array if not already there
    const updates = [];
    for (const messageId of messageIds) {
      // First get the current read_by array
      const { data: currentMessage } = await supabase
        .from('messaging_messages')
        .select('read_by')
        .eq('id', messageId)
        .eq('group_id', groupId)
        .single();

      if (currentMessage) {
        const readBy = currentMessage.read_by || [];
        if (!readBy.includes(employeeId)) {
          readBy.push(employeeId);
          updates.push(
            supabase
              .from('messaging_messages')
              .update({ read_by: readBy })
              .eq('id', messageId)
          );
        }
      }
    }

    // Execute all updates
    const results = await Promise.all(updates);
    const successCount = results.filter(result => !result.error).length;

    return NextResponse.json({ 
      success: true, 
      updatedCount: successCount 
    });

  } catch (error) {
    console.error('Unexpected error in messages PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/messaging/groups/[id]/messages - Send a new message
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = createServerClient();
    const params = await context.params;
    const groupId = parseInt(params.id);
    
    if (isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    const employeeId = user.employeeId;
    const body: SendMessageRequest = await request.json();

    if (!body.content?.trim() && (!body.attachmentIds || body.attachmentIds.length === 0)) {
      return NextResponse.json({ error: 'Message content or attachments are required' }, { status: 400 });
    }

    console.log('Sending message to group:', groupId, 'from user:', employeeId);

    // Verify user is a member of the group
    const { data: membership } = await supabase
      .from('messaging_group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('employee_id', employeeId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Insert the new message
    const { data: newMessage, error: insertError } = await supabase
      .from('messaging_messages')
      .insert({
        group_id: groupId,
        sender_id: employeeId,
        content: body.content?.trim() || '',
        message_type: body.messageType || 'text',
        reply_to_id: body.replyToId || null,
        status: 'sent'
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Error creating message:', insertError);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    // Update attachments with the message ID if provided
    let attachments = [];
    if (body.attachmentIds && body.attachmentIds.length > 0) {
      const { data: updatedAttachments, error: updateError } = await supabase
        .from('message_attachments')
        .update({ message_id: newMessage.id })
        .in('id', body.attachmentIds)
        .eq('message_id', -1) // Only update temporary attachments
        .select('*');

      if (updateError) {
        console.error('Error updating attachments:', updateError);
      } else {
        attachments = updatedAttachments || [];
      }
    }

    // Get sender name separately
    const { data: sender } = await supabase
      .from('employees')
      .select('name')
      .eq('emp_code', employeeId)
      .single();

    // Get reply message details if this is a reply
    let replyToMessage = undefined;
    if (newMessage.reply_to_id) {
      const { data: replyMsg } = await supabase
        .from('messaging_messages')
        .select(`
          id,
          content,
          sender_id
        `)
        .eq('id', newMessage.reply_to_id)
        .single();

      if (replyMsg) {
        const { data: replySender } = await supabase
          .from('employees')
          .select('name')
          .eq('emp_code', replyMsg.sender_id)
          .single();

        replyToMessage = {
          id: replyMsg.id,
          content: replyMsg.content,
          senderName: replySender?.name || 'Unknown User'
        };
      }
    }

    // Update group's updated_at timestamp and last message
    const senderFirstName = sender?.name?.split(' ')[0] || 'Unknown';
    let lastMessagePreview = '';
    if (newMessage.content) {
      lastMessagePreview = `${senderFirstName}: ${newMessage.content}`;
    } else if (attachments.length > 0) {
      lastMessagePreview = `${senderFirstName}: 📎 ${attachments.length} attachment${attachments.length > 1 ? 's' : ''}`;
    } else {
      lastMessagePreview = `${senderFirstName}: Message`;
    }
    
    await supabase
      .from('messaging_groups')
      .update({ 
        updated_at: new Date().toISOString(),
        last_message: lastMessagePreview.length > 50 ? lastMessagePreview.substring(0, 47) + '...' : lastMessagePreview,
        last_message_at: new Date().toISOString()
      })
      .eq('id', groupId);

    // Transform the message response
    const message: Message = {
      id: newMessage.id,
      groupId: newMessage.group_id,
      senderId: newMessage.sender_id,
      content: newMessage.content,
      messageType: newMessage.message_type,
      status: newMessage.status,
      readBy: newMessage.read_by || [],
      createdAt: new Date(newMessage.created_at),
      senderName: sender?.name || 'Unknown User',
      replyToMessage,
      attachments: attachments.map(att => ({
        id: att.id,
        fileName: att.file_name,
        fileType: att.file_type,
        fileSize: att.file_size,
        url: att.public_url,
        uploadedAt: new Date(att.uploaded_at)
      }))
    };

    console.log('Message sent successfully:', message.id);

    // Send push notifications to other group members
    try {
      // Get all group members except the sender
      const { data: members } = await supabase
        .from('messaging_group_members')
        .select('employee_id')
        .eq('group_id', groupId)
        .neq('employee_id', employeeId);

      if (members && members.length > 0) {
        const recipientIds = members.map(m => m.employee_id);
        
        // Get group name for the notification
        const { data: group } = await supabase
          .from('messaging_groups')
          .select('name')
          .eq('id', groupId)
          .single();

        // Send push notification via internal API call
        const notificationPayload = {
          recipientIds,
          notification: {
            title: group?.name || 'New Message',
            body: `${sender?.name || 'Someone'}: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: `group-${groupId}-msg-${message.id}`,
            url: `/messaging?group=${groupId}`,
            data: {
              groupId,
              messageId: message.id,
              senderId: employeeId
            }
          }
        };

        // Make internal API call to send push notifications
        const pushResponse = await fetch(`${request.nextUrl.origin}/api/push/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization') || ''
          },
          body: JSON.stringify(notificationPayload)
        });

        if (!pushResponse.ok) {
          console.error('Failed to send push notifications:', await pushResponse.text());
        } else {
          const result = await pushResponse.json();
          console.log('Push notifications sent:', result);
        }
      }
    } catch (pushError) {
      // Don't fail the message send if push notifications fail
      console.error('Error sending push notifications:', pushError);
    }

    return NextResponse.json({ message }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in send message API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
