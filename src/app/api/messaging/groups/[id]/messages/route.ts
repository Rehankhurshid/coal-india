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
          edit_count
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
        replyToMessage: undefined // Handle reply messages separately if needed
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

    if (!body.content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
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
        content: body.content.trim(),
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

    // Update group's updated_at timestamp
    await supabase
      .from('messaging_groups')
      .update({ updated_at: new Date().toISOString() })
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
      replyToMessage
    };

    console.log('Message sent successfully:', message.id);

    return NextResponse.json({ message }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in send message API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
